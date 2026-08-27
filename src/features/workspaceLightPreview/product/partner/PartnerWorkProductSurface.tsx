import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CircleHelp,
  Gavel,
  Inbox,
  ListTodo,
  Mail,
  PlayCircle,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listCasesByPartner } from '../../../../data/casesRepo';
import { listDebtByPartner } from '../../../../data/debtRepo';
import { listLettersByPartner } from '../../../../data/lettersRepo';
import { listTasksByPartner } from '../../../../data/tasksRepo';
import { isLetterDraft } from '../../../../lib/letterDraftLifecycle';
import { listPartnerPortalTasks } from '../../../../lib/workVisibility';
import { partnerTaskDeepLink, pickMostOverdueTask } from '../../../../lib/partnerWorkNavigation';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import type { WorkspaceProductAccent, WorkspaceProductStatus } from '../workspaceProductTokens';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import {
  ProductDashboardSkeleton,
  ProductEmptyState,
  ProductStatusPill,
  type ProductMetric,
} from '../components/ProductUi';
import { FINELY_OS_PRIMARY_BTN } from '../../../os/finelyOsLightUi';
import './partnerWorkstationSurfaceTabs.css';

type WorkLane = 'all' | 'tasks' | 'disputes' | 'letters' | 'debt';

type MotionItem = {
  id: string;
  lane: Exclude<WorkLane, 'all'>;
  title: string;
  description: string;
  meta: string;
  href: string;
  priority: number;
  status: WorkspaceProductStatus;
};

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; items: MotionItem[] };

const LANE_LABELS: Record<Exclude<WorkLane, 'all'>, string> = {
  tasks: 'Tasks',
  disputes: 'Disputes',
  letters: 'Letters',
  debt: 'Debt & court',
};

const LANE_ACCENTS: Record<Exclude<WorkLane, 'all'>, WorkspaceProductAccent> = {
  tasks: 'emerald',
  disputes: 'violet',
  letters: 'sky',
  debt: 'rose',
};

function isOpenTaskStatus(status: string): boolean {
  return status === 'pending' || status === 'in_progress';
}

function laneIcon(lane: MotionItem['lane']) {
  switch (lane) {
    case 'debt':
      return ShieldCheck;
    case 'letters':
      return Mail;
    case 'disputes':
      return Gavel;
    default:
      return ListTodo;
  }
}

const DEMO_ITEMS: MotionItem[] = [
  {
    id: 'demo-task-1',
    lane: 'tasks',
    title: 'Upload proof of address',
    description: 'Your specialist needs a current proof of address before round two can mail.',
    meta: 'Overdue · due yesterday',
    href: '/portal/my-tasks',
    priority: 120,
    status: 'needs_action',
  },
  {
    id: 'demo-case-1',
    lane: 'disputes',
    title: 'Equifax late payment dispute',
    description: 'Round two is in motion — response window is active.',
    meta: 'Disputes · day 12 of 30',
    href: '/portal/disputes',
    priority: 95,
    status: 'in_progress',
  },
  {
    id: 'demo-letter-1',
    lane: 'letters',
    title: 'TransUnion factual findings letter',
    description: 'Draft is ready for your review and approval.',
    meta: 'Letters · waiting on you',
    href: '/portal/letters',
    priority: 80,
    status: 'waiting',
  },
  {
    id: 'demo-debt-1',
    lane: 'debt',
    title: 'Midland validation response',
    description: 'Collector notice uploaded — validation deadline is approaching.',
    meta: 'Debt & court · 6 days left',
    href: '/portal/debt',
    priority: 90,
    status: 'needs_action',
  },
];

