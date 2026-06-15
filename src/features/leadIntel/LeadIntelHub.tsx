import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  ExternalLink,
  Filter,
  Library,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';
import { getFeatureFlags } from '../../data/settingsRepo';
import type { Prospect, ProspectTarget } from '../../domain/crmProspects';
import { createProspect, findProspectByWebsite, listProspects, patchProspect } from '../../data/crmProspectsRepo';
import { recommendedPathForTarget } from '../../lib/prospectOffers';
import { FinelyOsCatalogBrowser } from '../os/FinelyOsCatalogBrowser';
import { FinelyOsPaginatedStack } from '../os/FinelyOsPaginatedStack';
import { FinelyOsOverviewStatTile } from '../os/FinelyOsOverviewStatTile';
import { FinelyOsSectionTitle } from '../os/FinelyOsIconBadge';
import { FinelyOsSidePanel } from '../os/FinelyOsSidePanel';
import { LeadIntelCopilot } from './LeadIntelCopilot';
import { LeadIntelSourceWizard } from './LeadIntelSourceWizard';
import {
  LEAD_INTEL_TEMPLATES,
  STAGING_COLUMNS,
  buildStagingMap,
  clampIntelLimit,
  type IntelResult,
  type LeadIntelView,
  type StagingLane,
} from './leadIntelModel';
import {
  DAILY_LEAD_TARGET,
  DAILY_SIGNUP_INTENT_TEMPLATES,
  autoSelectHighIntent,
  recommendedSignupPath,
} from './leadIntelDailyBatch';
import {FINELY_OS_BOARD_SHELL,
  FINELY_OS_CATALOG_SHELL,
  FINELY_OS_ENTITY_PANEL,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_TOOLBAR,
  FINELY_OS_VIEW_TABS,
  finelyOsInlineListItem,
  finelyOsListItem,
  finelyOsStatusChip,
  finelyOsViewTab,
  finelyOsCatalogCard,} from '../os/finelyOsLightUi';

type Props = {
  embedded?: boolean;
  showCompliance?: boolean;
};

function importResultsToCrm(args: {
  results: IntelResult[];
  urls: string[];
  target: ProspectTarget;
  query: string;
  location: string;
}) {
  const { results, urls, target, query, location } = args;
  const chosen = results.filter((r) => urls.includes(r.url));
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
      } as Partial<Prospect>);
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
    patchProspect(created.id, { nextAction: { label: rec.nextActionLabel } } as Partial<Prospect>);
    imported += 1;
  }
  window.dispatchEvent(new Event('finely:store'));
  return imported;
}

