import React from 'react';
import { Bell, CheckCircle2, ExternalLink } from 'lucide-react';
import { getHumanStaffAgent } from './humanStaffDirectory';
import { markHumanStaffNotificationRead } from './humanStaffRepo';
import { HumanStaffAvatar } from './HumanStaffAvatar';
import type { HumanStaffNotification } from './types';
import {
  STAFF_CMD_BODY,
  STAFF_CMD_EYEBROW,
  STAFF_CMD_KPI,
  STAFF_CMD_PANEL,
  STAFF_CMD_SECONDARY_BTN,
  STAFF_CMD_TITLE,
  staffCmdHighlightPanel,
} from './humanStaffOsUi';

export function HumanStaffNotificationsPanel({ notifications, onChanged }: { notifications: HumanStaffNotification[]; onChanged: () => void }) {
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <div className={STAFF_CMD_PANEL}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`inline-flex items-center gap-2 ${STAFF_CMD_EYEBROW}`}>
            <Bell size={18} />
            <span>Staff inbox</span>
          </div>
          <h2 className={`mt-2 ${STAFF_CMD_TITLE}`}>Agent-to-agent handoffs</h2>
          <p className={`mt-2 text-sm ${STAFF_CMD_BODY} max-w-2xl`}>
            Missions crossing departments, worker blocks, lead handoffs, and compliance reviews.
          </p>
        </div>
        <div className={`${staffCmdHighlightPanel()} px-4 py-3 text-sm`}>
          <span className="font-black text-white">{unread}</span> unread
        </div>
      </div>
      <div className="space-y-3 max-h-[560px] overflow-auto pr-1">
        {notifications.length === 0 ? (
          <div className={`rounded-xl border border-white/10 bg-white/[0.03] p-5 ${STAFF_CMD_BODY}`}>
            No notifications yet. Run a mission to generate staff handoffs.
          </div>
        ) : null}
        {notifications.map((note) => {
          const from = getHumanStaffAgent(note.fromAgentId);
          const to = getHumanStaffAgent(note.toAgentId);
          return (
            <div
              key={note.id}
              className={`rounded-xl border p-4 ${note.read ? 'border-white/10 bg-white/[0.025]' : 'border-violet-500/25 bg-violet-500/10'}`}
            >
              <div className="flex items-start gap-3">
                <HumanStaffAvatar agent={from} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-bold text-white">{note.title}</div>
                    <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[9px] uppercase tracking-widest text-white/45">
                      {note.priority}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-white/40">
                    {from.name} → {to.name}
                  </div>
                  <p className={`mt-3 whitespace-pre-line text-sm ${STAFF_CMD_BODY}`}>{note.body}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {note.actionLabel ? (
                      <button type="button" className={STAFF_CMD_SECONDARY_BTN}>
                        <ExternalLink size={13} />
                        {note.actionLabel}
                      </button>
                    ) : null}
                    {!note.read ? (
                      <button
                        type="button"
                        onClick={() => {
                          markHumanStaffNotificationRead(note.id);
                          onChanged();
                        }}
                        className={STAFF_CMD_SECONDARY_BTN}
                      >
                        <CheckCircle2 size={13} />
                        Mark read
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
