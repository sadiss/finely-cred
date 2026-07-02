import React from 'react';
import { Bell, CheckCircle2, ExternalLink } from 'lucide-react';
import { getHumanStaffAgent } from './humanStaffDirectory';
import { markHumanStaffNotificationRead } from './humanStaffRepo';
import { HumanStaffAvatar } from './HumanStaffAvatar';
import type { HumanStaffNotification } from './types';

export function HumanStaffNotificationsPanel({ notifications, onChanged }: { notifications: HumanStaffNotification[]; onChanged: () => void }) {
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <div className="rounded-[30px] border border-white/10 bg-black/25 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-amber-300"><Bell size={18} /><span className="text-[10px] uppercase tracking-widest font-black">Agent-to-agent notifications</span></div>
          <h2 className="mt-2 text-2xl font-black text-white">Staff inbox</h2>
          <p className="mt-2 text-sm text-white/55 max-w-2xl">Agents notify each other when a mission crosses departments, a worker blocks, a lead needs a handoff, or compliance needs review.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70"><span className="font-black text-white">{unread}</span> unread</div>
      </div>
      <div className="space-y-3 max-h-[560px] overflow-auto pr-1">
        {notifications.length === 0 ? <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-white/45">No notifications yet. Run a mission to generate staff handoffs.</div> : null}
        {notifications.map((note) => {
          const from = getHumanStaffAgent(note.fromAgentId);
          const to = getHumanStaffAgent(note.toAgentId);
          return (
            <div key={note.id} className={`rounded-2xl border p-4 ${note.read ? 'border-white/10 bg-white/[0.025]' : 'border-amber-500/25 bg-amber-500/10'}`}>
              <div className="flex items-start gap-3">
                <HumanStaffAvatar agent={from} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-black text-white">{note.title}</div>
                    <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[9px] uppercase tracking-widest text-white/45">{note.priority}</span>
                  </div>
                  <div className="mt-1 text-xs text-white/40">{from.name} to {to.name}</div>
                  <p className="mt-3 whitespace-pre-line text-sm text-white/65">{note.body}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {note.actionLabel ? <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-amber-100"><ExternalLink size={13} />{note.actionLabel}</button> : null}
                    {!note.read ? <button type="button" onClick={() => { markHumanStaffNotificationRead(note.id); onChanged(); }} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/65"><CheckCircle2 size={13} />Mark read</button> : null}
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
