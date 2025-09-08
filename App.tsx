import React, { useState, useCallback, useEffect } from 'react';
import type { ActionItem } from './types';
import { findActionItemsFromTranscript } from './services/geminiService';
import TranscriptInput from './components/TranscriptInput';
import ActionItemsList from './components/ActionItemsList';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorDisplay from './components/ErrorDisplay';

const App: React.FC = () => {
  const [transcript, setTranscript] = useState<string>('');
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return <LoadingSpinner message="Gemini is analyzing the text and extracting action items..." />;
    }
    if (error) {
      return <ErrorDisplay message={error} />;
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
        {actionItems.length === 0 && !isLoading && (
          <TranscriptInput
            onSubmit={handleFindActionItems}
            isLoading={isLoading}
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