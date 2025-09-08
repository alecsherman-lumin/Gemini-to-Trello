# Tech Spec: Gemini Meet to Trello

## 1. Overview

This document outlines the technical design and architecture for the "Gemini Meet to Trello" web application. The primary purpose of this tool is to streamline productivity by automatically identifying action items from Google Meet transcripts or summaries and converting them into Trello cards.

The application is designed as a client-side, single-page application (SPA) that leverages the Google Gemini API for natural language processing and the Trello Client API for board integration. It is also a Progressive Web App (PWA), enabling installation on user devices and seamless integration with the native operating system's "Share" functionality.

### Key Features:
- **AI-Powered Action Item Extraction:** Utilizes the Gemini Flash model to analyze unstructured text and extract actionable tasks.
- **Structured Data Output:** Employs Gemini's JSON mode with a response schema to ensure reliable, structured data for processing.
- **Interactive Trello Integration:** Allows users to connect their Trello account, select a specific board and list, and create cards directly from the application.
- **PWA & Share Target:** Can be installed like a native app and can receive text directly from other applications (e.g., an email client) via the Web Share Target API, eliminating the need for copy-pasting.
- **Persistent Connection:** Securely stores the user's Trello API key in `localStorage` for a seamless experience on subsequent visits.

---

## 2. Core Technologies

- **Frontend Framework:** React 19 (using `React.StrictMode`)
- **Language:** TypeScript
- **Bundling/Imports:** ES Modules with `importmap` (no local bundler like Vite/Webpack)
- **Styling:** Tailwind CSS (via CDN)
- **AI Service:** Google Gemini API (`@google/genai` library)
- **Trello Integration:** Trello Client.js library (dynamically loaded)

---

## 3. Application Architecture

The application follows a component-based architecture, with a clear separation between UI components, services (business logic), and type definitions.

### 3.1. Directory Structure
```
.
├── components/         # Reusable React UI components
│   ├── ActionItemCard.tsx
│   ├── ActionItemsList.tsx
│   ├── ErrorDisplay.tsx
│   ├── Header.tsx
│   ├── LoadingSpinner.tsx
│   ├── TranscriptInput.tsx
│   ├── TrelloApiKeyPrompt.tsx
│   └── TrelloConfiguration.tsx
├── services/           # Logic for external API communication
│   ├── geminiService.ts
│   └── trelloService.ts
├── App.tsx             # Main application component (state management)
├── index.html          # Entry point, PWA setup
├── index.tsx           # React root renderer
├── manifest.json       # PWA manifest & Share Target config
├── service-worker.js   # PWA service worker
└── types.ts            # Shared TypeScript interfaces
```

### 3.2. Component Breakdown

- **`App.tsx`**: The root component. It manages the primary application state (`transcript`, `actionItems`, `isLoading`, `error`) and orchestrates the main user workflow, deciding whether to show the input form or the results list. It also contains the logic to handle incoming shared text from the Share Target API.

- **`TranscriptInput.tsx`**: The initial UI for pasting the meeting transcript. It's a controlled form component that triggers the analysis process.

- **`ActionItemsList.tsx`**: A stateful component that manages the entire Trello integration flow. It acts as a state machine, guiding the user through connecting to Trello, configuring the board/list, and creating the cards. It also renders the list of `ActionItemCard` components.

- **`ActionItemCard.tsx`**: A presentational component that displays a single action item. It allows the user to edit the title and description or delete the item before it's sent to Trello.

- **`TrelloApiKeyPrompt.tsx` & `TrelloConfiguration.tsx`**: Components dedicated to the Trello setup process, separating the concerns of API key entry and board/list selection.

### 3.3. Service Layer

- **`geminiService.ts`**:
  - Encapsulates all logic for interacting with the Google Gemini API.
  - Constructs a detailed prompt instructing the model to find action items.
  - **Crucially, it defines a `responseSchema` and sets `responseMimeType: "application/json"`. This forces the Gemini model to return a valid JSON array matching our `ActionItem` type, significantly increasing the reliability of the application and reducing the need for fragile string parsing.**
  - Handles API errors and transforms the response into the application's data model.

- **`trelloService.ts`**:
  - Manages the Trello `client.js` library, including dynamically loading the script with the user's API key.
  - Handles the Trello OAuth 1.0a flow using `Trello.authorize()` in a popup window.
  - Provides methods for fetching boards, fetching lists for a specific board, and creating new cards.
  - Manages authorization state (`isAuthorized`, `deauthorize`).

---

## 4. Key Feature Implementation

### 4.1. PWA and Web Share Target

This feature is implemented to fulfill the user's request to avoid copy-pasting.

1.  **`manifest.json`**:
    - Defines the app as a PWA with icons, colors, and a `display` mode of `standalone`.
    - The `share_target` object is the key. It specifies that the app can accept `GET` requests at its root (`/`) with a `text` parameter.
    ```json
    "share_target": {
      "action": "/",
      "method": "GET",
      "params": { "text": "text" }
    }
    ```
2.  **`service-worker.js`**: A basic service worker is included to make the app installable and provide a minimal offline experience by caching core assets.

3.  **`index.html`**: Links the manifest and registers the service worker.

4.  **`App.tsx`**: An `useEffect` hook runs on component mount to check the URL for shared data.
    ```typescript
    useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const sharedText = urlParams.get('text');
      if (sharedText) {
        setTranscript(sharedText);
        handleFindActionItems(sharedText); // Automatically start analysis
        window.history.replaceState({}, '', window.location.pathname); // Clean URL
      }
    }, []);
    ```

### 4.2. Trello API Key Persistence

To avoid requiring the API key on every visit, it is stored in the browser's `localStorage`.

- **On Connect:** After a successful connection and authorization, the API key is saved: `localStorage.setItem('trelloApiKey', trelloApiKey);`.
- **On Load:** The `useEffect` hook in `ActionItemsList.tsx` attempts to auto-connect. It checks `localStorage` for a key. If found, it initializes the `trelloService` and checks if the user is still authorized.
- **On Disconnect:** A "Disconnect" button allows the user to clear the stored key: `localStorage.removeItem('trelloApiKey');`.

---

## 5. User Flow

1.  **First Visit (Manual Input):**
    - User opens the app and sees the `TranscriptInput` component.
    - User pastes a transcript and clicks "Find Action Items".
    - `App.tsx` sets `isLoading` to true, showing a spinner.
    - `geminiService.findActionItemsFromTranscript` is called.
    - On success, the response is used to update the `actionItems` state, and the UI transitions to display `ActionItemsList`.
    - User clicks "Create Cards in Trello", which begins the Trello connection flow (`TrelloApiKeyPrompt` -> `TrelloConfiguration`).

2.  **First Visit (Share Target):**
    - User is in their email client and uses the "Share" button.
    - They select "Gemini Meet to Trello" from the list of apps.
    - The PWA launches. The `useEffect` in `App.tsx` detects the `?text=` parameter in the URL.
    - The analysis is triggered automatically, and the user is taken directly to the `ActionItemsList` view with the results.

3.  **Subsequent Visits:**
    - User opens the installed PWA.
    - The app loads. The `useEffect` in `ActionItemsList` finds the API key in `localStorage` and automatically initializes the Trello connection.
    - If the user generates new action items, the "Create Cards in Trello" button will immediately show the `TrelloConfiguration` step, bypassing the need to re-enter the API key.
