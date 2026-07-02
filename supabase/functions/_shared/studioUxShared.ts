export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type' } });
export const cors = () => new Response('ok', { headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type' } });
export function safeString(v: unknown, fallback = '') { return String(v ?? fallback).trim(); }
export function clamp(n: unknown, min: number, max: number, fallback: number) { const x = Math.round(Number(n)); return Number.isFinite(x) ? Math.max(min, Math.min(max, x)) : fallback; }
export function blockedCopy(text: string) { const risky = ['guaranteed approval','delete bad credit','wipe your credit clean','100% approval','cpn','instant funding']; const low = text.toLowerCase(); return risky.filter((r) => low.includes(r)); }
