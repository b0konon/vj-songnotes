"use client";

import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { Song } from '@/lib/types';

export default function SongForm() {
  const [username, setUsername] = useState('vjradio');
  const [favoriteSongs, setFavoriteSongs] = useState<Song[]>([]);

  const addFavoriteSong = async (username: string) => {
    const response = await fetch('/api/songs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username })
    });
    const data = await response.json();
    getSongs(username); // Refresh the songs list after adding a new one
    console.log(data);
  };

  const getSongs = async (username: string) => {
    try {
      const response = await fetch(`/api/songs/favorites?username=${username}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setFavoriteSongs(data);
    } catch (error) {
      console.error('Failed to fetch favorite songs:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <Card sx={{ padding: '20px', display: 'flex', gap: '10px', width: '100%' }}>
        <TextField
          label="Twitch Username"
          variant="outlined"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          size="small"
        />
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => addFavoriteSong(username)}
          disabled={!username.trim()}
        >
          Add Song
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => getSongs(username)}
        >
          Get Songs
        </Button>
      </Card>
      <Card sx={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', alignItems: 'center' }}>
        <Typography variant="h6">Favorite Songs</Typography>
        <List sx={{ width: '100%' }}>
          {favoriteSongs.length > 0 ? (
            favoriteSongs.map((song) => (
              <ListItem key={song.id}>
                <ListItemText 
                  primary={song.title} 
                  secondary={`${song.artist} - ${song.album || 'Unknown Album'}`} 
                />
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText primary="No favorite songs yet" />
            </ListItem>
          )}
        </List>
      </Card>
    </Box>
  );
} 