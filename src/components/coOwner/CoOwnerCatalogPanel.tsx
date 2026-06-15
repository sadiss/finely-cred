import React from 'react';
import { Crown } from 'lucide-react';
import { CO_OWNER_IDENTITY, CO_OWNER_AUTOMATIONS, CO_OWNER_AI_TIER, getCoOwnerCatalogStats } from '../../domain/coOwnerPersona';
import { isCoOwnerTestingMode } from '../../lib/coOwnerRuntimeContext';

/** @deprecated Use CoOwnerIdentityBanner + CoOwnerCommandCenter — catalog list UI removed per co-owner ops design */
export function CoOwnerCatalogPanel() {
  const stats = getCoOwnerCatalogStats();
  return (
    <p className="text-sm text-slate-600">
      Knowledge archives moved to the Archives tab. Operating capabilities: {stats.operatingBrainSize.toLocaleString()}+
    </p>
  );
}

export function CoOwnerIdentityBanner() {
  const stats = getCoOwnerCatalogStats();
  return (
    <div className="rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-5 dark:from-violet-950/40 dark:to-fuchsia-950/20 dark:border-violet-800/40">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg">
          <Crown size={28} />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xs font-bold uppercase tracking-wider text-violet-600">{CO_OWNER_IDENTITY.recognitionLabel}</div>
            <span className="rounded-full bg-emerald-600/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              {CO_OWNER_AI_TIER.intelligenceMultiplier}× deep intelligence
            </span>
            {isCoOwnerTestingMode() ? (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                Testing mode
              </span>
            ) : null}
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{CO_OWNER_IDENTITY.name}</h2>
          <p className="text-sm text-violet-800/90 dark:text-violet-200">{CO_OWNER_IDENTITY.title}</p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{CO_OWNER_IDENTITY.tagline}</p>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            Nine-lens synthesis · {stats.operatingBrainSize.toLocaleString()}+ effective capabilities · Opus-class reasoning
          </p>
        </div>
      </div>
    </div>
  );
}

/** Quick stats for dashboard widgets */
export function useCoOwnerStats() {
  return getCoOwnerCatalogStats();
}

export { CO_OWNER_AUTOMATIONS };
