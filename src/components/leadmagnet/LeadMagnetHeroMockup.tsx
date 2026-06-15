import React from 'react';
import {
  Bell,
  CheckCircle2,
  BadgeCheck,
  Download,
  FileText,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Lock,
  MessageCircle,
  Scale,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { FinelyCredLogo } from '../brand/FinelyCredLogo';

const COVER_SRC = '/guides/credit-dispute-letter-guide/cover.png';

/**
 * Shared, uniform guide book — the real designed cover image with a 3D treatment
 * and an attractive glowing green binding edge ("green tip"). Used on the lead magnet
 * page AND the homepage so the e-guide looks identical in both places.
 */
export function FreeGuideBook({ className = '' }: { className?: string }) {
  return (
    <div className={`fg-book relative aspect-[723/1024] ${className}`}>
      {/* page block (paper thickness) on the right */}
      <div className="fg-book-pages absolute top-0 bottom-0 left-3 right-[-10px] rounded-[3px_12px_12px_3px]" />
      {/* cover */}
      <div className="fg-book-cover absolute inset-0 rounded-[3px_12px_12px_3px] overflow-hidden">
        <img
          src={COVER_SRC}
          alt="Free Credit Dispute Letter Guide — learn how to write a killer credit dispute letter in just 5 steps"
          className="absolute inset-0 w-full h-full object-cover fg-book-cover-img"
          loading="eager"
        />
        {/* inner spine shadow */}
        <div className="absolute inset-y-0 left-0 w-[10%] bg-gradient-to-r from-black/25 via-black/8 to-transparent pointer-events-none" />
        {/* glossy sheen */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />

        {/* Proof strip integrated into cover footer — not floating outside the book */}
        <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
          <div className="fg-book-proof-strip flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 px-2 py-1.5 sm:py-2">
            <span className="inline-flex items-center gap-1 text-[6px] sm:text-[7px] font-bold uppercase tracking-wider text-white/90">
              <FileText className="w-2.5 h-2.5 text-[#39ff14]" /> Step-by-step
            </span>
            <span className="text-white/25 hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1 text-[6px] sm:text-[7px] font-bold uppercase tracking-wider text-white/90">
              <Download className="w-2.5 h-2.5 text-[#39ff14]" /> Instant PDF
            </span>
            <span className="text-white/25 hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1 text-[6px] sm:text-[7px] font-bold uppercase tracking-wider text-white/90">
              <BadgeCheck className="w-2.5 h-2.5 text-amber-300" /> FCRA checklist
            </span>
          </div>
        </div>
      </div>
      {/* glowing green binding tip — aligned to book height only (not oversized) */}
      <div className="fg-book-spine absolute inset-y-0 left-[-5px] w-[10px] rounded-l-[5px] z-20" />
    </div>
  );
}

/**
 * Standalone guide book — the hero star of the lead magnet. Uses the shared FreeGuideBook
 * with cover-integrated seal + proof strip (no floating chips overlapping the cover).
 *
 * Must render inside a `.fg-funnel` ancestor (with `FreeGuideFunnelStyles`) for the green
 * spine, glow, and seal styling. Pass `compact` on the homepage for the same look at ~65% scale.
 */
export function LeadMagnetEbook({ compact = false }: { compact?: boolean }) {
  const shell = compact
    ? 'relative w-full max-w-[240px] sm:max-w-[260px] mx-auto py-4 sm:py-5'
    : 'relative w-full max-w-[400px] mx-auto py-8 sm:py-10';

  return (
    <div className={shell}>
      <div className="fg-hero-aura absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[125%] h-[120%] -z-10 pointer-events-none" />
      <FreeGuideBook className="w-[82%] sm:w-[86%] mx-auto" />
    </div>
  );
}

/**
 * Lead magnet dashboard preview — mirrors the real Partner Portal layout (sidebar, KPI, mission control).
 * Phone overlaps the right edge half on / half off.
 */
export function LeadMagnetDeviceShowcase() {
  const kpis = [
    { label: 'Reports', value: '2', icon: FileText },
    { label: 'Open tasks', value: '4', icon: ListChecks },
    { label: 'Letters', value: '3', icon: Scale },
    { label: 'Cases', value: '1', icon: FolderKanban },
  ];
  const actions = [
    { title: 'Upload latest report', desc: 'Compare newest vs previous file', tone: 'Priority' },
    { title: 'Run AI checklist', desc: 'Restoration steps ranked for you', tone: 'Improvement' },
    { title: 'Generate dispute letter', desc: 'Build, edit, save to vault', tone: 'Improvement' },
  ];
  const navIcons = [LayoutDashboard, FileText, ListChecks, MessageCircle, ShieldCheck];

  return (
    <div className="relative w-full max-w-[640px] mx-auto">
      <div className="fg-hero-aura absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[112%] h-[120%] -z-10 pointer-events-none" />
      <div
        className="absolute left-1/2 bottom-[-7%] -translate-x-1/2 w-[72%] h-[12%] rounded-[50%] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.45) 0%, transparent 70%)', filter: 'blur(22px)' }}
      />

      <div
        className="relative flex rounded-2xl overflow-hidden border border-white/[0.08] min-h-[340px] sm:min-h-[380px]"
        style={{ boxShadow: '0 50px 90px -28px rgba(0,0,0,0.85), 0 0 60px rgba(57,255,20,0.12)' }}
      >
        {/* Portal icon rail */}
        <div className="hidden sm:flex flex-col items-center gap-3 py-4 px-2 bg-fc-chrome/80 border-r border-white/[0.08] w-12 shrink-0">
          {navIcons.map((Icon, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                i === 0 ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300' : 'bg-white/[0.03] border border-white/[0.08] text-white/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </div>
          ))}
        </div>

        {/* Main portal canvas */}
        <div className="flex-1 bg-gradient-to-br from-fc-shell via-fc-section to-fc-deep p-3 sm:p-4 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-3 pr-[22%]">
            <div className="min-w-0">
              <div className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-amber-400/90 font-mono">Partner Portal</div>
              <div className="text-white font-semibold text-sm sm:text-base truncate">Partner Dashboard</div>
              <div className="text-white/45 text-[9px] sm:text-[10px] mt-0.5 truncate">Next steps, uploads, dispute progress</div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Bell className="w-3.5 h-3.5 text-white/35" />
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[9px] font-black text-black">
                T
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2 sm:gap-3 pr-[20%]">
            {/* Overall score KPI — matches portal KpiCard */}
            <div className="col-span-12 sm:col-span-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] p-3">
              <div className="text-[8px] uppercase tracking-widest text-white/40">Overall score</div>
              <div className="mt-1 flex items-end gap-2">
                <span className="text-3xl sm:text-4xl font-light text-white tabular-nums leading-none">78</span>
                <span className="text-emerald-400 text-[10px] font-bold pb-0.5">+12</span>
              </div>
              <div className="mt-2 text-[8px] text-white/45">Profile + execution readiness</div>
            </div>

            {/* Mission control */}
            <div className="col-span-12 sm:col-span-8 fc-light-glass-panel fc-light-chrome-panel rounded-xl p-3">
              <div className="text-[8px] uppercase tracking-widest text-white/40">Mission control</div>
              <div className="mt-1 text-white font-semibold text-[11px] sm:text-xs">Top improvements + quick actions</div>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {actions.map((a) => (
                  <div key={a.title} className="rounded-lg fc-light-glass-panel fc-light-chrome-panel border p-2">
                    <div className="text-[7px] uppercase tracking-wider text-amber-400">{a.tone}</div>
                    <div className="mt-1 text-[9px] text-white font-semibold leading-tight line-clamp-2">{a.title}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Secondary KPI row */}
            {kpis.map((k) => (
              <div key={k.label} className="col-span-6 sm:col-span-3 rounded-lg fc-light-glass-panel fc-light-chrome-panel border p-2.5">
                <k.icon className="w-3 h-3 text-amber-400 mb-1" />
                <div className="text-lg font-semibold text-white leading-none tabular-nums">{k.value}</div>
                <div className="text-[7px] text-white/40 uppercase tracking-wider mt-1">{k.label}</div>
              </div>
            ))}
          </div>

          {/* Activity chips */}
          <div className="mt-3 flex flex-wrap gap-1.5 pr-[24%]">
            {['Report compared', 'Checklist updated', 'Letter saved to vault'].map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[8px] text-emerald-100/90"
              >
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" /> {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Phone — half on / half off dashboard edge */}
      <div className="absolute bottom-[6%] right-[-8%] w-[28%] min-w-[108px] max-w-[150px] z-30">
        <div
          className="relative aspect-[9/19] rounded-[24px] sm:rounded-[30px]"
          style={{
            background: 'linear-gradient(145deg, #2d2d2d 0%, #1a1a1a 50%, #252525 100%)',
            boxShadow: '0 40px 70px -20px rgba(0,0,0,0.9), 0 0 45px rgba(57,255,20,0.2)',
          }}
        >
          <div className="absolute inset-[4px] rounded-[20px] sm:rounded-[26px] bg-black" />
          <div className="absolute inset-[6px] rounded-[16px] sm:rounded-[22px] overflow-hidden bg-gradient-to-br from-fc-section to-fc-deep">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 sm:w-12 h-3.5 rounded-full bg-black z-10" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2 pt-4">
              <div className="scale-[0.55] sm:scale-[0.65] origin-center">
                <FinelyCredLogo size="sm" forceLight />
              </div>
              <div className="w-7 h-px bg-gradient-to-r from-transparent via-[#39ff14] to-transparent my-1.5" />
              <p
                className="text-3xl sm:text-4xl font-light text-white tabular-nums leading-none"
                style={{ textShadow: '0 0 20px rgba(57,255,20,0.5)' }}
              >
                720
              </p>
              <p className="text-[6px] sm:text-[7px] text-emerald-400 uppercase tracking-wider mt-1">Score</p>
              <div className="mt-2 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 inline-flex items-center gap-1">
                <Lock className="w-2 h-2 text-emerald-400" />
                <span className="text-[5px] sm:text-[6px] text-emerald-400 font-bold uppercase">Vault</span>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
