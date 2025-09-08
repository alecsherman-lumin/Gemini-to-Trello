
import React, { useState, useEffect } from 'react';
import { trelloService } from '../services/trelloService';
import TrelloApiKeyPrompt from './TrelloApiKeyPrompt';
import ErrorDisplay from './ErrorDisplay';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { TrelloIcon } from './icons/TrelloIcon';

interface TrelloConfigurationProps {
  onConfigurationComplete: (isConfigured: boolean) => void;
}

const TrelloConfiguration: React.FC<TrelloConfigurationProps> = ({ onConfigurationComplete }) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  
  const [boards, setBoards] = useState<any[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<{ id: string; name: string } | null>(null);

  const [lists, setLists] = useState<any[]>([]);
  const [selectedList, setSelectedList] = useState<{ id: string; name: string } | null>(null);

  const [isLoading, setIsLoading] = useState<'credentials' | 'boards' | 'lists' | false>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPromptVisible, setIsPromptVisible] = useState(false);

  // Load saved config from localStorage on initial render
  useEffect(() => {
    const savedKey = localStorage.getItem('trelloApiKey');
    const savedToken = localStorage.getItem('trelloApiToken');
    const savedBoard = localStorage.getItem('trelloBoard');
    const savedList = localStorage.getItem('trelloList');

    if (savedKey && savedToken) {
      setApiKey(savedKey);
      trelloService.setCredentials(savedKey, savedToken);
      
      if (savedBoard) {
        setSelectedBoard(JSON.parse(savedBoard));
      }
      if (savedList) {
        setSelectedList(JSON.parse(savedList));
        onConfigurationComplete(true);
      }
    }
  }, [onConfigurationComplete]);

  const handleConnect = async (key: string, token: string) => {
    setIsLoading('credentials');
    setError(null);
    trelloService.setCredentials(key, token);
    try {
      // Test credentials by fetching boards, which will throw on failure
      await trelloService.getBoards();
      setApiKey(key);
      setIsPromptVisible(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect to Trello. Please check your API Key and Token.');
      trelloService.clearCredentials();
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch boards when API key is set
  useEffect(() => {
    if (apiKey && boards.length === 0 && !selectedBoard) {
      const fetchBoards = async () => {
        setIsLoading('boards');
        setError(null);
        try {
          const fetchedBoards = await trelloService.getBoards();
          setBoards(fetchedBoards);
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Could not fetch Trello boards.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchBoards();
    }
  }, [apiKey, boards.length, selectedBoard]);

  // Fetch lists when a board is selected
  useEffect(() => {
    if (selectedBoard && lists.length === 0 && !selectedList) {
      const fetchLists = async () => {
        setIsLoading('lists');
        setError(null);
        try {
          const fetchedLists = await trelloService.getLists(selectedBoard.id);
          setLists(fetchedLists);
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Could not fetch Trello lists for the selected board.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchLists();
    }
  }, [selectedBoard, lists.length, selectedList]);

  const handleBoardSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const boardId = e.target.value;
    if (!boardId) return;
    const board = boards.find(b => b.id === boardId);
    if (board) {
      const boardData = { id: board.id, name: board.name };
      setSelectedBoard(boardData);
      localStorage.setItem('trelloBoard', JSON.stringify(boardData));
      // Reset list selection
      setSelectedList(null);
      localStorage.removeItem('trelloList');
      setLists([]);
      onConfigurationComplete(false);
    }
  };

  const handleListSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const listId = e.target.value;
    if (!listId) return;
    const list = lists.find(l => l.id === listId);
    if (list) {
      const listData = { id: list.id, name: list.name };
      setSelectedList(listData);
      localStorage.setItem('trelloList', JSON.stringify(listData));
      onConfigurationComplete(true);
    }
  };
  
  const handleResetConfig = () => {
      trelloService.clearCredentials();
      localStorage.removeItem('trelloBoard');
      localStorage.removeItem('trelloList');
      setApiKey(null);
      setSelectedBoard(null);
      setSelectedList(null);
      setBoards([]);
      setLists([]);
      setError(null);
      onConfigurationComplete(false);
  }

  if (isPromptVisible) {
      return <TrelloApiKeyPrompt onConnect={handleConnect} onCancel={() => setIsPromptVisible(false)} isLoading={isLoading === 'credentials'} error={error} />
  }

  if (!apiKey) {
    return (
       <div className="text-center">
            <p className="text-slate-300 mb-4">Connect your Trello account to post cards directly from the app.</p>
            <button 
                onClick={() => setIsPromptVisible(true)}
                className="flex items-center justify-center gap-2 w-full max-w-xs mx-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"
            >
                <TrelloIcon className="w-5 h-5" />
                Connect to Trello
            </button>
        </div>
    )
  }
  
  if (selectedBoard && selectedList) {
      return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-slate-300">Posting cards to:</p>
                    <p className="font-mono text-sm text-purple-400">{selectedBoard.name} / {selectedList.name}</p>
                </div>
                <button onClick={handleResetConfig} className="text-sm text-slate-400 hover:text-white hover:underline">
                    Change
                </button>
            </div>
        </div>
      )
  }

  return (
    <div className="space-y-4">
        {error && <div className="mb-2"><ErrorDisplay message={error} /></div>}
        
        {isLoading === 'boards' && <div className="flex items-center gap-2 text-slate-400"><SpinnerIcon className="w-4 h-4" />Loading your boards...</div>}
        {boards.length > 0 && !selectedBoard && (
            <div>
                <label htmlFor="trello-board-select" className="block text-sm font-medium text-slate-300 mb-1">Select a Board</label>
                <select id="trello-board-select" onChange={handleBoardSelect} defaultValue="" className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-purple-500">
                    <option value="" disabled>Choose a board...</option>
                    {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
            </div>
        )}

        {selectedBoard && isLoading === 'lists' && <div className="flex items-center gap-2 text-slate-400"><SpinnerIcon className="w-4 h-4" />Loading lists...</div>}
        {selectedBoard && !isLoading && lists.length > 0 && !selectedList && (
             <div>
                <label htmlFor="trello-list-select" className="block text-sm font-medium text-slate-300 mb-1">Select a List</label>
                <select id="trello-list-select" onChange={handleListSelect} defaultValue="" className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-purple-500">
                    <option value="" disabled>Choose a list...</option>
                    {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
            </div>
        )}
        <button onClick={handleResetConfig} className="text-sm text-slate-400 hover:text-white hover:underline">Disconnect Trello Account</button>
    </div>
  )
};

export default TrelloConfiguration;
