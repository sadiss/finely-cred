import React, { useState } from 'react';
import { Loader2, Radar, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { getFeatureFlags } from '../../data/settingsRepo';
import { createProspect, findProspectByWebsite, patchProspect } from '../../data/crmProspectsRepo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsGlowTile,
} from '../../features/os/finelyOsLightUi';

type Lane = 'business_credit' | 'credit_restore' | 'debt';

const LANE_QUERIES: Record<Lane, string[]> = {
  business_credit: [
    'small business owners need business credit funding',
    'LLC owners looking for business credit cards',
    'startup fundability business credit build',
  ],
  credit_restore: [
    'credit repair help near me',
    'dispute inaccurate credit report',
    'raise credit score for mortgage',
  ],
  debt: [
    'sued by debt collector help',
    'debt validation letter help',
    'collection lawsuit defense',
  ],
};

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

/** One-button Lead Engine — real Serper via lead-intel → CRM. */
export function LeadEngineOneButton() {
  const navigate = useNavigate();
  const [lane, setLane] = useState<Lane>('business_credit');
  const [location, setLocation] = useState('United States');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [lastCount, setLastCount] = useState(0);

  const start = async () => {
    setBusy(true);
    setErr(null);
    setNotice(null);
    try {
      if (!getFeatureFlags().leadIntel) throw new Error('Turn on Feature Flag: leadIntel');
      if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
      setNotice('Calling live Lead Intel (Serper)…');
      const queries = LANE_QUERIES[lane];
      const { data, error } = await supabase.functions.invoke('lead-intel', {
        body: {
          target: 'clients',
          queries,
          location: location.trim() || 'United States',
          limit: 24,
          enrich: true,
          signupIntent: true,
          searchMode: 'mixed',
          country: 'us',
        },
      });
      if (error) throw new Error(error.message);
      if (!data?.ok) throw new Error(data?.error || 'Lead Engine failed — set SERPER_API_KEY on the lead-intel edge function.');
      const results = (data.results ?? []) as IntelHit[];
      let imported = 0;
      const loc = location.trim();
      for (const r of results) {
        const url = (r.url || '').trim();
        if (!url) continue;
        const existing = findProspectByWebsite(url);
        if (existing) {
          patchProspect(existing.id, {
            score: Math.max(existing.score, r.score ?? 0),
            tags: Array.from(new Set([...(existing.tags ?? []), 'lead-intel', 'lead-engine', lane])),
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
          imported += 1;
          continue;
        }
        const created = createProspect({
          target: 'clients',
          source: 'lead_intel_search',
          score: r.score ?? 0,
          tags: ['lead-intel', 'lead-engine', lane],
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
        patchProspect(created.id, { nextAction: { label: 'Review Lead Engine import' } });
        imported += 1;
      }
      setLastCount(imported);
      setNotice(
        imported
          ? `Lead Engine imported ${imported} real prospects into CRM (tags: lead-engine, ${lane}).`
          : 'Search returned 0 importable prospects — try another geo or lane.',
      );
    } catch (e) {
      setErr((e as Error)?.message || 'Lead Engine failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={`${finelyOsCatalogCardCompact('emerald')} space-y-4 relative overflow-hidden`} data-fc-accent="emerald">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 text-emerald-300 text-[10px] font-black uppercase tracking-[0.2em]">
            <Radar size={14} /> One-button Lead Engine
          </div>
          <h2 className="mt-2 text-2xl font-black text-white">Start Lead Engine</h2>
          <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            One push → live <code className="text-emerald-200/90">lead-intel</code> (Serper) → CRM prospects. Not the synthetic deep-swarm counters.
          </p>
        </div>
        <Sparkles className="text-amber-300" size={28} />
      </div>

      <div>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Lane</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {(
            [
              ['business_credit', 'Business Credit'],
              ['credit_restore', 'Credit restore'],
              ['debt', 'Debt / litigation'],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" onClick={() => setLane(id)} className={`${finelyOsGlowTile('emerald', lane === id)} px-3 py-2 text-left text-sm text-white`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <label className="block max-w-md">
        <span className={FINELY_OS_ENTITY_SUBLABEL}>Geo / location</span>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => void start()} className={`${FINELY_OS_PRIMARY_BTN} inline-flex items-center gap-2 !px-6 !py-3 text-sm`}>
          {busy ? <Loader2 className="animate-spin" size={16} /> : <Radar size={16} />}
          {busy ? 'Running…' : 'Start Lead Engine'}
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/crm?smartList=lead_intel_imports')}>
          Open CRM imports
        </button>
      </div>

      {notice ? <p className="text-sm text-emerald-200">{notice}</p> : null}
      {err ? <p className="text-sm text-rose-300">{err}</p> : null}
      {lastCount > 0 ? <p className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>Last run: {lastCount} imported</p> : null}
    </section>
  );
}
