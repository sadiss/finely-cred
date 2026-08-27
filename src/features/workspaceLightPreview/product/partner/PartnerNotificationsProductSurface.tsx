import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CheckCheck,
  CircleHelp,
  Inbox,
  PlayCircle,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../auth/AuthProvider';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import {
  listNotifications,
  markAllRead,
  markNotificationRead,
  unreadCount,
} from '../../../../data/notificationsRepo';
import { getNotificationPrefs, upsertNotificationPrefs } from '../../../../data/notificationPrefsRepo';
import type { AppNotification } from '../../../../domain/notifications';
import {
  buildNotificationDigest,
  formatDigestSummary,
  type NotificationDigest,
} from '../../../../lib/notificationDigestEngine';
import {
  notificationActionPath,
  pickHighestPriorityUnreadNotification,
} from '../../../../lib/notificationNavigation';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import type { ProductCollectionItem } from '../components/ProductCollectionSurface';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import { finelyOsCatalogCard } from '../../../os/finelyOsLightUi';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import './partnerWorkstationSurfaceTabs.css';

const METRICS_VARIANT = 'inline' as const;
const MUTE_KINDS = [
  'task',
  'trial',
  'purchase',
  'support',
  'letters',
  'nurture_education',
  'nurture_opportunity',
  'nurture_birthday',
] as const;

const RIVER_ACCENTS = ['violet', 'emerald', 'sky', 'rose'] as const;

