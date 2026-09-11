import React, { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Film, GraduationCap, Search, Shield, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import { FinelyTourPlayer } from '../../../../components/tours/FinelyTourPlayer';
import { TourVideoStatusBadge } from '../../../../components/tours/TourVideoStatusBadge';
import {
  listPlatformSopsByLane,
  PLATFORM_SOP_LIBRARY,
  type PlatformSop,
  type PlatformSopLane,
} from '../../../../domain/platformSops';
import { getTourById, TOUR_MANIFEST } from '../../../../config/tourManifest';
import { searchKnowledgeLocal } from '../../../../lib/finelyBrain/finelyBrainOrchestrate';
import { buildLaunchChecklistSnapshot } from '../../../../lib/launchChecklistSnapshot';
import { PUBLIC_DEMO_VIDEOS_ENABLED } from '../../../../config/publicMediaPolicy';
import { AdminGoLiveCommandPanel } from '../../../admin/AdminGoLiveCommandPanel';
import { AdminLaunchPlanClosurePanel } from '../../../admin/AdminLaunchPlanClosurePanel';
import { LAUNCH_ROLE_COURSES } from '../../../../config/launchRoleCourses';
import { listModulePlaybooksByLane, MODULE_PLAYBOOKS } from '../../../../config/modulePlaybooks';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';

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

export default function AdminLaunchOsProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'violet';

  const [lane, setLane] = useState<PlatformSopLane | 'all'>('all');
  const [moduleLane, setModuleLane] = useState<'all' | 'admin' | 'portal' | 'public'>('all');
  const [query, setQuery] = useState('');
  const [tourId, setTourId] = useState<string | null>(null);
  const [selectedSop, setSelectedSop] = useState<PlatformSop | null>(null);

  const previewTour = useMemo(() => (tourId ? getTourById(tourId) : null), [tourId]);

  const sops = useMemo(() => {
    const base = lane === 'all' ? PLATFORM_SOP_LIBRARY : listPlatformSopsByLane(lane);
    const q = query.trim().toLowerCase();
    if (!q) return base;
    const hits = new Set(searchKnowledgeLocal(q, 20).map((h) => h.id));
    return base.filter((s) => hits.has(s.id) || `${s.title} ${s.whenToUse}`.toLowerCase().includes(q));
  }, [lane, query]);

  const launchChecks = useMemo(
    () => buildLaunchChecklistSnapshot().filter((c) => c.id.startsWith('launch_os') || c.id.startsWith('finely_intelligence')),
    [],
  );

  const modulePlaybooks = useMemo(() => listModulePlaybooksByLane(moduleLane), [moduleLane]);

  const metrics = useMemo(
    () => [
      { label: 'Playbooks', value: String(PLATFORM_SOP_LIBRARY.length), hint: 'Platform SOPs', accent: 'emerald' as const },
      { label: 'Modules', value: String(MODULE_PLAYBOOKS.length), hint: 'Screen guides', accent: 'violet' as const },
      { label: 'Role courses', value: String(LAUNCH_ROLE_COURSES.length), hint: 'Training tracks', accent: 'sky' as const },
      { label: 'Video tours', value: String(TOUR_MANIFEST.length), hint: 'Watch how', accent: 'rose' as const },
    ],
    [],
  );

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Platform"
      title="Launch OS"
      description="Search playbooks, open a module guide, and clear the next launch gate."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={navItem?.icon}
      metrics={metrics}
      metricTitle="Launch pulse"
      metricDescription="Playbooks, module guides, training tracks, and video tours."
      primaryAction={<ProductPagePrimaryAction label="Start here" onClick={() => navigate('/start-here')} />}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/tour-studio')}>
          Tour studio
        </button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)] xl:items-start">
        <div className="space-y-6">
          <div className="grid gap-4 xl:grid-cols-12 xl:items-start">
            <div className="xl:col-span-5 space-y-4">
              <div>
                <p className={FINELY_OS_ENTITY_SUBLABEL}>Playbooks</p>
                <h2 className="mt-2 text-3xl font-extrabold">Search or pick a lane</h2>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
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
              <div className="flex flex-wrap gap-2">
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
            </div>
            <div className="xl:col-span-7 grid gap-4 sm:grid-cols-2">
              {metrics.map((m, idx) => {
                const families = ['emerald', 'violet', 'sky', 'rose'] as const;
                const family = families[idx % families.length];
                return (
                  <div key={m.label} className={`${finelyOsCatalogCard(family)} p-5 lg:p-6`} data-fc-accent={family}>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>{m.label}</div>
                    <div className="mt-2 text-3xl font-extrabold">{m.value}</div>
                    <div className={`mt-1 text-sm font-semibold ${FINELY_OS_ENTITY_BODY}`}>{m.hint}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen size={20} />
                <span className={FINELY_OS_ENTITY_VALUE}>Module guides</span>
              </div>
              <p className={FINELY_OS_ENTITY_BODY}>One plain sentence per route. Jump to the live page or linked playbook.</p>
              <div className="flex flex-wrap gap-2">
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
                pageSize={6}
                itemSpacingClassName="grid sm:grid-cols-2 gap-4"
                renderItem={(mod, idx) => {
                  const family = (['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4];
                  return (
                    <div key={mod.id} className={`${finelyOsCatalogCard(family)} p-5 lg:p-6 space-y-2`} data-fc-accent={family}>
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
                  );
                }}
              />
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <GraduationCap size={20} />
                <span className={FINELY_OS_ENTITY_VALUE}>Role training tracks</span>
              </div>
              <p className={FINELY_OS_ENTITY_BODY}>Each track links SOPs, tours, and the live hub where you work.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {LAUNCH_ROLE_COURSES.map((course, idx) => {
                  const family = (['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4];
                  return (
                    <div key={course.id} className={`${finelyOsCatalogCard(family)} space-y-3 p-5 lg:p-6`} data-fc-accent={family}>
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>{course.role}</div>
                      <h3 className={`${FINELY_OS_ENTITY_VALUE} text-lg font-semibold`}>{course.title}</h3>
                      <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>{course.desc}</p>
                      <p className={`${FINELY_OS_ENTITY_SUBLABEL} text-xs`}>
                        {course.lessonCount} lessons · {course.sopIds.length} playbooks
                      </p>
                      <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate(course.hubPath)}>
                        Open hub <ArrowRight size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <FinelyOsPaginatedStack
            items={sops}
            pageSize={8}
            itemSpacingClassName="grid sm:grid-cols-2 xl:grid-cols-4 gap-4"
            renderItem={(sop, idx) => {
              const sopAccent = (['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4];
              return (
                <button
                  key={sop.id}
                  type="button"
                  className={`${finelyOsCatalogCard(sopAccent)} space-y-3 p-6 lg:p-8 text-left`}
                  data-fc-accent={sopAccent}
                  onClick={() => setSelectedSop(sop)}
                >
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} capitalize`}>
                    {sop.lane} · {sop.audience}
                  </div>
                  <h3 className={`${FINELY_OS_ENTITY_VALUE} text-xl font-extrabold`}>{sop.title}</h3>
                  <p className={`${FINELY_OS_ENTITY_BODY} text-base line-clamp-3`}>{sop.whenToUse}</p>
                </button>
              );
            }}
          />
        </div>

        {/* Launch alert rail */}
        <aside className="space-y-4 xl:sticky xl:top-4">
          <div className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8`} data-fc-accent="rose">
            <div className="text-xs font-black uppercase tracking-widest text-rose-700">What needs a look</div>
            <p className={`mt-3 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
              See what is blocking go-live, then run the next command.
            </p>
          </div>

          <AdminLaunchPlanClosurePanel />
          <AdminGoLiveCommandPanel />

          {launchChecks.length ? (
            <section className={`${finelyOsCatalogCard('emerald')} p-5 lg:p-6 space-y-3`} data-fc-accent="emerald">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} />
                <span className={FINELY_OS_ENTITY_VALUE}>Launch checklist gates</span>
              </div>
              <ul className={`space-y-2 ${FINELY_OS_ENTITY_BODY}`}>
                {launchChecks.map((c) => (
                  <li key={c.id} className="flex flex-wrap gap-2 items-baseline text-sm font-semibold">
                    <span className="font-extrabold">{c.label}</span>
                    <span className="opacity-70">— {c.detail}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>

      {selectedSop ? (
        <div
          className="fc-wlp-local-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={selectedSop.title}
          onClick={() => setSelectedSop(null)}
        >
          <div className="fc-wlp-local-modal fc-wlp-wide-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-sky-300 m-0 capitalize">
                  {selectedSop.lane} · {selectedSop.audience}
                </p>
                <h3 className="text-lg font-extrabold text-white m-0 mt-1">{selectedSop.title}</h3>
              </div>
              <button type="button" className="fc-wlp-btn-secondary !py-1.5 !px-2.5 !text-xs" onClick={() => setSelectedSop(null)} aria-label="Close playbook">
                <X size={14} /> Close
              </button>
            </div>
            <p className="text-base font-bold text-white/80 m-0">{selectedSop.whenToUse}</p>
            <ol className="list-decimal pl-5 space-y-2 text-base font-bold text-white/90">
              {selectedSop.steps.map((s) => (
                <li key={s.order}>
                  {s.route ? (
                    <button
                      type="button"
                      className="text-left underline-offset-2 hover:underline font-semibold"
                      onClick={() => navigate(s.route!)}
                    >
                      {s.label}
                    </button>
                  ) : (
                    s.label
                  )}
                </li>
              ))}
            </ol>
            {selectedSop.complianceNotes?.length ? (
              <p className="text-sm flex items-start gap-2 text-white/80">
                <Shield size={14} className="shrink-0 mt-0.5" />
                {selectedSop.complianceNotes.join(' ')}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2 items-center">
              {selectedSop.relatedTourId && PUBLIC_DEMO_VIDEOS_ENABLED ? (
                <>
                  <button
                    type="button"
                    className={FINELY_OS_PRIMARY_BTN}
                    onClick={() => {
                      setTourId(selectedSop.relatedTourId!);
                      setSelectedSop(null);
                    }}
                  >
                    <Film size={14} /> Preview tour
                  </button>
                  <TourVideoStatusBadge tourId={selectedSop.relatedTourId} />
                </>
              ) : null}
              {selectedSop.relatedRoutes[0] ? (
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(selectedSop.relatedRoutes[0])}>
                  Open page <ArrowRight size={12} />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {PUBLIC_DEMO_VIDEOS_ENABLED ? (
        <FinelyTourPlayer tour={previewTour} open={Boolean(previewTour)} onClose={() => setTourId(null)} />
      ) : null}
    </ProductHubScaffold>
  );
}
