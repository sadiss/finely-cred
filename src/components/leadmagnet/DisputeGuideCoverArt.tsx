import React from 'react';
import { BadgeCheck, FileText } from 'lucide-react';

const BUREAUS = ['Equifax', 'Experian', 'TransUnion'] as const;

/** Branded e-guide cover face — score bar mockup (matches funnel + homepage book). */
export function DisputeGuideCoverArt({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative flex flex-col h-full w-full overflow-hidden bg-gradient-to-br from-[#0b1210] via-[#141c28] to-[#0a0f0e] text-left ${className}`}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-8%] left-[-8%] w-[55%] h-[42%] rounded-full bg-[#39ff14]/18 blur-3xl" />
        <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[30%] rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col h-full p-[7%] sm:p-[8%]">
        <p className="text-[clamp(7px,2.2vw,10px)] font-black uppercase tracking-[0.2em] text-[#39ff14]">Finely Cred</p>

        <div className="mt-[4%] flex flex-wrap gap-1">
          {BUREAUS.map((b) => (
            <span
              key={b}
              className="px-1.5 py-0.5 rounded-md border border-white/10 bg-white/[0.04] text-[clamp(5px,1.6vw,7px)] font-bold uppercase tracking-wider text-white/55"
            >
              {b}
            </span>
          ))}
        </div>

        <div className="mt-[4%] flex-1 min-h-0">
          <p className="text-[clamp(7px,2vw,9px)] font-bold uppercase tracking-wider text-emerald-300/90 mb-1">Free edition</p>
          <h3 className="text-[clamp(13px,4.5vw,22px)] font-black text-white leading-[1.08]">
            Credit Dispute
            <br />
            Letter Guide
          </h3>
          <p className="mt-[4%] text-[clamp(7px,2.1vw,10px)] text-white/65 leading-snug max-w-[95%]">
            FCRA rights · 5-step framework · certified mail workflow
          </p>
        </div>

        <div className="mt-auto rounded-lg sm:rounded-xl border border-emerald-500/35 bg-emerald-500/[0.12] p-[5%] sm:p-[6%] shadow-[0_0_24px_rgba(57,255,20,0.12)]">
          <p className="text-[clamp(6px,1.8vw,8px)] uppercase tracking-[0.18em] text-white/45 font-semibold">Overall score</p>
          <div className="mt-1 flex items-end gap-1.5">
            <span
              className="text-[clamp(22px,7.5vw,36px)] font-light text-white tabular-nums leading-none fg-score-pulse"
              style={{ textShadow: '0 0 20px rgba(57,255,20,0.35)' }}
            >
              682
            </span>
            <span className="text-[clamp(7px,2vw,10px)] text-emerald-400 font-bold pb-0.5">+24</span>
          </div>
          <div className="mt-2 h-1 sm:h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-emerald-500 to-[#39ff14] fg-score-bar-fill" />
          </div>
          <p className="mt-1.5 text-[clamp(6px,1.7vw,8px)] text-white/45">Profile + dispute readiness</p>
        </div>

        <div className="mt-[4%] flex flex-wrap items-center gap-x-2 gap-y-1 text-[clamp(6px,1.8vw,8px)] font-bold uppercase tracking-wider text-white/85">
          <span className="inline-flex items-center gap-0.5">
            <FileText className="w-[clamp(8px,2.5vw,12px)] h-[clamp(8px,2.5vw,12px)] text-[#39ff14]" /> Step-by-step
          </span>
          <span className="text-white/25 sm:inline hidden">•</span>
          <span className="inline-flex items-center gap-0.5">
            <BadgeCheck className="w-[clamp(8px,2.5vw,12px)] h-[clamp(8px,2.5vw,12px)] text-amber-300" /> FCRA checklist
          </span>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
