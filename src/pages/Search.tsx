import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Grid, TextField, CircularProgress, Button, IconButton, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import MusicCard from '../components/MusicCard';
import { searchMusicVideos, searchPlaylists, formatSearchResultForApp } from '../api/youtubeApi';
import { usePlayer } from '../context/PlayerContext';
import { useNavigate } from 'react-router-dom';

// Mock categories for demonstration
const categories = [
  { id: '1', name: 'Bollywood', color: '#1DB954' },
  { id: '2', name: 'Punjabi', color: '#FF9500' },
  { id: '3', name: 'Indie', color: '#FF2D55' },
  { id: '4', name: 'Pop', color: '#5856D6' },
  { id: '5', name: 'Rock', color: '#FF3B30' },
  { id: '6', name: 'Classical', color: '#007AFF' },
  { id: '7', name: 'Devotional', color: '#FFCC00' },
  { id: '8', name: 'Romantic', color: '#FF2D55' },
  { id: '9', name: 'Party', color: '#4CD964' },
  { id: '10', name: 'Ghazals', color: '#FF33FF' },
];

// Add proper type for search results
interface SearchResult {
  id: string;
  title: string;
  artist: string;
  cover: string;
  duration?: number;
  type: 'track' | 'playlist';
}

interface SearchProps {
  initialQuery?: string;
  onQueryChange?: (query: string) => void;
}

const Search: React.FC<SearchProps> = ({ initialQuery = '', onQueryChange }) => {
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);
  const { playSong } = usePlayer();
  const navigate = useNavigate();
  
  // Debounce search with useRef and useCallback for better performance
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Define performSearch before using it in useEffect
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      
      // Execute API calls in parallel for better performance
      const [videoResults, playlistResults] = await Promise.all([
        searchMusicVideos(query, 10),
        searchPlaylists(query, 5)
      ]);
      
      // Format the results for our app
      const formattedResults = [
        ...videoResults.map((result: any) => formatSearchResultForApp(result)),
        ...playlistResults.map((result: any) => formatSearchResultForApp(result))
      ];
      
      setSearchResults(formattedResults);
      
      // Save to search history
      if (query.trim() !== '') {
        const newHistory = [
          { query, timestamp: new Date().toISOString() },
          ...searchHistory.filter(item => item.query !== query).slice(0, 4)
        ];
        setSearchHistory(newHistory);
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchHistory]);

  // Now use performSearch in useEffect
  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery, performSearch]);

  // Update local state and parent state when search query changes
  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    
    if (onQueryChange) {
      onQueryChange(query);
    }
    
    // Debounce search to avoid too many API calls
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (query.length > 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query);
      }, 500);
    } else if (query.length === 0) {
      setSearchResults([]);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const handleCardClick = (item: SearchResult) => {
    if (item.type === 'track') {
      // Add to search history
      const newHistory = [
        { query: item.title, timestamp: new Date().toISOString() },
        ...searchHistory.filter(h => h.query !== item.title).slice(0, 4)
      ];
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      
      // Play the song
      const songToPlay = {
        id: item.id,
        title: item.title,
        artist: item.artist,
        cover: item.cover,
        duration: item.duration || 0
      };
      
      playSong(songToPlay);
    } else if (item.type === 'playlist') {
      // Navigate to playlist page
      navigate(`/playlist/${item.id}`);
    }
  };

  const handleCategoryClick = useCallback((categoryName: string) => {
    setSearchQuery(categoryName);
    performSearch(categoryName);
  }, [performSearch]);

  const handleClearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    if (onQueryChange) {
      onQueryChange('');
    }
  };

  // Load search history from localStorage on component mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('searchHistory');
      if (savedHistory) {
        setSearchHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  }, []);

  return (
    <Box className="search-page">
      <Box sx={{ padding: '24px' }}>
        <form onSubmit={handleSearch}>
          <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
            <TextField
              fullWidth
              placeholder="What do you want to listen to?"
              value={searchQuery}
              onChange={(e) => handleSearchQueryChange(e.target.value)}
              variant="outlined"
              InputProps={{
                startAdornment: <SearchIcon sx={{ marginRight: '8px', color: 'text.secondary' }} />,
                endAdornment: searchQuery ? (
                  <IconButton size="small" onClick={handleClearSearch}>
                    <ClearIcon />
                  </IconButton>
                ) : null
              }}
            />
          </Box>
        </form>

        {!searchQuery && searchHistory.length > 0 && (
          <Box sx={{ marginBottom: '32px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <Typography variant="h6">Recent Searches</Typography>
              <Button variant="text" onClick={handleClearHistory}>Clear</Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {searchHistory.map((item, index) => (
                <Chip 
                  key={index}
                  label={item.query}
                  onClick={() => handleSearchQueryChange(item.query)}
                  sx={{ margin: '4px' }}
                />
              ))}
            </Box>
          </Box>
        )}

        {!searchQuery && (
          <Box sx={{ marginBottom: '32px' }}>
            <Typography variant="h6" sx={{ marginBottom: '16px' }}>Browse Categories</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {categories.map((category) => (
                <Chip 
                  key={category.id}
                  label={category.name}
                  onClick={() => handleCategoryClick(category.name)}
                  sx={{ 
                    backgroundColor: category.color,
                    color: 'white',
                    fontWeight: 'bold',
                    padding: '20px 12px',
                    borderRadius: '16px'
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {isSearching ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <CircularProgress />
          </Box>
        ) : searchResults.length > 0 ? (
          <Box>
            <Typography variant="h6" sx={{ marginBottom: '16px' }}>
              Results for "{searchQuery}"
            </Typography>
            <Grid container spacing={3}>
              {searchResults.map((item) => (
                <Grid item key={item.id} xs={6} sm={4} md={3}>
                  <Box onClick={() => handleCardClick(item)} sx={{ cursor: 'pointer' }}>
                    <MusicCard
                      title={item.title}
                      subtitle={item.artist}
                      image={item.cover}
                      type={item.type}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        ) : searchQuery ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <Typography variant="body1">
              No results found for "{searchQuery}". Try a different search term.
            </Typography>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};

export default Search; 