import React from 'react';
import { ExternalLink, Share2 } from 'lucide-react';
import { STAFF_SOCIAL_PRESENCE } from '../../features/staffCommandCenter/staffSocialPresence';
import { findStaff, staffFullName } from '../../features/staffCommandCenter/staffRoster';
import { StaffPortraitImg } from '../staff/StaffPortraitImg';
import { FINELY_OS_ENTITY_BODY } from '../../features/os/finelyOsLightUi';

type Props = {
  staffId?: string;
  compact?: boolean;
};

/** Brand-page social proof links only — no personal DMs. */
export function PartnerSocialProofStrip({ staffId, compact = false }: Props) {
  const presence = staffId
    ? STAFF_SOCIAL_PRESENCE.find((p) => p.staffId === staffId)
    : STAFF_SOCIAL_PRESENCE.find((p) => p.mission === 'authority' || p.mission === 'nurture');
  if (!presence) return null;

  const staff = findStaff(presence.staffId);
  const platforms = Object.entries(presence.platforms).filter(([, slot]) => slot?.handle && slot.status !== 'not_started');

  if (!platforms.length) return null;

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-white/55">
        <Share2 size={12} className="text-violet-300" />
        <span>Finely brand pages:</span>
        {platforms.slice(0, 2).map(([plat, slot]) => (
          <span key={plat} className="rounded-full border border-white/10 px-2 py-0.5 text-white/60">
            {plat} {slot?.handle}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
      <div className="flex items-start gap-3">
        {staff ? (
          <div className="h-12 w-12 rounded-xl overflow-hidden ring-1 ring-white/15 shrink-0">
            <StaffPortraitImg
              staff={{
                id: staff.id,
                firstName: staff.firstName,
                lastName: staff.lastName,
                portraitGender: staff.portrait?.portraitGender ?? 'neutral',
                avatarPath: `staff-portrait://${staff.id}`,
              }}
              className="h-full w-full"
              alt={staffFullName(staff)}
            />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-white">{presence.displayName}</div>
          <p className={`text-xs mt-1 ${FINELY_OS_ENTITY_BODY}`}>{presence.bioLine}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {platforms.map(([plat, slot]) => (
              <span
                key={plat}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] uppercase tracking-wider text-white/60"
              >
                {plat} · {slot?.handle}
                <ExternalLink size={10} />
              </span>
            ))}
          </div>
          <p className={`text-[10px] mt-2 ${FINELY_OS_ENTITY_BODY}`}>
            Official Finely Cred brand pages only — educational content, not legal advice.
          </p>
        </div>
      </div>
    </div>
  );
}
