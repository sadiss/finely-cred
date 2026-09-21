import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Sparkles, ShieldAlert, Search, Download, CheckCircle2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';
import { getFeatureFlags } from '../../data/settingsRepo';
import type { ProspectTarget } from '../../domain/crmProspects';
import { createProspect, findProspectByWebsite, patchProspect } from '../../data/crmProspectsRepo';
import { recommendedPathForTarget } from '../../lib/prospectOffers';

type IntelResult = {
  title: string;
  url: string;
  snippet: string;
  position: number | null;
  domain: string;
  robotsOk: boolean;
  emails: string[];
  phones: string[];
  meta?: { description?: string; h1?: string };
  score: number;
};

type Template = { label: string; target: ProspectTarget; query: string; location?: string };

const TEMPLATES: Template[] = [
  {
    label: 'Clients • Business credit readiness (US)',
    target: 'clients',
    query: 'business credit help funding readiness consult',
    location: 'United States',
  },
  {
    label: 'Clients • Credit repair demand (US)',
    target: 'clients',
    query: 'fix my credit help credit repair consultation',
    location: 'United States',
  },
  {
    label: 'Affiliates • Finance/credit affiliate program',
    target: 'affiliates',
    query: 'credit repair affiliate program partners',
    location: 'United States',
  },
  {
    label: 'Agents • Credit repair sales agent opportunity',
    target: 'agents',
    query: 'credit repair sales agent remote',
    location: 'United States',
  },
  {
    label: 'Teams • Marketing partners (B2B)',
    target: 'teams',
    query: 'credit repair marketing agency partner',
    location: 'United States',
  },
  {
    label: 'AU Sellers • Tradeline sellers / inventory',
    target: 'au_sellers',
    query: 'authorized user tradelines seller inventory',
    location: 'United States',
  },
  {
    label: 'B2B Partners • Business funding partners',
    target: 'b2b_partners',
    query: 'business funding partner program merchant referral',
    location: 'United States',
  },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export default function AdminLeadIntelPage() {
  const navigate = useNavigate();
  const features = useMemo(() => getFeatureFlags(), []);

  const [target, setTarget] = useState<ProspectTarget>('clients');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('United States');
  const [limit, setLimit] = useState(10);
  const [enrich, setEnrich] = useState(true);
  const [requireContact, setRequireContact] = useState(true);
  const [batchMetros, setBatchMetros] = useState(
    'Miami, FL\nAtlanta, GA\nHouston, TX\nDallas, TX\nCharlotte, NC',
  );

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [results, setResults] = useState<IntelResult[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [providers, setProviders] = useState<{
    preferred?: string;
    googleCse?: { configured: boolean; cx?: string; apiKeySet?: boolean };
    serper?: { configured: boolean };
    osmNominatim?: { configured: boolean; note?: string };
  } | null>(null);

  const selectedCount = useMemo(() => Object.values(selected).filter(Boolean).length, [selected]);

  useEffect(() => {
    if (!features.leadIntel || !isSupabaseConfigured) return;
    void supabase.functions
      .invoke('lead-intel', { body: { ping: true } })
      .then(({ data, error }) => {
        if (error || !data?.ok) return;
        setProviders(data.providers ?? null);
      })
      .catch(() => {
        /* ignore ping failures in dev */
      });
  }, [features.leadIntel]);

  const mergeResults = (prev: IntelResult[], incoming: IntelResult[]) => {
    const byDomain = new Map<string, IntelResult>();
    for (const r of [...prev, ...incoming]) {
      const key = (r.domain || r.url).toLowerCase();
      const cur = byDomain.get(key);
      if (!cur || (r.score ?? 0) > (cur.score ?? 0)) byDomain.set(key, r);
    }
    return Array.from(byDomain.values()).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  };

  const applyContactFilter = (rows: IntelResult[]) => {
    if (!requireContact) return rows;
    return rows.filter((r) => (r.emails?.length ?? 0) > 0 && (r.phones?.length ?? 0) > 0);
  };

  const run = async () => {
    setBusy(true);
    setErr(null);
    setNotice(null);
    try {
      if (!features.leadIntel) throw new Error('Lead Intel is disabled (Feature Flags).');
      if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
      const q = query.trim();
      if (!q) throw new Error('Enter a search query.');
      const { data, error } = await supabase.functions.invoke('lead-intel', {
        body: {
          target,
          query: q,
          location: location.trim() || undefined,
          limit: clamp(limit, 1, 20),
          enrich,
          country: 'us',
        },
      });
      if (error) throw new Error(error.message);
      if (!data?.ok) throw new Error(data?.error || 'Search failed.');
      let out = (data.results ?? []) as IntelResult[];
      out = applyContactFilter(out);
      setResults(out);
      const nextSel: Record<string, boolean> = {};
      out.forEach((r) => (nextSel[r.url] = (r.score ?? 0) >= 40));
      setSelected(nextSel);
      const via = data.searchProvider ? ` via ${String(data.searchProvider).replace(/_/g, ' ')}` : '';
      setNotice(
        `Found ${out.length} prospects${via}${requireContact ? ' (phone + email required)' : ''}. Pre-selected ${Object.values(nextSel).filter(Boolean).length} likely fits.`,
      );
      if (data.providers) setProviders(data.providers);
    } catch (e: any) {
      setErr(e?.message || 'Search failed.');
    } finally {
      setBusy(false);
    }
  };

  const runMultiMetroBatch = async () => {
    setBusy(true);
    setErr(null);
    setNotice(null);
    try {
      if (!features.leadIntel) throw new Error('Lead Intel is disabled (Feature Flags).');
      if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
      const q = query.trim();
      if (!q) throw new Error('Enter a search query.');
      const metros = batchMetros
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 5);
      if (!metros.length) throw new Error('Add at least one metro (one per line).');

      let merged: IntelResult[] = [];
      for (const metro of metros) {
        const { data, error } = await supabase.functions.invoke('lead-intel', {
          body: {
            target,
            query: q,
            location: metro,
            limit: clamp(limit, 1, 20),
            enrich,
            country: 'us',
          },
        });
        if (error) throw new Error(error.message);
        if (!data?.ok) throw new Error(data?.error || `Search failed for ${metro}.`);
        merged = mergeResults(merged, (data.results ?? []) as IntelResult[]);
        await new Promise((r) => setTimeout(r, 400));
      }
      merged = applyContactFilter(merged).slice(0, 50);
      setResults(merged);
      const nextSel: Record<string, boolean> = {};
      merged.forEach((r) => (nextSel[r.url] = (r.score ?? 0) >= 40));
      setSelected(nextSel);
      setNotice(
        `Batch: ${metros.length} metros → ${merged.length} unique domains (cap 50)${requireContact ? ', phone+email required' : ''}. Uses Google CSE when API key is set, else Serper, else OSM (no key).`,
      );
    } catch (e: any) {
      setErr(e?.message || 'Batch search failed.');
    } finally {
      setBusy(false);
    }
  };

  const importSelected = () => {
    const chosen = results.filter((r) => selected[r.url]);
    if (!chosen.length) return;

    let imported = 0;
    for (const r of chosen) {
      const rec = recommendedPathForTarget(target);
      const existing = findProspectByWebsite(r.url);
      if (existing) {
        patchProspect(existing.id, {
          score: Math.max(existing.score, r.score ?? 0),
          tags: Array.from(new Set([...(existing.tags ?? []), 'lead-intel', target, ...(rec.tags ?? [])])),
          nextAction: existing.nextAction ?? { label: rec.nextActionLabel },
          company: {
            ...existing.company,
            website: existing.company.website ?? r.url,
            domain: existing.company.domain ?? r.domain,
            description: existing.company.description ?? (r.meta?.description || r.snippet || undefined),
            name: existing.company.name ?? (r.title || undefined),
          },
          contact: {
            ...existing.contact,
            emails: Array.from(new Set([...(existing.contact.emails ?? []), ...(r.emails ?? [])])),
            phones: Array.from(new Set([...(existing.contact.phones ?? []), ...(r.phones ?? [])])),
          },
          intel: {
            ...existing.intel,
            query: existing.intel?.query ?? query.trim(),
            position: existing.intel?.position ?? r.position ?? null,
            snippet: existing.intel?.snippet ?? r.snippet,
            robotsOk: r.robotsOk,
            lastEnrichedAt: new Date().toISOString(),
          },
        } as any);
        imported += 1;
        continue;
      }

      const created = createProspect({
        target,
        source: 'lead_intel_search',
        score: r.score ?? 0,
        tags: ['lead-intel', target, ...(rec.tags ?? [])],
        company: {
          name: r.title || undefined,
          website: r.url,
          domain: r.domain,
          description: r.meta?.description || r.snippet || undefined,
          location: location.trim() || undefined,
        },
        contact: { emails: r.emails ?? [], phones: r.phones ?? [] },
        intel: {
          query: query.trim(),
          position: r.position ?? null,
          snippet: r.snippet ?? '',
          robotsOk: r.robotsOk,
          lastEnrichedAt: new Date().toISOString(),
        },
      });
      patchProspect(created.id, { nextAction: { label: rec.nextActionLabel } } as any);
      imported += 1;
    }

    setNotice(`Saved ${imported} prospects into CRM → Prospects.`);
    setTimeout(() => setNotice(null), 3500);
  };

  return (
    <PageShell
      badge="Admin"
      title="Lead Intelligence Agent"
      subtitle="Discover and enrich qualified prospects using compliant search APIs + robots-respecting public-page enrichment. Results save into CRM → Prospects."
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
            <button
              type="button"
              onClick={() => navigate('/admin/crm')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
            >
              Open CRM <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {!features.leadIntel && (
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5 text-white/75 text-sm">
            Lead Intelligence Agent is disabled. Enable it in <span className="text-white/90 font-semibold">Admin Settings → Feature Flags</span>.
          </div>
        )}

        {providers && (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
            <div className="font-semibold text-white/90">Search providers</div>
            <ul className="mt-2 space-y-1 text-xs">
              <li>
                Google CSE — cx{' '}
                <span className="font-mono text-white/80">{providers.googleCse?.cx ?? '815aa44b612a64808'}</span>
                {providers.googleCse?.configured ? (
                  <span className="text-emerald-400 ml-2">active (API key set)</span>
                ) : (
                  <span className="text-white/50 ml-2">
                    waiting for <span className="font-mono">GOOGLE_CSE_API_KEY</span> in Supabase secrets
                  </span>
                )}
              </li>
              <li>
                Serper —{' '}
                {providers.serper?.configured ? (
                  <span className="text-emerald-400">configured (fallback)</span>
                ) : (
                  <span className="text-white/50">optional — not required to ship</span>
                )}
              </li>
              <li>
                OSM Nominatim — <span className="text-emerald-400">no API key</span>
                <span className="text-white/50"> — {providers.osmNominatim?.note ?? 'fallback when paid search keys absent'}</span>
              </li>
            </ul>
          </div>
        )}

        {!isSupabaseConfigured && (
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5 text-white/75 text-sm">
            Supabase isn’t configured in this environment. Set <span className="font-mono text-white/90">VITE_SUPABASE_URL</span> and{' '}
            <span className="font-mono text-white/90">VITE_SUPABASE_ANON_KEY</span>.
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-4">
          <div className="inline-flex items-center gap-2 text-amber-400">
            <Sparkles size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">Search templates</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => {
                  setTarget(t.target);
                  setQuery(t.query);
                  setLocation(t.location ?? 'United States');
                }}
                className="px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {notice && (
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-emerald-100 text-sm flex items-start gap-3">
            <CheckCircle2 size={18} className="mt-0.5 text-emerald-200" />
            <div>{notice}</div>
          </div>
        )}

        {err && (
          <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 text-rose-100 text-sm flex items-start gap-3">
            <ShieldAlert size={18} className="mt-0.5 text-rose-200" />
            <div>{err}</div>
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
          <div className="grid lg:grid-cols-12 gap-4 items-end">
            <div className="lg:col-span-3">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Target</div>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as ProspectTarget)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white/80"
              >
                <option value="clients">Clients</option>
                <option value="affiliates">Affiliates</option>
                <option value="agents">Agents</option>
                <option value="teams">Teams</option>
                <option value="au_sellers">AU sellers</option>
                <option value="b2b_partners">B2B partners</option>
              </select>
            </div>
            <div className="lg:col-span-5">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Query</div>
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3">
                <Search size={16} className="text-white/40" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Example: business credit help funding readiness session"
                  className="w-full bg-transparent py-3 text-sm text-white/80 placeholder:text-white/30 outline-none"
                />
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Location</div>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="United States / City, ST"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white/80 placeholder:text-white/30 outline-none"
              />
            </div>
            <div className="lg:col-span-1 flex flex-col gap-2">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Limit</div>
              <input
                type="number"
                value={limit}
                min={1}
                max={20}
                onChange={(e) => setLimit(clamp(Number(e.target.value || 10), 1, 20))}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white/80 outline-none"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm text-white/70">
            <input type="checkbox" checked={enrich} onChange={(e) => setEnrich(e.target.checked)} />
            Enrich public pages (extract emails/phones; best-effort respects robots.txt)
          </label>
          <label className="flex items-center gap-3 text-sm text-white/70">
            <input type="checkbox" checked={requireContact} onChange={(e) => setRequireContact(e.target.checked)} />
            Require <strong className="text-white/90">both</strong> email and phone on results (Sanz ICP)
          </label>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Multi-metro batch (~50 partners)</div>
            <textarea
              value={batchMetros}
              onChange={(e) => setBatchMetros(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80 font-mono"
              placeholder="One metro per line: City, ST"
            />
            <p className="text-white/50 text-xs">Runs up to 5 metros × limit 20, dedupes by domain, caps at 50 rows.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void run()}
              disabled={busy || !features.leadIntel}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60"
            >
              <Sparkles size={14} /> {busy ? 'Running…' : 'Run lead agent'}
            </button>
            <button
              type="button"
              onClick={() => void runMultiMetroBatch()}
              disabled={busy || !features.leadIntel}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-100 font-black uppercase tracking-widest text-[10px] hover:bg-amber-500/20 transition-all disabled:opacity-60"
            >
              <Sparkles size={14} /> {busy ? 'Batch…' : 'Run multi-metro batch'}
            </button>
            <button
              type="button"
              onClick={importSelected}
              disabled={selectedCount === 0}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all disabled:opacity-60"
            >
              <Download size={14} /> Save selected ({selectedCount}) to CRM
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[980px]">
              <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-white/10 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                <div className="col-span-1">Pick</div>
                <div className="col-span-4">Prospect</div>
                <div className="col-span-2">Score</div>
                <div className="col-span-2">Contact</div>
                <div className="col-span-2">Robots</div>
                <div className="col-span-1 text-right">Open</div>
              </div>
              {results.length === 0 ? (
                <div className="p-6 text-white/60">Run a query to see results.</div>
              ) : (
                <div className="divide-y divide-white/10">
                  {results.map((r) => (
                    <div key={r.url} className="px-5 py-4 grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-1">
                        <input
                          type="checkbox"
                          checked={!!selected[r.url]}
                          onChange={(e) => setSelected((prev) => ({ ...prev, [r.url]: e.target.checked }))}
                        />
                      </div>
                      <div className="col-span-4">
                        <div className="text-white/90 font-semibold">{r.title || r.domain}</div>
                        <div className="mt-1 text-white/50 text-xs break-all">{r.url}</div>
                        <div className="mt-2 text-white/60 text-sm line-clamp-2">{r.meta?.description || r.snippet}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-white font-semibold">{r.score}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">
                          pos {r.position ?? '—'}
                        </div>
                      </div>
                      <div className="col-span-2 text-white/60 text-sm">
                        <div>{(r.emails?.length ?? 0)} email</div>
                        <div>{(r.phones?.length ?? 0)} phone</div>
                      </div>
                      <div className="col-span-2 text-white/60 text-sm">
                        {r.robotsOk ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md border border-emerald-500/25 bg-emerald-500/10 text-emerald-100 text-[10px] font-black uppercase tracking-widest">
                            ok
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-md border border-amber-500/25 bg-amber-500/10 text-amber-100 text-[10px] font-black uppercase tracking-widest">
                            blocked
                          </span>
                        )}
                      </div>
                      <div className="col-span-1 text-right">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-[10px] font-black uppercase tracking-widest text-white/70"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-white/70 text-sm">
          <div className="font-semibold text-white">Compliance & quality notes</div>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            <li>
              Results use <strong className="text-white/90">Google Custom Search</strong> when{' '}
              <span className="font-mono">GOOGLE_CSE_API_KEY</span> is set (cx{' '}
              <span className="font-mono">GOOGLE_CSE_CX</span> or default 815aa44b612a64808), else optional Serper, else{' '}
              <strong className="text-white/90">OpenStreetMap Nominatim</strong> (no key). Bing signup deferred per Sanz.
            </li>
            <li>Enrichment is limited to public pages and skips sites that disallow all crawling.</li>
            <li>Qualification score prioritizes reachable contacts (email/phone) and keyword relevance to the selected target.</li>
            <li>Outbound outreach is your responsibility. Follow CAN‑SPAM/TCPA and only contact where you have a lawful basis.</li>
          </ul>
        </div>
      </div>
    </PageShell>
  );
}

