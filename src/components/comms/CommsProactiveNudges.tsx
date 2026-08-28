import React, { useMemo, useState } from 'react';
import { AlertTriangle, Clock, Mail, Sparkles } from 'lucide-react';
import { listTasksByPartner } from '../../data/tasksRepo';
import { getLeadMagnetTrial, isLeadMagnetTrialActive, trialDaysRemaining } from '../../lib/leadMagnetTrial';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_SUBLABEL, finelyOsInlineListItem } from '../../features/os/finelyOsLightUi';

export function CommsProactiveNudges({ partnerId }: { partnerId: string; email?: string }) {
  const nudges = useMemo(() => {
    const items: Array<{ id: string; tone: 'amber' | 'rose' | 'violet'; icon: React.ReactNode; title: string; body: string }> = [];
    const tasks = listTasksByPartner(partnerId);
    const overdue = tasks.filter(
      (t) => t.dueAt && (t.status === 'pending' || t.status === 'in_progress') && Date.parse(t.dueAt) < Date.now(),
    );
    if (overdue.length > 0) {
      items.push({
        id: 'overdue',
        tone: 'rose',
        icon: <Clock size={14} />,
        title: `${overdue.length} task${overdue.length === 1 ? '' : 's'} overdue`,
        body: overdue[0]?.title ?? 'Check Work OS for next steps.',
      });
    }
    const bureau = tasks.find(
      (t) => (t.tags ?? []).some((tag) => tag.startsWith('bureau_timer')) && t.status !== 'completed',
    );
    if (bureau) {
      items.push({
        id: 'bureau',
        tone: 'amber',
        icon: <Mail size={14} />,
        title: 'Bureau response window active',
        body: bureau.title,
      });
    }
    const trial = getLeadMagnetTrial();
    if (trial && isLeadMagnetTrialActive(trial)) {
      const daysLeft = trialDaysRemaining(trial);
      if (daysLeft <= 3) {
        items.push({
          id: 'trial',
          tone: 'violet',
          icon: <Sparkles size={14} />,
          title: `Trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
          body: 'Upgrade to keep portal access and automation features.',
        });
      }
    }
    const disputeDue = tasks.filter((t) => t.stage === 'disputes' && t.status === 'pending').length;
    if (disputeDue >= 2) {
      items.push({
        id: 'disputes',
        tone: 'amber',
        icon: <AlertTriangle size={14} />,
        title: `${disputeDue} dispute tasks pending`,
        body: 'Complete mail + follow-up steps to stay on track.',
      });
    }
    return items.slice(0, 4);
  }, [partnerId]);

  const [open, setOpen] = useState(false);

  if (nudges.length === 0) return null;

  const first = nudges[0];

  return (
    <div className="px-3 py-2 border-b border-white/[0.08] space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 text-left"
        aria-expanded={open}
      >
        <span className={`${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>Nudges</span>
        <span className="text-xs font-semibold text-white/80 truncate">{first.title}</span>
        {nudges.length > 1 ? (
          <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-violet-200/80">
            +{nudges.length - 1}
          </span>
        ) : null}
        <span className="ml-auto shrink-0 text-[10px] font-bold uppercase tracking-wider text-white/45">
          {open ? 'Hide' : 'Show'}
        </span>
      </button>
      {open ? (
      <ul className="space-y-1.5">
        {nudges.map((n) => (
          <li key={n.id} className={`flex items-start gap-2 px-2.5 py-2 text-xs rounded-xl ${finelyOsInlineListItem(true)}`}>
            <span className={n.tone === 'rose' ? 'text-rose-300' : n.tone === 'amber' ? 'text-amber-300' : 'text-violet-300'}>{n.icon}</span>
            <div>
              <div className="font-semibold text-white/90">{n.title}</div>
              <div className={FINELY_OS_ENTITY_BODY}>{n.body}</div>
            </div>
          </li>
        ))}
      </ul>
      ) : null}
    </div>
  );
}
