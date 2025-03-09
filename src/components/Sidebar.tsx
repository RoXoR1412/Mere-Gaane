import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, Typography, Divider, Badge } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import AddBoxIcon from '@mui/icons-material/AddBox';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { usePlayer } from '../context/PlayerContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { likedSongs } = usePlayer();

  return (
    <Box className="sidebar">
      <Box sx={{ padding: '0 24px', marginBottom: '24px' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white' }}>
          मेरे गाने
        </Typography>
      </Box>

      <Box>
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          <HomeIcon />
          <span>Home</span>
        </Link>
        <Link to="/search" className={`nav-link ${location.pathname === '/search' ? 'active' : ''}`}>
          <SearchIcon />
          <span>Search</span>
        </Link>
        <Link to="/library" className={`nav-link ${location.pathname === '/library' ? 'active' : ''}`}>
          <LibraryMusicIcon />
          <span>Your Library</span>
        </Link>
      </Box>

      <Box sx={{ marginTop: '24px' }}>
        <Link to="/create-playlist" className="nav-link">
          <AddBoxIcon />
          <span>Create Playlist</span>
        </Link>
        <Link to="/liked-songs" className={`nav-link ${location.pathname === '/liked-songs' ? 'active' : ''}`}>
          <Badge 
            badgeContent={likedSongs.length > 0 ? likedSongs.length : null} 
            color="error"
            sx={{ 
              '& .MuiBadge-badge': {
                fontSize: '0.6rem',
                height: '16px',
                minWidth: '16px',
                padding: '0 4px'
              }
            }}
          >
            <FavoriteIcon color={location.pathname === '/liked-songs' ? 'primary' : 'inherit'} />
          </Badge>
          <span>Liked Songs</span>
        </Link>
      </Box>

      <Divider sx={{ margin: '24px 0', backgroundColor: '#282828' }} />

      <Box sx={{ padding: '0 24px' }}>
        <Typography variant="body2" sx={{ color: '#b3b3b3', marginBottom: '16px' }}>
          PLAYLISTS
        </Typography>
        <Typography variant="body2" sx={{ color: '#b3b3b3', marginBottom: '8px' }}>
          Hindi Hits
        </Typography>
        <Typography variant="body2" sx={{ color: '#b3b3b3', marginBottom: '8px' }}>
          Bollywood Classics
        </Typography>
        <Typography variant="body2" sx={{ color: '#b3b3b3', marginBottom: '8px' }}>
          Punjabi Beats
        </Typography>
        <Typography variant="body2" sx={{ color: '#b3b3b3', marginBottom: '8px' }}>
          Indie Discoveries
        </Typography>
      </Box>
    </Box>
  );
};

export default Sidebar; 