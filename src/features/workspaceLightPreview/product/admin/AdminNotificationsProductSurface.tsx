import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, ExternalLink, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../auth/AuthProvider';
import { isAdminEmail } from '../../../../auth/admin';
import {
  listNotifications,
  markAllRead,
  markNotificationRead,
  unreadCount,
} from '../../../../data/notificationsRepo';
import { buildNotificationDigest, formatDigestSummary } from '../../../../lib/notificationDigestEngine';
import {
  notificationActionPath,
  pickHighestPriorityUnreadNotification,
} from '../../../../lib/notificationNavigation';
import type { AppNotification } from '../../../../domain/notifications';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { ProductEmptyState, type ProductMetric } from '../components/ProductUi';

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AdminNotificationsProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const auth = useAuth();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'violet';
  const PageIcon = navItem?.icon ?? Bell;

  const [version, setVersion] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const canUse = Boolean(auth.user?.email && isAdminEmail(auth.user.email));

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', bump as EventListener);
    window.addEventListener('finely:platform-event', bump as EventListener);
    return () => {
      window.removeEventListener('finely:store', bump as EventListener);
      window.removeEventListener('finely:platform-event', bump as EventListener);
    };
  }, []);

  const digest = useMemo(
    () => buildNotificationDigest({ audience: 'admin' }),
    [version],
  );

  const items = useMemo(
    () =>
      listNotifications({
        audience: 'admin',
        unreadOnly: filter === 'unread',
        limit: 100,
      }),
    [filter, version],
  );

  const unread = useMemo(() => unreadCount({ audience: 'admin' }), [version]);

  const priorityUnread = useMemo(() => pickHighestPriorityUnreadNotification(items), [items]);

  const selected = useMemo(
    () => items.find((n) => n.id === selectedId) ?? items[0] ?? null,
    [items, selectedId],
  );

  useEffect(() => {
    if (!selectedId && items[0]) setSelectedId(items[0].id);
    if (selectedId && !items.some((n) => n.id === selectedId) && items[0]) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

  function openNotification(n: AppNotification) {
    markNotificationRead(n.id);
    setVersion((v) => v + 1);
    const path = notificationActionPath(n);
    if (path) navigate(path);
  }

  function selectNotification(n: AppNotification) {
    setSelectedId(n.id);
    if (!n.readAt) {
      markNotificationRead(n.id);
      setVersion((v) => v + 1);
    }
  }

  const metrics: ProductMetric[] = [
    {
      label: 'Unread',
      value: unread,
      hint: unread ? 'Needs triage' : 'All clear',
      accent: 'rose',
      icon: Bell,
      onClick: () => setFilter('unread'),
    },
    {
      label: '24h total',
      value: digest.total,
      hint: formatDigestSummary(digest),
      accent: 'emerald',
      icon: ShieldAlert,
    },
    {
      label: 'Kinds',
      value: Object.keys(digest.byKind).length,
      hint: 'Alert categories today',
      accent: 'sky',
      icon: Bell,
    },
    {
      label: 'Priority',
      value: priorityUnread ? '1' : '—',
      hint: priorityUnread?.title ?? 'Nothing urgent',
      accent: 'violet',
      icon: ExternalLink,
      onClick: () => priorityUnread && openNotification(priorityUnread),
    },
  ];

  if (!canUse) {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow="Command"
        title="Sign in with an admin account to view system alerts."
        description="Escalations, delivery warnings, and platform events land here."
        accent={accent}
        surfaceMode={navItem?.surfaceMode ?? 'light'}
        archetype={archetype}
        icon={PageIcon}
      >
        <ProductEmptyState title="No admin session" description="Sign in with an allowlisted admin email to open the alert queue." />
      </ProductHubScaffold>
    );
  }

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Command"
      title="System alerts, escalations, and delivery warnings."
      description="Queue on the left, inspector on the right — open an alert to jump to the work behind it."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'light'}
      archetype={archetype}
      icon={PageIcon}
      metrics={metrics}
      metricTitle="Alert queue"
      metricDescription="Unread counts refresh when platform events fire."
      primaryAction={
        priorityUnread ? (
          <ProductPagePrimaryAction label="Open priority alert" onClick={() => openNotification(priorityUnread)} />
        ) : unread > 0 ? (
          <ProductPagePrimaryAction
            label="Mark all read"
            onClick={() => {
              markAllRead({ audience: 'admin' });
              setVersion((v) => v + 1);
            }}
          />
        ) : undefined
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/monitoring')}>
          Monitoring
        </button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)] min-h-[520px]">
        <div className={`${finelyOsCatalogCard('sky')} flex flex-col overflow-hidden !p-0`} data-fc-accent="sky">
          <div className="border-b border-black/[0.06] p-5 lg:p-6 space-y-4">
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-sky-700">Alert queue</div>
              <p className={`mt-2 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                {unread > 0 ? `${unread} unread` : 'All caught up'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={filter === 'all' ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                type="button"
                className={filter === 'unread' ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN}
                onClick={() => setFilter('unread')}
              >
                Unread
              </button>
              {unread > 0 ? (
                <button
                  type="button"
                  className={FINELY_OS_SECONDARY_BTN}
                  onClick={() => {
                    markAllRead({ audience: 'admin' });
                    setVersion((v) => v + 1);
                  }}
                >
                  <CheckCheck size={14} /> Mark all read
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[62vh]">
            {items.length === 0 ? (
              <div className={`p-8 text-center text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>No notifications yet.</div>
            ) : (
              <FinelyOsPaginatedStack
                items={items}
                pageSize={14}
                itemSpacingClassName="divide-y divide-black/[0.06]"
                emptyMessage="No notifications yet."
                renderItem={(n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => selectNotification(n)}
                    className={`w-full text-left px-5 py-4 transition hover:bg-black/[0.03] ${
                      selected?.id === n.id ? 'bg-violet-500/10 ring-1 ring-inset ring-violet-400/30' : ''
                    } ${n.readAt ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className={`text-sm font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{n.title}</div>
                        {n.body ? <div className={`mt-1 text-xs font-semibold ${FINELY_OS_ENTITY_BODY}`}>{n.body}</div> : null}
                      </div>
                      {!n.readAt ? <span className={finelyOsStatusChip('warn')}>New</span> : null}
                    </div>
                    <div className={`mt-2 text-[10px] font-bold uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>
                      {formatWhen(n.createdAt)} · {n.kind.replace(/_/g, ' ')}
                    </div>
                  </button>
                )}
              />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8`} data-fc-accent="emerald">
            <div className="text-xs font-black uppercase tracking-widest text-emerald-700">24h digest</div>
            <p className={`mt-3 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{formatDigestSummary(digest)}</p>
            {digest.highlights.length ? (
              <ul className="mt-4 space-y-2">
                {digest.highlights.map((line) => (
                  <li key={line} className="text-sm font-semibold text-emerald-900/90">
                    · {line}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 min-h-[280px]`} data-fc-accent="violet">
            <div className="text-xs font-black uppercase tracking-widest text-violet-700">Selected alert</div>
            {selected ? (
              <div className="mt-4 space-y-4">
                <h2 className="text-2xl font-extrabold">{selected.title}</h2>
                {selected.body ? <p className={`text-base font-semibold ${FINELY_OS_ENTITY_BODY}`}>{selected.body}</p> : null}
                <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-widest">
                  <span className={finelyOsStatusChip(selected.readAt ? 'ok' : 'warn')}>
                    {selected.readAt ? 'Read' : 'Unread'}
                  </span>
                  <span className={finelyOsStatusChip('ok')}>{selected.kind.replace(/_/g, ' ')}</span>
                </div>
                <p className={`text-sm font-bold ${FINELY_OS_ENTITY_SUBLABEL}`}>Received {formatWhen(selected.createdAt)}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {notificationActionPath(selected) ? (
                    <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => openNotification(selected)}>
                      <ExternalLink size={14} /> Open linked work
                    </button>
                  ) : null}
                  {!selected.readAt ? (
                    <button
                      type="button"
                      className={FINELY_OS_SECONDARY_BTN}
                      onClick={() => {
                        markNotificationRead(selected.id);
                        setVersion((v) => v + 1);
                      }}
                    >
                      Mark read
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <ProductEmptyState
                title="Select an alert"
                description="Choose a row from the queue to inspect the digest and jump to the linked admin surface."
              />
            )}
          </div>

          <div className={`${finelyOsCatalogCard('rose')} p-5 lg:p-6`} data-fc-accent="rose">
            <div className="text-xs font-black uppercase tracking-widest text-rose-700">By kind (24h)</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(digest.byKind).length === 0 ? (
                <span className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>No categorized alerts today.</span>
              ) : (
                Object.entries(digest.byKind).map(([kind, count]) => (
                  <span key={kind} className="rounded-full border border-rose-300/40 bg-rose-500/10 px-3 py-1.5 text-xs font-extrabold text-rose-900">
                    {kind.replace(/_/g, ' ')} · {count}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
