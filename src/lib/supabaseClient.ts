import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Ensure environment variables are strings or undefined
const supabaseUrl: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Error: Missing environment variable NEXT_PUBLIC_SUPABASE_URL');
  throw new Error('Missing environment variable NEXT_PUBLIC_SUPABASE_URL. Check your .env.local file.');
}
if (!supabaseAnonKey) {
  console.error('Error: Missing environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY');
  throw new Error('Missing environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY. Check your .env.local file.');
}

// Type assertion for the client if needed, or rely on inference
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
