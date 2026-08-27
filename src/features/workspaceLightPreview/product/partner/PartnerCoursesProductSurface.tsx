import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleHelp,
  GraduationCap,
  LayoutGrid,
  ListChecks,
  PlayCircle,
  Sparkles,
  X,
} from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { getCourse, listPublishedCourses, getCourseProgress } from '../../../../data/coursesRepo';
import { listCertificatesByPartner } from '../../../../data/certificatesRepo';
import { isFeatureEnabled } from '../../../../data/settingsRepo';
import { hasEntitlement } from '../../../../data/billingRepo';
import { ENTITLEMENT_KEYS } from '../../../../billing/entitlements';
import { CommsWorkspaceActions } from '../../../../components/comms/CommsWorkspaceActions';
import type { Course } from '../../../../domain/courses';
import type { Certificate } from '../../../../domain/certificates';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductDashboardSkeleton, ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import PartnerCoursePage from '../../../../pages/portal/PartnerCoursePage';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PAGE,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import './partnerWorkstationSurfaceTabs.css';

const METRICS_VARIANT = 'jewel' as const;

type MosaicSection = 'catalog' | 'progress' | 'tips' | 'certificates';

const SECTION_TILES: Array<{
  id: MosaicSection;
  label: string;
  hint: string;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
  icon: React.ComponentType<{ size?: number }>;
}> = [
  { id: 'catalog', label: 'Catalog', hint: 'All published courses', accent: 'emerald', icon: LayoutGrid },
  { id: 'progress', label: 'In progress', hint: 'Pick up where you left off', accent: 'violet', icon: ListChecks },
  { id: 'tips', label: 'Tips', hint: 'Workflow pairing', accent: 'sky', icon: Sparkles },
  { id: 'certificates', label: 'Certificates', hint: 'Proof of completion', accent: 'rose', icon: Award },
];

function formatFreshness(iso?: string): string {
  if (!iso) return 'no course activity yet';
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'just now';
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months <= 1 ? '1 month ago' : `${months} months ago`;
}

type CourseRow = {
  course: Course;
  pct: number;
  done: number;
  totalLessons: number;
  updatedAt: string;
};

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'gated'; reason: 'feature' | 'entitlement' }
  | { status: 'ready'; rows: CourseRow[]; certificates: Certificate[] };

