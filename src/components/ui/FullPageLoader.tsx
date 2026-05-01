import React from 'react';
import { Sparkles } from 'lucide-react';

export function FullPageLoader(props: { label?: string }) {
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full rounded-3xl border border-white/10 bg-black/30 backdrop-blur-xl p-8 text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-2xl border border-amber-500/25 bg-amber-500/10 flex items-center justify-center">
          <Sparkles size={22} className="text-amber-400" />
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

