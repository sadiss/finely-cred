import React from 'react';
import {
  AlertCircle,
  Calendar,
  Clock,
  FileUp,
  Gavel,
  Mail,
  RefreshCw,
  Search,
  Tag,
} from 'lucide-react';
import type { WorkBoardItem } from './types';

const KIND_META: Record<string, { label: string; icon: typeof Mail; tone: string }> = {
  mail_letter: { label: 'Mail', icon: Mail, tone: 'text-sky-300 bg-sky-500/10 border-sky-500/25' },
  follow_up: { label: 'Follow-up', icon: RefreshCw, tone: 'text-amber-300 bg-amber-500/10 border-amber-500/25' },
  upload_document: { label: 'Upload', icon: FileUp, tone: 'text-violet-300 bg-violet-500/10 border-violet-500/25' },
  review_results: { label: 'Review', icon: Search, tone: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25' },
  general: { label: 'Task', icon: Gavel, tone: 'text-white/60 bg-white/5 border-white/[0.08]' },
};

const PRIORITY_META: Record<string, { label: string; cls: string }> = {
  urgent: { label: 'Urgent', cls: 'bg-red-500/20 border-red-500/40 text-red-200' },
  high: { label: 'High', cls: 'bg-amber-500/20 border-amber-500/40 text-amber-200' },
  normal: { label: 'Normal', cls: 'bg-white/5 border-white/[0.08] text-white/50' },
  low: { label: 'Low', cls: 'bg-white/[0.03] border-white/[0.08] text-white/35' },
};

function fmtDue(iso?: string) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    const diff = d.getTime() - Date.now();
    const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
    const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (days < 0) return { label, overdue: true };
    if (days <= 3) return { label, soon: true };
    return { label };
  } catch {
    return null;
  }
}

export function WorkKanbanCardMeta({ item }: { item: WorkBoardItem }) {
  const kind = item.kind ? KIND_META[item.kind] ?? KIND_META.general : null;
  const priority = item.priority ? PRIORITY_META[item.priority] ?? PRIORITY_META.normal : null;
  const due = fmtDue(item.dueAt);
  const checklistDone = item.checklistDone ?? 0;
  const checklistTotal = item.checklistTotal ?? 0;
  const hasChecklist = checklistTotal > 0;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {kind ? (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-widest ${kind.tone}`}>
            <kind.icon size={10} /> {kind.label}
          </span>
        ) : null}
        {item.workflowStageLabel ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md fc-light-glass-panel fc-light-chrome-panel border text-[9px] font-black uppercase tracking-widest text-white/55">
            {item.workflowStageLabel}
          </span>
        ) : null}
        {priority && item.priority !== 'normal' ? (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-widest ${priority.cls}`}>
            {item.priority === 'urgent' ? <AlertCircle size={10} /> : null}
            {priority.label}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/45">
        {due ? (
          <span className={`inline-flex items-center gap-1 ${due.overdue ? 'text-red-300' : due.soon ? 'text-amber-300' : ''}`}>
            <Calendar size={10} /> {due.label}
            {due.overdue ? ' · overdue' : due.soon ? ' · soon' : ''}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <Clock size={10} /> No due date
          </span>
        )}
        {item.assigneeLabel ? <span>→ {item.assigneeLabel}</span> : null}
      </div>

      {hasChecklist ? (
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] uppercase tracking-widest text-white/35">
            <span>Checklist</span>
            <span>{checklistDone}/{checklistTotal}</span>
          </div>
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-emerald-500/80 transition-all"
              style={{ width: `${Math.round((checklistDone / checklistTotal) * 100)}%` }}
            />
          </div>
        </div>
      ) : null}

      {item.tags && item.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {item.tags.slice(0, 3).map((t) => (
            <span key={t} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-white/[0.08] text-[9px] text-white/40">
              <Tag size={8} /> {t}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
