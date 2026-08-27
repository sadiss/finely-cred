import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Partner } from '../../domain/partners';
import type { ParsedCreditReport, ParsedTradeline } from '../../domain/creditReports';
import { computeMiddleScore } from '../../domain/creditScoreMiddle';
import { computeReadinessScore, type ReadinessScoreExtras } from '../../domain/capitalReadiness';
import { getOrCreateCapitalPlan } from '../../data/capitalReadinessRepo';
import { listReportsByPartner } from '../../data/reportsRepo';
import { listVendorProgress } from '../../data/vendorProgressRepo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
  type FinelyOsPublicAccent,
} from '../../features/os/finelyOsLightUi';
import { ArrowRight } from 'lucide-react';
import { formatLenderMarketLine, resolveLenderMarketSignals } from '../../lib/lenderMarketSignals';

type Props = { partner: Partner };

const FACTOR_ACCENTS: FinelyOsPublicAccent[] = ['emerald', 'violet', 'sky', 'fuchsia', 'rose'];
const VENDORS_REQUIRED = 5;

function codeIsDerog(codeRaw: string) {
  const c = (codeRaw || '').trim().toUpperCase();
  if (!c) return false;
  if (['CO', 'COL', 'CL'].includes(c)) return true;
  const n = Number(c);
  if (Number.isFinite(n) && n >= 30) return true;
  return c.includes('LATE') || c.includes('DELINQ') || c.includes('CHARGE') || c.includes('COLLECT');
}

function tradelineDerog(tradeline: ParsedTradeline) {
  const status = String(tradeline.accountStatus || '').toLowerCase();
  if (/charge|collection|derog|late|delinq|repo|foreclos|bankrupt/.test(status)) return true;
  const cells = tradeline.paymentHistory2y?.byBureau
    ? Object.values(tradeline.paymentHistory2y.byBureau).flatMap((row) => row ?? [])
    : [];
  return cells.some((cell) => codeIsDerog(cell.code));
}

function summarizeCreditExtras(parsed?: ParsedCreditReport | null): Pick<
  ReadinessScoreExtras,
  'utilizationPct' | 'derogatoryCount' | 'inquiryCount' | 'oldestAccountYears'
> {
  if (!parsed) return {};

  const utilVals = parsed.tradelines
    .flatMap((t) => (t.utilizationPct ? Object.values(t.utilizationPct) : []))
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  const utilizationPct = utilVals.length ? Math.round(Math.max(...utilVals)) : null;

  const derogatoryCount = parsed.tradelines.filter(tradelineDerog).length;
  const inquiryCount =
    parsed.sections?.find((s) => /inquir/i.test(s.key) || /inquir/i.test(s.title))?.items?.length ?? 0;

  const openedDates = parsed.tradelines
    .map((t) => (t.dateOpened ? new Date(t.dateOpened) : null))
    .filter((d): d is Date => d != null && !Number.isNaN(d.getTime()));
  const oldestAccountYears =
    openedDates.length > 0
      ? Math.max(0, (Date.now() - Math.min(...openedDates.map((d) => d.getTime()))) / (365.25 * 24 * 60 * 60 * 1000))
      : undefined;

  return {
    utilizationPct,
    derogatoryCount,
    inquiryCount,
    oldestAccountYears: oldestAccountYears != null ? Math.round(oldestAccountYears * 10) / 10 : undefined,
  };
}

