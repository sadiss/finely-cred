import React, { useMemo } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, GraduationCap, Library, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { getOrCreatePartnerForSession } from '../../portal/getOrCreatePartnerForSession';
import { isFeatureEnabled } from '../../data/settingsRepo';

export default function PartnerEducationPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const partner = useMemo(() => getOrCreatePartnerForSession({ user: auth.user }), [auth.user]);

  return (
    <PageShell
      badge="Partner Portal"
      title="Education Library"
      subtitle="The playbook behind the workflow: credit models, dispute rounds, and funding-readiness sequencing."
    >
      {!partner ? (
        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 text-white/60">
          No partner profile found for this account. If you’re an admin, use Partner Management to pick a partner.
        </div>
      ) : (
        <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate('/portal/dashboard')}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
            title="Back to Partner Dashboard"
          >
            <ArrowLeft size={16} /> Partner Dashboard
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
            title="Back to Finely Cred Dashboard"
          >
            <ArrowLeft size={16} /> Finely Cred
          </button>
        </div>
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-4">
            <div className="inline-flex items-center gap-2 text-amber-400">
              <GraduationCap size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Core curriculum</span>
            </div>
            <div className="space-y-3 text-white/70 text-sm">
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="text-white font-semibold">Dispute rounds: Round 1 → Round 2 → Round 3</div>
                <div className="mt-1 text-white/60">
                  What changes each round, how follow-up windows work, and why documentation discipline matters.
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="text-white font-semibold">Utilization mechanics</div>
                <div className="mt-1 text-white/60">Statement date vs due date and why reporting timing changes outcomes.</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="text-white font-semibold">Funding readiness sequencing</div>
                <div className="mt-1 text-white/60">How we stage personal → business → advanced layers to avoid avoidable denials.</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
            <div className="inline-flex items-center gap-2 text-amber-400">
              <Scale size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Score models</span>
            </div>
            <div className="space-y-3 text-white/70 text-sm">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="text-white font-semibold">FICO 8</div>
                <div className="mt-1 text-white/60">Common “general lending” score used across many products (varies by lender).</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="text-white font-semibold">Mortgage classic scores</div>
                <div className="mt-1 text-white/60">
                  Many mortgage underwrites still use older FICO versions by bureau: Equifax FICO 5, Experian FICO 2, TransUnion FICO 4.
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="text-white font-semibold">VantageScore (3.0 / 4.0)</div>
                <div className="mt-1 text-white/60">Common in monitoring apps; underwriting may differ by lender/product.</div>
              </div>
              <div className="text-[11px] text-white/50">
                Educational content only. Lenders can use different models by product, channel, and partner bank.
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/portal/courses')}
            className="text-left rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-all p-6"
            disabled={!isFeatureEnabled('courses')}
            title={!isFeatureEnabled('courses') ? 'Courses are disabled in settings' : undefined}
          >
            <div className="flex items-center gap-3 text-amber-400">
              <GraduationCap size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Courses</span>
            </div>
            <p className="mt-3 text-white/70 text-sm">
              Self-paced lessons tied to disputes, evidence discipline, and funding readiness.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
              Open courses <ArrowRight size={12} />
            </div>
          </button>

          <button
            onClick={() => navigate('/resources')}
            className="text-left rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-all p-6"
          >
            <div className="flex items-center gap-3 text-amber-400">
              <Library size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Resource library</span>
            </div>
            <p className="mt-3 text-white/70 text-sm">Guides, templates, and reference materials.</p>
            <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
              Open library <ArrowRight size={12} />
            </div>
          </button>

          <button
            onClick={() => navigate('/bookstore')}
            className="text-left rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-all p-6"
          >
            <div className="flex items-center gap-3 text-amber-400">
              <BookOpen size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Bookstore</span>
            </div>
            <p className="mt-3 text-white/70 text-sm">E-books and premium resources.</p>
            <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
              Browse titles <ArrowRight size={12} />
            </div>
          </button>
        </div>
      </div>
      )}
    </PageShell>
  );
}

