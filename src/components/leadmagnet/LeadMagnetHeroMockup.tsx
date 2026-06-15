import React from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  CreditCard,
  Download,
  FileBadge,
  FileText,
  FolderKanban,
  FolderOpen,
  Gavel,
  LayoutDashboard,
  Library,
  ListChecks,
  Lock,
  MessageSquare,
  Scale,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import { FinelyCredLogo } from '../brand/FinelyCredLogo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_VIEW_TABS,
  finelyOsCatalogCard,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

const COVER_SRC = '/guides/credit-dispute-letter-guide/cover.png';

const PORTAL_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Reports', icon: FileText, active: false },
  { label: 'Analysis', icon: FileBadge, active: false },
  { label: 'Documents', icon: FolderOpen, active: false },
  { label: 'Dispute letters', icon: Gavel, active: false },
  { label: 'Debt & Summons', icon: Scale, active: false },
  { label: 'Projects & Tasks', icon: FolderKanban, active: false },
  { label: 'Messages', icon: MessageSquare, active: false },
] as const;

const HUB_TABS = ['Overview', 'Journey', 'Activity', 'Modules', 'Workflow'] as const;

const RESTORE_STEPS = [
  { label: 'Upload report', done: true, hint: '1 on file' },
  { label: 'Analyze', done: true, hint: '4 negatives' },
  { label: 'Evidence', done: true, hint: '6 files' },
  { label: 'Dispute letters', done: false, hint: 'Draft next' },
] as const;

const MISSION_ACTIONS = [
  { tone: 'Priority', title: 'Upload latest report', desc: 'Compare newest vs previous file' },
  { tone: 'Improvement', title: 'Run AI checklist', desc: 'Restoration steps ranked for you' },
  { tone: 'Improvement', title: 'Open Letter Studio', desc: 'Build, edit, save to vault' },
] as const;

const MODULE_TILES = [
  { title: 'Credit reports', stat: '1 report', icon: FileText, accent: 'emerald' as const },
  { title: 'Documents vault', stat: '6 files', icon: FolderOpen, accent: 'sky' as const },
  { title: 'Dispute center', stat: '2 open cases', icon: Gavel, accent: 'violet' as const },
  { title: 'Tasks', stat: '3 open tasks', icon: ListChecks, accent: 'amber' as const },
];

/**
 * Shared guide book — 3D cover with green spine glow.
 */
export function FreeGuideBook({ className = '' }: { className?: string }) {
  return (
    <div className={`fg-book relative aspect-[723/1024] ${className}`}>
      <div className="fg-book-pages absolute top-0 bottom-0 left-3 right-[-10px] rounded-[3px_12px_12px_3px]" />
      <div className="fg-book-cover absolute inset-0 rounded-[3px_12px_12px_3px] overflow-hidden">
        <img
          src={COVER_SRC}
          alt="Free Credit Dispute Letter Guide"
          className="absolute inset-0 w-full h-full object-cover fg-book-cover-img"
          loading="eager"
        />
        <div className="absolute inset-y-0 left-0 w-[10%] bg-gradient-to-r from-black/25 via-black/8 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
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
      <div className="fg-book-spine absolute inset-y-0 left-[-5px] w-[10px] rounded-l-[5px] z-20" />
    </div>
  );
}

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
 * High-fidelity Partner Portal dashboard preview — mirrors /portal/dashboard layout.
 */
