import React from 'react';
import { ArrowRight, CheckCircle2, Circle, Eye, ListChecks, Mail, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Props = {
  openCount: number;
  doneCount: number;
  scope: 'personal' | 'business';
  kind: 'tasks' | 'projects';
};

const PIPELINE_STAGES = [
  { label: 'Intake', color: 'border-sky-500/30 bg-sky-500/10' },
  { label: 'Reports', color: 'border-violet-500/30 bg-violet-500/10' },
  { label: 'Disputes', color: 'border-amber-500/30 bg-amber-500/10' },
  { label: 'Letters', color: 'border-rose-500/30 bg-rose-500/10' },
  { label: 'Funding', color: 'border-emerald-500/30 bg-emerald-500/10' },
];

export function PartnerWorkHubPanel({ openCount, doneCount, scope, kind }: Props) {
  const navigate = useNavigate();
  const total = openCount + doneCount;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const title = kind === 'tasks' ? 'Your action queue' : 'Your restoration journey';
  const desc =
    kind === 'tasks'
      ? 'These are the steps you need to take — mail letters, upload responses, and hit deadlines. Finely ops may work behind the scenes; you only see what requires your action.'
      : 'Track your progress through intake → reports → disputes → funding. Internal ops prep and QA stay on the admin side — updates appear here when you need to act.';

  return (
    <div className="fc-hub-hero space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="inline-flex items-center gap-2 text-emerald-300">
          <ListChecks size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Partner workspace · {kind}</span>
        </div>
        <div className="flex gap-2">
          <div className="fc-metric-tile border-amber-500/25 bg-amber-500/10 px-4 py-2 min-w-[88px]">
            <p className="text-[9px] uppercase tracking-widest text-amber-200/70">Open</p>
            <p className="text-2xl font-bold text-white">{openCount}</p>
          </div>
          <div className="fc-metric-tile border-emerald-500/25 bg-emerald-500/10 px-4 py-2 min-w-[88px]">
            <p className="text-[9px] uppercase tracking-widest text-emerald-200/70">Done</p>
            <p className="text-2xl font-bold text-white">{doneCount}</p>
          </div>
          <div className="fc-metric-tile border-white/[0.08] bg-white/[0.03] px-4 py-2 min-w-[88px] hidden sm:block">
            <p className="text-[9px] uppercase tracking-widest text-white/40">Complete</p>
            <p className="text-2xl font-bold text-white">{pct}%</p>
          </div>
        </div>
      </div>

      {kind === 'projects' ? (
        <div className="fc-light-glass-panel fc-light-chrome-panel p-4 overflow-x-auto">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3">Restoration pipeline</p>
          <div className="flex items-center gap-2 min-w-max">
            {PIPELINE_STAGES.map((s, i) => (
              <React.Fragment key={s.label}>
                <div className={`rounded-xl border px-4 py-3 text-center min-w-[90px] ${s.color}`}>
                  <p className="text-[9px] uppercase tracking-widest text-white/50">{s.label}</p>
                  <Circle size={14} className="mx-auto mt-2 text-white/30" />
                </div>
                {i < PIPELINE_STAGES.length - 1 ? (
                  <div className="w-6 h-px bg-gradient-to-r from-white/20 to-white/5 shrink-0" />
                ) : null}
              </React.Fragment>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { icon: Upload, label: 'Upload due', path: '/portal/reports', color: 'text-sky-300' },
            { icon: Mail, label: 'Mail letters', path: '/portal/letters', color: 'text-amber-300' },
            { icon: CheckCircle2, label: 'Mark complete', path: '/portal/projects', color: 'text-emerald-300' },
          ].map((a) => (
            <button
              key={a.path}
              type="button"
              onClick={() => navigate(a.path)}
              className="fc-light-glass-panel fc-light-chrome-panel rounded-xl px-4 py-3 text-left hover:border-white/20 transition-all group"
            >
              <a.icon size={18} className={`${a.color} mb-2`} />
              <p className="text-sm font-medium text-white/85">{a.label}</p>
              <p className="text-[10px] text-white/35 mt-1 group-hover:text-amber-200/80">Go →</p>
            </button>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-7 min-w-0">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <p className="mt-2 text-sm text-white/55 leading-relaxed max-w-2xl">{desc}</p>
          <div className="mt-3 flex items-start gap-2 text-xs text-white/45">
            <Eye size={14} className="text-sky-400 shrink-0 mt-0.5" />
            <span>
              Scope: <span className="text-white/70 font-medium capitalize">{scope}</span> — admin users see the full ops board with internal tasks, assignments, and cross-partner queues.
            </span>
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-[10px] uppercase tracking-widest text-white/35">{doneCount} of {total || '—'} items complete</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Upload report', path: '/portal/reports' },
          { label: 'Dispute center', path: '/portal/disputes' },
          { label: 'Letter studio', path: '/portal/letters' },
          { label: 'Template library', path: '/portal/templates' },
        ].map((link) => (
          <button
            key={link.path}
            type="button"
            onClick={() => navigate(link.path)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg fc-light-glass-panel fc-light-chrome-panel border text-[10px] font-black uppercase tracking-widest text-white/55 hover:border-amber-500/25 hover:text-amber-200 transition-all"
          >
            {link.label} <ArrowRight size={10} />
          </button>
        ))}
      </div>

      <div className="fc-light-glass-panel fc-light-chrome-panel rounded-xl px-4 py-3 flex items-center gap-2 text-xs text-white/50">
        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
        When ops completes internal work, shared tasks move to your board and you get a notification.
      </div>
    </div>
  );
}
