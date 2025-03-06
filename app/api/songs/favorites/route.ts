import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Song } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const username = url.searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Query to get all songs favorited by the user through the junction table
    const { data, error } = await supabase
      .from('vj_user_songs')
      .select(`
        song_id,
        vj_songs!inner(id, title, artist, album)
      `)
      .eq('user_username', username);

    if (error) {
      console.error('Error fetching favorite songs:', error);
      return NextResponse.json({ error: 'Failed to fetch favorite songs' }, { status: 500 });
    }

    const favoriteSongs: Song[] = data.map(item => ({
      id: item.song_id,
      title: item.vj_songs[0].title,
      artist: item.vj_songs[0].artist,
      album: item.vj_songs[0].album
    }));

    return NextResponse.json(favoriteSongs);
  } catch (error) {
    console.error('Error in favorites GET handler:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
