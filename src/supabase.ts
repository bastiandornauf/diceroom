import { createClient } from '@supabase/supabase-js';

// Get credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Running in demo mode.');
}

// Create Supabase client - we'll add proper typing later when we have real credentials
export const supabase = createClient(
  supabaseUrl || 'https://demo.supabase.co',
  supabaseAnonKey || 'demo-key'
);

// Helper function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey && 
    supabaseUrl !== 'https://demo.supabase.co' && 
    supabaseAnonKey !== 'demo-key');
}

// Auth helpers
export const auth = supabase.auth;

// Database helpers with error handling
export async function safeQuery<T>(queryFn: () => Promise<{ data: T | null; error: any }>) {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured - returning empty result');
    return { data: null, error: new Error('Supabase not configured') };
  }
  
  try {
    return await queryFn();
  } catch (error) {
    console.error('Database query failed:', error);
    return { data: null, error };
  }
}
