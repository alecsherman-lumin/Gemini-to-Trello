import React from 'react';
import { TrelloIcon } from './icons/TrelloIcon';

interface TrelloApiKeyPromptProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  onConnect: () => void;
  isLoading: boolean;
}

const TrelloApiKeyPrompt: React.FC<TrelloApiKeyPromptProps> = ({ apiKey, setApiKey, onConnect, isLoading }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect();
  };
    
  return (
    <div className="text-center">
      <h3 className="text-xl font-bold mb-2 text-slate-100">Connect to Trello</h3>
      <p className="text-slate-400 mb-4">
        To create cards, first provide your Trello API key.
        <a href="https://trello.com/app-key" target="_blank" rel="noopener noreferrer" className="ml-1 text-purple-400 hover:underline">
            Get your key here
        </a>.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-center">
        <label htmlFor="trello-api-key" className="sr-only">Trello API Key</label>
        <input
          id="trello-api-key"
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your Trello API Key"
          className="w-full max-w-sm p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors placeholder-slate-500"
          disabled={isLoading}
          aria-required="true"
        />
        <button
          type="submit"
          disabled={isLoading || !apiKey.trim()}
          className="flex items-center justify-center gap-2 w-full max-w-sm px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all"
        >
          <TrelloIcon className="w-5 h-5" />
          {isLoading ? 'Connecting...' : 'Save & Connect to Trello'}
        </button>
      </form>
    </div>
  );
};

export default TrelloApiKeyPrompt;
