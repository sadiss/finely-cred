import React, { useMemo, useState } from 'react';
import { Check, Copy, Link2, QrCode } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { getUserProfileMeta } from '../../auth/userProfile';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { AF } from '../../config/affiliateProgram';
import { buildLeadMagnetUrl, buildShortReferralUrl } from '../../lib/leadAttribution';
import { LeadMagnetSharePanel } from '../leadmagnet/LeadMagnetSharePanel';

function slugifyCode(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);
}

export function AffiliateReferralToolkit() {
  const auth = useAuth();
  const { partner } = usePartnerSession();
  const meta = getUserProfileMeta(auth.user);
  const [copied, setCopied] = useState<string | null>(null);

  const referralCode = useMemo(() => {
    const fromMeta = (meta as Record<string, unknown>).affiliateReferralCode as string | undefined;
    if (fromMeta?.trim()) return slugifyCode(fromMeta);
    if (partner?.profile?.email) return slugifyCode(partner.profile.email.split('@')[0] || 'affiliate');
    if (auth.user?.email) return slugifyCode(auth.user.email.split('@')[0] || 'affiliate');
    return 'my-referral';
  }, [meta, partner, auth.user]);

  const base = typeof window !== 'undefined' ? window.location.origin : 'https://finelycred.com';
  const links = useMemo(
    () => [
      { label: 'Public apply page', path: `${base}${AF.publicPath}?ref=${encodeURIComponent(referralCode)}` },
      { label: 'Pricing & services', path: `${base}/pricing?ref=${encodeURIComponent(referralCode)}` },
      { label: 'Credit restoration landing', path: `${base}/?ref=${encodeURIComponent(referralCode)}&utm_source=affiliate&utm_medium=referral` },
      { label: 'Onboarding start', path: `${base}/onboarding?ref=${encodeURIComponent(referralCode)}&lane=affiliate` },
      {
        label: 'Free dispute letter guide',
        path: buildLeadMagnetUrl({ referralCode, guideId: 'credit-dispute-letter-guide', utmSource: 'affiliate', utmMedium: 'referral' }),
      },
      {
        label: 'Short card link (QR)',
        path: buildShortReferralUrl(referralCode),
      },
    ],
    [base, referralCode],
  );

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="fc-spotlight-panel p-6 space-y-5">
      <div>
        <div className="inline-flex items-center gap-2 text-sky-300">
          <Link2 size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">Referral toolkit</span>
        </div>
        <h3 className="mt-2 text-xl font-semibold text-white">Links ready to share & sell</h3>
        <p className="mt-2 text-white/60 text-sm max-w-2xl">
          Copy tracked links for social, email, and DMs. Your referral code is embedded so Finely can attribute conversions to your account.
        </p>
      </div>

      <div className="rounded-xl border border-sky-500/25 bg-sky-500/10 p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-sky-200/70">Your referral code</div>
          <div className="text-2xl font-bold text-sky-100 font-mono mt-1">{referralCode}</div>
        </div>
        <button
          type="button"
          onClick={() => copy(referralCode, 'code')}
          className="inline-flex items-center gap-2 px-4 py-2 fc-light-glass-panel fc-light-chrome-panel rounded-xl text-[10px] font-black uppercase tracking-widest text-white/70"
        >
          {copied === 'code' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          Copy code
        </button>
      </div>

      <div className="space-y-3">
        {links.map((link) => (
          <div key={link.label} className="fc-light-glass-panel fc-light-chrome-panel rounded-xl p-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-white font-medium text-sm">{link.label}</div>
              <div className="mt-1 text-xs text-white/45 font-mono break-all">{link.path}</div>
            </div>
            <button
              type="button"
              onClick={() => copy(link.path, link.label)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.08] bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/65 shrink-0"
            >
              {copied === link.label ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              Copy
            </button>
          </div>
        ))}
      </div>

      <LeadMagnetSharePanel compact />

      <div className="fc-light-glass-panel fc-light-chrome-panel rounded-xl p-4 flex items-start gap-3 text-sm text-white/55">
        <QrCode size={18} className="text-sky-400 shrink-0 mt-0.5" />
        <p>
          Tip: pair these links with your commission calculator numbers when pitching — upfront package commission plus recurring membership share, and Denefit contract streams when customers finance in-house.
        </p>
      </div>
    </div>
  );
}
