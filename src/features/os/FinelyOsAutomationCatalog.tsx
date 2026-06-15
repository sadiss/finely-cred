import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  FolderKanban,
  GitBranch,
  Inbox,
  LayoutGrid,
  Mail,
  Sparkles,
  Target,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';
import {
  FINELY_OS_CATALOG_SHELL,
  FINELY_OS_ENTITY_ACCENT_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsKpiTile,
} from '../os/finelyOsLightUi';

type AutomationLink = {
  to: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  group: 'work' | 'crm' | 'ops';
};

const LINKS: AutomationLink[] = [
  { to: '/admin/projects', label: 'Projects hub', hint: 'Journey boards + list', icon: LayoutGrid, group: 'work' },
  { to: '/admin/projects/portfolio', label: 'Portfolio', hint: 'SLA + health', icon: FolderKanban, group: 'work' },
  { to: '/admin/playbooks', label: 'Playbook library', hint: '400+ catalog tasks', icon: Sparkles, group: 'work' },
  { to: '/admin/projects/templates', label: 'Project templates', hint: 'Package → project', icon: Workflow, group: 'work' },
  { to: '/admin/workload', label: 'Workload', hint: 'Assignee capacity', icon: Users, group: 'work' },
  { to: '/admin/my-tasks', label: 'My tasks', hint: 'Cross-project queue', icon: Zap, group: 'work' },
  { to: '/admin/crm', label: 'CRM workspace', hint: 'Pipeline + convert', icon: Target, group: 'crm' },
  { to: '/admin/crm/sequences', label: 'CRM sequences', hint: 'Wait → email → task', icon: Mail, group: 'crm' },
  { to: '/admin/crm/routing', label: 'Routing rules', hint: 'Auto-assign leads', icon: GitBranch, group: 'crm' },
  { to: '/admin/crm/referrals', label: 'Referrals', hint: 'Attribution analytics', icon: Target, group: 'crm' },
  { to: '/admin/workflow', label: 'Ops inbox', hint: 'Briefing + SLA triage', icon: Inbox, group: 'ops' },
  { to: '/admin/automations', label: 'Automations', hint: 'Rules + triggers', icon: Zap, group: 'ops' },
];

const GROUP_LABEL: Record<AutomationLink['group'], string> = {
  work: 'Work OS',
  crm: 'CRM OS',
  ops: 'Unified ops',
};

export function FinelyOsAutomationCatalog({ compact }: { compact?: boolean }) {
  const grouped = useMemo(() => {
    const map = new Map<AutomationLink['group'], AutomationLink[]>();
    for (const link of LINKS) {
      const list = map.get(link.group) ?? [];
      list.push(link);
      map.set(link.group, list);
    }
    return Array.from(map.entries());
  }, []);

  if (compact) {
    return <FinelyOsAutomationStripLegacy />;
  }

  return (
    <div className={FINELY_OS_CATALOG_SHELL}>
      <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-3`}>Finely OS 400% — automation catalog</div>
      <div className="space-y-4">
        {grouped.map(([group, links]) => (
          <section key={group}>
            <h3 className={`${FINELY_OS_ENTITY_SUBLABEL} mb-2`}>{GROUP_LABEL[group]}</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {links.map((item, i) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`block transition-all hover:shadow-md ${finelyOsKpiTile(i)} p-3`}
                  >
                    <Icon size={16} className="text-violet-400 mb-1" />
                    <div className={`text-sm ${FINELY_OS_ENTITY_VALUE}`}>{item.label}</div>
                    <div className={`text-[10px] mt-0.5 ${FINELY_OS_ENTITY_BODY}`}>{item.hint}</div>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase mt-2 ${FINELY_OS_ENTITY_ACCENT_LINK} no-underline`}>
                      Open <ArrowRight size={10} />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <p className={`mt-3 text-xs ${FINELY_OS_ENTITY_BODY}`}>
        Playbook chains, recurring tags, CRM sequences, and SLA escalations run cross-linked — complete a chained task to spawn the next step automatically.
      </p>
    </div>
  );
}

/** Compact strip used on playbooks page and legacy embeds. */
function FinelyOsAutomationStripLegacy() {
  return (
    <div className={FINELY_OS_CATALOG_SHELL}>
      <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-3`}>Finely OS 400% — quick links</div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {LINKS.slice(0, 5).map((item, i) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`block transition-all hover:shadow-md ${finelyOsKpiTile(i)} p-3`}
            >
              <Icon size={16} className="text-emerald-400 mb-1" />
              <div className={`text-sm ${FINELY_OS_ENTITY_VALUE}`}>{item.label}</div>
              <div className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>{item.hint}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function FinelyOsAutomationStrip() {
  return <FinelyOsAutomationStripLegacy />;
}
