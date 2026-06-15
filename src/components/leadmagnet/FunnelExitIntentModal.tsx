import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';

/** Exit-intent capture for lead magnet funnels (Phase 11). */
export function FunnelExitIntentModal(props: {
  active: boolean;
  headline: string;
  ctaLabel: string;
  onAccept: () => void;
}) {
  const [open, setOpen] = useState(false);
  const dismissedRef = useRef(false);

  useEffect(() => {
    if (!props.active || dismissedRef.current) return;

    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY > 24) return;
      if (dismissedRef.current) return;
      dismissedRef.current = true;
      setOpen(true);
    };

    document.addEventListener('mouseout', onMouseOut);
    return () => document.removeEventListener('mouseout', onMouseOut);
  }, [props.active]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-emerald-500/30 bg-[#0a0f0a] p-6 shadow-2xl">
        <button
          type="button"
          aria-label="Close"
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 text-white/45 hover:text-white"
        >
          <X size={18} />
        </button>
        <div className="text-[10px] uppercase tracking-widest text-emerald-300 mb-2">Wait — before you go</div>
        <h3 className="text-xl font-black text-white mb-2">{props.headline}</h3>
        <p className="text-sm text-white/60 mb-5">Grab the free PDF + bonus stack now. No card required.</p>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            props.onAccept();
          }}
          className="w-full fg-cta-primary py-3 rounded-xl inline-flex items-center justify-center gap-2 font-black uppercase tracking-widest text-sm"
        >
          {props.ctaLabel} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
