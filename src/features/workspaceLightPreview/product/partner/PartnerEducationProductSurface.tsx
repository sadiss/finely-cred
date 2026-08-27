import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CircleHelp,
  GraduationCap,
  Headphones,
  Library,
  PlayCircle,
  Scale,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { isFeatureEnabled } from '../../../../data/settingsRepo';
import { listFreeGuidesEffective } from '../../../../data/freeGuidesRepo';
import { CommsWorkspaceActions } from '../../../../components/comms/CommsWorkspaceActions';
import { GuideAudioPlayer } from '../../../../components/resources/GuideAudioPlayer';
import { getGuideNarration } from '../../../../resources/guideNarration';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import { recommendedLessonForJourneyStage } from '../../../../lib/partnerEducationCurriculum';
import { LAUNCH_ROLE_COURSES } from '../../../../config/launchRoleCourses';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
} from '../../../os/finelyOsLightUi';

const METRICS_VARIANT = 'jewel' as const;

type EduZone = 'curriculum' | 'guides' | 'explore';

const CURRICULUM_TOPICS = [
  {
    id: 'dispute-rounds',
    title: 'Dispute rounds: Round 1 → Round 2 → Round 3',
    body: 'What changes each round, how follow-up windows work, and why documentation discipline matters.',
    accent: 'emerald' as const,
  },
  {
    id: 'utilization',
    title: 'Utilization mechanics',
    body: 'Statement date vs due date and why reporting timing changes outcomes.',
    accent: 'violet' as const,
  },
  {
    id: 'funding',
    title: 'Funding readiness sequencing',
    body: 'How we stage personal → business → advanced layers to avoid avoidable denials.',
    accent: 'rose' as const,
  },
] as const;

const SCORE_MODELS = [
  { id: 'fico8', title: 'FICO 8', body: 'Common general lending score used across many products (varies by lender).' },
  {
    id: 'mortgage',
    title: 'Mortgage classic scores',
    body: 'Many mortgage underwrites use older FICO versions by bureau: Equifax FICO 5, Experian FICO 2, TransUnion FICO 4.',
  },
  {
    id: 'vantage',
    title: 'VantageScore (3.0 / 4.0)',
    body: 'Common in monitoring apps; underwriting may differ by lender/product.',
  },
] as const;

const NAV_ZONES: Array<{
  id: EduZone;
  label: string;
  hint: string;
  accent: 'emerald' | 'violet' | 'sky';
  icon: React.ComponentType<{ size?: number }>;
}> = [
  { id: 'curriculum', label: 'Curriculum', hint: 'Core topics', accent: 'emerald', icon: GraduationCap },
  { id: 'guides', label: 'Field guides', hint: 'Published playbooks', accent: 'violet', icon: BookOpen },
  { id: 'explore', label: 'Explore', hint: 'More learning rooms', accent: 'sky', icon: Library },
];

