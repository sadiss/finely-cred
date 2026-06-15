import React, { useEffect, useState } from 'react';
import type { StaffMember } from '../../domain/staffMember';
import {
  resolveStaffPortraitDataUrl,
  resolveStaffPortraitFallbackUrl,
  resolveStaffPortraitUrl,
  STAFF_PORTRAIT_PHOTO_CLASS,
} from '../../lib/staffPortrait';

type StaffLike = Pick<StaffMember, 'id' | 'firstName' | 'lastName' | 'portraitGender' | 'avatarPath'>;

type Props = {
  staff: StaffLike;
  className?: string;
  alt?: string;
};

/** Real-person staff headshot — local JPG with remote + graded fallback. */
export function StaffPortraitImg({ staff, className = 'w-10 h-10 rounded-full', alt }: Props) {
  const [src, setSrc] = useState(() => resolveStaffPortraitUrl(staff));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSrc(resolveStaffPortraitUrl(staff));
    setFailed(false);
  }, [staff.id, staff.avatarPath]);

  const label = alt ?? `${staff.firstName} ${staff.lastName}`.trim();
  const initials = `${staff.firstName?.[0] ?? ''}${staff.lastName?.[0] ?? ''}`.toUpperCase() || '?';

  const onError = () => {
    const remote = resolveStaffPortraitFallbackUrl(staff);
    if (remote && remote !== src) {
      setSrc(remote);
      return;
    }
    const data = resolveStaffPortraitDataUrl(staff);
    if (data !== src) {
      setSrc(data);
      return;
    }
    setFailed(true);
  };

  if (failed) {
    return (
      <div
        className={`${className} bg-emerald-900/40 border border-emerald-500/25 flex items-center justify-center text-[10px] font-bold text-emerald-100`}
        aria-hidden
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={label}
      className={`${className} ${STAFF_PORTRAIT_PHOTO_CLASS}`}
      onError={onError}
    />
  );
}
