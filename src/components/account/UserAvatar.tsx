import React from 'react';
import type { User } from '@supabase/supabase-js';
import { getUserAvatarUrl, getUserInitials } from '../../auth/userProfile';

type UserAvatarProps = {
  user: User | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Optional override for preview before save. */
  avatarUrl?: string | null;
};

const sizeClasses = {
  sm: 'w-8 h-8 text-[10px]',
  md: 'w-10 h-10 text-xs',
  lg: 'w-16 h-16 text-base',
};

export function UserAvatar({ user, size = 'md', className = '', avatarUrl }: UserAvatarProps) {
  const resolvedUrl = avatarUrl !== undefined ? avatarUrl : getUserAvatarUrl(user);
  const initials = getUserInitials(user);

  if (resolvedUrl) {
    return (
      <img
        src={resolvedUrl}
        alt=""
        className={`rounded-full object-cover border border-white/15 bg-white/[0.07] ${sizeClasses[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full border border-amber-500/30 bg-gradient-to-br from-amber-500/25 to-amber-700/10 flex items-center justify-center font-black text-amber-100 ${sizeClasses[size]} ${className}`}
      aria-hidden
    >
      {initials}
    </div>
  );
}
