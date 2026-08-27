import React, { useState } from 'react';
import {
  Bell,
  ChevronRight,
  Lock,
  Menu,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FinelyCredLogo } from '../../../../components/brand/FinelyCredLogo';
import { PortalChatWidget } from '../../../../components/chat/PortalChatWidget';
import { openCommunicationHub } from '../../../../components/chat/communicationHubModel';
import { WorkCommandPalette } from '../../../work/components/WorkCommandPalette';
import type { WorkspaceProductAccent, WorkspaceProductRole } from '../workspaceProductTokens';
import {
  getWorkspaceProductNav,
  getWorkspaceProductNavByService,
  type WorkspaceProductNavItem,
} from '../workspaceProductNav';
import { hasEntitlement } from '../../../../data/billingRepo';
import { ProductDrawer } from './ProductUi';
import { ProductProfileMenu } from './ProductProfileMenu';
import { ProductPageNarrator } from './ProductPageNarrator';
import { FinelyThemeToggle } from '../../../../features/os/FinelyThemeToggle';
import { AdminPartnerViewAsChip } from '../../../../components/admin/AdminPartnerViewAsBanner';

const RECENT_KEY = 'fc_wlp_recent_destinations';
const ADMIN_RAIL_COLLAPSED_KEY = 'fc_wlp_admin_rail_collapsed';
const ALL_TOOLS_SECTIONS_KEY = 'fc_wlp_all_tools_sections';
const PARTNER_TOP_NAV_IDS = [
  'dashboard',
  'messages',
  'checklist',
  'reports',
  'evidence',
  'documents',
  'disputes',
  'letters',
  'debt',
] as const;

const PARTNER_MOBILE_NAV_IDS = ['dashboard', 'checklist', 'reports', 'letters', 'messages'] as const;

function isItemActive(
  pathname: string,
  item: WorkspaceProductNavItem,
  navigationMode: 'preview' | 'live',
) {
  const target = navigationMode === 'live' ? (item.legacyPath ?? item.livePath) : item.path;
  if (pathname === target) return true;
  if (navigationMode === 'preview' && target.includes('/preview/workspace-light')) return pathname === target;
  if (navigationMode === 'live') {
    if (target === '/admin') return false;
    return pathname === target || pathname.startsWith(`${target}/`);
  }
  return pathname.startsWith(item.path.split('?')[0]);
}

function accentStyle(accent: WorkspaceProductAccent): React.CSSProperties {
  const map: Record<WorkspaceProductAccent, { accent: string; ink: string; tint: string }> = {
    emerald: { accent: 'var(--wlp-emerald-bright)', ink: 'var(--wlp-emerald)', tint: 'rgba(16,185,129,.11)' },
    violet: { accent: 'var(--wlp-violet-bright)', ink: 'var(--wlp-violet)', tint: 'rgba(139,92,246,.105)' },
    sky: { accent: 'var(--wlp-sky-bright)', ink: 'var(--wlp-sky)', tint: 'rgba(14,165,233,.105)' },
    rose: { accent: 'var(--wlp-rose-bright)', ink: 'var(--wlp-rose)', tint: 'rgba(244,63,111,.1)' },
    graphite: { accent: '#64748b', ink: '#475569', tint: 'rgba(100,116,139,.1)' },
  };
  return {
    ['--wlp-accent' as string]: map[accent].accent,
    ['--wlp-accent-ink' as string]: map[accent].ink,
    ['--wlp-accent-tint' as string]: map[accent].tint,
  } as React.CSSProperties;
}

