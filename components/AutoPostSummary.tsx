import React from 'react';
import type { AutoPostResult } from '../types';
import { CheckIcon } from './icons/CheckIcon';
import { MailIcon } from './icons/MailIcon';

interface AutoPostSummaryProps {
  result: AutoPostResult;
  onReset: () => void;
}

const AutoPostSummary: React.FC<AutoPostSummaryProps> = ({ result, onReset }) => {
  const { posted, failed } = result;
  const totalAttempted = posted.length + failed.length;
  
  const getSummaryMessage = () => {
      if (posted.length > 0 && failed.length === 0) {
          return `Successfully created all ${posted.length} Trello cards!`;
      }
      if (posted.length > 0 && failed.length > 0) {
          return `Process complete. Created ${posted.length} of ${totalAttempted} cards.`;
      }
      if (posted.length === 0 && failed.length > 0) {
           return `Could not create any Trello cards from the email.`;
      }
      return "Processing complete. No action items were found to post.";
  }

  return (
    <div className="bg-slate-800/50 p-8 rounded-xl shadow-lg border border-slate-700 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Automated Posting Complete</h2>
        <p className="text-slate-300 mt-2 text-lg">{getSummaryMessage()}</p>
      </div>

      {posted.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-green-400 mb-3">Successfully Created Cards ({posted.length})</h3>
          <ul className="space-y-2 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
            {posted.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <span className="text-slate-300">{item.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {failed.length > 0 && (
         <div>
          <h3 className="text-xl font-semibold text-red-400 mb-3">Failed Items ({failed.length})</h3>
          <ul className="space-y-3 bg-red-900/20 p-4 rounded-lg border border-red-500/30">
            {failed.map((item, index) => (
              <li key={index} className="text-slate-300">
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-red-300/80 pl-2 border-l-2 border-red-500/50 ml-1 mt-1">
                  <strong>Error:</strong> {item.error}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="pt-4 flex justify-center">
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-3 px-6 py-3 bg-purple-600 text-white font-bold rounded-lg shadow-md hover:bg-purple-700 transition-colors"
        >
          <MailIcon className="w-5 h-5" />
          Process Another Email
        </button>
      </div>
    </div>
  );
};

export default AutoPostSummary;
