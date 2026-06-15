import React, { useMemo, useState } from 'react';
import { Copy, Link2, QrCode } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { getUserProfileMeta } from '../../auth/userProfile';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import {
  buildLeadMagnetUrl,
  buildShortReferralUrl,
  qrCodeImageUrl,
} from '../../lib/leadAttribution';
import { downloadLeadMagnetQrPdf } from '../../resources/downloadLeadMagnetQrPdf';

function slugifyCode(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);
}

/** Shareable lead-magnet links + QR for brochures, cards, and virtual cards. */
export function LeadMagnetSharePanel({ compact }: { compact?: boolean }) {
  const auth = useAuth();
  const { partner } = usePartnerSession();
  const meta = getUserProfileMeta(auth.user);
  const [copied, setCopied] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const referralCode = useMemo(() => {
    const fromMeta = (meta as Record<string, unknown>).affiliateReferralCode as string | undefined;
    if (fromMeta?.trim()) return slugifyCode(fromMeta);
    if (partner?.profile?.email) return slugifyCode(partner.profile.email.split('@')[0] || 'partner');
    if (auth.user?.email) return slugifyCode(auth.user.email.split('@')[0] || 'partner');
    return 'finely-partner';
  }, [meta, partner, auth.user]);

  const links = useMemo(
    () => [
      {
        label: 'Full funnel page',
        url: buildLeadMagnetUrl({ referralCode, guideId: 'credit-dispute-letter-guide', utmSource: 'partner', utmMedium: 'link' }),
      },
      {
        label: 'Short card link (/g/)',
        url: buildShortReferralUrl(referralCode),
      },
      {
        label: 'Resources library',
        url: buildLeadMagnetUrl({ basePath: '/resources', referralCode, guideId: 'credit-dispute-letter-guide', utmSource: 'partner', utmMedium: 'resources' }),
      },
    ],
    [referralCode],
  );

  const qrUrl = qrCodeImageUrl(links[1]?.url ?? buildShortReferralUrl(referralCode));

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
    <div className={`rounded-2xl border border-emerald-500/25 bg-emerald-500/5 ${compact ? 'p-4' : 'p-6'} space-y-4`}>
      <div className="inline-flex items-center gap-2 text-emerald-300">
        <Link2 size={16} />
        <span className="text-[10px] font-black uppercase tracking-widest">Share & signup links</span>
      </div>
      <p className="text-white/60 text-sm">
        Share on brochures, business cards, virtual cards, or SMS. Leads tag with your code <span className="font-mono text-emerald-200">{referralCode}</span>.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          {links.map((l) => (
            <div key={l.label} className="fc-light-glass-panel fc-light-chrome-panel rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-widest text-white/45 font-black">{l.label}</div>
              <div className="mt-1 text-xs text-white/55 break-all font-mono">{l.url}</div>
              <button
                type="button"
                onClick={() => copy(l.url, l.label)}
                className="mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-300"
              >
                <Copy size={12} /> {copied === l.label ? 'Copied' : 'Copy'}
              </button>
            </div>
          ))}
        </div>
        <div className="fc-light-glass-panel fc-light-chrome-panel rounded-xl p-4 flex flex-col items-center gap-3">
          <QrCode size={18} className="text-emerald-300" />
          <img src={qrUrl} alt="QR code for signup link" className="rounded-lg border border-white/[0.08] w-[180px] h-[180px]" />
          <div className="text-[10px] text-white/45 text-center">Scan on physical cards · prints to brochure</div>
          <button
            type="button"
            disabled={pdfBusy}
            onClick={async () => {
              setPdfBusy(true);
              try {
                await downloadLeadMagnetQrPdf({ referralCode });
              } finally {
                setPdfBusy(false);
              }
            }}
            className="fc-button-white-sm w-full justify-center"
          >
            {pdfBusy ? 'Generating…' : 'Download print-ready QR PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
