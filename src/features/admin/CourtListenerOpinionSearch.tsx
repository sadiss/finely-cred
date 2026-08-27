import React, { useState } from 'react';
import { Gavel, ExternalLink, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { isAdminEmail } from '../../auth/admin';
import { adminSearchCourtListenerOpinions } from '../../lib/courtListenerAdmin';
import type { CourtListenerOpinionHit } from '../../lib/publicDataClient';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsCatalogCardCompact,
  finelyOsGlowField,
  type FinelyOsGlowAccent,
} from '../../features/os/finelyOsLightUi';

const ACCENTS: FinelyOsGlowAccent[] = ['emerald', 'violet', 'sky', 'rose'];

const DISCLAIMER =
  'Admin research only. Cached CourtListener opinions — never scraped from state court sites (including New Jersey). Not legal advice. Results vary.';

export function CourtListenerOpinionSearch() {
  const auth = useAuth();
  const admin = isAdminEmail(auth.user?.email);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hits, setHits] = useState<CourtListenerOpinionHit[] | null>(null);
  const [meta, setMeta] = useState<{ cached?: boolean; stale?: boolean; count?: number } | null>(null);

  if (!admin) return null;

  const handleSearch = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await adminSearchCourtListenerOpinions({
        email: auth.user?.email,
        query,
      });
      if (!result.ok || !result.data) {
        setHits(null);
        setMeta(null);
        setError(result.error || 'Search failed.');
        return;
      }
      setHits(result.data.results ?? []);
      setMeta({ cached: result.cached, stale: result.stale, count: result.data.count });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={`${finelyOsCatalogCard('rose')} space-y-5`} aria-label="CourtListener admin research">
      <div className="flex items-start gap-3">
        <Gavel size={26} className="text-rose-300 shrink-0 mt-1" />
        <div>
          <h2 className={FINELY_OS_ENTITY_TITLE}>CourtListener opinions</h2>
          <p className={`mt-2 text-base ${FINELY_OS_ENTITY_BODY}`}>
            Staff-only, on-demand search. Nothing runs on page load. Queries are cached on the
            public-data proxy. Do not paste state-court portal URLs.
          </p>
        </div>
      </div>

      <div className={FINELY_OS_NOTICE_ERROR}>
        <ShieldAlert size={18} className="shrink-0 mt-0.5" />
        <p className="text-base">{DISCLAIMER}</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_auto] gap-4 items-end">
        <div>
          <label className={`block ${FINELY_OS_ENTITY_LABEL} mb-2`} htmlFor="cl-admin-query">
            Opinion search
          </label>
          <input
            id="cl-admin-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. bank levy exemption Social Security"
            className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} ${finelyOsGlowField('rose')}`}
          />
        </div>
        <button type="button" onClick={handleSearch} disabled={busy || query.trim().length < 3} className={FINELY_OS_SUCCESS_BTN}>
          {busy ? 'Searching…' : 'Search opinions'}
        </button>
      </div>

      {error ? <p className="text-base font-semibold text-rose-200">{error}</p> : null}

      {hits ? (
        <div className="space-y-4">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>
            {meta?.count ?? hits.length} hits
            {meta?.cached ? ' · cached' : ''}
            {meta?.stale ? ' · stale cache' : ''}
          </div>
          {hits.length === 0 ? (
            <p className={`text-base ${FINELY_OS_ENTITY_BODY}`}>No opinions in this cached result set.</p>
          ) : (
            <div className="grid lg:grid-cols-2 gap-4">
              {hits.map((hit, idx) => (
                <article key={`${hit.absoluteUrl ?? hit.caseName ?? idx}`} className={finelyOsCatalogCardCompact(ACCENTS[idx % ACCENTS.length])}>
                  <h3 className="text-xl font-extrabold text-white leading-snug">{hit.caseName || 'Untitled opinion'}</h3>
                  <p className="mt-2 text-base text-white/70">
                    {[hit.court, hit.dateFiled, hit.docketNumber].filter(Boolean).join(' · ') || 'CourtListener opinion'}
                  </p>
                  {hit.snippet ? <p className="mt-3 text-base text-white/80 leading-relaxed">{hit.snippet}</p> : null}
                  {hit.absoluteUrl ? (
                    <a
                      href={hit.absoluteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${FINELY_OS_SECONDARY_BTN} mt-4 inline-flex items-center gap-2`}
                    >
                      Open on CourtListener
                      <ExternalLink size={14} />
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
