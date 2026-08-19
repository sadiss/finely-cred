import React from 'react';
import { Check, Circle, Power } from 'lucide-react';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  type FinelyOsDeckAccent,
} from '../os/finelyOsLightUi';
import { MarketingHelpButton } from './MarketingHelpModal';

/** Frosted content bed for marketing hub tab bodies */
export const MARKETING_HUB_CONTENT_SHELL =
  'rounded-2xl border border-white/22 bg-white/[0.08] backdrop-blur-md p-4 sm:p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]';

export const MARKETING_HUB_TAB_STRIP =
  'rounded-2xl border border-white/25 bg-white/[0.1] backdrop-blur-md p-2 sm:p-2.5';

const VIVID_ACCENT: Record<
  FinelyOsDeckAccent,
  { shell: string; glow: string }
> = {
  emerald: {
    shell: 'border-emerald-300/70 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600',
    glow: 'fc-mkt-glow-on',
  },
  sky: {
    shell: 'border-sky-300/70 bg-gradient-to-br from-sky-600 via-sky-500 to-cyan-600',
    glow: 'fc-mkt-glow-on',
  },
  violet: {
    shell: 'border-violet-300/70 bg-gradient-to-br from-violet-600 via-violet-500 to-fuchsia-600',
    glow: 'fc-mkt-glow-on',
  },
  fuchsia: {
    shell: 'border-fuchsia-300/70 bg-gradient-to-br from-fuchsia-600 via-fuchsia-500 to-violet-600',
    glow: 'fc-mkt-glow-on',
  },
  amber: {
    shell: 'border-amber-300/70 bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-600 text-black',
    glow: 'fc-mkt-glow-warn',
  },
  rose: {
    shell: 'border-rose-300/70 bg-gradient-to-br from-rose-700 via-rose-600 to-red-600',
    glow: 'fc-mkt-glow-off',
  },
};

export function marketingVividShell(accent: FinelyOsDeckAccent, animate = true) {
  const v = VIVID_ACCENT[accent];
  return `rounded-xl border-2 ${v.shell} text-white shadow-lg ${animate ? `${v.glow} fc-mkt-hover-lift` : 'fc-mkt-hover-lift'}`;
}

export function MarketingSectionHeader({
  eyebrow,
  title,
  subtitle,
  helpId,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  helpId?: string;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        <p className={FINELY_OS_ENTITY_SUBLABEL}>{eyebrow}</p>
        {helpId ? <MarketingHelpButton helpId={helpId} /> : null}
      </div>
      <h2 className={FINELY_OS_ENTITY_TITLE}>{title}</h2>
      {subtitle ? <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{subtitle}</p> : null}
    </div>
  );
}

