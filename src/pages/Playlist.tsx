import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Grid, Card, CardMedia, CardContent, IconButton } from '@mui/material';
import { PlayArrow, Add } from '@mui/icons-material';
import { getPlaylistItems, formatSearchResultForApp } from '../api/youtubeApi';
import { usePlayer } from '../context/PlayerContext';

// Define the type for playlist items
interface PlaylistItem {
  id: string;
  title: string;
  artist: string;
  cover: string;
  duration?: number;
  type: 'track' | 'playlist';
}

const Playlist: React.FC = () => {
  // Fix the useParams type issue
  const params = useParams();
  const id = params.id;
  
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [playlistTitle, setPlaylistTitle] = useState<string>('');
  const { playSong, addToQueue } = usePlayer();

  useEffect(() => {
    const fetchPlaylistItems = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const items = await getPlaylistItems(id);
        const formattedItems = items.map((item: any) => formatSearchResultForApp(item));
        
        setPlaylistItems(formattedItems);
        
        // Set playlist title from the first item if available
        if (formattedItems.length > 0) {
          setPlaylistTitle(formattedItems[0].artist);
        }
      } catch (err) {
        console.error('Error fetching playlist items:', err);
        setError('Failed to load playlist. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylistItems();
  }, [id]);

  const handlePlaySong = (song: PlaylistItem) => {
    // Convert to Song type for player
    const songToPlay = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      cover: song.cover,
      duration: song.duration || 0
    };
    
    playSong(songToPlay);
  };

  const handleAddToQueue = (song: PlaylistItem) => {
    // Convert to Song type for player
    const songToAdd = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      cover: song.cover,
      duration: song.duration || 0
    };
    
    addToQueue(songToAdd);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6" color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        {playlistTitle || 'Playlist'}
      </Typography>
      
      {playlistItems.length === 0 ? (
        <Typography variant="body1">No songs found in this playlist.</Typography>
      ) : (
        <Grid container spacing={2}>
          {playlistItems.map((item) => (
            <Grid item xs={12} key={item.id}>
              <Card sx={{ display: 'flex', bgcolor: 'background.paper' }}>
                <CardMedia
                  component="img"
                  sx={{ width: 100, height: 100 }}
                  image={item.cover}
                  alt={item.title}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <CardContent sx={{ flex: '1 0 auto' }}>
                    <Typography component="div" variant="h6" noWrap>
                      {item.title}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" component="div" noWrap>
                      {item.artist}
                    </Typography>
                  </CardContent>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', pl: 1, pb: 1, pr: 2 }}>
                  <IconButton aria-label="play" onClick={() => handlePlaySong(item)}>
                    <PlayArrow />
                  </IconButton>
                  <IconButton aria-label="add to queue" onClick={() => handleAddToQueue(item)}>
                    <Add />
                  </IconButton>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Playlist; 