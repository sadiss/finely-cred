import React, { useEffect } from 'react';
import { ArrowLeft, Home, LayoutDashboard, Search, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { usePageMeta } from '../hooks/usePageMeta';
import { useAuth } from '../auth/AuthProvider';
import { isAdminEmail } from '../auth/admin';
import {
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PAGE,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
} from '../features/os/finelyOsLightUi';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  usePageMeta('Page not found', 'That route does not exist. Return to the homepage, dashboard, or partner portal.');
  const isAdmin = auth.user?.email ? isAdminEmail(auth.user.email) : false;

  useEffect(() => {
    let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const prev = robots?.getAttribute('content') ?? '';
    if (!robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.appendChild(robots);
    }
    robots.setAttribute('content', 'noindex, nofollow');
    return () => {
      if (robots) robots.setAttribute('content', prev || 'index, follow');
    };
  }, []);

  const links = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ...(isAdmin ? [{ label: 'Admin', path: '/admin', icon: Shield }] : []),
    ...(!isAdmin && auth.user ? [{ label: 'Partner portal', path: '/portal/partner', icon: LayoutDashboard }] : []),
  ];

  return (
    <PageShell
      badge="404"
      title="Page not found"
      subtitle="That route doesn't exist. Use the links below to get back on track."
    >
      <div className={FINELY_OS_PAGE}>
        <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-3`}>
          <div className="inline-flex items-center gap-2 text-fuchsia-400">
            <Search size={16} />
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Navigation</span>
          </div>
          <p className={FINELY_OS_ENTITY_BODY}>
            If you reached this from a bookmark, the page may have moved during launch consolidation. Public marketing pages, portal, and admin each have their own home base.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {links.map(({ label, path, icon: Icon }) => (
            <button key={path} type="button" onClick={() => navigate(path)} className={path === '/' ? FINELY_OS_SUCCESS_BTN : FINELY_OS_SECONDARY_BTN}>
              <Icon size={14} /> {label}
            </button>
          ))}
          <button type="button" onClick={() => navigate(-1)} className={FINELY_OS_SECONDARY_BTN}>
            <ArrowLeft size={14} /> Go back
          </button>
        </div>
        <MarketingStaffChatStrip
          roleId="finely_advisor"
          goal="not_sure"
          roleLabel="credit restoration specialist"
          subline="Lost? Tell us what you were looking for — we'll route you to the right lane."
          buttonTone="secondary"
        />
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
