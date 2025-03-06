import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Song } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const username = url.searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Get favorite songs for the user using a simpler query
    const { data, error } = await supabase
      .from('vj_user_songs')
      .select('song_id')
      .eq('user_username', username);

    if (error) {
      console.error('Error fetching favorite songs:', error);
      return NextResponse.json({ error: 'Failed to fetch favorite songs' }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json([]);
    }

    // Get song details in a separate query
    const songIds = data.map(item => item.song_id);
    const { data: songsData, error: songsError } = await supabase
      .from('vj_songs')
      .select('id, title, artist, album')
      .in('id', songIds);

    if (songsError) {
      console.error('Error fetching song details:', songsError);
      return NextResponse.json({ error: 'Failed to fetch song details' }, { status: 500 });
    }

    // Convert to Song type
    const favoriteSongs: Song[] = songsData.map(song => ({
      id: song.id,
      title: song.title || '',
      artist: song.artist || '',
      album: song.album || ''
    }));

    return NextResponse.json(favoriteSongs);
  } catch (error) {
    console.error('Error in favorites GET handler:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
