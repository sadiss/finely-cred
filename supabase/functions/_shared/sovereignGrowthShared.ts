export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function buildId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
}

export function blockedCopy(text: string): string[] {
  const lower = String(text || '').toLowerCase();
  return ['guaranteed approval', 'delete bad credit', 'wipe your credit', '100% approval', 'instant funding', 'cpn'].filter((p) => lower.includes(p));
}
