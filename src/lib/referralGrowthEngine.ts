import { logReferralClick, logReferralConversion, listReferralClicks, listReferralConversions, referralStatsForCode } from '../data/referralGrowthRepo';
import { emitPlatformEvent } from '../domain/platformEvents';
import { createNotification } from '../data/notificationsRepo';

/** Phase 37 — QR / short-link growth tracking + reward signals. */

export function recordReferralLinkVisit(args: { code: string; path: string }) {
  const code = args.code.trim();
  if (!code) return null;
  const evt = logReferralClick({ code, path: args.path });
  emitPlatformEvent({
    type: 'automation.triggered',
    tenantId: 'finely_cred',
    payload: { kind: 'referral_click', code: evt.code, path: args.path },
  });
  return evt;
}

export function recordReferralLeadCapture(args: {
  referralCode?: string;
  leadId: string;
  funnelId?: string;
}) {
  const code = args.referralCode?.trim();
  if (!code) return null;
  const evt = logReferralConversion({ code, leadId: args.leadId, funnelId: args.funnelId });
  emitPlatformEvent({
    type: 'automation.triggered',
    tenantId: 'finely_cred',
    leadId: args.leadId,
    payload: { kind: 'referral_lead_converted', code: evt.code, funnelId: args.funnelId },
  });

  const stats = referralStatsForCode(code, 30);
  if (stats.conversions >= 5 && stats.conversions % 5 === 0) {
    createNotification({
      audience: 'admin',
      kind: 'system',
      title: 'Referral milestone',
      body: `Code ${stats.code} reached ${stats.conversions} lead conversions (30d).`,
      href: '/admin/leads',
    });
  }

  return evt;
}

function conversions30d() {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return listReferralConversions(500).filter((c) => Date.parse(c.createdAt) >= cutoff);
}

export function buildReferralGrowthSnapshot() {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const clicks = listReferralClicks(500).filter((c) => Date.parse(c.createdAt) >= cutoff);
  const conversions = conversions30d();
  const byCode = new Map<string, { clicks: number; conversions: number }>();
  for (const c of clicks) {
    const cur = byCode.get(c.code) ?? { clicks: 0, conversions: 0 };
    cur.clicks += 1;
    byCode.set(c.code, cur);
  }
  for (const c of conversions) {
    const cur = byCode.get(c.code) ?? { clicks: 0, conversions: 0 };
    cur.conversions += 1;
    byCode.set(c.code, cur);
  }
  const topCodes = [...byCode.entries()]
    .sort((a, b) => b[1].conversions - a[1].conversions)
    .slice(0, 8)
    .map(([code, stats]) => ({
      code,
      ...stats,
      conversionRate: stats.clicks ? stats.conversions / stats.clicks : 0,
    }));

  return {
    clicks30d: clicks.length,
    conversions30d: conversions.length,
    overallConversionRate: clicks.length ? conversions.length / clicks.length : 0,
    topCodes,
  };
}