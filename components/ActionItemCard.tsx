
import React from 'react';
import type { ActionItem } from '../types';

interface ActionItemCardProps {
  item: ActionItem;
  onUpdate: (id: string, title: string, description: string) => void;
  onDelete: (id: string) => void;
}

const ActionItemCard: React.FC<ActionItemCardProps> = ({ item, onUpdate, onDelete }) => {
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(item.id, e.target.value, item.description);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(item.id, item.title, e.target.value);
  };
  
  return (
    <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 shadow-md transition-all hover:border-purple-500/50">
      <div className="flex justify-between items-start">
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
        <button onClick={() => onDelete(item.id)} className="ml-4 text-slate-500 hover:text-red-500 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      
      <div className="mt-3">
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
  );
};

export default ActionItemCard;