export default function PartnerEducationProductSurface({
  role,
  pageId,
  partnerId,
  dataMode,
}: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const { partner: sessionPartner } = usePartnerSession();
  const partner = partnerId ? sessionPartner : sessionPartner;
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? BookOpen;
  const accent = navItem?.accent ?? 'emerald';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const archetype = getWorkspaceProductArchetype(role, pageId);
  const isDemo = dataMode === 'demo' || !partnerId;

  const [zone, setZone] = useState<EduZone>('curriculum');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(CURRICULUM_TOPICS[0].id);
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [storeVersion, setStoreVersion] = useState(0);
  const [audioGuideId, setAudioGuideId] = useState<string | null>(null);

  useEffect(() => {
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const guides = useMemo(() => listFreeGuidesEffective(), [storeVersion]);
  const libraryGuides = useMemo(() => guides.filter((g) => g.id !== 'credit-dispute-letter-guide'), [guides]);
  const audioGuide = useMemo(() => guides.find((g) => g.id === audioGuideId) ?? null, [guides, audioGuideId]);
  const audioNarration = useMemo(
    () => (audioGuide ? getGuideNarration(audioGuide.id, audioGuide.title, audioGuide.sections) : null),
    [audioGuide],
  );

  const recommendedLesson = useMemo(
    () => recommendedLessonForJourneyStage(partner?.journeyStage),
    [partner?.journeyStage],
  );

  const partnerCourses = useMemo(
    () =>
      LAUNCH_ROLE_COURSES.filter(
        (c) =>
          c.role.toLowerCase().includes('partner') ||
          c.role.toLowerCase().includes('compliance'),
      ),
    [],
  );

  const selectedTopic = CURRICULUM_TOPICS.find((t) => t.id === selectedTopicId) ?? CURRICULUM_TOPICS[0];
  const selectedGuide = libraryGuides.find((g) => g.id === (selectedGuideId ?? libraryGuides[0]?.id)) ?? null;

  useEffect(() => {
    if (libraryGuides.length > 0 && !selectedGuideId) {
      setSelectedGuideId(libraryGuides[0]!.id);
    }
  }, [libraryGuides, selectedGuideId]);

  const askFinelyPrompt = 'What should I learn for my current restore step?';

  const metrics: ProductMetric[] = [
    {
      label: 'Field guides',
      value: isDemo ? 8 : libraryGuides.length,
      hint: 'Published playbooks',
      accent: 'emerald',
      icon: BookOpen,
      onClick: () => setZone('guides'),
    },
    {
      label: 'Curriculum',
      value: '3 tracks',
      hint: 'Core topics',
      accent: 'violet',
      icon: GraduationCap,
      onClick: () => setZone('curriculum'),
    },
    {
      label: 'Score models',
      value: '4',
      hint: 'Explained plainly',
      accent: 'sky',
      icon: Scale,
      onClick: () => setZone('curriculum'),
    },
    {
      label: 'Stage',
      value: partner?.journeyStage ?? 'intake',
      hint: 'Your journey',
      accent: 'rose',
      icon: GraduationCap,
      onClick: () => navigate(mapPortalHref('/portal/dashboard')),
    },
  ];

  const renderCurriculumInspector = () => (
    <div className="space-y-6">
      <div className={`${finelyOsCatalogCard(selectedTopic.accent)} p-6 lg:p-8 space-y-4`} data-fc-accent={selectedTopic.accent}>
        <div className="fc-wlp-eyebrow">Selected lesson</div>
        <h2 className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{selectedTopic.title}</h2>
        <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{selectedTopic.body}</p>
        <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate(mapPortalHref(recommendedLesson.path))}>
          Open recommended lesson <ArrowRight size={14} />
        </button>
      </div>

      <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-4`} data-fc-accent="sky">
        <div className="inline-flex items-center gap-2">
          <Scale size={18} className="text-sky-300" />
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Score models</span>
        </div>
        <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>What lenders may pull — educational content only.</p>
        <div className="grid md:grid-cols-3 gap-4">
          {SCORE_MODELS.map((item, idx) => {
            const cardAccent = (['emerald', 'violet', 'rose'] as const)[idx % 3];
            return (
              <div key={item.id} className={`${finelyOsCatalogCard(cardAccent)} p-4 lg:p-5`} data-fc-accent={cardAccent}>
                <div className={`font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{item.title}</div>
                <p className={`mt-2 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{item.body}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="fc-wlp-eyebrow">Launch training tracks</div>
        <div className="grid md:grid-cols-2 gap-4">
          {partnerCourses.map((course, idx) => {
            const cardAccent = (['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4];
            return (
              <div key={course.id} className={`${finelyOsCatalogCard(cardAccent)} p-6 lg:p-8 space-y-3`} data-fc-accent={cardAccent}>
                <em className={FINELY_OS_ENTITY_SUBLABEL}>{course.role}</em>
                <div className={`text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{course.title}</div>
                <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{course.desc}</p>
                <button type="button" className={FINELY_OS_SUCCESS_BTN} onClick={() => navigate(mapPortalHref(course.hubPath))}>
                  Open track <ArrowRight size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderGuidesInspector = () => {
    if (!selectedGuide) {
      return (
        <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8`} data-fc-accent="violet">
          <ProductEmptyState title="No field guides published yet" description="New guides appear here when they are published." />
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-4`} data-fc-accent="violet">
          <div className="fc-wlp-eyebrow">Field guide</div>
          <h2 className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{selectedGuide.title}</h2>
          <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{selectedGuide.desc}</p>
          <button
            type="button"
            className={FINELY_OS_SECONDARY_BTN}
            onClick={() => setAudioGuideId(audioGuideId === selectedGuide.id ? null : selectedGuide.id)}
          >
            <Headphones size={14} /> {audioGuideId === selectedGuide.id ? 'Hide narration' : 'Listen'}
          </button>
          {audioGuideId === selectedGuide.id && audioGuide?.id === selectedGuide.id && audioNarration ? (
            <GuideAudioPlayer narration={audioNarration} autoPlayPreview />
          ) : null}
        </div>
        <FinelyOsPaginatedStack
          items={libraryGuides.filter((g) => g.id !== selectedGuide.id)}
          pageSize={4}
          itemSpacingClassName="grid md:grid-cols-2 gap-4"
          emptyMessage=""
          renderItem={(g, idx) => {
            const cardAccent = (['emerald', 'sky', 'rose'] as const)[idx % 3];
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGuideId(g.id)}
                className={`text-left w-full ${finelyOsCatalogCard(cardAccent)} p-4 lg:p-5 transition-all hover:opacity-100 opacity-90`}
                data-fc-accent={cardAccent}
              >
                <div className={`font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{g.title}</div>
                <p className={`mt-1 text-sm font-bold ${FINELY_OS_ENTITY_BODY} line-clamp-2`}>{g.desc}</p>
              </button>
            );
          }}
        />
      </div>
    );
  };

  const renderExploreInspector = () => (
    <div className="grid md:grid-cols-2 gap-4">
      {[
        {
          title: 'Courses',
          body: 'Self-paced lessons tied to disputes, evidence discipline, and funding readiness.',
          accent: 'emerald' as const,
          icon: GraduationCap,
          path: '/portal/courses',
          disabled: !isFeatureEnabled('courses'),
        },
        {
          title: 'Resource library',
          body: 'Guides, templates, and reference materials.',
          accent: 'violet' as const,
          icon: Library,
          path: '/resources',
        },
        {
          title: 'Bookstore',
          body: 'E-books and premium resources.',
          accent: 'sky' as const,
          icon: BookOpen,
          path: '/bookstore',
        },
        {
          title: 'Training academy',
          body: 'Structured program for depth beyond quick lessons.',
          accent: 'rose' as const,
          icon: GraduationCap,
          path: '/portal/training/academy',
        },
      ].map((item) => (
        <button
          key={item.title}
          type="button"
          disabled={item.disabled}
          className={`text-left ${finelyOsCatalogCard(item.accent)} p-6 lg:p-8 min-h-[200px] flex flex-col justify-between transition-all hover:opacity-100 opacity-90 disabled:opacity-50`}
          data-fc-accent={item.accent}
          onClick={() => navigate(mapPortalHref(item.path))}
        >
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            <item.icon size={22} />
          </div>
          <div>
            <div className={`text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{item.title}</div>
            <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{item.body}</p>
            <em className={`mt-3 block text-sm font-bold ${FINELY_OS_ENTITY_SUBLABEL}`}>Open {item.title.toLowerCase()}</em>
          </div>
        </button>
      ))}
    </div>
  );

  const workbenchBody = isDemo ? (
    renderCurriculumInspector()
  ) : !partner ? (
    <ProductEmptyState
      title="No partner profile"
      description="Sign in to see lessons matched to your restore step."
      action={
        <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate('/login')}>
          Sign in
        </button>
      }
    />
  ) : (
    <section className={`fc-wlp-section ${FINELY_OS_PAGE} space-y-6`} data-surface-layout="focus-lesson">
      <CommsWorkspaceActions variant="inline" />

      <div className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8 flex flex-wrap items-center justify-between gap-4`} data-fc-accent="rose">
        <div className="flex items-start gap-4 min-w-0">
          <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20">
            <Sparkles size={26} className="text-rose-300" />
          </div>
          <div>
            <div className="fc-wlp-eyebrow">Today&apos;s lesson</div>
            <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{recommendedLesson.label}</div>
            <p className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
              Matched to your journey stage — finish it, then apply it to this week&apos;s work.
            </p>
          </div>
        </div>
        <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate(mapPortalHref(recommendedLesson.path))}>
          Start lesson <ArrowRight size={14} />
        </button>
      </div>

      <div className="grid lg:grid-cols-[minmax(260px,320px)_1fr] gap-6 items-start">
        <aside className="space-y-3 min-w-0">
          {NAV_ZONES.map((nav) => {
            const Icon = nav.icon;
            const active = zone === nav.id;
            const badge = nav.id === 'guides' ? libraryGuides.length : undefined;
            return (
              <button
                key={nav.id}
                type="button"
                onClick={() => setZone(nav.id)}
                className={`w-full text-left ${finelyOsCatalogCard(nav.accent)} p-4 lg:p-5 transition-all ${
                  active ? 'ring-2 ring-white/25' : 'opacity-90 hover:opacity-100'
                }`}
                data-fc-accent={nav.accent}
                data-active={active ? 'true' : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} />
                  <div>
                    <div className={`font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{nav.label}</div>
                    <div className={`text-sm font-bold ${FINELY_OS_ENTITY_SUBLABEL}`}>
                      {nav.hint}
                      {badge ? ` · ${badge}` : ''}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {zone === 'curriculum' ? (
            <div className="space-y-2 pt-2">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Topics</div>
              {CURRICULUM_TOPICS.map((topic, idx) => {
                const cardAccent = (['emerald', 'violet', 'rose'] as const)[idx % 3];
                const active = selectedTopicId === topic.id;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setSelectedTopicId(topic.id)}
                    className={`w-full text-left ${finelyOsCatalogCard(cardAccent)} p-4 transition-all ${
                      active ? 'ring-2 ring-white/25' : 'opacity-85 hover:opacity-100'
                    }`}
                    data-fc-accent={cardAccent}
                  >
                    <div className={`text-sm font-extrabold ${FINELY_OS_ENTITY_VALUE} line-clamp-2`}>{topic.title}</div>
                  </button>
                );
              })}
            </div>
          ) : null}

          {zone === 'guides' && libraryGuides.length > 0 ? (
            <div className="space-y-2 pt-2 max-h-[360px] overflow-y-auto">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Guides</div>
              {libraryGuides.map((g, idx) => {
                const cardAccent = (['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4];
                const active = selectedGuideId === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGuideId(g.id)}
                    className={`w-full text-left ${finelyOsCatalogCard(cardAccent)} p-3 transition-all ${
                      active ? 'ring-2 ring-white/25' : 'opacity-85 hover:opacity-100'
                    }`}
                    data-fc-accent={cardAccent}
                  >
                    <div className={`text-sm font-extrabold ${FINELY_OS_ENTITY_VALUE} line-clamp-2`}>{g.title}</div>
                  </button>
                );
              })}
            </div>
          ) : null}
        </aside>

        <div className="min-w-0">
          {zone === 'curriculum' ? renderCurriculumInspector() : null}
          {zone === 'guides' ? renderGuidesInspector() : null}
          {zone === 'explore' ? renderExploreInspector() : null}
        </div>
      </div>

      <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-3`} data-fc-accent="emerald">
        <div className="fc-wlp-eyebrow">What to do next</div>
        <h2 className="text-2xl font-extrabold">Start with today&apos;s lesson</h2>
        <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
          The recommended lesson matches your current journey stage — finish it, then apply it to this week&apos;s work.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={FINELY_OS_SECONDARY_BTN}
            onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: navItem?.label ?? 'Education' })}
          >
            <CircleHelp size={14} /> Ask Finely
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/resources#presenter-demo')}>
            <PlayCircle size={14} /> Watch how
          </button>
        </div>
      </div>
    </section>
  );

  return (
    <ProductHubScaffold
      role={role}
      pageId="education"
      eyebrow="Education"
      title="Learn credit step by step for where you are now."
      description="Plain-English lessons for your current restore step — not a catalog to wander through."
      status={`${isDemo ? 'Demo curriculum' : `Stage · ${partner?.journeyStage ?? 'intake'}`} · ${isDemo ? 'demo' : 'live'} data`}
      freshness="ready now"
      accent={accent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      archetype={archetype}
      metricsVariant={METRICS_VARIANT}
      primaryAction={
        <ProductPagePrimaryAction
          label={recommendedLesson.label}
          onClick={() => navigate(mapPortalHref(recommendedLesson.path))}
        />
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(mapPortalHref('/portal/training/academy'))}>
          Training academy
        </button>
      }
      metrics={metrics}
      metricTitle="Learning summary"
      metricDescription="Guides and curriculum counts for your current journey stage."
    >
      {workbenchBody}
      <p className="fc-wlp-section-description fc-wlp-compliance-line">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
