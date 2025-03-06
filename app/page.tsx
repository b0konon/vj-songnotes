"use client";

import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { useState } from 'react';

type Song = {
  id: string;
  artist: string;
  songname: string;
  album: string;
};

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
 
  const addCurrentSong = async () => {
    try {
      const response = await fetch('/api/song');
      const data = await response.json();
      
      if (data?.recenttracks?.track && data.recenttracks.track.length > 0) {
        const track = data.recenttracks.track[0];
        
        const newSong: Song = {
          id: Date.now().toString(),
          artist: track.artist?.['#text'] || 'Unknown Artist',
          songname: track.name || 'Unknown Track',
          album: track.album?.['#text'] || 'Unknown Album'
        };
        
        console.log('Adding new song:', newSong);
        
        setSongs(prevSongs => [...prevSongs, newSong]);
      } else {
        console.log('No track data found in response:', data);
      }
    } catch (error) {
      console.error('Error fetching current song:', error);
    }
  };

  return (
    <main>
      <h1>VJ Song Notes</h1>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={addCurrentSong}
      >
        Add Song
      </Button>
      
      <List>
        {songs.length > 0 ? (
          songs.map((song) => (
            <ListItem key={song.id}>
              <ListItemText 
                primary={song.songname} 
                secondary={`${song.artist} • ${song.album}`} 
              />
            </ListItem>
          ))
        ) : (
          <ListItem>
            <ListItemText primary="No songs added yet" />
          </ListItem>
        )}
      </List>
    </main>
  );
} 
