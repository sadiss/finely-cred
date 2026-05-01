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

  return (
    <section className={`rounded-3xl border border-white/10 bg-black/30 backdrop-blur-xl overflow-hidden ${className}`}>
      <div className={`p-6 md:p-7 border-b border-white/10 flex items-start justify-between gap-4 ${headerClassName}`}>
        <button
          type="button"
          onClick={toggleOpen}
          className="fc-focus-ring flex-1 text-left rounded-2xl px-2 py-1 -mx-2 -my-1 hover:bg-white/[0.03] transition-colors"
          title={open ? 'Collapse' : 'Expand'}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-white/55">
              {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-white font-semibold text-lg leading-tight truncate">{title}</div>
                {count != null ? (
                  <div className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.02] text-xs font-semibold text-white/70">
                    {count}
                  </div>
                ) : null}
              </div>
              {subtitle ? <div className="mt-2 text-white/60 text-base leading-relaxed">{subtitle}</div> : null}
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
          <div className={clampOn ? `relative overflow-hidden ${clampClassName}` : ''}>
            {children}
            {clampOn ? <div aria-hidden="true" className="fc-clamp-fade" /> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

