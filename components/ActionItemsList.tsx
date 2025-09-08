
import React, { useState } from 'react';
import type { ActionItem } from '../types';
import ActionItemCard from './ActionItemCard';
import ErrorDisplay from './ErrorDisplay';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { trelloService } from '../services/trelloService';
import { TrelloIcon } from './icons/TrelloIcon';

interface ActionItemsListProps {
  items: ActionItem[];
  onUpdate: (id: string, title: string, description: string) => void;
  onDelete: (id: string) => void;
  onReset: () => void;
  isTrelloConfigured: boolean;
  onRequestTrelloConfigChange: () => void;
}

const ActionItemsList: React.FC<ActionItemsListProps> = ({ items, onUpdate, onDelete, onReset, isTrelloConfigured, onRequestTrelloConfigChange }) => {
  const [error, setError] = useState<string | null>(null);
  const [postedCardIds, setPostedCardIds] = useState<Set<string>>(new Set());
  const [isPostingIds, setIsPostingIds] = useState<Set<string>>(new Set());
  const [isPostingAll, setIsPostingAll] = useState<boolean>(false);

  // Safely get and parse Trello board/list info from localStorage for display
  const getTrelloTargetInfo = () => {
    const boardData = localStorage.getItem('trelloBoard');
    const listData = localStorage.getItem('trelloList');
    try {
      const boardName = boardData ? JSON.parse(boardData).name : '';
      const listName = listData ? JSON.parse(listData).name : '';
      return { boardName, listName };
    } catch (e) {
      console.error("Failed to parse Trello info from localStorage", e);
      return { boardName: '', listName: '' };
    }
  };
  const { boardName, listName } = getTrelloTargetInfo();

  const handlePostToTrello = async (item: ActionItem) => {
    const listData = localStorage.getItem('trelloList');
    if (!listData) {
      setError("Trello list is not configured. Please check your settings.");
      return;
    }
    const listId = JSON.parse(listData).id;
    if (postedCardIds.has(item.id) || isPostingIds.has(item.id)) return;

    setError(null);
    setIsPostingIds(prev => new Set(prev).add(item.id));

    try {
        await trelloService.createCard(listId, item.title, item.description);
        setPostedCardIds(prev => new Set(prev).add(item.id));
    } catch (e) {
        if (e instanceof Error) {
            setError(`Failed to create Trello card: ${e.message}. Please check your API credentials and board/list configuration.`);
        } else {
            setError("An unknown error occurred while creating the Trello card.");
        }
    } finally {
        setIsPostingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(item.id);
            return newSet;
        });
    }
  };
  
  const handlePostAll = async () => {
    const listData = localStorage.getItem('trelloList');
     if (!listData) {
      setError("Trello list is not configured. Please check your settings.");
      return;
    }
    const listId = JSON.parse(listData).id;

    const itemsToPost = items.filter(item => !postedCardIds.has(item.id));
    if (itemsToPost.length === 0) return;

    setIsPostingAll(true);
    setError(null);
    const failedPosts: { title: string; error: string }[] = [];
    let postedCount = 0;

    for (const item of itemsToPost) {
      setIsPostingIds(prev => new Set(prev).add(item.id));
      try {
        await trelloService.createCard(listId, item.title, item.description);
        setPostedCardIds(prev => new Set(prev).add(item.id));
        postedCount++;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        failedPosts.push({ title: item.title, error: errorMessage });
      } finally {
        setIsPostingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(item.id);
          return newSet;
        });
      }
    }

    setIsPostingAll(false);

    if (failedPosts.length > 0) {
      const errorSummary = failedPosts
        .map(fail => `- "${fail.title}": ${fail.error}`)
        .join('\n');
      setError(`Some cards failed to post:\n${errorSummary}\n\nPlease check your Trello connection and try again.`);
    }
  };

  const remainingItemsCount = items.filter(i => !postedCardIds.has(i.id)).length;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Review Action Items</h2>
        <p className="text-slate-400 mt-1">Edit the details below before creating your Trello cards.</p>
      </div>
      <div className="space-y-4">
        {items.map((item) => (
          <ActionItemCard 
            key={item.id} 
            item={item} 
            onUpdate={onUpdate} 
            onDelete={onDelete}
            isTrelloConfigured={isTrelloConfigured}
            onPost={handlePostToTrello}
            isPosted={postedCardIds.has(item.id)}
            isPosting={isPostingIds.has(item.id)}
          />
        ))}
      </div>
      
      <div className="mt-6 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-slate-100">Trello Integration</h3>
             {isTrelloConfigured && (
              <button onClick={onRequestTrelloConfigChange} className="text-sm text-slate-400 hover:text-white hover:underline">
                Change Settings
              </button>
            )}
        </div>
        
        {error && <div className="mb-4"><ErrorDisplay message={error} /></div>}
        
        {isTrelloConfigured ? (
            <div className="space-y-4">
                <p className="text-sm text-slate-300">
                    Posting cards to: <span className="font-mono text-purple-400">{boardName} / {listName}</span>
                </p>
                <button
                    onClick={handlePostAll}
                    disabled={isPostingAll || remainingItemsCount === 0}
                    className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300"
                >
                    {isPostingAll ? (
                        <SpinnerIcon className="w-5 h-5" />
                    ) : (
                        <TrelloIcon className="w-5 h-5" />
                    )}
                    {isPostingAll 
                        ? `Posting... (${items.length - remainingItemsCount} of ${items.length} posted)` 
                        : `Post All Remaining Cards (${remainingItemsCount})`
                    }
                </button>
            </div>
        ) : (
            <div className="text-center">
                <p className="text-slate-300 mb-4">You need to configure Trello to post these cards.</p>
                <button
                    onClick={onRequestTrelloConfigChange}
                    className="flex items-center justify-center gap-2 w-full max-w-xs mx-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"
                >
                    <TrelloIcon className="w-5 h-5" />
                    Configure Trello Now
                </button>
            </div>
        )}
      </div>

      <div className="pt-4 flex justify-between items-center">
        <button
          onClick={onReset}
          className="px-6 py-3 text-slate-400 font-semibold rounded-lg hover:bg-slate-800 transition-colors"
        >
          Start Over
        </button>
      </div>
    </div>
  );
};

export default ActionItemsList;