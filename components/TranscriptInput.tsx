import React, { useState } from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { GoogleDocsIcon } from './icons/GoogleDocsIcon';
import { ScanIcon } from './icons/ScanIcon';
import { GmailIcon } from './icons/GmailIcon';
import { MailIcon } from './icons/MailIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface TranscriptInputProps {
  onSubmit: (transcript: string) => void;
  onImportFromGoogleDocs: () => void;
  onScanDrive: () => void;
  onImportFromGmail: () => void;
  onAutoPostFromGmail: () => void;
  isLoading: boolean;
  isImporting: boolean;
  isScanning: boolean;
  isImportingGmail: boolean;
  isAutoPosting: boolean;
  isTrelloConfigured: boolean;
  transcript: string;
  setTranscript: (value: string) => void;
}

const TranscriptInput: React.FC<TranscriptInputProps> = ({ 
    onSubmit, 
    onImportFromGoogleDocs, 
    onScanDrive,
    onImportFromGmail,
    onAutoPostFromGmail,
    isLoading, 
    isImporting, 
    isScanning,
    isImportingGmail,
    isAutoPosting,
    isTrelloConfigured,
    transcript, 
    setTranscript 
}) => {
  const [showManualInput, setShowManualInput] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(transcript);
  };

  const isAnyActionLoading = isLoading || isImporting || isScanning || isImportingGmail || isAutoPosting;

  return (
    <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700">
      
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-100 mb-2">Automated Workflow</h2>
        <p className="text-slate-400 mb-4">
          Forward your meeting notes to your Gmail, then click the button below to automatically create Trello cards.
        </p>

        <button
          type="button"
          onClick={onAutoPostFromGmail}
          disabled={isAnyActionLoading || !isTrelloConfigured}
          className="w-full max-w-md mx-auto flex items-center justify-center gap-3 px-6 py-4 bg-purple-600 text-white font-bold rounded-lg shadow-lg hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100"
          title={isTrelloConfigured ? "Finds the newest unread email from gemini-notes@google.com and posts all action items to Trello." : "You must configure Trello first."}
        >
          {isAutoPosting ? <SpinnerIcon className="w-6 h-6" /> : <MailIcon className="w-6 h-6" />}
          {isAutoPosting ? 'Processing Your Email...' : 'Process Latest Email'}
        </button>
      </div>

      <div className="my-6 border-t border-slate-700"></div>

      <details className="group">
        <summary 
          className="cursor-pointer text-center text-slate-400 hover:text-white"
          onClick={(e) => {
            e.preventDefault();
            setShowManualInput(!showManualInput);
          }}
        >
          {showManualInput ? 'Hide Manual Options' : 'Show Manual Options'}
        </summary>
        
        <div className={`mt-4 ${showManualInput ? 'animate-[fadeIn_0.5s_ease-in-out]' : 'hidden'}`}>
          <form onSubmit={handleSubmit}>
            <label htmlFor="transcript" className="block text-lg font-medium text-slate-300 mb-2">
              Paste your transcript or import a file
            </label>
            <textarea
              id="transcript"
              rows={10}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full p-4 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors placeholder-slate-500"
              placeholder="e.g., 'Alex to follow up on the Q3 budget report by Friday...'"
              disabled={isAnyActionLoading}
            />
            <div className="mt-4 flex flex-col sm:flex-row justify-end items-center gap-4">
              <button
                type="button"
                onClick={onImportFromGmail}
                disabled={isAnyActionLoading}
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 disabled:bg-slate-500 disabled:cursor-not-allowed transition-all duration-300"
                title="Finds the newest unread email from gemini-notes@google.com"
              >
                <GmailIcon className="w-5 h-5" />
                {isImportingGmail ? 'Importing...' : 'Import from Gmail'}
              </button>
              <button
                type="button"
                onClick={onScanDrive}
                disabled={isAnyActionLoading}
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 disabled:bg-slate-500 disabled:cursor-not-allowed transition-all duration-300"
              >
                <ScanIcon className="w-5 h-5" />
                {isScanning ? 'Scanning...' : 'Scan for Notes'}
              </button>
              <button
                type="button"
                onClick={onImportFromGoogleDocs}
                disabled={isAnyActionLoading}
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 disabled:bg-slate-500 disabled:cursor-not-allowed transition-all duration-300"
              >
                <GoogleDocsIcon className="w-5 h-5" />
                {isImporting ? 'Importing...' : 'Import from Docs'}
              </button>
              <button
                type="submit"
                disabled={isAnyActionLoading || !transcript.trim()}
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-[#98c6c3] text-white font-semibold rounded-lg shadow-md hover:bg-[#82b3b0] disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100"
              >
                <SparklesIcon className="w-5 h-5" />
                {isLoading ? 'Analyzing...' : 'Find Action Items'}
              </button>
            </div>
          </form>
        </div>
      </details>
    </div>
  );
};

export default TranscriptInput;