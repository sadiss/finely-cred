import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, ExternalLink, ShieldAlert, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { getNoraCapitalSettings } from '../../data/settingsRepo';
import { noraPing, noraRequest } from '../../lib/noraCapitalClient';

export default function AdminNoraCapitalPage() {
  const navigate = useNavigate();
  const nora = useMemo(() => getNoraCapitalSettings(), []);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [out, setOut] = useState<string | null>(null);

  const [path, setPath] = useState('/ping');
  const [method, setMethod] = useState<'GET' | 'POST'>('GET');
  const [body, setBody] = useState('{\n  "hello": "world"\n}');

  const runPing = async () => {
    setBusy(true);
    setErr(null);
    setOut(null);
    try {
      const res = await noraPing({ idempotencyKey: `ping:${Date.now().toString(16)}` });
      setOut(`status: ${res.status}\n\n${res.body}`);
    } catch (e: any) {
      setErr(e?.message || 'Ping failed.');
    } finally {
      setBusy(false);
    }
  };

  const runReq = async () => {
    setBusy(true);
    setErr(null);
    setOut(null);
    try {
      let parsed: any = undefined;
      if (method !== 'GET') {
        try {
          parsed = JSON.parse(body);
        } catch {
          throw new Error('Body must be valid JSON.');
        }
      }
      const res = await noraRequest({
        path: path.trim(),
        method,
        body: method === 'GET' ? undefined : parsed,
        idempotencyKey: `req:${Date.now().toString(16)}`,
      });
      setOut(`status: ${res.status}\ncontent-type: ${res.contentType}\n\n${res.body}`);
    } catch (e: any) {
      setErr(e?.message || 'Request failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell
      badge="Admin"
      title="Nora Capital Group API"
      subtitle="Secure server-side integration shim (auth + allowlist + rate limiting + monitoring). Configure secrets in Supabase, then test calls here."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate('/admin/settings')} className="fc-button-soft">
              Open Settings <ArrowRight size={14} />
            </button>
            <button type="button" onClick={() => navigate('/admin/monitoring')} className="fc-button-soft">
              Monitoring <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="fc-panel p-6 space-y-3">
          <div className="inline-flex items-center gap-2 text-amber-400">
            <BriefcaseBusiness size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">Configuration</span>
          </div>
          <div className="text-white/70 text-sm space-y-2">
            <div>
              UI status: <span className="text-white/85 font-semibold">{nora.status}</span> • testMode:{' '}
              <span className="text-white/85 font-semibold">{String(nora.testMode)}</span>
            </div>
            <div>
              Base URL (non-secret): <span className="font-mono text-white/80">{nora.baseUrl || '—'}</span>
            </div>
            <div className="text-white/55 text-xs">
              Secrets must be set in Supabase Edge Function secrets: <span className="font-mono">NORA_CAPITAL_BASE_URL</span>,{' '}
              <span className="font-mono">NORA_CAPITAL_API_KEY</span>. Calls are admin-allowlisted and logged to monitoring.
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="fc-card p-6 space-y-4">
              <div className="inline-flex items-center gap-2 text-amber-400">
                <Sparkles size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Quick test</span>
              </div>
              <button type="button" className="fc-button-brand w-full" onClick={() => void runPing()} disabled={busy}>
                Ping Nora API
              </button>
              <div className="text-white/50 text-xs">
                If ping fails, check secrets + allowlisted paths + Nora endpoint availability.
              </div>
            </div>

            <div className="fc-card p-6 space-y-4">
              <div className="text-white font-semibold">Allowlisted request</div>
              <div className="text-white/60 text-sm">
                This endpoint blocks unknown paths by default for security. Extend allowlist via{' '}
                <span className="font-mono text-white/75">NORA_CAPITAL_ALLOWED_PATHS_JSON</span>.
              </div>
              <label className="block">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Path</div>
                <input value={path} onChange={(e) => setPath(e.target.value)} className="fc-input mt-2" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Method</div>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as any)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white/80"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                  </select>
                </label>
                <a
                  href="https://supabase.com/docs/guides/functions"
                  target="_blank"
                  rel="noreferrer"
                  className="fc-button-soft h-[46px] self-end justify-center"
                >
                  Supabase functions <ExternalLink size={14} />
                </a>
              </div>
              {method !== 'GET' && (
                <label className="block">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">JSON body</div>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="mt-2 w-full min-h-[130px] rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors font-mono text-xs"
                  />
                </label>
              )}
              <button type="button" className="fc-button-brand w-full" onClick={() => void runReq()} disabled={busy}>
                Send request
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {err && (
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5 text-amber-100 text-sm flex items-start gap-3">
                <ShieldAlert size={18} className="mt-0.5" />
                <div>{err}</div>
              </div>
            )}
            <div className="fc-panel p-6">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Response</div>
              <pre className="mt-3 whitespace-pre-wrap text-white/80 text-sm leading-relaxed">{out || 'Run a test to see output here.'}</pre>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

