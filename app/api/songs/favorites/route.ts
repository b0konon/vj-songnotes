import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Song } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    // Check if request is from a browser or external source
    const userAgent = request.headers.get('user-agent') || '';
    const isWebInterface = userAgent.includes('Mozilla');
    
    // Only check API key for non-web interface requests
    if (!isWebInterface) {
      const apiKey = request.headers.get('x-api-key');
      if (apiKey !== process.env.API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Get username
    const url = new URL(request.url);
    const username = url.searchParams.get('username');
    console.log('Looking up songs for username:', username);

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Check if Supabase is connected
    if (!supabase) {
      console.error('Supabase client not initialized');
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    console.log('Querying vj_user_songs table for username:', username);
    
    // Get favorite songs for the user
    const { data, error } = await supabase
      .from('vj_user_songs')
      .select('song_id')
      .eq('user_username', username)
      .limit(100);

    if (error) {
      console.error('Error fetching favorite songs:', error);
      return NextResponse.json({ error: 'Failed to fetch favorite songs: ' + error.message }, { status: 500 });
    }

    console.log('Found user songs data:', JSON.stringify(data));

    if (!data || data.length === 0) {
      console.log('No favorite songs found for user:', username);
      return NextResponse.json([]);
    }

    // Get song IDs safely
    const songIds = data
      .map(item => item.song_id)
      .filter(id => id !== null && id !== undefined);
    
    if (songIds.length === 0) {
      console.log('No valid song IDs found');
      return NextResponse.json([]);
    }

    console.log('Querying vj_songs table for IDs:', songIds);
    
    // Get the actual song details
    const { data: songsData, error: songsError } = await supabase
      .from('vj_songs')
      .select('*')
      .in('id', songIds)
      .order('title', { ascending: true })
      .limit(100);
      
    if (songsError) {
      console.error('Error fetching songs details:', songsError);
      return NextResponse.json({ error: 'Failed to fetch songs details' }, { status: 500 });
    }
    
    return NextResponse.json(songsData);
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
