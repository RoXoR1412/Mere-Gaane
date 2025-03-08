import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import MusicCard from './MusicCard';
import { usePlayer } from '../context/PlayerContext';

interface LastSearchedProps {
  searchHistory: any[];
}

const LastSearched: React.FC<LastSearchedProps> = ({ searchHistory }) => {
  const { playSong } = usePlayer();

  if (searchHistory.length === 0) {
    return null;
  }

  const handleCardClick = (item: any) => {
    if (item.type === 'track') {
      playSong(item);
    }
  };

  return (
    <Box sx={{ marginBottom: '40px' }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white', marginBottom: '16px' }}>
        Last Searched Songs
      </Typography>
      <Grid container spacing={3}>
        {searchHistory.map((item) => (
          <Grid item key={item.id} xs={6} sm={4} md={3} lg={2.4}>
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
  );
};

export default LastSearched; 