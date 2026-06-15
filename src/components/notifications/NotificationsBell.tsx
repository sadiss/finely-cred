import React, { useEffect, useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listNotifications, markAllRead, markNotificationRead, unreadCount } from '../../data/notificationsRepo';
import type { NotificationAudience } from '../../domain/notifications';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { isAdminEmail } from '../../auth/admin';
import { useAuth } from '../../auth/AuthProvider';

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
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto rounded-xl border border-white/[0.08] bg-[#0f0a18]/95 backdrop-blur-xl shadow-2xl z-[300]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/70">Notifications</span>
            {count > 0 ? (
              <button
                type="button"
                className="text-[10px] text-violet-300 hover:text-violet-200"
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
            <div className="px-4 py-6 text-sm text-white/45">No notifications yet.</div>
          ) : (
            <ul>
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/[0.04] ${n.readAt ? 'opacity-60' : ''}`}
                    onClick={() => {
                      markNotificationRead(n.id);
                      setVersion((v) => v + 1);
                      setOpen(false);
                      if (n.href) navigate(n.href);
                    }}
                  >
                    <div className="text-sm font-medium text-white/90">{n.title}</div>
                    {n.body ? <div className="text-xs text-white/50 mt-1 line-clamp-2">{n.body}</div> : null}
                  </button>
                </li>
              ))}
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
