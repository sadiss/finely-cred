import React, { useMemo, useState } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import { findLawHelpByZip, lawHelpUrlForState, normalizeUsZip } from '../../lib/lawHelpByZip';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsCatalogCardCompact,
  finelyOsGlowField,
} from '../../features/os/finelyOsLightUi';

export function LawHelpByZipHelper({
  defaultZip,
  fallbackState,
}: {
  defaultZip?: string;
  fallbackState?: string;
}) {
  const [zip, setZip] = useState(() => normalizeUsZip(defaultZip) ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<Awaited<ReturnType<typeof findLawHelpByZip>> | null>(null);

  const stateSite = useMemo(() => lawHelpUrlForState(fallbackState), [fallbackState]);

  const handleLookup = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await findLawHelpByZip(zip);
      setMatch(result);
      if (!result.ok) setError(result.error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${finelyOsCatalogCard('sky')} space-y-5`}>
      <div className="flex items-start gap-3">
        <MapPin size={24} className="text-sky-300 shrink-0 mt-1" />
        <div>
          <h2 className={FINELY_OS_ENTITY_TITLE}>Find free legal help by ZIP</h2>
          <p className={`mt-2 text-base ${FINELY_OS_ENTITY_BODY}`}>
            Looks up the U.S. state for a ZIP (cached) and opens the LawHelp network page plus Legal
            Services Corporation. This is a referral — not a case filing and not legal advice.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-end">
        <div>
          <label className={`block ${FINELY_OS_ENTITY_LABEL} mb-2`} htmlFor="pj-lawhelp-zip">
            ZIP code
          </label>
          <input
            id="pj-lawhelp-zip"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={10}
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder="e.g. 07302"
            className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} ${finelyOsGlowField('sky')}`}
          />
        </div>
        <button type="button" onClick={handleLookup} disabled={busy} className={FINELY_OS_SUCCESS_BTN}>
          {busy ? 'Looking up…' : 'Find legal-aid offices'}
        </button>
      </div>

      {error ? <p className="text-base font-semibold text-rose-200">{error}</p> : null}

      {match?.ok ? (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className={finelyOsCatalogCardCompact('violet')}>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Matched place</div>
            <p className="mt-2 text-xl font-extrabold text-white">
              {match.match.city ? `${match.match.city}, ` : ''}
              {match.match.state}
            </p>
            <p className="mt-2 text-base text-white/75">
              {match.match.stateName}
              {match.match.cached ? ' · cached lookup' : ''}
              {match.match.stale ? ' · stale cache' : ''}
            </p>
          </div>
          <div className={finelyOsCatalogCardCompact('emerald')}>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Open these sites</div>
            <div className="mt-3 flex flex-col gap-2">
              <a
                href={match.match.networkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${FINELY_OS_SECONDARY_BTN} inline-flex items-center gap-2`}
              >
                {match.match.state} LawHelp network
                <ExternalLink size={14} />
              </a>
              <a
                href={match.match.lawHelpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${FINELY_OS_SECONDARY_BTN} inline-flex items-center gap-2`}
              >
                LawHelp.org
                <ExternalLink size={14} />
              </a>
              <a
                href={match.match.lscUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${FINELY_OS_SECONDARY_BTN} inline-flex items-center gap-2`}
              >
                LSC — I need legal help
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      ) : fallbackState ? (
        <p className="text-base text-white/70">
          No ZIP yet — you can still open the{' '}
          <a href={stateSite} target="_blank" rel="noopener noreferrer" className="underline font-bold text-sky-200">
            {fallbackState} legal-help network
          </a>
          .
        </p>
      ) : null}
    </div>
  );
}
