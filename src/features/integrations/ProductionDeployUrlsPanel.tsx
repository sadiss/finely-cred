import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, Copy, Terminal } from 'lucide-react';
import {
  buildProductionDeployCommandBundle,
  getSupabaseProjectUrl,
  listProductionEdgeEndpoints,
} from '../../lib/productionEdgeUrls';
import { probeProductionEdgeFunctions, type EdgeHealthResult } from '../../lib/productionEdgeHealthProbe';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_PRIMARY_BTN, FINELY_OS_SECONDARY_BTN } from '../os/finelyOsLightUi';

export function ProductionDeployUrlsPanel() {
  const [copied, setCopied] = useState<string | null>(null);
  const [probes, setProbes] = useState<EdgeHealthResult[] | null>(null);
  const [probing, setProbing] = useState(false);

  const projectUrl = getSupabaseProjectUrl();
  const endpoints = useMemo(() => listProductionEdgeEndpoints(), [projectUrl]);

  useEffect(() => {
    if (!projectUrl) return;
    setProbing(true);
    void probeProductionEdgeFunctions()
      .then(setProbes)
      .finally(() => setProbing(false));
  }, [projectUrl]);

  const copyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const probeMap = useMemo(() => {
    const m = new Map<string, EdgeHealthResult>();
    for (const p of probes ?? []) m.set(p.functionName, p);
    return m;
  }, [probes]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={FINELY_OS_ENTITY_BODY}>
          {projectUrl ? (
            <>Project: <code className="text-white/60">{projectUrl}</code></>
          ) : (
            'Set VITE_SUPABASE_URL in .env to generate live webhook URLs'
          )}
        </p>
        <button
          type="button"
          className={FINELY_OS_PRIMARY_BTN}
          onClick={() => void copyText(buildProductionDeployCommandBundle(), 'bundle')}
        >
          <Terminal size={14} /> {copied === 'bundle' ? 'Copied bundle' : 'Copy full deploy script'}
        </button>
      </div>

      {projectUrl ? (
        <div className="grid sm:grid-cols-2 gap-2">
          {(['email-webhook', 'comms-oauth-callback'] as const).map((fn) => {
            const probe = probeMap.get(fn);
            const ok = probe?.reachable;
            return (
              <div
                key={fn}
                className={`rounded-xl border px-3 py-2 text-xs flex items-center gap-2 ${
                  ok ? 'border-emerald-500/25 bg-emerald-500/5 text-emerald-200' : 'border-white/10 bg-black/25 text-white/55'
                }`}
              >
                {probing ? (
                  <span className="text-white/40">Probing {fn}…</span>
                ) : ok ? (
                  <>
                    <CheckCircle2 size={14} /> {fn} — {probe?.detail}
                  </>
                ) : (
                  <>
                    <AlertTriangle size={14} className="text-amber-300" /> {fn} — {probe?.detail ?? 'Not probed'}
                  </>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {endpoints.length === 0 ? (
        <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>Configure Supabase env vars to show copy-paste webhook URLs.</p>
      ) : (
        <div className="space-y-2">
          {endpoints.map((ep) => (
            <div key={ep.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
              <div className="text-sm font-semibold text-white">{ep.label}</div>
              <p className={`${FINELY_OS_ENTITY_BODY} text-[11px] mt-1`}>{ep.copyHint}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code className="text-[11px] text-white/55 bg-black/40 px-2 py-1 rounded-lg break-all">{ep.url}</code>
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => void copyText(ep.url, ep.id)}>
                  <Copy size={12} /> {copied === ep.id ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
