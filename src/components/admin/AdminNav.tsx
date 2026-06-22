import React, { useMemo, useState } from 'react';
import { ChevronDown, PanelLeftClose, PanelLeftOpen, Shield } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAdminOpsCaps, isAdminNavPathAllowed } from '../../hooks/useAdminOpsCaps';
import {
  ADMIN_NAV_GROUPS,
  isAdminNavPathActive,
} from '../../config/adminNavLanes';
import { FinelyAdminSimpleNav } from '../../features/os/FinelyAdminSimpleNav';
import { persistAdminNavMode, readAdminNavMode, type FinelyAdminNavMode } from '../../lib/finelyAdminNavMode';
import {
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_LUXURY_PAGINATION_BTN,
  FINELY_OS_SIDE_RAIL_BADGE,
  FINELY_OS_SIDE_RAIL_GLOW,
  FINELY_OS_SIDE_RAIL_GROUP,
  FINELY_OS_SIDE_RAIL_HINT,
  FINELY_OS_SIDE_RAIL_LABEL,
  FINELY_OS_SIDE_RAIL_SHELL,
  FINELY_OS_SIDE_RAIL_TITLE,
  FINELY_OS_VIEW_TABS,
  finelyOsSideRailNavItem,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';
import { FinelyCredLogo } from '../brand/FinelyCredLogo';

export function AdminNavBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const caps = useAdminOpsCaps();
  const [navMode, setNavMode] = useState<FinelyAdminNavMode>(() => readAdminNavMode());
  const [open, setOpen] = useState(false);

  const setMode = (mode: FinelyAdminNavMode) => {
    setNavMode(mode);
    persistAdminNavMode(mode);
  };

  const flat = useMemo(
    () => ADMIN_NAV_GROUPS.flatMap((g) => g.items).filter((i) => isAdminNavPathAllowed(i.path, caps)),
    [caps],
  );

  if (navMode === 'simple') {
    return (
      <div className="lg:hidden mb-6">
        <FinelyAdminSimpleNav onShowFullNav={() => setMode('full')} />
      </div>
    );
  }

  return (
    <div className="lg:hidden mb-6" data-fc-admin-nav="full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full fc-action-chip fc-focus-ring justify-between"
        title="Open admin navigation"
      >
        <span className="inline-flex items-center gap-2">
          <Shield size={14} className="text-violet-300" />
          Admin navigation
        </span>
        <span className="text-white/50 text-xs font-mono">{open ? 'hide' : 'show'}</span>
      </button>
      {open ? (
        <div className="mt-3 -mx-2 overflow-x-auto">
          <div className={`${FINELY_OS_VIEW_TABS} flex gap-2 min-w-max px-2 pb-2`}>
            {flat.map((x) => {
              const active = isAdminNavPathActive(pathname, x.path);
              const Icon = x.icon;
              return (
                <button
                  key={x.path}
                  type="button"
                  onClick={() => {
                    navigate(x.path);
                    setOpen(false);
                  }}
                  className={`${finelyOsViewTab(active, 'emerald')} inline-flex items-center gap-2 whitespace-nowrap`}
                  title={x.hint || x.label}
                >
                  <Icon size={14} />
                  {x.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <div className="flex justify-end px-1 mt-2">
        <button
          type="button"
          onClick={() => setMode('simple')}
          className="fc-admin-nav-mode-toggle text-[10px] font-black uppercase tracking-widest text-white/55 hover:text-white transition-colors"
        >
          Simple nav
        </button>
      </div>
    </div>
  );
}

export function AdminNavRail({
  expanded,
  onToggleExpanded,
}: {
  expanded: boolean;
  onToggleExpanded: () => void;
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const caps = useAdminOpsCaps();
  const [query, setQuery] = useState('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filteredGroups = ADMIN_NAV_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((i) => isAdminNavPathAllowed(i.path, caps)),
    })).filter((g) => g.items.length > 0);
    if (!q) return filteredGroups;
    return filteredGroups
      .map((g) => ({
        ...g,
        items: g.items.filter((i) => `${i.label} ${i.hint || ''} ${i.path}`.toLowerCase().includes(q)),
      }))
      .filter((g) => g.items.length > 0);
  }, [query, caps]);

  const searching = Boolean(query.trim());
  const flatItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  const navButton = (x: (typeof flatItems)[number], compact: boolean) => {
    const active = isAdminNavPathActive(pathname, x.path);
    const Icon = x.icon;
    if (compact) {
      return (
        <button
          key={x.path}
          type="button"
          onClick={() => navigate(x.path)}
          title={x.hint || x.label}
          className={`flex flex-col items-center justify-center w-11 h-11 rounded-2xl border transition-all ${
            active
              ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white border-violet-400/40 shadow-md'
              : 'bg-white/[0.06] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <Icon size={18} />
          <span className="sr-only">{x.label}</span>
        </button>
      );
    }
    return (
      <button
        key={x.path}
        type="button"
        onClick={() => navigate(x.path)}
        className={finelyOsSideRailNavItem(active)}
        title={x.hint || x.label}
      >
        <Icon size={16} className={active ? 'text-violet-300' : 'text-white/55'} />
        <div className="min-w-0">
          <div className="text-[11px] font-black uppercase tracking-widest truncate">{x.label}</div>
          {x.hint ? <div className="text-[11px] text-white/45 truncate">{x.hint}</div> : null}
        </div>
      </button>
    );
  };

  return (
    <aside className={`hidden lg:block sticky top-24 self-start shrink-0 ${expanded ? 'w-[17rem]' : 'w-[5.5rem]'}`}>
      <div className={`${FINELY_OS_SIDE_RAIL_SHELL} !max-h-[calc(100vh-6rem)] ${expanded ? '' : '!p-2'}`}>
        <div className={FINELY_OS_SIDE_RAIL_GLOW} />

        <div className={`relative flex items-center ${expanded ? 'justify-between px-2 pb-3 border-b border-white/[0.06] mb-3' : 'justify-center pb-2 mb-2'}`}>
          {expanded ? <FinelyCredLogo size="sm" forceLight className="lg:mx-0" /> : null}
          <button
            type="button"
            onClick={onToggleExpanded}
            className={`${FINELY_OS_LUXURY_PAGINATION_BTN} ${expanded ? 'px-3 py-2' : '!p-2.5'}`}
            title={expanded ? 'Collapse menu' : 'Expand menu'}
            aria-expanded={expanded}
          >
            {expanded ? (
              <>
                <PanelLeftClose size={14} className="shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest">Collapse</span>
              </>
            ) : (
              <>
                <PanelLeftOpen size={18} className="shrink-0" />
                <span className="sr-only">Expand menu</span>
              </>
            )}
          </button>
        </div>

        {expanded ? (
          <>
            <div className="relative px-2">
              <div className={FINELY_OS_SIDE_RAIL_LABEL}>Admin</div>
              <div className={`mt-2 ${FINELY_OS_SIDE_RAIL_TITLE}`}>Operate the platform</div>
              <div className={`mt-1 ${FINELY_OS_SIDE_RAIL_HINT}`}>Fast navigation • search • ops modules</div>
            </div>

            <div className="relative px-2 mt-3">
              <div className={FINELY_OS_SIDE_RAIL_LABEL}>Search</div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Partners, cases, settings…"
                className="fc-input mt-2 text-[11px]"
              />
            </div>
          </>
        ) : null}

        <div className={`relative overflow-y-auto fc-scroll-area min-w-0 flex-1 ${expanded ? 'pr-1 mt-3' : 'mt-1 flex flex-col items-center'}`}>
          {!expanded ? (
            <div className="space-y-1.5 py-1">
              {flatItems.map((x) => navButton(x, true))}
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((g) => {
                const hasActive = g.items.some((x) => isAdminNavPathActive(pathname, x.path));
                const initialOpen = hasActive || g.label === 'Core';
                const isOpen = openGroups[g.label] ?? initialOpen;

                const items = (
                  <div className="px-2 pb-2 space-y-1">
                    {g.items.map((x) => navButton(x, false))}
                  </div>
                );

                if (searching) {
                  return (
                    <div key={g.label} className={FINELY_OS_SIDE_RAIL_GROUP}>
                      <div className="px-3 py-2.5 flex items-center justify-between gap-3">
                        <div className={FINELY_OS_SIDE_RAIL_LABEL}>{g.label}</div>
                        <div className={FINELY_OS_SIDE_RAIL_BADGE}>{g.items.length}</div>
                      </div>
                      {items}
                    </div>
                  );
                }

                return (
                  <details
                    key={g.label}
                    className={`group ${FINELY_OS_SIDE_RAIL_GROUP}`}
                    open={isOpen}
                    onToggle={(e) => {
                      const next = (e.currentTarget as HTMLDetailsElement).open;
                      setOpenGroups((cur) => ({ ...cur, [g.label]: next }));
                    }}
                  >
                    <summary className="fc-focus-ring list-none cursor-pointer px-3 py-2.5 rounded-2xl flex items-center justify-between gap-3 hover:bg-white/[0.04] transition-colors [&::-webkit-details-marker]:hidden">
                      <div className={FINELY_OS_SIDE_RAIL_LABEL}>{g.label}</div>
                      <div className="inline-flex items-center gap-2">
                        <div className={FINELY_OS_SIDE_RAIL_BADGE}>{g.items.length}</div>
                        <ChevronDown size={14} className="text-white/40 transition-transform group-open:rotate-180" />
                      </div>
                    </summary>
                    {items}
                  </details>
                );
              })}
            </div>
          )}
        </div>

        {expanded ? (
          <div className="relative px-2 pt-2 border-t border-white/[0.06]">
            <p className={`${FINELY_OS_ENTITY_SUBLABEL} normal-case`}>Desktop rail · mobile uses simple 4-lane nav</p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
