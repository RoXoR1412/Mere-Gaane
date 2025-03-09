import React, { useEffect, useRef } from 'react';

// Declare YouTube IFrame API types
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: {
          videoId?: string;
          height?: string | number;
          width?: string | number;
          playerVars?: {
            autoplay?: 0 | 1;
            controls?: 0 | 1;
            disablekb?: 0 | 1;
            enablejsapi?: 0 | 1;
            iv_load_policy?: 1 | 3;
            modestbranding?: 0 | 1;
            rel?: 0 | 1;
            showinfo?: 0 | 1;
            origin?: string;
            playsinline?: 0 | 1;
          };
          events?: {
            onReady?: (event: { target: any }) => void;
            onStateChange?: (event: { data: number }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => void;
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  videoId: string;
  onReady: (player: any) => void;
  onStateChange?: (event: any) => void;
  onError?: (event: any) => void;
}

// Create a singleton to manage YouTube API loading
class YouTubeAPILoader {
  private static instance: YouTubeAPILoader;
  private isLoading: boolean = false;
  private isLoaded: boolean = false;
  private callbacks: (() => void)[] = [];

  private constructor() {}

  public static getInstance(): YouTubeAPILoader {
    if (!YouTubeAPILoader.instance) {
      YouTubeAPILoader.instance = new YouTubeAPILoader();
    }
    return YouTubeAPILoader.instance;
  }

  public loadAPI(callback: () => void): void {
    // If already loaded, call the callback immediately
    if (this.isLoaded && window.YT && window.YT.Player) {
      callback();
      return;
    }

    // Add callback to the queue
    this.callbacks.push(callback);

    // If already loading, just wait
    if (this.isLoading) {
      return;
    }

    // Start loading
    this.isLoading = true;

    // Create script element
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;

    // Set up global callback
    window.onYouTubeIframeAPIReady = () => {
      this.isLoaded = true;
      this.isLoading = false;
      
      // Execute all callbacks
      this.callbacks.forEach(cb => {
        try {
          cb();
        } catch (error) {
          console.error('Error in YouTube API callback:', error);
        }
      });
      this.callbacks = [];
    };

    // Add script to page
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
  }
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ 
  videoId, 
  onReady, 
  onStateChange, 
  onError 
}) => {
  const playerContainerId = `youtube-player-${videoId}`;
  const playerInstanceRef = useRef<any>(null);
  
  // Clean up function to destroy player
  const destroyPlayer = () => {
    if (playerInstanceRef.current) {
      try {
        playerInstanceRef.current.destroy();
      } catch (error) {
        console.error('Error destroying YouTube player:', error);
      }
      playerInstanceRef.current = null;
    }
  };

  // Initialize player
  const initializePlayer = () => {
    // Check if element exists
    const playerElement = document.getElementById(playerContainerId);
    if (!playerElement) {
      console.error('Player element not found:', playerContainerId);
      return;
    }

    // Check if YT API is available
    if (!window.YT || !window.YT.Player) {
      console.error('YouTube API not available');
      return;
    }

    // Destroy existing player if any
    destroyPlayer();

    try {
      // Create new player
      playerInstanceRef.current = new window.YT.Player(playerContainerId, {
        videoId: videoId,
        height: '0',
        width: '0',
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
          onReady: (event) => {
            console.log('YouTube player ready for video:', videoId);
            try {
              // Set lower quality for better performance
              event.target.setPlaybackQuality('small');
              onReady(event.target);
            } catch (error) {
              console.error('Error in onReady callback:', error);
            }
          },
          onStateChange: (event) => {
            try {
              if (onStateChange) {
                onStateChange(event);
              }
            } catch (error) {
              console.error('Error in onStateChange callback:', error);
            }
          },
          onError: (event) => {
            console.error('YouTube player error:', event.data);
            try {
              if (onError) {
                onError(event);
              }
            } catch (error) {
              console.error('Error in onError callback:', error);
            }
          },
        },
      });
    } catch (error) {
      console.error('Error creating YouTube player:', error);
    }
  };

  // Load YouTube API and initialize player
  useEffect(() => {
    const apiLoader = YouTubeAPILoader.getInstance();
    apiLoader.loadAPI(initializePlayer);

    // Cleanup on unmount
    return () => {
      destroyPlayer();
    };
  }, [videoId]); // Re-initialize when videoId changes

  return (
    <div id={playerContainerId} style={{ display: 'none' }} />
  );
};

export default React.memo(YouTubePlayer); 