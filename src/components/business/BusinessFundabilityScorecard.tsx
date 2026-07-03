import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Partner } from '../../domain/partners';
import { BUSINESS_ROADMAP_STEPS } from '../../domain/businessCredit';
import { getBusinessCreditProfile } from '../../data/businessCreditRepo';
import { evaluateFoundationSteps } from '../../lib/businessVendorSequencing';
import { listVendorProgress } from '../../data/vendorProgressRepo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';
import { CheckCircle2, Circle } from 'lucide-react';

type Props = { partner: Partner };

const PILLARS = [
  { id: 'entity', label: 'Entity & identity', weight: 25, path: '/business/profile' },
  { id: 'vendors', label: 'Vendor reporting', weight: 30, path: '/business/vendors' },
  { id: 'bureaus', label: 'Bureau scores', weight: 25, path: '/business/bureaus' },
  { id: 'capital', label: 'Capital package', weight: 20, path: '/business/billion-path' },
] as const;

export function BusinessFundabilityScorecard({ partner }: Props) {
  const navigate = useNavigate();

  const scores = useMemo(() => {
    const profile = getBusinessCreditProfile(partner.id);
    const roadmapDone = BUSINESS_ROADMAP_STEPS.filter((s) => profile.roadmap?.[s.id]?.done).length;
    const roadmapPct = Math.round((roadmapDone / BUSINESS_ROADMAP_STEPS.length) * 100);
    const foundation = evaluateFoundationSteps({
      business: (partner.routes as { business_build?: { business?: Record<string, unknown> } })?.business_build?.business,
      partnerId: partner.id,
    });
    const vendorOpened = listVendorProgress({ partnerId: partner.id }).filter((v) => v.status === 'opened').length;
    const vendorPct = Math.min(100, Math.round((vendorOpened / 5) * 100));
    const bureauPct = profile.roadmap?.bureau_checks?.done ? 100 : profile.roadmap?.duns_setup?.done ? 60 : 20;
    const capitalPct = profile.roadmap?.funding_package?.done ? 100 : profile.roadmap?.vendor_tier2?.done ? 50 : 15;

    const pillarScores = {
      entity: foundation.percent,
      vendors: vendorPct,
      bureaus: bureauPct,
      capital: capitalPct,
    };
    const overall = Math.round(
      PILLARS.reduce((sum, p) => sum + (pillarScores[p.id] * p.weight) / 100, 0),
    );
    return { overall, pillarScores, roadmapPct };
  }, [partner]);

  const band =
    scores.overall >= 80 ? { label: 'Funding-ready optics', tone: 'text-emerald-300' }
    : scores.overall >= 55 ? { label: 'Building momentum', tone: 'text-amber-300' }
    : { label: 'Foundation phase', tone: 'text-sky-300' };

  return (
    <div className={`${finelyOsCatalogCard('amber')} !p-6 space-y-5`} data-fc-accent="amber">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-amber-600`}>Fundability scorecard</div>
          <h3 className={`text-lg font-black ${FINELY_OS_ENTITY_VALUE}`}>Your EIN file at a glance</h3>
          <p className={`text-sm mt-1 ${FINELY_OS_ENTITY_BODY}`}>
            Weighted across entity, vendors, bureaus, and capital readiness — updates as you complete roadmap steps.
          </p>
        </div>
        <div className="text-center">
          <div className="text-4xl font-black text-amber-600">{scores.overall}</div>
          <div className={`text-xs font-bold uppercase tracking-wider ${band.tone}`}>{band.label}</div>
        </div>
      </div>

      <div className="h-3 rounded-full bg-black/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-400 to-amber-600 transition-all"
          style={{ width: `${scores.overall}%` }}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {PILLARS.map((pillar) => {
          const pct = scores.pillarScores[pillar.id];
          const done = pct >= 80;
          return (
            <button
              key={pillar.id}
              type="button"
              onClick={() => navigate(pillar.path)}
              className="text-left p-4 rounded-xl border border-black/10 bg-white/60 hover:bg-white/80 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm font-bold ${FINELY_OS_ENTITY_VALUE}`}>{pillar.label}</span>
                {done ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Circle size={16} className="text-black/30" />}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-black/10 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-mono font-bold text-amber-700">{pct}%</span>
              </div>
            </button>
          );
        })}
      </div>

      <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
        Roadmap progress: {scores.roadmapPct}% — complete steps in the Readiness tab to lift your scorecard.
      </p>
    </div>
  );
}
