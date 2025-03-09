import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { getVideoDetails, formatVideoForApp } from '../api/youtubeApi';
import YouTubePlayer from '../components/YouTubePlayer';

interface Song {
  id: string;
  title: string;
  artist: string;
  cover: string;
  duration: number;
}

interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  queue: Song[];
  playSong: (song: Song) => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  seekTo: (time: number) => void;
  nextSong: () => void;
  prevSong: () => void;
  addToQueue: (song: Song) => void;
  clearQueue: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// Pre-buffer the next song in queue
const preBufferNextSong = (nextSongId: string) => {
  try {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = `https://www.youtube.com/embed/${nextSongId}?autoplay=0&controls=0`;
    document.body.appendChild(iframe);
    
    // Remove the iframe after 5 seconds (enough time to buffer)
    setTimeout(() => {
      try {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      } catch (error) {
        console.error('Error removing pre-buffer iframe:', error);
      }
    }, 5000);
  } catch (error) {
    console.error('Error pre-buffering song:', error);
  }
};

interface PlayerProviderProps {
  children: ReactNode;
}

export const PlayerProvider: React.FC<PlayerProviderProps> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(70);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState<Song[]>([]);
  const [youtubePlayer, setYoutubePlayer] = useState<any>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  // Define playSong function first to avoid circular dependency
  const playSong = useCallback(async (song: Song) => {
    try {
      console.log('Attempting to play song:', song);
      setPlayerError(null);
      
      // If the song doesn't have a duration, fetch it from the API
      let songToPlay = song;
      if (!song.duration) {
        console.log('Fetching video details for song:', song.id);
        try {
          const videoDetails = await getVideoDetails(song.id);
          songToPlay = formatVideoForApp(videoDetails);
          console.log('Got video details:', songToPlay);
        } catch (error) {
          console.error('Error fetching video details:', error);
          // Use the original song if we can't get details
          songToPlay = { ...song, duration: 0 };
        }
      }
      
      setCurrentSong(songToPlay);
      setCurrentTime(0);
      setDuration(songToPlay.duration || 0);
      
      if (youtubePlayer && playerReady) {
        console.log('YouTube player ready, loading video:', songToPlay.id);
        try {
          youtubePlayer.loadVideoById(songToPlay.id);
          youtubePlayer.playVideo();
          setIsPlaying(true);
        } catch (error) {
          console.error('Error playing video with YouTube player:', error);
          setPlayerError('Failed to play video. Please try again.');
        }
        
        // Pre-buffer the next song if available
        if (queue.length > 0) {
          try {
            preBufferNextSong(queue[0].id);
          } catch (error) {
            console.error('Error pre-buffering next song:', error);
          }
        }
      } else {
        console.log('YouTube player not ready yet, song will play when player is ready');
      }
    } catch (error) {
      console.error('Error playing song:', error);
      setPlayerError('An error occurred while playing the song.');
    }
  }, [youtubePlayer, playerReady, queue]);

  // Handle YouTube player ready event
  const handlePlayerReady = useCallback((player: any) => {
    console.log('YouTube player is ready');
    setYoutubePlayer(player);
    setPlayerReady(true);
    setPlayerError(null);
    
    try {
      player.setVolume(volume);
      
      if (currentSong) {
        console.log('Loading current song into ready player:', currentSong.id);
        player.loadVideoById(currentSong.id);
        player.playVideo();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error in handlePlayerReady:', error);
      setPlayerError('Failed to initialize player. Please refresh the page.');
    }
  }, [volume, currentSong]);

  // Handle YouTube player state change
  const handlePlayerStateChange = useCallback((event: any) => {
    try {
      // YouTube player states:
      // -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
      console.log('YouTube player state changed:', event.data);
      
      switch (event.data) {
        case 0: // ended
          if (queue.length > 0) {
            const nextSongToPlay = queue[0];
            const newQueue = queue.slice(1);
            setQueue(newQueue);
            playSong(nextSongToPlay);
          } else {
            setIsPlaying(false);
            setCurrentTime(0);
          }
          break;
        case 1: // playing
          setIsPlaying(true);
          setIsBuffering(false);
          setPlayerError(null);
          break;
        case 2: // paused
          setIsPlaying(false);
          break;
        case 3: // buffering
          setIsBuffering(true);
          break;
        case 5: // video cued
          // Pre-buffer the next song if available
          if (queue.length > 0) {
            preBufferNextSong(queue[0].id);
          }
          break;
        case -1: // unstarted
          // This is normal when a video is first loaded
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error handling player state change:', error);
    }
  }, [queue, playSong]);

  // Handle YouTube player error
  const handlePlayerError = useCallback((event: any) => {
    // YouTube error codes:
    // 2 – The request contains an invalid parameter value
    // 5 – The requested content cannot be played in an HTML5 player
    // 100 – The video requested was not found
    // 101 – The owner of the requested video does not allow it to be played in embedded players
    // 150 – Same as 101, just different error code
    
    let errorMessage = 'An error occurred while playing the video.';
    
    switch (event.data) {
      case 2:
        errorMessage = 'Invalid video parameters. Please try another song.';
        break;
      case 5:
        errorMessage = 'This video cannot be played in the player. Please try another song.';
        break;
      case 100:
        errorMessage = 'The requested video was not found. Please try another song.';
        break;
      case 101:
      case 150:
        errorMessage = 'This video cannot be played in embedded players. Please try another song.';
        break;
      default:
        errorMessage = `YouTube player error (${event.data}). Please try another song.`;
        break;
    }
    
    console.error('YouTube player error:', event.data, errorMessage);
    setPlayerError(errorMessage);
    
    // Try to play the next song if there's an error
    if (queue.length > 0) {
      const nextSongToPlay = queue[0];
      const newQueue = queue.slice(1);
      setQueue(newQueue);
      playSong(nextSongToPlay);
    }
  }, [queue, playSong]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (!currentSong || !youtubePlayer || !playerReady) return;
    
    try {
      if (isPlaying) {
        youtubePlayer.pauseVideo();
      } else {
        youtubePlayer.playVideo();
      }
    } catch (error) {
      console.error('Error toggling play state:', error);
      setPlayerError('Failed to control playback. Please refresh the page.');
    }
  }, [currentSong, youtubePlayer, playerReady, isPlaying]);

  // Set volume
  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    if (youtubePlayer && playerReady) {
      try {
        youtubePlayer.setVolume(newVolume);
      } catch (error) {
        console.error('Error setting volume:', error);
      }
    }
  }, [youtubePlayer, playerReady]);

  // Seek to a specific time
  const seekTo = useCallback((time: number) => {
    if (!currentSong || !youtubePlayer || !playerReady) return;
    try {
      youtubePlayer.seekTo(time, true);
      setCurrentTime(time);
    } catch (error) {
      console.error('Error seeking to time:', error);
    }
  }, [currentSong, youtubePlayer, playerReady]);

  // Play next song in queue
  const nextSong = useCallback(() => {
    if (queue.length === 0) return;
    
    const nextSong = queue[0];
    const newQueue = queue.slice(1);
    
    setQueue(newQueue);
    playSong(nextSong);
  }, [queue, playSong]);

  // Play previous song
  const prevSong = useCallback(() => {
    // In a real implementation, we would keep track of play history
    // For now, we'll just restart the current song
    if (currentSong && youtubePlayer && playerReady) {
      try {
        youtubePlayer.seekTo(0, true);
        setCurrentTime(0);
      } catch (error) {
        console.error('Error seeking to beginning of song:', error);
      }
    }
  }, [currentSong, youtubePlayer, playerReady]);

  // Add a song to the queue
  const addToQueue = useCallback((song: Song) => {
    setQueue(prevQueue => {
      const newQueue = [...prevQueue, song];
      
      // If this is the first song in the queue and we have a player,
      // pre-buffer it for faster playback later
      if (prevQueue.length === 0 && youtubePlayer && playerReady) {
        preBufferNextSong(song.id);
      }
      
      return newQueue;
    });
  }, [youtubePlayer, playerReady]);

  // Clear the queue
  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  // Update current time periodically when playing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && youtubePlayer && playerReady && !isBuffering) {
      interval = setInterval(() => {
        try {
          const currentTime = Math.floor(youtubePlayer.getCurrentTime());
          setCurrentTime(currentTime);
        } catch (error) {
          console.error('Error getting current time:', error);
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, youtubePlayer, playerReady, isBuffering]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    currentSong,
    isPlaying,
    volume,
    currentTime,
    duration,
    queue,
    playSong,
    togglePlay,
    setVolume,
    seekTo,
    nextSong,
    prevSong,
    addToQueue,
    clearQueue,
  }), [
    currentSong,
    isPlaying,
    volume,
    currentTime,
    duration,
    queue,
    playSong,
    togglePlay,
    setVolume,
    seekTo,
    nextSong,
    prevSong,
    addToQueue,
    clearQueue
  ]);

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {/* Render the YouTube player component */}
      {currentSong && (
        <YouTubePlayer
          videoId={currentSong.id}
          onReady={handlePlayerReady}
          onStateChange={handlePlayerStateChange}
          onError={handlePlayerError}
        />
      )}
      {/* Display error message if there's a player error */}
      {playerError && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(255, 0, 0, 0.8)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '5px',
          zIndex: 2000,
        }}>
          {playerError}
        </div>
      )}
    </PlayerContext.Provider>
  );
};

export const usePlayer = (): PlayerContextType => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}; 