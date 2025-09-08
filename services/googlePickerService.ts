// FIX: Add minimal type definitions for Google Identity Services to resolve namespace errors.
declare namespace google {
    namespace accounts {
        namespace oauth2 {
            interface TokenClient {
                requestAccessToken: (overrideConfig?: { prompt: string }) => void;
                callback: (response: TokenResponse) => void;
            }
            interface TokenResponse {
                access_token: string;
                expires_in: number;
                error?: string;
                error_description?: string;
            }
        }
    }
}

let credentials = {
  apiKey: '',
  clientId: '',
};

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';


let gapiLoadedPromise: Promise<void> | null = null;
let gisLoadedPromise: Promise<void> | null = null;
let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let accessToken: google.accounts.oauth2.TokenResponse | null = null;

// Augment window for gapi and google
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const loadGapi = (): Promise<void> => {
  if (gapiLoadedPromise) return gapiLoadedPromise;
  gapiLoadedPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onerror = () => reject(new Error('Failed to load Google API script.'));
    script.onload = () => {
      window.gapi.load('client:picker', async () => {
        try {
          // Also load the Gmail client library
          await window.gapi.client.load('gmail', 'v1');
          resolve();
        } catch (e) {
          console.error("Error loading gmail client:", e);
          reject(new Error('Failed to load Gmail client library.'));
        }
      });
    };
    document.body.appendChild(script);
  });
  return gapiLoadedPromise;
};

const loadGis = (): Promise<void> => {
  if (gisLoadedPromise) return gisLoadedPromise;
  gisLoadedPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
  return gisLoadedPromise;
}

const initGoogleAuth = async () => {
    if (!credentials.clientId) {
      throw new Error("Google Client ID has not been set.");
    }

    await Promise.all([loadGapi(), loadGis()]);
    
    if (tokenClient) return;

    tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: credentials.clientId,
        scope: `${DRIVE_SCOPE} ${GMAIL_SCOPE}`,
        callback: (tokenResponse: google.accounts.oauth2.TokenResponse) => {
            if (tokenResponse.error) {
                // This case is handled in the promise rejection in getAccessToken
                return;
            }
            accessToken = tokenResponse;
        },
    });
};

const getAccessToken = (): Promise<google.accounts.oauth2.TokenResponse> => {
    return new Promise((resolve, reject) => {
        // Check if the token is still valid (assuming it expires in 3600s, check for more than 1 min left)
        if (accessToken && accessToken.expires_in > 60) {
            return resolve(accessToken);
        }

        if (!tokenClient) {
            return reject(new Error("Google Auth not initialized."));
        }
        
        tokenClient.callback = (tokenResponse) => {
            if (tokenResponse.error) {
                const errorMsg = tokenResponse.error_description || tokenResponse.error;
                return reject(new Error(`Google Auth Error: ${errorMsg}. Please ensure you have granted all requested permissions.`));
            }
            accessToken = tokenResponse;
            resolve(tokenResponse);
        }

        if (accessToken) { // Token expired, refresh silently
            tokenClient.requestAccessToken({prompt: ''});
        } else { // No token, prompt user
            tokenClient.requestAccessToken({prompt: 'consent'});
        }
    });
}


const showPicker = (): Promise<any> => {
    return new Promise(async (resolve, reject) => {
        if (!credentials.apiKey || !credentials.clientId) {
            return reject(new Error("Google API Key and Client ID must be set before using the picker."));
        }
        await initGoogleAuth();
        const token = await getAccessToken();

        const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
        view.setMimeTypes("application/vnd.google-apps.document");
        view.setQuery("name contains 'Notes by Gemini'");
        
        const picker = new window.google.picker.PickerBuilder()
            .setAppId(credentials.clientId.split('-')[0])
            .setOAuthToken(token.access_token)
            .setDeveloperKey(credentials.apiKey)
            .addView(view)
            .setCallback((data: any) => {
                if (data.action === window.google.picker.Action.PICKED) {
                    resolve(data.docs[0]);
                } else if (data.action === window.google.picker.Action.CANCEL) {
                    reject(new Error("Picker was cancelled by the user."));
                }
            })
            .build();
        picker.setVisible(true);
    });
};


