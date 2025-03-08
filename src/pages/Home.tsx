import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, CircularProgress } from '@mui/material';
import MusicCard from '../components/MusicCard';
import { searchMusicVideos, searchPlaylists, formatSearchResultForApp } from '../api/youtubeApi';
import { usePlayer } from '../context/PlayerContext';
import { getSearchHistory, addToSearchHistory } from '../utils/searchHistory';
import { useNavigate } from 'react-router-dom';

// Add proper type for search results
interface MusicItem {
  id: string;
  title: string;
  artist: string;
  cover: string;
  duration?: number;
  type: 'track' | 'playlist';
}

const Home: React.FC = () => {
  const [recentlyPlayed, setRecentlyPlayed] = useState<MusicItem[]>([]);
  const [recommendedPlaylists, setRecommendedPlaylists] = useState<MusicItem[]>([]);
  const [newReleases, setNewReleases] = useState<MusicItem[]>([]);
  const [searchHistory, setSearchHistory] = useState<MusicItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { playSong } = usePlayer();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch data when component mounts
    fetchHomeData();
    // Load search history
    setSearchHistory(getSearchHistory());
  }, []);

  const fetchHomeData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch recently played (popular Hindi songs)
      const hindiSongs = await searchMusicVideos('popular hindi songs', 5);
      const formattedHindiSongs = hindiSongs.map((result: any) => formatSearchResultForApp(result));
      setRecentlyPlayed(formattedHindiSongs);
      
      // Fetch recommended playlists
      const playlists = await searchPlaylists('bollywood playlist', 4);
      const formattedPlaylists = playlists.map((result: any) => formatSearchResultForApp(result));
      setRecommendedPlaylists(formattedPlaylists);
      
      // Fetch new releases
      const newSongs = await searchMusicVideos('new hindi songs 2023', 4);
      const formattedNewSongs = newSongs.map((result: any) => formatSearchResultForApp(result));
      setNewReleases(formattedNewSongs);
    } catch (error) {
      console.error('Error fetching home data:', error);
      
      // Set some fallback data
      setRecentlyPlayed([]);
      setRecommendedPlaylists([]);
      setNewReleases([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (item: MusicItem) => {
    if (item.type === 'track') {
      // Add to search history
      addToSearchHistory(item.title);
      
      // Play the song
      const songToPlay = {
        id: item.id,
        title: item.title,
        artist: item.artist,
        cover: item.cover,
        duration: item.duration || 0
      };
      
      playSong(songToPlay);
    } else if (item.type === 'playlist') {
      // Navigate to playlist page
      navigate(`/playlist/${item.id}`);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '48px 0' }}>
        <CircularProgress sx={{ color: '#1DB954' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: '24px 0' }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white', marginBottom: '24px' }}>
        Good evening
      </Typography>

      {searchHistory.length > 0 && (
        <Box sx={{ marginBottom: '40px' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white', marginBottom: '16px' }}>
            Last Searched Songs
          </Typography>
          <Grid container spacing={3}>
            {searchHistory.slice(0, 5).map((item) => (
              <Grid item key={item.id} xs={6} sm={4} md={3} lg={2.4}>
                <Box onClick={() => handleCardClick(item)} sx={{ cursor: 'pointer' }}>
                  <MusicCard
                    title={item.title}
                    subtitle={item.artist}
                    image={item.cover}
                    type={item.type}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Box sx={{ marginBottom: '40px' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white', marginBottom: '16px' }}>
          Recently played
        </Typography>
        <Grid container spacing={3}>
          {recentlyPlayed.map((item) => (
            <Grid item key={item.id} xs={6} sm={4} md={3} lg={2.4}>
              <Box onClick={() => handleCardClick(item)} sx={{ cursor: 'pointer' }}>
                <MusicCard
                  title={item.title}
                  subtitle={item.artist}
                  image={item.cover}
                  type={item.type}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box sx={{ marginBottom: '40px' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white', marginBottom: '16px' }}>
          Made for you
        </Typography>
        <Grid container spacing={3}>
          {recommendedPlaylists.map((item) => (
            <Grid item key={item.id} xs={6} sm={4} md={3} lg={2.4}>
              <Box onClick={() => handleCardClick(item)} sx={{ cursor: 'pointer' }}>
                <MusicCard
                  title={item.title}
                  subtitle={item.artist}
                  image={item.cover}
                  type={item.type}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white', marginBottom: '16px' }}>
          New releases
        </Typography>
        <Grid container spacing={3}>
          {newReleases.map((item) => (
            <Grid item key={item.id} xs={6} sm={4} md={3} lg={2.4}>
              <Box onClick={() => handleCardClick(item)} sx={{ cursor: 'pointer' }}>
                <MusicCard
                  title={item.title}
                  subtitle={item.artist}
                  image={item.cover}
                  type={item.type}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default Home; 