import React, { useMemo, useState } from 'react';
import { Check, Copy, Link2, QrCode } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { getUserProfileMeta } from '../../auth/userProfile';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { buildPromotedUrl, buildShortReferralUrl, qrCodeImageUrl } from '../../lib/leadAttribution';

export type PromoRole = 'affiliate' | 'agent' | 'seller' | 'partner';

function slugifyCode(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 36);
}

function roleLabel(role: PromoRole) {
  if (role === 'agent') return 'Credit Specialist';
  if (role === 'seller') return 'AU Seller';
  if (role === 'affiliate') return 'Affiliate';
  return 'Partner';
}

export function RolePromoLinksPanel({
  role,
  compact,
  title,
}: {
  role: PromoRole;
  compact?: boolean;
  title?: string;
}) {
  const auth = useAuth();
  const { partner } = usePartnerSession();
  const meta = getUserProfileMeta(auth.user);
  const [copied, setCopied] = useState<string | null>(null);

  const promoCode = useMemo(() => {
    const metaCode = (meta as Record<string, unknown>).affiliateReferralCode as string | undefined;
    const base = metaCode || partner?.profile?.email?.split('@')[0] || auth.user?.email?.split('@')[0] || role;
    return slugifyCode(`${role}-${base}`);
  }, [auth.user?.email, meta, partner?.profile?.email, role]);

  const links = useMemo(() => {
    const common = {
      referralCode: promoCode,
      promoterRole: role,
      utmSource: role,
      utmMedium: 'role-promo',
      utmCampaign: 'role-growth',
    };
    return [
      {
        label: 'Free dispute guide',
        type: 'guide',
        asset: 'credit-dispute-letter-guide',
        url: buildPromotedUrl({ ...common, path: '/free-guide?guide=credit-dispute-letter-guide', promoType: 'guide', promoAsset: 'credit-dispute-letter-guide' }),
      },
      {
        label: 'Resources library',
        type: 'guide',
        asset: 'resources',
        url: buildPromotedUrl({ ...common, path: '/resources', promoType: 'guide', promoAsset: 'resources' }),
      },
      {
        label: 'Ebooks / bookstore',
        type: 'ebook',
        asset: 'bookstore',
        url: buildPromotedUrl({ ...common, path: '/bookstore', promoType: 'ebook', promoAsset: 'bookstore' }),
      },
      {
        label: 'Services / pricing',
        type: 'service',
        asset: 'pricing',
        url: buildPromotedUrl({ ...common, path: '/pricing', promoType: 'service', promoAsset: 'pricing' }),
      },
      {
        label: 'Book strategy call',
        type: 'service',
        asset: 'enlightenment-session',
        url: buildPromotedUrl({ ...common, path: '/enlightenment-session', promoType: 'service', promoAsset: 'enlightenment-session' }),
      },
      {
        label: 'Start onboarding',
        type: 'signup',
        asset: role,
        url: buildPromotedUrl({ ...common, path: `/onboarding?lane=${role === 'seller' ? 'au_seller' : role}`, promoType: 'signup', promoAsset: role }),
      },
    ];
  }, [promoCode, role]);

  const shortUrl = buildShortReferralUrl(promoCode);
  const qrUrl = qrCodeImageUrl(links[0]?.url ?? shortUrl);

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      // ignore clipboard failures
    }
  };

  return (
    <div className={`rounded-2xl border border-emerald-500/25 bg-emerald-500/5 ${compact ? 'p-4' : 'p-6'} space-y-4`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-emerald-300">
            <Link2 size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">{title ?? `${roleLabel(role)} promo links`}</span>
          </div>
          <p className="mt-2 text-white/60 text-sm max-w-2xl">
            Every link carries your code, role, promo type, and asset so leads attach back to you.
          </p>
        </div>
        <button
          type="button"
          onClick={() => copy(promoCode, 'code')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/25 bg-white/[0.06] text-[10px] font-black uppercase tracking-widest text-emerald-100"
        >
          {copied === 'code' ? <Check size={14} /> : <Copy size={14} />}
          {promoCode}
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_220px] gap-4">
        <div className="grid md:grid-cols-2 gap-3">
          {links.map((link) => (
            <div key={link.label} className="fc-light-glass-panel fc-light-chrome-panel rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-widest text-white/45 font-black">{link.label}</div>
              <div className="mt-1 text-[10px] text-white/45 font-mono break-all">{link.url}</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="px-2 py-1 rounded-lg fc-light-glass-panel fc-light-chrome-panel border text-[9px] uppercase tracking-widest text-white/45">
                  {link.type}
                </span>
                <button
                  type="button"
                  onClick={() => copy(link.url, link.label)}
                  className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-300"
                >
                  {copied === link.label ? <Check size={12} /> : <Copy size={12} />}
                  {copied === link.label ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="fc-light-glass-panel fc-light-chrome-panel rounded-xl p-4 flex flex-col items-center justify-center gap-3">
          <QrCode size={18} className="text-emerald-300" />
          <img src={qrUrl} alt={`${roleLabel(role)} promo QR code`} className="rounded-lg border border-white/[0.08] w-[168px] h-[168px]" />
          <button
            type="button"
            onClick={() => copy(shortUrl, 'short')}
            className="w-full inline-flex justify-center items-center gap-2 px-3 py-2 fc-light-glass-panel fc-light-chrome-panel rounded-xl text-[10px] font-black uppercase tracking-widest text-white/70"
          >
            {copied === 'short' ? <Check size={13} /> : <Copy size={13} />}
            Short code link
          </button>
        </div>
      </div>
    </div>
  );
}
