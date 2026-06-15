/** Marketing email unsubscribe footer (Phase 12). */
import { getCommsSettings } from '../data/settingsRepo';

export function buildUnsubscribeUrl(email?: string): string {
  const appBase = (getCommsSettings().appBaseUrl || '').trim().replace(/\/+$/, '');
  const origin =
    (typeof window !== 'undefined' ? window.location.origin : '') ||
    appBase ||
    'https://app.finelycred.com';
  const base = `${origin}/unsubscribe`;
  const e = (email || '').trim().toLowerCase();
  return e ? `${base}?email=${encodeURIComponent(e)}` : base;
}

export function buildMarketingEmailFooter(args?: { email?: string; personaName?: string }): string {
  const persona = args?.personaName ?? 'Finely Cred';
  const unsub = buildUnsubscribeUrl(args?.email);
  return `\n\n— ${persona}\nFinely Cred · Educational only · not legal advice\nUnsubscribe: ${unsub}`;
}

export function buildMarketingEmailHtmlFooter(args?: { email?: string; personaName?: string }): string {
  const persona = args?.personaName ?? 'Finely Cred';
  const unsub = buildUnsubscribeUrl(args?.email);
  return `<div style="margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.6;color:#64748b;font-family:system-ui,sans-serif;">
  <div style="margin-bottom:8px;">— ${persona} · Finely Cred</div>
  <div style="margin-bottom:8px;">Educational only · not legal advice</div>
  <a href="${unsub}" style="color:#6366f1;text-decoration:underline;">Unsubscribe</a>
</div>`;
}
