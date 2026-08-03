import React from 'react';
import { BookOpen, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PUBLIC_CAREER_TRACKS, getCareerTrack, type PublicCareerTrackId } from '../../config/publicCareers';
import { DigitalInviteCardShare } from '../digitalCards/DigitalInviteCardShare';
import { getDigitalInviteIncentive } from '../../config/digitalInviteCardDesign';
import type { DigitalInviteCardRole } from '../../config/digitalInviteCards';

type Props = {
  active: PublicCareerTrackId;
  className?: string;
};

/** Digital invite card for tracks that have one — additive, hidden for tracks without a role yet. */
const TRACK_INVITE_CARD: Partial<Record<PublicCareerTrackId, { role: DigitalInviteCardRole }>> = {
  credit_specialists: { role: 'cs' },
  agency_partners: { role: 'agency' },
  au_sellers: { role: 'au_seller' },
  case_help: { role: 'case_help' },
  real_estate: { role: 're' },
  affiliates: { role: 'affiliate' },
};

/** Jump between career tracks without mixing specialist vs agency messaging. */
export function CareersQuickNav({ active, className = '' }: Props) {
  const navigate = useNavigate();
  const inviteCard = TRACK_INVITE_CARD[active];
  const incentive = inviteCard ? getDigitalInviteIncentive(inviteCard.role) : null;
  const activeTrack = getCareerTrack(active);

  return (
    <nav
      className={`rounded-2xl border-2 border-slate-200 bg-slate-50 p-3 sm:p-4 ${className}`}
      aria-label="Career tracks"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Careers — pick your track</p>
        {activeTrack.guidePath && activeTrack.guideLabel ? (
          <button
            type="button"
            onClick={() => navigate(activeTrack.guidePath!)}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-500/60 bg-amber-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-amber-800 transition-colors hover:bg-amber-100"
          >
            <BookOpen size={13} /> {activeTrack.guideLabel}
          </button>
        ) : null}
      </div>
      <p className="mb-3 text-xs text-slate-500">{activeTrack.hint}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {PUBLIC_CAREER_TRACKS.map((track) => {
          const isActive = track.id === active;
          return (
            <button
              key={track.id}
              type="button"
              onClick={() => {
                if (!isActive) navigate(track.path);
              }}
              className={
                'text-left rounded-xl px-4 py-4 border-2 transition-all ' +
                (isActive
                  ? 'border-violet-500 bg-white shadow-md ring-2 ring-violet-200'
                  : 'border-slate-200 bg-white hover:border-violet-300 hover:shadow-sm')
              }
            >
              <div className={`text-base sm:text-lg font-bold ${isActive ? 'text-violet-700' : 'text-slate-900'}`}>
                {track.shortLabel}
              </div>
              <div className="text-xs sm:text-sm text-slate-500 mt-1 leading-snug">{track.hint}</div>
            </button>
          );
        })}
      </div>
      {inviteCard && incentive ? (
        <details className="mt-3 group rounded-xl border border-violet-200 bg-white/60 px-3 py-2.5">
          <summary className="cursor-pointer select-none flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-700 hover:text-violet-800">
            <QrCode size={14} className="shrink-0" />
            <span>Get your shareable invite card</span>
            <span className="font-medium normal-case tracking-normal text-slate-500">
              — join through this card, unlock {incentive.label.toLowerCase()}
            </span>
          </summary>
          <div className="mt-3 max-w-md">
            <DigitalInviteCardShare role={inviteCard.role} maxWidth={420} />
          </div>
        </details>
      ) : null}
    </nav>
  );
}
