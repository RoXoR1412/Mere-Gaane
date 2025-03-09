import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { PlayerProvider } from './context/PlayerContext';

// For React 19
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <PlayerProvider>
      <App />
    </PlayerProvider>
  </React.StrictMode>
);
