/** One-shot logging + circuit breaker for missing/invalid anon key (401 storms). */

let logged401 = false;
let circuitOpen = false;

export function isSupabaseCircuitOpen(): boolean {
  return circuitOpen;
}

export function noteSupabaseHttpStatus(status: number, context?: string): void {
  if (status !== 401) return;
  circuitOpen = true;
  if (!logged401) {
    logged401 = true;
    console.warn(
      '[Finely Cred] Supabase API returned 401 (No API key / invalid anon key).',
      context ? `Context: ${context}` : '',
      'Check VITE_SUPABASE_ANON_KEY. Further staff/automation sync attempts are skipped this session.'
    );
  }
}

export function resetSupabaseCircuitForTests(): void {
  logged401 = false;
  circuitOpen = false;
}
