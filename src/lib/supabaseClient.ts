import { createClient } from '@supabase/supabase-js';
import { isSupabaseCircuitOpen, noteSupabaseHttpStatus } from './supabaseAuthGuard';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export { supabaseAnonKey, supabaseUrl };

function supabaseFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (isSupabaseCircuitOpen()) {
    return Promise.resolve(new Response(JSON.stringify({ message: 'Supabase circuit open' }), { status: 401 }));
  }

  const headers = new Headers(init?.headers);
  if (supabaseAnonKey && !headers.has('apikey')) {
    headers.set('apikey', supabaseAnonKey);
  }

  return fetch(input, { ...init, headers }).then((res) => {
    if (res.status === 401) noteSupabaseHttpStatus(401, String(input));
    return res;
  });
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        fetch: supabaseFetch,
      },
    })
  : createClient('http://localhost:54321', 'missing-anon-key', {
      global: { fetch: supabaseFetch },
    });

/** Invoke a public edge function with anon key headers (forgot password, public checkout, etc.). */
export async function invokePublicEdgeFunction<T = unknown>(
  name: string,
  body: Record<string, unknown>
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
