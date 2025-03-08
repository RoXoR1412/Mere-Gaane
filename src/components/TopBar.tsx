import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, IconButton, InputBase, Avatar } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

interface TopBarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearch?: (e: React.FormEvent) => void;
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ 
  searchQuery = '', 
  onSearchChange, 
  onSearch,
  darkMode = true,
  toggleDarkMode
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isSearchPage = location.pathname === '/search';

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearchChange) {
      onSearchChange(e.target.value);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(e);
    }
  };

  return (
    <Box className="top-bar">
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <IconButton
          sx={{ color: 'white', marginRight: '16px' }}
          onClick={() => navigate(-1)}
        >
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>
        <IconButton
          sx={{ color: 'white', marginRight: '16px' }}
          onClick={() => navigate(1)}
        >
          <ArrowForwardIosIcon fontSize="small" />
        </IconButton>

        {isSearchPage && (
          <Box sx={{ position: 'relative', flexGrow: 1, maxWidth: '500px' }}>
            <form onSubmit={handleSearchSubmit}>
              <SearchIcon sx={{ position: 'absolute', left: '16px', top: '8px', color: '#000' }} />
              <InputBase
                placeholder="What do you want to listen to?"
                className="search-input"
                inputProps={{ 'aria-label': 'search' }}
                value={searchQuery}
                onChange={handleSearchInputChange}
              />
            </form>
          </Box>
        )}

        <Box sx={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          {toggleDarkMode && (
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <IconButton onClick={toggleDarkMode} color="inherit">
                {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Box>
          )}
          <Avatar sx={{ bgcolor: '#282828', width: 32, height: 32 }}>
            <AccountCircleIcon />
          </Avatar>
        </Box>
      </Box>
    </Box>
  );
};

export default TopBar; 