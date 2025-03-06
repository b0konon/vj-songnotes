import { createClient } from '@supabase/supabase-js';
import { Song } from './types';

// Use the Song type for our database rows
export type SongRow = Song;

// Create a single supabase client for the entire app
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseKey); 