import React, { useEffect, useMemo, useState } from 'react';
import { getStaffMemberById } from '../../data/staffRoster';
import {
  resolveStaffPortraitDataUrl,
  resolveStaffPortraitFallbackUrl,
  resolveStaffPortraitUrl,
  STAFF_PORTRAIT_PHOTO_CLASS,
} from '../../lib/staffPortrait';
import { AIA_GUIDE_STAFF_ID } from './publicChatPersonaUi';
import type { PublicChatPersonaPresentation } from './publicChatPersonaUi';

type Props = {
  presentation: PublicChatPersonaPresentation;
  size?: 'sm' | 'md' | 'lg';
  showOnline?: boolean;
};
const SIZE = {
  sm: { box: 'w-9 h-9', ring: 'ring-2', text: 'text-[10px]' },
  md: { box: 'w-11 h-11', ring: 'ring-2', text: 'text-xs' },
  lg: { box: 'w-14 h-14', ring: 'ring-[3px]', text: 'text-sm' },
};

function resolvePresentationPortrait(presentation: PublicChatPersonaPresentation): string {
  if (presentation.avatarUrl?.trim()) return presentation.avatarUrl;

  const staffId = presentation.staffMemberId;
  if (staffId) {
    const roster = getStaffMemberById(staffId);
    if (roster) return resolveStaffPortraitUrl(roster);
    return resolveStaffPortraitUrl({
      id: staffId,
      firstName: presentation.firstName,
      lastName: '',
      portraitGender: staffId === AIA_GUIDE_STAFF_ID ? 'feminine' : 'neutral',
      avatarPath: '',
    });
  }

  return resolveStaffPortraitUrl({
    id: `staff-${presentation.firstName.toLowerCase()}`,
    firstName: presentation.firstName,
    lastName: '',
    portraitGender: 'neutral',
    avatarPath: '',
  });
}

export function PublicChatStaffAvatar({ presentation, size = 'md', showOnline = false }: Props) {
  const initialSrc = useMemo(() => resolvePresentationPortrait(presentation), [presentation]);
  const [imgSrc, setImgSrc] = useState(initialSrc);
  const [imgFailed, setImgFailed] = useState(false);
  const s = SIZE[size];

  useEffect(() => {
    setImgSrc(resolvePresentationPortrait(presentation));
    setImgFailed(false);
  }, [presentation]);

  const handleError = () => {
    const staffId = presentation.staffMemberId;
    if (staffId) {
      const staff =
        getStaffMemberById(staffId) ??
        ({
          id: staffId,
          firstName: presentation.firstName,
          lastName: '',
          portraitGender: staffId === AIA_GUIDE_STAFF_ID ? 'feminine' : 'neutral',
          avatarPath: '',
        } as const);
      const fallback = resolveStaffPortraitFallbackUrl(staff);
      if (fallback && fallback !== imgSrc) {
        setImgSrc(fallback);
        return;
      }
      const data = resolveStaffPortraitDataUrl(staff);
      if (data && data !== imgSrc) {
        setImgSrc(data);
        return;
      }
    }
    setImgFailed(true);
  };

  return (
    <div className="relative shrink-0">
      <div
        className={`${s.box} ${s.ring} ring-emerald-400/50 rounded-full overflow-hidden bg-gradient-to-br ${presentation.avatarGradient} shadow-lg shadow-emerald-900/30 flex items-center justify-center`}
      >
        {!imgFailed && imgSrc ? (
          <img
            src={imgSrc}
            alt={`${presentation.firstName}, ${presentation.title}`}
            className={`w-full h-full bg-slate-900/30 ${STAFF_PORTRAIT_PHOTO_CLASS}`}
            onError={handleError}
          />
        ) : (
          <span className={`${s.text} font-black text-emerald-950/80`} aria-hidden>
            {presentation.initials}
          </span>
        )}
      </div>
      {showOnline ? (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white shadow-[0_0_10px_rgba(52,211,153,0.75)]"
          title="Online now"
        />
      ) : null}
    </div>
  );
}
