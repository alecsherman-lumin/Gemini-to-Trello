
import React, { useState } from 'react';
import { TrelloIcon } from './icons/TrelloIcon';

interface TrelloApiKeyPromptProps {
  onConnect: (key: string, token: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
}

const TrelloApiKeyPrompt: React.FC<TrelloApiKeyPromptProps> = ({ onConnect, onCancel, isLoading, error }) => {
  const [apiKey, setApiKey] = useState('');
  const [apiToken, setApiToken] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect(apiKey, apiToken);
  };

  return (
    <div className="bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-700 max-w-2xl w-full">
      <h3 className="text-xl font-bold mb-2 text-slate-100">Connect to Trello</h3>
      <p className="text-slate-400 mb-6">
        To create cards, this app needs your Trello API Key and an authorized Token. These are stored securely in your browser and are never sent anywhere else.
      </p>

      {error && <div className="p-4 bg-red-900/50 border border-red-500/50 text-red-300 rounded-lg mb-4">{error}</div>}

      <div className="space-y-4 text-slate-300 bg-slate-900/50 p-4 rounded-lg border border-slate-700 mb-6">
        <h4 className="font-semibold text-slate-100">How to get your credentials:</h4>
        <ol className="list-decimal list-inside space-y-3 text-sm">
          <li>
            Go to the Trello Developer API Keys page: <a href="https://trello.com/app-key" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline font-medium">trello.com/app-key</a>.
          </li>
          <li>
            You will see your "Personal Key" at the top of the page. This is your <strong>API Key</strong>. Copy it.
          </li>
          <li>
            On that same page, click the link under your key that says "Token".
          </li>
          <li>
            On the next page, you'll be asked to authorize this app. Click the "Allow" button.
          </li>
          <li>
            After allowing, Trello will show you a <strong>Token</strong>. Copy it.
          </li>
          <li>
            Paste both the API Key and the Token into the fields below.
          </li>
        </ol>
      </div>
      
      <div className="bg-yellow-900/30 border border-yellow-600/50 text-yellow-300 p-4 rounded-lg mb-6 text-sm" role="alert">
        <p className="font-bold">Troubleshooting</p>
        <p className="mt-1">
          If you get an "invalid key" or "unauthorized" error after connecting, it usually means the key or token was copied incorrectly. Please double-check them. If the problem persists, try generating a new Token from the Trello developer page.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="trello-api-key" className="block text-sm font-medium text-slate-300 mb-1">
            Trello API Key
          </label>
          <input
            id="trello-api-key"
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste your Trello API Key here"
            className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
        <div>
          <label htmlFor="trello-api-token" className="block text-sm font-medium text-slate-300 mb-1">
            Trello API Token
          </label>
          <input
            id="trello-api-token"
            type="text"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder="Paste your Trello API Token here"
            className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-4 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-slate-300 font-semibold rounded-lg hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !apiKey.trim() || !apiToken.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-600"
          >
            <TrelloIcon className="w-5 h-5"/>
            {isLoading ? 'Connecting...' : 'Connect Trello'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TrelloApiKeyPrompt;
