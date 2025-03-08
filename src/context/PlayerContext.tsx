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
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = `https://www.youtube.com/embed/${nextSongId}?autoplay=0&controls=0`;
  document.body.appendChild(iframe);
  
  // Remove the iframe after 5 seconds (enough time to buffer)
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 5000);
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

  // Handle YouTube player ready event
  const handlePlayerReady = useCallback((player: any) => {
    console.log('YouTube player is ready');
    setYoutubePlayer(player);
    setPlayerReady(true);
    player.setVolume(volume);
    
    if (currentSong) {
      player.loadVideoById(currentSong.id);
      setIsPlaying(true);
    }
  }, [volume, currentSong]);

  // Handle YouTube player state change
  const handlePlayerStateChange = useCallback((event: any) => {
    // YouTube player states:
    // -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
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
      default:
        break;
    }
  }, [queue, playSong]);

  // Handle YouTube player error
  const handlePlayerError = useCallback((event: any) => {
    console.error('YouTube player error:', event.data);
    // Try to play the next song if there's an error
    if (queue.length > 0) {
      const nextSongToPlay = queue[0];
      const newQueue = queue.slice(1);
      setQueue(newQueue);
      playSong(nextSongToPlay);
    }
  }, [queue, playSong]);

  // Play a song
  const playSong = useCallback(async (song: Song) => {
    try {
      // If the song doesn't have a duration, fetch it from the API
      let songToPlay = song;
      if (!song.duration) {
        const videoDetails = await getVideoDetails(song.id);
        songToPlay = formatVideoForApp(videoDetails);
      }
      
      setCurrentSong(songToPlay);
      setCurrentTime(0);
      setDuration(songToPlay.duration);
      
      if (youtubePlayer && playerReady) {
        youtubePlayer.loadVideoById(songToPlay.id);
        youtubePlayer.playVideo();
        setIsPlaying(true);
        
        // Pre-buffer the next song if available
        if (queue.length > 0) {
          preBufferNextSong(queue[0].id);
        }
      }
    } catch (error) {
      console.error('Error playing song:', error);
    }
  }, [youtubePlayer, playerReady, queue]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (!currentSong || !youtubePlayer || !playerReady) return;
    
    if (isPlaying) {
      youtubePlayer.pauseVideo();
    } else {
      youtubePlayer.playVideo();
    }
  }, [currentSong, youtubePlayer, playerReady, isPlaying]);

  // Set volume
  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    if (youtubePlayer && playerReady) {
      youtubePlayer.setVolume(newVolume);
    }
  }, [youtubePlayer, playerReady]);

  // Seek to a specific time
  const seekTo = useCallback((time: number) => {
    if (!currentSong || !youtubePlayer || !playerReady) return;
    youtubePlayer.seekTo(time, true);
    setCurrentTime(time);
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
      youtubePlayer.seekTo(0, true);
      setCurrentTime(0);
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