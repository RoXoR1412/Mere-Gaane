import React, { useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  videoId: string;
  onReady: (player: any) => void;
  onStateChange?: (event: any) => void;
  onError?: (event: any) => void;
}

// Load YouTube API script only once
let youtubeApiLoaded = false;

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ 
  videoId, 
  onReady, 
  onStateChange, 
  onError 
}) => {
  const playerRef = useRef<HTMLDivElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  
  // Memoize the initialization function for better performance
  const initializePlayer = useCallback(() => {
    if (!playerRef.current) return;
    
    // If player already exists, just load the new video
    if (youtubePlayerRef.current) {
      youtubePlayerRef.current.loadVideoById(videoId);
      return;
    }

    try {
      youtubePlayerRef.current = new window.YT.Player(playerRef.current, {
        height: '0',
        width: '0',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          origin: window.location.origin,
          playsinline: 1,
        },
        events: {
          onReady: (event: any) => {
            console.log('YouTube player ready');
            // Set playback quality to improve performance
            const player = event.target;
            player.setPlaybackQuality('small'); // Use lower quality for better performance
            onReady(player);
          },
          onStateChange: onStateChange,
          onError: (event: any) => {
            console.error('YouTube player error:', event.data);
            if (onError) onError(event);
          },
        },
      });
    } catch (error) {
      console.error('Error initializing YouTube player:', error);
    }
  }, [videoId, onReady, onStateChange, onError]);

  useEffect(() => {
    // Load the YouTube iframe API if it's not already loaded
    if (!youtubeApiLoaded) {
      youtubeApiLoaded = true;
      
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true; // Load asynchronously for better performance
      
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        console.log('YouTube API ready');
        initializePlayer();
      };
    } else if (window.YT && window.YT.Player) {
      // If API is already loaded, initialize player directly
      initializePlayer();
    } else {
      // If API is loading but not ready yet, wait for it
      window.onYouTubeIframeAPIReady = initializePlayer;
    }

    return () => {
      // Clean up the player when component unmounts
      if (youtubePlayerRef.current) {
        try {
          youtubePlayerRef.current.destroy();
        } catch (error) {
          console.error('Error destroying YouTube player:', error);
        }
      }
    };
  }, [initializePlayer]);

  useEffect(() => {
    // Update video when videoId changes
    if (youtubePlayerRef.current && videoId) {
      try {
        youtubePlayerRef.current.loadVideoById(videoId);
      } catch (error) {
        console.error('Error loading video:', error);
        // Reinitialize player if loading fails
        initializePlayer();
      }
    }
  }, [videoId, initializePlayer]);

  return <div ref={playerRef} style={{ display: 'none' }} />;
};

export default React.memo(YouTubePlayer); // Use memo for better performance 