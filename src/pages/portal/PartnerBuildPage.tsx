import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, TrendingUp, Target, CreditCard, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { BUNDLES, activateBundle } from '../../automation/bundleScheduler';
import { createBundleActivation, getActiveBundleActivation, listBundleActivationsByPartner } from '../../data/productsRepo';
import { listTasksByPartner } from '../../data/tasksRepo';

export default function PartnerBuildPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const [version, setVersion] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const activations = useMemo(() => (partner ? listBundleActivationsByPartner(partner.id) : []), [partner, version]);
  const tasks = useMemo(() => (partner ? listTasksByPartner(partner.id) : []), [partner, version]);
  const upcoming = useMemo(() => {
    return tasks
      .filter((t) => t.status !== 'completed' && t.status !== 'cancelled')
      .slice()
      .sort((a, b) => (a.dueAt || '9999').localeCompare(b.dueAt || '9999'))
      .slice(0, 8);
  }, [tasks]);

  return (
    <PageShell
      badge="Partner Portal"
      title="Credit Building Center"
      subtitle="Strategies and next steps to build and optimize your credit profile beyond disputes."
    >
      {!partner ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 text-white/60">
            No partner profile found. If you're an admin, use Partner Management to pick a partner.
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => navigate('/portal/dashboard')}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft size={16} /> Partner Dashboard
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft size={16} /> Finely Cred
            </button>
          </div>

          {err ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-100 text-sm">{err}</div>
          ) : null}
          {notice ? (
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5 text-emerald-100 text-sm">{notice}</div>
          ) : null}

          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-8 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <TrendingUp className="text-amber-500/60 mb-3" size={40} />
                <h2 className="text-xl font-semibold text-white">Credit building bundles</h2>
                <p className="mt-2 text-white/60 text-sm max-w-2xl">
                  Activate a time-sensitive bundle to generate a full timeline of tasks (with due dates and dependencies).
                  This is designed to be efficient and “application-window aware.”
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/portal/tasks')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
              >
                Open Tasks <ArrowRight size={14} />
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              {BUNDLES.map((b) => {
                const active = getActiveBundleActivation(partner.id, b.id);
                return (
                  <div key={b.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-white font-semibold">{b.title}</div>
                        {b.priceHint ? <div className="mt-1 text-amber-300 text-sm font-mono">{b.priceHint}</div> : null}
                        <div className="mt-2 text-white/60 text-sm">{b.description}</div>
                      </div>
                      {active ? (
                        <div className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-100 text-[10px] font-black uppercase tracking-widest">
                          <CheckCircle2 size={14} /> Active
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                      <div className="text-[10px] uppercase tracking-widest text-white/40">Timeline highlights</div>
                      <ul className="mt-2 space-y-1 text-white/70 text-sm list-disc list-inside">
                        {b.timeline.slice(0, 4).map((t) => (
                          <li key={t.title}>
                            <span className="text-white/80">{t.title}</span>{' '}
                            <span className="text-white/40 font-mono">(due +{t.dueInDays}d)</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{b.id}</div>
                      <button
                        type="button"
                        disabled={Boolean(active)}
                        onClick={() => {
                          setErr(null);
                          setNotice(null);
                          try {
                            const { createdTaskIds } = activateBundle({ partnerId: partner.id, bundleId: b.id });
                            createBundleActivation({ partnerId: partner.id, bundleId: b.id, startAt: new Date().toISOString(), createdTaskIds });
                            setNotice(`Activated bundle. Created ${createdTaskIds.length} timed task(s).`);
                            setVersion((v) => v + 1);
                          } catch (e: any) {
                            setErr(e?.message || 'Activation failed.');
                          }
                        }}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <Sparkles size={14} /> {active ? 'Activated' : 'Activate bundle'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid md:grid-cols-2 gap-4 pt-2">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-3">
                <div className="inline-flex items-center gap-2 text-amber-400">
                  <Clock size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Upcoming tasks</span>
                </div>
                {upcoming.length === 0 ? (
                  <div className="text-white/60 text-sm">No upcoming tasks yet.</div>
                ) : (
                  <div className="space-y-2">
                    {upcoming.map((t) => (
                      <div key={t.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                        <div className="text-white font-semibold truncate">{t.title}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                          {t.kind} • {t.status} • due {t.dueAt ? new Date(t.dueAt).toLocaleDateString() : '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-3">
                <div className="inline-flex items-center gap-2 text-amber-400">
                  <Target size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Active bundle history</span>
                </div>
                {activations.length === 0 ? (
                  <div className="text-white/60 text-sm">No bundles activated yet.</div>
                ) : (
                  <div className="space-y-2">
                    {activations.slice(0, 6).map((a) => (
                      <div key={a.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                        <div className="text-white font-semibold truncate">{a.bundleId}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                          {a.status} • tasks:{a.createdTaskIds.length} • {new Date(a.activatedAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/portal/reports')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
            >
              Credit reports <ArrowRight size={14} />
            </button>
            <button
              onClick={() => navigate('/portal/disputes')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
            >
              Dispute center <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </PageShell>
  );
}
