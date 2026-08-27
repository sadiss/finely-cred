import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Loader2, ShieldAlert } from 'lucide-react';
import { listReportsByPartner } from '../../data/reportsRepo';
import {
  searchCfpbComplaints,
  type CfpbComplaintsResponse,
} from '../../lib/publicDataClient';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
  finelyOsGlowKpi,
  type FinelyOsGlowAccent,
} from '../../features/os/finelyOsLightUi';

const ACCENT_ROTATION: FinelyOsGlowAccent[] = ['emerald', 'violet', 'sky', 'rose'];

type StripState = {
  count: number;
  issues: string[];
  company: string;
  stale?: boolean;
};

function normalizeState(state?: string): string | undefined {
  const raw = (state || '').trim();
  if (!raw) return undefined;
  if (raw.length === 2) return raw.toUpperCase();
  return raw.slice(0, 2).toUpperCase();
}

function pickComplaintCompany(partnerId: string): string | null {
  const reports = listReportsByPartner(partnerId).filter((r) => r.parsed);
  const parsed = reports[0]?.parsed;
  if (!parsed?.tradelines?.length) return null;
  const named = parsed.tradelines.find((tl) => tl.creditorName?.trim());
  const name = (named ?? parsed.tradelines[0])?.creditorName?.trim();
  return name || null;
}

function parseCfpbResponse(data: CfpbComplaintsResponse): { count: number; issues: string[] } {
  const hits = data?.hits?.hits ?? [];
  let count = hits.length;
  const total = (data?.hits as { total?: number | { value?: number } } | undefined)?.total;
  if (total && typeof total === 'object' && typeof total.value === 'number') {
    count = total.value;
  } else if (typeof total === 'number') {
    count = total;
  }

  const issueCounts = new Map<string, number>();
  for (const hit of hits) {
    const issue = hit?._source?.issue?.trim();
    if (!issue) continue;
    issueCounts.set(issue, (issueCounts.get(issue) ?? 0) + 1);
  }

  const issues = [...issueCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([issue]) => issue);

  return { count, issues };
}

export function CfpbCompanyComplaintStrip({
  company: companyProp,
  state,
  partnerId,
  accentIndex = 0,
}: {
  company?: string;
  state?: string;
  partnerId?: string;
  accentIndex?: number;
}) {
  const company = useMemo(() => {
    const direct = companyProp?.trim();
    if (direct) return direct;
    if (partnerId) return pickComplaintCompany(partnerId);
    return null;
  }, [companyProp, partnerId]);

  const stateCode = normalizeState(state);
  const accent = ACCENT_ROTATION[accentIndex % ACCENT_ROTATION.length]!;

  const [loading, setLoading] = useState(false);
  const [strip, setStrip] = useState<StripState | null>(null);

  useEffect(() => {
    if (!company || !stateCode) {
      setStrip(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setStrip(null);

    void (async () => {
      const result = await searchCfpbComplaints({ company, state: stateCode, size: 25 });
      if (cancelled) return;
      setLoading(false);

      if (!result.ok || !result.data) {
        setStrip(null);
        return;
      }

      const parsed = parseCfpbResponse(result.data);
      if (!parsed.count) {
        setStrip(null);
        return;
      }

      setStrip({
        count: parsed.count,
        issues: parsed.issues,
        company,
        stale: result.stale,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [company, stateCode]);

  if (!company || !stateCode) return null;
  if (loading) {
    return (
      <div
        className={`${finelyOsCatalogCard(accent)} !p-3 fc-surface-harmony flex items-center gap-2`}
        aria-hidden
      >
        <Loader2 size={14} className="animate-spin text-white/50" />
        <span className={`text-sm ${FINELY_OS_ENTITY_SUBLABEL}`}>Checking public CFPB complaints…</span>
      </div>
    );
  }
  if (!strip) return null;

  return (
    <section
      className={`${finelyOsCatalogCard(accent)} !p-4 fc-surface-harmony space-y-3`}
      aria-label="CFPB complaint intelligence"
      data-cfpb-company={strip.company}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="shrink-0 text-white/80" aria-hidden />
            <p className={`text-sm font-bold ${FINELY_OS_ENTITY_VALUE}`}>Complaints against this company in your state</p>
          </div>
          <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
            <Building2 size={12} className="mr-1 inline opacity-70" aria-hidden />
            {strip.company}
            {strip.stale ? (
              <span className={`ml-2 text-[10px] uppercase tracking-wide ${FINELY_OS_ENTITY_SUBLABEL}`}>
                Cached
              </span>
            ) : null}
          </p>
        </div>
        <div className={`${finelyOsGlowKpi(accent)} !px-3 !py-2 shrink-0 text-center`}>
          <div className="text-[10px] uppercase tracking-widest text-white/50">CFPB filings</div>
          <div className="text-xl font-black text-white">{strip.count.toLocaleString()}</div>
        </div>
      </div>

      {strip.issues.length ? (
        <div className="flex flex-wrap gap-2">
          {strip.issues.map((issue, index) => {
            const chipAccent = ACCENT_ROTATION[(accentIndex + index + 1) % ACCENT_ROTATION.length]!;
            return (
              <span
                key={issue}
                className={`inline-flex max-w-full items-center rounded-lg border border-white/10 bg-black/25 px-2.5 py-1 text-xs font-semibold text-[color:var(--fc-os-entity-body)] finelyOsGlowKpi ${chipAccent}`}
                data-issue-chip={index}
              >
                {issue}
              </span>
            );
          })}
        </div>
      ) : null}

      <p className={`text-[10px] ${FINELY_OS_ENTITY_SUBLABEL}`}>public CFPB data · not legal advice</p>
    </section>
  );
}