export default function PartnerCoursesProductSurface({ role, pageId, partnerId, entityId, dataMode }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const mapPortalHref = usePartnerProductPathResolver();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? GraduationCap;
  const livePath = mapPortalHref(navItem?.legacyPath ?? '/portal/courses');
  const courseId = entityId || searchParams.get('courseId') || undefined;
  const accent = navItem?.accent ?? 'sky';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const isDemo = dataMode === 'demo' || !partnerId;
  const coursesEnabled = isFeatureEnabled('courses');

  const sectionParam = searchParams.get('section') as MosaicSection | null;
  const [section, setSection] = useState<MosaicSection>(sectionParam && SECTION_TILES.some((t) => t.id === sectionParam) ? sectionParam : 'catalog');

  const openCourse = (id: string) => {
    if (pathname.startsWith('/preview/workspace-light')) {
      navigate(`${livePath}?courseId=${encodeURIComponent(id)}`);
      return;
    }
    navigate(`/portal/courses/${encodeURIComponent(id)}`);
  };
  const closeCourse = () => navigate(livePath);

  const selectSection = (id: MosaicSection) => {
    setSection(id);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('section', id);
      return next;
    });
  };

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    setState({ status: 'loading' });
    try {
      if (!coursesEnabled) {
        if (!cancelled) setState({ status: 'gated', reason: 'feature' });
        return;
      }
      if (!partnerId || !hasEntitlement(partnerId, ENTITLEMENT_KEYS.courses)) {
        if (!cancelled) setState({ status: 'gated', reason: 'entitlement' });
        return;
      }
      const courses = listPublishedCourses();
      const rows: CourseRow[] = courses.map((course) => {
        const progress = getCourseProgress({ partnerId: partnerId!, courseId: course.id });
        const totalLessons = course.modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
        const done = progress.lessons.filter((lesson) => lesson.completedAt).length;
        const pct = totalLessons ? Math.round((done / totalLessons) * 100) : 0;
        return { course, pct, done, totalLessons, updatedAt: progress.updatedAt };
      });
      const certificates = listCertificatesByPartner(partnerId!);
      if (!cancelled) setState({ status: 'ready', rows, certificates });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load your courses right now.';
      if (!cancelled) setState({ status: 'error', message });
    }
    return () => {
      cancelled = true;
    };
  }, [coursesEnabled, isDemo, partnerId, retryToken]);

  const demoSpec = useMemo(() => getWorkspaceProductPageSpec('partner', pageId), [pageId]);

  const demoRows: CourseRow[] = useMemo(() => {
    const courses = listPublishedCourses();
    return courses.slice(0, 6).map((course, idx) => ({
      course,
      pct: idx === 0 ? 45 : idx === 1 ? 100 : 0,
      done: idx === 0 ? 3 : idx === 1 ? 8 : 0,
      totalLessons: 8,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const askFinelyPrompt = 'Which course should I finish next?';
  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button type="button" onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: navItem?.label ?? 'Learn' })}>
        <CircleHelp size={15} /> Ask Finely
      </button>
      <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
        <PlayCircle size={15} /> Watch how
      </button>
    </div>
  );

  const renderCourseCard = (row: CourseRow, idx: number) => {
    const { course, pct, done, totalLessons } = row;
    const cardAccent = (['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4];
    return (
      <div key={course.id} className={`${finelyOsCatalogCard(cardAccent)} fc-surface-harmony space-y-3 p-6`} data-fc-accent={cardAccent}>
        <div className="inline-flex items-center gap-2 text-violet-300">
          <GraduationCap size={16} />
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Course</span>
        </div>
        <div className={FINELY_OS_ENTITY_VALUE}>{course.title}</div>
        <div className={`${FINELY_OS_ENTITY_BODY} line-clamp-2`}>{course.desc}</div>
        <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
          modules:{course.modules.length} • lessons:{totalLessons} • complete:{pct}%
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => openCourse(course.id)} className={FINELY_OS_SUCCESS_BTN}>
            Open <ArrowRight size={14} />
          </button>
          {pct === 100 ? (
            <span className={`inline-flex items-center gap-2 ${finelyOsStatusChip('ok')}`}>
              <CheckCircle2 size={14} /> Completed
            </span>
          ) : null}
        </div>
      </div>
    );
  };

  const renderMosaic = (rows: CourseRow[], certificates: Certificate[], demoMode: boolean) => {
    const startedRows = rows.filter((row) => row.pct > 0);
    const inProgressRows = rows.filter((row) => row.pct > 0 && row.pct < 100);
    const completedRows = rows.filter((row) => row.pct === 100);
    const sectionCounts: Record<MosaicSection, number | string> = {
      catalog: rows.length,
      progress: inProgressRows.length,
      tips: 'Guide',
      certificates: certificates.length,
    };

    return (
      <section className={`fc-wlp-section ${FINELY_OS_PAGE} space-y-6`} data-surface-layout="journey-runway">
        <CommsWorkspaceActions variant="inline" />

        <div className="fc-wlp-courses-runway">
          <div className="min-w-0">
            <div className="fc-wlp-courses-runway-track" role="tablist" aria-label="Learning path">
              {SECTION_TILES.map((tile) => {
                const Icon = tile.icon;
                const active = section === tile.id;
                return (
                  <button
                    key={tile.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => selectSection(tile.id)}
                    className="fc-wlp-courses-runway-stop"
                    data-active={active ? 'true' : undefined}
                    data-fcm-accent={tile.accent}
                  >
                    <span className="fc-wlp-courses-runway-marker">
                      <Icon size={16} />
                    </span>
                    <strong>{tile.label}</strong>
                    <p>{sectionCounts[tile.id]} · {tile.hint}</p>
                  </button>
                );
              })}
            </div>

            <div className={`fc-wlp-courses-runway-stage ${finelyOsCatalogCard(
              section === 'catalog' ? 'emerald' : section === 'progress' ? 'violet' : section === 'tips' ? 'sky' : 'rose',
            )}`} data-fc-accent={section === 'catalog' ? 'emerald' : section === 'progress' ? 'violet' : section === 'tips' ? 'sky' : 'rose'}>
              {section === 'catalog' ? (
                rows.length === 0 ? (
                  <ProductEmptyState
                    title="No published courses yet"
                    description="Check back soon — new courses will appear here as they are published."
                    action={
                      <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(mapPortalHref('/portal/education'))}>
                        Visit education library
                      </button>
                    }
                  />
                ) : (
                  <FinelyOsPaginatedStack
                    items={rows}
                    pageSize={6}
                    itemSpacingClassName="grid md:grid-cols-2 xl:grid-cols-3 gap-4"
                    renderItem={(row, idx) => renderCourseCard(row, idx)}
                  />
                )
              ) : null}

              {section === 'progress' ? (
                inProgressRows.length === 0 ? (
                  <div className={FINELY_OS_ENTITY_BODY}>
                    No courses started yet — open one from the catalog.
                    {!demoMode ? (
                      <button type="button" onClick={() => selectSection('catalog')} className={`${FINELY_OS_SUCCESS_BTN} mt-4`}>
                        Browse catalog <ArrowRight size={14} />
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {inProgressRows.map((row, idx) => renderCourseCard(row, idx))}
                  </div>
                )
              ) : null}

              {section === 'tips' ? (
                <div className={`fc-surface-harmony ${FINELY_OS_ENTITY_BODY} space-y-4`}>
                  <p className="text-base font-bold">
                    Keep Documents Vault and My Tasks open while you work through lessons.
                  </p>
                  <p className="text-base font-bold">
                    After each lesson, check My Tasks for checklist items the course spawned for you.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => navigate(mapPortalHref('/portal/my-tasks'))} className={FINELY_OS_SUCCESS_BTN}>
                      Open my tasks <ArrowRight size={14} />
                    </button>
                    <button type="button" onClick={() => navigate(mapPortalHref('/portal/documents'))} className="fc-wlp-btn-secondary">
                      Documents vault
                    </button>
                  </div>
                  {startedRows.length > 0 ? (
                    <p className={FINELY_OS_ENTITY_SUBLABEL}>
                      You have {inProgressRows.length} course{inProgressRows.length === 1 ? '' : 's'} in progress and {completedRows.length} completed.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {section === 'certificates' ? (
                certificates.length === 0 ? (
                  <ProductEmptyState
                    title="No certificates yet"
                    description="Finish a course to earn downloadable proof of completion."
                    action={
                      <button type="button" className="fc-wlp-btn-primary" onClick={() => selectSection('catalog')}>
                        Browse catalog
                      </button>
                    }
                  />
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {certificates.map((cert, idx) => (
                      <div key={cert.id} className={`${finelyOsCatalogCard((['rose', 'violet', 'emerald'] as const)[idx % 3])} p-6 space-y-2`} data-fc-accent={(['rose', 'violet', 'emerald'] as const)[idx % 3]}>
                        <div className="inline-flex items-center gap-2"><Award size={16} /><span className={FINELY_OS_ENTITY_SUBLABEL}>Certificate</span></div>
                        <div className={FINELY_OS_ENTITY_VALUE}>{cert.courseTitle ?? cert.courseId}</div>
                        <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>Issued {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : '—'}</div>
                      </div>
                    ))}
                  </div>
                )
              ) : null}
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-4">
            <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-3`} data-fc-accent="emerald">
              <div className="fc-wlp-eyebrow">What to do next</div>
              <h2 className="text-2xl font-extrabold">Finish what you started</h2>
              <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                {inProgressRows.length
                  ? `Continue ${inProgressRows[0]?.course.title ?? 'your course'}.`
                  : 'Open a course from the catalog to begin.'}
              </p>
              {guideActions}
            </div>
            <div className={`${finelyOsCatalogCard('violet')} p-6 space-y-3`} data-fc-accent="violet">
              <GraduationCap size={20} />
              <p className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                {completedRows.length} completed · {inProgressRows.length} in progress
              </p>
              <button type="button" onClick={() => navigate(mapPortalHref('/portal/education'))} className="fc-wlp-btn-secondary">
                Education library
              </button>
            </div>
          </aside>
        </div>
      </section>
    );
  };

  const buildMetrics = (rows: CourseRow[], certificates: Certificate[]): ProductMetric[] => {
    const startedRows = rows.filter((row) => row.pct > 0);
    const inProgressRows = rows.filter((row) => row.pct > 0 && row.pct < 100);
    const completedRows = rows.filter((row) => row.pct === 100);
    const nextUp = [...inProgressRows].sort((a, b) => b.pct - a.pct)[0] ?? null;
    return [
      { label: 'Courses started', value: startedRows.length, hint: `${rows.length} published`, accent: 'sky', icon: BookOpen, onClick: () => selectSection('catalog') },
      { label: 'In progress', value: inProgressRows.length, hint: nextUp ? `${nextUp.course.title} · ${nextUp.pct}%` : 'Nothing in progress', accent: 'violet', icon: GraduationCap, onClick: () => selectSection('progress') },
      { label: 'Completed', value: completedRows.length, hint: completedRows.length ? 'Course finished' : 'None finished yet', accent: 'emerald', icon: CheckCircle2, onClick: () => selectSection('progress') },
      { label: 'Certificates issued', value: certificates.length, hint: certificates.length ? 'Downloadable proof' : 'Earn by finishing', accent: 'rose', icon: Award, onClick: () => selectSection('certificates') },
    ];
  };

  if (isDemo) {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow={demoSpec?.eyebrow ?? 'Learn'}
        title={demoSpec?.title ?? 'Self-paced lessons tied directly to your dispute workflow.'}
        description={demoSpec?.description ?? 'Every course maps to a real step in your case, not generic credit theory.'}
        status={`${demoSpec?.status ?? '1 course in progress'} · demo data`}
        freshness="demo snapshot"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        metricsVariant={METRICS_VARIANT}
        primaryAction={<ProductPagePrimaryAction label={demoSpec?.primaryLabel ?? 'Open courses'} onClick={() => navigate(livePath)} />}
        metrics={demoSpec?.metrics.map((metric) => ({ ...metric, onClick: () => navigate(livePath) }))}
        metricTitle={demoSpec?.metricTitle}
        metricDescription={demoSpec?.metricDescription}
      >
        {renderMosaic(demoRows, [], true)}
        <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
      </ProductHubScaffold>
    );
  }

  if (state.status === 'loading') {
    return <ProductDashboardSkeleton label="Loading your courses" />;
  }

  if (state.status === 'gated') {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow="Learn"
        title="Self-paced lessons tied directly to your dispute workflow."
        description="Every course maps to a real step in your case, not generic credit theory."
        status={state.reason === 'feature' ? 'Courses disabled' : 'Not included in your plan'}
        freshness="just now"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        primaryAction={<ProductPagePrimaryAction label="View billing" onClick={() => navigate(mapPortalHref('/portal/billing'))} />}
      >
        <div className={`${FINELY_OS_NOTICE_WARN} space-y-2 p-4`}>
          <div className={FINELY_OS_ENTITY_BODY}>
            {state.reason === 'feature'
              ? 'Courses are disabled in settings. Enable them in admin settings → Features.'
              : 'Courses are not included in your current plan. Upgrade in billing to unlock the catalog.'}
          </div>
        </div>
      </ProductHubScaffold>
    );
  }

  if (state.status === 'error') {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow="Learn"
        title="Self-paced lessons tied directly to your dispute workflow."
        description="Every course maps to a real step in your case, not generic credit theory."
        status="Could not load your courses"
        freshness="just now"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        primaryAction={<ProductPagePrimaryAction label="Try again" onClick={() => setRetryToken((v) => v + 1)} />}
      >
        <ProductEmptyState
          title="We couldn't load your courses"
          description={state.message}
          action={
            <button type="button" className="fc-wlp-btn-primary" onClick={() => setRetryToken((v) => v + 1)}>
              Try again
            </button>
          }
        />
      </ProductHubScaffold>
    );
  }

  const { rows, certificates } = state;
  const inspectorCourse = courseId ? getCourse(courseId) : null;
  const inProgressRows = rows.filter((row) => row.pct > 0 && row.pct < 100);
  const nextUp = [...inProgressRows].sort((a, b) => b.pct - a.pct)[0] ?? null;
  const latestActivity = [...rows].map((row) => row.updatedAt).sort().reverse()[0];
  const metrics = buildMetrics(rows, certificates);

  const statusHeadline = nextUp
    ? `${nextUp.course.title} at ${nextUp.pct}%`
    : rows.length > 0
      ? `${rows.length} course${rows.length === 1 ? '' : 's'} available`
      : 'No published courses';

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Learn"
      title="Self-paced lessons tied directly to your dispute workflow."
      description="Every course maps to a real step in your case, not generic credit theory."
      status={`${statusHeadline} · live data`}
      freshness={formatFreshness(latestActivity)}
      accent={accent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      metricsVariant={METRICS_VARIANT}
      primaryAction={
        <ProductPagePrimaryAction
          label={nextUp ? `Continue ${nextUp.course.title}` : 'Open courses'}
          onClick={() => (nextUp ? openCourse(nextUp.course.id) : selectSection('catalog'))}
        />
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(mapPortalHref('/portal/education'))}>
          View education library
        </button>
      }
      metrics={metrics}
      metricTitle="Learning progress"
      metricDescription="Started, in-progress, completed, and certificates — so you always know what to pick up next."
    >
      {renderMosaic(rows, certificates, false)}
      <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
      {courseId ? (
        <div className="fc-wlp-local-modal-overlay" role="dialog" aria-modal="true" aria-label="Course inspector" onClick={closeCourse}>
          <div className="fc-wlp-local-modal fc-wlp-wide-drawer fc-wlp-course-record-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-sky-300 m-0">Course inspector</p>
                <h3 className="text-lg font-extrabold text-white m-0 mt-1">{inspectorCourse?.title ?? 'Course lessons'}</h3>
              </div>
              <button type="button" className="fc-wlp-btn-secondary !py-1.5 !px-2.5 !text-xs" onClick={closeCourse} aria-label="Close course inspector">
                <X size={14} /> Close
              </button>
            </div>
            <div className="max-h-[75vh] overflow-y-auto pr-1">
              <PartnerCoursePage embedded />
            </div>
          </div>
        </div>
      ) : null}
    </ProductHubScaffold>
  );
}
