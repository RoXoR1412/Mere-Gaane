import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  CircularProgress, 
  Grid, 
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import MusicCard from './MusicCard';
import { searchMusicVideos, formatSearchResultForApp } from '../api/youtubeApi';
import { usePlayer } from '../context/PlayerContext';
import { addToSearchHistory } from '../utils/searchHistory';

// Define the search result type
interface SearchResult {
  id: string;
  title: string;
  artist: string;
  cover: string;
  duration?: number;
  type: 'track' | 'playlist';
}

interface YouTubeSearchProps {
  open: boolean;
  onClose: () => void;
}

const YouTubeSearch: React.FC<YouTubeSearchProps> = ({ open, onClose }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const { playSong } = usePlayer();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      // Use the YouTube API to search for videos
      const videoResults = await searchMusicVideos(searchQuery);
      
      // Format the results for our app
      const formattedResults = videoResults.map((result: any) => formatSearchResultForApp(result));
      
      setSearchResults(formattedResults);
    } catch (error) {
      console.error('Error searching YouTube:', error);
      // Fallback to empty results
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCardClick = (item: SearchResult) => {
    if (item.type === 'track') {
      // Add to search history
      addToSearchHistory(item.title);
      
      // Play the song
      const songToPlay = {
        id: item.id,
        title: item.title,
        artist: item.artist,
        cover: item.cover,
        duration: item.duration || 0
      };
      
      playSong(songToPlay);
      
      // Close the dialog
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: { 
          backgroundColor: '#121212',
          color: 'white',
          borderRadius: '8px',
          padding: '16px'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Search YouTube
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ marginBottom: '24px' }}>
          <form onSubmit={handleSearch}>
            <Box sx={{ display: 'flex', gap: '16px' }}>
              <TextField
                fullWidth
                placeholder="Search for any song on YouTube..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="outlined"
                InputProps={{
                  sx: { 
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1DB954',
                    }
                  }
                }}
              />
              <Button 
                type="submit" 
                variant="contained"
                startIcon={<SearchIcon />}
                sx={{ 
                  backgroundColor: '#1DB954',
                  '&:hover': {
                    backgroundColor: '#1ed760'
                  }
                }}
              >
                Search
              </Button>
            </Box>
          </form>
        </Box>

        {isSearching ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <CircularProgress sx={{ color: '#1DB954' }} />
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
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <Typography variant="body1" sx={{ color: '#b3b3b3' }}>
              {searchQuery ? 'No results found. Try a different search term.' : 'Search for any song on YouTube'}
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default YouTubeSearch; 