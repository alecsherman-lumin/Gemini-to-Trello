import React, { useState, useEffect } from 'react';
import type { ActionItem } from '../types';
import ActionItemCard from './ActionItemCard';
import ErrorDisplay from './ErrorDisplay';
import { MailIcon } from './icons/MailIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { googleApiService } from '../services/googlePickerService';

interface ActionItemsListProps {
  items: ActionItem[];
  onUpdate: (id: string, title: string, description: string) => void;
  onDelete: (id: string) => void;
  onReset: () => void;
}

const ActionItemsList: React.FC<ActionItemsListProps> = ({ items, onUpdate, onDelete, onReset }) => {
  const [error, setError] = useState<string | null>(null);
  const [trelloEmail, setTrelloEmail] = useState<string>('');
  const [tempTrelloEmail, setTempTrelloEmail] = useState<string>('');
  const [isEmailConfigVisible, setIsEmailConfigVisible] = useState<boolean>(false);
  const [postedCardIds, setPostedCardIds] = useState<Set<string>>(new Set());
  const [isPostingIds, setIsPostingIds] = useState<Set<string>>(new Set());
  const [isPostingAll, setIsPostingAll] = useState<boolean>(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('trelloBoardEmail');
    if (savedEmail) {
      setTrelloEmail(savedEmail);
      setTempTrelloEmail(savedEmail);
    }
  }, []);

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempTrelloEmail.trim() || !tempTrelloEmail.includes('@')) {
        setError('Please enter a valid email address.');
        return;
    }
    setError(null);
    setTrelloEmail(tempTrelloEmail);
    localStorage.setItem('trelloBoardEmail', tempTrelloEmail);
    setIsEmailConfigVisible(false);
  };

  const handlePostToTrello = async (item: ActionItem) => {
    if (!trelloEmail) {
      setError("Please configure your Trello board's email address first.");
      return;
    }
    if (postedCardIds.has(item.id) || isPostingIds.has(item.id)) return;

    setError(null);
    setIsPostingIds(prev => new Set(prev).add(item.id));

    try {
        await googleApiService.sendEmail(trelloEmail, item.title, item.description);
        setPostedCardIds(prev => new Set(prev).add(item.id));
    } catch (e) {
        if (e instanceof Error) {
            setError(`Failed to send email: ${e.message}. If this is an authentication issue, try one of the Google Import buttons to re-authorize.`);
        } else {
            setError("An unknown error occurred while sending the email.");
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
    if (!trelloEmail) {
      setError("Please configure your Trello board's email address first.");
      return;
    }
    const itemsToPost = items.filter(item => !postedCardIds.has(item.id));
    if (itemsToPost.length === 0) return;

    setIsPostingAll(true);
    setError(null);
    const failedPosts: { title: string; error: string }[] = [];

    for (const item of itemsToPost) {
      setIsPostingIds(prev => new Set(prev).add(item.id));
      try {
        await googleApiService.sendEmail(trelloEmail, item.title, item.description);
        setPostedCardIds(prev => new Set(prev).add(item.id));
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
      setError(`Some cards failed to post:\n${errorSummary}\n\nIf this is an authentication issue, try one of the Google Import buttons to re-authorize.`);
    }
  };

  const renderEmailConfig = () => (
    <div className="space-y-4">
        <p className="text-slate-400 text-sm">
            Find this email address in your Trello board's settings: <br/> Menu &gt; More &gt; Email-to-board settings.
        </p>
        <form onSubmit={handleSaveEmail} className="flex flex-col sm:flex-row gap-2 items-center">
            <label htmlFor="trello-email" className="sr-only">Trello Board Email</label>
            <input
                id="trello-email"
                type="email"
                value={tempTrelloEmail}
                onChange={(e) => setTempTrelloEmail(e.target.value)}
                placeholder="e.g., user+board...@boards.trello.com"
                className="w-full flex-grow p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-purple-500"
            />
            <button type="submit" className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700">
                Save Email
            </button>
        </form>
    </div>
  );

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
            isEmailConfigured={!!trelloEmail}
            onPost={handlePostToTrello}
            isPosted={postedCardIds.has(item.id)}
            isPosting={isPostingIds.has(item.id)}
          />
        ))}
      </div>
      
      <div className="mt-6 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
        <h3 className="text-xl font-bold mb-4 text-slate-100">Trello Integration</h3>
        {error && <div className="mb-4"><ErrorDisplay message={error} /></div>}
        
        {!trelloEmail && !isEmailConfigVisible && (
            <div className="text-center">
                <p className="text-slate-300 mb-4">Set up your Trello board's email to post cards directly from the app.</p>
                <button 
                    onClick={() => setIsEmailConfigVisible(true)}
                    className="flex items-center justify-center gap-2 w-full max-w-xs mx-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"
                >
                    <MailIcon className="w-5 h-5" />
                    Configure Trello Email
                </button>
            </div>
        )}

        {(isEmailConfigVisible) && renderEmailConfig()}

        {trelloEmail && !isEmailConfigVisible && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                  <div>
                      <p className="text-slate-300">Posting cards directly to:</p>
                      <p className="font-mono text-sm text-purple-400">{trelloEmail}</p>
                  </div>
                  <button onClick={() => setIsEmailConfigVisible(true)} className="text-sm text-slate-400 hover:text-white hover:underline">
                      Change
                  </button>
              </div>
              <div>
                  <button
                      onClick={handlePostAll}
                      disabled={isPostingAll || remainingItemsCount === 0}
                      className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300"
                  >
                      {isPostingAll ? (
                          <SpinnerIcon className="w-5 h-5" />
                      ) : (
                          <MailIcon className="w-5 h-5" />
                      )}
                      {isPostingAll 
                          ? `Posting... (${postedCardIds.size} of ${items.length} posted)` 
                          : `Post All Remaining Cards (${remainingItemsCount})`
                      }
                  </button>
              </div>
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