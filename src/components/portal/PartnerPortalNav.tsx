import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  FileBadge,
  Gavel,
  Scale,
  TrendingUp,
  ShieldAlert,
  FolderOpen,
  ListChecks,
  MessageSquare,
  BookOpen,
  CreditCard,
  MessageCircle,
  ScrollText,
  KanbanSquare,
  ChevronDown,
  Lock,
  Handshake,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { getOrCreatePartnerForSession } from '../../portal/getOrCreatePartnerForSession';
import { listTasksByPartner } from '../../data/tasksRepo';
import { unreadCount } from '../../data/notificationsRepo';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { hasEntitlement } from '../../data/billingRepo';

type NavIcon = React.ComponentType<{ size?: number; className?: string }>;

const PRIMARY_LINKS: { path: string; label: string; icon: NavIcon }[] = [
  { path: '/portal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/portal/reports', label: 'Reports', icon: FileText },
  { path: '/portal/analysis', label: 'Analysis', icon: FileBadge },
  { path: '/portal/documents', label: 'Documents', icon: FolderOpen },
  { path: '/portal/disputes', label: 'Disputes', icon: Gavel },
  { path: '/portal/letters', label: 'Letters', icon: ScrollText },
  { path: '/portal/debt', label: 'Debt & Summons', icon: Scale },
  { path: '/portal/tasks', label: 'Tasks', icon: ListChecks },
  { path: '/portal/messages', label: 'Messages', icon: MessageSquare },
  { path: '/portal/billing', label: 'Billing', icon: CreditCard },
];

const MORE_LINKS: { path: string; label: string; icon: NavIcon }[] = [
  { path: '/portal/checklist', label: 'Checklist', icon: ListChecks },
  { path: '/portal/checkout', label: 'Checkout', icon: CreditCard },
  { path: '/portal/projects', label: 'Projects', icon: KanbanSquare },
  { path: '/portal/build', label: 'Credit Building', icon: TrendingUp },
  { path: '/portal/identity-theft', label: 'Identity Theft', icon: ShieldAlert },
  { path: '/portal/escalations', label: 'Escalations', icon: MessageCircle },
  { path: '/portal/education', label: 'Education', icon: BookOpen },
  { path: '/portal/courses', label: 'Courses', icon: BookOpen },
  { path: '/portal/barter', label: 'Barter Exchange', icon: Handshake },
];

export function PartnerPortalNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const auth = useAuth();
  const [storeVersion, setStoreVersion] = useState(0);

  useEffect(() => {
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const partner = useMemo(() => getOrCreatePartnerForSession({ user: auth.user }), [auth.user]);
  const openTasks = useMemo(() => {
    if (!partner) return 0;
    const tasks = listTasksByPartner(partner.id);
    return tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
  }, [partner, storeVersion]);
  const unread = useMemo(() => {
    if (!partner) return 0;
    return unreadCount({ partnerId: partner.id, audience: 'partner' });
  }, [partner, storeVersion]);

  const isActivePath = (path: string) =>
    pathname === path || (path !== '/portal/dashboard' && pathname.startsWith(path + '/'));

  const entitlementForPath = (path: string) => {
    if (path.startsWith('/portal/reports')) return ENTITLEMENT_KEYS.reports;
    if (path.startsWith('/portal/analysis')) return ENTITLEMENT_KEYS.reports;
    if (path.startsWith('/portal/documents')) return ENTITLEMENT_KEYS.documents;
    if (path.startsWith('/portal/messages')) return ENTITLEMENT_KEYS.messages;
    if (path.startsWith('/portal/tasks')) return ENTITLEMENT_KEYS.tasks;
    if (path.startsWith('/portal/disputes')) return ENTITLEMENT_KEYS.disputes;
    if (path.startsWith('/portal/letters')) return ENTITLEMENT_KEYS.letters;
    if (path.startsWith('/portal/debt')) return ENTITLEMENT_KEYS.debt;
    if (path.startsWith('/portal/escalations')) return ENTITLEMENT_KEYS.escalations;
    if (path.startsWith('/portal/identity-theft')) return ENTITLEMENT_KEYS.identityTheft;
    if (path.startsWith('/portal/build')) return ENTITLEMENT_KEYS.businessBuild;
    if (path.startsWith('/portal/courses')) return ENTITLEMENT_KEYS.courses;
    if (path.startsWith('/portal/barter')) return ENTITLEMENT_KEYS.barter;
    return null;
  };

  return (
    <nav className="mb-8">
      <div className="-mx-2 overflow-x-auto md:overflow-visible">
        <div className="flex gap-1 min-w-max md:flex-wrap pb-2 px-2">
          {PRIMARY_LINKS.map(({ path, label, icon: Icon }) => {
            const active = isActivePath(path);
            const requiredKey = partner ? entitlementForPath(path) : null;
            const locked = partner && requiredKey ? !hasEntitlement(partner.id, requiredKey) : false;
            return (
              <button
                key={path}
                onClick={() => navigate(locked ? '/portal/billing' : path)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                  active
                    ? 'bg-amber-500 text-black border-amber-400'
                    : locked
                      ? 'bg-white/[0.03] text-white/35 border-white/10 hover:bg-white/[0.05]'
                      : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
                title={locked ? `${label} (locked)` : label}
              >
                {locked ? <Lock size={14} /> : <Icon size={14} />}
                <span className="inline-flex items-center gap-2">
                  {label}
                  {path === '/portal/tasks' && (openTasks > 0 || unread > 0) && (
                    <span className="inline-flex items-center gap-1">
                      {openTasks > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest ${
                          active ? 'bg-black/20 text-black' : 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                        }`}>
                          {openTasks}
                        </span>
                      )}
                      {unread > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest ${
                          active ? 'bg-black/20 text-black' : 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/20'
                        }`}>
                          {unread}
                        </span>
                      )}
                    </span>
                  )}
                </span>
              </button>
            );
          })}

          <details className="relative">
            <summary
              className={`list-none cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                MORE_LINKS.some((l) => isActivePath(l.path))
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
              title="More"
            >
              More <ChevronDown size={14} />
            </summary>
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-white/10 bg-[#0d1512]/95 backdrop-blur-xl shadow-2xl p-2 z-50">
              {MORE_LINKS.map(({ path, label, icon: Icon }) => {
                const active = isActivePath(path);
                const requiredKey = partner ? entitlementForPath(path) : null;
                const locked = partner && requiredKey ? !hasEntitlement(partner.id, requiredKey) : false;
                return (
                  <button
                    key={path}
                    onClick={() => navigate(locked ? '/portal/billing' : path)}
                    className={`w-full text-left inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                      active
                        ? 'bg-amber-500 text-black'
                        : locked
                          ? 'text-white/35 hover:bg-white/5'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                    title={locked ? `${label} (locked)` : label}
                  >
                    {locked ? <Lock size={14} /> : <Icon size={14} />}
                    {label}
                  </button>
                );
              })}
            </div>
          </details>
        </div>
      </div>
    </nav>
  );
}
