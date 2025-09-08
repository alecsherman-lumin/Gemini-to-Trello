import React, { useState } from 'react';
import type { ActionItem, TrelloList } from '../types';
import trelloService from '../services/trelloService';
import ActionItemCard from './ActionItemCard';
import TrelloConfiguration from './TrelloConfiguration';
import TrelloApiKeyPrompt from './TrelloApiKeyPrompt';
import LoadingSpinner from './LoadingSpinner';
import ErrorDisplay from './ErrorDisplay';
import { TrelloIcon } from './icons/TrelloIcon';

interface ActionItemsListProps {
  items: ActionItem[];
  onUpdate: (id: string, title: string, description: string) => void;
  onDelete: (id: string) => void;
  onReset: () => void;
}

type TrelloStep = 'idle' | 'prompt_key' | 'configuring' | 'creating' | 'success';

const ActionItemsList: React.FC<ActionItemsListProps> = ({ items, onUpdate, onDelete, onReset }) => {
  const [step, setStep] = useState<TrelloStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [selectedList, setSelectedList] = useState<TrelloList | null>(null);
  const [creationProgress, setCreationProgress] = useState(0);
  const [trelloApiKey, setTrelloApiKey] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const handleInitiateTrelloFlow = () => {
    setError(null);
    if (trelloService.isAuthorized()) {
      setStep('configuring');
    } else {
      setStep('prompt_key');
    }
  };

  const handleConnect = async () => {
    if (!trelloApiKey.trim()) {
      setError("Please enter your Trello API key.");
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      trelloService.setApiKey(trelloApiKey);
      await trelloService.init();
      await trelloService.authorize();
      setStep('configuring');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during connection.');
      trelloService.deauthorize();
      setStep('prompt_key');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    trelloService.deauthorize();
    setTrelloApiKey('');
    setSelectedList(null);
    setStep('idle');
    setError(null);
  }

  const handleCreateCards = async () => {
    if (!selectedList) {
      setError('Please select a Trello list first.');
      return;
    }
    setStep('creating');
    setError(null);
    setCreationProgress(0);

    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await trelloService.createCard(selectedList.id, { title: item.title, description: item.description });
        setCreationProgress(i + 1);
      }
      setStep('success');
    } catch (err) {
      setError('An error occurred while creating cards in Trello. Please check your connection and permissions.');
      setStep('configuring'); // Go back to config step on error
    }
  };

  const renderTrelloActions = () => {
    switch (step) {
      case 'prompt_key':
        return (
          <TrelloApiKeyPrompt
            apiKey={trelloApiKey}
            setApiKey={setTrelloApiKey}
            onConnect={handleConnect}
            isLoading={isConnecting}
          />
        );
      case 'configuring':
        return <TrelloConfiguration onListSelected={setSelectedList} onDisconnect={handleDisconnect} />;
      default:
        return null;
    }
  };

  if (isConnecting && step === 'idle') {
    return <LoadingSpinner message="Checking Trello connection..." />;
  }

  if (step === 'creating') {
    return <LoadingSpinner message={`Creating cards... (${creationProgress}/${items.length})`} />;
  }

  if (step === 'success') {
    return (
      <div className="text-center bg-slate-800/50 p-8 rounded-xl shadow-lg border border-green-500/50">
        <h2 className="text-2xl font-bold text-green-400">Success!</h2>
        <p className="mt-2 text-slate-300">{items.length} Trello cards have been created in the "{selectedList?.name}" list.</p>
        <button
          onClick={onReset}
          className="mt-6 px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
        >
          Analyze Another Transcript
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Review Action Items</h2>
        <p className="text-slate-400 mt-1">Edit the details below before creating your Trello cards.</p>
      </div>
      <div className="space-y-4">
        {items.map((item) => (
          <ActionItemCard key={item.id} item={item} onUpdate={onUpdate} onDelete={onDelete} />
        ))}
      </div>
      
      <div className="mt-6 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
        {error && <div className="mb-4"><ErrorDisplay message={error} /></div>}
        {renderTrelloActions()}
      </div>

      <div className="pt-4 flex justify-between items-center">
        <button
          onClick={onReset}
          className="px-6 py-3 text-slate-400 font-semibold rounded-lg hover:bg-slate-800 transition-colors"
        >
          Start Over
        </button>
        {step === 'idle' && (
          <button
            onClick={handleInitiateTrelloFlow}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all transform hover:scale-105"
          >
            <TrelloIcon className="w-5 h-5" />
            Create Cards in Trello
          </button>
        )}
        {step === 'configuring' && (
          <button
            onClick={handleCreateCards}
            disabled={!selectedList || items.length === 0}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all transform hover:scale-105"
          >
            <TrelloIcon className="w-5 h-5" />
            Create {items.length} Cards in "{selectedList?.name}"
          </button>
        )}
      </div>
    </div>
  );
};

export default ActionItemsList;