function formatFreshness(iso?: string): string {
  if (!iso) return 'no alerts yet';
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'just now';
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return mins <= 1 ? 'just now' : `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months <= 1 ? '1 month ago' : `${months} months ago`;
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function riverAccentForKind(kind: string, index: number) {
  if (kind.includes('letter')) return 'rose';
  if (kind.includes('task')) return 'emerald';
  if (kind.includes('calendar')) return 'sky';
  return RIVER_ACCENTS[index % RIVER_ACCENTS.length];
}

function AlertRiverCard({
  title,
  body,
  meta,
  accent,
  read,
  onOpen,
}: {
  title: string;
  body?: string;
  meta: string;
  accent: string;
  read?: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      className="fc-wlp-alert-river-card"
      data-fcm-accent={accent}
      data-read={read ? 'true' : undefined}
      onClick={onOpen}
    >
      <strong>{title}</strong>
      {body ? <p>{body}</p> : null}
      <em>{meta}</em>
    </button>
  );
}

function AlertRiverRow({
  accent,
  children,
  isLast,
}: {
  accent: string;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div className="fc-wlp-alert-river-row">
      <div className="fc-wlp-alert-river-rail" aria-hidden>
        <span className="fc-wlp-alert-river-dot" data-fcm-accent={accent} />
        {!isLast ? <span className="fc-wlp-alert-river-line" data-fcm-accent={accent} /> : null}
      </div>
      {children}
    </div>
  );
}

function PreferencesPanel({
  prefs,
  mutedKinds,
  onToggleEmail,
  onToggleMute,
  onClose,
}: {
  prefs: ReturnType<typeof getNotificationPrefs>;
  mutedKinds: string[];
  onToggleEmail: (key: 'emailInstantMessages' | 'emailDigest' | 'emailLetterLifecycle' | 'emailMeetingReminders') => void;
  onToggleMute: (kind: string) => void;
  onClose: () => void;
}) {
  return (
    <aside className="fc-wlp-alert-river-prefs" data-fcm-accent="sky">
      <div className="flex items-start justify-between gap-3">
        <h3>Alert preferences</h3>
        <button type="button" className="fc-wlp-btn-secondary" onClick={onClose} aria-label="Close preferences">
          <X size={14} />
        </button>
      </div>
      <p className="mt-3 text-base font-semibold text-slate-600">
        Choose which alerts reach you in-app and by email. Muted categories stay out of your river.
      </p>
      <div className="mt-5">
        <div className="fc-wlp-eyebrow">Email delivery</div>
        <div className="fc-wlp-notifications-prefs mt-3">
          <button
            type="button"
            className="fc-wlp-notifications-pref-chip"
            data-muted={prefs.emailInstantMessages ? undefined : 'true'}
            onClick={() => onToggleEmail('emailInstantMessages')}
          >
            Instant message emails
          </button>
          <button
            type="button"
            className="fc-wlp-notifications-pref-chip"
            data-muted={prefs.emailDigest ? undefined : 'true'}
            onClick={() => onToggleEmail('emailDigest')}
          >
            Daily email digest
          </button>
          <button
            type="button"
            className="fc-wlp-notifications-pref-chip"
            data-muted={prefs.emailLetterLifecycle !== false ? undefined : 'true'}
            onClick={() => onToggleEmail('emailLetterLifecycle')}
          >
            Letter lifecycle emails
          </button>
          <button
            type="button"
            className="fc-wlp-notifications-pref-chip"
            data-muted={prefs.emailMeetingReminders !== false ? undefined : 'true'}
            onClick={() => onToggleEmail('emailMeetingReminders')}
          >
            Meeting reminder emails
          </button>
        </div>
      </div>
      <div className="mt-6">
        <div className="fc-wlp-eyebrow">Mute in-app categories</div>
        <div className="fc-wlp-notifications-prefs mt-3">
          {MUTE_KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              className="fc-wlp-notifications-pref-chip"
              data-muted={mutedKinds.includes(kind) ? 'true' : undefined}
              onClick={() => onToggleMute(kind)}
            >
              {kind.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default function PartnerNotificationsProductSurface({
  role,
  pageId,
  partnerId,
  dataMode,
}: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const auth = useAuth();
  const { partner: sessionPartner } = usePartnerSession();
  const partner = partnerId ? sessionPartner?.id === partnerId ? sessionPartner : sessionPartner : sessionPartner;
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? Bell;
  const accent = navItem?.accent ?? 'violet';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const isDemo = dataMode === 'demo' || !partnerId;

  const [version, setVersion] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [prefsOpen, setPrefsOpen] = useState(false);

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', bump as EventListener);
    window.addEventListener('finely:platform-event', bump as EventListener);
    return () => {
      window.removeEventListener('finely:store', bump as EventListener);
      window.removeEventListener('finely:platform-event', bump as EventListener);
    };
  }, []);

  const items = useMemo(
    () =>
      isDemo
        ? []
        : listNotifications({
            partnerId: partner?.id,
            audience: 'partner',
            unreadOnly: filter === 'unread',
            limit: 100,
          }),
    [filter, isDemo, partner?.id, version],
  );

  const unread = useMemo(
    () => (isDemo ? 2 : unreadCount({ partnerId: partner?.id, audience: 'partner' })),
    [isDemo, partner?.id, version],
  );

  const demoDigest: NotificationDigest = {
    at: new Date().toISOString(),
    audience: 'partner',
    total: 4,
    unread: 2,
    byKind: { letters: 2, task: 1, calendar_scheduled: 1 },
    highlights: ['Two letters are ready to mail'],
  };

  const digest = useMemo(
    () =>
      isDemo
        ? demoDigest
        : buildNotificationDigest({ audience: 'partner', partnerId: partner?.id }),
    [isDemo, partner?.id, version],
  );

  const prefs = useMemo(
    () => getNotificationPrefs({ partnerId: partner?.id, userId: auth.user?.id }),
    [auth.user?.id, partner?.id, version],
  );

  const mutedKinds = prefs.mutedKinds ?? [];
  const priorityUnread = useMemo(() => pickHighestPriorityUnreadNotification(items), [items]);
  const latestActivity = items[0]?.createdAt;

  function openNotification(n: AppNotification) {
    markNotificationRead(n.id);
    setVersion((v) => v + 1);
    const path = notificationActionPath(n);
    if (path) navigate(mapPortalHref(path));
  }

  function toggleMute(kind: string) {
    const next = mutedKinds.includes(kind) ? mutedKinds.filter((k) => k !== kind) : [...mutedKinds, kind];
    upsertNotificationPrefs({ ...prefs, mutedKinds: next });
    setVersion((v) => v + 1);
  }

  function toggleEmailPref(key: 'emailInstantMessages' | 'emailDigest' | 'emailLetterLifecycle' | 'emailMeetingReminders') {
    const current = prefs[key];
    const nextValue = key === 'emailLetterLifecycle' || key === 'emailMeetingReminders' ? current === false : !current;
    upsertNotificationPrefs({ ...prefs, [key]: nextValue });
    setVersion((v) => v + 1);
  }

  const askFinelyPrompt = 'Which notification should I handle first?';

  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button
        type="button"
        onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: navItem?.label ?? 'Notifications' })}
      >
        <CircleHelp size={15} /> Ask Finely
      </button>
      <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
        <PlayCircle size={15} /> Watch how
      </button>
    </div>
  );

  const demoCollectionItems: ProductCollectionItem[] = [
    {
      id: 'demo-1',
      title: 'Two letters are ready to mail',
      description: 'Equifax and TransUnion packages passed review — open to print and send.',
      meta: '12 minutes ago',
      status: 'needs_action',
      statusLabel: 'Unread',
      accent: 'rose',
      icon: Bell,
      tags: ['letters'],
      priority: 95,
      actionLabel: 'Open letters',
      onOpen: () => navigate(mapPortalHref('/portal/letters')),
    },
    {
      id: 'demo-2',
      title: 'Session confirmed for Tuesday',
      description: 'Your strategy call is on the calendar — review the agenda before you join.',
      meta: '2 hours ago',
      status: 'needs_action',
      statusLabel: 'Unread',
      accent: 'sky',
      icon: Bell,
      tags: ['calendar'],
      priority: 80,
      actionLabel: 'Open calendar',
      onOpen: () => navigate(mapPortalHref('/portal/calendar')),
    },
    {
      id: 'demo-3',
      title: 'Task due tomorrow',
      description: 'Upload your latest bank statement for the funding readiness review.',
      meta: 'Yesterday',
      status: 'complete',
      accent: 'emerald',
      icon: Bell,
      tags: ['task'],
      priority: 40,
      actionLabel: 'Open task',
      onOpen: () => navigate(mapPortalHref('/portal/my-tasks')),
    },
  ];

  const metrics: ProductMetric[] = [
    {
      label: 'Unread',
      value: unread,
      hint: unread ? 'Need your attention' : 'All caught up',
      accent: 'rose',
      icon: Bell,
      onClick: () => setFilter('unread'),
    },
    {
      label: 'Today',
      value: isDemo ? 4 : digest.total,
      hint: formatDigestSummary(digest),
      accent: 'emerald',
      icon: Sparkles,
    },
    {
      label: 'Muted',
      value: mutedKinds.length,
      hint: mutedKinds.length ? 'Categories silenced' : 'Nothing muted',
      accent: 'sky',
      icon: Settings,
      onClick: () => setPrefsOpen(true),
    },
    {
      label: 'Priority',
      value: priorityUnread ? '1' : '—',
      hint: priorityUnread?.title ?? 'No urgent alert',
      accent: 'violet',
      icon: Inbox,
      onClick: () => priorityUnread && openNotification(priorityUnread),
    },
  ];

  const statusHeadline = unread
    ? `${unread} unread alert${unread === 1 ? '' : 's'}`
    : 'All caught up';
  const guideTitle = priorityUnread
    ? 'Open the alert that needs you'
    : unread
      ? 'Clear unread alerts first'
      : 'You are up to date';
  const guideDescription = priorityUnread
    ? `${priorityUnread.title} — tap it to jump straight to the work behind it.`
    : unread
      ? 'Unread alerts stay in your river until you open them or mark all read.'
      : 'New updates from letters, tasks, and sessions will flow in here.';
  const guideSteps = priorityUnread
    ? ['Open the priority alert in your river.', 'Finish the step it points to.', 'Mark all read once you are caught up.']
    : ['Scan the river when you sign in.', 'Mute categories you do not need.', 'Keep email digest on for a daily summary.'];

  const riverItems = isDemo ? demoCollectionItems : items;

  const riverBody = riverItems.length === 0 ? (
    <ProductEmptyState
      title={filter === 'unread' ? 'No unread alerts' : 'No notifications yet'}
      description={
        filter === 'unread'
          ? 'You have read everything in your river.'
          : 'Updates from letters, tasks, and sessions will show up here.'
      }
      action={
        filter === 'unread' ? (
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => setFilter('all')}>
            Show all
          </button>
        ) : undefined
      }
    />
  ) : (
    <div className="fc-wlp-alert-river" data-surface-layout="alert-river">
      {isDemo
        ? demoCollectionItems.map((n, idx) => {
            const cardAccent = n.accent ?? riverAccentForKind(n.tags?.[0] ?? 'alert', idx);
            return (
              <AlertRiverRow key={n.id} accent={cardAccent} isLast={idx === demoCollectionItems.length - 1}>
                <AlertRiverCard
                  title={n.title}
                  body={n.description}
                  meta={`${n.meta} · ${n.tags?.[0]?.replace(/_/g, ' ') ?? 'alert'}`}
                  accent={cardAccent}
                  read={n.status === 'complete'}
                  onOpen={n.onOpen ?? (() => undefined)}
                />
              </AlertRiverRow>
            );
          })
        : items.map((n, idx) => {
            const cardAccent = riverAccentForKind(n.kind, idx);
            return (
              <AlertRiverRow key={n.id} accent={cardAccent} isLast={idx === items.length - 1}>
                <AlertRiverCard
                  title={n.title}
                  body={n.body}
                  meta={`${formatWhen(n.createdAt)} · ${n.kind.replace(/_/g, ' ')}`}
                  accent={cardAccent}
                  read={Boolean(n.readAt)}
                  onOpen={() => openNotification(n)}
                />
              </AlertRiverRow>
            );
          })}
    </div>
  );

  const primaryAction = priorityUnread ? (
    <ProductPagePrimaryAction label="Open priority alert" onClick={() => openNotification(priorityUnread)} />
  ) : unread > 0 ? (
    <ProductPagePrimaryAction
      label="Mark all read"
      onClick={() => {
        if (!isDemo && partner?.id) {
          markAllRead({ partnerId: partner.id, audience: 'partner' });
          setVersion((v) => v + 1);
        }
      }}
    />
  ) : (
    <ProductPagePrimaryAction label="Open messages" onClick={() => navigate(mapPortalHref('/portal/messages'))} />
  );

  return (
    <ProductHubScaffold
      role={role}
      pageId="notifications"
      eyebrow="Notifications"
      title="See what changed and what needs you now."
      description="Alerts flow down a live river — open one to jump to the work behind it."
      status={`${statusHeadline} · ${isDemo ? 'demo' : 'live'} data`}
      freshness={isDemo ? 'demo snapshot' : formatFreshness(latestActivity)}
      accent={accent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      metricsVariant={METRICS_VARIANT}
      primaryAction={primaryAction}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => setPrefsOpen((open) => !open)}>
          <Settings size={14} /> Preferences
        </button>
      }
      metrics={metrics}
      metricTitle="Alert summary"
      metricDescription="Tap a count to filter your river or open preferences."
    >
      <section className="fc-wlp-section">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div
            className="fc-wlp-alert-river-layout"
            data-prefs-open={prefsOpen ? 'true' : undefined}
          >
            <div>
              <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 mb-5`} data-fc-accent="emerald">
                <div className="text-xs font-black uppercase tracking-widest text-emerald-700">Today&apos;s digest</div>
                <p className="mt-3 text-base font-bold text-slate-700">{formatDigestSummary(digest)}</p>
              </div>

              <div className="fc-wlp-alert-river-controls">
                <button
                  type="button"
                  className={filter === 'all' ? 'fc-wlp-btn-primary' : 'fc-wlp-btn-secondary'}
                  onClick={() => setFilter('all')}
                >
                  All alerts
                </button>
                <button
                  type="button"
                  className={filter === 'unread' ? 'fc-wlp-btn-primary' : 'fc-wlp-btn-secondary'}
                  onClick={() => setFilter('unread')}
                >
                  Unread
                  {unread ? <span className="fc-wlp-lane-chip-count">{unread}</span> : null}
                </button>
                {!isDemo && unread > 0 ? (
                  <button
                    type="button"
                    className="fc-wlp-btn-secondary"
                    onClick={() => {
                      if (partner?.id) {
                        markAllRead({ partnerId: partner.id, audience: 'partner' });
                        setVersion((v) => v + 1);
                      }
                    }}
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                ) : null}
                <button
                  type="button"
                  className={prefsOpen ? 'fc-wlp-btn-primary' : 'fc-wlp-btn-secondary'}
                  onClick={() => setPrefsOpen((open) => !open)}
                >
                  <Settings size={14} /> {prefsOpen ? 'Hide preferences' : 'Preferences'}
                </button>
              </div>

              {riverBody}
            </div>

            {prefsOpen ? (
              <PreferencesPanel
                prefs={prefs}
                mutedKinds={mutedKinds}
                onToggleEmail={toggleEmailPref}
                onToggleMute={toggleMute}
                onClose={() => setPrefsOpen(false)}
              />
            ) : null}
          </div>

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
      <p className="fc-wlp-section-description fc-wlp-compliance-line">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
