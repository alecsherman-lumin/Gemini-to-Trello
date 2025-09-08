import type { TrelloBoard, TrelloList, ActionItem } from '../types';

let TRELLO_API_KEY: string = '';

// Augment the window interface to include the Trello object
declare global {
  interface Window {
    Trello: any;
  }
}

let scriptLoadingPromise: Promise<void> | null = null;

const loadTrelloClient = (): Promise<void> => {
  if (!TRELLO_API_KEY) {
    return Promise.reject(new Error('Trello API Key not set. Please provide one before connecting.'));
  }
  
  if (window.Trello) {
    return Promise.resolve();
  }

  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }
  scriptLoadingPromise = new Promise((resolve, reject) => {
    // Clean up any old script tags from previous failed attempts
    const existingScript = document.querySelector(`script[src^="https://trello.com/1/client.js"]`);
    if (existingScript) {
        existingScript.remove();
    }

    const script = document.createElement('script');
    script.src = `https://trello.com/1/client.js?key=${TRELLO_API_KEY}`;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoadingPromise = null;
      reject(new Error('Failed to load Trello client script. Please check your API key and network connection.'));
    };
    document.body.appendChild(script);
  });
  return scriptLoadingPromise;
};

const trelloService = {
  setApiKey(key: string): void {
    TRELLO_API_KEY = key;
    // Reset state if key changes to allow for re-initialization
    scriptLoadingPromise = null;
    if(window.Trello) {
        delete window.Trello;
    }
  },

  async init(): Promise<void> {
    await loadTrelloClient();
  },

  isAuthorized(): boolean {
    return window.Trello?.authorized() ?? false;
  },

  authorize(): Promise<void> {
    return new Promise((resolve, reject) => {
        window.Trello.authorize({
            type: 'popup',
            name: 'Gemini Meet to Trello',
            scope: {
                read: 'true',
                write: 'true'
            },
            expiration: 'never',
            success: resolve,
            error: () => reject(new Error('Trello authorization failed. Please try again.')),
        });
    });
  },
  
  deauthorize(): void {
    if (window.Trello) {
        window.Trello.deauthorize();
    }
  },

  getBoards(): Promise<TrelloBoard[]> {
     return new Promise((resolve, reject) => {
        if (!this.isAuthorized()) return reject(new Error("Not authorized with Trello."));
        window.Trello.get('/members/me/boards', { filter: 'open' }, resolve, reject);
     });
  },

  getLists(boardId: string): Promise<TrelloList[]> {
    return new Promise((resolve, reject) => {
      if (!this.isAuthorized()) return reject(new Error("Not authorized with Trello."));
      window.Trello.get(`/boards/${boardId}/lists`, { filter: 'open' }, resolve, reject);
    });
  },

  createCard(listId: string, card: Omit<ActionItem, 'id'>): Promise<any> {
    return new Promise((resolve, reject) => {
        if (!this.isAuthorized()) return reject(new Error("Not authorized with Trello."));
        window.Trello.post('/cards', {
            idList: listId,
            name: card.title,
            desc: card.description,
            pos: 'top',
        }, resolve, reject);
    });
  },
};

export default trelloService;
