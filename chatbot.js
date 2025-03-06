require('dotenv').config();
const tmi = require('tmi.js');
const fetch = require('node-fetch');

// Define configuration options
const opts = {
  identity: {
    username: process.env.TWITCH_USERNAME,
    password: process.env.TWITCH_OAUTH_TOKEN
  },
  channels: [
    process.env.TWITCH_CHANNEL
  ]
};

// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch
client.connect();

// Called every time a message comes in
async function onMessageHandler(channel, tags, message, self) {
  // Ignore messages from the bot itself
  if (self) return;

  // Check if the message starts with !songs
  if (message.trim() === '!songs') {
    const username = tags.username;
    try {
      const response = await fetch(`${process.env.API_URL}/api/songs/favorites?username=${username}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const songs = await response.json();
      
      if (songs.length === 0) {
        client.say(channel, `@${username}, you don't have any favorite songs yet!`);
      } else {
        const songList = songs.map(song => `${song.title} by ${song.artist}`).join(', ');
        client.say(channel, `@${username}, your favorite songs: ${songList}`);
      }
    } catch (error) {
      console.error('Error fetching songs:', error);
      client.say(channel, `@${username}, sorry, I couldn't fetch your songs!`);
    }
  }
  
  // Check if the message starts with !addsong
  if (message.trim() === '!addsong') {
    const username = tags.username;
    try {
      const response = await fetch(`${process.env.API_URL}/api/songs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      client.say(channel, `@${username}, added song: ${result.song.title} by ${result.song.artist}!`);
    } catch (error) {
      console.error('Error adding song:', error);
      client.say(channel, `@${username}, sorry, I couldn't add your current song!`);
    }
  }
}

// Called when the bot connects to Twitch chat
function onConnectedHandler(addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
} 