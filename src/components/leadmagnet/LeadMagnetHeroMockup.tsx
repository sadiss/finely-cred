import React from 'react';
import {
  Bell,
  ChevronDown,
  FileText,
  FolderOpen,
  Gavel,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { DISPUTE_LETTER_GUIDE_COVER } from '../../resources/disputeLetterGuideContent';
import { PORTAL_NAV_LANES, PORTAL_PRIMARY_LINKS } from '../../config/portalNavLanes';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_VIEW_TABS,
  finelyOsCatalogCard,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

/** Demo partner file — mirrors a realistic mid-journey dashboard. */
const DEMO = {
  overallScore: 682,
  scoreDelta: 24,
  readinessPct: 68,
  reports: 1,
  negatives: 4,
  evidence: 6,
  letters: 2,
  openCases: 2,
  openTasks: 3,
  vaultFiles: 6,
} as const;

const RESTORE_STEPS = [
  { label: '1. Upload report', done: true, hint: '1 on file' },
  { label: '2. Analyze', done: true, hint: '4 negatives' },
  { label: '3. Evidence', done: true, hint: '6 files' },
  { label: '4. Dispute letters', done: false, hint: 'Draft next' },
] as const;

const HUB_KPIS = [
  { label: 'Overall score', value: String(DEMO.overallScore), hint: 'Readiness index', accent: 'amber' as const },
  { label: 'Open tasks', value: String(DEMO.openTasks), hint: 'In motion', accent: 'amber' as const },
  { label: 'Open cases', value: String(DEMO.openCases), hint: 'Active disputes', accent: 'violet' as const },
  { label: 'Vault files', value: String(DEMO.vaultFiles), hint: 'Evidence uploaded', accent: 'sky' as const },
];

const MISSION_ACTIONS = [
  { tone: 'Priority', title: 'Open Letter Studio' },
  { tone: 'Improvement', title: 'Run AI checklist' },
  { tone: 'Improvement', title: 'Upload latest report' },
] as const;

const MODULE_TILES = [
  { title: 'Credit reports', stat: `${DEMO.reports} report`, icon: FileText, accent: 'emerald' as const },
  { title: 'Documents vault', stat: `${DEMO.vaultFiles} files`, icon: FolderOpen, accent: 'sky' as const },
  { title: 'Dispute center', stat: `${DEMO.openCases} open cases`, icon: Gavel, accent: 'violet' as const },
  { title: 'Tasks', stat: `${DEMO.openTasks} open tasks`, icon: ListChecks, accent: 'amber' as const },
];

const NAV_PREVIEW = PORTAL_PRIMARY_LINKS.slice(0, 5);

const HUB_TABS = ['Overview', 'Journey', 'Activity', 'Modules', 'Workflow'] as const;

export function FreeGuideBook({ className = '' }: { className?: string }) {
  return (
    <div className={`fg-book relative aspect-[723/1024] ${className}`}>
      <div className="fg-book-spine absolute inset-y-[2%] left-0 w-[7px] -translate-x-[4px] rounded-l-[4px] z-[5]" />
      <div className="fg-book-pages absolute top-0 bottom-0 left-3 right-[-10px] rounded-[3px_12px_12px_3px] z-[8]" />
      <div className="fg-book-cover absolute inset-y-0 left-[6px] right-0 rounded-[3px_12px_12px_3px] overflow-hidden z-[10]">
        <img
          src={DISPUTE_LETTER_GUIDE_COVER}
          alt="Free Credit Dispute Letter Guide"
          className="absolute inset-0 w-full h-full fg-book-cover-img"
          loading="eager"
        />
        <div className="absolute inset-y-0 left-0 w-[4%] bg-gradient-to-r from-black/8 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

export function LeadMagnetEbook({ compact = false }: { compact?: boolean }) {
  const shell = compact
    ? 'fg-book-shell relative w-full max-w-[240px] sm:max-w-[260px] mx-auto overflow-visible py-4 sm:py-5'
    : 'fg-book-shell relative mx-auto w-full max-w-[min(100%,240px)] overflow-visible py-5 sm:max-w-[min(100%,260px)] md:max-w-[min(100%,200px)] md:py-3 lg:max-w-[min(100%,280px)] lg:py-6 xl:max-w-[min(100%,340px)] xl:py-8 2xl:max-w-[400px] 2xl:py-10';

  return (
    <div className={shell}>
      <div className="fg-hero-aura absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[125%] h-[120%] -z-10 pointer-events-none" />
      <FreeGuideBook className="mx-auto w-[84%] sm:w-[86%] md:w-[88%] lg:w-[86%]" />
    </div>
  );
}

function MockPortalNavStrip() {
  return (
    <div className="fg-mock-nav-row mb-2">
      {NAV_PREVIEW.map(({ label, icon: Icon, path }) => (
        <span key={path} className={`fg-mock-nav-pill ${path === '/portal/dashboard' ? 'is-active' : ''}`}>
          <Icon size={10} strokeWidth={2.25} />
          {label}
        </span>
      ))}
      <span className="fg-mock-nav-pill">
        More <ChevronDown size={10} />
      </span>
    </div>
  );
}

function MockRestoreHud() {
  return (
    <div className={`${finelyOsCatalogCard('violet')} !p-2.5 space-y-2`} data-fc-accent="violet">
      <div className="flex items-center justify-between gap-2">
        <p className={`text-[10px] font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Credit restore pipeline</p>
        <span className="text-[9px] font-bold text-fuchsia-300/90">{DEMO.readinessPct}% ready</span>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {RESTORE_STEPS.map((s) => (
          <div
            key={s.label}
            className={`rounded-md border px-1 py-1 text-center ${
              s.done ? 'border-emerald-500/35 bg-emerald-500/10' : 'border-amber-500/30 bg-amber-500/10'
            }`}
          >
            <div className={`text-[8px] font-bold leading-tight ${s.done ? 'text-emerald-300' : 'text-amber-300'}`}>
              {s.label.replace(/^\d+\.\s/, '')}
            </div>
            <div className={`text-[7px] mt-0.5 ${FINELY_OS_ENTITY_BODY}`}>{s.hint}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockUnifiedHubShell() {
  return (
    <div
      className={`fc-unified-hub-shell fc-light-black-scope fc-light-hero-panel fc-pop-surface fc-light-readable ${finelyOsCatalogCard('violet')} !p-2.5 space-y-2`}
      data-fc-accent="violet"
    >
      <p className={`text-[10px] font-bold ${FINELY_OS_ENTITY_VALUE}`}>Your file — scroll or jump</p>
      <div className="grid grid-cols-4 gap-1">
        {HUB_KPIS.map((k) => (
          <div key={k.label} className="fc-hub-kpi fc-light-pop-card fc-pop-surface rounded-md px-1.5 py-1" data-fc-accent={k.accent}>
            <div className={`text-[7px] ${FINELY_OS_ENTITY_SUBLABEL}`}>{k.label}</div>
            <div className={`text-xs font-semibold tabular-nums ${FINELY_OS_ENTITY_VALUE}`}>{k.value}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-0.5">
        {HUB_TABS.map((t, i) => (
          <span key={t} className={`${finelyOsViewTab(i === 0, 'violet')} !px-1.5 !py-0.5 !text-[8px] pointer-events-none`}>
            {t}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-12 gap-1">
        <div className="col-span-4 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.08] p-1.5">
          <div className={`text-[7px] ${FINELY_OS_ENTITY_SUBLABEL}`}>Overall score</div>
          <div className="mt-0.5 flex items-end gap-0.5">
            <span className="text-lg font-extralight text-emerald-300 tabular-nums leading-none">{DEMO.overallScore}</span>
            <span className="text-[8px] font-bold text-emerald-400">+{DEMO.scoreDelta}</span>
          </div>
        </div>
        <div className={`col-span-8 ${finelyOsCatalogCard('violet')} !p-1.5`} data-fc-accent="violet">
          <div className={`text-[7px] ${FINELY_OS_ENTITY_SUBLABEL}`}>Mission control</div>
          <div className="mt-1 grid grid-cols-3 gap-0.5">
            {MISSION_ACTIONS.map((a) => (
              <div key={a.title} className="rounded border border-white/[0.08] bg-white/[0.03] p-1">
                <div className="text-[6px] uppercase text-violet-300">{a.tone}</div>
                <div className={`text-[7px] font-semibold leading-tight mt-0.5 ${FINELY_OS_ENTITY_VALUE}`}>{a.title}</div>
              </div>
            ))}
          </div>
        </div>
        {MODULE_TILES.map((m) => (
          <div key={m.title} className={`col-span-3 ${finelyOsCatalogCard(m.accent)} !p-1.5`} data-fc-accent={m.accent}>
            <m.icon className="w-2.5 h-2.5 text-emerald-400 mb-0.5" />
            <div className={`text-[8px] font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{m.title}</div>
            <div className={`text-[7px] ${FINELY_OS_ENTITY_BODY}`}>{m.stat}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PortalDashboardBrowserMock() {
  return (
    <div className="fg-device-browser">
      <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#070b10] border-b border-white/[0.06]">
        <div className="flex gap-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500/80" />
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
        </div>
        <div className="flex flex-1 items-center min-w-0 px-2 py-0.5 rounded-md bg-black/35 border border-white/[0.05]">
          <span className="text-[8px] text-white/45 truncate">finelycred.com/portal/dashboard</span>
        </div>
        <Bell className="w-3 h-3 text-white/30 shrink-0" />
      </div>

      <div className="fg-device-browser-body fc-senior-simple space-y-2">
        <MockPortalNavStrip />

        <div>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} !text-[7px] uppercase tracking-widest text-emerald-400/85`}>Partner Portal</div>
          <div className={`text-sm font-bold ${FINELY_OS_ENTITY_VALUE}`}>Partner Dashboard</div>
        </div>

        <div className="rounded-md border border-amber-500/22 bg-amber-500/10 px-2 py-1 flex items-center gap-1.5">
          <ShieldAlert className="w-3 h-3 text-amber-300 shrink-0" />
          <span className="text-[9px] text-amber-100/90 leading-snug">Draft dispute letters in Letter Studio.</span>
        </div>

        <MockRestoreHud />
        <MockUnifiedHubShell />
        <div className="fg-device-browser-fade" aria-hidden />
        <div className="fg-device-phone-float">
          <PortalPhoneMock />
        </div>
      </div>
    </div>
  );
}

function PortalPhoneMock() {
  return (
    <div className="fg-device-phone-bezel relative">
      <div className="fg-phone-notch" aria-hidden />
      <div className="fg-device-phone-screen relative">
        <div className="fg-phone-ui">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="fg-phone-title">Dashboard</span>
            <Bell className="w-[1.15em] h-[1.15em] text-white/35 shrink-0" strokeWidth={2.25} />
          </div>

          <div className="grid grid-cols-2 gap-[0.35em] mb-[0.65em]">
            {PORTAL_NAV_LANES.slice(0, 2).map((lane) => (
              <div
                key={lane.id}
                className={`rounded-[0.45em] border px-[0.45em] py-[0.35em] ${lane.id === 'work' ? 'border-emerald-500/35 bg-emerald-500/12' : 'border-white/10 bg-white/[0.03]'}`}
              >
                <div className={`fg-phone-label font-black ${lane.id === 'work' ? 'text-emerald-300' : 'text-white/45'}`}>
                  {lane.label}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[0.45em] border border-emerald-500/28 bg-emerald-500/10 px-[0.45em] py-[0.55em] text-center mb-[0.65em]">
            <div className="fg-phone-label">Overall score</div>
            <div className="fg-phone-score">{DEMO.overallScore}</div>
            <div className="text-emerald-400 font-bold" style={{ fontSize: '0.95em' }}>+{DEMO.scoreDelta}</div>
          </div>

          <div className="grid grid-cols-3 gap-[0.35em] mb-[0.65em]">
            {[
              { l: 'Tasks', v: DEMO.openTasks },
              { l: 'Cases', v: DEMO.openCases },
              { l: 'Vault', v: DEMO.vaultFiles },
            ].map(({ l, v }) => (
              <div key={l} className="rounded-[0.35em] border border-white/10 bg-white/[0.03] py-[0.35em] text-center">
                <div className="fg-phone-label">{l}</div>
                <div className="fg-phone-stat">{v}</div>
              </div>
            ))}
          </div>

          <div className="rounded-[0.45em] border border-amber-500/28 bg-amber-500/10 px-[0.45em] py-[0.45em] mt-auto">
            <div className="fg-phone-label font-black text-amber-300">Next up</div>
            <div className="fg-phone-title mt-[0.2em]">Dispute letters</div>
          </div>

          <div className="grid grid-cols-4 gap-[0.25em] pt-[0.55em] mt-[0.45em] border-t border-white/[0.06]">
            {[LayoutDashboard, FileText, Gavel, MessageSquare].map((Icon, i) => (
              <div key={i} className={`flex justify-center py-[0.35em] rounded-[0.35em] ${i === 0 ? 'text-emerald-300 bg-emerald-500/12' : 'text-white/30'}`}>
                <Icon className="w-[1.15em] h-[1.15em]" strokeWidth={2.25} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LeadMagnetDeviceShowcase({ className = '' }: { className?: string }) {
  return (
    <div className={`fg-device-showcase ${className}`}>
      <div className="fg-device-composition">
        <div className="fg-device-ambient" aria-hidden />
        <PortalDashboardBrowserMock />
      </div>
    </div>
  );
}
