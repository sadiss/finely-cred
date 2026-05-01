import React, { useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  BookOpen,
  Bot,
  BarChart3,
  ChevronDown,
  CreditCard,
  FileText,
  FlaskConical,
  Gavel,
  Globe,
  GraduationCap,
  Library,
  Layout,
  Package,
  Mail,
  PiggyBank,
  Settings,
  Shield,
  Trophy,
  Users,
  UserCog,
  Crown,
  Sparkles,
  Film,
  BriefcaseBusiness,
  Lock,
  FolderKanban,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

type NavIcon = React.ComponentType<{ size?: number; className?: string }>;
type NavItem = { path: string; label: string; icon: NavIcon; hint?: string };
type NavGroup = { label: string; items: NavItem[] };

const GROUPS: NavGroup[] = [
  {
    label: 'Core',
    items: [
      { path: '/admin', label: 'Overview', icon: Shield, hint: 'Admin dashboard' },
      { path: '/admin/workflow', label: 'Workflow Queue', icon: Bell, hint: 'Unread + open tasks' },
      { path: '/admin/partners', label: 'Partners', icon: Users, hint: 'Client management' },
      { path: '/admin/cases', label: 'Cases', icon: Gavel, hint: 'Case management' },
      // Task creation is unified into Projects/Project Board/Partner pages.
    ],
  },
  {
    label: 'Comms & Content',
    items: [
      { path: '/admin/comms', label: 'Comms Studio', icon: Mail, hint: 'Templates + delivery' },
      { path: '/admin/resources', label: 'Resources', icon: Library, hint: 'Public guides' },
      { path: '/admin/courses', label: 'Courses', icon: GraduationCap, hint: 'Course builder' },
      { path: '/admin/testimonials', label: 'Testimonials', icon: Trophy, hint: 'Social proof' },
    ],
  },
  {
    label: 'Automation & AI',
    items: [
      { path: '/admin/automations', label: 'Automation Studio', icon: Bot, hint: 'Run automations' },
      { path: '/admin/ops-agent', label: 'Ops Agent', icon: Crown, hint: 'Daily priorities' },
      { path: '/admin/lead-intel', label: 'Lead Intel', icon: Sparkles, hint: 'Prospect enrichment' },
      { path: '/admin/media-studio', label: 'Media Studio', icon: Film, hint: 'Generate assets' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { path: '/admin/access', label: 'Control Center', icon: Shield, hint: 'Access + settings + roles' },
      { path: '/admin/team', label: 'Team & Roles', icon: UserCog, hint: 'RBAC-lite' },
      { path: '/admin/tenants', label: 'Tenants', icon: Globe, hint: 'White-label' },
      { path: '/admin/billing', label: 'Billing', icon: CreditCard, hint: 'Payments' },
      { path: '/admin/finance', label: 'Finance', icon: PiggyBank, hint: 'Allocator' },
      { path: '/admin/vendors', label: 'Vendors', icon: Users, hint: 'Vendor catalog (tiers)' },
      { path: '/admin/products', label: 'Products', icon: Package, hint: 'Catalog audit' },
      { path: '/admin/cms', label: 'CMS', icon: Layout, hint: 'Content ops' },
      { path: '/admin/analytics', label: 'Analytics', icon: BarChart3, hint: 'Ops snapshot' },
      { path: '/admin/monitoring', label: 'Monitoring', icon: Activity, hint: 'Telemetry' },
      { path: '/admin/nora-capital', label: 'Nora Capital', icon: BriefcaseBusiness, hint: 'Integration' },
      { path: '/admin/vault', label: 'Vault', icon: Lock, hint: 'Restricted' },
      { path: '/admin/parsing-lab', label: 'Parsing Lab', icon: FlaskConical, hint: 'Regression harness' },
      { path: '/admin/settings', label: 'Settings', icon: Settings, hint: 'System settings' },
    ],
  },
];

function isActivePath(pathname: string, path: string) {
  if (pathname === path) return true;
  if (path === '/admin') return pathname === '/admin' || pathname === '/admin/';
  return pathname.startsWith(path + '/');
}

export function AdminNavBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const flat = useMemo(() => GROUPS.flatMap((g) => g.items), []);

  return (
    <div className="lg:hidden mb-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full fc-action-chip fc-focus-ring justify-between"
        title="Open admin navigation"
      >
        <span className="inline-flex items-center gap-2">
          <Shield size={14} className="text-amber-300" />
          Admin navigation
        </span>
        <span className="text-white/50 text-xs font-mono">{open ? 'hide' : 'show'}</span>
      </button>
      {open ? (
        <div className="mt-3 -mx-2 overflow-x-auto">
          <div className="flex gap-2 min-w-max px-2 pb-2">
            {flat.map((x) => {
              const active = isActivePath(pathname, x.path);
              const Icon = x.icon;
              return (
                <button
                  key={x.path}
                  type="button"
                  onClick={() => {
                    navigate(x.path);
                    setOpen(false);
                  }}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                    active
                      ? 'bg-amber-500 text-black border-amber-400'
                      : 'bg-white/5 text-white/75 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
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
    </div>
  );
}

export function AdminNavRail() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [query, setQuery] = useState('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GROUPS;
    return GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((i) => `${i.label} ${i.hint || ''} ${i.path}`.toLowerCase().includes(q)),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  const searching = Boolean(query.trim());

  return (
    <aside className="hidden lg:block sticky top-24 self-start">
      <div className="relative rounded-[34px] border border-white/10 bg-[#070b09]/92 backdrop-blur-2xl p-4 flex flex-col gap-4 max-h-[calc(100vh-7rem)] shadow-2xl shadow-black/40 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-black/35" />
          <div
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-[780px] h-[360px] blur-3xl opacity-40"
            style={{
              background: 'radial-gradient(ellipse at 50% 50%, rgba(245,158,11,0.22) 0%, transparent 62%)',
            }}
          />
        </div>

        <div className="relative px-2">
          <div className="text-[10px] uppercase tracking-[0.35em] text-white/50 font-black">Admin</div>
          <div className="mt-2 text-white font-semibold text-sm">Operate the platform</div>
          <div className="mt-1 text-[11px] text-white/55">Fast navigation • search • ops modules</div>
        </div>

        <div className="relative px-2">
          <div className="text-[10px] uppercase tracking-widest text-white/40">Search</div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Partners, cases, settings…"
            className="mt-2 fc-input text-[11px]"
          />
        </div>

        <div className="relative overflow-y-auto pr-1 fc-scroll-area">
          <div className="space-y-3">
            {groups.map((g) => {
              const hasActive = g.items.some((x) => isActivePath(pathname, x.path));
              const initialOpen = hasActive || g.label === 'Core';
              const isOpen = openGroups[g.label] ?? initialOpen;

              const items = (
                <div className="px-2 pb-2 space-y-1">
                  {g.items.map((x) => {
                    const active = isActivePath(pathname, x.path);
                    const Icon = x.icon;
                    return (
                      <button
                        key={x.path}
                        type="button"
                        onClick={() => navigate(x.path)}
                        className={`w-full text-left inline-flex items-center gap-3 px-3 py-2.5 rounded-2xl border transition-all ${
                          active
                            ? 'bg-amber-500/15 text-amber-200 border-amber-500/30'
                            : 'bg-black/20 text-white/75 border-white/10 hover:bg-white/[0.05] hover:text-white hover:border-white/15'
                        }`}
                        title={x.hint || x.label}
                      >
                        <Icon size={16} className={active ? 'text-amber-300' : 'text-white/60'} />
                        <div className="min-w-0">
                          <div className="text-[11px] font-black uppercase tracking-widest truncate">{x.label}</div>
                          {x.hint ? <div className="text-[11px] text-white/45 truncate">{x.hint}</div> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );

              // While searching, keep nav groups visually expanded (no nested click targets hidden).
              if (searching) {
                return (
                  <div key={g.label} className="rounded-2xl border border-white/10 bg-black/20">
                    <div className="px-3 py-2.5 flex items-center justify-between gap-3">
                      <div className="text-[10px] uppercase tracking-[0.34em] text-white/55 font-black">{g.label}</div>
                      <div className="px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.02] text-[10px] font-black uppercase tracking-widest text-white/60">
                        {g.items.length}
                      </div>
                    </div>
                    {items}
                  </div>
                );
              }

              return (
                <details
                  key={g.label}
                  className="group rounded-2xl border border-white/10 bg-black/20"
                  open={isOpen}
                  onToggle={(e) => {
                    const next = (e.currentTarget as HTMLDetailsElement).open;
                    setOpenGroups((cur) => ({ ...cur, [g.label]: next }));
                  }}
                >
                  <summary className="fc-focus-ring list-none cursor-pointer px-3 py-2.5 rounded-2xl flex items-center justify-between gap-3 hover:bg-white/[0.05] transition-colors [&::-webkit-details-marker]:hidden">
                    <div className="text-[10px] uppercase tracking-[0.34em] text-white/55 font-black">{g.label}</div>
                    <div className="inline-flex items-center gap-2">
                      <div className="px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.02] text-[10px] font-black uppercase tracking-widest text-white/60">
                        {g.items.length}
                      </div>
                      <ChevronDown size={14} className="text-white/40 transition-transform group-open:rotate-180" />
                    </div>
                  </summary>
                  {items}
                </details>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}

