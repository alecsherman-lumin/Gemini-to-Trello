import React, { useState, useCallback, useEffect } from 'react';
import type { ActionItem } from './types';
import { findActionItemsFromTranscript } from './services/geminiService';
import { googleApiService } from './services/googlePickerService';
import TranscriptInput from './components/TranscriptInput';
import ActionItemsList from './components/ActionItemsList';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorDisplay from './components/ErrorDisplay';
import GoogleCredentialsPrompt from './components/GoogleCredentialsPrompt';

const App: React.FC = () => {
  const [transcript, setTranscript] = useState<string>('');
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isImportingGmail, setIsImportingGmail] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State for Google Credentials Flow - stored in-memory for the session only.
  const [googleApiKey, setGoogleApiKey] = useState<string>('');
  const [googleClientId, setGoogleClientId] = useState<string>('');
  const [showGooglePrompt, setShowGooglePrompt] = useState<boolean>(false);
  const [googleAction, setGoogleAction] = useState<'import' | 'scan' | 'gmail' | null>(null);


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
                  setGoogleApiKey('');
                  setGoogleClientId('');
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
                setGoogleApiKey('');
                setGoogleClientId('');
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
                setGoogleApiKey('');
                setGoogleClientId('');
                setShowGooglePrompt(true);
                setGoogleAction('gmail');
            }
        }
        console.error(e);
    } finally {
        setIsImportingGmail(false);
    }
  }, [handleFindActionItems]);

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
    googleApiService.setCredentials(googleApiKey, googleClientId);
    setShowGooglePrompt(false);
    
    if (googleAction === 'import') {
        await handleGoogleImport();
    } else if (googleAction === 'scan') {
        await handleScanDrive();
    } else if (googleAction === 'gmail') {
        await handleGmailImport();
    }
    setGoogleAction(null);
  }, [googleApiKey, googleClientId, handleGoogleImport, handleScanDrive, handleGmailImport, googleAction]);


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
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return <LoadingSpinner message="Gemini is analyzing the text and extracting action items..." />;
    }
    if (actionItems.length > 0) {
      return (
        <ActionItemsList
          items={actionItems}
          onUpdate={handleUpdateActionItem}
          onDelete={handleDeleteActionItem}
          onReset={handleReset}
        />
      );
    }
    return null;
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
                  isLoading={isImporting || isScanning || isImportingGmail}
                  onCancel={() => { setShowGooglePrompt(false); setError(null); setGoogleAction(null); }}
              />
          </div>
        )}

        {actionItems.length === 0 && !isLoading && (
          <TranscriptInput
            onSubmit={handleFindActionItems}
            onImportFromGoogleDocs={handleInitiateGoogleImport}
            onScanDrive={handleInitiateGoogleScan}
            onImportFromGmail={handleInitiateGmailImport}
            isLoading={isLoading}
            isImporting={isImporting}
            isScanning={isScanning}
            isImportingGmail={isImportingGmail}
            transcript={transcript}
            setTranscript={setTranscript}
          />
        )}

        <div className="mt-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;