import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, GraduationCap, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { listPublishedCourses, getCourseProgress } from '../../data/coursesRepo';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { CommsWorkspaceActions } from '../../components/comms/CommsWorkspaceActions';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PAGE,
  FINELY_OS_SUCCESS_BTN,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

type CoursesTab = 'catalog' | 'progress' | 'tips';

export default function PartnerCoursesPage() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const [tab, setTab] = useState<CoursesTab>('catalog');
  const features = useMemo(() => ({ courses: isFeatureEnabled('courses') }), []);

  const courses = useMemo(() => listPublishedCourses(), []);

  const progressRows = useMemo(() => {
    if (!partner) return [];
    return courses
      .map((c) => {
        const prog = getCourseProgress({ partnerId: partner.id, courseId: c.id });
        const totalLessons = c.modules.reduce((sum, m) => sum + m.lessons.length, 0);
        const done = prog.lessons.filter((l) => l.completedAt).length;
        const pct = totalLessons ? Math.round((done / totalLessons) * 100) : 0;
        return { course: c, pct, done, totalLessons };
      })
      .filter((r) => r.pct > 0);
  }, [courses, partner]);

  const completedCount = progressRows.filter((r) => r.pct === 100).length;

  const renderCourseCard = (c: (typeof courses)[0], partnerId: string) => {
    const prog = getCourseProgress({ partnerId, courseId: c.id });
    const totalLessons = c.modules.reduce((sum, m) => sum + m.lessons.length, 0);
    const done = prog.lessons.filter((l) => l.completedAt).length;
    const pct = totalLessons ? Math.round((done / totalLessons) * 100) : 0;
    return (
      <div key={c.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
        <div className="inline-flex items-center gap-2 text-violet-300">
          <GraduationCap size={16} />
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Course</span>
        </div>
        <div className={FINELY_OS_ENTITY_VALUE}>{c.title}</div>
        <div className={`${FINELY_OS_ENTITY_BODY} line-clamp-2`}>{c.desc}</div>
        <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
          modules:{c.modules.length} • lessons:{totalLessons} • complete:{pct}%
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => navigate(`/portal/courses/${c.id}`)} className={FINELY_OS_SUCCESS_BTN}>
            Open <ArrowRight size={14} />
          </button>
          {pct === 100 && (
            <span className={`inline-flex items-center gap-2 ${finelyOsStatusChip('ok')}`}>
              <CheckCircle2 size={14} /> Completed
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <PageShell
      badge="Partner Portal"
      title="Courses"
      subtitle="Self-paced curriculum tied to your workflow: disputes, evidence discipline, follow-ups, and build sequencing."
    >
      {!partner ? (
        <div className={`${FINELY_OS_LUXURY_EMPTY} text-left`}>
          No partner profile found for this account. If you&apos;re an admin, use Partner Management to pick a partner.
        </div>
      ) : !features.courses ? (
        <div className={`${FINELY_OS_NOTICE_WARN} space-y-2`}>
          <div className="inline-flex items-center gap-2 text-fuchsia-200">
            <Lock size={18} />
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Module gated</span>
          </div>
          <div className={FINELY_OS_ENTITY_BODY}>
            Courses are disabled in settings. Enable them in <span className={`font-mono ${FINELY_OS_ENTITY_VALUE}`}>/admin/settings</span> → Features.
          </div>
        </div>
      ) : (
        <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.courses]}>
          <div className={FINELY_OS_PAGE}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button type="button" onClick={() => navigate('/portal/dashboard')} className={FINELY_OS_BACK_LINK}>
                <ArrowLeft size={16} /> Partner Dashboard
              </button>
              <button type="button" onClick={() => navigate('/portal/education')} className={FINELY_OS_BACK_LINK}>
                <ArrowLeft size={16} /> Education Library
              </button>
            </div>

            <CommsWorkspaceActions variant="inline" />

            <FinelyUnifiedHubLayout
              eyebrow="Courses"
              title="Self-paced curriculum for your lane"
              subtitle="Lessons tied to disputes, evidence discipline, and funding readiness — keep Documents and Tasks open while you learn."
              accent="violet"
              kpis={[
                { label: 'Published', value: String(courses.length), hint: 'Catalog', accent: 'violet' },
                { label: 'In progress', value: String(progressRows.length), hint: 'Started', accent: 'amber' },
                { label: 'Completed', value: String(completedCount), hint: 'Finished', accent: 'emerald' },
                { label: 'Stage', value: partner.journeyStage ?? 'intake', hint: 'Journey', accent: 'sky' },
              ]}
              tabs={[
                { id: 'catalog', label: 'Catalog', badge: courses.length || undefined },
                { id: 'progress', label: 'In progress', badge: progressRows.length || undefined },
                { id: 'tips', label: 'Tips' },
              ]}
              activeTab={tab}
              onTabChange={(id) => setTab(id as CoursesTab)}
              primaryAction={{ label: 'Education hub', onClick: () => navigate('/portal/education') }}
              secondaryAction={{ label: 'Documents vault', onClick: () => navigate('/portal/documents') }}
            >
              {tab === 'catalog' && (
                <>
                  {courses.length === 0 ? (
                    <div className={`${FINELY_OS_LUXURY_EMPTY} text-sm`}>No published courses yet.</div>
                  ) : (
                    <FinelyOsPaginatedStack
                      items={courses}
                      pageSize={6}
                      itemSpacingClassName="grid md:grid-cols-2 xl:grid-cols-3 gap-4"
                      renderItem={(c) => renderCourseCard(c, partner.id)}
                    />
                  )}
                </>
              )}

              {tab === 'progress' && (
                <>
                  {progressRows.length === 0 ? (
                    <div className={`${FINELY_OS_ENTITY_BODY} text-sm`}>No courses started yet — open one from the catalog.</div>
                  ) : (
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {progressRows.map(({ course }) => renderCourseCard(course, partner.id))}
                    </div>
                  )}
                </>
              )}

              {tab === 'tips' && (
                <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony ${FINELY_OS_ENTITY_BODY} space-y-3`}>
                  <p>Courses are designed to match the portal workflow. Keep your Documents Vault and Tasks page open while you work through lessons.</p>
                  <p>After each lesson, check My Tasks for any checklist items the course agent spawned for you.</p>
                  <button type="button" onClick={() => navigate('/portal/my-tasks')} className={FINELY_OS_SUCCESS_BTN}>
                    Open my tasks <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </FinelyUnifiedHubLayout>

            <FinelyOsPageFooter />
          </div>
        </EntitlementGate>
      )}
    </PageShell>
  );
}
