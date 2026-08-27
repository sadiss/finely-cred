import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, Settings } from 'lucide-react';
import { PartnerWorkstationFrame } from '../features/workspaceLightPreview/product/partner/PartnerWorkstationFrame';
import { useMappedAdminNavigate, useMappedPartnerNavigate } from '../features/workspaceLightPreview/product/partner/usePartnerProductNavigation';
import {
  listNotifications,
  markAllRead,
  markNotificationRead,
  unreadCount,
} from '../data/notificationsRepo';
import { getNotificationPrefs, upsertNotificationPrefs } from '../data/notificationPrefsRepo';
import type { NotificationAudience } from '../domain/notifications';
import { usePartnerSession } from '../auth/PartnerSessionContext';
import { useAuth } from '../auth/AuthProvider';
import { isAdminEmail } from '../auth/admin';
import {
  notificationActionPath,
  pickHighestPriorityUnreadNotification,
} from '../lib/notificationNavigation';
import { buildNotificationDigest, formatDigestSummary } from '../lib/notificationDigestEngine';
import { FinelyOsPaginatedStack } from '../features/os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../features/os/finelyOsLightUi';

type Surface = 'admin' | 'portal';

export default function NotificationsCenterPage({
  surface,
  embedded = false,
}: {
  surface: Surface;
  embedded?: boolean;
}) {
  const partnerNavigate = useMappedPartnerNavigate();
  const adminNavigate = useMappedAdminNavigate();
  const navigate = surface === 'admin' ? adminNavigate : partnerNavigate;
  const auth = useAuth();
  const { partner } = usePartnerSession();
  const [version, setVersion] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const audience: NotificationAudience = surface === 'admin' ? 'admin' : 'partner';

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
    () =>
      buildNotificationDigest({
        audience,
        partnerId: surface === 'portal' ? partner?.id : undefined,
      }),
    [audience, surface, partner?.id, version],
  );

  const items = useMemo(
    () =>
      listNotifications({
        partnerId: surface === 'portal' ? partner?.id : undefined,
        audience,
        unreadOnly: filter === 'unread',
        limit: 100,
      }),
    [surface, partner?.id, audience, filter, version],
  );

  const unread = useMemo(
    () => unreadCount({ partnerId: surface === 'portal' ? partner?.id : undefined, audience }),
    [surface, partner?.id, audience, version],
  );

  const prefs = useMemo(
    () => getNotificationPrefs({ partnerId: partner?.id, userId: auth.user?.id }),
    [partner?.id, auth.user?.id, version],
  );

  const mutedKinds = prefs.mutedKinds ?? [];

  function toggleEmailInstantMessages() {
    upsertNotificationPrefs({ ...prefs, emailInstantMessages: !prefs.emailInstantMessages });
    setVersion((v) => v + 1);
  }

  function toggleEmailDigest() {
    upsertNotificationPrefs({ ...prefs, emailDigest: !prefs.emailDigest });
    setVersion((v) => v + 1);
  }

  const priorityUnread = useMemo(
    () => pickHighestPriorityUnreadNotification(items),
    [items],
  );

  const priorityPath = priorityUnread ? notificationActionPath(priorityUnread) : undefined;

  function openNotification(n: (typeof items)[number]) {
    markNotificationRead(n.id);
    setVersion((v) => v + 1);
    const path = notificationActionPath(n);
    if (path) navigate(path);
  }

  function toggleMute(kind: string) {
    const next = mutedKinds.includes(kind) ? mutedKinds.filter((k) => k !== kind) : [...mutedKinds, kind];
    upsertNotificationPrefs({ ...prefs, mutedKinds: next });
    setVersion((v) => v + 1);
  }

  const canUse =
    surface === 'admin'
      ? Boolean(auth.user?.email && isAdminEmail(auth.user.email))
      : Boolean(partner);

  if (!canUse) {
    return (
      <PartnerWorkstationFrame
        embedded={embedded}
        kind="notifications-workstation"
        badge="Notifications"
        title="Notifications"
        subtitle="Sign in to view alerts."
      >
        <p className={FINELY_OS_ENTITY_BODY}>No session available for this surface.</p>
      </PartnerWorkstationFrame>
    );
  }

  return (
    <PartnerWorkstationFrame
      embedded={embedded}
      kind="notifications-workstation"
      badge={surface === 'admin' ? 'Admin' : 'Portal'}
      title="Notifications Center"
      subtitle="Alerts that need you now — everything else stays out of the way."
    >
      <div className="space-y-6 max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
            <Bell size={14} className="text-violet-300" />
            {unread > 0 ? `${unread} unread` : 'All caught up'}
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
              <>
                {priorityPath ? (
                  <button
                    type="button"
                    className={FINELY_OS_PRIMARY_BTN}
                    onClick={() => priorityUnread && openNotification(priorityUnread)}
                  >
                    Open the item that needs you
                  </button>
                ) : null}
                <button
                  type="button"
                  className={FINELY_OS_SECONDARY_BTN}
                  onClick={() => {
                    markAllRead({ partnerId: surface === 'portal' ? partner?.id : undefined, audience });
                    setVersion((v) => v + 1);
                  }}
                >
                  <CheckCheck size={14} className="inline mr-1" /> Mark all read
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className={`${finelyOsCatalogCard('emerald')}`} data-fc-accent="emerald">
          <div className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>24h digest</div>
          <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{formatDigestSummary(digest)}</p>
          {prefs.emailDigest ? (
            <p className={`mt-2 text-[10px] ${FINELY_OS_ENTITY_SUBLABEL}`}>Email digest enabled — summaries sent via Comms when delivery is live.</p>
          ) : null}
        </div>

        {surface === 'portal' ? (
          <div className={`${finelyOsCatalogCard('violet')} space-y-3`} data-fc-accent="violet">
            <div className={`flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
              <Settings size={12} /> Preferences
            </div>
            <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>Mute categories you do not want in-app or email digests.</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={toggleEmailInstantMessages}
                className={`${FINELY_OS_ENTITY_CHIP} ${prefs.emailInstantMessages ? '' : 'opacity-50 line-through'}`}
              >
                Instant message emails
              </button>
              <button
                type="button"
                onClick={toggleEmailDigest}
                className={`${FINELY_OS_ENTITY_CHIP} ${prefs.emailDigest ? '' : 'opacity-50 line-through'}`}
              >
                Daily email digest
              </button>
              <button
                type="button"
                onClick={() => {
                  upsertNotificationPrefs({
                    ...prefs,
                    emailLetterLifecycle: !prefs.emailLetterLifecycle,
                  });
                  setVersion((v) => v + 1);
                }}
                className={`${FINELY_OS_ENTITY_CHIP} ${prefs.emailLetterLifecycle !== false ? '' : 'opacity-50 line-through'}`}
              >
                Letter lifecycle emails
              </button>
              <button
                type="button"
                onClick={() => {
                  upsertNotificationPrefs({
                    ...prefs,
                    emailMeetingReminders: !prefs.emailMeetingReminders,
                  });
                  setVersion((v) => v + 1);
                }}
                className={`${FINELY_OS_ENTITY_CHIP} ${prefs.emailMeetingReminders !== false ? '' : 'opacity-50 line-through'}`}
              >
                Meeting reminder emails
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  'task',
                  'trial',
                  'purchase',
                  'support',
                  'letters',
                  'nurture_education',
                  'nurture_opportunity',
                  'nurture_birthday',
                ] as const
              ).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => toggleMute(kind)}
                  className={`${FINELY_OS_ENTITY_CHIP} ${mutedKinds.includes(kind) ? 'opacity-50 line-through' : ''}`}
                >
                  {kind.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className={`${finelyOsCatalogCard('sky')} overflow-hidden`} data-fc-accent="sky">
          {items.length === 0 ? (
            <div className={`p-8 text-center text-sm ${FINELY_OS_ENTITY_BODY}`}>No notifications yet.</div>
          ) : (
            <FinelyOsPaginatedStack
              items={items}
              pageSize={12}
              itemSpacingClassName="divide-y divide-black/[0.06]"
              emptyMessage="No notifications yet."
              renderItem={(n) => (
              <button
                key={n.id}
                type="button"
                className={`w-full text-left px-5 py-4 hover:bg-black/[0.03] transition ${n.readAt ? 'opacity-55' : ''}`}
                onClick={() => openNotification(n)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{n.title}</div>
                    {n.body ? <div className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>{n.body}</div> : null}
                  </div>
                  <span className={`shrink-0 text-[10px] ${FINELY_OS_ENTITY_SUBLABEL}`}>
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className={`mt-2 text-[10px] ${FINELY_OS_ENTITY_SUBLABEL}`}>{n.kind}</div>
              </button>
              )}
            />
          )}
        </div>
      </div>
    </PartnerWorkstationFrame>
  );
}
