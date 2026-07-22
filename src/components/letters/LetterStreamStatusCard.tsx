import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_WARN,
} from '../../features/os/finelyOsLightUi';

type PingResult = {
  ok: boolean;
  configured?: boolean;
  details?: string;
  code?: number;
  rawHint?: string;
};

/**
 * Admin/ops LetterStream readiness. Uses mailer edge `ping` when available.
 */
export function LetterStreamStatusCard({ compact }: { compact?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PingResult | null>(null);

  const runPing = async () => {
    setBusy(true);
    setResult(null);
    try {
      if (!isSupabaseConfigured || !supabase) {
        setResult({
          ok: false,
          configured: false,
          details: 'Supabase is not configured in this environment. Set VITE_SUPABASE_URL / anon key, then MAIL_API_ID + MAIL_API_KEY on the mailer edge function.',
        });
        return;
      }
      const { data, error } = await supabase.functions.invoke('mailer', {
        body: { op: 'ping' },
      });
      const errMsg = error?.message || '';
      if (error || (data as any)?.error) {
        const details = String((data as any)?.error || errMsg || 'Mailer ping failed');
        const notConfigured = /credentials not configured|not configured/i.test(details);
        setResult({ ok: false, details, configured: !notConfigured ? undefined : false });
        return;
      }
      const payload = (data || {}) as Record<string, unknown>;
      const messages = Array.isArray(payload.messages) ? payload.messages : [];
      const first = (messages[0] || {}) as Record<string, unknown>;
      setResult({
        ok: Boolean(payload.ok),
        configured: true,
        code: typeof first.code === 'number' ? (first.code as number) : typeof payload.code === 'number' ? (payload.code as number) : undefined,
        details: String(first.details || payload.message || (payload.ok ? 'LetterStream reachable' : 'Ping returned not-ok')),
      });
    } catch (e: unknown) {
      // Fallback probe via gateway is not required — surface clear error.
      setResult({
        ok: false,
        configured: false,
        details: (e as Error)?.message || 'Could not reach mailer function.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={compact ? 'space-y-2' : finelyOsCatalogCardCompact('sky')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>LetterStream mail API</div>
          <p className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>Physical mail readiness</p>
        </div>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} disabled={busy} onClick={() => void runPing()}>
          {busy ? 'Checking…' : 'Check status'}
        </button>
      </div>
      <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
        Secrets: <code className="text-white/70">MAIL_API_ID</code> + <code className="text-white/70">MAIL_API_KEY</code> on the{' '}
        <code className="text-white/70">mailer</code> edge function.
      </p>
      {result ? (
        <div className={result.ok ? FINELY_OS_NOTICE_SUCCESS : FINELY_OS_NOTICE_WARN}>
          {result.configured === false ? 'Not configured. ' : ''}
          {result.details}
          {result.code != null ? ` (code ${result.code})` : ''}
          {result.rawHint ? ` · ${result.rawHint}` : ''}
        </div>
      ) : (
        <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>Run a status check to see if the account credentials respond.</p>
      )}
    </div>
  );
}