function WorkCommandDeck({
  items,
  lane,
  onLaneChange,
  laneCounts,
  onOpen,
}: {
  items: MotionItem[];
  lane: WorkLane;
  onLaneChange: (lane: WorkLane) => void;
  laneCounts: Record<Exclude<WorkLane, 'all'>, number>;
  onOpen: (item: MotionItem) => void;
}) {
  const hero = items[0];
  const queue = lane === 'all' ? items : items.filter((item) => item.lane === lane);

  return (
    <section className="fc-wlp-work-command-deck" data-surface-layout="work-river" aria-label="Work river">
      {hero ? (
        <div className="fc-wlp-work-command-hero" data-fcm-accent="rose">
          <div>
            <span className="fc-wlp-work-command-hero-meta">Top priority</span>
            <h2>{hero.title}</h2>
            <p>{hero.description}</p>
            <span className="fc-wlp-work-command-hero-meta">{hero.meta}</span>
          </div>
          <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => onOpen(hero)}>
            Open now <ArrowRight size={15} />
          </button>
        </div>
      ) : null}

      <div className="fc-wlp-work-command-pods" role="tablist" aria-label="Service lanes">
        {(['tasks', 'disputes', 'letters', 'debt'] as const).map((laneId) => {
          const active = lane === laneId;
          return (
            <button
              key={laneId}
              type="button"
              role="tab"
              aria-selected={active}
              className="fc-wlp-work-command-pod"
              data-fcm-accent={LANE_ACCENTS[laneId]}
              data-active={active ? 'true' : undefined}
              onClick={() => onLaneChange(active ? 'all' : laneId)}
            >
              <strong>{laneCounts[laneId]}</strong>
              <em>{LANE_LABELS[laneId]}</em>
              <span>{laneCounts[laneId] ? 'Open in this lane' : 'Nothing open'}</span>
            </button>
          );
        })}
      </div>

      <div className="fc-wlp-work-command-queue">
        <div className="fc-wlp-work-command-queue-head">
          {lane === 'all' ? 'Full work queue' : `${LANE_LABELS[lane]} queue`} · {queue.length} item{queue.length === 1 ? '' : 's'}
        </div>
        {queue.length === 0 ? (
          <div className="p-6 text-base font-bold text-slate-500">Nothing in this lane right now.</div>
        ) : (
          queue.map((item) => {
            const Icon = laneIcon(item.lane);
            return (
              <button
                key={item.id}
                type="button"
                className="fc-wlp-work-command-row"
                data-fcm-accent={LANE_ACCENTS[item.lane]}
                onClick={() => onOpen(item)}
              >
                <span className="fc-wlp-work-command-row-icon" aria-hidden>
                  <Icon size={20} strokeWidth={2.1} />
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                  <em>{item.meta}</em>
                </div>
                <ProductStatusPill status={item.status} />
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

export default function PartnerWorkProductSurface({ role, pageId, partnerId, dataMode }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? Inbox;
  const accent = navItem?.accent ?? 'rose';
  const surfaceMode = navItem?.surfaceMode ?? 'studio';
  const isDemo = dataMode === 'demo' || !partnerId;
  const projectsPath = mapPortalHref('/portal/projects');

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [retryToken, setRetryToken] = useState(0);
  const [lane, setLane] = useState<WorkLane>('all');

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    setState({ status: 'loading' });
    try {
      const tasks = listPartnerPortalTasks(listTasksByPartner(partnerId!)).filter((task) => isOpenTaskStatus(task.status));
      const overdue = pickMostOverdueTask(tasks);
      const cases = listCasesByPartner(partnerId!).filter((item) => item.status === 'open');
      const letters = listLettersByPartner(partnerId!).filter((letter) => isLetterDraft(letter));
      const debt = listDebtByPartner(partnerId!).filter((item) => item.status === 'open' || item.status === 'in_review');

      const items: MotionItem[] = [];
      if (overdue) {
        items.push({
          id: `task-${overdue.id}`,
          lane: 'tasks',
          title: overdue.title,
          description: overdue.notes?.trim() || 'This task is past due and still open.',
          meta: overdue.dueAt ? `Due ${new Date(overdue.dueAt).toLocaleDateString()}` : 'Overdue',
          href: mapPortalHref(partnerTaskDeepLink(overdue)),
          priority: 120,
          status: 'needs_action',
        });
      }
      for (const task of tasks.filter((item) => item.id !== overdue?.id).slice(0, 6)) {
        items.push({
          id: `task-${task.id}`,
          lane: 'tasks',
          title: task.title,
          description: task.notes?.trim() || 'Open work assigned to you.',
          meta: task.dueAt ? `Due ${new Date(task.dueAt).toLocaleDateString()}` : 'No due date',
          href: mapPortalHref(partnerTaskDeepLink(task)),
          priority: task.status === 'in_progress' ? 80 : 65,
          status: task.status === 'in_progress' ? 'in_progress' : 'ready',
        });
      }
      for (const dispute of cases.slice(0, 3)) {
        items.push({
          id: `case-${dispute.id}`,
          lane: 'disputes',
          title: dispute.title || 'Open dispute',
          description: 'A bureau case is still in motion.',
          meta: 'Disputes',
          href: mapPortalHref('/portal/disputes'),
          priority: 90,
          status: 'in_progress',
        });
      }
      for (const letter of letters.slice(0, 3)) {
        items.push({
          id: `letter-${letter.id}`,
          lane: 'letters',
          title: letter.title || 'Draft letter',
          description: 'A letter is waiting to be finished and approved.',
          meta: 'Letters',
          href: mapPortalHref('/portal/letters'),
          priority: 75,
          status: 'waiting',
        });
      }
      for (const item of debt.slice(0, 3)) {
        items.push({
          id: `debt-${item.id}`,
          lane: 'debt',
          title: item.name || 'Open debt matter',
          description: 'Validation or court work is still open.',
          meta: 'Debt & court',
          href: mapPortalHref('/portal/debt'),
          priority: 95,
          status: 'needs_action',
        });
      }
      items.sort((left, right) => right.priority - left.priority);
      if (!cancelled) setState({ status: 'ready', items });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load your work list.';
      if (!cancelled) setState({ status: 'error', message });
    }
    return () => {
      cancelled = true;
    };
  }, [isDemo, mapPortalHref, partnerId, retryToken]);

  const allItems = isDemo ? DEMO_ITEMS : state.status === 'ready' ? state.items : [];

  const laneCounts = useMemo(() => {
    const counts = { tasks: 0, disputes: 0, letters: 0, debt: 0 };
    for (const item of allItems) counts[item.lane] += 1;
    return counts;
  }, [allItems]);

  const nextItem = allItems[0];
  const openItem = (item: MotionItem) => navigate(isDemo ? mapPortalHref(item.href) : item.href);
  const openPrimary = () => {
    if (nextItem) openItem(nextItem);
    else navigate(projectsPath);
  };

  const askFinelyPrompt = 'What should I work on first across all my services?';
  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button type="button" onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: navItem?.label ?? 'Work' })}>
        <CircleHelp size={15} /> Ask Finely
      </button>
      <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
        <PlayCircle size={15} /> Watch how
      </button>
    </div>
  );

  const overdueCount = allItems.filter((item) => item.status === 'needs_action').length;
  const metrics: ProductMetric[] = [
    { label: 'In motion', value: allItems.length, hint: 'Open items across services', accent: 'rose', icon: Inbox, onClick: openPrimary },
    { label: 'Needs you', value: overdueCount, hint: 'Highest-priority first', accent: 'violet', icon: AlertTriangle, onClick: openPrimary },
    { label: 'Projects', value: 'Hub', hint: 'Full project board', accent: 'sky', icon: ListTodo, onClick: () => navigate(projectsPath) },
    { label: 'My tasks', value: 'Queue', hint: 'Your personal list', accent: 'emerald', icon: ListTodo, onClick: () => navigate(mapPortalHref('/portal/my-tasks')) },
  ];

  const guideTitle = nextItem
    ? nextItem.status === 'needs_action'
      ? 'Clear the overdue item first'
      : 'Open the top item on your deck'
    : 'Nothing is in motion yet';
  const guideDescription = nextItem
    ? `${nextItem.title} — ${nextItem.description}`
    : 'When your specialist assigns a task, or a dispute, letter, or debt item opens, it will land here first.';
  const guideSteps = nextItem
    ? ['Open the featured step below.', 'Finish what it asks for.', 'Return here for the next priority.']
    : ['Open your projects hub.', 'Check disputes and letters for drafts.', 'Ask Finely if you are unsure what is next.'];

  const deckBody =
    isDemo && !allItems.length ? (
      <ProductEmptyState
        title="Sign in to see live work"
        description="Your overdue tasks, open disputes, draft letters, and debt items land here in priority order."
        action={<button type="button" className="fc-wlp-btn-primary" onClick={() => navigate('/login')}>Sign in</button>}
      />
    ) : allItems.length ? (
      <WorkCommandDeck items={allItems} lane={lane} onLaneChange={setLane} laneCounts={laneCounts} onOpen={openItem} />
    ) : (
      <ProductEmptyState
        title="Nothing is in motion yet"
        description="When your specialist assigns a task, or a dispute, letter, or debt item opens, it will land here first."
        action={<button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(projectsPath)}>Open projects</button>}
      />
    );

  if (!isDemo && state.status === 'loading') return <ProductDashboardSkeleton label="Loading your work" />;

  if (!isDemo && state.status === 'error') {
    return (
      <ProductHubScaffold
        role={role}
        eyebrow="Work"
        title="Everything in motion across all your services, in one list."
        description="The single most urgent item stays first."
        status="Could not load work"
        freshness="just now"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        primaryAction={<ProductPagePrimaryAction label="Try again" onClick={() => setRetryToken((current) => current + 1)} />}
      >
        <section className="fc-wlp-section">
          <ProductEmptyState
            title="We couldn't load your work"
            description={state.message}
            action={<button type="button" className="fc-wlp-btn-primary" onClick={() => setRetryToken((current) => current + 1)}>Try again</button>}
          />
        </section>
      </ProductHubScaffold>
    );
  }

  return (
    <ProductHubScaffold
      role={role}
      eyebrow="Work"
      title="Everything in motion across all your services, in one list."
      description="The single most urgent item stays first. Open it, finish it, then the next one rises."
      status={nextItem ? nextItem.title : 'Nothing overdue right now'}
      freshness={isDemo ? 'demo snapshot' : 'live'}
      accent={accent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      metricsVariant="inline"
      primaryAction={
        <ProductPagePrimaryAction label={nextItem ? nextItem.title : 'Open your projects'} onClick={openPrimary} />
      }
      metrics={metrics}
    >
      <section className="fc-wlp-section">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>{deckBody}</div>
          <aside className="fc-wlp-page-guide lg:sticky lg:top-4">
            <div className="fc-wlp-page-guide-icon">
              <PageIcon size={22} strokeWidth={2.05} />
            </div>
            <div className="fc-wlp-eyebrow">What to do next</div>
            <h2>{guideTitle}</h2>
            <p>{guideDescription}</p>
            <ol>
              {guideSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            {guideActions}
          </aside>
        </div>
      </section>
      <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
    </ProductHubScaffold>
  );
}
