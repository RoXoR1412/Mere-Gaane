import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { getVideoDetails, formatVideoForApp, searchMusicVideos, formatSearchResultForApp } from '../api/youtubeApi';
import YouTubePlayer from '../components/YouTubePlayer';

interface Song {
  id: string;
  title: string;
  artist: string;
  cover: string;
  duration: number;
  genre?: string;
}

// Interface for song history item
interface HistoryItem {
  songId: string;
  timestamp: number;
  title: string;
  artist: string;
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
  isShuffleMode: boolean;
  toggleShuffleMode: () => void;
  playHistory: HistoryItem[];
  preventRepeat: boolean;
  togglePreventRepeat: () => void;
  likedSongs: Song[];
  isLiked: (songId: string) => boolean;
  toggleLikeSong: (song: Song) => void;
  playCollection: (songs: Song[], startIndex?: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// Maximum number of songs to keep in history
const MAX_HISTORY_ITEMS = 50;

// Local storage key for play history
const PLAY_HISTORY_KEY = 'mere-gaane-play-history';

// Local storage key for settings
const SETTINGS_KEY = 'mere-gaane-settings';

// Local storage key for liked songs
const LIKED_SONGS_KEY = 'mere-gaane-liked-songs';

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

// Extract genre from song title and artist
const extractGenre = (song: Song): string => {
  const titleAndArtist = `${song.title} ${song.artist}`.toLowerCase();
  
  // Define genre keywords
  const genreKeywords: Record<string, string[]> = {
    'bollywood': ['bollywood', 'hindi', 'film', 'filmi', 'movie'],
    'punjabi': ['punjabi', 'bhangra', 'punjab'],
    'classical': ['classical', 'carnatic', 'hindustani', 'raga', 'taal'],
    'devotional': ['bhajan', 'devotional', 'religious', 'spiritual', 'mantra'],
    'ghazal': ['ghazal', 'sufi', 'qawwali'],
    'pop': ['pop', 'dance', 'edm', 'electronic'],
    'rock': ['rock', 'metal', 'band', 'guitar'],
    'indie': ['indie', 'independent', 'alternative'],
    'folk': ['folk', 'traditional', 'regional', 'desi'],
    'romantic': ['romantic', 'love', 'romance', 'ballad']
  };
  
  // Check for genre keywords in title and artist
  for (const [genre, keywords] of Object.entries(genreKeywords)) {
    if (keywords.some(keyword => titleAndArtist.includes(keyword))) {
      return genre;
    }
  }
  
  // Default to 'unknown' if no genre is detected
  return 'unknown';
};

// Get top artists from play history
const getTopArtists = (history: HistoryItem[], limit: number = 3): string[] => {
  const artistCounts: Record<string, number> = {};
  
  // Count occurrences of each artist
  history.forEach(item => {
    const artist = item.artist.toLowerCase();
    artistCounts[artist] = (artistCounts[artist] || 0) + 1;
  });
  
  // Sort artists by count and return top ones
  return Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([artist]) => artist);
};

// Find similar songs based on the current song and listening history
const findSimilarSongs = async (
  song: Song, 
  playHistory: HistoryItem[],
  preventRepeat: boolean,
  limit: number = 5
): Promise<Song[]> => {
  try {
    // Extract genre from song title and artist if not already present
    const genre = song.genre || extractGenre(song);
    
    // Get top artists from play history
    const topArtists = getTopArtists(playHistory);
    
    // Create a more targeted search query based on genre, artist, and rhythm
    let searchQuery = `${song.title} ${song.artist}`;
    
    // Add genre to search query
    if (genre !== 'unknown') {
      searchQuery += ` ${genre} music`;
    }
    
    // Add rhythm/mood terms based on the song title
    const titleLower = song.title.toLowerCase();
    if (titleLower.includes('love') || titleLower.includes('romantic') || titleLower.includes('dil')) {
      searchQuery += ' romantic';
    } else if (titleLower.includes('dance') || titleLower.includes('party') || titleLower.includes('beat')) {
      searchQuery += ' dance beat';
    } else if (titleLower.includes('sad') || titleLower.includes('emotional')) {
      searchQuery += ' emotional';
    }
    
    // Add "similar songs" to the query
    searchQuery += ' similar songs';
    
    console.log('Searching for similar songs with query:', searchQuery);
    
    // First search for songs with the main query
    const mainResults = await searchMusicVideos(searchQuery, Math.ceil(limit * 0.6) + (preventRepeat ? 5 : 0));
    
    // Create a secondary query with one of the top artists if available
    let secondaryResults: any[] = [];
    if (topArtists.length > 0) {
      const artistQuery = `${topArtists[0]} ${genre !== 'unknown' ? genre : ''} music`;
      console.log('Searching for additional songs by favorite artist:', artistQuery);
      secondaryResults = await searchMusicVideos(artistQuery, Math.ceil(limit * 0.4) + (preventRepeat ? 3 : 0));
    }
    
    // Combine and format results
    const combinedResults = [...mainResults, ...secondaryResults];
    
    // Get list of already played song IDs if prevent repeat is enabled
    const playedSongIds = preventRepeat 
      ? playHistory.map(item => item.songId)
      : [song.id]; // Always filter out current song
    
    const formattedResults = combinedResults
      .map((result: any) => formatSearchResultForApp(result))
      // Filter out the current song, already played songs (if enabled), and ensure we only get tracks (not playlists)
      .filter((item: any) => {
        const isCurrentSong = item.id === song.id;
        const isAlreadyPlayed = preventRepeat && playedSongIds.includes(item.id);
        const isTrack = item.type === 'track';
        
        return !isCurrentSong && !isAlreadyPlayed && isTrack;
      })
      // Convert to Song type
      .map((item: any) => ({
        id: item.id,
        title: item.title,
        artist: item.artist,
        cover: item.cover,
        duration: item.duration || 0,
        genre: extractGenre({...item, duration: item.duration || 0})
      }))
      // Remove duplicates
      .filter((item, index, self) => 
        index === self.findIndex((t) => t.id === item.id)
      )
      // Limit to requested number
      .slice(0, limit);
    
    console.log('Found similar songs:', formattedResults);
    
    if (preventRepeat && formattedResults.length === 0 && playHistory.length > 0) {
      console.log('No new songs found with prevent repeat enabled. Trying without this restriction...');
      // If no songs found with prevent repeat, try again without it
      return findSimilarSongs(song, playHistory, false, limit);
    }
    
    return formattedResults;
  } catch (error) {
    console.error('Error finding similar songs:', error);
    return [];
  }
};

// Load play history from local storage
const loadPlayHistory = (): HistoryItem[] => {
  try {
    const historyJson = localStorage.getItem(PLAY_HISTORY_KEY);
    if (historyJson) {
      return JSON.parse(historyJson);
    }
  } catch (error) {
    console.error('Error loading play history:', error);
  }
  return [];
};

// Save play history to local storage
const savePlayHistory = (history: HistoryItem[]): void => {
  try {
    localStorage.setItem(PLAY_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving play history:', error);
  }
};

// Load settings from local storage
const loadSettings = (): { preventRepeat: boolean, isShuffleMode: boolean } => {
  try {
    const settingsJson = localStorage.getItem(SETTINGS_KEY);
    if (settingsJson) {
      return JSON.parse(settingsJson);
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return { preventRepeat: false, isShuffleMode: false };
};

// Save settings to local storage
const saveSettings = (settings: { preventRepeat: boolean, isShuffleMode: boolean }): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

// Load liked songs from local storage
const loadLikedSongs = (): Song[] => {
  try {
    const likedSongsJson = localStorage.getItem(LIKED_SONGS_KEY);
    if (likedSongsJson) {
      return JSON.parse(likedSongsJson);
    }
  } catch (error) {
    console.error('Error loading liked songs:', error);
  }
  return [];
};

// Save liked songs to local storage
const saveLikedSongs = (songs: Song[]): void => {
  try {
    localStorage.setItem(LIKED_SONGS_KEY, JSON.stringify(songs));
  } catch (error) {
    console.error('Error saving liked songs:', error);
  }
};

interface PlayerProviderProps {
  children: ReactNode;
}

export const PlayerProvider: React.FC<PlayerProviderProps> = ({ children }) => {
  // Load settings from local storage
  const savedSettings = loadSettings();
  
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
  const [isShuffleMode, setIsShuffleMode] = useState(savedSettings.isShuffleMode);
  const [preventRepeat, setPreventRepeat] = useState(savedSettings.preventRepeat);
  const [isLoadingSimilarSongs, setIsLoadingSimilarSongs] = useState(false);
  const [playHistory, setPlayHistory] = useState<HistoryItem[]>(loadPlayHistory());
  const [likedSongs, setLikedSongs] = useState<Song[]>(loadLikedSongs());

  // Toggle shuffle mode
  const toggleShuffleMode = useCallback(() => {
    setIsShuffleMode(prev => {
      const newValue = !prev;
      saveSettings({ preventRepeat, isShuffleMode: newValue });
      return newValue;
    });
  }, [preventRepeat]);

  // Toggle prevent repeat
  const togglePreventRepeat = useCallback(() => {
    setPreventRepeat(prev => {
      const newValue = !prev;
      saveSettings({ preventRepeat: newValue, isShuffleMode });
      return newValue;
    });
  }, [isShuffleMode]);

  // Add song to play history
  const addToPlayHistory = useCallback((song: Song) => {
    setPlayHistory(prevHistory => {
      // Create new history item
      const newItem: HistoryItem = {
        songId: song.id,
        timestamp: Date.now(),
        title: song.title,
        artist: song.artist
      };
      
      // Add to beginning of history, remove duplicates, and limit size
      const updatedHistory = [
        newItem,
        ...prevHistory.filter(item => item.songId !== song.id)
      ].slice(0, MAX_HISTORY_ITEMS);
      
      // Save to local storage
      savePlayHistory(updatedHistory);
      
      return updatedHistory;
    });
  }, []);

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
      
      // Extract genre if not present
      if (!songToPlay.genre) {
        songToPlay.genre = extractGenre(songToPlay);
      }
      
      // Add to play history
      addToPlayHistory(songToPlay);
      
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
  }, [youtubePlayer, playerReady, queue, addToPlayHistory]);

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
          } else if (isShuffleMode && currentSong) {
            // If shuffle mode is on and there are no songs in queue, find similar songs
            setIsLoadingSimilarSongs(true);
            findSimilarSongs(currentSong, playHistory, preventRepeat)
              .then(similarSongs => {
                if (similarSongs.length > 0) {
                  // Play the first similar song
                  playSong(similarSongs[0]);
                  // Add the rest to the queue
                  if (similarSongs.length > 1) {
                    setQueue(similarSongs.slice(1));
                  }
                } else {
                  setIsPlaying(false);
                  setCurrentTime(0);
                  setPlayerError('No more songs found. Try disabling "Prevent Repeats" or adding more songs to your queue.');
                }
              })
              .catch(error => {
                console.error('Error finding similar songs:', error);
                setIsPlaying(false);
                setCurrentTime(0);
              })
              .finally(() => {
                setIsLoadingSimilarSongs(false);
              });
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
  }, [queue, playSong, isShuffleMode, currentSong, playHistory, preventRepeat]);

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
    } else if (isShuffleMode && currentSong) {
      // If shuffle mode is on and there are no songs in queue, find similar songs
      setIsLoadingSimilarSongs(true);
      findSimilarSongs(currentSong, playHistory, preventRepeat)
        .then(similarSongs => {
          if (similarSongs.length > 0) {
            // Play the first similar song
            playSong(similarSongs[0]);
            // Add the rest to the queue
            if (similarSongs.length > 1) {
              setQueue(similarSongs.slice(1));
            }
          } else {
            setPlayerError('No more songs found. Try disabling "Prevent Repeats" or adding more songs to your queue.');
          }
        })
        .catch(error => {
          console.error('Error finding similar songs after player error:', error);
        })
        .finally(() => {
          setIsLoadingSimilarSongs(false);
        });
    }
  }, [queue, playSong, isShuffleMode, currentSong, playHistory, preventRepeat]);

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
    if (queue.length > 0) {
      // If there are songs in the queue, play the next one
      const nextSong = queue[0];
      const newQueue = queue.slice(1);
      setQueue(newQueue);
      playSong(nextSong);
    } else if (isShuffleMode && currentSong && !isLoadingSimilarSongs) {
      // If shuffle mode is on and there are no songs in queue, find similar songs
      setIsLoadingSimilarSongs(true);
      
      const message = preventRepeat 
        ? 'Finding new songs you haven\'t heard yet...'
        : 'Finding similar songs based on your listening history...';
      
      setPlayerError(message);
      
      findSimilarSongs(currentSong, playHistory, preventRepeat)
        .then(similarSongs => {
          if (similarSongs.length > 0) {
            // Play the first similar song
            playSong(similarSongs[0]);
            // Add the rest to the queue
            if (similarSongs.length > 1) {
              setQueue(similarSongs.slice(1));
            }
            setPlayerError(null);
          } else {
            setPlayerError('No more songs found. Try disabling "Prevent Repeats" or adding more songs to your queue.');
          }
        })
        .catch(error => {
          console.error('Error finding similar songs:', error);
          setPlayerError('Failed to find similar songs. Please try again.');
        })
        .finally(() => {
          setIsLoadingSimilarSongs(false);
        });
    }
  }, [queue, playSong, isShuffleMode, currentSong, isLoadingSimilarSongs, playHistory, preventRepeat]);

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
    // Extract genre if not present
    if (!song.genre) {
      song.genre = extractGenre(song);
    }
    
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

  // Load play history from local storage on mount
  useEffect(() => {
    setPlayHistory(loadPlayHistory());
  }, []);

  // Check if a song is liked
  const isLiked = useCallback((songId: string) => {
    return likedSongs.some(song => song.id === songId);
  }, [likedSongs]);

  // Toggle like status for a song
  const toggleLikeSong = useCallback((song: Song) => {
    setLikedSongs(prevLikedSongs => {
      const songIndex = prevLikedSongs.findIndex(s => s.id === song.id);
      let newLikedSongs: Song[];
      
      if (songIndex >= 0) {
        // Remove song from liked songs
        newLikedSongs = [...prevLikedSongs.slice(0, songIndex), ...prevLikedSongs.slice(songIndex + 1)];
      } else {
        // Add song to liked songs
        newLikedSongs = [...prevLikedSongs, song];
      }
      
      // Save to local storage
      saveLikedSongs(newLikedSongs);
      return newLikedSongs;
    });
  }, []);

  // Save settings when they change
  useEffect(() => {
    saveSettings({ preventRepeat, isShuffleMode });
  }, [preventRepeat, isShuffleMode]);

  // Play a collection of songs (e.g., liked songs, playlist)
  const playCollection = useCallback((songs: Song[], startIndex: number = 0) => {
    if (!songs || songs.length === 0) return;
    
    // Validate startIndex
    const validStartIndex = Math.max(0, Math.min(startIndex, songs.length - 1));
    
    // Play the first song
    const firstSong = songs[validStartIndex];
    
    // Add the rest to the queue
    const remainingSongs = [
      ...songs.slice(validStartIndex + 1),
      ...songs.slice(0, validStartIndex)
    ];
    
    // Clear current queue and set the new one
    setQueue(remainingSongs);
    
    // Play the first song
    playSong(firstSong);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
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
    isShuffleMode,
    toggleShuffleMode,
    playHistory,
    preventRepeat,
    togglePreventRepeat,
    likedSongs,
    isLiked,
    toggleLikeSong,
    playCollection
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
    clearQueue,
    isShuffleMode,
    toggleShuffleMode,
    playHistory,
    preventRepeat,
    togglePreventRepeat,
    likedSongs,
    isLiked,
    toggleLikeSong,
    playCollection
  ]);

  return (
    <PlayerContext.Provider value={contextValue}>
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
      {/* Display loading indicator for similar songs */}
      {isLoadingSimilarSongs && (
        <div style={{
          position: 'fixed',
          bottom: '150px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '5px',
          zIndex: 2000,
        }}>
          {preventRepeat 
            ? 'Finding new songs you haven\'t heard yet...' 
            : 'Finding similar songs based on your taste...'}
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