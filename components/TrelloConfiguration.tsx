import React, { useState, useEffect, useCallback } from 'react';
import trelloService from '../services/trelloService';
import type { TrelloBoard, TrelloList } from '../types';
import ErrorDisplay from './ErrorDisplay';

interface TrelloConfigurationProps {
  onListSelected: (list: TrelloList | null) => void;
  onDisconnect: () => void;
}

const TrelloConfiguration: React.FC<TrelloConfigurationProps> = ({ onListSelected, onDisconnect }) => {
  const [boards, setBoards] = useState<TrelloBoard[]>([]);
  const [lists, setLists] = useState<TrelloList[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<'boards' | 'lists' | false>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBoards = async () => {
      setIsLoading('boards');
      setError(null);
      try {
        const userBoards = await trelloService.getBoards();
        setBoards(userBoards);
      } catch (err) {
        setError('Could not fetch your Trello boards. Please check your connection and try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBoards();
  }, []);

  const fetchLists = useCallback(async (boardId: string) => {
    if (!boardId) {
      setLists([]);
      setSelectedListId('');
      onListSelected(null);
      return;
    }
    setIsLoading('lists');
    setError(null);
    try {
      const boardLists = await trelloService.getLists(boardId);
      setLists(boardLists);
      // Reset list selection if new board is chosen
      setSelectedListId(''); 
      onListSelected(null);
    } catch (err) {
      setError('Could not fetch lists for the selected board.');
      setLists([]);
    } finally {
      setIsLoading(false);
    }
  }, [onListSelected]);

  const handleBoardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const boardId = e.target.value;
    setSelectedBoardId(boardId);
    fetchLists(boardId);
  };
  
  const handleListChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const listId = e.target.value;
    setSelectedListId(listId);
    const selectedList = lists.find(list => list.id === listId) || null;
    onListSelected(selectedList);
  };

  if (isLoading === 'boards') {
    return <div className="text-center text-slate-400">Loading your Trello boards...</div>;
  }
  
  if (error) {
    return <ErrorDisplay message={error} />
  }

  return (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <label htmlFor="trello-board" className="block text-sm font-medium text-slate-300">
                Select a Board
            </label>
            <button 
                onClick={onDisconnect}
                className="text-xs text-slate-400 hover:text-white hover:underline"
            >
                Disconnect
            </button>
        </div>
        <div>
            <select
                id="trello-board"
                value={selectedBoardId}
                onChange={handleBoardChange}
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                aria-label="Select a Trello Board"
            >
                <option value="" disabled>-- Choose a board --</option>
                {boards.map(board => (
                    <option key={board.id} value={board.id}>{board.name}</option>
                ))}
            </select>
        </div>

        {selectedBoardId && (
            <div>
                <label htmlFor="trello-list" className="block text-sm font-medium text-slate-300 mb-1">
                    Select a List
                </label>
                {isLoading === 'lists' ? (
                    <div className="text-slate-400">Loading lists...</div>
                ) : (
                    <select
                        id="trello-list"
                        value={selectedListId}
                        onChange={handleListChange}
                        disabled={lists.length === 0}
                        className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors disabled:opacity-50"
                        aria-label="Select a Trello List"
                    >
                        <option value="" disabled>-- Choose a list --</option>
                        {lists.map(list => (
                            <option key={list.id} value={list.id}>{list.name}</option>
                        ))}
                    </select>
                )}
            </div>
        )}
    </div>
  );
};

export default TrelloConfiguration;