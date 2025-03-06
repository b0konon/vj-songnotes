import { NextRequest, NextResponse } from 'next/server';

// This is just a placeholder - in a real app, you'd reference the same data store
let songs: any[] = [];

export async function GET(
  request: NextRequest,
) {
  // get current playing song from last.fm
  const currentSong = await getCurrentSong();
  
  return NextResponse.json(currentSong);
}

async function getCurrentSong() {
  const response = await fetch(`http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=vjradio&api_key=${process.env.LASTFM_API_KEY}&format=json&limit=1`);
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
  return data;
}