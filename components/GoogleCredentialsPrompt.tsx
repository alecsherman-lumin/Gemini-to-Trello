
import React, { useState, useEffect } from 'react';
import { GoogleDocsIcon } from './icons/GoogleDocsIcon';

interface GoogleCredentialsPromptProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  clientId: string;
  setClientId: (id: string) => void;
  onConnect: () => void;
  isLoading: boolean;
  onCancel: () => void;
}

const GoogleCredentialsPrompt: React.FC<GoogleCredentialsPromptProps> = ({
  apiKey,
  setApiKey,
  clientId,
  setClientId,
  onConnect,
  isLoading,
  onCancel,
}) => {
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    // Set origin on mount to ensure it's executed client-side.
    setOrigin(window.location.origin);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect();
  };

  return (
    <div className="bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-700 max-w-2xl w-full">
      <h3 className="text-xl font-bold mb-2 text-slate-100">Google Credentials Setup</h3>
      <p className="text-slate-400 mb-6">
        This app runs in your browser and requires your own Google credentials to securely access your files from Google Drive or find forwarded transcripts in Gmail. They are not stored or shared.
      </p>

      <div className="space-y-4 text-slate-300 bg-slate-900/50 p-4 rounded-lg border border-slate-700 mb-6">
        <h4 className="font-semibold text-slate-100">Instructions:</h4>
        <ol className="list-decimal list-inside space-y-3 text-sm">
          <li>
            Open the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline font-medium">Google Cloud Credentials page</a>.
          </li>
          <li>
            <strong>For the API Key:</strong> Click <code className="bg-slate-700 text-xs px-1 py-0.5 rounded">+ CREATE CREDENTIALS</code>, select <code className="bg-slate-700 text-xs px-1 py-0.5 rounded">API key</code>, and copy/paste it below.
          </li>
          <li>
            <strong>For the Client ID:</strong> Click <code className="bg-slate-700 text-xs px-1 py-0.5 rounded">+ CREATE CREDENTIALS</code> again, select <code className="bg-slate-700 text-xs px-1 py-0.5 rounded">OAuth client ID</code>.
            <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
              <li>Set Application type to <code className="bg-slate-700 text-xs px-1 py-0.5 rounded">Web application</code>.</li>
              <li>Under <code className="bg-slate-700 text-xs px-1 py-0.5 rounded">Authorized JavaScript origins</code>, click <code className="bg-slate-700 text-xs px-1 py-0.5 rounded">+ ADD URI</code>.</li>
              <li>
                You <strong>must</strong> add the following URL. It needs to be an exact match. Click the box to copy it:
                <div className="mt-1">
                  <input
                    type="text"
                    value={origin}
                    readOnly
                    className="w-full p-1.5 text-xs bg-slate-800 border border-slate-600 rounded-md cursor-pointer font-mono"
                    onClick={(e) => {
                        const target = e.target as HTMLInputElement;
                        target.select();
                        navigator.clipboard.writeText(target.value);
                    }}
                    aria-label="Your application origin URL"
                    title="Click to copy"
                  />
                </div>
              </li>
              <li>Click <code className="bg-slate-700 text-xs px-1 py-0.5 rounded">Create</code>, and then copy/paste the Client ID below.</li>
            </ul>
          </li>
           <li>
            You may also need to enable the <a href="https://console.cloud.google.com/apis/library/gmail.googleapis.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline font-medium">Gmail API</a> and <a href="https://console.cloud.google.com/apis/library/drive.googleapis.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline font-medium">Google Drive API</a> for your project.
          </li>
           <li>This app will request permission to read your Drive/Gmail files to find transcripts.</li>
        </ol>
      </div>

      <div className="bg-yellow-900/30 border border-yellow-600/50 text-yellow-300 p-4 rounded-lg mb-6 text-sm" role="alert">
        <p className="font-bold">Troubleshooting: `Error 400: redirect_uri_mismatch`</p>
        <p className="mt-1">
          This common error means the "Authorized JavaScript origin" in your Google Cloud project does not exactly match this app's URL. Please ensure you have correctly added the origin URL shown in step 3 above.
        </p>
      </div>


      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="google-api-key" className="block text-sm font-medium text-slate-300 mb-1">
            Google API Key
          </label>
          <input
            id="google-api-key"
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste your Google API Key here"
            className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors placeholder-slate-500"
            disabled={isLoading}
            required
            aria-required="true"
          />
        </div>
        <div>
          <label htmlFor="google-client-id" className="block text-sm font-medium text-slate-300 mb-1">
            Google OAuth 2.0 Client ID
          </label>
          <input
            id="google-client-id"
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="Paste your Google Client ID here"
            className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors placeholder-slate-500"
            disabled={isLoading}
            required
            aria-required="true"
          />
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-4 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-slate-300 font-semibold rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !apiKey.trim() || !clientId.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all"
          >
            <GoogleDocsIcon className="w-5 h-5" />
            {isLoading ? 'Connecting...' : 'Save & Continue'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GoogleCredentialsPrompt;