const getDocContent = async (fileId: string): Promise<string> => {
    const token = await getAccessToken();
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`, {
        headers: {
            'Authorization': `Bearer ${token.access_token}`
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to fetch document content: ${error.error.message}`);
    }

    return response.text();
}

const base64UrlDecode = (str: string): string => {
  try {
    const regularBase64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const raw = window.atob(regularBase64);
    const rawLength = raw.length;
    const bytes = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; i++) {
        bytes[i] = raw.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch(e) {
    console.error("Failed to decode base64 content:", e);
    throw new Error("Could not decode email content.");
  }
};


export const googleApiService = {
    setCredentials(apiKey: string, clientId: string): void {
        credentials = { apiKey, clientId };
        // Reset auth state if credentials change
        tokenClient = null;
        accessToken = null;
    },
    async pickDocAndGetContent(): Promise<string> {
        const doc = await showPicker();
        if (!doc || !doc.id) {
            throw new Error("No document selected.");
        }
        return await getDocContent(doc.id);
    },
    async findAndLoadGeminiNotesDoc(): Promise<string> {
        if (!credentials.apiKey || !credentials.clientId) {
            throw new Error("Google API Key and Client ID must be set before using the scanner.");
        }
        await initGoogleAuth();
        const token = await getAccessToken();

        const query = "name contains 'Notes by Gemini' and mimeType='application/vnd.google-apps.document'";
        const url = new URL("https://www.googleapis.com/drive/v3/files");
        url.searchParams.append('q', query);
        url.searchParams.append('orderBy', 'modifiedTime desc');
        url.searchParams.append('pageSize', '1');
        url.searchParams.append('fields', 'files(id)');

        const response = await fetch(url.toString(), {
            headers: {
                'Authorization': `Bearer ${token.access_token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to search Google Drive: ${error.error.message}`);
        }

        const data = await response.json();

        if (!data.files || data.files.length === 0) {
            throw new Error("No Google Docs document with 'Notes by Gemini' in the title was found.");
        }

        const fileId = data.files[0].id;
        return await getDocContent(fileId);
    },
    async findAndLoadForwardedEmail(): Promise<string> {
        if (!credentials.apiKey || !credentials.clientId) {
            throw new Error("Google API Key and Client ID must be set before scanner.");
        }
        await initGoogleAuth();
        await getAccessToken(); // This ensures we are logged in

        const listResponse = await window.gapi.client.gmail.users.messages.list({
            userId: 'me',
            q: 'subject:"Notes by Gemini" is:unread',
            maxResults: 1,
        });

        const messages = listResponse.result.messages;
        if (!messages || messages.length === 0) {
            throw new Error("No unread email with the subject 'Notes by Gemini' found in your inbox.");
        }
        
        const messageId = messages[0].id;
        const messageResponse = await window.gapi.client.gmail.users.messages.get({
            userId: 'me',
            id: messageId
        });

        const payload = messageResponse.result.payload;

        const findPlainTextPart = (parts: any[]): any | null => {
            for (const part of parts) {
                if (part.mimeType === 'text/plain') {
                    return part;
                }
                if (part.parts) {
                    const found = findPlainTextPart(part.parts);
                    if (found) return found;
                }
            }
            return null;
        }

        let plainTextPart;
        if (payload.mimeType === 'text/plain') {
            plainTextPart = payload;
        } else if (payload.parts) {
            plainTextPart = findPlainTextPart(payload.parts);
        }

        if (!plainTextPart || !plainTextPart.body || !plainTextPart.body.data) {
            throw new Error("Could not find plain text content in the email.");
        }

        return base64UrlDecode(plainTextPart.body.data);
    }
};