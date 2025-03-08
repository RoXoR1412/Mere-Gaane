import React, { useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

interface MusicCardProps {
  title: string;
  subtitle: string;
  image: string;
  type: 'track' | 'playlist' | 'album' | 'artist';
}

const MusicCard: React.FC<MusicCardProps> = ({ title, subtitle, image, type }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Box 
      className="card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{ position: 'relative', cursor: 'pointer' }}
    >
      <Box sx={{ position: 'relative' }}>
        <img 
          src={image} 
          alt={title} 
          className="card-image"
          style={{ 
            borderRadius: type === 'artist' ? '50%' : '4px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
          }}
        />
        {isHovered && (
          <IconButton
            sx={{
              position: 'absolute',
              bottom: '16px',
              right: '8px',
              backgroundColor: '#1DB954',
              '&:hover': {
                backgroundColor: '#1DB954',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 16px rgba(0,0,0,0.3)'
            }}
          >
            <PlayArrowIcon sx={{ color: 'black' }} />
          </IconButton>
        )}
      </Box>
      <Typography className="card-title" variant="body1" sx={{ color: 'white' }}>
        {title}
      </Typography>
      <Typography className="card-subtitle" variant="body2">
        {subtitle}
      </Typography>
    </Box>
  );
};

export default MusicCard; 