import React, { useState } from 'react';
import { LayoutDashboard, PanelLeftClose, PanelLeftOpen, Shield } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ADMIN_NAV_GROUPS } from '../../../config/adminNavLanes';
import { PORTAL_FULL_NAV_TABS, PORTAL_PRIMARY_LINKS } from '../../../config/portalNavLanes';
import { FinelyCredLogo } from '../../../components/brand/FinelyCredLogo';
import {
  WORKSPACE_LIGHT_PREVIEW_HUB_PATH,
  WORKSPACE_LIGHT_PREVIEW_SURFACES,
} from '../workspaceLightPreviewCatalog';

type WorkspaceKind = 'admin' | 'partner' | 'hub';

const PREVIEW_DASHBOARD: Record<WorkspaceKind, string | null> = {
  admin: '/preview/workspace-light/admin/dashboard',
  partner: '/preview/workspace-light/portal/dashboard',
  hub: null,
};

function previewPathForLive(path: string, workspace: WorkspaceKind): string {
  if (workspace === 'admin' && path === '/admin') return PREVIEW_DASHBOARD.admin!;
  if (workspace === 'partner' && path === '/portal/dashboard') return PREVIEW_DASHBOARD.partner!;
  return path;
}

function WlSideRail({ workspace }: { workspace: 'admin' | 'partner' }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [expanded, setExpanded] = useState(true);

  const adminItems = ADMIN_NAV_GROUPS.flatMap((g) => g.items).slice(0, 14);
  const portalItems = PORTAL_FULL_NAV_TABS.slice(0, 12).map((tab) => {
    const link = PORTAL_PRIMARY_LINKS.find((l) => l.path === tab.path);
    return { ...tab, icon: link?.icon ?? LayoutDashboard };
  });

  const items =
    workspace === 'admin'
      ? adminItems.map((i) => ({
          path: previewPathForLive(i.path, 'admin'),
          label: i.label,
          icon: i.icon,
        }))
      : portalItems.map((i) => ({
          path: previewPathForLive(i.path, 'partner'),
          label: i.label,
          icon: i.icon,
        }));

  return (
    <aside className={`fc-wl-side-rail ${expanded ? 'fc-wl-side-rail--expanded' : ''}`} data-fc-wl-side-rail="1">
      <div className="fc-wl-side-rail-head">
        <Link to={WORKSPACE_LIGHT_PREVIEW_HUB_PATH} className="fc-wl-side-rail-logo" title="Preview hub">
          <FinelyCredLogo className="h-7 w-auto" variant="mark" />
          {expanded ? <span className="fc-wl-side-rail-brand">Finely Cred</span> : null}
        </Link>
        <button
          type="button"
          className="fc-wl-side-rail-toggle"
          onClick={() => setExpanded((v) => !v)}
          title={expanded ? 'Collapse rail' : 'Expand rail'}
        >
          {expanded ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        </button>
      </div>

      <div className="fc-wl-side-rail-badge">
        <Shield size={12} />
        {expanded ? <span>{workspace === 'admin' ? 'Admin workspace' : 'Partner portal'}</span> : null}
      </div>

      <nav className="fc-wl-side-rail-nav" aria-label={workspace === 'admin' ? 'Admin navigation' : 'Portal navigation'}>
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.path ||
            (item.path.includes('/preview/') && pathname.startsWith(item.path)) ||
            (workspace === 'admin' && item.path === '/admin' && pathname.includes('/admin/dashboard')) ||
            (workspace === 'partner' && item.path === '/portal/dashboard' && pathname.includes('/portal/dashboard'));
          return (
            <button
              key={item.path + item.label}
              type="button"
              onClick={() => navigate(item.path)}
              className={`fc-wl-side-rail-item ${active ? 'fc-wl-side-rail-item--active' : ''}`}
              title={item.label}
            >
              <Icon size={16} className="shrink-0" />
              {expanded ? <span className="truncate">{item.label}</span> : null}
            </button>
          );
        })}
      </nav>

      {expanded ? (
        <p className="fc-wl-side-rail-foot">Preview chrome — links open live routes except dashboard lanes.</p>
      ) : null}
    </aside>
  );
}

function WlTopNav({ workspace }: { workspace: 'admin' | 'partner' }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const tabs =
    workspace === 'admin'
      ? [
          { path: PREVIEW_DASHBOARD.admin!, label: 'Dashboard', accent: 'emerald' as const },
          { path: '/admin/partners', label: 'Partners', accent: 'sky' as const },
          { path: '/admin/cases', label: 'Cases', accent: 'violet' as const },
          { path: '/admin/workflow', label: 'Workflow', accent: 'fuchsia' as const },
          { path: '/admin/comms', label: 'Comms', accent: 'sky' as const },
          { path: '/admin/marketing', label: 'Marketing', accent: 'violet' as const },
          { path: '/admin/settings', label: 'Settings', accent: 'navy' as const },
        ]
      : PORTAL_FULL_NAV_TABS.slice(0, 10).map((t) => ({
          path: previewPathForLive(t.path, 'partner'),
          label: t.label,
          accent: t.accent,
        }));

  return (
    <div className="fc-wl-top-nav" data-fc-wl-top-nav="1">
      <div className="fc-wl-top-nav-inner">
        <div className="fc-wl-top-nav-label">
          {workspace === 'admin' ? 'Admin' : 'Partner'} · top menu
        </div>
        <div className="fc-wl-top-nav-tabs" role="tablist">
          {tabs.map((tab) => {
            const on =
              pathname === tab.path ||
              (tab.path.includes('preview') && pathname === tab.path) ||
              (tab.path === '/admin' && pathname.includes('admin/dashboard')) ||
              (tab.path === '/portal/dashboard' && pathname.includes('portal/dashboard'));
            return (
              <button
                key={tab.path}
                type="button"
                role="tab"
                aria-selected={on}
                data-fc-accent={tab.accent}
                className={`fc-wl-top-nav-tab ${on ? 'fc-wl-top-nav-tab--on' : ''}`}
                onClick={() => navigate(tab.path)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="fc-wl-top-nav-meta">
          {WORKSPACE_LIGHT_PREVIEW_SURFACES.filter((s) => s.status === 'ready').map((s) => (
            <Link
              key={s.id}
              to={s.path}
              className={`fc-wl-top-nav-preview-link ${pathname === s.path ? 'fc-wl-top-nav-preview-link--on' : ''}`}
            >
              {s.title.replace(' preview', '')}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WlWorkspaceChrome({
  workspace,
  children,
}: {
  workspace: WorkspaceKind;
  children: React.ReactNode;
}) {
  if (workspace === 'hub') {
    return <>{children}</>;
  }

  return (
    <div className="fc-wl-layout" data-fc-wl-workspace={workspace}>
      <WlSideRail workspace={workspace} />
      <div className="fc-wl-layout-main">
        <WlTopNav workspace={workspace} />
        {children}
      </div>
    </div>
  );
}
