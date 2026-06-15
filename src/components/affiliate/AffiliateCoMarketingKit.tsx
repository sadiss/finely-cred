import React, { useMemo, useState } from 'react';
import { Copy, Download, Megaphone, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { getUserProfileMeta } from '../../auth/userProfile';
import { buildPromotedUrl } from '../../lib/leadAttribution';
import { AF } from '../../config/affiliateProgram';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlassShell,
} from '../../features/os/finelyOsLightUi';

const SOCIAL_SNIPPETS = [
  'Start with our free dispute letter guide — see what Finely Cred can do before you commit.',
  'Business credit is a sequence, not luck. Finely maps vendors → lender logic → funding readiness.',
  'Credit Specialists run client files on Finely OS — disputes, letters, vault, and partner portal in one stack.',
];

function slugifyCode(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 36);
}

export function AffiliateCoMarketingKit() {
  const auth = useAuth();
  const { partner } = usePartnerSession();
  const navigate = useNavigate();
  const meta = getUserProfileMeta(auth.user);
  const [copied, setCopied] = useState<string | null>(null);

  const promoCode = useMemo(() => {
    const metaCode = (meta as Record<string, unknown>).affiliateReferralCode as string | undefined;
    const base = metaCode || partner?.profile?.email?.split('@')[0] || auth.user?.email?.split('@')[0] || 'affiliate';
    return slugifyCode(`affiliate-${base}`);
  }, [auth.user?.email, meta, partner?.profile?.email]);

  const assets = useMemo(() => {
    const common = {
      referralCode: promoCode,
      promoterRole: 'affiliate' as const,
      utmSource: 'affiliate',
      utmMedium: 'co-marketing',
      utmCampaign: 'affiliate-kit',
    };
    return [
      { label: 'Free dispute guide', url: buildPromotedUrl({ ...common, path: '/free-guide?guide=credit-dispute-letter-guide', promoType: 'guide', promoAsset: 'credit-dispute-letter-guide' }) },
      { label: 'Resources library', url: buildPromotedUrl({ ...common, path: '/resources', promoType: 'guide', promoAsset: 'resources' }) },
      { label: 'Bookstore / ebooks', url: buildPromotedUrl({ ...common, path: '/bookstore', promoType: 'ebook', promoAsset: 'bookstore' }) },
      { label: 'Pricing', url: buildPromotedUrl({ ...common, path: '/pricing', promoType: 'service', promoAsset: 'pricing' }) },
      { label: 'Strategy call', url: buildPromotedUrl({ ...common, path: '/enlightenment-session', promoType: 'service', promoAsset: 'enlightenment-session' }) },
      { label: 'Affiliate signup', url: buildPromotedUrl({ ...common, path: AF.publicPath, promoType: 'signup', promoAsset: 'affiliate' }) },
    ];
  }, [promoCode]);

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      // ignore
    }
  };

  const downloadCsv = () => {
    const rows = [['label', 'url', 'referral_code'], ...assets.map((a) => [a.label, a.url, promoCode])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finely-affiliate-comarketing-${promoCode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`${finelyOsGlassShell('panel', 'emerald')} space-y-4`}>
      <div className="inline-flex items-center gap-2 text-emerald-300">
        <Megaphone size={18} />
        <span className={FINELY_OS_ENTITY_SUBLABEL}>Co-marketing kit</span>
      </div>
      <p className={FINELY_OS_ENTITY_BODY}>
        Export attributed links, copy social snippets, and open comms templates — everything carries your referral code.
      </p>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={downloadCsv} className={FINELY_OS_PRIMARY_BTN}>
          <Download size={14} /> Export link CSV
        </button>
        <button type="button" onClick={() => navigate('/portal/education')} className={FINELY_OS_SECONDARY_BTN}>
          Education library
        </button>
        <button type="button" onClick={() => navigate(`${AF.hubPath}?tab=operate`)} className={FINELY_OS_SECONDARY_BTN}>
          Campaign manager
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {assets.map((a) => (
          <div key={a.label} className="fc-light-glass-panel fc-light-chrome-panel rounded-xl p-3 space-y-2">
            <div className={FINELY_OS_ENTITY_VALUE}>{a.label}</div>
            <div className={`text-xs font-mono break-all ${FINELY_OS_ENTITY_BODY}`}>{a.url}</div>
            <button type="button" onClick={() => void copy(a.url, a.label)} className={FINELY_OS_SECONDARY_BTN}>
              {copied === a.label ? <Check size={14} /> : <Copy size={14} />} Copy link
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Social snippets</div>
        {SOCIAL_SNIPPETS.map((snippet, i) => (
          <div key={i} className="flex flex-wrap items-start justify-between gap-2 fc-light-glass-panel fc-light-chrome-panel rounded-xl p-3">
            <p className={`text-sm ${FINELY_OS_ENTITY_BODY} flex-1 min-w-0`}>{snippet}</p>
            <button type="button" onClick={() => void copy(`${snippet} ${assets[0]?.url ?? ''}`, `snip-${i}`)} className={FINELY_OS_SECONDARY_BTN}>
              {copied === `snip-${i}` ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
