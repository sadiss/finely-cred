import type { CrmRecord } from '../../../domain/crmRecords';
import { isClosedStage } from '../../../domain/crmRecords';
import { formatForecastCents } from '../forecast/buildPipelineForecast';

export type ReferralCodeRow = {
  code: string;
  leads: number;
  open: number;
  converted: number;
  conversionRate: number;
  pipelineCents: number;
  promoterRole?: string;
  promoType?: string;
};

export type ReferralDashboard = {
  totalAttributed: number;
  totalOpen: number;
  totalConverted: number;
  overallConversionRate: number;
  pipelineValueCents: number;
  byCode: ReferralCodeRow[];
  topPromoters: Array<{ role: string; count: number }>;
  topAssets: Array<{ asset: string; count: number }>;
};

function isConverted(r: CrmRecord) {
  return r.stage === 'converted' || r.stage === 'won' || r.stage === 'active_client';
}

export function buildReferralDashboard(records: CrmRecord[]): ReferralDashboard {
  const attributed = records.filter((r) => r.attribution?.referralCode || r.attribution?.promoterRole);

  const byCodeMap = new Map<string, ReferralCodeRow>();
  const roleCounts = new Map<string, number>();
  const assetCounts = new Map<string, number>();

  for (const r of attributed) {
    const code = (r.attribution?.referralCode || 'unknown').trim() || 'unknown';
    const row = byCodeMap.get(code) ?? {
      code,
      leads: 0,
      open: 0,
      converted: 0,
      conversionRate: 0,
      pipelineCents: 0,
      promoterRole: r.attribution?.promoterRole,
      promoType: r.attribution?.promoType,
    };
    row.leads += 1;
    if (isConverted(r)) row.converted += 1;
    else if (!isClosedStage(r.stage)) {
      row.open += 1;
      row.pipelineCents += r.dealValueCents ?? 0;
    }
    byCodeMap.set(code, row);

    if (r.attribution?.promoterRole) {
      roleCounts.set(r.attribution.promoterRole, (roleCounts.get(r.attribution.promoterRole) ?? 0) + 1);
    }
    if (r.attribution?.promoAsset) {
      assetCounts.set(r.attribution.promoAsset, (assetCounts.get(r.attribution.promoAsset) ?? 0) + 1);
    }
  }

  const byCode = Array.from(byCodeMap.values())
    .map((row) => ({
      ...row,
      conversionRate: row.leads ? Math.round((row.converted / row.leads) * 100) : 0,
    }))
    .sort((a, b) => b.leads - a.leads);

  const totalConverted = attributed.filter(isConverted).length;
  const totalOpen = attributed.filter((r) => !isClosedStage(r.stage)).length;
  const pipelineValueCents = attributed
    .filter((r) => !isClosedStage(r.stage))
    .reduce((sum, r) => sum + (r.dealValueCents ?? 0), 0);

  return {
    totalAttributed: attributed.length,
    totalOpen,
    totalConverted,
    overallConversionRate: attributed.length ? Math.round((totalConverted / attributed.length) * 100) : 0,
    pipelineValueCents,
    byCode,
    topPromoters: Array.from(roleCounts.entries())
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    topAssets: Array.from(assetCounts.entries())
      .map(([asset, count]) => ({ asset, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
  };
}

export { formatForecastCents };
