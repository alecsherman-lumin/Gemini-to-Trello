
import React from 'react';
import type { ActionItem } from '../types';
import { MailIcon } from './icons/MailIcon';
import { CheckIcon } from './icons/CheckIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface ActionItemCardProps {
  item: ActionItem;
  onUpdate: (id: string, title: string, description: string) => void;
  onDelete: (id: string) => void;
  isEmailConfigured: boolean;
  onPost: (item: ActionItem) => void;
  isPosted: boolean;
  isPosting: boolean;
}

const ActionItemCard: React.FC<ActionItemCardProps> = ({ item, onUpdate, onDelete, isEmailConfigured, onPost, isPosted, isPosting }) => {
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(item.id, e.target.value, item.description);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(item.id, item.title, e.target.value);
  };
  
  return (
    <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 shadow-md transition-all hover:border-purple-500/50 flex flex-col sm:flex-row gap-4">
      <div className="flex-grow">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-grow">
              <label htmlFor={`title-${item.id}`} className="sr-only">Card Title</label>
              <input
              id={`title-${item.id}`}
              type="text"
              value={item.title}
              onChange={handleTitleChange}
              className="w-full bg-transparent text-lg font-semibold text-white focus:outline-none"
              />
          </div>
          <button onClick={() => onDelete(item.id)} className="ml-4 text-slate-500 hover:text-red-500 transition-colors flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        
        <div>
          <label htmlFor={`description-${item.id}`} className="sr-only">Card Description</label>
          <textarea
            id={`description-${item.id}`}
            value={item.description}
            onChange={handleDescriptionChange}
            rows={3}
            className="w-full bg-slate-800 text-slate-300 resize-y focus:outline-none"
          />
        </div>
      </div>
      
      {isEmailConfigured && (
        <div className="flex-shrink-0 sm:border-l sm:border-slate-700 sm:pl-4 flex items-center justify-end sm:justify-center">
           {isPosted ? (
             <button
                disabled
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-green-600/80 text-white font-semibold rounded-lg cursor-default"
              >
                <CheckIcon className="w-5 h-5" />
                Posted
              </button>
           ) : isPosting ? (
             <button
                disabled
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-blue-600/50 text-white font-semibold rounded-lg cursor-wait"
              >
                <SpinnerIcon className="w-5 h-5" />
                Posting...
              </button>
           ) : (
             <button
                onClick={() => onPost(item)}
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                title="Send an email directly to your Trello board"
              >
                <MailIcon className="w-5 h-5" />
                Post to Trello
              </button>
           )}
        </div>
      )}
    </div>
  );
};

export default ActionItemCard;