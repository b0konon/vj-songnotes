import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function generateSongId(title: string, artist: string, album: string | null): string {
  // Clean and normalize the strings: remove special chars, convert to lowercase
  const cleanStr = (str: string) => str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-') // Replace special chars with hyphens
    .replace(/-+/g, '-')        // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '');     // Remove leading/trailing hyphens

  const cleanTitle = cleanStr(title);
  const cleanArtist = cleanStr(artist);
  const cleanAlbum = album ? cleanStr(album) : 'no-album';

  return `${cleanTitle}-${cleanArtist}-${cleanAlbum}`;
}

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
    // Check if request is from a browser or external source
    const userAgent = request.headers.get('user-agent') || '';
    const isWebInterface = request.headers.get('content-type')?.includes('application/json') && 
                          userAgent.includes('Mozilla');
    
    // Only check API key for non-web interface requests
    if (!isWebInterface) {
      const apiKey = request.headers.get('x-api-key');
      if (apiKey !== process.env.API_KEY && apiKey !== process.env.NEXT_PUBLIC_WEB_API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
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

    // Generate ID if none exists
    const songId = currentSong.id || generateSongId(currentSong.title, currentSong.artist, currentSong.album);
 
    const { data: songData, error: songError } = await supabase
      .from('vj_songs')
      .upsert({
        id: songId,
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