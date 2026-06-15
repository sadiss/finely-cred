import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Inbox, ListChecks, Search, Sparkles, Target, X } from 'lucide-react';
import { usePartnerSession } from '../../../auth/PartnerSessionContext';
import { listProjects, listProjectsByPartner } from '../../../data/projectsRepo';
import { listCrmRecords } from '../../../data/crmRecordsRepo';
import { crmRecordDisplayName } from '../../../domain/crmRecords';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
  finelyOsGlassShell,
  finelyOsModuleAccentText,
} from '../../os/finelyOsLightUi';

type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  href: string;
  group: string;
};

type PaletteScope = 'admin' | 'portal';

const ADMIN_NAV_COMMANDS: CommandItem[] = [
  { id: 'nav_my_tasks', label: 'My tasks', href: '/admin/my-tasks', group: 'Navigate' },
  { id: 'nav_inbox', label: 'Ops Inbox', hint: 'Daily triage', href: '/admin/workflow', group: 'Navigate' },
  { id: 'nav_projects', label: 'Projects & Tasks', href: '/admin/projects', group: 'Navigate' },
  { id: 'nav_workload', label: 'Workload view', href: '/admin/workload', group: 'Navigate' },
  { id: 'nav_crm', label: 'CRM workspace', href: '/admin/crm', group: 'Navigate' },
  { id: 'nav_crm_risk', label: 'CRM — Work at risk', hint: 'Idle + SLA', href: '/admin/crm?smartList=work_at_risk', group: 'Navigate' },
  { id: 'nav_crm_referrals', label: 'CRM — Referrals', hint: 'Attribution analytics', href: '/admin/crm/referrals', group: 'Navigate' },
  { id: 'nav_crm_routing', label: 'CRM — Routing rules', hint: 'Auto-assign leads', href: '/admin/crm/routing', group: 'Navigate' },
  { id: 'nav_playbooks', label: 'Playbook library', href: '/admin/playbooks', group: 'Navigate' },
  { id: 'nav_templates', label: 'Project templates', href: '/admin/projects/templates', group: 'Navigate' },
  { id: 'nav_portfolio', label: 'Portfolio dashboard', href: '/admin/projects/portfolio', group: 'Navigate' },
  { id: 'nav_crm_seq', label: 'CRM sequences', href: '/admin/crm/sequences', group: 'Navigate' },
  { id: 'nav_partners', label: 'Partners', href: '/admin/partners', group: 'Navigate' },
];

const PORTAL_NAV_COMMANDS: CommandItem[] = [
  { id: 'p_dash', label: 'Partner dashboard', href: '/portal/dashboard', group: 'Navigate' },
  { id: 'p_tasks', label: 'My tasks', hint: 'Work OS', href: '/portal/my-tasks', group: 'Navigate' },
  { id: 'p_projects', label: 'Projects', href: '/portal/projects', group: 'Navigate' },
  { id: 'p_disputes', label: 'Dispute center', href: '/portal/disputes', group: 'Navigate' },
  { id: 'p_letters', label: 'Letters studio', href: '/portal/letters', group: 'Navigate' },
  { id: 'p_reports', label: 'Credit reports', href: '/portal/reports', group: 'Navigate' },
  { id: 'p_hub', label: 'Communication hub', href: '/portal/messages', group: 'Navigate' },
  { id: 'p_calendar', label: 'Calendar & sessions', href: '/portal/calendar', group: 'Navigate' },
  { id: 'p_documents', label: 'Document vault', href: '/portal/documents', group: 'Navigate' },
  { id: 'p_debt', label: 'Debt legal center', href: '/portal/debt', group: 'Navigate' },
  { id: 'p_courses', label: 'Courses & education', href: '/portal/courses', group: 'Navigate' },
];

const ADMIN_SHORTCUTS: Array<{ key: string; href: string }> = [
  { key: 'o', href: '/admin/workflow' },
  { key: 'p', href: '/admin/projects' },
  { key: 'c', href: '/admin/crm' },
  { key: 't', href: '/admin/my-tasks' },
];

const PORTAL_SHORTCUTS: Array<{ key: string; href: string }> = [
  { key: 't', href: '/portal/my-tasks' },
  { key: 'p', href: '/portal/projects' },
  { key: 'h', href: '/portal/messages' },
  { key: 'l', href: '/portal/letters' },
  { key: 'd', href: '/portal/disputes' },
];

