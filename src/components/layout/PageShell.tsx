import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PartnerPortalNav } from '../portal/PartnerPortalNav';
import { PartnerMobileWorkBar } from '../portal/PartnerMobileWorkBar';
import { PortalCommandPaletteHost } from '../../features/work/components/WorkCommandPalette';
import { AdminNavBar, AdminNavRail } from '../admin/AdminNav';
import { UserAccountMenu } from '../account/UserAccountMenu';
import { NotificationsBell } from '../notifications/NotificationsBell';
import { FinelyContextHelpButton } from '../guide/FinelyContextHelpButton';
import { FinelyLaunchHelpStrip } from '../tours/FinelyLaunchHelpStrip';
import { PublicLegalFooter } from '../legal/PublicLegalFooter';
import { BackToSiteButton } from '../navigation/BackToSiteButton';
import { FinelySiteWayfinder } from '../../features/os/FinelySiteWayfinder';
import { FinelyThemeToggle } from '../../features/os/FinelyThemeToggle';
import { shouldShowPublicThemeToggle } from '../../lib/finelyThemeAccess';
import { useAuth } from '../../auth/AuthProvider';
import { applyTenantBranding, getActiveTenant } from '../../tenancy/activeTenant';

export function PageShell({
  title,
  subtitle,
  badge,
  back,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  back?: { to?: string | number; label?: string; title?: string };
  children?: React.ReactNode;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const pathname = location.pathname;
  const [storeVersion, setStoreVersion] = useState(0);
  const [nestedScrollSuspects, setNestedScrollSuspects] = useState<
    Array<{
      tag: string;
      cls: string;
      overflowY: string | null;
      overflow: string | null;
      maxH: string | null;
      h: string | null;
      clientH: number | null;
      scrollH: number | null;
      isScrolling: boolean;
    }>
  >([]);
  const [nestedScrollSampledAt, setNestedScrollSampledAt] = useState<number | null>(null);
  const auditRanRef = useRef(false);
  const auditSessionKey = 'fc_debug_audit_ran_v1';
  useEffect(() => {
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const debugUi = useMemo(() => {
    try {
      const q = new URLSearchParams(location.search || '');
      return (q.get('debugUi') || '').trim() === '1';
    } catch {
      return false;
    }
  }, [location.search]);

  const auditUi = useMemo(() => {
    try {
      const q = new URLSearchParams(location.search || '');
      return (q.get('audit') || '').trim() === '1';
    } catch {
      return false;
    }
  }, [location.search]);

  const startAudit = useMemo(() => {
    return () => {
      if (!debugUi) return;
      try {
        if (typeof window !== 'undefined' && window.sessionStorage?.getItem(auditSessionKey) === '1') return;
      } catch {
        // ignore
      }
      if (auditRanRef.current) return;
      auditRanRef.current = true;
      try {
        if (typeof window !== 'undefined') window.sessionStorage?.setItem(auditSessionKey, '1');
      } catch {
        // ignore
      }
      import('../../debug/runSiteAudit')
        .then(({ runSiteAudit }) =>
          runSiteAudit({
            runId: 'pre-fix',
            navigate: (to: string) => navigate(to),
          }),
        )
        .catch((e: any) => {
          // best-effort only (no remote telemetry)
          console.warn('[audit] start failed', e);
        });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debugUi, navigate, pathname, location.search]);

  useEffect(() => {
    if (!debugUi) return;
    if (pathname !== '/portal/dashboard') return;
    let already = false;
    try {
      already = typeof window !== 'undefined' && window.sessionStorage?.getItem(auditSessionKey) === '1';
    } catch {
      already = false;
    }
    if (already) return;
    startAudit();
  }, [debugUi, pathname, location.search, startAudit]);

  useEffect(() => {
    if (!debugUi || !auditUi) return;
    startAudit();
  }, [debugUi, auditUi, pathname, location.search, startAudit]);

  // #region agent log
  useEffect(() => {
    let debugUi = false;
    try {
      const q = new URLSearchParams(location.search || '');
      debugUi = (q.get('debugUi') || '').trim() === '1';
    } catch {
      debugUi = false;
    }
    if (!debugUi) return;

    const isAdmin = pathname.startsWith('/admin');
    const isPortal = pathname.startsWith('/portal');
    const isAppRoute =
      isAdmin ||
      isPortal ||
      pathname.startsWith('/business') ||
      pathname.startsWith('/au') ||
      pathname.startsWith('/dashboard');

    // If the fixed public nav is not shown, don't reserve 112px of top padding.
    const useLargeTopPad =
      !pathname.startsWith('/portal') &&
      !pathname.startsWith('/admin') &&
      !pathname.startsWith('/business') &&
      !pathname.startsWith('/au') &&
      !pathname.startsWith('/dashboard');
    const topPad = useLargeTopPad ? 'pt-28' : 'pt-10';

    if (pathname.startsWith('/portal/dashboard/admin/')) {
      console.warn(
        '[route] suspect relative admin path (missing leading slash)',
        pathname,
        (location.search || '').slice(0, 200),
      );
    }
  }, [pathname, location.search]);

  const tenant = useMemo(() => getActiveTenant(), [storeVersion]);

  useEffect(() => {
    applyTenantBranding(tenant);
  }, [tenant]);

  // If the fixed public nav is not shown, don't reserve 112px of top padding.
  const useLargeTopPad =
    !pathname.startsWith('/portal') &&
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/business') &&
    !pathname.startsWith('/au') &&
    !pathname.startsWith('/dashboard') &&
    !pathname.startsWith('/seller') &&
    !pathname.startsWith('/account') &&
    !pathname.startsWith('/claim') &&
    !pathname.startsWith('/partner-setup');
  const showWayfinder = useLargeTopPad && pathname !== '/';
  const topPad = useLargeTopPad ? (showWayfinder ? 'pt-52' : 'pt-28') : 'pt-[max(0.75rem,env(safe-area-inset-top))]';
  const isAdmin = pathname.startsWith('/admin');
  const isPortal = pathname.startsWith('/portal');
  const isBusiness = pathname.startsWith('/business');
  const isAppRoute =
    isAdmin ||
    isPortal ||
    isBusiness ||
    pathname.startsWith('/au') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/seller') ||
    pathname.startsWith('/account');
  const useAppTopChrome = isAppRoute;

  const appSurface = isPortal
    ? 'portal'
    : isAdmin
      ? 'admin'
      : isBusiness
        ? 'business'
        : useLargeTopPad
          ? 'public'
          : 'app';

  const showAccountMenu = Boolean(auth.user) && isAppRoute;
  const showThemeToggle = shouldShowPublicThemeToggle(auth.user?.email);

  const appTopChrome = useAppTopChrome ? (
    <header
      className="sticky top-0 z-[170] mb-4 flex items-center justify-between gap-3 py-2.5 border-b border-white/[0.08] bg-fc-deep/92 backdrop-blur-lg fc-app-top-chrome"
      data-fc-app-top-chrome="1"
    >
      <BackToSiteButton variant="ghost" label="Back to site" className="!px-3 !py-2 !text-xs shrink-0" />
      {showAccountMenu ? (
        <div className="flex items-center gap-2 shrink-0">
          {showThemeToggle ? <FinelyThemeToggle compact /> : null}
          <NotificationsBell />
          <UserAccountMenu />
        </div>
      ) : null}
    </header>
  ) : null;

  const effectiveBack = useMemo(() => {
    if (back) return back;
    // Auto-back for detail routes to prevent “dead-end” pages.
    // Heuristic: if a route has 3+ segments (e.g. /portal/debt/:id), link back to /portal/debt.
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length < 3) return null;
    const section = parts[0];
    const parent = parts[1];
    const parentPath = `/${section}/${parent}`;

    const labelMap: Record<string, Record<string, string>> = {
      portal: {
        disputes: 'Disputes',
        debt: 'Debt Center',
        reports: 'Reports',
        documents: 'Documents Vault',
        letters: 'Letters',
        tasks: 'Tasks',
        projects: 'Projects',
        calendar: 'Calendar',
      },
      admin: {
        partners: 'Partners',
        cases: 'Cases',
        projects: 'Projects',
        templates: 'Templates',
        products: 'Products',
        settings: 'Settings',
      },
      business: {
        dashboard: 'Business Dashboard',
        vendors: 'Vendors',
        documents: 'Documents',
        profile: 'Profile',
        funding: 'Funding',
      },
      au: {
        marketplace: 'Marketplace',
        request: 'Request',
        orders: 'Orders',
      },
    };

    const label = labelMap[section]?.[parent] ?? 'Back';
    return { to: parentPath, label: `Back to ${label}`, title: `Back to ${label}` };
  }, [back, pathname]);

  // #region agent log
  useEffect(() => {
    if (!debugUi) return;
    try {
      const q = new URLSearchParams(location.search || '');
      const enabled = (q.get('debugUi') || '').trim() === '1';
      if (!enabled) return;
    } catch {
      return;
    }

    let cancelled = false;
    const run = async () => {
      // Let React commit the route content first.
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      if (cancelled) return;

      const scope = document.querySelector('[data-fc-route-content="1"]') as HTMLElement | null;
      const root = document.querySelector('[data-fc-pageshell-root="1"]') as HTMLElement | null;
      const nodes = Array.from((scope || document).querySelectorAll('*')) as HTMLElement[];

      const suspects: Array<{
        tag: string;
        cls: string;
        overflowY: string | null;
        overflow: string | null;
        maxH: string | null;
        h: string | null;
        clientH: number | null;
        scrollH: number | null;
        isScrolling: boolean;
      }> = [];

      for (const el of nodes) {
        if (!el || !el.getBoundingClientRect) continue;
        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY;
        const overflow = style.overflow;
        const maxH = style.maxHeight;
        const h = style.height;
        const isCandidate =
          overflowY === 'auto' ||
          overflowY === 'scroll' ||
          overflow === 'auto' ||
          overflow === 'scroll' ||
          (maxH && maxH !== 'none' && maxH !== '0px');
        if (!isCandidate) continue;

        const clientH = (el as any).clientHeight ?? null;
        const scrollH = (el as any).scrollHeight ?? null;
        const isScrolling =
          typeof clientH === 'number' && typeof scrollH === 'number' ? scrollH > clientH + 2 : false;

        // Skip the PageShell root itself; we care about nested containers.
        if (root && el === root) continue;
        // Skip tiny/irrelevant elements.
        if (typeof clientH === 'number' && clientH < 80) continue;

        suspects.push({
          tag: String(el.tagName || '').toLowerCase(),
          cls: String((el as any).className || '').slice(0, 180),
          overflowY: overflowY || null,
          overflow: overflow || null,
          maxH: maxH || null,
          h: h || null,
          clientH,
          scrollH,
          isScrolling,
        });

        if (suspects.length >= 18) break;
      }

      if (!cancelled) {
        setNestedScrollSuspects(suspects);
        setNestedScrollSampledAt(Date.now());
      }

      // Link sanity scan (best-effort): catches empty/relative hrefs that can create dead-ends.
      try {
        const anchors = Array.from((scope || document).querySelectorAll('a[href]')) as HTMLAnchorElement[];
        const bad = anchors
          .map((a) => ({
            href: String(a.getAttribute('href') || '').trim(),
            text: String(a.textContent || '').trim().slice(0, 60),
          }))
          .filter((x) => {
            if (!x.href) return true;
            if (x.href === '#') return true;
            if (x.href.startsWith('http://') || x.href.startsWith('https://')) return false;
            if (x.href.startsWith('/') || x.href.startsWith('mailto:') || x.href.startsWith('tel:')) return false;
            // Allow hash-only navigation like "#section" only if it has an id (still often a dead-end in SPA).
            if (x.href.startsWith('#')) return true;
            // Anything else is suspicious (relative paths, javascript:, etc.)
            return true;
          })
          .slice(0, 18);
        if (bad.length) {
          // eslint-disable-next-line no-console
          console.warn('[audit] suspicious anchors', { pathname, count: bad.length, bad });
        }
      } catch {
        // ignore
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [debugUi, pathname, location.search]);
  // #endregion

  return (
    <div
      data-fc-pageshell-root="1"
      data-fc-app-surface={appSurface}
      data-fc-pathname={pathname}
      className={`relative bg-fc-deep text-white fc-premium-icons ${topPad} min-h-screen pb-28 md:pb-20 overflow-x-clip`}
    >
      {debugUi ? (
        <div
          data-fc-debug-panel="1"
          className="fixed top-24 left-5 lg:left-5 lg:top-24 lg:w-[340px] z-[220] w-[320px] max-w-[calc(100vw-40px)] rounded-2xl border border-white/[0.08] bg-black/80 backdrop-blur-xl p-4 text-white/80 shadow-2xl"
        >
          <div className="text-[10px] uppercase tracking-widest text-white/50 font-mono">debugUi links</div>
          <div className="mt-2 grid gap-2 text-xs">
            <a
              className="inline-flex items-center justify-between gap-3 fc-light-glass-panel fc-light-chrome-panel rounded-xl px-3 py-2 hover:bg-white/[0.06] transition-all"
              href={`${typeof window !== 'undefined' ? window.location.origin : ''}/admin/partners?debugUi=1`}
            >
              <span>Admin · Partners</span>
              <ArrowRight size={14} className="text-amber-400" />
            </a>
            <button
              type="button"
              className="inline-flex items-center justify-between gap-3 fc-light-glass-panel fc-light-chrome-panel rounded-xl px-3 py-2 hover:bg-white/[0.06] transition-all text-left"
              title="Runs a site-wide audit and logs results (no manual refreshing)."
              onClick={() => {
                startAudit();
              }}
            >
              <span>Run site audit</span>
              <ArrowRight size={14} className="text-amber-400" />
            </button>
            <a
              className="inline-flex items-center justify-between gap-3 fc-light-glass-panel fc-light-chrome-panel rounded-xl px-3 py-2 hover:bg-white/[0.06] transition-all"
              href={`${typeof window !== 'undefined' ? window.location.origin : ''}/portal/letters?debugUi=1`}
            >
              <span>Portal · Letters</span>
              <ArrowRight size={14} className="text-amber-400" />
            </a>
            <a
              className="inline-flex items-center justify-between gap-3 fc-light-glass-panel fc-light-chrome-panel rounded-xl px-3 py-2 hover:bg-white/[0.06] transition-all"
              href={`${typeof window !== 'undefined' ? window.location.origin : ''}/portal/reports?debugUi=1`}
            >
              <span>Portal · Reports</span>
              <ArrowRight size={14} className="text-amber-400" />
            </a>
          </div>
          <div className="mt-2 text-[11px] text-white/45">
            Tip: always include the leading <span className="font-mono text-white/60">/</span> when pasting paths.
          </div>

          <div className="mt-4 pt-4 border-t border-white/[0.08]">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[10px] uppercase tracking-widest text-white/50 font-mono">nested scroll suspects</div>
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                {nestedScrollSuspects.length}
                {nestedScrollSuspects.some((s) => s.isScrolling) ? <span className="text-amber-300"> • scrolling</span> : null}
              </div>
            </div>
            <div className="mt-2 text-[11px] text-white/45">
              route: <span className="text-white/65 font-mono">{pathname}</span>
              {nestedScrollSampledAt ? (
                <span className="text-white/35"> • sampled {new Date(nestedScrollSampledAt).toLocaleTimeString()}</span>
              ) : null}
            </div>
            {nestedScrollSuspects.length === 0 ? (
              <div className="mt-2 text-[11px] text-emerald-200/80">No obvious nested scroll containers detected.</div>
            ) : (
              <div className="mt-3 space-y-2">
                {nestedScrollSuspects.slice(0, 8).map((s, i) => (
                  <div key={`${s.tag}_${i}`} className="fc-light-glass-panel fc-light-chrome-panel rounded-xl p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[10px] uppercase tracking-widest text-white/60 font-mono">
                        {s.tag} {s.isScrolling ? <span className="text-amber-300">scrolling</span> : null}
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-white/35 font-mono">
                        {typeof s.clientH === 'number' ? `${Math.round(s.clientH)}px` : '—'}
                      </div>
                    </div>
                    <div className="mt-2 text-[11px] text-white/55 break-words">{s.cls || '(no class)'}</div>
                    <div className="mt-2 text-[10px] uppercase tracking-widest text-white/35 font-mono">
                      oy:{s.overflowY ?? '—'} • ov:{s.overflow ?? '—'} • maxH:{s.maxH ?? '—'} • h:{s.h ?? '—'}
                    </div>
                  </div>
                ))}
                {nestedScrollSuspects.length > 8 ? (
                  <div className="text-[10px] uppercase tracking-widest text-white/35 font-mono">
                    +{nestedScrollSuspects.length - 8} more (see audit logs for full list)
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}
      {!useAppTopChrome && showAccountMenu && showThemeToggle ? (
        <div className="fixed top-4 right-4 sm:top-5 sm:right-6 z-[180] flex items-center gap-2">
          <FinelyThemeToggle compact />
          <NotificationsBell />
          <UserAccountMenu />
        </div>
      ) : !useAppTopChrome && showAccountMenu ? (
        <div className="fixed top-4 right-4 sm:top-5 sm:right-6 z-[180] flex items-center gap-2">
          <NotificationsBell />
          <UserAccountMenu />
        </div>
      ) : showWayfinder && showThemeToggle ? (
        <div className="fixed top-4 right-4 sm:top-5 sm:right-6 z-[180]">
          <FinelyThemeToggle compact />
        </div>
      ) : null}
      {showWayfinder ? <FinelySiteWayfinder /> : null}
      <div className="absolute inset-0 pointer-events-none fc-pageshell-aurora" aria-hidden="true">
        <div className="fc-pageshell-aurora-wash absolute inset-0 bg-gradient-to-b from-black/[0.06] via-transparent to-fc-deep/30" />
        <div
          className="fc-pageshell-aurora-glow fc-pageshell-aurora-glow-primary absolute -top-40 left-1/2 -translate-x-1/2 w-[1200px] h-[560px] blur-3xl opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(var(--brand-primary-rgb),0.18) 0%, transparent 62%)',
          }}
        />
        <div className="fc-pageshell-aurora-glow fc-pageshell-aurora-glow-violet absolute -top-24 -right-32 w-[720px] h-[520px] blur-3xl" />
        <div className="fc-pageshell-aurora-glow fc-pageshell-aurora-glow-emerald absolute bottom-0 -left-40 w-[800px] h-[480px] blur-3xl" />
      </div>
      <div
        className={`relative min-w-0 overflow-x-clip ${
          // For admin, keep the left rail flush-left on desktop while preserving comfortable content padding.
          isAdmin ? 'w-full px-2 sm:px-4 lg:pl-0 lg:pr-6 2xl:pr-8' : 'fc-container'
        } ${
          isAppRoute ? 'flex flex-col' : ''
        }`}
      >
        {isPortal && appTopChrome}
        {isPortal && <PartnerPortalNav />}
        {isPortal && <PartnerMobileWorkBar />}
        {isPortal && <PortalCommandPaletteHost />}

        {isAdmin ? (
          <div className="grid lg:grid-cols-[340px_1fr] gap-8">
            <AdminNavRail />
            <div className="min-w-0 flex flex-col">
              {appTopChrome}
              <AdminNavBar />
              <div className="space-y-6 mb-8 md:mb-12 fc-pageshell-hero">
                {effectiveBack ? (
                  <button
                    type="button"
                    onClick={() => navigate((effectiveBack.to as any) ?? -1)}
                    className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
                    title={effectiveBack.title || 'Back'}
                  >
                    <ArrowLeft size={16} /> {effectiveBack.label || 'Back'}
                  </button>
                ) : null}
                {badge && (
                  <div className="fc-badge-brand">
                    <span className="text-xs font-semibold uppercase tracking-wider">{badge}</span>
                  </div>
                )}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-white/55 text-base sm:text-lg leading-relaxed max-w-3xl">
                    {subtitle}
                  </p>
                )}
                <div className="fc-divider" />
              </div>
              <div className="pb-16">
                <div data-fc-route-content="1" data-fc-route-pathname={pathname} className="fc-light-black-scope fc-senior-simple min-w-0 overflow-x-clip">
                  {children}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {!isPortal ? appTopChrome : null}
            <div className="space-y-6 mb-8 md:mb-12 fc-pageshell-hero">
              {effectiveBack ? (
                <button
                  type="button"
                  onClick={() => navigate((effectiveBack.to as any) ?? -1)}
                  className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
                  title={effectiveBack.title || 'Back'}
                >
                  <ArrowLeft size={16} /> {effectiveBack.label || 'Back'}
                </button>
              ) : null}
              {badge && (
                <div className="fc-badge-brand">
                  <span className="text-xs font-semibold uppercase tracking-wider">{badge}</span>
                </div>
              )}
              <h1 className={`font-light leading-tight tracking-tight ${isPortal ? 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl' : 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl'}`}>
                {title}
              </h1>
              {subtitle && (
                <p className="text-white/55 text-sm sm:text-base md:text-lg leading-relaxed max-w-3xl">
                  {subtitle}
                </p>
              )}
              <div className="fc-divider" />
            </div>
            <div className={isAppRoute ? 'pb-16' : ''}>
              <div data-fc-route-content="1" data-fc-route-pathname={pathname} className="fc-light-black-scope fc-senior-simple min-w-0 overflow-x-clip">
                {children}
              </div>
            </div>
          </>
        )}
      </div>
      {!isAppRoute ? <PublicLegalFooter className="pb-8 px-6" /> : null}
      <FinelyLaunchHelpStrip />
      <FinelyContextHelpButton />
    </div>
  );
}

