import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
) {
  const url = new URL(request.url);
  const username = url.searchParams.get('username');

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }
  const currentSong = await getCurrentSong(username);
  return NextResponse.json(currentSong);
}

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();
    
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const { data: userData, error: userError } = await supabase
      .from('vj_users')
      .upsert({ username: username }, { onConflict: 'username' })
      .select('username');
      
    if (userError) {
      console.error('Error saving user:', userError);
      return NextResponse.json({ error: 'Failed to save user' }, { status: 500 });
    }
    
    const currentSong = await getCurrentSong(username);
    
    if (!currentSong) {
      return NextResponse.json({ error: 'No recent tracks found' }, { status: 404 });
    }
 
    const { data: songData, error: songError } = await supabase
      .from('vj_songs')
      .upsert({
        id: currentSong.id,
        title: currentSong.title,
        artist: currentSong.artist,
        album: currentSong.album || null,
      }, { onConflict: 'id' })
      .select();
      
    if (songError) {
      console.error('Error saving song:', songError);
      return NextResponse.json({ error: 'Failed to save song' }, { status: 500 });
    }
    
    const { error: junctionError } = await supabase
      .from('vj_user_songs')
      .upsert({
        user_username: username,
        song_id: songData[0].id
      }, { onConflict: 'user_username,song_id' });
    
    if (junctionError) {
      console.error('Error creating user-song relationship:', junctionError);
      return NextResponse.json({ error: 'Failed to save user-song relationship' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: 'Song added successfully',
      song: currentSong,
      savedSong: songData[0]
    });
    
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getCurrentSong(username: string) {
  try {
    const response = await fetch(`http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=vjradio&api_key=${process.env.LASTFM_API_KEY}&format=json&limit=1`);
    
    if (!response.ok) {
      throw new Error(`Last.fm API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.recenttracks || !data.recenttracks.track || data.recenttracks.track.length === 0) {
      return null;
    }

    const track = data.recenttracks.track[0];
    return {
      id: track.mbid,
      title: track.name,
      artist: track.artist['#text'],
      album: track.album['#text']
    };
  } catch (error) {
    console.error('Error fetching current song:', error);
    return null;
  }
}