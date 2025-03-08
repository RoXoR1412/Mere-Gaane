import React, { useState } from 'react';
import { Box, Typography, Grid, Tabs, Tab, Button } from '@mui/material';
import MusicCard from '../components/MusicCard';
import AddIcon from '@mui/icons-material/Add';

// Mock data for demonstration
const playlists = [
  {
    id: '1',
    title: 'Liked Songs',
    description: 'Your favorite tracks',
    cover: 'https://i.scdn.co/image/ab67706f00000002fe24d7084be472288cd6ee6c',
    type: 'playlist'
  },
  {
    id: '2',
    title: 'My Playlist #1',
    description: 'Created on May 12, 2023',
    cover: 'https://i.scdn.co/image/ab67706f00000002eb3e4a687e7d0fbce8d6a5c3',
    type: 'playlist'
  },
  {
    id: '3',
    title: 'Driving Songs',
    description: 'Perfect for long drives',
    cover: 'https://i.scdn.co/image/ab67706f000000025f0ff9251e3cfe3f42951ab5',
    type: 'playlist'
  },
];

const artists = [
  {
    id: '1',
    title: 'Arijit Singh',
    subtitle: 'Artist',
    cover: 'https://i.scdn.co/image/ab6761610000e5ebb5f9e28219c169fd4b9e8379',
    type: 'artist'
  },
  {
    id: '2',
    title: 'A.R. Rahman',
    subtitle: 'Artist',
    cover: 'https://i.scdn.co/image/ab6761610000e5ebf4a0d9e2658318947a50e3cd',
    type: 'artist'
  },
  {
    id: '3',
    title: 'Neha Kakkar',
    subtitle: 'Artist',
    cover: 'https://i.scdn.co/image/ab6761610000e5ebec4b57b44b4beaf6a7db2b93',
    type: 'artist'
  },
];

const albums = [
  {
    id: '1',
    title: 'Aashiqui 2',
    subtitle: 'Arijit Singh, Palak Muchhal',
    cover: 'https://i.scdn.co/image/ab67616d0000b273c75d1f5fa3d6e5e4e7b1d75b',
    type: 'album'
  },
  {
    id: '2',
    title: 'Brahmastra',
    subtitle: 'Pritam, Arijit Singh',
    cover: 'https://i.scdn.co/image/ab67616d0000b2738e56efdcf620a839780911fd',
    type: 'album'
  },
  {
    id: '3',
    title: 'Kabir Singh',
    subtitle: 'Various Artists',
    cover: 'https://i.scdn.co/image/ab67616d0000b273c08202c50371e234d20caf62',
    type: 'album'
  },
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const Library: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ padding: '24px 0' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
          Your Library
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<AddIcon />}
          sx={{ 
            color: 'white', 
            borderColor: 'rgba(255,255,255,0.3)',
            '&:hover': {
              borderColor: 'white'
            }
          }}
        >
          Create playlist
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{ 
            '& .MuiTab-root': { 
              color: '#b3b3b3',
              fontWeight: 'bold',
              '&.Mui-selected': {
                color: 'white'
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#1DB954'
            }
          }}
        >
          <Tab label="Playlists" />
          <Tab label="Artists" />
          <Tab label="Albums" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {playlists.map((item) => (
            <Grid item key={item.id} xs={12} sm={6} md={4} lg={3}>
              <MusicCard
                title={item.title}
                subtitle={item.description}
                image={item.cover}
                type={item.type as any}
              />
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {artists.map((item) => (
            <Grid item key={item.id} xs={12} sm={6} md={4} lg={3}>
              <MusicCard
                title={item.title}
                subtitle={item.subtitle}
                image={item.cover}
                type={item.type as any}
              />
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          {albums.map((item) => (
            <Grid item key={item.id} xs={12} sm={6} md={4} lg={3}>
              <MusicCard
                title={item.title}
                subtitle={item.subtitle}
                image={item.cover}
                type={item.type as any}
              />
            </Grid>
          ))}
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default Library; 