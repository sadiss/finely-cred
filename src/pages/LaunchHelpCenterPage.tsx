import React, { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Film, GraduationCap, Search, Shield } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { FinelyOsPaginatedStack } from '../features/os/FinelyOsPaginatedStack';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../features/unified/FinelyUnifiedHubLayout';
import { FinelyNowDoThisStrip } from '../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../components/tours/FinelyNoticedStrip';
import { buildHelpCenterNoticedItems } from '../lib/finelyProactiveSignals';
import { FinelyTourPlayer } from '../components/tours/FinelyTourPlayer';
import { TourVideoStatusBadge } from '../components/tours/TourVideoStatusBadge';
import {
  listPlatformSopsByLane,
  PLATFORM_SOP_LIBRARY,
  type PlatformSopLane,
} from '../domain/platformSops';
import { getTourById, TOUR_MANIFEST } from '../config/tourManifest';
import { searchKnowledgeLocal } from '../lib/finelyBrain/finelyBrainOrchestrate';
import { buildLaunchChecklistSnapshot } from '../lib/launchChecklistSnapshot';
import { PUBLIC_DEMO_VIDEOS_ENABLED } from '../config/publicMediaPolicy';
import { AdminGoLiveCommandPanel } from '../features/admin/AdminGoLiveCommandPanel';
import { AdminLaunchPlanClosurePanel } from '../features/admin/AdminLaunchPlanClosurePanel';
import { LAUNCH_ROLE_COURSES } from '../config/launchRoleCourses';
import { listModulePlaybooksByLane, MODULE_PLAYBOOKS } from '../config/modulePlaybooks';
import {
  FINELY_OS_PAGE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../features/os/finelyOsLightUi';

const LANES: Array<{ id: PlatformSopLane | 'all'; label: string }> = [
  { id: 'all', label: 'All playbooks' },
  { id: 'public', label: 'Public' },
  { id: 'portal', label: 'Portal' },
  { id: 'admin', label: 'Admin' },
  { id: 'affiliate', label: 'Affiliate' },
  { id: 'agent', label: 'Agent' },
  { id: 'business', label: 'Business' },
  { id: 'compliance', label: 'Compliance' },
];

export default function LaunchHelpCenterPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin/launch-os');
  const [lane, setLane] = useState<PlatformSopLane | 'all'>('all');
  const [moduleLane, setModuleLane] = useState<'all' | 'admin' | 'portal' | 'public'>('all');
  const [query, setQuery] = useState('');
  const [tourId, setTourId] = useState<string | null>(null);

  usePublicSeoMeta({
    title: isAdmin ? 'Launch OS Help Center' : 'Help center',
    description: 'Plain-English playbooks, video tours, and step-by-step guides for Finely Cred.',
    path: isAdmin ? '/admin/launch-os' : '/help-center',
  });

  const previewTour = useMemo(() => (tourId ? getTourById(tourId) : null), [tourId]);

  const sops = useMemo(() => {
    const base = lane === 'all' ? PLATFORM_SOP_LIBRARY : listPlatformSopsByLane(lane);
    const q = query.trim().toLowerCase();
    if (!q) return base;
    const hits = new Set(searchKnowledgeLocal(q, 20).map((h) => h.id));
    return base.filter((s) => hits.has(s.id) || `${s.title} ${s.whenToUse}`.toLowerCase().includes(q));
  }, [lane, query]);

  const launchChecks = useMemo(
    () => (isAdmin ? buildLaunchChecklistSnapshot().filter((c) => c.id.startsWith('launch_os') || c.id.startsWith('finely_intelligence')) : []),
    [isAdmin],
  );

  const modulePlaybooks = useMemo(() => listModulePlaybooksByLane(moduleLane), [moduleLane]);

  return (
    <PageShell
      badge={isAdmin ? 'Admin' : 'Help'}
      title={isAdmin ? 'Launch OS Help Center' : 'Help center — plain English playbooks'}
      subtitle="Every workflow in short steps. Use Watch how on any page, or preview tours here."
    >
      <div className={`${FINELY_OS_PAGE} fc-senior-simple space-y-8`}>
        <FinelyNoticedStrip
          items={buildHelpCenterNoticedItems({
            hasSearchQuery: Boolean(query.trim()),
            lane,
          })}
        />
        <FinelyNowDoThisStrip currentIndex={query.trim() ? 1 : 0} />
        <FinelyUnifiedHubLayout
          eyebrow="Launch OS"
          title="Search playbooks or pick a lane"
          subtitle="SOPs sync with Ask Finely and context help across the platform."
          accent="violet"
          kpis={[
            { label: 'Playbooks', value: String(PLATFORM_SOP_LIBRARY.length), accent: 'emerald' },
            { label: 'Modules', value: String(MODULE_PLAYBOOKS.length), accent: 'emerald' },
            { label: 'Role courses', value: String(LAUNCH_ROLE_COURSES.length), accent: 'amber' },
            { label: 'Video tours', value: String(TOUR_MANIFEST.length), accent: 'sky' },
            { label: 'Lanes', value: String(LANES.length - 1), accent: 'violet' },
          ]}
          primaryAction={{ label: 'Start Here', onClick: () => navigate('/start-here') }}
          secondaryAction={{ label: 'Tour Studio', onClick: () => navigate(isAdmin ? '/admin/tour-studio' : '/resources#videos') }}
        >
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search: upload report, affiliate link, dispute letter…"
                className={`${FINELY_OS_ENTITY_INPUT} w-full !pl-11 !py-4 !text-base`}
              />
            </div>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/owners-guide')}>
              Owner&apos;s guide <ArrowRight size={14} />
            </button>
          </div>

          <div className="fc-lane-jumper mb-6">
            {LANES.map((l) => (
              <button
                key={l.id}
                type="button"
                className={lane === l.id ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN}
                onClick={() => setLane(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>

          {isAdmin ? (
            <section className="fc-scroll-section mb-8 space-y-6">
              <AdminLaunchPlanClosurePanel />
              <AdminGoLiveCommandPanel />
            </section>
          ) : null}

          {isAdmin && launchChecks.length ? (
            <section id="launch-checks" className="fc-scroll-section space-y-4 mb-8">
              <div className={`${finelyOsCatalogCard('emerald')} !p-6`} data-fc-accent="emerald">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 size={18} />
                  <span className={FINELY_OS_ENTITY_VALUE}>Launch checklist gates</span>
                </div>
                <ul className={`space-y-2 ${FINELY_OS_ENTITY_BODY}`}>
                  {launchChecks.map((c) => (
                    <li key={c.id} className="flex flex-wrap gap-2 items-baseline">
                      <span className="font-semibold">{c.label}</span>
                      <span className="opacity-70">— {c.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}

          <section id="modules" className="fc-scroll-section mb-8">
            <div className={`${finelyOsCatalogCard('sky')} !p-6 space-y-4`} data-fc-accent="sky">
              <div className="flex items-center gap-2">
                <BookOpen size={20} className="text-sky-300" />
                <span className={FINELY_OS_ENTITY_VALUE}>Module guides — how to use every screen</span>
              </div>
              <p className={FINELY_OS_ENTITY_BODY}>One plain sentence per route. Jump to the live page or linked playbook.</p>
              <div className="fc-lane-jumper">
                {(['all', 'public', 'portal', 'admin'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    className={moduleLane === l ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN}
                    onClick={() => setModuleLane(l)}
                  >
                    {l === 'all' ? 'All' : l.charAt(0).toUpperCase() + l.slice(1)}
                  </button>
                ))}
              </div>
              <FinelyOsPaginatedStack
                items={modulePlaybooks}
                pageSize={8}
                itemSpacingClassName="grid md:grid-cols-2 gap-3"
                renderItem={(mod) => (
                  <div key={mod.id} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-2">
                    <div className={FINELY_OS_ENTITY_VALUE}>{mod.title}</div>
                    <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono text-xs`}>{mod.path}</div>
                    <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>{mod.plainSummary}</p>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate(mod.path)}>
                        Open <ArrowRight size={12} />
                      </button>
                      {mod.sopId ? (
                        <button
                          type="button"
                          className={FINELY_OS_SECONDARY_BTN}
                          onClick={() => {
                            setQuery(mod.title);
                            setLane(mod.lane === 'public' ? 'public' : mod.lane === 'portal' ? 'portal' : 'admin');
                          }}
                        >
                          Playbook
                        </button>
                      ) : null}
                    </div>
                  </div>
                )}
              />
            </div>
          </section>

          <section id="training" className="fc-scroll-section mb-8">
            <div className={`${finelyOsCatalogCard('amber')} !p-6 space-y-4`} data-fc-accent="amber">
              <div className="flex items-center gap-2">
                <GraduationCap size={20} className="text-amber-300" />
                <span className={FINELY_OS_ENTITY_VALUE}>Role training tracks</span>
              </div>
              <p className={FINELY_OS_ENTITY_BODY}>Pick your role — each track links SOPs, tours, and the live hub where you work.</p>
              <div className="grid md:grid-cols-2 gap-4">
                {LAUNCH_ROLE_COURSES.map((course) => (
                  <div key={course.id} className={`${finelyOsCatalogCard(course.accent)} !p-5 space-y-3`} data-fc-accent={course.accent}>
                    <div className={`${FINELY_OS_ENTITY_SUBLABEL}`}>{course.role}</div>
                    <h3 className={`${FINELY_OS_ENTITY_VALUE} text-lg font-semibold`}>{course.title}</h3>
                    <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>{course.desc}</p>
                    <p className={`${FINELY_OS_ENTITY_SUBLABEL} text-xs`}>{course.lessonCount} lessons · {course.sopIds.length} playbooks</p>
                    <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate(course.hubPath)}>
                      Open hub <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <FinelyOsPaginatedStack
            items={sops}
            pageSize={6}
            itemSpacingClassName="grid md:grid-cols-2 gap-4"
            renderItem={(sop) => {
              const tour = sop.relatedTourId ? getTourById(sop.relatedTourId) : null;
              return (
                <div key={sop.id} className={`${finelyOsCatalogCard('sky')} !p-5 space-y-4`} data-fc-accent="sky">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className={`${FINELY_OS_ENTITY_SUBLABEL} capitalize`}>{sop.lane} · {sop.audience}</div>
                      <h3 className={`${FINELY_OS_ENTITY_VALUE} text-lg font-semibold mt-1`}>{sop.title}</h3>
                    </div>
                    <BookOpen size={18} className="opacity-45 shrink-0" />
                  </div>
                  <p className={`${FINELY_OS_ENTITY_BODY} text-base`}>{sop.whenToUse}</p>
                  <ol className={`list-decimal pl-5 space-y-1 ${FINELY_OS_ENTITY_BODY}`}>
                    {sop.steps.map((s) => (
                      <li key={s.order}>
                        {s.route ? (
                          <button type="button" className="text-left underline-offset-2 hover:underline" onClick={() => navigate(s.route!)}>
                            {s.label}
                          </button>
                        ) : (
                          s.label
                        )}
                      </li>
                    ))}
                  </ol>
                  {sop.complianceNotes?.length ? (
                    <p className={`text-sm flex items-start gap-2 ${FINELY_OS_ENTITY_BODY}`}>
                      <Shield size={14} className="shrink-0 mt-0.5" />
                      {sop.complianceNotes.join(' ')}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2 items-center">
                    {tour && PUBLIC_DEMO_VIDEOS_ENABLED ? (
                      <>
                        <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => setTourId(tour.id)}>
                          <Film size={14} /> Preview tour
                        </button>
                        <TourVideoStatusBadge tourId={tour.id} />
                      </>
                    ) : null}
                    {sop.relatedRoutes[0] ? (
                      <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(sop.relatedRoutes[0])}>
                        Open page <ArrowRight size={12} />
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            }}
          />
        </FinelyUnifiedHubLayout>

        <FinelyOsPageFooter />
      </div>

      {PUBLIC_DEMO_VIDEOS_ENABLED ? (
      <FinelyTourPlayer tour={previewTour} open={Boolean(previewTour)} onClose={() => setTourId(null)} />
      ) : null}
    </PageShell>
  );
}