export function WorkCommandPalette({
  scope = 'admin',
  partnerId,
}: {
  scope?: PaletteScope;
  partnerId?: string;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const isPortal = scope === 'portal';

  useEffect(() => {
    const shortcuts = isPortal ? PORTAL_SHORTCUTS : ADMIN_SHORTCUTS;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
        setQuery('');
        return;
      }
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.shiftKey && !open) {
        const key = e.key.toLowerCase();
        const hit = shortcuts.find((s) => s.key === key);
        if (hit) {
          e.preventDefault();
          navigate(hit.href);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, open, isPortal]);

  const items = useMemo(() => {
    const nav = isPortal ? PORTAL_NAV_COMMANDS : ADMIN_NAV_COMMANDS;
    const dynamic: CommandItem[] = [];
    const projects = isPortal && partnerId ? listProjectsByPartner(partnerId) : listProjects();
    for (const p of projects.slice(0, 15)) {
      dynamic.push({
        id: `proj_${p.id}`,
        label: p.title,
        hint: p.stage,
        href: isPortal ? `/portal/projects/${p.id}` : `/admin/projects/${p.id}`,
        group: 'Projects',
      });
    }
    if (!isPortal) {
      for (const r of listCrmRecords().slice(0, 10)) {
        dynamic.push({
          id: r.id,
          label: crmRecordDisplayName(r),
          hint: r.stage,
          href: `/admin/crm/records/${encodeURIComponent(r.id)}`,
          group: 'CRM',
        });
      }
    }
    return [...nav, ...dynamic];
  }, [open, isPortal, partnerId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 12);
    return items.filter((i) => i.label.toLowerCase().includes(q) || i.hint?.toLowerCase().includes(q)).slice(0, 12);
  }, [items, query]);

  if (!open) return null;

  const iconFor = (group: string) => {
    if (group === 'CRM') return Target;
    if (group === 'Projects') return FolderKanban;
    if (group === 'Navigate' && filtered[0]?.href.includes('workflow')) return Inbox;
    return Sparkles;
  };

  const shortcutHints = isPortal ? (
    <>
      <span>Ctrl+Shift+T tasks</span>
      <span>Ctrl+Shift+P projects</span>
      <span>Ctrl+Shift+H hub</span>
      <span>Ctrl+Shift+L letters</span>
      <span>Ctrl+Shift+D disputes</span>
    </>
  ) : (
    <>
      <span>Ctrl+Shift+O inbox</span>
      <span>Ctrl+Shift+P projects</span>
      <span>Ctrl+Shift+C CRM</span>
      <span>Ctrl+Shift+T my tasks</span>
    </>
  );

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[12vh] px-4 bg-fc-chrome/90 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div
        className={`w-full max-w-lg shadow-2xl overflow-hidden ${finelyOsGlassShell('panel', 'violet')}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center gap-2 border-b border-white/[0.08] px-4 py-3 ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
          <Search size={16} className="text-violet-300" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isPortal ? 'Jump to portal page or project…' : 'Jump to project, CRM record, or page…'}
            className={`flex-1 text-sm outline-none bg-transparent ${FINELY_OS_ENTITY_VALUE} placeholder:text-white/35`}
          />
          <button type="button" onClick={() => setOpen(false)} className="text-white/45 hover:text-white/80">
            <X size={16} />
          </button>
        </div>
        <ul className="max-h-[360px] overflow-y-auto py-2">
          {filtered.map((item, i) => {
            const Icon = iconFor(item.group);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    navigate(item.href);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.04] transition-colors"
                >
                  <Icon size={16} className={`${finelyOsModuleAccentText(i)} shrink-0`} />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm truncate ${FINELY_OS_ENTITY_VALUE}`}>{item.label}</span>
                    <span className={`block text-[10px] uppercase tracking-wider ${FINELY_OS_ENTITY_SUBLABEL}`}>{item.group}{item.hint ? ` • ${item.hint}` : ''}</span>
                  </span>
                </button>
              </li>
            );
          })}
          {!filtered.length ? <li className={`px-4 py-6 text-sm text-center ${FINELY_OS_ENTITY_BODY}`}>No matches</li> : null}
        </ul>
        <div className={`border-t border-white/[0.08] px-4 py-2 text-[10px] flex flex-wrap items-center gap-x-3 gap-y-1 ${FINELY_OS_ENTITY_BODY}`}>
          <span className="inline-flex items-center gap-1"><ListChecks size={12} /> Ctrl+K palette</span>
          {shortcutHints}
        </div>
      </div>
    </div>
  );
}

export function AdminCommandPaletteHost() {
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  if (!path.startsWith('/admin')) return null;
  return <WorkCommandPalette scope="admin" />;
}

export function PortalCommandPaletteHost() {
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const { partner } = usePartnerSession();
  if (!path.startsWith('/portal')) return null;
  return <WorkCommandPalette scope="portal" partnerId={partner?.id} />;
}
