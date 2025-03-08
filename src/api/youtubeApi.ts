import axios from 'axios';

// Get API key from environment variables
const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Create an axios instance with default config for better performance
const youtubeAxios = axios.create({
  baseURL: BASE_URL,
  params: {
    key: API_KEY
  },
  timeout: 5000 // 5 second timeout
});

// Cache for API responses to reduce duplicate requests
const apiCache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Interface for search results
export interface YouTubeSearchResult {
  id: {
    kind: string;
    videoId?: string;
    playlistId?: string;
    channelId?: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
    channelTitle: string;
    publishedAt: string;
  };
}

// Interface for video details
export interface YouTubeVideoDetails {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
      standard?: { url: string; width: number; height: number };
      maxres?: { url: string; width: number; height: number };
    };
    channelTitle: string;
    publishedAt: string;
  };
  contentDetails: {
    duration: string; // ISO 8601 format
  };
}

// Helper function to check cache
const getCachedData = (cacheKey: string) => {
  const cachedItem = apiCache[cacheKey];
  if (cachedItem && Date.now() - cachedItem.timestamp < CACHE_EXPIRY) {
    console.log('Using cached data for:', cacheKey);
    return cachedItem.data;
  }
  return null;
};

// Helper function to set cache
const setCachedData = (cacheKey: string, data: any) => {
  apiCache[cacheKey] = {
    data,
    timestamp: Date.now()
  };
};

// Search for music videos with caching
export const searchMusicVideos = async (query: string, maxResults: number = 10) => {
  const cacheKey = `search_videos_${query}_${maxResults}`;
  const cachedData = getCachedData(cacheKey);
  
  if (cachedData) return cachedData;
  
  try {
    const response = await youtubeAxios.get('/search', {
      params: {
        part: 'snippet',
        maxResults,
        q: `${query} music`,
        type: 'video',
        videoCategoryId: '10', // Music category
      },
    });
    
    const results = response.data.items as YouTubeSearchResult[];
    setCachedData(cacheKey, results);
    return results;
  } catch (error) {
    console.error('Error searching YouTube videos:', error);
    throw error;
  }
};

// Get video details including duration with caching
export const getVideoDetails = async (videoId: string) => {
  const cacheKey = `video_details_${videoId}`;
  const cachedData = getCachedData(cacheKey);
  
  if (cachedData) return cachedData;
  
  try {
    const response = await youtubeAxios.get('/videos', {
      params: {
        part: 'snippet,contentDetails',
        id: videoId,
      },
    });
    
    const videoDetails = response.data.items[0] as YouTubeVideoDetails;
    setCachedData(cacheKey, videoDetails);
    return videoDetails;
  } catch (error) {
    console.error('Error getting video details:', error);
    throw error;
  }
};

// Search for playlists with caching
export const searchPlaylists = async (query: string, maxResults: number = 10) => {
  const cacheKey = `search_playlists_${query}_${maxResults}`;
  const cachedData = getCachedData(cacheKey);
  
  if (cachedData) return cachedData;
  
  try {
    const response = await youtubeAxios.get('/search', {
      params: {
        part: 'snippet',
        maxResults,
        q: `${query} playlist`,
        type: 'playlist',
      },
    });
    
    const results = response.data.items as YouTubeSearchResult[];
    setCachedData(cacheKey, results);
    return results;
  } catch (error) {
    console.error('Error searching YouTube playlists:', error);
    throw error;
  }
};

// Get playlist items with caching
export const getPlaylistItems = async (playlistId: string, maxResults: number = 50) => {
  const cacheKey = `playlist_items_${playlistId}_${maxResults}`;
  const cachedData = getCachedData(cacheKey);
  
  if (cachedData) return cachedData;
  
  try {
    const response = await youtubeAxios.get('/playlistItems', {
      params: {
        part: 'snippet',
        maxResults,
        playlistId,
      },
    });
    
    const results = response.data.items as YouTubeSearchResult[];
    setCachedData(cacheKey, results);
    return results;
  } catch (error) {
    console.error('Error getting playlist items:', error);
    throw error;
  }
};

// Parse ISO 8601 duration to seconds - optimized version
export const parseDuration = (duration: string): number => {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  
  const hours = parseInt(match?.[1] || '0');
  const minutes = parseInt(match?.[2] || '0');
  const seconds = parseInt(match?.[3] || '0');
  
  return hours * 3600 + minutes * 60 + seconds;
};

// Format video for our app - with optimized thumbnail selection
export const formatVideoForApp = (video: YouTubeVideoDetails) => {
  // Choose the best available thumbnail
  const thumbnail = 
    video.snippet.thumbnails.maxres?.url || 
    video.snippet.thumbnails.standard?.url || 
    video.snippet.thumbnails.high.url;
    
  return {
    id: video.id,
    title: video.snippet.title,
    artist: video.snippet.channelTitle,
    cover: thumbnail,
    duration: parseDuration(video.contentDetails.duration),
  };
};

// Format search result for our app - with optimized thumbnail selection
export const formatSearchResultForApp = (result: YouTubeSearchResult) => {
  return {
    id: result.id.videoId || result.id.playlistId || '',
    title: result.snippet.title,
    artist: result.snippet.channelTitle,
    cover: result.snippet.thumbnails.high.url,
    type: result.id.videoId ? 'track' : result.id.playlistId ? 'playlist' : 'artist',
  };
}; 