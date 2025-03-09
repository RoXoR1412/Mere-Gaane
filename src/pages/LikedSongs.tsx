import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  IconButton, 
  Divider, 
  Container, 
  Paper,
  Grid,
  Tooltip,
  useTheme,
  useMediaQuery,
  Button,
  alpha
} from '@mui/material';
import { 
  PlayArrow, 
  Favorite, 
  AccessTime, 
  Delete,
  Shuffle,
  PlaylistPlay,
  FavoriteBorder,
  MoreHoriz,
  PauseCircleFilled,
  PlayCircleFilled
} from '@mui/icons-material';
import { usePlayer } from '../context/PlayerContext';
import { formatTime } from '../utils/formatters';

const LikedSongs: React.FC = () => {
  const { 
    likedSongs, 
    playSong, 
    toggleLikeSong, 
    currentSong,
    playCollection,
    isPlaying,
    togglePlay
  } = usePlayer();
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [hoveredSong, setHoveredSong] = useState<string | null>(null);

  const handlePlayAll = () => {
    if (likedSongs.length > 0) {
      playCollection(likedSongs);
    }
  };

  const handleShufflePlay = () => {
    if (likedSongs.length > 0) {
      // Create a shuffled copy of liked songs
      const shuffledSongs = [...likedSongs].sort(() => Math.random() - 0.5);
      playCollection(shuffledSongs);
    }
  };

  const isCurrentlyPlaying = (songId: string) => {
    return currentSong?.id === songId && isPlaying;
  };

  if (likedSongs.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            background: '#181818',
            color: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          }}
        >
          <Favorite sx={{ fontSize: 80, color: '#1DB954', mb: 3, opacity: 0.8 }} />
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            Songs you like will appear here
          </Typography>
          <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" sx={{ maxWidth: '600px', mx: 'auto', mb: 4 }}>
            Save songs by tapping the heart icon while playing a song.
          </Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            size="large"
            sx={{ 
              borderRadius: '500px', 
              px: 4, 
              py: 1.2,
              borderColor: 'white',
              color: 'white',
              '&:hover': {
                borderColor: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
            onClick={() => window.location.href = '/search'}
          >
            Find Songs
          </Button>
        </Paper>
      </Container>
    );
  }

  const headerImage = likedSongs[0]?.cover || '';

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #121212 0%, #121212 100%)',
      color: 'white',
      pb: 12
    }}>
      {/* Header with gradient and image */}
      <Box sx={{ 
        position: 'relative',
        height: { xs: '30vh', sm: '40vh' },
        background: `linear-gradient(to bottom, ${alpha('#1DB954', 0.8)} 0%, ${alpha('#121212', 0.9)} 100%)`,
        display: 'flex',
        alignItems: 'flex-end',
        p: { xs: 2, sm: 4 },
        mb: 3
      }}>
        <Box sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${headerImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.2,
          zIndex: 0
        }} />
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'flex-end',
          position: 'relative',
          zIndex: 1,
          width: '100%'
        }}>
          <Box sx={{ 
            width: { xs: 120, sm: 192, md: 232 },
            height: { xs: 120, sm: 192, md: 232 },
            boxShadow: '0 4px 60px rgba(0, 0, 0, 0.5)',
            backgroundColor: '#282828',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: { xs: 2, sm: 4 }
          }}>
            <Favorite sx={{ 
              fontSize: { xs: 60, sm: 100, md: 120 }, 
              color: '#1DB954' 
            }} />
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="overline" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
              PLAYLIST
            </Typography>
            <Typography variant="h2" sx={{ 
              fontWeight: 900, 
              fontSize: { xs: '2rem', sm: '3rem', md: '5rem' },
              mb: 1
            }}>
              Liked Songs
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
              {likedSongs.length} {likedSongs.length === 1 ? 'song' : 'songs'}
            </Typography>
          </Box>
        </Box>
      </Box>
      
      {/* Action buttons */}
      <Container maxWidth="lg" sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton 
            onClick={handlePlayAll}
            sx={{ 
              width: { xs: 56, sm: 64 },
              height: { xs: 56, sm: 64 },
              backgroundColor: '#1DB954',
              color: 'white',
              mr: 2,
              '&:hover': {
                backgroundColor: '#1ed760',
                transform: 'scale(1.04)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            <PlayArrow sx={{ fontSize: { xs: 32, sm: 38 } }} />
          </IconButton>
          
          <IconButton 
            onClick={handleShufflePlay}
            sx={{ 
              color: '#1DB954',
              '&:hover': {
                color: '#1ed760',
                backgroundColor: 'rgba(29, 185, 84, 0.1)'
              }
            }}
          >
            <Shuffle fontSize="large" />
          </IconButton>
          
          <IconButton 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              ml: 1,
              '&:hover': {
                color: 'white'
              }
            }}
          >
            <MoreHoriz />
          </IconButton>
        </Box>
        
        {/* Table header */}
        <Grid container sx={{ 
          px: 2, 
          py: 1, 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: { xs: 'none', sm: 'flex' },
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '0.875rem',
          fontWeight: 500
        }}>
          <Grid item xs={1}>#</Grid>
          <Grid item xs={5}>TITLE</Grid>
          <Grid item xs={4}>ARTIST</Grid>
          <Grid item xs={2} sx={{ textAlign: 'right', pr: 6 }}>
            <AccessTime fontSize="small" />
          </Grid>
        </Grid>

        {/* Song list */}
        <List sx={{ width: '100%', p: 0 }}>
          {likedSongs.map((song, index) => {
            const isCurrentSong = currentSong?.id === song.id;
            const isHovered = hoveredSong === song.id;
            
            return (
              <ListItem 
                key={song.id}
                sx={{ 
                  py: 1,
                  px: 2,
                  backgroundColor: isCurrentSong 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : isHovered 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'transparent',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s ease',
                  '&:hover': {
                    backgroundColor: isCurrentSong 
                      ? 'rgba(255, 255, 255, 0.15)' 
                      : 'rgba(255, 255, 255, 0.05)'
                  },
                  color: isCurrentSong ? '#1DB954' : 'white'
                }}
                onMouseEnter={() => setHoveredSong(song.id)}
                onMouseLeave={() => setHoveredSong(null)}
              >
                {/* Number/Play button */}
                <Box sx={{ 
                  width: '40px', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isCurrentSong ? '#1DB954' : 'inherit'
                }}>
                  {isHovered ? (
                    <Box 
                      onClick={() => isCurrentlyPlaying(song.id) ? togglePlay() : playSong(song)}
                      sx={{ 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {isCurrentlyPlaying(song.id) ? (
                        <PauseCircleFilled sx={{ fontSize: 24 }} />
                      ) : (
                        <PlayCircleFilled sx={{ fontSize: 24 }} />
                      )}
                    </Box>
                  ) : (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: isCurrentSong ? 700 : 400,
                        color: isCurrentSong ? '#1DB954' : 'inherit'
                      }}
                    >
                      {index + 1}
                    </Typography>
                  )}
                </Box>
                
                {/* Song info with cover */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  flex: 1,
                  minWidth: 0,
                  ml: 1
                }}>
                  <Avatar 
                    src={song.cover} 
                    alt={song.title}
                    variant="square"
                    sx={{ 
                      width: 40, 
                      height: 40,
                      mr: 2,
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
                    }}
                  />
                  
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography 
                      variant="body1" 
                      noWrap
                      sx={{ 
                        fontWeight: isCurrentSong ? 700 : 400,
                        color: isCurrentSong ? '#1DB954' : 'white'
                      }}
                    >
                      {song.title}
                    </Typography>
                    
                    {isMobile && (
                      <Typography 
                        variant="body2" 
                        noWrap
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.7)'
                        }}
                      >
                        {song.artist}
                      </Typography>
                    )}
                  </Box>
                </Box>
                
                {/* Artist (hidden on mobile) */}
                {!isMobile && (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      width: '33%',
                      color: 'rgba(255, 255, 255, 0.7)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {song.artist}
                  </Typography>
                )}
                
                {/* Duration and actions */}
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  ml: 'auto',
                  minWidth: isMobile ? 'auto' : '80px',
                  justifyContent: 'flex-end'
                }}>
                  <IconButton 
                    size="small"
                    onClick={() => toggleLikeSong(song)}
                    sx={{ 
                      color: '#1DB954',
                      opacity: isHovered ? 1 : 0.7,
                      mr: 1
                    }}
                  >
                    <Favorite fontSize="small" />
                  </IconButton>
                  
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.7)',
                      minWidth: '40px',
                      textAlign: 'right'
                    }}
                  >
                    {formatTime(song.duration)}
                  </Typography>
                  
                  {isHovered && (
                    <IconButton 
                      size="small"
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        ml: 1
                      }}
                    >
                      <MoreHoriz fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </ListItem>
            );
          })}
        </List>
      </Container>
    </Box>
  );
};

export default LikedSongs; 