import React, { useState } from 'react';
import { Loader2, Layers, Radar, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { getFeatureFlags } from '../../data/settingsRepo';
import { addProspectNote, createProspect, findProspectByWebsite, patchProspect } from '../../data/crmProspectsRepo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsGlowTile,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsAlertBanner } from '../os/FinelyOsAlertBanner';
import {
  DAILY_HUNT_PACK,
  GEO_MODIFIERS,
  HUNT_LANE_PRESETS,
  INTENT_MODIFIERS,
  NICHE_MODIFIERS,
  appendLeadActivity,
  applyImportScoring,
  buildHuntQueries,
  buildOutreachCopyPack,
  ensureNurtureSequenceForProspects,
  getLaneCta,
  nextActionForImport,
  saveLastLeadHuntRun,
  type GeoModifier,
  type IntentModifier,
  type LeadEngineLane,
  type NicheModifier,
} from './leadEngineAutonomy';

type IntelHit = {
  url?: string;
  title?: string;
  domain?: string;
  snippet?: string;
  score?: number;
  emails?: string[];
  phones?: string[];
  meta?: { description?: string };
  position?: number | null;
  robotsOk?: boolean;
  industry?: string;
  intentTier?: 'hot' | 'warm' | 'cold' | 'unknown';
  confidence?: number;
};

export type HuntRunResult = {
  lane: LeadEngineLane;
  imported: number;
  prospectIds: string[];
  error?: string;
  whySample?: string[];
};

/** Shared live hunt runner — used by simple home CTA and advanced multi-lane UI. */
export async function runSingleLaneHunt(args: {
  lane: LeadEngineLane;
  location: string;
  niche: NicheModifier;
  intent: IntentModifier;
  geo: GeoModifier;
  batchId?: string;
}): Promise<HuntRunResult> {
  const { lane, location, niche, intent, geo, batchId } = args;
  if (!getFeatureFlags().leadIntel) throw new Error('Turn on Feature Flag: leadIntel (Admin Settings → Features).');
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured — cannot call lead-intel edge.');

  const queries = buildHuntQueries({ lane, location, niche, intent, geo });
  const preset = HUNT_LANE_PRESETS.find((p) => p.id === lane)!;
  const { data, error } = await supabase.functions.invoke('lead-intel', {
    body: {
      target: preset.target,
      queries,
      location: location.trim() || 'United States',
      limit: 20,
      enrich: true,
      signupIntent: true,
      searchMode: 'mixed',
      country: 'us',
    },
  });
  if (error) throw new Error(error.message);
  if (!data?.ok) {
    const msg = String(data?.error || 'Lead Engine failed');
    if (/SERPER/i.test(msg) || /missing/i.test(msg)) {
      throw new Error(
        'SERPER_API_KEY missing on the lead-intel edge function. Add the key in Supabase secrets, redeploy lead-intel, then retry. (We will not fake imports.)',
      );
    }
    throw new Error(msg);
  }

  const results = (data.results ?? []) as IntelHit[];
  const importedIds: string[] = [];
  let imported = 0;
  const loc = location.trim();
  let whySample: string[] = [];

  for (const r of results) {
    const url = (r.url || '').trim();
    if (!url) continue;
    const scored = applyImportScoring({
      lane,
      baseScore: r.score ?? 0,
      intentTier: r.intentTier,
      hasEmail: (r.emails?.length ?? 0) > 0,
      hasPhone: (r.phones?.length ?? 0) > 0,
      snippet: r.snippet || r.meta?.description,
      industry: r.industry,
      niche,
      intent,
    });
    if (!whySample.length) whySample = scored.reasons.map((x) => x.label);
    const hasEmail = (r.emails?.length ?? 0) > 0;
    const nextAction = nextActionForImport({
      lane,
      score: scored.score,
      intentTier: r.intentTier,
      hasEmail,
    });
    const pack = buildOutreachCopyPack({ lane, companyName: r.title, website: url });
    const tags = Array.from(new Set(['lead-intel', 'lead-engine', lane, ...preset.tags, `niche:${niche}`, `intent:${intent}`]));

    const existing = findProspectByWebsite(url);
    if (existing) {
      patchProspect(existing.id, {
        score: Math.max(existing.score, scored.score),
        tags: Array.from(new Set([...(existing.tags ?? []), ...tags])),
        nextAction,
        company: {
          ...existing.company,
          website: existing.company.website ?? url,
          domain: existing.company.domain ?? r.domain,
          name: existing.company.name ?? r.title,
          description: existing.company.description ?? r.meta?.description ?? r.snippet,
        },
        contact: {
          ...existing.contact,
          emails: Array.from(new Set([...(existing.contact.emails ?? []), ...(r.emails ?? [])])),
          phones: Array.from(new Set([...(existing.contact.phones ?? []), ...(r.phones ?? [])])),
        },
      });
      addProspectNote(
        existing.id,
        `[Lead Engine 3×] Re-imported.\n${scored.whyNote}\n\nPack:\n${pack.subject}\n\n${pack.body}`,
      );
      importedIds.push(existing.id);
      imported += 1;
      continue;
    }

    const created = createProspect({
      target: preset.target,
      source: 'lead_intel_search',
      score: scored.score,
      tags,
      company: {
        name: r.title || undefined,
        website: url,
        domain: r.domain,
        description: r.meta?.description || r.snippet || undefined,
        location: loc || undefined,
      },
      contact: { emails: r.emails ?? [], phones: r.phones ?? [] },
      intel: {
        query: queries[0],
        position: r.position ?? null,
        snippet: r.snippet,
        robotsOk: r.robotsOk,
        lastEnrichedAt: new Date().toISOString(),
        industry: r.industry,
        intentTier: r.intentTier,
        confidence: r.confidence,
      },
    });
    patchProspect(created.id, { nextAction });
    addProspectNote(
      created.id,
      `[Lead Engine 3×] Imported.\n${scored.whyNote}\n\nOutreach (manual):\n${pack.subject}\n\n${pack.body}\n\nVariants: ${pack.variants.map((v) => v.angle).join(' · ')}`,
    );
    importedIds.push(created.id);
    imported += 1;
  }

  saveLastLeadHuntRun({
    at: new Date().toISOString(),
    lane,
    location: loc || 'United States',
    imported,
    prospectIds: importedIds,
    niche,
    intent,
    batchId,
    whySample: whySample.map((label) => ({ code: 'sample', label, weight: 1 })),
  });

  return { lane, imported, prospectIds: importedIds, whySample };
}

/** One-button Lead Engine 3× — multi-lane + daily pack → Serper → CRM → nurture. */
export function LeadEngineOneButton() {
  const navigate = useNavigate();
  const [lane, setLane] = useState<LeadEngineLane>('business_credit');
  const [location, setLocation] = useState('United States');
  const [geo, setGeo] = useState<GeoModifier>('national');
  const [niche, setNiche] = useState<NicheModifier>('general');
  const [intent, setIntent] = useState<IntentModifier>('high_intent');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [batchResults, setBatchResults] = useState<HuntRunResult[]>([]);
  const [samplePack, setSamplePack] = useState<ReturnType<typeof buildOutreachCopyPack> | null>(null);

  const startSingle = async () => {
    setBusy(true);
    setErr(null);
    setNotice(null);
    setBatchResults([]);
    setSamplePack(null);
    try {
      setNotice(`Hunting ${lane} (live Serper)…`);
      const result = await runSingleLaneHunt({ lane, location, niche, intent, geo });
      const nurture = ensureNurtureSequenceForProspects(result.prospectIds);
      setBatchResults([result]);
      setSamplePack(buildOutreachCopyPack({ lane, companyName: undefined }));
      const cta = getLaneCta(lane);
      setNotice(
        result.imported
          ? `Imported ${result.imported} · ${lane}. Nurture tasks: ${nurture.created} new · ${nurture.skipped} skipped. Why: ${(result.whySample || []).slice(0, 2).join('; ') || 'lane fit'}. Next: Book ${cta.book} · Offer ${cta.offer}.`
          : 'Search returned 0 importable prospects — try another geo, niche, or lane. (Live Serper ran; nothing to CRM.)',
      );
    } catch (e) {
      const message = (e as Error)?.message || 'Lead Engine failed';
      setErr(message);
      saveLastLeadHuntRun({
        at: new Date().toISOString(),
        lane,
        location: location.trim() || 'United States',
        imported: 0,
        prospectIds: [],
        error: message,
        niche,
        intent,
      });
    } finally {
      setBusy(false);
    }
  };

  const startDailyPack = async () => {
    setBusy(true);
    setErr(null);
    setNotice(null);
    setBatchResults([]);
    setSamplePack(null);
    const batchId = `pack_${Date.now().toString(36)}`;
    const lanes = DAILY_HUNT_PACK;
    const results: HuntRunResult[] = [];
    let allIds: string[] = [];
    try {
      appendLeadActivity({
        kind: 'daily_pack',
        label: `Daily pack started · ${lanes.length} lanes`,
        detail: location,
        count: lanes.length,
      });
      for (let i = 0; i < lanes.length; i++) {
        const L = lanes[i]!;
        setNotice(`Daily pack ${i + 1}/${lanes.length}: ${L}…`);
        try {
          const r = await runSingleLaneHunt({
            lane: L,
            location,
            niche,
            intent,
            geo,
            batchId,
          });
          results.push(r);
          allIds = allIds.concat(r.prospectIds);
        } catch (e) {
          const message = (e as Error)?.message || 'Lane failed';
          results.push({ lane: L, imported: 0, prospectIds: [], error: message });
          if (/SERPER/i.test(message) || /Feature Flag/i.test(message) || /Supabase/i.test(message)) {
            setErr(message);
            break;
          }
        }
      }
      const nurture = ensureNurtureSequenceForProspects(allIds);
      setBatchResults(results);
      setSamplePack(buildOutreachCopyPack({ lane: 'business_credit' }));
      const total = results.reduce((s, r) => s + r.imported, 0);
      appendLeadActivity({
        kind: 'daily_pack',
        label: `Daily pack done · ${total} imported`,
        detail: `${results.length} lanes · nurture ${nurture.created}`,
        count: total,
      });
      setNotice(
        `Daily pack finished: ${total} prospects across ${results.filter((r) => !r.error).length}/${results.length} lanes. Nurture tasks: ${nurture.created} new. Open CRM Lead Engine to work why-reasons + CTAs.`,
      );
    } catch (e) {
      setErr((e as Error)?.message || 'Daily pack failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      id="lead-hunt"
      className={`${finelyOsCatalogCardCompact('emerald')} space-y-3 relative overflow-hidden`}
      data-fc-accent="emerald"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 text-emerald-300 text-[10px] font-black uppercase tracking-[0.2em]">
            <Radar size={14} /> Live Lead Engine 3×
          </div>
          <h2 className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>Multi-lane hunt · Daily pack</h2>
          <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            Six hunt lanes + geo/niche/intent → live <code className="text-emerald-200/90">lead-intel</code> → CRM{' '}
            <code className="text-emerald-200/90">lead-engine</code> with why-reasons, 3 outreach variants, Day 0/2/5/7 tasks.
            Not deep-swarm simulation.
          </p>
        </div>
        <Sparkles className="text-amber-300" size={24} />
      </div>

      <FinelyOsAlertBanner
        tone="info"
        message="Needs SERPER_API_KEY on lead-intel edge + Feature Flag leadIntel. Missing key = clear error, zero fake leads. Daily pack queues 5 live hunts."
      />

      <div>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Hunt lane</div>
        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
          {HUNT_LANE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setLane(p.id)}
              className={`${finelyOsGlowTile('emerald', lane === p.id)} px-3 py-2 text-left text-sm text-white`}
              title={p.description}
            >
              <span className="font-semibold">{p.shortLabel}</span>
              <span className="block text-[10px] text-white/50 truncate">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <label className="block">
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Geo</span>
          <select
            value={geo}
            onChange={(e) => setGeo(e.target.value as GeoModifier)}
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white"
          >
            {GEO_MODIFIERS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Niche</span>
          <select
            value={niche}
            onChange={(e) => setNiche(e.target.value as NicheModifier)}
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white"
          >
            {NICHE_MODIFIERS.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Intent</span>
          <select
            value={intent}
            onChange={(e) => setIntent(e.target.value as IntentModifier)}
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white"
          >
            {INTENT_MODIFIERS.map((i) => (
              <option key={i.id} value={i.id}>
                {i.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block max-w-md">
        <span className={FINELY_OS_ENTITY_SUBLABEL}>Location / metro / state</span>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white"
          placeholder="United States · Atlanta GA · Florida"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void startDailyPack()}
          className={`${FINELY_OS_PRIMARY_BTN} inline-flex items-center gap-2 !px-5 !py-2.5 text-sm`}
        >
          {busy ? <Loader2 className="animate-spin" size={16} /> : <Layers size={16} />}
          {busy ? 'Pack running…' : 'Run daily pack'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void startSingle()}
          className={`${FINELY_OS_SECONDARY_BTN} inline-flex items-center gap-2`}
        >
          {busy ? <Loader2 className="animate-spin" size={14} /> : <Radar size={14} />}
          Run single lane
        </button>
        <button
          type="button"
          className={FINELY_OS_SECONDARY_BTN}
          onClick={() => navigate('/admin/crm?smartList=lead_engine_imports')}
        >
          Open CRM Lead Engine
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => window.open(getLaneCta(lane).book, '_blank')}>
          Book session
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => window.open(getLaneCta(lane).offer, '_blank')}>
          Pricing / offer
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => window.open(getLaneCta(lane).nurture, '_blank')}>
          One-sheets
        </button>
      </div>

      {notice ? <p className="text-sm text-emerald-200">{notice}</p> : null}
      {err ? <p className="text-sm text-rose-300">{err}</p> : null}

      {batchResults.length ? (
        <div className="space-y-2">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Batch results</div>
          <div className="grid md:grid-cols-2 gap-2">
            {batchResults.map((r) => (
              <div key={r.lane} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm">
                <div className="font-semibold text-white">{r.lane.replaceAll('_', ' ')}</div>
                {r.error ? (
                  <p className="text-xs text-rose-300">{r.error}</p>
                ) : (
                  <p className="text-xs text-emerald-200">
                    {r.imported} imported
                    {r.whySample?.length ? ` · ${r.whySample[0]}` : ''}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {samplePack ? (
        <details className="rounded-xl border border-white/10 bg-black/25 p-3">
          <summary className="cursor-pointer select-none text-sm font-semibold text-white">
            Outreach pack · 3 variants (copy-ready, manual send)
          </summary>
          {samplePack.variants.map((v) => (
            <div key={v.angle} className="mt-3 border-t border-white/10 pt-2">
              <p className="text-xs font-semibold text-amber-200">
                {v.angle}: {v.subject}
              </p>
              <pre className={`mt-1 whitespace-pre-wrap text-xs ${FINELY_OS_ENTITY_BODY}`}>{v.body}</pre>
            </div>
          ))}
        </details>
      ) : null}
    </section>
  );
}

/** Imperative helper for parent panels to scroll/focus the hunt card. */
export function scrollToLeadHunt() {
  document.getElementById('lead-hunt')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
