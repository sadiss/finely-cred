import React from 'react';
import type { WalkthroughScene } from '../../../specialistAcademy/academyWalkthroughs';

function SampleBadge() {
  return (
    <span className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-lg bg-rose-500/90 text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
      SAMPLE / DEMO
    </span>
  );
}

function Chrome({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="relative rounded-2xl border border-white/10 bg-[#070b09] overflow-hidden shadow-2xl shadow-black/50">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 bg-black/40">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
        </div>
        <span className="text-white/40 text-xs ml-2 truncate flex-1">finelycred.com · {title}</span>
      </div>
      <div className="relative p-4 md:p-5 min-h-[220px] md:min-h-[280px] bg-gradient-to-br from-[#0b1110] via-[#0a0f0e] to-[#050807]">
        {children}
      </div>
    </div>
  );
}

export function ProductDemoFrame({ scene }: { scene: WalkthroughScene }) {
  switch (scene) {
    case 'portal-home':
      return (
        <Chrome title="portal / dashboard">
          <SampleBadge />
          <div className="grid grid-cols-3 gap-3">
            {['Messages', 'Documents', 'Credit Restore'].map((l, i) => (
              <div
                key={l}
                className={`rounded-xl border p-3 text-center text-xs font-semibold ${
                  i === 2
                    ? 'border-amber-500/50 bg-amber-500/15 text-amber-100 ring-2 ring-amber-400/30'
                    : 'border-white/10 bg-white/[0.03] text-white/60'
                }`}
              >
                {l}
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-white/50">
            <div className="rounded-lg border border-white/10 p-2">Tasks · 3 due</div>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 text-emerald-100/80">BUILD progress</div>
          </div>
        </Chrome>
      );
    case 'reports':
      return (
        <Chrome title="portal / reports">
          <SampleBadge />
          <div className="flex gap-3">
            <div className="w-1/3 space-y-2">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-2 text-amber-100 text-xs font-semibold">
                + Upload tri-merge
              </div>
              <div className="rounded-lg border border-white/10 px-2 py-2 text-white/50 text-xs">Report · Mar 2026 DEMO</div>
            </div>
            <div className="flex-1 rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="text-emerald-400/90 text-[10px] font-black uppercase mb-2">Credit Intel · parsed</div>
              <div className="space-y-1.5 text-xs text-white/70">
                <div className="flex justify-between"><span>CAPITAL ONE •••• 4821</span><span className="text-rose-300">Charge-off</span></div>
                <div className="flex justify-between"><span>MIDLAND •••• 1092</span><span className="text-amber-300">Collection</span></div>
                <div className="text-white/40">SSN/DOB masked in demo</div>
              </div>
            </div>
          </div>
        </Chrome>
      );
    case 'negative-detail':
      return (
        <Chrome title="disputes / tradeline">
          <SampleBadge />
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <div className="text-white font-semibold text-sm">CAPITAL ONE · •••• 4821</div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-white/55">
              <div>Balance <span className="text-white">$1,842</span></div>
              <div>Status <span className="text-rose-300">Charge-off</span></div>
              <div>DOFD <span className="text-white">09/2024</span></div>
            </div>
            <div className="mt-3 h-8 rounded bg-white/5 flex items-center px-2 text-[10px] text-white/40">Payment grid · 30·60·90…</div>
            <button type="button" className="mt-3 px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-100 text-xs font-bold">
              Dispute inaccuracy
            </button>
          </div>
        </Chrome>
      );
    case 'dispute-builder':
      return (
        <Chrome title="letters / dispute builder">
          <SampleBadge />
          <div className="grid grid-cols-5 gap-2 h-full">
            <div className="col-span-2 rounded-lg border border-white/10 p-2 text-[10px] text-white/50 space-y-1">
              <div className="text-amber-300 font-bold">Templates</div>
              <div>Round 1 — FCRA factual</div>
              <div>Round 2 — MOFV</div>
            </div>
            <div className="col-span-3 rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 text-[11px] text-white/75 leading-relaxed">
              Dear Bureau, I dispute the reporting on account •••• 4821. Exhibit A shows…
              <div className="mt-2 text-right">
                <span className="inline-block px-2 py-1 rounded bg-amber-500 text-black text-[10px] font-black">GENERATE</span>
              </div>
            </div>
          </div>
        </Chrome>
      );
    case 'evidence-gate':
      return (
        <Chrome title="compliance / evidence">
          <SampleBadge />
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="text-emerald-200 text-xs font-bold uppercase">Evidence required</div>
            <div className="mt-2 flex gap-2">
              <div className="w-16 h-12 rounded border border-dashed border-white/20 bg-black/30 text-[9px] text-center text-white/40 flex items-center justify-center">
                Screenshot exhibit
              </div>
              <div className="flex-1 text-[11px] text-white/60">Attach tradeline capture before mail unlocks.</div>
            </div>
          </div>
        </Chrome>
      );
    case 'mail-preview':
      return (
        <Chrome title="mail / preview">
          <SampleBadge />
          <div className="flex gap-3">
            <div className="w-24 h-32 rounded border border-white/15 bg-white/5 text-[9px] text-white/40 flex items-center justify-center text-center p-1">
              PDF preview
            </div>
            <div className="flex-1 space-y-2 text-xs">
              <div className="text-white/80 font-semibold">Certified mail · LetterStream</div>
              <div className="text-white/50">Tracking # 9407 •••• •••• 4821 DEMO</div>
              <button type="button" className="px-3 py-1.5 rounded-lg bg-amber-500 text-black font-black text-[10px]">
                QUEUE MAIL
              </button>
            </div>
          </div>
        </Chrome>
      );
    case 'tasks':
      return (
        <Chrome title="portal / tasks">
          <SampleBadge />
          <div className="space-y-2">
            {[
              { t: 'Round 2 window opens', d: 'Apr 12', c: 'amber' },
              { t: 'Validation follow-up', d: 'Apr 5', c: 'emerald' },
            ].map((row) => (
              <div
                key={row.t}
                className={`flex justify-between rounded-lg border px-3 py-2 text-xs ${
                  row.c === 'amber' ? 'border-amber-500/30 bg-amber-500/10' : 'border-emerald-500/30 bg-emerald-500/5'
                }`}
              >
                <span className="text-white/80">{row.t}</span>
                <span className="text-white/45">{row.d}</span>
              </div>
            ))}
          </div>
        </Chrome>
      );
    case 'debt-center':
      return (
        <Chrome title="debt & summons center">
          <SampleBadge />
          <div className="rounded-xl border border-violet-500/25 bg-violet-500/10 p-4">
            <div className="text-violet-100 font-semibold text-sm">MIDLAND · validation</div>
            <div className="mt-2 text-[11px] text-white/60">§809 educational request · certified mail</div>
            <button type="button" className="mt-3 px-3 py-1.5 rounded-lg bg-amber-500 text-black text-[10px] font-black">
              SEND VALIDATION
            </button>
          </div>
        </Chrome>
      );
    case 'summons':
      return (
        <Chrome title="litigation command">
          <SampleBadge />
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
            <div className="text-rose-100 font-semibold text-sm">Summons uploaded · DEMO</div>
            <div className="mt-2 text-[11px] text-white/60">Answer deadline · counsel flag</div>
            <div className="mt-2 inline-flex px-2 py-1 rounded border border-rose-400/40 text-rose-200 text-[10px]">
              Calendar + attorney review
            </div>
          </div>
        </Chrome>
      );
    default:
      return null;
  }
}
