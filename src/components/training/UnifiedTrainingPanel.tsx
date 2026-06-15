import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Clapperboard, ExternalLink, GraduationCap, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { useAuth } from '../../auth/AuthProvider';
import { isAdminEmail } from '../../auth/admin';
import { listCourseTemplates } from '../../data/courseTemplatesRepo';
import { listPublishedCourses } from '../../data/coursesRepo';
import { getOrCreateEnrollment, getTrainingProgress } from '../../data/trainingProgressRepo';
import type { AgentSpecialtyId } from '../../domain/agentProgram';
import { AGENT_SPECIALTIES, getTrainingModulesForSpecialties } from '../../domain/agentProgram';

const SPECIALTY_TAGS: Record<AgentSpecialtyId, string[]> = {
  personal_restore: ['disputes', 'personal', 'restore'],
  personal_build: ['building', 'personal', 'basics'],
  business_credit: ['business', 'bureaus'],
  debt_legal: ['debt', 'validation'],
  tradelines: ['tradelines', 'au'],
  funding_wealth: ['funding', 'wealth'],
};

type Props = {
  specialties?: AgentSpecialtyId[];
  audience?: 'credit_specialist' | 'affiliate';
};

export function UnifiedTrainingPanel({ specialties = ['personal_restore'], audience = 'credit_specialist' }: Props) {
  const navigate = useNavigate();
  const auth = useAuth();
  const { partner } = usePartnerSession();
  const isAdmin = isAdminEmail(auth.user?.email);
  const [storeVersion, setStoreVersion] = useState(0);

  useEffect(() => {
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    if (partner?.id) getOrCreateEnrollment({ partnerId: partner.id, lane: partner.lane, isAdmin });
  }, [partner?.id, partner?.lane, isAdmin]);

  const academyProgress = useMemo(() => {
    if (!partner) return null;
    return getTrainingProgress({ partnerId: partner.id, lane: partner.lane, isAdmin });
  }, [partner, isAdmin, storeVersion]);

  const modules = getTrainingModulesForSpecialties(specialties.length ? specialties : ['personal_restore']);
  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const id of specialties) {
      for (const t of SPECIALTY_TAGS[id] ?? []) set.add(t);
    }
    if (audience === 'affiliate') {
      set.add('affiliate');
      set.add('marketing');
    }
    return set;
  }, [specialties, audience]);

  const templates = useMemo(() => {
    return listCourseTemplates()
      .filter((t) => t.tags.some((tag) => tags.has(tag)))
      .slice(0, 6);
  }, [tags]);

  const liveCourses = useMemo(() => {
    return listPublishedCourses()
      .filter((c) => (c.tags ?? []).some((tag) => tags.has(tag)))
      .slice(0, 4);
  }, [tags]);

  return (
    <div className="space-y-6">
      <div className="fc-spotlight-panel p-6 space-y-3">
        <div className="inline-flex items-center gap-2 text-amber-300">
          <GraduationCap size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">Finely Training Academy</span>
        </div>
        <p className="text-white/65 text-sm max-w-3xl">
          One signup via onboarding — no separate training account. Everyone completes Core Foundation; your lane unlocks
          a role track. Academy lessons link to the same courses, tours, and SOPs published in Course Builder and Help
          Center.
        </p>
        {academyProgress ? (
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="fc-pill fc-pill-emerald">
              <Shield size={12} /> Core {academyProgress.corePct}%
            </span>
            <span className="fc-pill fc-pill-sky">Role {academyProgress.rolePct}%</span>
            <span className="fc-pill fc-pill-violet">{academyProgress.certifications.length} certs</span>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate('/portal/training/academy')}
            className="fc-button-brand text-xs px-5 py-3"
          >
            Open academy <ExternalLink size={14} />
          </button>
          <button type="button" onClick={() => navigate('/portal/courses')} className="fc-button-soft px-5 py-3">
            Courses LMS
          </button>
          <button type="button" onClick={() => navigate('/portal/education')} className="fc-button-soft px-5 py-3">
            Education library
          </button>
          <button type="button" onClick={() => navigate('/resources')} className="fc-button-soft px-5 py-3">
            Public resources
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-white/45">Specialty checklists</div>
          {modules.slice(0, 4).map((mod) => (
            <div key={mod.id} className="fc-elevated-card p-4 space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <BookOpen size={15} className="text-amber-400" />
                {mod.title}
              </div>
              <p className="text-white/55 text-xs">{mod.description}</p>
              {mod.hubPath ? (
                <button
                  type="button"
                  onClick={() => navigate(mod.hubPath!)}
                  className="text-[10px] font-black uppercase tracking-widest text-emerald-300"
                >
                  Practice in app →
                </button>
              ) : null}
            </div>
          ))}
          <div className="text-[10px] text-white/40 pt-1">
            Specialties: {specialties.map((s) => AGENT_SPECIALTIES.find((a) => a.id === s)?.label ?? s).join(', ')}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-white/45">Course templates (instantiate in admin)</div>
          {templates.length ? (
            templates.map((t) => (
              <div key={t.id} className="fc-elevated-card p-4 flex items-start justify-between gap-3">
                <div>
                  <div className="text-white font-semibold text-sm">{t.title}</div>
                  <div className="text-white/50 text-xs mt-1">{t.description}</div>
                </div>
                <button type="button" onClick={() => navigate('/portal/courses')} className="shrink-0 text-[10px] font-black uppercase tracking-widest text-amber-300">
                  Start
                </button>
              </div>
            ))
          ) : (
            <div className="fc-elevated-card p-4 text-white/50 text-sm">Matching course templates appear when tags align with your specialties.</div>
          )}

          {liveCourses.length ? (
            <>
              <div className="text-[10px] font-black uppercase tracking-widest text-white/45 pt-2">Published courses</div>
              {liveCourses.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => navigate(`/portal/courses/${encodeURIComponent(c.id)}`)}
                  className="w-full text-left fc-elevated-card p-4 hover:border-amber-500/30 transition-all"
                >
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <Clapperboard size={15} className="text-sky-300" />
                    {c.title}
                  </div>
                </button>
              ))}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
