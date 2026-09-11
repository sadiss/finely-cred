/**
 * Role loops: API/signal → human-approve task.
 * Does not send mail by itself.
 */
import { FINELY_TENANT_ID } from '../domain/tenants';
import { listAffiliatesLocalSync, listAffiliateAttributions, affiliateConversionStats } from '../data/affiliateRepo';
import { listAuSellers } from '../data/auSellerRepo';
import { createMarketingTask } from '../features/marketingDesk/marketingDeskTasks';

const STALE_MS = 30 * 24 * 60 * 60 * 1000;

export function queueRoleFollowUpTasks(): { created: number } {
  let created = 0;
  const now = Date.now();

  for (const seller of listAuSellers()) {
    const updated = Date.parse(seller.updatedAt);
    const quiet = !Number.isFinite(updated) || now - updated > STALE_MS;
    if (!quiet) continue;
    createMarketingTask({
      kind: 'review',
      title: `AU seller check-in: ${seller.fullName || seller.email || seller.id}`,
      notes: 'Seller inventory has been quiet for 30+ days. Approve before any outreach.',
      href: '/admin/au-sellers',
      tags: ['role-loop', 'au-seller'],
      meta: { source: 'role_loops', role: 'au_seller', sellerId: seller.id },
      dedupe: false,
      recordId: seller.id,
    });
    created += 1;
    if (created >= 8) break;
  }

  for (const affiliate of listAffiliatesLocalSync(FINELY_TENANT_ID)) {
    const attrs = listAffiliateAttributions(affiliate.id);
    const last = attrs.map((a) => Date.parse(a.createdAt)).filter(Number.isFinite).sort((a, b) => b - a)[0];
    const stats = affiliateConversionStats(affiliate.id);
    const quiet = !last || now - last > STALE_MS;
    if (!quiet && (stats?.leads || 0) > 0) continue;
    createMarketingTask({
      kind: 'nurture',
      title: `Affiliate follow-up: ${affiliate.fullName || affiliate.email}`,
      notes: quiet
        ? `Referral code ${affiliate.referralCode} has been quiet. Benjamin can send a designed check-in after you approve.`
        : `Affiliate ${affiliate.referralCode} needs a compliant toolkit refresh.`,
      href: '/admin/growth-agents',
      tags: ['role-loop', 'affiliate'],
      meta: { source: 'role_loops', role: 'affiliate', affiliateId: affiliate.id },
      dedupe: false,
      recordId: affiliate.id,
    });
    created += 1;
    if (created >= 16) break;
  }

  return { created };
}
