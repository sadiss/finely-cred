import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export { supabaseAnonKey, supabaseUrl };

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createClient('http://localhost:54321', 'missing-anon-key');

/** Invoke a public edge function as an anonymous caller (forgot password, public checkout, etc.). */
export async function invokePublicEdgeFunction<T = unknown>(
  name: string,
  body: Record<string, unknown>,
): Promise<{ data: T | null; error: Error | null }> {
  if (!isSupabaseConfigured || !supabaseAnonKey) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }
  const headers = {
    Authorization: `Bearer ${supabaseAnonKey}`,
    apikey: supabaseAnonKey,
  };
  const { data, error } = await supabase.functions.invoke(name, { body, headers });
  return { data: (data as T) ?? null, error: error ?? null };
}
