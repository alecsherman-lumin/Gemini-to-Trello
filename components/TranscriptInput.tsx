import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { GoogleDocsIcon } from './icons/GoogleDocsIcon';
import { ScanIcon } from './icons/ScanIcon';
import { GmailIcon } from './icons/GmailIcon';

interface TranscriptInputProps {
  onSubmit: (transcript: string) => void;
  onImportFromGoogleDocs: () => void;
  onScanDrive: () => void;
  onImportFromGmail: () => void;
  isLoading: boolean;
  isImporting: boolean;
  isScanning: boolean;
  isImportingGmail: boolean;
  transcript: string;
  setTranscript: (value: string) => void;
}

const TranscriptInput: React.FC<TranscriptInputProps> = ({ 
    onSubmit, 
    onImportFromGoogleDocs, 
    onScanDrive,
    onImportFromGmail,
    isLoading, 
    isImporting, 
    isScanning,
    isImportingGmail,
    transcript, 
    setTranscript 
}) => {
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(transcript);
  };

  const isAnyGoogleActionLoading = isImporting || isScanning || isImportingGmail;

  return (
    <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700">
      <form onSubmit={handleSubmit}>
        <label htmlFor="transcript" className="block text-lg font-medium text-slate-300 mb-2">
          Paste your Google Meet transcript or summary
        </label>
        <textarea
          id="transcript"
          rows={12}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          className="w-full p-4 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors placeholder-slate-500"
          placeholder="e.g., 'Alex to follow up on the Q3 budget report by Friday...'"
          disabled={isLoading || isAnyGoogleActionLoading}
        />
         <div className="mt-2 text-sm text-slate-400">
            <strong>Pro Tip:</strong> Skip copy-pasting by using one of the import options below.
        </div>
        <div className="mt-4 flex flex-col sm:flex-row justify-end items-center gap-4">
          <button
            type="button"
            onClick={onImportFromGmail}
            disabled={isLoading || isAnyGoogleActionLoading}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 disabled:bg-slate-500 disabled:cursor-not-allowed transition-all duration-300"
            title="Finds the newest unread email with the subject 'Notes by Gemini'"
          >
            <GmailIcon className="w-5 h-5" />
            {isImportingGmail ? 'Importing...' : 'Import from Gmail'}
          </button>
           <button
            type="button"
            onClick={onScanDrive}
            disabled={isLoading || isAnyGoogleActionLoading}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 disabled:bg-slate-500 disabled:cursor-not-allowed transition-all duration-300"
          >
            <ScanIcon className="w-5 h-5" />
            {isScanning ? 'Scanning...' : 'Scan for Notes'}
          </button>
           <button
            type="button"
            onClick={onImportFromGoogleDocs}
            disabled={isLoading || isAnyGoogleActionLoading}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 disabled:bg-slate-500 disabled:cursor-not-allowed transition-all duration-300"
          >
            <GoogleDocsIcon className="w-5 h-5" />
            {isImporting ? 'Importing...' : 'Import from Docs'}
          </button>
          <button
            type="submit"
            disabled={isLoading || isAnyGoogleActionLoading || !transcript.trim()}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-[#98c6c3] text-white font-semibold rounded-lg shadow-md hover:bg-[#82b3b0] disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100"
          >
            <SparklesIcon className="w-5 h-5" />
            {isLoading ? 'Analyzing...' : 'Find Action Items'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TranscriptInput;