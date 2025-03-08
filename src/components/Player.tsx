import React, { useState, useEffect, useRef, memo } from 'react';
import { Box, IconButton, Slider, Typography, Grid, Avatar, Paper } from '@mui/material';
import { PlayArrow, Pause, SkipNext, SkipPrevious, VolumeUp, VolumeOff } from '@mui/icons-material';
import { usePlayer } from '../context/PlayerContext';

// Helper function to format time (e.g., 125 seconds -> "2:05")
const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

// Memoized song info component to prevent unnecessary re-renders
const SongInfo = memo(({ title, artist, cover }: { title: string, artist: string, cover: string }) => (
  <Grid container spacing={2} alignItems="center" sx={{ width: '30%' }}>
    <Grid item>
      <Avatar
        src={cover}
        alt={title}
        sx={{ width: 50, height: 50, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
      />
    </Grid>
    <Grid item sx={{ overflow: 'hidden' }}>
      <Typography variant="subtitle1" noWrap sx={{ fontWeight: 'bold' }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" noWrap>
        {artist}
      </Typography>
    </Grid>
  </Grid>
));

// Memoized controls component
const PlayerControls = memo(({ 
  isPlaying, 
  togglePlay, 
  nextSong, 
  prevSong,
  hasQueue
}: { 
  isPlaying: boolean, 
  togglePlay: () => void, 
  nextSong: () => void, 
  prevSong: () => void,
  hasQueue: boolean
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <IconButton onClick={prevSong} color="primary">
      <SkipPrevious />
    </IconButton>
    <IconButton onClick={togglePlay} color="primary" sx={{ mx: 1 }}>
      {isPlaying ? <Pause /> : <PlayArrow />}
    </IconButton>
    <IconButton 
      onClick={nextSong} 
      color="primary"
      disabled={!hasQueue}
      sx={{ opacity: hasQueue ? 1 : 0.5 }}
    >
      <SkipNext />
    </IconButton>
  </Box>
));

// Memoized progress component
const ProgressBar = memo(({ 
  currentTime, 
  duration, 
  seekTo 
}: { 
  currentTime: number, 
  duration: number, 
  seekTo: (time: number) => void 
}) => {
  const [localValue, setLocalValue] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // Update local value when currentTime changes, but only if not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalValue(currentTime);
    }
  }, [currentTime, isDragging]);
  
  const handleChange = (_: Event, newValue: number | number[]) => {
    setLocalValue(newValue as number);
    setIsDragging(true);
  };
  
  const handleChangeCommitted = (_: React.SyntheticEvent | Event, newValue: number | number[]) => {
    seekTo(newValue as number);
    setIsDragging(false);
  };
  
  return (
    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', px: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mr: 1, minWidth: '40px' }}>
        {formatTime(localValue)}
      </Typography>
      <Slider
        value={localValue}
        min={0}
        max={duration || 100}
        onChange={handleChange}
        onChangeCommitted={handleChangeCommitted}
        sx={{ mx: 1 }}
      />
      <Typography variant="body2" color="text.secondary" sx={{ ml: 1, minWidth: '40px' }}>
        {formatTime(duration)}
      </Typography>
    </Box>
  );
});

// Memoized volume control component
const VolumeControl = memo(({ 
  volume, 
  setVolume 
}: { 
  volume: number, 
  setVolume: (volume: number) => void 
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const previousVolume = useRef(volume);
  
  const handleVolumeChange = (_: Event, newValue: number | number[]) => {
    const newVolume = newValue as number;
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    } else if (newVolume === 0 && !isMuted) {
      setIsMuted(true);
    }
  };
  
  const toggleMute = () => {
    if (isMuted) {
      setVolume(previousVolume.current || 50);
      setIsMuted(false);
    } else {
      previousVolume.current = volume;
      setVolume(0);
      setIsMuted(true);
    }
  };
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '20%' }}>
      <IconButton onClick={toggleMute} size="small">
        {isMuted || volume === 0 ? <VolumeOff /> : <VolumeUp />}
      </IconButton>
      <Slider
        value={volume}
        min={0}
        max={100}
        onChange={handleVolumeChange}
        sx={{ width: 100, ml: 1 }}
        size="small"
      />
    </Box>
  );
});

const Player: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    volume,
    currentTime,
    duration,
    queue,
    togglePlay,
    setVolume,
    seekTo,
    nextSong,
    prevSong,
  } = usePlayer();

  // Don't render anything if there's no current song
  if (!currentSong) return null;

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        p: 1,
        backgroundColor: 'background.paper',
        zIndex: 1000,
        borderTop: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <SongInfo
          title={currentSong.title}
          artist={currentSong.artist}
          cover={currentSong.cover}
        />
        
        <PlayerControls
          isPlaying={isPlaying}
          togglePlay={togglePlay}
          nextSong={nextSong}
          prevSong={prevSong}
          hasQueue={queue.length > 0}
        />
        
        <VolumeControl
          volume={volume}
          setVolume={setVolume}
        />
      </Box>
      
      <ProgressBar
        currentTime={currentTime}
        duration={duration}
        seekTo={seekTo}
      />
    </Paper>
  );
};

export default memo(Player); 