/** Full-color ON (green) / OFF (red) status banner */
export function MarketingOnOffTile({
  on,
  title,
  subtitle,
  helpId,
  onClick,
}: {
  on: boolean;
  title: string;
  subtitle?: string;
  helpId: string;
  onClick?: () => void;
}) {
  const shell = on
    ? 'border-2 border-emerald-200/90 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 fc-mkt-glow-on'
    : 'border-2 border-rose-300/90 bg-gradient-to-br from-rose-600 via-rose-700 to-red-800 fc-mkt-glow-off';

  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Power size={20} className={on ? 'text-emerald-100' : 'text-rose-100'} />
          <span className="text-lg font-black uppercase tracking-wide">{on ? 'ON' : 'OFF'}</span>
        </div>
        <MarketingHelpButton helpId={helpId} />
      </div>
      <p className="mt-2 text-sm font-bold text-white">{title}</p>
      {subtitle ? <p className="mt-1 text-xs text-white/85 leading-snug">{subtitle}</p> : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${shell} rounded-xl p-4 text-left w-full fc-mkt-hover-lift transition-transform`}
      >
        {inner}
      </button>
    );
  }

  return <div className={`${shell} rounded-xl p-4 fc-mkt-hover-lift`}>{inner}</div>;
}

export function MarketingStatusTile({
  ok,
  label,
  hint,
  accent = 'sky',
  helpId,
}: {
  ok: boolean;
  label: string;
  hint?: string;
  accent?: FinelyOsDeckAccent;
  helpId?: string;
}) {
  const vivid = ok ? marketingVividShell(accent) : marketingVividShell('rose');
  return (
    <div className={`${vivid} !p-3 min-h-[5rem] flex flex-col justify-between`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-bold text-white leading-snug pr-1">{label}</span>
        <div className="flex items-center gap-1 shrink-0">
          {helpId ? <MarketingHelpButton helpId={helpId} /> : null}
          <span className="rounded-lg bg-black/25 px-2 py-0.5 text-[10px] font-black uppercase">
            {ok ? 'Ready' : 'Setup'}
          </span>
        </div>
      </div>
      {hint ? <p className="mt-2 text-[11px] leading-snug text-white/90">{hint}</p> : null}
    </div>
  );
}

export function MarketingChecklistTile({ done, label }: { done: boolean; label: string }) {
  return (
    <div
      className={`rounded-xl border-2 px-3 py-2.5 flex items-start gap-2 fc-mkt-hover-lift ${
        done
          ? 'border-emerald-300/80 bg-gradient-to-br from-emerald-600 to-teal-700 text-white fc-mkt-glow-on'
          : 'border-amber-300/80 bg-gradient-to-br from-amber-500 to-orange-600 text-black fc-mkt-glow-warn'
      }`}
    >
      {done ? (
        <Check size={14} className="shrink-0 mt-0.5" />
      ) : (
        <Circle size={14} className="shrink-0 mt-0.5" />
      )}
      <span className="text-xs font-semibold leading-snug">{label}</span>
    </div>
  );
}

export function MarketingKpiChip({
  label,
  value,
  accent = 'sky',
  helpId,
  purpose,
}: {
  label: string;
  value: string;
  accent?: FinelyOsDeckAccent;
  helpId?: string;
  purpose?: string;
}) {
  return (
    <div className={`${marketingVividShell(accent)} !p-3 text-center min-w-[7.5rem] relative`}>
      <div className="absolute top-2 right-2">{helpId ? <MarketingHelpButton helpId={helpId} /> : null}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-white/80">{label}</div>
      <div className="mt-1 text-lg font-black">{value}</div>
      {purpose ? <p className="mt-1 text-[10px] text-white/75 leading-snug">{purpose}</p> : null}
    </div>
  );
}

/** Saturated interactive lane / job tile — whole card is the click target; no misleading arrow footers. */
export function MarketingVividActionTile({
  accent,
  eyebrow,
  title,
  detail,
  helpId,
  onClick,
}: {
  accent: FinelyOsDeckAccent;
  eyebrow?: string;
  title: string;
  detail?: string;
  helpId?: string;
  onClick?: () => void;
}) {
  const className = `${marketingVividShell(accent)} !p-4 text-left min-h-[8.5rem] flex flex-col w-full cursor-pointer`;
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        {eyebrow ? (
          <span className="text-[11px] font-black uppercase tracking-widest text-white/80">{eyebrow}</span>
        ) : (
          <span />
        )}
        {helpId ? <MarketingHelpButton helpId={helpId} /> : null}
      </div>
      <div className="mt-2 text-xl font-black leading-tight tracking-tight">{title}</div>
      {detail ? <p className={`mt-2 text-sm flex-1 text-white/92 leading-snug`}>{detail}</p> : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {inner}
      </button>
    );
  }
  return <div className={className}>{inner}</div>;
}

type MiniTab = { id: string; label: string; accent: FinelyOsDeckAccent };

const MINI_TAB_ACTIVE: Record<FinelyOsDeckAccent, string> = {
  emerald: 'border-emerald-200 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 fc-mkt-tab-active fc-mkt-glow-on',
  sky: 'border-sky-200 bg-gradient-to-r from-sky-500 via-sky-600 to-cyan-600 fc-mkt-tab-active fc-mkt-glow-on',
  violet: 'border-violet-200 bg-gradient-to-r from-violet-500 via-violet-600 to-fuchsia-600 fc-mkt-tab-active fc-mkt-glow-on',
  fuchsia: 'border-fuchsia-200 bg-gradient-to-r from-fuchsia-500 via-fuchsia-600 to-violet-600 fc-mkt-tab-active fc-mkt-glow-on',
  amber: 'border-amber-200 bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 text-black fc-mkt-tab-active fc-mkt-glow-warn',
  rose: 'border-rose-200 bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 fc-mkt-tab-active fc-mkt-glow-off',
};

export function MarketingMiniTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: MiniTab[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className={`${MARKETING_HUB_TAB_STRIP} flex flex-wrap gap-2`} role="tablist">
      {tabs.map((t) => {
        const on = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={`rounded-xl px-4 py-2.5 text-xs font-bold border-2 transition-all fc-mkt-hover-lift ${
              on ? `${MINI_TAB_ACTIVE[t.accent]} text-white` : 'border-white/15 text-white/55 hover:bg-white/10 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
