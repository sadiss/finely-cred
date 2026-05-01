import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Circle, ExternalLink, Target, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ensureBusinessCreditLadderTasks, BUSINESS_LADDER_TASKS } from '../../business/businessCreditLadder';
import { listTasksByPartner } from '../../data/tasksRepo';

export function BusinessCreditLadderPanel({ partnerId }: { partnerId: string }) {
  const navigate = useNavigate();
  const [storeVersion, setStoreVersion] = useState(0);

  useEffect(() => {
    ensureBusinessCreditLadderTasks({ partnerId });
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, [partnerId]);

  const tasks = useMemo(() => listTasksByPartner(partnerId).filter((t) => (t.scope ?? 'personal') === 'business'), [partnerId, storeVersion]);
  const getStepTasks = (step: string) => tasks.filter((t) => (t.tags ?? []).includes(`business_ladder:${step}`));
  const stepStatus = (step: string) => {
    const ts = getStepTasks(step);
    if (!ts.length) return { done: false, any: false };
    const done = ts.every((t) => t.status === 'completed' || t.status === 'cancelled');
    return { done, any: true };
  };

  const progress = useMemo(() => {
    const steps = BUSINESS_LADDER_TASKS.map((s) => s.step);
    const done = steps.filter((s) => stepStatus(s).done).length;
    const total = steps.length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const next = steps.find((s) => !stepStatus(s).done) ?? null;
    return { done, total, pct, next };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, storeVersion]);

  return (
    <div className="rounded-3xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 md:p-8 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-amber-300">
            <TrendingUp size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">4-step ladder</span>
          </div>
          <div className="mt-2 text-2xl font-light text-white">Business Credit Ladder</div>
          <div className="mt-1 text-white/60 text-sm">
            Fundability → Reports → Initial trade → Revolving/Fleet/Cash. This drives tasks and keeps sequencing clean.
          </div>
        </div>
        <div className="min-w-[220px]">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-white/40">
            <span>Progress</span>
            <span className="text-white/70 font-mono">
              {progress.done}/{progress.total} ({progress.pct}%)
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-amber-500" style={{ width: `${progress.pct}%` }} />
          </div>
          {progress.next ? (
            <button
              type="button"
              onClick={() => {
                const href = BUSINESS_LADDER_TASKS.find((s) => s.step === progress.next)?.href;
                if (href) navigate(href);
              }}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
              title="Open the recommended next step"
            >
              Next step <ArrowRight size={14} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {BUSINESS_LADDER_TASKS.map((s) => {
          const st = stepStatus(s.step);
          const done = st.done;
          return (
            <div key={s.step} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-white font-semibold">{s.title}</div>
                  <div className="mt-1 text-white/60 text-sm">{s.notes}</div>
                </div>
                <div className="shrink-0">{done ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Circle size={18} className="text-white/30" />}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {s.href ? (
                  <button
                    type="button"
                    onClick={() => navigate(s.href!)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                  >
                    Open <ExternalLink size={14} />
                  </button>
                ) : null}
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-[10px] font-black uppercase tracking-widest text-white/50">
                  <Target size={14} /> {getStepTasks(s.step).length} task{getStepTasks(s.step).length === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-[11px] text-white/45">
        Tip: this ladder seeds business-scoped tasks automatically. Track execution in <span className="text-white/70 font-mono">/portal/tasks</span>.
      </div>
    </div>
  );
}