export function LeadIntelHub({ embedded = false, showCompliance = true }: Props) {
  const navigate = useNavigate();
  const features = useMemo(() => getFeatureFlags(), []);
  const [version, setVersion] = useState(0);
  const [view, setView] = useState<LeadIntelView>('discover');

  const [target, setTarget] = useState<ProspectTarget>('clients');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('United States');
  const [limit, setLimit] = useState(25);
  const [enrich, setEnrich] = useState(true);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [results, setResults] = useState<IntelResult[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [staging, setStaging] = useState<Record<string, StagingLane>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [focusedUrl, setFocusedUrl] = useState<string | null>(null);

  const [filterQ, setFilterQ] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [requireEmail, setRequireEmail] = useState(false);
  const [requirePhone, setRequirePhone] = useState(false);
  const [robotsOnly, setRobotsOnly] = useState(false);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const importedProspects = useMemo(
    () => listProspects({ q: filterQ, target: 'all' }).filter((p) => (p.tags ?? []).includes('lead-intel')),
    [version, filterQ],
  );

  const selectedUrls = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([u]) => u), [selected]);
  const selectedCount = selectedUrls.length;
  const avgScore = useMemo(() => {
    if (!results.length) return 0;
    return Math.round(results.reduce((a, r) => a + (r.score ?? 0), 0) / results.length);
  }, [results]);

  const filteredResults = useMemo(() => {
    const q = filterQ.trim().toLowerCase();
    return results.filter((r) => {
      if ((r.score ?? 0) < minScore) return false;
      if (requireEmail && !(r.emails?.length ?? 0)) return false;
      if (requirePhone && !(r.phones?.length ?? 0)) return false;
      if (robotsOnly && !r.robotsOk) return false;
      if (!q) return true;
      const hay = [r.title, r.domain, r.url, r.snippet, r.meta?.description].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [results, filterQ, minScore, requireEmail, requirePhone, robotsOnly]);

  const focused = useMemo(() => results.find((r) => r.url === focusedUrl) ?? null, [results, focusedUrl]);

  const catalogItems = useMemo(
    () =>
      filteredResults.map((r, i) => ({
        id: r.url,
        title: r.title || r.domain,
        subtitle: r.domain,
        description: r.meta?.description || r.snippet,
        meta: [`Score ${r.score}`, `${r.emails?.length ?? 0} email`, `${r.phones?.length ?? 0} phone`],
        accentIndex: i,
        groupKey: staging[r.url] ?? 'review',
      })),
    [filteredResults, staging],
  );

  const runDailyGrowthBatch = async () => {
    setBusy(true);
    setErr(null);
    setNotice(null);
    try {
      if (!features.leadIntel) throw new Error('Lead Intel is disabled (Feature Flags).');
      if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
      const batchQueries = [
        ...DAILY_SIGNUP_INTENT_TEMPLATES.map((t) => t.query),
        ...LEAD_INTEL_TEMPLATES.slice(0, 6).map((t) => t.query),
      ];
      setNotice(`Running daily growth batch (${batchQueries.length} queries) — target ${DAILY_LEAD_TARGET}+ prospects…`);
      const { data, error } = await supabase.functions.invoke('lead-intel', {
        body: {
          target: 'clients',
          queries: batchQueries,
          location: location.trim() || 'United States',
          limit: 40,
          enrich: true,
          signupIntent: true,
          country: 'us',
        },
      });
      if (error) throw new Error(error.message);
      if (!data?.ok) throw new Error(data?.error || 'Batch search failed.');
      const out = (data.results ?? []) as IntelResult[];
      setResults(out);
      setSelected(autoSelectHighIntent(out));
      setStaging(buildStagingMap(out));
      setView('staging');
      const ready = out.filter((r) => buildStagingMap(out)[r.url] === 'ready').length;
      setNotice(
        `Daily batch complete: ${out.length} unique prospects (${ready} ready for CRM). Invite high-intent contacts to ${recommendedSignupPath('clients')}.`,
      );
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Daily batch failed.');
    } finally {
      setBusy(false);
    }
  };

  const run = async (overrides?: { target?: ProspectTarget; query?: string; location?: string; enrich?: boolean }) => {
    const runTarget = overrides?.target ?? target;
    const runQuery = (overrides?.query ?? query).trim();
    const runLocation = overrides?.location ?? location;
    const runEnrich = overrides?.enrich ?? enrich;
    if (overrides?.target) setTarget(overrides.target);
    if (overrides?.query !== undefined) setQuery(overrides.query);
    if (overrides?.location !== undefined) setLocation(overrides.location);
    if (overrides?.enrich !== undefined) setEnrich(overrides.enrich);

    setBusy(true);
    setErr(null);
    setNotice(null);
    try {
      if (!features.leadIntel) throw new Error('Lead Intel is disabled (Feature Flags).');
      if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
      if (!runQuery) throw new Error('Enter a search query.');
      const { data, error } = await supabase.functions.invoke('lead-intel', {
        body: {
          target: runTarget,
          query: runQuery,
          location: runLocation.trim() || undefined,
          limit: clampIntelLimit(limit),
          enrich: runEnrich,
          country: 'us',
        },
      });
      if (error) throw new Error(error.message);
      if (!data?.ok) throw new Error(data?.error || 'Search failed.');
      const out = (data.results ?? []) as IntelResult[];
      setResults(out);
      const nextSel: Record<string, boolean> = {};
      const nextStage = buildStagingMap(out);
      out.forEach((r) => {
        nextSel[r.url] = (r.score ?? 0) >= 35;
      });
      setSelected(nextSel);
      setStaging(nextStage);
      setView('staging');
      setNotice(`Found ${out.length} prospects — staged across Review / Qualified / Ready / Pass.`);
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Search failed.');
    } finally {
      setBusy(false);
    }
  };

  const importSelected = (urls?: string[]) => {
    const list = urls ?? selectedUrls;
    if (!list.length) return;
    const imported = importResultsToCrm({ results, urls: list, target, query, location });
    setNotice(`Saved ${imported} prospects into CRM → Prospects (tagged lead-intel).`);
    setVersion((v) => v + 1);
    window.setTimeout(() => setNotice(null), 3500);
  };

  const importReadyLane = () => {
    const urls = results.filter((r) => staging[r.url] === 'ready').map((r) => r.url);
    if (!urls.length) {
      setNotice('No prospects in Ready to CRM lane.');
      return;
    }
    importSelected(urls);
  };

const STAGING_HEADER: Record<StagingLane, string> = {
  review: 'text-sky-300',
  qualified: 'text-violet-300',
  ready: 'text-emerald-300',
  pass: 'text-fuchsia-300',
};

function scoreChip(_score: number) {
  return `inline-flex items-center px-2.5 py-1 rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 text-[10px] font-black uppercase tracking-widest text-fuchsia-200`;
}

  const toggleSelect = (url: string) => setSelected((prev) => ({ ...prev, [url]: !prev[url] }));

  const moveLane = (url: string, lane: StagingLane) => setStaging((prev) => ({ ...prev, [url]: lane }));

  return (
    <div className="space-y-4">
      {!embedded ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <FinelyOsOverviewStatTile icon={Search} label="Session results" value={results.length} accent="fuchsia" iconAccent="fuchsia" hint="Current search" />
          <FinelyOsOverviewStatTile icon={Target} label="Selected" value={selectedCount} accent="violet" iconAccent="violet" hint="Import queue" />
          <FinelyOsOverviewStatTile icon={Library} label="CRM library" value={importedProspects.length} accent="emerald" iconAccent="emerald" hint="lead-intel tag" />
          <FinelyOsOverviewStatTile icon={Sparkles} label="Avg score" value={avgScore || '—'} accent="sky" iconAccent="sky" hint={target.replace('_', ' ')} />
        </div>
      ) : null}

      {!features.leadIntel ? (
        <div className={FINELY_OS_NOTICE_WARN}>
          Lead Intelligence Agent is disabled. Enable it in <span className="font-semibold">Admin Settings → Feature Flags</span>.
        </div>
      ) : null}

      {!isSupabaseConfigured ? (
        <div className={FINELY_OS_NOTICE_WARN}>
          Supabase isn’t configured. Set <span className="font-mono font-semibold">VITE_SUPABASE_URL</span> and{' '}
          <span className="font-mono font-semibold">VITE_SUPABASE_ANON_KEY</span>.
        </div>
      ) : null}

      {notice ? (
        <div className={`${FINELY_OS_NOTICE_SUCCESS} flex items-start gap-3`}>
          <CheckCircle2 size={18} className="mt-0.5 text-emerald-400 shrink-0" />
          <div>{notice}</div>
        </div>
      ) : null}

      {err ? (
        <div className={`${FINELY_OS_NOTICE_ERROR} flex items-start gap-3`}>
          <ShieldAlert size={18} className="mt-0.5 text-rose-400 shrink-0" />
          <div>{err}</div>
        </div>
      ) : null}

      <div className={FINELY_OS_VIEW_TABS} role="tablist">
        <button type="button" role="tab" aria-selected={view === 'discover'} onClick={() => setView('discover')} className={finelyOsViewTab(view === 'discover', 'fuchsia')}>
          Discover
        </button>
        <button type="button" role="tab" aria-selected={view === 'staging'} onClick={() => setView('staging')} className={finelyOsViewTab(view === 'staging', 'violet')}>
          Staging board
        </button>
        <button type="button" role="tab" aria-selected={view === 'library'} onClick={() => setView('library')} className={finelyOsViewTab(view === 'library', 'emerald')}>
          CRM library
        </button>
        <button type="button" role="tab" aria-selected={view === 'copilot'} onClick={() => setView('copilot')} className={finelyOsViewTab(view === 'copilot', 'sky')}>
          AI copilot
        </button>
      </div>

      {(view === 'discover' || view === 'staging') && results.length > 0 ? (
        <div className={`${FINELY_OS_TOOLBAR} flex-wrap`}>
          <Filter size={14} className="text-fuchsia-400 shrink-0" />
          <input
            value={filterQ}
            onChange={(e) => setFilterQ(e.target.value)}
            placeholder="Filter results…"
            className={`flex-1 min-w-[160px] ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}`}
          />
          <select value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className={FINELY_OS_ENTITY_SELECT}>
            <option value={0}>Any score</option>
            <option value={30}>Score 30+</option>
            <option value={40}>Score 40+</option>
            <option value={55}>Score 55+</option>
          </select>
          <label className={`inline-flex items-center gap-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>
            <input type="checkbox" checked={requireEmail} onChange={(e) => setRequireEmail(e.target.checked)} /> Email
          </label>
          <label className={`inline-flex items-center gap-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>
            <input type="checkbox" checked={requirePhone} onChange={(e) => setRequirePhone(e.target.checked)} /> Phone
          </label>
          <label className={`inline-flex items-center gap-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>
            <input type="checkbox" checked={robotsOnly} onChange={(e) => setRobotsOnly(e.target.checked)} /> Crawl ok
          </label>
          <button type="button" disabled={selectedCount === 0} onClick={() => importSelected()} className={FINELY_OS_PRIMARY_BTN}>
            <Download size={14} /> Import selected ({selectedCount})
          </button>
          <button type="button" onClick={importReadyLane} className={FINELY_OS_SECONDARY_BTN}>
            Import Ready lane
          </button>
        </div>
      ) : null}

      {view === 'discover' ? (
        <>
          <div className={`${finelyOsCatalogCard('emerald')} !p-5 space-y-3`} data-fc-accent="emerald">
            <FinelyOsSectionTitle icon={Target} label="Daily growth target" accent="emerald" />
            <p className={FINELY_OS_ENTITY_BODY}>
              Goal: <strong className="text-emerald-300">{DAILY_LEAD_TARGET}+ qualified prospects per day</strong> with email or phone —
              routed to free signup funnels like <code className="opacity-80">{recommendedSignupPath('clients')}</code>.
            </p>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-[#39ff14] transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((results.length / DAILY_LEAD_TARGET) * 100))}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-white/60">
              <span>Session: {results.length} / {DAILY_LEAD_TARGET}</span>
              <span>•</span>
              <span>Ready lane: {results.filter((r) => staging[r.url] === 'ready').length}</span>
              <span>•</span>
              <span>With email: {results.filter((r) => (r.emails?.length ?? 0) > 0).length}</span>
            </div>
            <button type="button" onClick={() => void runDailyGrowthBatch()} disabled={busy || !features.leadIntel} className={FINELY_OS_PRIMARY_BTN}>
              <Sparkles size={14} /> {busy ? 'Running daily batch…' : `Run daily growth batch (${DAILY_LEAD_TARGET}+ leads)`}
            </button>
          </div>

          <LeadIntelSourceWizard
            busy={busy}
            onRun={({ source, target: t, query: q, location: loc, enrich: en }) => {
              setNotice(`Running ${source.label} discovery…`);
              void run({ target: t, query: q, location: loc, enrich: en });
            }}
          />

          <div className={FINELY_OS_CATALOG_SHELL}>
            <FinelyOsSectionTitle icon={Sparkles} label="Search templates" accent="fuchsia" />
            <div className="mt-4 flex flex-wrap gap-2">
              {LEAD_INTEL_TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => {
                    setTarget(t.target);
                    setQuery(t.query);
                    setLocation(t.location ?? 'United States');
                  }}
                  className={FINELY_OS_SECONDARY_BTN}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
            <FinelyOsSectionTitle icon={Search} label="Lead agent query" accent="violet" />
            <div className="grid lg:grid-cols-12 gap-4 items-end">
              <div className="lg:col-span-3">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Target</div>
                <select value={target} onChange={(e) => setTarget(e.target.value as ProspectTarget)} className={FINELY_OS_ENTITY_SELECT}>
                  <option value="clients">Clients</option>
                  <option value="affiliates">Affiliates</option>
                  <option value="agents">Credit Specialists</option>
                  <option value="teams">Teams</option>
                  <option value="au_sellers">AU sellers</option>
                  <option value="b2b_partners">B2B partners</option>
                </select>
              </div>
              <div className="lg:col-span-5">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Query</div>
                <div className="mt-2 flex items-center gap-2 fc-light-glass-panel fc-light-chrome-panel rounded-xl px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus-within:border-violet-500/35 focus-within:ring-2 focus-within:ring-violet-500/15">
                  <Search size={16} className="text-violet-400 shrink-0" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Example: business credit help funding readiness session"
                    className={`w-full bg-transparent py-3 text-sm outline-none ${FINELY_OS_ENTITY_VALUE} placeholder:text-white/35`}
                  />
                </div>
              </div>
              <div className="lg:col-span-3">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Location</div>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="United States / City, ST" className={FINELY_OS_ENTITY_INPUT} />
              </div>
              <div className="lg:col-span-1 flex flex-col gap-2">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Limit</div>
                <input
                  type="number"
                  value={limit}
                  min={1}
                  max={50}
                  onChange={(e) => setLimit(clampIntelLimit(Number(e.target.value || 25)))}
                  className={FINELY_OS_ENTITY_INPUT}
                />
              </div>
            </div>
            <label className={`flex items-center gap-3 ${FINELY_OS_ENTITY_BODY}`}>
              <input type="checkbox" checked={enrich} onChange={(e) => setEnrich(e.target.checked)} className="accent-emerald-500" />
              Enrich public pages (extract emails/phones; respects robots.txt)
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void run()} disabled={busy || !features.leadIntel} className={FINELY_OS_PRIMARY_BTN}>
                <Sparkles size={14} /> {busy ? 'Running…' : 'Run lead agent'}
              </button>
              <button type="button" onClick={() => navigate('/admin/crm?smartList=lead_intel_imports')} className={FINELY_OS_SECONDARY_BTN}>
                Open CRM imports <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {results.length > 0 ? (
            <div className={FINELY_OS_BOARD_SHELL}>
              <FinelyOsSectionTitle icon={Sparkles} label="Discovery catalog" accent="emerald" />
              <div className="mt-4">
                <FinelyOsCatalogBrowser
                  items={catalogItems}
                  pageSize={8}
                  searchPlaceholder="Search staged results…"
                  groupLabels={Object.fromEntries(STAGING_COLUMNS.map((c) => [c.id, c.label]))}
                  selectable
                  selectedIds={new Set(selectedUrls)}
                  onToggleSelect={toggleSelect}
                  onItemClick={setFocusedUrl}
                  initialView="grid"
                />
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {view === 'staging' ? (
        <div className="flex flex-col xl:flex-row gap-4">
          <div className={`flex-1 min-w-0 ${FINELY_OS_BOARD_SHELL}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <FinelyOsSectionTitle icon={Target} label="Prospect staging board" accent="violet" />
              <button type="button" onClick={() => void run()} disabled={busy || !query.trim()} className={FINELY_OS_SECONDARY_BTN}>
                Re-run search
              </button>
            </div>
            {!results.length ? (
              <div className={FINELY_OS_ENTITY_BODY}>Run a discovery search to populate the staging board.</div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                {STAGING_COLUMNS.map((col) => {
                  const laneResults = filteredResults.filter((r) => (staging[r.url] ?? 'review') === col.id);
                  return (
                    <div key={col.id} className={`fc-light-glass-panel fc-light-chrome-panel p-3 min-h-[280px] flex flex-col`}>
                      <div className="mb-3">
                        <div className={`text-xs font-bold uppercase tracking-wider ${STAGING_HEADER[col.id]}`}>{col.label}</div>
                        <div className={`${FINELY_OS_ENTITY_SUBLABEL} normal-case`}>{col.hint} • {laneResults.length}</div>
                      </div>
                      <div className="space-y-2 flex-1 overflow-y-auto max-h-[520px]">
                        {laneResults.map((r) => (
                          <div key={r.url} className={`${finelyOsInlineListItem(focusedUrl === r.url)} p-3`}>
                            <button type="button" onClick={() => setFocusedUrl(r.url)} className="w-full text-left">
                              <div className={`${FINELY_OS_ENTITY_VALUE} text-sm truncate`}>{r.title || r.domain}</div>
                              <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case truncate`}>{r.domain}</div>
                              <div className="mt-2 flex flex-wrap gap-1">
                                <span className={scoreChip(r.score)}>{r.score}</span>
                                {(r.emails?.length ?? 0) > 0 ? <span className={finelyOsStatusChip('ok')}>email</span> : null}
                              </div>
                            </button>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {STAGING_COLUMNS.filter((c) => c.id !== col.id).map((c) => (
                                <button key={c.id} type="button" onClick={() => moveLane(r.url, c.id)} className={`${FINELY_OS_SECONDARY_BTN} !px-2 !py-1 text-[10px]`}>
                                  → {c.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                        {laneResults.length === 0 ? <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>Empty</div> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {focused ? (
            <FinelyOsSidePanel
              icon={Sparkles}
              label="Prospect intel"
              title={focused.title || focused.domain}
              subtitle={focused.domain}
              accent="fuchsia"
              onClose={() => setFocusedUrl(null)}
              footer={
                <>
                  <button type="button" onClick={() => importSelected([focused.url])} className={FINELY_OS_PRIMARY_BTN}>
                    Import to CRM
                  </button>
                  <button type="button" onClick={() => toggleSelect(focused.url)} className={FINELY_OS_SECONDARY_BTN}>
                    {selected[focused.url] ? 'Deselect' : 'Select'}
                  </button>
                </>
              }
            >
              <div className={`${FINELY_OS_ENTITY_BODY} break-all font-mono text-xs`}>{focused.url}</div>
              <p className={FINELY_OS_ENTITY_BODY}>{focused.meta?.description || focused.snippet}</p>
              <div className="flex flex-wrap gap-2">
                <span className={scoreChip(focused.score)}>Score {focused.score}</span>
                <span className={finelyOsStatusChip(focused.robotsOk ? 'ok' : 'warn')}>{focused.robotsOk ? 'robots ok' : 'blocked'}</span>
              </div>
              {(focused.emails?.length ?? 0) > 0 ? (
                <div>
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Emails</div>
                  <ul className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-sm space-y-1`}>
                    {focused.emails!.map((e) => (
                      <li key={e} className="font-mono">
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {(focused.phones?.length ?? 0) > 0 ? (
                <div>
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Phones</div>
                  <ul className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-sm space-y-1`}>
                    {focused.phones!.map((p) => (
                      <li key={p} className="font-mono">
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Recommended signup path</div>
                <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>
                  {focused.recommendedFunnel ?? recommendedSignupPath(target)}
                </div>
              </div>
              <div>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Recommended path</div>
                <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>{recommendedPathForTarget(target).nextActionLabel}</div>
              </div>
            </FinelyOsSidePanel>
          ) : null}
        </div>
      ) : null}

      {view === 'library' ? (
        <div className={`${FINELY_OS_BOARD_SHELL} space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <FinelyOsSectionTitle icon={Library} label="Imported prospects (lead-intel)" accent="emerald" />
            <button type="button" onClick={() => navigate('/admin/crm?smartList=lead_intel_imports')} className={FINELY_OS_PRIMARY_BTN}>
              Open in CRM <ArrowRight size={14} />
            </button>
          </div>
          <input
            value={filterQ}
            onChange={(e) => setFilterQ(e.target.value)}
            placeholder="Search imported prospects…"
            className={FINELY_OS_ENTITY_INPUT}
          />
          <FinelyOsPaginatedStack
            items={importedProspects}
            pageSize={8}
            itemSpacingClassName="grid lg:grid-cols-2 gap-3"
            emptyMessage="No lead-intel imports yet. Run Discover → stage → import."
            renderItem={(p) => (
              <div key={p.id} className={finelyOsListItem(false, 'emerald')}>
                <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{p.company.name || p.company.domain || p.id}</div>
                <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono truncate`}>{p.company.website || '—'}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className={scoreChip(p.score)}>Score {p.score}</span>
                  <span className={finelyOsStatusChip('ok')}>{p.stage}</span>
                  <span className={finelyOsStatusChip('ok')}>{p.target}</span>
                </div>
                {p.nextAction?.label ? <div className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>Next: {p.nextAction.label}</div> : null}
              </div>
            )}
          />
        </div>
      ) : null}

      {view === 'copilot' ? (
        <LeadIntelCopilot target={target} query={query} results={results} selectedUrls={selectedUrls} importedCount={importedProspects.length} />
      ) : null}

      {showCompliance ? (
        <div className={`${finelyOsCatalogCard('violet')} !p-5 ${FINELY_OS_ENTITY_BODY}`}>
          <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>Compliance & quality notes</div>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            <li>Results come from a search API (not restricted platforms). Enrichment is limited to public pages and skips sites that disallow all crawling.</li>
            <li>Qualification score prioritizes reachable contacts (email/phone) and keyword relevance to the selected target.</li>
            <li>Outbound outreach is your responsibility. Follow CAN‑SPAM/TCPA and only contact where you have a lawful basis.</li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
