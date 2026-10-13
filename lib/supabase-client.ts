import { createClient, SupabaseClient } from '@supabase/supabase-js';

let rawSupabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
while (rawSupabaseUrl.endsWith('/')) rawSupabaseUrl = rawSupabaseUrl.slice(0, -1);
if (rawSupabaseUrl.endsWith('/rest/v1')) rawSupabaseUrl = rawSupabaseUrl.slice(0, -8);
while (rawSupabaseUrl.endsWith('/')) rawSupabaseUrl = rawSupabaseUrl.slice(0, -1);

export const supabaseUrl = rawSupabaseUrl;
export const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon-key')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
