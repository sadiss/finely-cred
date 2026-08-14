import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Crown,
  Gift,
  Layers,
  Lock,
  Sparkles,
  Scale,
  Users,
  type LucideIcon,
} from 'lucide-react';
import {
  PUBLIC_SOLUTIONS_SECTIONS,
  type PublicNavAccent,
  type PublicNavLink,
} from '../../config/siteWayfinderLanes';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_FIXED_OVERLAY,
  FINELY_OS_MODAL_HEADER,
  FINELY_OS_MODAL_SHELL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  type FinelyOsPublicAccent,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsModalCloseButton } from '../../features/os/FinelyOsModalCloseButton';

const LINK_ICONS: Record<string, LucideIcon> = {
  'personal-restore': Sparkles,
  'personal-building': Sparkles,
  business: Building2,
  debt: Scale,
  wealth: Crown,
  tradelines: Layers,
  privacy: Lock,
  bundles: Gift,
  specialist: Users,
  all: Layers,
};

const ACCENT_RING: Record<FinelyOsPublicAccent, string> = {
  emerald: 'hover:border-emerald-400/45 hover:bg-emerald-500/10 focus-visible:ring-emerald-400/35',
  violet: 'hover:border-violet-400/45 hover:bg-violet-500/10 focus-visible:ring-violet-400/35',
  fuchsia: 'hover:border-fuchsia-400/45 hover:bg-fuchsia-500/10 focus-visible:ring-fuchsia-400/35',
  amber: 'hover:border-amber-400/45 hover:bg-amber-500/10 focus-visible:ring-amber-400/35',
  sky: 'hover:border-sky-400/45 hover:bg-sky-500/10 focus-visible:ring-sky-400/35',
  rose: 'hover:border-rose-400/45 hover:bg-rose-500/10 focus-visible:ring-rose-400/35',
};

const ACCENT_ICON: Record<FinelyOsPublicAccent, string> = {
  emerald: 'text-emerald-300',
  violet: 'text-violet-300',
  fuchsia: 'text-fuchsia-300',
  amber: 'text-amber-300',
  sky: 'text-sky-300',
  rose: 'text-rose-300',
};

function toAccent(a?: PublicNavAccent): FinelyOsPublicAccent {
  return (a ?? 'emerald') as FinelyOsPublicAccent;
}

function normalizePath(path: string) {
  return path.replace(/\/+$/, '') || '/';
}

type Props = {
  open: boolean;
  onClose: () => void;
  /** Current path — highlights the matching card */
  activePath?: string;
};

/** RoleStep-style colorful solution picker — navigates to pricing / solution routes. */
export function ServicesChooserModal({ open, onClose, activePath }: Props) {
  const navigate = useNavigate();
  const active = useMemo(() => normalizePath(activePath || ''), [activePath]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const pick = (link: PublicNavLink) => {
    onClose();
    navigate(link.path);
  };

  // Portaled to document.body — PageShell uses overflow-x-clip which clips fixed overlays.
  const modal = (
    <div className={`${FINELY_OS_FIXED_OVERLAY} z-[330]`} role="presentation">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close solutions chooser" onClick={onClose} />
      <div className="absolute inset-x-0 top-6 sm:top-10 px-3 sm:px-4 pb-8 max-h-[calc(100vh-1.5rem)] overflow-y-auto">
        <div
          className={`relative mx-auto max-w-3xl ${FINELY_OS_MODAL_SHELL} ${finelyOsCatalogCardCompact('violet')} !p-0`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="services-chooser-title"
        >
          <div className={`${FINELY_OS_MODAL_HEADER} sm:px-6 sm:py-5`}>
            <div className="min-w-0">
              <p className={`${FINELY_OS_ENTITY_SUBLABEL} tracking-[0.28em] text-fuchsia-300`}>Browse solutions</p>
              <h2 id="services-chooser-title" className={`mt-2 text-xl sm:text-2xl font-semibold ${FINELY_OS_ENTITY_VALUE}`}>
                Which path fits <span className="text-fuchsia-300">right now?</span>
              </h2>
              <p className={`mt-1.5 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                Pick a solution — packages and DIY / DFY options open on that page.
              </p>
            </div>
            <FinelyOsModalCloseButton onClick={onClose} />
          </div>

          <div className="p-5 sm:p-6 space-y-6">
            {PUBLIC_SOLUTIONS_SECTIONS.map((section) => (
              <section key={section.id} className="space-y-3">
                <h3 className={`${FINELY_OS_ENTITY_SUBLABEL} tracking-[0.2em]`}>{section.title}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                  {section.links.map((link) => {
                    const accent = toAccent(link.accent);
                    const Icon = LINK_ICONS[link.id] ?? Sparkles;
                    const isActive = active === normalizePath(link.path);
                    return (
                      <button
                        key={link.id}
                        type="button"
                        onClick={() => pick(link)}
                        className={`group text-left rounded-2xl border p-4 sm:p-5 transition-all min-h-[7.5rem] focus:outline-none focus-visible:ring-2 ${
                          isActive
                            ? `${finelyOsCatalogCardCompact(accent)} !p-4 sm:!p-5 ring-1 ring-amber-400/40`
                            : `border-white/[0.08] bg-white/[0.04] ${ACCENT_RING[accent]}`
                        }`}
                        data-fc-accent={accent}
                        aria-current={isActive ? 'true' : undefined}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-black/30 ${ACCENT_ICON[accent]}`}
                          >
                            <Icon size={20} />
                          </span>
                          {link.badge ? (
                            <span className="rounded-full border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-200">
                              {link.badge}
                            </span>
                          ) : isActive ? (
                            <span className="rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-200">
                              Current
                            </span>
                          ) : null}
                        </div>
                        <div className={`mt-3 text-base sm:text-lg font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{link.label}</div>
                        {link.hint ? (
                          <div className={`mt-1 text-xs sm:text-sm leading-relaxed ${FINELY_OS_ENTITY_BODY} line-clamp-2`}>
                            {link.hint}
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : modal;
}
