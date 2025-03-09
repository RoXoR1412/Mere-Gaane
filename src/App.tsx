import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';
import { PlayerProvider } from './context/PlayerContext';
import TopBar from './components/TopBar';
import Player from './components/Player';
import Sidebar from './components/Sidebar';
import './App.css';

// Lazy load pages to improve initial load time
const Home = lazy(() => import('./pages/Home'));
const Search = lazy(() => import('./pages/Search'));
const Library = lazy(() => import('./pages/Library'));
const Playlist = lazy(() => import('./pages/Playlist'));

// Loading component for suspense fallback
const LoadingFallback = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: 'calc(100vh - 64px)',
    }}
  >
    <CircularProgress />
  </Box>
);

function App() {
  const [darkMode, setDarkMode] = useState(true);

  // Memoize theme to prevent unnecessary re-renders
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: {
            main: '#1DB954',
          },
          background: {
            default: darkMode ? '#121212' : '#f5f5f5',
            paper: darkMode ? '#181818' : '#ffffff',
          },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                scrollbarWidth: 'thin',
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: darkMode ? '#121212' : '#f5f5f5',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: darkMode ? '#555' : '#ccc',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: darkMode ? '#888' : '#999',
                },
              },
            },
          },
        },
      }),
    [darkMode]
  );

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PlayerProvider>
        <Router>
          <div className="app-container">
            <Sidebar />
            <div className="main-content">
              <TopBar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
              <div className="content-area">
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/library" element={<Library />} />
                    <Route path="/playlist/:id" element={<Playlist />} />
                  </Routes>
                </Suspense>
              </div>
            </div>
            <Player />
          </div>
        </Router>
      </PlayerProvider>
    </ThemeProvider>
  );
}

export default App;
