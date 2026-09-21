import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube } from 'lucide-react';
import { FINELY_PACK_ASSETS } from './finelyPackCatalog';
import { MarketingReadyAssetCard } from './MarketingReadyAssetCard';
import { FC_CARD_GRID, FC_SECTION_SHELL } from '../../styles/layoutSurfaces';

const DAY_SHEET_IDS: Record<number, string> = {
  1: 'html-one-sheets/day-01-welcome.html',
  6: 'html-one-sheets/vertical-haitian-immigration.html',
  8: 'html-one-sheets/day-08-score-literacy-consumer.html',
  15: 'html-one-sheets/day-15-funding-readiness.html',
  21: 'html-one-sheets/day-21-partner-finale.html',
};

function smsAsset(day: number) {
  return FINELY_PACK_ASSETS.find((a) => a.id === `sms-day-${String(day).padStart(2, '0')}`);
}

function companionHtml(day: number) {
  const path = DAY_SHEET_IDS[day];
  if (!path) return null;
  return FINELY_PACK_ASSETS.find((a) => a.contentPath === path) ?? null;
}

export function SocialMediaDesk({ floorName }: { floorName: string }) {
  const postToday = useMemo(() => [1, 2, 3, 4, 5, 6, 7].map((d) => ({ day: d, sms: smsAsset(d), sheet: companionHtml(d) })), []);
  const calendar = useMemo(() => Array.from({ length: 21 }, (_, i) => i + 1), []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6">
      <header className={FC_SECTION_SHELL}>
        <div className="flex flex-wrap items-start gap-4">
          <img src="/brand/finely-cred-mark.png" alt="" className="h-12 w-12 rounded-full object-cover" width={48} height={48} />
          <div>
            <h3 className="text-2xl font-bold text-white">Social Media</h3>
            <p className="mt-2 text-white/80 max-w-3xl">
              Post on <strong className="text-white">Facebook</strong> and <strong className="text-white">YouTube</strong>. Manual paste
              only — HQ never auto-posts. ({floorName})
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <ChannelPill icon={Facebook} label="Facebook" status="owned" />
          <ChannelPill icon={Youtube} label="YouTube" status="owned" />
          <ChannelPill icon={Instagram} label="Instagram" status="paused" />
        </div>
        <Link to="/admin/media-studio" className="inline-flex text-sm font-bold text-[#fbbf24] underline">
          Open Media Studio for creative assets
        </Link>
      </header>

      <section className="space-y-4">
        <h4 className="text-xl font-bold text-white">Post today (days 1–7)</h4>
        <p className="text-white/70 text-sm">Copy caption from pack → paste into Facebook or YouTube. Attach suggested one-sheet when listed.</p>
        <div className={`${FC_CARD_GRID} md:grid-cols-2 xl:grid-cols-3`}>
          {postToday.map(({ day, sms, sheet }) =>
            sms ? (
              <MarketingReadyAssetCard key={sms.id} asset={sms} />
            ) : (
              <div key={day} className="rounded-2xl border border-dashed border-white/20 bg-[#0b1110] p-5 text-white/60 text-sm">
                Day {day} — SMS pack missing
              </div>
            ),
          )}
        </div>
        {postToday.some((x) => x.sheet) ? (
          <p className="text-white/55 text-xs">
            Suggested images:{' '}
            {postToday
              .filter((x) => x.sheet)
              .map((x) => `Day ${x.day} → ${x.sheet!.title}`)
              .join(' · ')}
          </p>
        ) : null}
      </section>

      <section className="space-y-4">
        <h4 className="text-xl font-bold text-white">21-day social calendar</h4>
        <p className="text-white/70 text-sm">One cell per day — open the matching SMS pack for caption text.</p>
        <div className={`${FC_CARD_GRID} grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7`}>
          {calendar.map((day) => {
            const asset = smsAsset(day);
            return (
              <div
                key={day}
                className="rounded-xl border border-white/15 bg-[#0b1110] p-3 text-center text-xs text-white/75"
                title={asset?.title}
              >
                <div className="font-bold text-[#fbbf24]">D{day}</div>
                <div className="mt-1">{asset ? 'Ready' : '—'}</div>
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
    <span
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${
        status === 'owned'
          ? 'border-[#fbbf24]/40 bg-[#fbbf24]/10 text-[#fde68a]'
          : 'border-white/15 bg-black/30 text-white/55'
      }`}
    >
      <Icon size={18} />
      {label}
      {status === 'paused' ? <span className="text-[10px] uppercase tracking-wider opacity-80">paused</span> : null}
    </span>
  );
}
