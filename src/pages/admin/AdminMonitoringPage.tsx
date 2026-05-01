import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

type EdgeEvent = {
  id: string;
  at: string;
  namespace: string;
  level: 'info' | 'warn' | 'error';
  event: string;
  meta: any;
};

const KNOWN = [
  '(all)',
  'send-email',
  'send-sms',
  'send-invite-email',
  'send-invite-sms',
  'mailer',
  'stripe',
  'denefits',
  'lead-intel',
  'media',
  'nora-capital',
  'nora-llc-api',
  'errors',
];

function fmtJson(v: any) {
  try {
    const s = JSON.stringify(v ?? null, null, 2);
    return s.length > 4000 ? `${s.slice(0, 4000)}\n…` : s;
  } catch {
    return String(v ?? '');
  }
}

export default function AdminMonitoringPage() {
  const [namespace, setNamespace] = useState<string>('(all)');
  const [limit, setLimit] = useState<number>(50);
  const [events, setEvents] = useState<EdgeEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const nsParam = useMemo(() => (namespace === '(all)' ? '' : namespace), [namespace]);

  const load = async () => {
    if (!isSupabaseConfigured) {
      setErr('Supabase is not configured (missing env).');
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const { data, error } = await supabase.functions.invoke('admin-events', {
        body: { namespace: nsParam || undefined, limit },
      });
      if (error) throw new Error(error.message);
      if (!data?.ok) throw new Error(data?.error || 'Failed to load events.');
      setEvents((data.events ?? []) as EdgeEvent[]);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nsParam, limit]);

  return (
    <PageShell
      badge="Admin"
      title="Monitoring"
      subtitle="Live integration telemetry: email/SMS/mail + webhooks. (Admin allowlist required.)"
    >
      <div className="space-y-4">
        {!isSupabaseConfigured && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-100 text-sm">
            Supabase is not configured in this environment. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs font-bold tracking-[0.25em] uppercase text-white/50">Namespace</div>
          <select
            value={namespace}
            onChange={(e) => setNamespace(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
          >
            {KNOWN.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <div className="text-xs font-bold tracking-[0.25em] uppercase text-white/50">Limit</div>
          <input
            type="number"
            value={limit}
            min={5}
            max={200}
            onChange={(e) => setLimit(Math.min(200, Math.max(5, Number(e.target.value || 50))))}
            className="w-24 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
          />
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-white/70 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {err && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-rose-100 text-sm flex items-start gap-3">
            <ShieldAlert size={18} className="mt-0.5 text-rose-200" />
            <div>{err}</div>
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[920px]">
              <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] uppercase tracking-widest text-white/40 border-b border-white/10">
                <div className="col-span-2">Time</div>
                <div className="col-span-2">Namespace</div>
                <div className="col-span-1">Level</div>
                <div className="col-span-2">Event</div>
                <div className="col-span-5">Meta</div>
              </div>
              {events.length === 0 ? (
                <div className="p-6 text-white/50 text-sm">No events.</div>
              ) : (
                <div className="divide-y divide-white/10">
                  {events.map((ev) => (
                    <div key={ev.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-xs text-white/70">
                      <div className="col-span-2 font-mono text-[11px] text-white/60">{ev.at}</div>
                      <div className="col-span-2 font-mono text-[11px]">{ev.namespace}</div>
                      <div className="col-span-1">
                        <span
                          className={
                            'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ' +
                            (ev.level === 'error'
                              ? 'bg-rose-500/20 text-rose-100 border border-rose-500/30'
                              : ev.level === 'warn'
                                ? 'bg-amber-500/20 text-amber-100 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/30')
                          }
                        >
                          {ev.level}
                        </span>
                      </div>
                      <div className="col-span-2 font-semibold">{ev.event}</div>
                      <div className="col-span-5">
                        <pre className="whitespace-pre-wrap break-words text-[11px] text-white/60">{fmtJson(ev.meta)}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

