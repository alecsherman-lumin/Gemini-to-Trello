
interface TrelloCredentials {
  key: string;
  token: string;
}

const API_BASE = 'https://api.trello.com/1';

const getCredentials = (): TrelloCredentials | null => {
  const key = localStorage.getItem('trelloApiKey');
  const token = localStorage.getItem('trelloApiToken');
  if (key && token) {
    return { key, token };
  }
  return null;
};

const handleTrelloError = async (response: Response) => {
    if (!response.ok) {
        const errorText = await response.text();
        // Trello API returns plain text errors for many auth issues, e.g., "invalid key"
        throw new Error(`Trello API Error (${response.status}): ${errorText}`);
    }
    return response.json();
};

export const trelloService = {
  setCredentials(key: string, token: string): void {
    localStorage.setItem('trelloApiKey', key);
    localStorage.setItem('trelloApiToken', token);
  },

  clearCredentials(): void {
    localStorage.removeItem('trelloApiKey');
    localStorage.removeItem('trelloApiToken');
  },

  getCredentials,

  async getBoards(): Promise<any[]> {
    const creds = getCredentials();
    if (!creds) throw new Error("Trello API key and token not set.");
    const response = await fetch(`${API_BASE}/members/me/boards?key=${creds.key}&token=${creds.token}&fields=id,name`);
    return handleTrelloError(response);
  },

  async getLists(boardId: string): Promise<any[]> {
    const creds = getCredentials();
    if (!creds) throw new Error("Trello API key and token not set.");
    const response = await fetch(`${API_BASE}/boards/${boardId}/lists?key=${creds.key}&token=${creds.token}&fields=id,name`);
    return handleTrelloError(response);
  },

  async createCard(listId: string, name: string, desc: string): Promise<any> {
    const creds = getCredentials();
    if (!creds) throw new Error("Trello API key and token not set.");
    
    // Using URLSearchParams to handle encoding of special characters in name and desc
    const params = new URLSearchParams({
        idList: listId,
        key: creds.key,
        token: creds.token,
        name: name,
        desc: desc,
    });
    
    const url = `${API_BASE}/cards?${params.toString()}`;
    
    const response = await fetch(url, { 
        method: 'POST',
        headers: {
            'Accept': 'application/json'
        }
    });
    return handleTrelloError(response);
  },
};
