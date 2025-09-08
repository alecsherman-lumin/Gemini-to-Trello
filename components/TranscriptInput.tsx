
import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';

interface TranscriptInputProps {
  onSubmit: (transcript: string) => void;
  isLoading: boolean;
  transcript: string;
  setTranscript: (value: string) => void;
}

const TranscriptInput: React.FC<TranscriptInputProps> = ({ onSubmit, isLoading, transcript, setTranscript }) => {
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(transcript);
  };

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
          disabled={isLoading}
        />
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !transcript.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100"
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
