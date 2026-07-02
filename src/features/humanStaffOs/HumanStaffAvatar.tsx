import React from 'react';
import type { HumanStaffAgent } from './types';

export function HumanStaffAvatar({ agent, size = 'md' }: { agent: HumanStaffAgent; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'h-16 w-16 text-xl' : size === 'sm' ? 'h-9 w-9 text-xs' : 'h-12 w-12 text-sm';
  return (
    <div className={`relative ${dim} shrink-0 rounded-2xl border border-white/15 bg-gradient-to-br ${agent.portrait.gradient} grid place-items-center shadow-lg overflow-hidden`} title={agent.portrait.visualPrompt}>
      <div className="absolute inset-0 bg-black/10" />
      <div className="relative flex flex-col items-center leading-none">
        <span aria-hidden>{agent.portrait.emoji}</span>
        <span className="mt-1 font-black tracking-wider text-white/85">{agent.portrait.initials}</span>
      </div>
    </div>
  );
}
