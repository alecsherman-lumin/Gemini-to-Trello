import React, { useState, useCallback, useEffect } from 'react';
import type { ActionItem, AutoPostResult } from './types';
import { findActionItemsFromTranscript } from './services/geminiService';
import { googleApiService } from './services/googlePickerService';
import { trelloService } from './services/trelloService';
import TranscriptInput from './components/TranscriptInput';
import ActionItemsList from './components/ActionItemsList';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorDisplay from './components/ErrorDisplay';
import GoogleCredentialsPrompt from './components/GoogleCredentialsPrompt';
import AutoPostSummary from './components/AutoPostSummary';
import TrelloConfiguration from './components/TrelloConfiguration';

const App: React.FC = () => {
  const [transcript, setTranscript] = useState<string>('');
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isImportingGmail, setIsImportingGmail] = useState<boolean>(false);
  const [isAutoPosting, setIsAutoPosting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State for Google Credentials Flow - initialize from localStorage for persistence.
  const [googleApiKey, setGoogleApiKey] = useState<string>(() => localStorage.getItem('googleApiKey') || '');
  const [googleClientId, setGoogleClientId] = useState<string>(() => localStorage.getItem('googleClientId') || '');
  const [showGooglePrompt, setShowGooglePrompt] = useState<boolean>(false);
  const [googleAction, setGoogleAction] = useState<'import' | 'scan' | 'gmail' | 'autopost' | null>(null);
  
  // State for Trello configuration and main UI view
  const [isTrelloConfigured, setIsTrelloConfigured] = useState<boolean>(() => !!localStorage.getItem('trelloListId'));
  const [view, setView] = useState<'config' | 'main'>(() => !!localStorage.getItem('trelloListId') ? 'main' : 'config');

  const [autoPostResult, setAutoPostResult] = useState<AutoPostResult | null>(null);


  useEffect(() => {
    // Check for shared content when the app loads
    const urlParams = new URLSearchParams(window.location.search);
    const sharedText = urlParams.get('text');

    if (sharedText) {
      setTranscript(sharedText);
      handleFindActionItems(sharedText);
      // Clean up the URL to prevent re-processing on reload
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleFindActionItems = useCallback(async (text: string) => {
    if (!text.trim()) {
      setError("Please paste a transcript or summary before analyzing.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setActionItems([]);

    try {
      const items = await findActionItemsFromTranscript(text);
      setActionItems(items);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "An unknown error occurred. Please check the console.");
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleGoogleImport = useCallback(async () => {
      setIsImporting(true);
      setError(null);
      try {
          const content = await googleApiService.pickDocAndGetContent();
          setTranscript(content);
          await handleFindActionItems(content);
      } catch (e) {
          if (e instanceof Error && !e.message.includes("cancelled") && !e.message.includes("No document selected")) {
              setError(`Failed to import from Google Docs: ${e.message}`);
              if (e.message.includes('Invalid') || e.message.includes('invalid') || e.message.includes('error')) {
                  setShowGooglePrompt(true);
                  setGoogleAction('import');
              }
          }
          console.error(e);
      } finally {
          setIsImporting(false);
      }
  }, [handleFindActionItems]);

  const handleScanDrive = useCallback(async () => {
    setIsScanning(true);
    setError(null);
    try {
        const content = await googleApiService.findAndLoadGeminiNotesDoc();
        setTranscript(content);
        await handleFindActionItems(content);
    } catch (e) {
        if (e instanceof Error) {
            setError(`Failed to scan Google Drive: ${e.message}`);
            if (e.message.includes('Invalid') || e.message.includes('invalid') || e.message.includes('error')) {
                setShowGooglePrompt(true);
                setGoogleAction('scan');
            }
        }
        console.error(e);
    } finally {
        setIsScanning(false);
    }
  }, [handleFindActionItems]);

   const handleGmailImport = useCallback(async () => {
    setIsImportingGmail(true);
    setError(null);
    try {
        const content = await googleApiService.findAndLoadForwardedEmail();
        setTranscript(content);
        await handleFindActionItems(content);
    } catch (e) {
        if (e instanceof Error) {
            setError(`Failed to import from Gmail: ${e.message}`);
            if (e.message.includes('Invalid') || e.message.includes('invalid') || e.message.includes('error') || e.message.includes('access was not granted')) {
                setShowGooglePrompt(true);
                setGoogleAction('gmail');
            }
        }
        console.error(e);
    } finally {
        setIsImportingGmail(false);
    }
  }, [handleFindActionItems]);

  const handleAutoPostFromGmail = useCallback(async () => {
    if (!isTrelloConfigured) {
      setError("Trello is not configured. Please set up your Trello board and list before using this feature.");
      setView('config');
      return;
    }
    const listData = localStorage.getItem('trelloList');
    if (!listData) {
      setError("Trello list configuration is missing.");
      setView('config');
      return;
    }
    const listId = JSON.parse(listData).id;

    setIsAutoPosting(true);
    setError(null);
    setAutoPostResult(null);

    const result: AutoPostResult = { posted: [], failed: [] };

    try {
      // 1. Fetch from Gmail
      const emailContent = await googleApiService.findAndLoadForwardedEmail();
      
      // 2. Analyze with Gemini
      const itemsToPost = await findActionItemsFromTranscript(emailContent);
      
      if (itemsToPost.length === 0) {
        setAutoPostResult({ posted: [], failed: [{ title: "No Action Items Found", error: "Gemini did not identify any action items in the email."}] });
        setIsAutoPosting(false);
        return;
      }
      
      // 3. Post to Trello
      for (const item of itemsToPost) {
        try {
          await trelloService.createCard(listId, item.title, item.description);
          result.posted.push(item);
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
          result.failed.push({ title: item.title, error: errorMessage });
        }
      }
      setAutoPostResult(result);

    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during the process.";
        setError(`Auto-posting failed: ${errorMessage}`);
        if (errorMessage.includes('Invalid') || errorMessage.includes('invalid') || errorMessage.includes('error') || errorMessage.includes('access was not granted')) {
            setShowGooglePrompt(true);
            setGoogleAction('autopost');
        }
    } finally {
        setIsAutoPosting(false);
    }
  }, [isTrelloConfigured]);
  
  const handleInitiateAutoPostFromGmail = useCallback(() => {
    setGoogleAction('autopost');
    if (googleApiKey && googleClientId) {
        handleAutoPostFromGmail();
    } else {
        setShowGooglePrompt(true);
    }
  }, [handleAutoPostFromGmail, googleApiKey, googleClientId]);

  const handleInitiateGoogleImport = useCallback(() => {
    setGoogleAction('import');
    if (googleApiKey && googleClientId) {
        handleGoogleImport();
    } else {
        setShowGooglePrompt(true);
    }
  }, [handleGoogleImport, googleApiKey, googleClientId]);

  const handleInitiateGoogleScan = useCallback(() => {
    setGoogleAction('scan');
     if (googleApiKey && googleClientId) {
        handleScanDrive();
    } else {
        setShowGooglePrompt(true);
    }
  }, [handleScanDrive, googleApiKey, googleClientId]);

  const handleInitiateGmailImport = useCallback(() => {
    setGoogleAction('gmail');
     if (googleApiKey && googleClientId) {
        handleGmailImport();
    } else {
        setShowGooglePrompt(true);
    }
  }, [handleGmailImport, googleApiKey, googleClientId]);

  const handleSaveGoogleCredentialsAndContinue = useCallback(async () => {
    if (!googleApiKey.trim() || !googleClientId.trim()) {
      setError("Please provide both an API Key and a Client ID.");
      return;
    }
    // Set credentials in the service, which now handles saving to localStorage
    googleApiService.setCredentials(googleApiKey, googleClientId);
    setShowGooglePrompt(false);
    
    if (googleAction === 'import') {
        await handleGoogleImport();
    } else if (googleAction === 'scan') {
        await handleScanDrive();
    } else if (googleAction === 'gmail') {
        await handleGmailImport();
    } else if (googleAction === 'autopost') {
        await handleAutoPostFromGmail();
    }
    setGoogleAction(null);
  }, [googleApiKey, googleClientId, handleGoogleImport, handleScanDrive, handleGmailImport, handleAutoPostFromGmail, googleAction]);


  const handleUpdateActionItem = useCallback((id: string, updatedTitle: string, updatedDescription: string) => {
    setActionItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, title: updatedTitle, description: updatedDescription } : item
      )
    );
  }, []);

  const handleDeleteActionItem = useCallback((id: string) => {
    setActionItems(prevItems => prevItems.filter(item => item.id !== id));
  }, []);

  const handleReset = useCallback(() => {
    setTranscript('');
    setActionItems([]);
    setError(null);
    setIsLoading(false);
    setIsImporting(false);
    setIsScanning(false);
    setIsImportingGmail(false);
    setIsAutoPosting(false);
    setAutoPostResult(null);
  }, []);
  
  const handleConfigurationComplete = (configured: boolean) => {
      setIsTrelloConfigured(configured);
      setView(configured ? 'main' : 'config');
  }

  const renderMainContent = () => {
    if (isLoading) {
      return <LoadingSpinner message="Gemini is analyzing the text and extracting action items..." />;
    }
    if (isAutoPosting) {
       return <LoadingSpinner message="Processing email: finding transcript, analyzing with Gemini, and posting cards to Trello..." />;
    }
    if (autoPostResult) {
      return <AutoPostSummary result={autoPostResult} onReset={handleReset} />;
    }
    if (actionItems.length > 0) {
      return (
        <ActionItemsList
          items={actionItems}
          onUpdate={handleUpdateActionItem}
          onDelete={handleDeleteActionItem}
          onReset={handleReset}
          isTrelloConfigured={isTrelloConfigured}
          onRequestTrelloConfigChange={() => setView('config')}
        />
      );
    }
     // When in 'main' view but no actions are active, show the input screen.
     return (
       <TranscriptInput
         onSubmit={handleFindActionItems}
         onImportFromGoogleDocs={handleInitiateGoogleImport}
         onScanDrive={handleInitiateGoogleScan}
         onImportFromGmail={handleInitiateGmailImport}
         onAutoPostFromGmail={handleInitiateAutoPostFromGmail}
         isLoading={isLoading}
         isImporting={isImporting}
         isScanning={isScanning}
         isImportingGmail={isImportingGmail}
         isAutoPosting={isAutoPosting}
         isTrelloConfigured={isTrelloConfigured}
         transcript={transcript}
         setTranscript={setTranscript}
       />
     );
  };

  return (
    <div className="min-h-screen container mx-auto px-4 py-8 flex flex-col items-center">
      <Header />
      <main className="w-full max-w-4xl mt-8">
        {error && <div className="mb-4"><ErrorDisplay message={error} /></div>}

        {showGooglePrompt && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <GoogleCredentialsPrompt
                  apiKey={googleApiKey}
                  setApiKey={setGoogleApiKey}
                  clientId={googleClientId}
                  setClientId={setGoogleClientId}
                  onConnect={handleSaveGoogleCredentialsAndContinue}
                  isLoading={isImporting || isScanning || isImportingGmail || isAutoPosting}
                  onCancel={() => { setShowGooglePrompt(false); setError(null); setGoogleAction(null); }}
              />
          </div>
        )}
        
        {view === 'config' && (
           <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Connect to Trello</h2>
              <p className="text-slate-400 mt-2 max-w-xl mx-auto">
                To get started, connect your Trello account. This will allow the app to create cards on your selected board and list.
              </p>
            </div>
            <TrelloConfiguration onConfigurationComplete={handleConfigurationComplete} />
          </div>
        )}

        {view === 'main' && (
            <div className="mt-8">
              {renderMainContent()}
            </div>
        )}
        
      </main>
    </div>
  );
};

export default App;