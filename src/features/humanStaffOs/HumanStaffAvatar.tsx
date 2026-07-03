import React from 'react';
import type { HumanStaffAgent } from './types';
import { humanStaffDisplayName } from './humanStaffRosterBridge';
import { StaffPortraitImg } from '../../components/staff/StaffPortraitImg';
import { STAFF_ROSTER_PROFILES } from '../staffCommandCenter/staffRosterProfiles';

const PHOTO_CLASS = 'object-cover object-[center_18%] contrast-[1.03] saturate-[0.96]';

export function HumanStaffAvatar({ agent, size = 'md', active = false }: { agent: HumanStaffAgent; size?: 'sm' | 'md' | 'lg'; active?: boolean }) {
  const dim = size === 'lg' ? 'h-16 w-16' : size === 'sm' ? 'h-10 w-10' : 'h-14 w-14';
  const ring = active ? 'ring-2 ring-violet-300 ring-offset-2 ring-offset-black' : 'ring-1 ring-white/15';
  const label = humanStaffDisplayName(agent);
  const seed = STAFF_ROSTER_PROFILES[agent.id];
  const parts = agent.name.trim().split(/\s+/);
  const firstName = seed?.firstName ?? parts[0] ?? agent.name;
  const lastName = seed?.lastName ?? parts.slice(1).join(' ') ?? '';

  return (
    <div className={`relative ${dim} shrink-0 rounded-2xl ${ring} shadow-lg overflow-hidden bg-zinc-900`} title={label}>
      <StaffPortraitImg
        staff={{
          id: agent.id,
          firstName,
          lastName,
          portraitGender: seed?.portraitGender ?? 'neutral',
          avatarPath: `staff-portrait://${agent.id}`,
        }}
        className={`absolute inset-0 h-full w-full rounded-2xl ${PHOTO_CLASS}`}
        alt={label}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
