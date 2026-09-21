import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube } from 'lucide-react';
import { FINELY_PACK_ASSETS } from './finelyPackCatalog';
import { getFinelyPackRaw } from './finelyPackContent';
import { MarketingReadyAssetCard } from './MarketingReadyAssetCard';

const DAY_SHEET_HINTS: Record<number, string> = {
  1: 'day-01-welcome.html',
  6: 'vertical-haitian-immigration.html',
  8: 'day-08-score-literacy-consumer.html',
  15: 'day-15-funding-readiness.html',
  21: 'day-21-partner-finale.html',
};

function smsAsset(day: number) {
  return FINELY_PACK_ASSETS.find((a) => a.id === `sms-day-${String(day).padStart(2, '0')}`);
}

function htmlAsset(file: string) {
  return FINELY_PACK_ASSETS.find((a) => a.contentPath === `html-one-sheets/${file}`);
}

export function SocialMediaDesk({ floorName }: { floorName: string }) {
  const postToday = useMemo(() => [1, 2, 3, 4, 5, 6, 7].map((d) => ({ day: d, sms: smsAsset(d), sheet: DAY_SHEET_HINTS[d] })), []);
  const calendar = useMemo(() => Array.from({ length: 21 }, (_, i) => i + 1), []);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-[#fbbf24]/40 bg-gradient-to-br from-[#0b1110] to-[#060908] p-6 sm:p-8">
        <div className="flex flex-wrap items-start gap-4">
          <img src="/brand/finely-cred-mark.png" alt="" className="h-12 w-12 rounded-full object-cover" width={48} height={48} />
          <div>
            <h3 className="text-2xl font-bold text-white">Social Media Desk</h3>
            <p className="mt-2 text-white/80 max-w-3xl">
              Post on <strong className="text-white">Facebook</strong> and <strong className="text-white">YouTube</strong>. Manual paste
              only — HQ never auto-posts. ({floorName})
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <ChannelPill icon={Facebook} label="Facebook" status="owned" />
          <ChannelPill icon={Youtube} label="YouTube" status="owned" />
          <ChannelPill icon={Instagram} label="Instagram" status="paused" />
        </div>
        <Link
          to="/admin/media-studio"
          className="inline-flex mt-4 text-sm font-bold text-[#fbbf24] underline"
        >
          Open Media Studio for creative assets
        </Link>
      </div>

      <section className="rounded-2xl border border-[#fbbf24]/25 bg-black/40 p-6 space-y-4">
        <h4 className="text-xl font-bold text-white">Post today (days 1–7)</h4>
        <p className="text-white/65 text-sm">Copy caption from pack → paste into Facebook or YouTube. Attach suggested one-sheet when listed.</p>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {postToday.map(({ day, sms, sheet }) => {
            const raw = sms ? getFinelyPackRaw(sms.contentPath) ?? '' : '';
            const preview = raw.split('Social caption:')[1]?.trim().split('\n')[0] ?? raw.slice(0, 160);
            const card = sheet ? htmlAsset(sheet) : null;
            return (
              <div key={day} className="rounded-xl border border-white/10 bg-[#0b1110] p-4 space-y-2">
                <div className="text-[#fbbf24] text-xs font-black uppercase tracking-widest">Day {day}</div>
                <p className="text-white/75 text-sm line-clamp-3">{preview || 'Open SMS pack for full caption.'}</p>
                {card ? (
                  <p className="text-[11px] text-white/50">Image: {card.title}</p>
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 pt-2">
          {postToday.filter((x) => x.sms).map(({ sms }) => (
            <MarketingReadyAssetCard key={sms!.id} asset={sms!} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0b1110] p-6">
        <h4 className="text-xl font-bold text-white">21-day social calendar</h4>
        <p className="text-white/65 text-sm mt-1">One row per day — SMS/caption files drive Facebook & YouTube posts.</p>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {calendar.map((day) => {
            const asset = smsAsset(day);
            return (
              <div
                key={day}
                className="rounded-lg border border-white/10 bg-black/30 p-2 text-center text-xs text-white/70"
                title={asset?.title}
              >
                <div className="font-bold text-[#fbbf24]">D{day}</div>
                <div className="truncate mt-1">{asset ? 'Ready' : '—'}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ChannelPill({
  icon: Icon,
  label,
  status,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  status: 'owned' | 'paused';
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${
        status === 'owned'
          ? 'border-[#fbbf24]/45 bg-[#fbbf24]/10 text-[#fde68a]'
          : 'border-white/15 bg-white/5 text-white/45'
      }`}
    >
      <Icon size={16} />
      {label}
      <span className="text-[10px] uppercase tracking-widest opacity-80">{status}</span>
    </div>
  );
}
