import React from 'react';
import { ChevronDown, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';

function readStoredBool(key: string): boolean | null {
  try {
    const v = localStorage.getItem(key);
    if (v == null) return null;
    if (v === '1' || v === 'true') return true;
    if (v === '0' || v === 'false') return false;
    return null;
  } catch {
    return null;
  }
}

function writeStoredBool(key: string, v: boolean) {
  try {
    localStorage.setItem(key, v ? '1' : '0');
  } catch {
    // ignore
  }
}

export function CollapsibleSection({
  title,
  subtitle,
  count,
  defaultOpen = true,
  storageKey,
  actions,
  children,
  enableClamp,
  clampClassName = 'max-h-[70vh]',
  defaultExpanded = false,
  showMoreCount,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  variant = 'dark',
}: React.PropsWithChildren<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  count?: React.ReactNode;
  defaultOpen?: boolean;
  storageKey?: string;
  actions?: React.ReactNode;
  enableClamp?: boolean;
  clampClassName?: string;
  defaultExpanded?: boolean;
  /** Optional hint for clamp button: “Show more (N)”. */
  showMoreCount?: number;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  variant?: 'dark' | 'light';
}>) {
  const initialOpen = React.useMemo(() => {
    if (!storageKey) return defaultOpen;
    const v = readStoredBool(`${storageKey}.open`);
    return v ?? defaultOpen;
  }, [storageKey, defaultOpen]);

  const initialExpanded = React.useMemo(() => {
    if (!storageKey) return defaultExpanded;
    const v = readStoredBool(`${storageKey}.expanded`);
    return v ?? defaultExpanded;
  }, [storageKey, defaultExpanded]);

  const [open, setOpen] = React.useState<boolean>(initialOpen);
  const [expanded, setExpanded] = React.useState<boolean>(initialExpanded);

  const toggleOpen = () => {
    setOpen((v) => {
      const next = !v;
      if (storageKey) writeStoredBool(`${storageKey}.open`, next);
      return next;
    });
  };

  const toggleExpanded = () => {
    setExpanded((v) => {
      const next = !v;
      if (storageKey) writeStoredBool(`${storageKey}.expanded`, next);
      return next;
    });
  };

  const clampOn = Boolean(enableClamp && open && !expanded);

  const shell =
    variant === 'light'
      ? 'rounded-3xl border border-violet-200/60 bg-gradient-to-br from-violet-50/35 via-white to-sky-50/40 backdrop-blur-xl overflow-hidden ring-1 ring-inset ring-white/80 shadow-[0_1px_0_rgba(255,255,255,0.92)_inset,0_4px_18px_rgba(99,102,241,0.06)]'
      : 'fc-light-glass-panel fc-light-chrome-panel rounded-3xl overflow-hidden';

  const headerBorder = variant === 'light' ? 'border-violet-100/80' : 'border-white/[0.08]';
  const toggleHover = variant === 'light' ? 'hover:bg-violet-50/40' : 'hover:bg-white/[0.03]';
  const chevronTone = variant === 'light' ? 'text-slate-500' : 'text-white/55';
  const titleTone = variant === 'light' ? 'text-slate-900' : 'text-white';
  const subtitleTone = variant === 'light' ? 'text-slate-600' : 'text-white/60';
  const countChip =
    variant === 'light'
      ? 'px-3 py-1 rounded-full border border-violet-100/80 bg-white/70 text-xs font-semibold text-slate-600'
      : 'px-3 py-1 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 text-xs font-semibold text-fuchsia-200';

  return (
    <section className={`${shell} ${className}`}>
      <div className={`p-6 md:p-7 border-b ${headerBorder} flex items-start justify-between gap-4 ${headerClassName}`}>
        <button
          type="button"
          onClick={toggleOpen}
          className={`fc-focus-ring flex-1 text-left rounded-2xl px-2 py-1 -mx-2 -my-1 ${toggleHover} transition-colors`}
          title={open ? 'Collapse' : 'Expand'}
        >
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 ${chevronTone}`}>
              {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <div className={`${titleTone} font-semibold text-lg leading-tight truncate`}>{title}</div>
                {count != null ? <div className={countChip}>{count}</div> : null}
              </div>
              {subtitle ? <div className={`mt-2 ${subtitleTone} text-base leading-relaxed`}>{subtitle}</div> : null}
            </div>
          </div>
        </button>

        <div className="shrink-0 flex items-center gap-2">
          {enableClamp ? (
            <button
              type="button"
              onClick={toggleExpanded}
              className="fc-action-chip fc-focus-ring"
              title={expanded ? 'Clamp height' : 'Expand height'}
            >
              {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              {expanded ? 'Show less' : showMoreCount && showMoreCount > 0 ? `Show more (${showMoreCount})` : 'Show more'}
            </button>
          ) : null}
          {actions}
        </div>
      </div>

      {open ? (
        <div className={`p-6 md:p-7 ${bodyClassName}`}>
          <div className={clampOn ? `relative overflow-hidden pb-12 ${clampClassName}` : ''}>
            {children}
            {clampOn ? <div aria-hidden="true" className="fc-clamp-fade z-[1]" /> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

