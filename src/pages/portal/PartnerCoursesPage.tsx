import React, { useMemo } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, GraduationCap, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { getOrCreatePartnerForSession } from '../../portal/getOrCreatePartnerForSession';
import { listPublishedCourses, getCourseProgress } from '../../data/coursesRepo';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';

export default function PartnerCoursesPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const partner = useMemo(() => getOrCreatePartnerForSession({ user: auth.user }), [auth.user]);
  const features = useMemo(() => ({ courses: isFeatureEnabled('courses') }), []);

  const courses = useMemo(() => listPublishedCourses(), []);

  return (
    <PageShell
      badge="Partner Portal"
      title="Courses"
      subtitle="Self-paced curriculum tied to your workflow: disputes, evidence discipline, follow-ups, and build sequencing."
    >
      {!partner ? (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/60">
          No partner profile found for this account. If you’re an admin, use Partner Management to pick a partner.
        </div>
      ) : !features.courses ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-white/80">
          <div className="flex items-center gap-2 text-amber-300">
            <Lock size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">Module gated</span>
          </div>
          <div className="mt-2 text-white/70 text-sm">
            Courses are disabled in settings. Enable them in <span className="font-mono text-white/80">/admin/settings</span> → Features.
          </div>
        </div>
      ) : (
        <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.courses]}>
          <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => navigate('/portal/dashboard')}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft size={16} /> Partner Dashboard
            </button>
            <button
              onClick={() => navigate('/portal/education')}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft size={16} /> Education Library
            </button>
          </div>

          {courses.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/60 text-sm">No published courses yet.</div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {courses.map((c) => {
                const prog = getCourseProgress({ partnerId: partner.id, courseId: c.id });
                const totalLessons = c.modules.reduce((sum, m) => sum + m.lessons.length, 0);
                const done = prog.lessons.filter((l) => l.completedAt).length;
                const pct = totalLessons ? Math.round((done / totalLessons) * 100) : 0;
                return (
                  <div key={c.id} className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3">
                    <div className="inline-flex items-center gap-2 text-amber-400">
                      <GraduationCap size={16} />
                      <span className="text-xs font-semibold uppercase tracking-wider">Course</span>
                    </div>
                    <div className="text-white font-semibold">{c.title}</div>
                    <div className="text-white/60 text-sm line-clamp-2">{c.desc}</div>
                    <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                      modules:{c.modules.length} • lessons:{totalLessons} • complete:{pct}%
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/portal/courses/${c.id}`)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                      >
                        Open <ArrowRight size={14} />
                      </button>
                      {pct === 100 && (
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-200 text-[10px] font-black uppercase tracking-widest">
                          <CheckCircle2 size={14} /> Completed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-white/70 text-sm">
            Tip: Courses are designed to match the portal workflow. Keep your Documents Vault and Tasks page open while you work through lessons.
          </div>
          </div>
        </EntitlementGate>
      )}
    </PageShell>
  );
}

