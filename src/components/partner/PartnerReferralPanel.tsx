/**
 * Partner-facing referral link + reward status card (Wave 4 / L1).
 *
 * Reads/provisions the partner's own affiliate record via `affiliateRepo.ts`
 * (`findAffiliateByPartnerId` / `createAffiliate`), scopes click/conversion stats to just
 * that partner's code via `buildReferralGrowthSnapshotForCode()`, and gives a copy-link +
 * pre-filled SMS/email share mechanism. Uses `partner` terminology throughout — never
 * "client"/"customer".
 */
import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Gift, Mail, MessageCircle, Share2, TrendingUp } from 'lucide-react';
import { createAffiliate, findAffiliateByPartnerId } from '../../data/affiliateRepo';
import { buildReferralGrowthSnapshotForCode } from '../../lib/referralGrowthEngine';
import { buildShortReferralUrl } from '../../lib/leadAttribution';
import type { Affiliate } from '../../domain/affiliate';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsGlowKpi,
  type FinelyOsPublicAccent,
} from '../../features/os/finelyOsLightUi';

export function PartnerReferralPanel({
  partnerId,
  partnerEmail,
  partnerFullName,
  accent = 'amber',
  highlightGraduationAsk = false,
}: {
  partnerId?: string;
  partnerEmail?: string;
  partnerFullName?: string;
  accent?: FinelyOsPublicAccent;
  /** Lightweight "ask for a referral at the graduation moment" nudge — caller decides when a milestone applies. */
  highlightGraduationAsk?: boolean;
}) {
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [loading, setLoading] = useState(true);
  const [provisioning, setProvisioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!partnerId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    findAffiliateByPartnerId(partnerId)
      .then((found) => {
        if (!cancelled) setAffiliate(found);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load your referral link right now.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [partnerId]);

  const snapshot = useMemo(
    () => (affiliate ? buildReferralGrowthSnapshotForCode(affiliate.referralCode) : null),
    [affiliate?.referralCode],
  );

  const shareUrl = useMemo(
    () => (affiliate ? buildShortReferralUrl(affiliate.referralCode) : ''),
    [affiliate?.referralCode],
  );

  const shareText = useMemo(
    () => `I've been working with Finely Cred on my credit and wanted to share — here's my link to their free guide: ${shareUrl}`,
    [shareUrl],
  );

  async function handleBecomeAffiliate() {
    if (!partnerId) return;
    if (!partnerEmail) {
      setError('Add an email to your profile first, then come back to get your link.');
      return;
    }
    setProvisioning(true);
    setError(null);
    try {
      const created = await createAffiliate({ partnerId, email: partnerEmail, fullName: partnerFullName });
      setAffiliate(created);
    } catch {
      setError('Could not create your referral link right now — please try again.');
    } finally {
      setProvisioning(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard access can be denied silently — copy button simply won't confirm
    }
  }

  if (!partnerId) return null;

  return (
    <div className={finelyOsCatalogCardCompact(accent)} data-fc-accent={accent} data-fc-partner-referral-panel="1">
      <div className="flex items-center gap-2">
        <Gift size={15} className="text-amber-300 shrink-0" />
        <div className="min-w-0">
          <div className={FINELY_OS_ENTITY_VALUE}>Refer a friend</div>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} normal-case`}>Share your link — earn rewards when they join</div>
        </div>
      </div>

      {loading ? (
        <div className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>Loading your referral link…</div>
      ) : (
        <>
          {error ? <div className="mt-3 text-sm text-rose-200">{error}</div> : null}

          {!affiliate ? (
            <div className="mt-3 space-y-3">
              <p className={FINELY_OS_ENTITY_BODY}>
                Get your own referral link to share with friends and family — every partner you refer helps you both.
              </p>
              <button
                type="button"
                onClick={() => void handleBecomeAffiliate()}
                disabled={provisioning}
                className={FINELY_OS_PRIMARY_BTN}
              >
                <Share2 size={14} /> {provisioning ? 'Creating your link…' : 'Get your referral link'}
              </button>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {highlightGraduationAsk ? (
                <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                  You&apos;re making great progress — this is a great time to share your link with someone who needs the same win.
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-xs text-white/85 font-mono">
                  {shareUrl}
                </code>
                <button type="button" onClick={() => void handleCopy()} className={FINELY_OS_SECONDARY_BTN}>
                  {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy link'}
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <a href={`sms:?body=${encodeURIComponent(shareText)}`} className={FINELY_OS_SECONDARY_BTN}>
                  <MessageCircle size={14} /> Text it
                </a>
                <a
                  href={`mailto:?subject=${encodeURIComponent('Thought you might like this')}&body=${encodeURIComponent(shareText)}`}
                  className={FINELY_OS_SECONDARY_BTN}
                >
                  <Mail size={14} /> Email it
                </a>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className={`${finelyOsGlowKpi('amber')} p-2.5`}>
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Clicks (30d)</div>
                  <div className={`${FINELY_OS_ENTITY_VALUE} text-base`}>{snapshot?.clicks30d ?? 0}</div>
                </div>
                <div className={`${finelyOsGlowKpi('emerald')} p-2.5`}>
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Referrals (30d)</div>
                  <div className={`${FINELY_OS_ENTITY_VALUE} text-base`}>{snapshot?.conversions30d ?? 0}</div>
                </div>
                <div className={`${finelyOsGlowKpi('sky')} p-2.5`}>
                  <div className={`flex items-center gap-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                    <TrendingUp size={11} /> Conv. rate
                  </div>
                  <div className={`${FINELY_OS_ENTITY_VALUE} text-base`}>
                    {((snapshot?.overallConversionRate ?? 0) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PartnerReferralPanel;
