import React from 'react';
import { FinelyCredLogo } from '../brand/FinelyCredLogo';

export function FullPageLoader(props: { label?: string }) {
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full fc-light-glass-panel fc-light-chrome-panel rounded-3xl p-8 text-center space-y-4">
        <div className="mx-auto flex justify-center">
          <FinelyCredLogo size="lg" />
        </div>
        <div className="text-white font-semibold text-lg">Loading</div>
        <div className="text-white/60 text-sm">{props.label ?? 'Preparing your experience…'}</div>
        <div className="pt-2 flex justify-center">
          <div className="w-10 h-10 border-2 border-amber-500/40 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}