export function LeadMagnetDeviceShowcase() {
  return (
    <div className="relative w-full max-w-[720px] mx-auto">
      <div className="fg-hero-aura absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[115%] h-[125%] -z-10 pointer-events-none" />
      <div
        className="absolute left-1/2 bottom-[-6%] -translate-x-1/2 w-[78%] h-[14%] rounded-[50%] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, transparent 72%)', filter: 'blur(24px)' }}
      />

      <div
        className="relative rounded-[1.25rem] sm:rounded-[1.5rem] overflow-hidden border border-white/[0.1] bg-fc-shell shadow-[0_55px_100px_-30px_rgba(0,0,0,0.9),0_0_80px_rgba(57,255,20,0.14)]"
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[#0a0f14] border-b border-white/[0.08]">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500/80" />
            <span className="w-2 h-2 rounded-full bg-amber-400/80" />
            <span className="w-2 h-2 rounded-full bg-emerald-400/80" />
          </div>
          <div className="flex-1 mx-2 px-3 py-1 rounded-md bg-black/40 border border-white/[0.06] text-[8px] sm:text-[9px] text-white/45 truncate text-center">
            finelycred.com/portal/dashboard
          </div>
          <Bell className="w-3 h-3 text-white/35 shrink-0" />
        </div>

        <div className="p-2 sm:p-3 bg-gradient-to-br from-fc-shell via-fc-section to-fc-deep max-h-[520px] sm:max-h-none overflow-hidden">
          {/* Portal nav strip — matches PartnerPortalNav */}
          <div className="mb-2 -mx-1 overflow-x-auto">
            <div className={`${FINELY_OS_VIEW_TABS} min-w-max !gap-1 !p-1 scale-[0.72] sm:scale-[0.82] origin-top-left`}>
              {PORTAL_NAV.map(({ label, icon: Icon, active }) => (
                <span
                  key={label}
                  className={`${finelyOsViewTab(active, 'emerald')} !px-2 !py-1 !text-[9px] pointer-events-none whitespace-nowrap`}
                >
                  <Icon size={10} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Page header */}
          <div className="flex items-start justify-between gap-2 mb-2 pr-[18%]">
            <div className="min-w-0">
              <div className="text-[7px] sm:text-[8px] uppercase tracking-[0.22em] text-emerald-400/90 font-mono">Partner Portal</div>
              <div className={`text-sm sm:text-base font-bold truncate ${FINELY_OS_ENTITY_VALUE}`}>Partner Dashboard</div>
              <div className={`text-[8px] sm:text-[9px] mt-0.5 truncate ${FINELY_OS_ENTITY_BODY}`}>
                Next steps, uploads, and dispute progress
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[8px] font-black text-black shrink-0">
              FC
            </div>
          </div>

          {/* Noticed strip */}
          <div className="mb-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2 py-1.5 flex items-center gap-2">
            <ShieldAlert className="w-3 h-3 text-amber-300 shrink-0" />
            <span className="text-[8px] sm:text-[9px] text-amber-100/90 leading-snug">
              Your file is ready — draft dispute letters in Letter Studio.
            </span>
          </div>

          {/* Credit restore pipeline HUD */}
          <div className={`mb-2 ${finelyOsCatalogCard('emerald')} !p-2 sm:!p-2.5`} data-fc-accent="emerald">
            <div className={`text-[7px] uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>Credit restore pipeline</div>
            <div className="mt-1.5 grid grid-cols-4 gap-1">
              {RESTORE_STEPS.map((s) => (
                <div
                  key={s.label}
                  className={`rounded-md border px-1 py-1 text-center ${
                    s.done ? 'border-emerald-500/35 bg-emerald-500/10' : 'border-white/[0.08] bg-white/[0.03]'
                  }`}
                >
                  <div className={`text-[6px] sm:text-[7px] font-bold ${s.done ? 'text-emerald-300' : 'text-white/50'}`}>{s.label}</div>
                  <div className="text-[6px] text-white/45 mt-0.5">{s.hint}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Unified hub shell */}
          <div className={`${finelyOsCatalogCard('violet')} !p-2.5 sm:!p-3 mb-2`} data-fc-accent="violet">
            <div className={`text-[7px] uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>Partner portal</div>
            <div className={`text-[10px] sm:text-xs font-bold mt-0.5 ${FINELY_OS_ENTITY_VALUE}`}>Your file — scroll or jump</div>
            <div className="mt-2 grid grid-cols-4 gap-1">
              {[
                { label: 'Overall score', value: '682', hint: 'Readiness', accent: 'amber' },
                { label: 'Open tasks', value: '3', hint: 'In motion', accent: 'amber' },
                { label: 'Open cases', value: '2', hint: 'Disputes', accent: 'violet' },
                { label: 'Vault files', value: '6', hint: 'Evidence', accent: 'sky' },
              ].map((k) => (
                <div key={k.label} className="fc-hub-kpi fc-light-pop-card rounded-lg px-1.5 py-1.5" data-fc-accent={k.accent}>
                  <div className={`text-[6px] ${FINELY_OS_ENTITY_SUBLABEL}`}>{k.label}</div>
                  <div className={`text-sm font-semibold tabular-nums leading-none mt-0.5 ${FINELY_OS_ENTITY_VALUE}`}>{k.value}</div>
                  <div className={`text-[6px] mt-0.5 ${FINELY_OS_ENTITY_BODY}`}>{k.hint}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hub tabs */}
          <div className={`${FINELY_OS_VIEW_TABS} !gap-0.5 !p-0.5 mb-2 scale-[0.78] sm:scale-[0.88] origin-top-left`}>
            {HUB_TABS.map((t, i) => (
              <span key={t} className={`${finelyOsViewTab(i === 0, 'violet')} !px-2 !py-1 !text-[8px] pointer-events-none`}>
                {t}
              </span>
            ))}
          </div>

          {/* Mission control + score */}
          <div className="grid grid-cols-12 gap-1.5 sm:gap-2 pr-[16%]">
            <div className="col-span-4 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.1] p-2">
              <div className="text-[6px] uppercase tracking-widest text-white/40">Overall score</div>
              <div className="mt-1 flex items-end gap-1">
                <span className="text-2xl sm:text-3xl font-light text-white tabular-nums leading-none">682</span>
                <span className="text-emerald-400 text-[8px] font-bold pb-0.5">+24</span>
              </div>
              <div className="mt-1.5 h-1 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-emerald-500 to-[#39ff14]" />
              </div>
              <div className="text-[6px] text-white/45 mt-1">Profile + execution readiness</div>
            </div>

            <div className={`col-span-8 ${finelyOsCatalogCard('violet')} !p-2`} data-fc-accent="violet">
              <div className="flex items-start justify-between gap-1">
                <div>
                  <div className={`text-[6px] uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>Mission control</div>
                  <div className={`text-[9px] font-semibold mt-0.5 ${FINELY_OS_ENTITY_VALUE}`}>Top improvements + quick actions</div>
                </div>
                <ArrowRight className="w-3 h-3 text-violet-300 shrink-0 mt-0.5" />
              </div>
              <div className="mt-1.5 grid grid-cols-3 gap-1">
                {MISSION_ACTIONS.map((a) => (
                  <div key={a.title} className="rounded-md fc-light-glass-panel border border-white/[0.08] p-1.5">
                    <div className="text-[6px] uppercase tracking-wider text-violet-300">{a.tone}</div>
                    <div className="text-[7px] sm:text-[8px] text-white font-semibold leading-tight mt-0.5 line-clamp-2">{a.title}</div>
                  </div>
                ))}
              </div>
            </div>

            {MODULE_TILES.map((m) => (
              <div key={m.title} className={`col-span-6 sm:col-span-3 ${finelyOsCatalogCard(m.accent)} !p-2`} data-fc-accent={m.accent}>
                <m.icon className="w-3 h-3 text-amber-400 mb-0.5" />
                <div className={`text-[8px] font-semibold leading-tight ${FINELY_OS_ENTITY_VALUE}`}>{m.title}</div>
                <div className={`text-[6px] mt-0.5 ${FINELY_OS_ENTITY_BODY}`}>{m.stat}</div>
              </div>
            ))}
          </div>

          {/* Activity row */}
          <div className="mt-2 flex flex-wrap gap-1 pr-[18%]">
            {['Report uploaded', 'Checklist updated', 'Letter saved to vault'].map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[7px] text-emerald-100/90"
              >
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" /> {t}
              </span>
            ))}
          </div>

          {/* Secondary nav hint */}
          <div className="mt-2 flex flex-wrap gap-1 opacity-70">
            {[BookOpen, Calendar, CreditCard, Library, TrendingUp].map((Icon, i) => (
              <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-white/[0.06] text-[6px] text-white/40">
                <Icon className="w-2.5 h-2.5" />
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Phone — score + vault */}
      <div className="absolute bottom-[4%] right-[-6%] w-[26%] min-w-[100px] max-w-[140px] z-30">
        <div
          className="relative aspect-[9/19] rounded-[22px] sm:rounded-[28px]"
          style={{
            background: 'linear-gradient(145deg, #2d2d2d 0%, #1a1a1a 50%, #252525 100%)',
            boxShadow: '0 40px 70px -20px rgba(0,0,0,0.9), 0 0 50px rgba(57,255,20,0.22)',
          }}
        >
          <div className="absolute inset-[4px] rounded-[18px] sm:rounded-[24px] bg-black" />
          <div className="absolute inset-[6px] rounded-[14px] sm:rounded-[20px] overflow-hidden bg-gradient-to-br from-fc-section to-fc-deep">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-9 sm:w-11 h-3 rounded-full bg-black z-10" />
            <div className="absolute inset-0 flex flex-col pt-5 px-1.5">
              <div className="flex items-center justify-between px-1 mb-1">
                <BarChart3 className="w-2.5 h-2.5 text-emerald-400" />
                <span className="text-[5px] text-white/40 uppercase tracking-wider">Portal</span>
              </div>
              <div className="scale-[0.5] sm:scale-[0.55] origin-top">
                <FinelyCredLogo size="sm" forceLight />
              </div>
              <div className="w-6 h-px bg-gradient-to-r from-transparent via-[#39ff14] to-transparent mx-auto my-1" />
              <p className="text-2xl sm:text-3xl font-light text-white tabular-nums leading-none text-center" style={{ textShadow: '0 0 18px rgba(57,255,20,0.45)' }}>
                682
              </p>
              <p className="text-[5px] sm:text-[6px] text-emerald-400 uppercase tracking-wider text-center mt-0.5">Overall score</p>
              <div className="mt-2 mx-1 space-y-1">
                {['Reports', 'Letters', 'Tasks'].map((row, i) => (
                  <div key={row} className="flex items-center justify-between rounded bg-white/[0.04] px-1 py-0.5 border border-white/[0.06]">
                    <span className="text-[5px] text-white/50">{row}</span>
                    <span className="text-[6px] text-white font-semibold tabular-nums">{['1', '2', '3'][i]}</span>
                  </div>
                ))}
              </div>
              <div className="mt-auto mb-2 flex justify-center">
                <div className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 inline-flex items-center gap-0.5">
                  <Lock className="w-2 h-2 text-emerald-400" />
                  <span className="text-[5px] text-emerald-400 font-bold uppercase">Vault</span>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