export function BusinessFundabilityScorecard({ partner }: Props) {
  const navigate = useNavigate();
  const [marketLine, setMarketLine] = useState<string | null>(null);

  useEffect(() => {
    const routeKey = partner.primaryRoute || 'personal_restore';
    const personal = partner.routes?.[routeKey]?.personal;
    const st = personal?.state || partner.routes?.[routeKey]?.business?.entityState;
    const zip = personal?.postalCode;
    if (!st && !(zip && zip.length >= 5)) {
      setMarketLine(null);
      return;
    }
    let cancelled = false;
    void resolveLenderMarketSignals({ state: st, zip }).then((signals) => {
      if (!cancelled) setMarketLine(formatLenderMarketLine(signals));
    });
    return () => {
      cancelled = true;
    };
  }, [partner]);

  const readiness = useMemo(() => {
    const plan = getOrCreateCapitalPlan(partner.id);
    const latestParsed = listReportsByPartner(partner.id)[0]?.parsed ?? null;
    const middleScore = computeMiddleScore(latestParsed?.scores ?? []).value;
    const vendorRows = listVendorProgress({ partnerId: partner.id });
    const vendorsReporting = vendorRows.filter((v) => v.status === 'opened' && v.reported_verified).length;

    const extras: ReadinessScoreExtras = {
      middleScore,
      vendorsReporting,
      vendorsRequired: VENDORS_REQUIRED,
      ...summarizeCreditExtras(latestParsed),
    };

    return computeReadinessScore(plan.docs, plan.relationships, plan.entities, extras);
  }, [partner.id]);

  const band =
    readiness.overall >= 80
      ? { label: 'Funding-ready optics', tone: 'text-emerald-300' }
      : readiness.overall >= 55
        ? { label: 'Building momentum', tone: 'text-violet-300' }
        : { label: 'Foundation phase', tone: 'text-sky-300' };

  const topActions = readiness.nextActions.slice(0, 4);

  return (
    <div className={`${finelyOsCatalogCard('emerald')} !p-6 space-y-5`} data-fc-accent="emerald">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-600`}>Fundability scorecard</div>
          <h3 className={`text-lg font-black ${FINELY_OS_ENTITY_VALUE}`}>Your EIN file at a glance</h3>
          <p className={`text-sm mt-1 ${FINELY_OS_ENTITY_BODY}`}>
            Live score from your credit report, vendor reporting, documents, and capital plan — no checkbox guesses.
            {marketLine ? ` ${marketLine}` : ' Funding subject to underwriting · results vary.'}
          </p>
        </div>
        <div className="text-center">
          <div className="text-4xl font-black text-emerald-600">{readiness.overall}</div>
          <div className={`text-xs font-bold uppercase tracking-wider ${band.tone}`}>{band.label}</div>
        </div>
      </div>

      <div className="h-3 rounded-full bg-black/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-violet-500 to-sky-500 transition-all"
          style={{ width: `${readiness.overall}%` }}
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {readiness.factors.map((factor, index) => {
          const accent = FACTOR_ACCENTS[index % FACTOR_ACCENTS.length];
          return (
            <button
              key={factor.key}
              type="button"
              onClick={() => factor.href && navigate(factor.href)}
              className={`text-left p-4 rounded-xl border border-black/10 bg-white/60 hover:bg-white/80 transition-colors ${finelyOsCatalogCard(accent)} !p-4`}
              data-fc-accent={accent}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm font-bold ${FINELY_OS_ENTITY_VALUE}`}>{factor.label}</span>
                <span className="text-xs font-mono font-bold text-black/50">{factor.weight}%</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-black/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${accent === 'emerald' ? 'bg-emerald-500' : accent === 'violet' ? 'bg-violet-500' : accent === 'sky' ? 'bg-sky-500' : accent === 'fuchsia' ? 'bg-fuchsia-500' : 'bg-rose-500'}`}
                    style={{ width: `${factor.score}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-black/70">{Math.round(factor.score)}</span>
              </div>
            </button>
          );
        })}
      </div>

      {topActions.length ? (
        <div className="space-y-2">
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-violet-600`}>Your next moves</div>
          <ul className="space-y-2">
            {topActions.map((item, index) => {
              const accent = FACTOR_ACCENTS[index % FACTOR_ACCENTS.length];
              const accentText =
                accent === 'emerald'
                  ? 'text-emerald-700'
                  : accent === 'violet'
                    ? 'text-violet-700'
                    : accent === 'sky'
                      ? 'text-sky-700'
                      : accent === 'fuchsia'
                        ? 'text-fuchsia-700'
                        : 'text-rose-700';
              return (
                <li key={`${item.factorKey}-${index}`}>
                  <button
                    type="button"
                    onClick={() => item.href && navigate(item.href)}
                    className={`w-full text-left flex items-start gap-2 rounded-xl border border-black/10 bg-white/70 px-4 py-3 hover:bg-white transition-colors ${item.href ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <span className={`mt-0.5 text-base font-black ${accentText}`}>{index + 1}.</span>
                    <span className={`flex-1 text-base font-bold ${FINELY_OS_ENTITY_VALUE}`}>{item.action}</span>
                    {item.href ? <ArrowRight size={18} className={`shrink-0 ${accentText}`} aria-hidden /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
        Missing credit or vendor data scores as zero until you upload a report and confirm vendor reporting.
      </p>
    </div>
  );
}