export function ProductWorkspaceShell({
  role,
  pageTitle,
  partnerId,
  presentationMode = false,
  dataMode = 'real',
  navigationMode = 'preview',
  children,
}: {
  role: WorkspaceProductRole;
  pageTitle: string;
  partnerId?: string;
  presentationMode?: boolean;
  dataMode?: 'demo' | 'real';
  /** Product routes keep their canonical URLs; review routes stay under `/preview/workspace-light/...`. */
  navigationMode?: 'preview' | 'live';
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const hideEmbeddedHub =
    pathname.endsWith('/messages') ||
    pathname.endsWith('/communications') ||
    pathname.endsWith('/comms') ||
    pathname.endsWith('/calendar') ||
    pathname.includes('/meeting/') ||
    pathname.includes('/video/');
  const [allToolsOpen, setAllToolsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [adminRailCollapsed, setAdminRailCollapsed] = useState(() => {
    try {
      return localStorage.getItem(ADMIN_RAIL_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [openToolSections, setOpenToolSections] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem(ALL_TOOLS_SECTIONS_KEY) || '{}');
    } catch {
      return {};
    }
  });

  const toggleToolSection = (sectionId: string, open: boolean) => {
    setOpenToolSections((current) => {
      const next = { ...current, [sectionId]: open };
      try {
        localStorage.setItem(ALL_TOOLS_SECTIONS_KEY, JSON.stringify(next));
      } catch {
        // optional personalization
      }
      return next;
    });
  };

  const allItems = getWorkspaceProductNav(role);
  const primary = allItems.filter((item) => item.group === 'primary');
  const mobilePartnerNavItems = React.useMemo(() => {
    const itemById = new Map(allItems.map((item) => [item.id, item]));
    return PARTNER_MOBILE_NAV_IDS.flatMap((id) => {
      const item = itemById.get(id);
      return item ? [item] : [];
    });
  }, [allItems]);
  const recent = recentIds
    .map((id) => allItems.find((item) => item.id === id))
    .filter((item): item is WorkspaceProductNavItem => Boolean(item))
    .slice(0, 3);

  // Demo and preview contexts show every lane unlocked; real sessions reflect what the partner owns.
  // Admin uses the same grouping so its ~75 destinations arrive as operating lines rather than
  // one unreadable flat list.
  const serviceGroups = React.useMemo(() => {
    const hasKey =
      dataMode === 'real' && partnerId && role === 'partner'
        ? (key: string) => hasEntitlement(partnerId, key)
        : undefined;
    return getWorkspaceProductNavByService(role, 'secondary', hasKey);
  }, [role, dataMode, partnerId]);

  /**
   * The top bar previously rendered only `primary` items, which left it ending halfway across
   * a wide screen. It now carries the primary set plus the lead destination from each service
   * line the partner does not already have represented — including lines they have NOT bought,
   * shown locked. Seeing a locked lane is the point: it is how a partner discovers the service
   * exists.
   */
  const topNavItems = React.useMemo(() => {
    if (role === 'partner') {
      const itemById = new Map(allItems.map((item) => [item.id, item]));
      return PARTNER_TOP_NAV_IDS.flatMap((id) => {
        const item = itemById.get(id);
        if (!item) return [];
        const service = serviceGroups.find((group) => group.line.id === item.service);
        return [{ item, locked: service ? !service.unlocked : false }];
      });
    }

    const picked: { item: WorkspaceProductNavItem; locked: boolean }[] = primary.map((item) => ({
      item,
      locked: false,
    }));
    const seen = new Set(primary.map((item) => item.service));

    for (const group of serviceGroups) {
      if (picked.length >= 10) break;
      if (seen.has(group.line.id)) continue;
      const lead = group.items[0];
      if (!lead) continue;
      seen.add(group.line.id);
      picked.push({ item: lead, locked: !group.unlocked });
    }

    return picked;
  }, [allItems, primary, role, serviceGroups]);

  const go = (item: WorkspaceProductNavItem) => {
    const next = [item.id, ...recentIds.filter((id) => id !== item.id)].slice(0, 5);
    setRecentIds(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // optional personalization
    }
    setAllToolsOpen(false);
    setMobileNavOpen(false);
    navigate(navigationMode === 'live' ? (item.legacyPath ?? item.livePath) : item.path);
  };

  const openSearch = () => {
    window.dispatchEvent(
      new CustomEvent('finely:open-work-command-palette', {
        detail: { scope: role },
      }),
    );
  };

  const toggleAdminRail = () => {
    setAdminRailCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(ADMIN_RAIL_COLLAPSED_KEY, String(next));
      } catch {
        // Optional workspace preference.
      }
      return next;
    });
  };

  const utility = (
    <div className="fc-wlp-utility">
      {role === 'admin' ? (
        <>
          <button type="button" className="fc-wlp-mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation">
            <Menu size={18} />
          </button>
          <button
            type="button"
            className="fc-wlp-utility-action fc-wlp-rail-toggle"
            onClick={toggleAdminRail}
            aria-label={adminRailCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-pressed={adminRailCollapsed}
            title={adminRailCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {adminRailCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </>
      ) : null}
      <div className="fc-wlp-utility-context">
        <div className="fc-wlp-utility-role">{role === 'admin' ? 'Admin workspace' : 'Partner portal'}</div>
        <div className="fc-wlp-utility-page">{pageTitle}</div>
      </div>
      <div className="fc-wlp-utility-spacer" />
      <button type="button" className="fc-wlp-search-trigger" onClick={openSearch} aria-label="Search workspace">
        <Search size={16} />
        <span>Search anything…</span>
        <span className="fc-wlp-key">Ctrl K</span>
      </button>
      <button
        type="button"
        className="fc-wlp-utility-action"
        onClick={() =>
          navigate(
            role === 'admin'
              ? navigationMode === 'live'
                ? '/admin/notifications'
                : '/preview/workspace-light/admin/notifications'
              : navigationMode === 'live'
                ? '/portal/notifications'
                : '/preview/workspace-light/portal/notifications',
          )
        }
        aria-label="Notifications"
      >
        <Bell size={17} />
      </button>
      <ProductPageNarrator />
      <FinelyThemeToggle adminPreview pair />
      <button
        type="button"
        className="fc-wlp-utility-action"
        data-accent="violet"
        onClick={() => openCommunicationHub({ tab: 'ai', partnerId, expanded: true, contextLabel: pageTitle })}
      >
        <Sparkles size={16} />
        <span className="fc-wlp-utility-label">Ask Finely</span>
      </button>
      {role === 'admin' ? <ProductProfileMenu role="admin" compact navigationMode={navigationMode} /> : null}
    </div>
  );

  return (
    <div
      className="fc-wlp"
      style={presentationMode ? ({ '--wlp-review-h': '0px' } as React.CSSProperties) : undefined}
    >
      {role === 'admin' ? (
        <div className="fc-wlp-admin-shell" data-rail-collapsed={adminRailCollapsed ? 'true' : undefined}>
          <aside className="fc-wlp-admin-rail" aria-label="Admin navigation">
            <div className="fc-wlp-admin-rail-inner">
              <Link
                to={navigationMode === 'live' ? '/admin' : '/preview/workspace-light'}
                className="fc-wlp-rail-brand"
              >
                <FinelyCredLogo variant="mark" size="sm" tone="gold" className="fc-wlp-rail-logo" />
                <span className="fc-wlp-rail-brand-copy">
                  <span className="fc-wlp-rail-brand-name">Finely Cred</span>
                  <span className="fc-wlp-rail-brand-role">Admin workspace</span>
                </span>
              </Link>
              <nav className="fc-wlp-rail-nav">
                <div className="fc-wlp-rail-label">Workspace</div>
                {primary.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="fc-wlp-rail-item"
                      data-accent={item.accent}
                      data-active={isItemActive(pathname, item, navigationMode) ? 'true' : undefined}
                      aria-current={isItemActive(pathname, item, navigationMode) ? 'page' : undefined}
                      onClick={() => go(item)}
                      title={item.label}
                    >
                      <span className="fc-wlp-rail-icon">
                        <Icon size={17} strokeWidth={2.05} />
                      </span>
                      <span className="fc-wlp-rail-item-label">{item.label}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  className="fc-wlp-rail-item"
                  data-open={allToolsOpen ? 'true' : undefined}
                  onClick={() => setAllToolsOpen(true)}
                >
                  <span className="fc-wlp-rail-icon">
                    <MoreHorizontal size={17} strokeWidth={2.1} />
                  </span>
                  <span className="fc-wlp-rail-item-label">All tools</span>
                </button>
              </nav>
              <div className="fc-wlp-rail-footer">
                <div className="fc-wlp-rail-account">
                  <span className="fc-wlp-rail-session-icon"><ShieldCheck size={16} /></span>
                  <div>
                    <div className="fc-wlp-rail-brand-name">Protected workspace</div>
                    <div className="fc-wlp-rail-brand-role">
                      {navigationMode === 'preview' ? 'Product workspace review' : 'Secure workspace session'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
          <main className="fc-wlp-main">
            {utility}
            {children}
          </main>
        </div>
      ) : (
        <div className="fc-wlp-partner-shell">
          <header className="fc-wlp-partner-header">
            <div className="fc-wlp-partner-header-main">
              <button
                type="button"
                className="fc-wlp-mobile-menu"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open navigation"
              >
                <Menu size={18} />
              </button>
              <Link
                to={navigationMode === 'live' ? '/portal/dashboard' : '/preview/workspace-light/portal/dashboard'}
                className="fc-wlp-partner-brand"
              >
                <FinelyCredLogo variant="full" size="sm" tone="emerald" alignLeft className="fc-wlp-partner-logo" />
                <span className="fc-wlp-partner-brand-copy">
                  <strong>Partner portal</strong>
                  <span>Your credit command center</span>
                </span>
              </Link>
              <div className="fc-wlp-utility-spacer" />
              <button type="button" className="fc-wlp-search-trigger" onClick={openSearch} aria-label="Search your workspace">
                <Search size={16} />
                <span>Search your workspace…</span>
                <span className="fc-wlp-key">Ctrl K</span>
              </button>
              <ProductPageNarrator />
              <FinelyThemeToggle adminPreview pair />
              <button
                type="button"
                className="fc-wlp-utility-action"
                data-accent="violet"
                onClick={() => openCommunicationHub({ tab: 'ai', partnerId, expanded: true, contextLabel: pageTitle })}
              >
                <Sparkles size={16} />
                <span className="fc-wlp-utility-label">Ask Finely</span>
              </button>
              <ProductProfileMenu role="partner" navigationMode={navigationMode} />
            </div>
            <AdminPartnerViewAsChip />
            <nav className="fc-wlp-partner-nav" aria-label="Partner portal navigation">
              {topNavItems.map(({ item, locked }) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="fc-wlp-partner-nav-item"
                    data-accent={item.accent}
                    data-locked={locked ? 'true' : undefined}
                    data-active={isItemActive(pathname, item, navigationMode) ? 'true' : undefined}
                    aria-current={isItemActive(pathname, item, navigationMode) ? 'page' : undefined}
                    onClick={() => go(item)}
                    title={locked ? `${item.label} — part of a service you have not started yet` : item.description}
                  >
                    <span className="fc-wlp-partner-nav-icon">
                      <Icon size={15} strokeWidth={2.1} />
                    </span>
                    <span className="fc-wlp-partner-nav-text">{item.label}</span>
                    {locked ? <Lock size={11} strokeWidth={2.6} className="fc-wlp-partner-nav-lock" /> : null}
                  </button>
                );
              })}
              <button
                type="button"
                className="fc-wlp-partner-nav-item"
                data-open={allToolsOpen ? 'true' : undefined}
                onClick={() => setAllToolsOpen(true)}
              >
                <span className="fc-wlp-partner-nav-icon">
                  <MoreHorizontal size={15} strokeWidth={2.1} />
                </span>
                All tools
              </button>
            </nav>
          </header>
          {children}
          <nav className="fc-wlp-mobile-workbar" aria-label="Partner mobile navigation">
            {mobilePartnerNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-active={isItemActive(pathname, item, navigationMode) ? 'true' : undefined}
                  aria-current={isItemActive(pathname, item, navigationMode) ? 'page' : undefined}
                  onClick={() => go(item)}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      <ProductDrawer
        open={allToolsOpen}
        title={role === 'admin' ? 'All workspace tools' : 'All partner workspaces'}
        subtitle="Search with Ctrl K or open a destination below."
        onClose={() => setAllToolsOpen(false)}
      >
        {recent.length ? (
          <section className="fc-wlp-section" style={{ marginBottom: 20 }}>
            <ProductDrawerTitle title="Recent" />
            <div className="fc-wlp-list">
              {recent.map((item) => (
                <ToolRow key={`recent-${item.id}`} item={item} onClick={() => go(item)} />
              ))}
            </div>
          </section>
        ) : null}
        {serviceGroups.map(({ line, items, unlocked }, index) => {
          // Only partner lines carry upsell copy; admin operating lines are always owned.
          const upsellHeadline = 'upsellHeadline' in line ? line.upsellHeadline : '';
          const upsellPath = 'upsellPath' in line ? line.upsellPath : '';
          const LineIcon = line.icon;
          const sectionOpen = openToolSections[line.id] ?? index === 0;
          return (
            <details
              key={line.id}
              className="fc-wlp-all-tools-section"
              open={sectionOpen}
              onToggle={(event) => {
                toggleToolSection(line.id, (event.currentTarget as HTMLDetailsElement).open);
              }}
            >
              <summary className="fc-wlp-all-tools-summary">
                <div className="fc-wlp-service-line-head" data-accent={line.accent}>
                  <span className="fc-wlp-service-line-icon">
                    <LineIcon size={15} strokeWidth={2.2} />
                  </span>
                  <ProductDrawerTitle title={line.label} />
                  <span className="fc-wlp-all-tools-count">{items.length}</span>
                </div>
              </summary>
              <div className="fc-wlp-all-tools-body">
                <p className="fc-wlp-list-copy" style={{ margin: '2px 0 8px' }}>
                  {unlocked ? line.description : upsellHeadline}
                </p>
                <div className="fc-wlp-list">
                  {items.map((item) => (
                    <ToolRow key={item.id} item={item} onClick={() => go(item)} locked={!unlocked} />
                  ))}
                </div>
                {!unlocked && upsellPath ? (
                  <button
                    type="button"
                    className="fc-wlp-service-unlock"
                    onClick={() => {
                      setAllToolsOpen(false);
                      navigate(upsellPath);
                    }}
                  >
                    <Sparkles size={14} /> See {line.label} plans
                  </button>
                ) : null}
              </div>
            </details>
          );
        })}
      </ProductDrawer>

      <ProductDrawer
        open={mobileNavOpen}
        title={role === 'admin' ? 'Admin navigation' : 'Partner navigation'}
        subtitle={role === 'admin' ? 'Open a primary workspace.' : 'Open a core workstation or browse every tool.'}
        onClose={() => setMobileNavOpen(false)}
      >
        <div className="fc-wlp-list">
          {role === 'admin'
            ? primary.map((item) => <ToolRow key={item.id} item={item} onClick={() => go(item)} />)
            : topNavItems.map(({ item, locked }) => (
                <ToolRow key={item.id} item={item} onClick={() => go(item)} locked={locked} />
              ))}
        </div>
        {role === 'partner' ? (
          <button
            type="button"
            className="fc-wlp-service-unlock"
            onClick={() => {
              setMobileNavOpen(false);
              setAllToolsOpen(true);
            }}
          >
            <MoreHorizontal size={14} /> Browse every portal tool
          </button>
        ) : null}
      </ProductDrawer>

      {navigationMode === 'preview' && !hideEmbeddedHub ? (
        <PortalChatWidget
          partnerId={partnerId}
          adminMode={role === 'admin'}
          forceEnabled
          navigationMode="preview"
          visualVariant="product"
        />
      ) : null}
      <WorkCommandPalette scope={role === 'admin' ? 'admin' : 'portal'} partnerId={partnerId} surface="product" />
    </div>
  );
}

function ProductDrawerTitle({ title }: { title: string }) {
  return <div className="fc-wlp-eyebrow">{title}</div>;
}

function ToolRow({
  item,
  onClick,
  locked = false,
}: {
  item: WorkspaceProductNavItem;
  onClick: () => void;
  locked?: boolean;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      className="fc-wlp-list-row"
      data-locked={locked ? 'true' : undefined}
      onClick={onClick}
      title={locked ? `${item.label} is part of a service you have not started yet` : undefined}
      style={{ width: '100%', borderRight: 0, borderBottom: 0, borderLeft: 0, background: 'transparent', textAlign: 'left' }}
    >
      <span className="fc-wlp-list-icon" style={accentStyle(item.accent)}><Icon size={17} /></span>
      <span>
        <span className="fc-wlp-list-title">{item.label}</span>
        {item.description ? <span className="fc-wlp-list-copy" style={{ display: 'block' }}>{item.description}</span> : null}
      </span>
      {locked ? (
        <span className="fc-wlp-lock-badge" title="Part of a service you have not started yet">
          <Lock size={13} strokeWidth={2.4} />
        </span>
      ) : null}
      <ChevronRight size={16} style={{ color: 'var(--wlp-faint)' }} />
    </button>
  );
}
