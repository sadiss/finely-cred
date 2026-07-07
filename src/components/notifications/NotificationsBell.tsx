import React, { useEffect, useMemo, useState } from 'react';
import { Bell, MessageSquareText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listNotifications, markAllRead, markNotificationRead, unreadCount } from '../../data/notificationsRepo';
import type { AppNotification, NotificationAudience } from '../../domain/notifications';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { isAdminEmail } from '../../auth/admin';
import { useAuth } from '../../auth/AuthProvider';
import { messageNotificationPresentation } from '../../lib/messageNotificationCopy';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_SUBLABEL } from '../../features/os/finelyOsLightUi';

function accentClasses(accent: 'inbound' | 'outbound' | 'system') {
  if (accent === 'inbound') return 'border-emerald-400/30 bg-emerald-500/10';
  if (accent === 'outbound') return 'border-fuchsia-400/30 bg-fuchsia-500/10';
  return 'border-white/10 bg-white/[0.04]';
}

export function NotificationsBell() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { partner } = usePartnerSession();
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState(0);

  const audience: NotificationAudience = useMemo(() => {
    if (partner) return 'partner';
    if (auth.user?.email && isAdminEmail(auth.user.email)) return 'admin';
    return 'both';
  }, [partner, auth.user?.email]);

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', bump as EventListener);
    window.addEventListener('finely:platform-event', bump as EventListener);
    return () => {
      window.removeEventListener('finely:store', bump as EventListener);
      window.removeEventListener('finely:platform-event', bump as EventListener);
    };
  }, []);

  const count = useMemo(
    () => unreadCount({ partnerId: partner?.id, audience }),
    [partner?.id, audience, version],
  );

  const items = useMemo(
    () => listNotifications({ partnerId: partner?.id, audience, limit: 12 }),
    [partner?.id, audience, version],
  );

  if (!auth.user) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative inline-flex items-center justify-center w-10 h-10 fc-light-glass-panel fc-light-chrome-panel rounded-xl hover:bg-white/[0.1] text-white/80"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {count > 0 ? (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 mt-2 w-[22rem] max-h-[28rem] overflow-auto rounded-2xl border border-fuchsia-500/20 bg-[#0a1210]/96 backdrop-blur-xl shadow-[0_24px_70px_-30px_rgba(217,70,239,0.45)] z-[300]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-gradient-to-r from-fuchsia-500/10 via-transparent to-emerald-500/10">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-white/80">Inbox</span>
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-0.5`}>Messages & updates</div>
            </div>
            {count > 0 ? (
              <button
                type="button"
                className="text-[10px] text-fuchsia-300 hover:text-fuchsia-200"
                onClick={() => {
                  markAllRead({ partnerId: partner?.id, audience });
                  setVersion((v) => v + 1);
                }}
              >
                Mark all read
              </button>
            ) : null}
          </div>
          {items.length === 0 ? (
            <div className={`px-4 py-8 text-sm ${FINELY_OS_ENTITY_BODY}`}>No inbox notifications yet.</div>
          ) : (
            <ul className="p-2 space-y-2">
              {items.map((n) => {
                const presentation = messageNotificationPresentation(n);
                return (
                <li key={n.id}>
                  <button
                    type="button"
                    className={`w-full text-left rounded-xl border px-3 py-3 hover:bg-white/[0.04] transition-all ${accentClasses(presentation.accent)} ${n.readAt ? 'opacity-60' : ''}`}
                    onClick={() => {
                      markNotificationRead(n.id);
                      setVersion((v) => v + 1);
                      setOpen(false);
                      if (n.href) navigate(n.href);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl border border-white/10 bg-black/30 flex items-center justify-center text-lg shrink-0">
                        {presentation.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {n.kind === 'support_message' ? <MessageSquareText size={12} className="text-fuchsia-300 shrink-0" /> : <Bell size={12} className="text-white/40 shrink-0" />}
                          <span className="text-[10px] uppercase tracking-widest text-white/45">{presentation.eyebrow}</span>
                        </div>
                        <div className="text-sm font-medium text-white/92 mt-1">{n.title}</div>
                        {n.body ? <div className={`text-xs mt-1 line-clamp-2 ${FINELY_OS_ENTITY_BODY}`}>{n.body}</div> : null}
                      </div>
                    </div>
                  </button>
                </li>
              );
              })}
            </ul>
          )}
          <div className="px-4 py-2 border-t border-white/[0.08]">
            <button
              type="button"
              className="text-xs text-violet-300 hover:text-violet-200 w-full text-left py-2"
              onClick={() => {
                setOpen(false);
                navigate(partner ? '/portal/notifications' : '/admin/notifications');
              }}
            >
              View all notifications
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
