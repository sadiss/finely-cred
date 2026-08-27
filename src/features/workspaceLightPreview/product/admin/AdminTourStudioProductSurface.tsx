import React, { useMemo, useState } from 'react';
import { ArrowRight, Copy, Film, Play, RefreshCw, Scan, Terminal, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TOUR_MANIFEST } from '../../../../config/tourManifest';
import { SITE_SCAN_TARGETS } from '../../../../config/tourSiteScanner';
import { getPlatformSop } from '../../../../domain/platformSops';
import { FinelyTourPlayer } from '../../../../components/tours/FinelyTourPlayer';
import { TourVideoStatusBadge } from '../../../../components/tours/TourVideoStatusBadge';
import { TourVideoFactoryPanel } from '../../../tours/TourVideoFactoryPanel';
import { FreeDisputeGuideHeroVideo } from '../../../../components/leadmagnet/FreeDisputeGuideHeroVideo';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsListItem,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';

export default function AdminTourStudioProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'sky';
  const [selectedTourId, setSelectedTourId] = useState<string | null>(TOUR_MANIFEST[0]?.id ?? null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [showFunnelPreview, setShowFunnelPreview] = useState(false);

  const selectedTour = useMemo(
    () => TOUR_MANIFEST.find((t) => t.id === selectedTourId) ?? null,
    [selectedTourId],
  );
  const previewTour = useMemo(() => TOUR_MANIFEST.find((t) => t.id === previewId) ?? null, [previewId]);
  const selectedSop = selectedTour?.relatedSopId ? getPlatformSop(selectedTour.relatedSopId) : null;

  const tourStats = useMemo(
    () => ({
      total: TOUR_MANIFEST.length,
      withSop: TOUR_MANIFEST.filter((t) => t.relatedSopId).length,
      lanes: new Set(TOUR_MANIFEST.map((t) => t.lane)).size,
    }),
    [],
  );

  const factoryCommands = useMemo(
    () => [
      { id: 'scan-site', label: 'Site scanner (screenshots)', cmd: 'npm run tour:scan' },
      { id: 'scan-video', label: 'Site scanner + MP4 record', cmd: 'npm run tour:scan:video' },
      { id: 'demos-full', label: 'Full demo pipeline', cmd: 'npm run tour:demos:full' },
      { id: 'capture-all', label: 'Capture all tours', cmd: 'npm run tour:capture -- --all' },
      { id: 'narrate-all', label: 'Export narration', cmd: 'npm run tour:narration:export -- --all' },
      { id: 'voice-all', label: 'Voice prerender', cmd: 'npm run tour:voice:prerender -- --all' },
      { id: 'assemble-all', label: 'Assemble MP4s', cmd: 'npm run tour:assemble -- --all' },
    ],
    [],
  );

  const copyCmd = async (id: string, cmd: string) => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopiedCmd(id);
      window.setTimeout(() => setCopiedCmd(null), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Studio"
      title="Tour studio"
      description="Build Watch how walkthroughs, run the factory pipeline, and preview tours before they go public."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={navItem?.icon}
      primaryAction={
        <ProductPagePrimaryAction
          label={selectedTour ? 'Preview steps' : 'Pick a tour'}
          onClick={() => selectedTour && setPreviewId(selectedTour.id)}
          disabled={!selectedTour}
        />
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/free-guide')}>
          Preview funnel
        </button>
      }
      metrics={[
        { label: 'Tours', value: String(tourStats.total), hint: 'In manifest', accent: 'emerald' },
        { label: 'Linked SOPs', value: String(tourStats.withSop), hint: 'With platform SOP', accent: 'violet' },
        { label: 'Lanes', value: String(tourStats.lanes), hint: 'Product areas', accent: 'sky' },
        { label: 'Scan targets', value: String(SITE_SCAN_TARGETS.length), hint: 'Recorder routes', accent: 'rose' },
      ]}
      metricTitle="Tour coverage"
      metricDescription="Pick a tour from the queue, then inspect steps and pipeline tools."
    >
      {/* Queue + selected tour inspector */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <aside className={`lg:col-span-4 ${finelyOsCatalogCard('emerald')} p-5 lg:p-6 space-y-4`} data-fc-accent="emerald">
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
            <Film size={16} />
            <span>Tour queue</span>
          </div>
          <p className={`text-sm font-semibold ${FINELY_OS_ENTITY_BODY}`}>
            {tourStats.total} tours across {tourStats.lanes} lanes.
          </p>

          <div className="space-y-2 max-h-[36rem] overflow-y-auto pr-1">
            {TOUR_MANIFEST.map((tour) => {
              const active = tour.id === selectedTourId;
              return (
                <button
                  key={tour.id}
                  type="button"
                  onClick={() => {
                    setSelectedTourId(tour.id);
                    setShowFunnelPreview(false);
                  }}
                  className={finelyOsListItem(active, 'emerald')}
                >
                  <div className={`${FINELY_OS_ENTITY_VALUE} text-left truncate`}>{tour.title}</div>
                  <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal font-mono text-xs`}>
                    {tour.startPath}
                  </div>
                  <div className="mt-2">
                    <TourVideoStatusBadge tourId={tour.id} />
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedTourId(null);
              setShowFunnelPreview(true);
            }}
            className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
              showFunnelPreview ? 'border-rose-400/40 bg-rose-500/15' : 'border-white/10 bg-black/20 hover:border-white/25'
            }`}
            data-fc-accent={showFunnelPreview ? 'rose' : undefined}
          >
            <div className="flex items-center gap-2">
              <Video size={16} />
              <span className="text-sm font-extrabold">Funnel hero preview</span>
            </div>
          </button>
        </aside>

        <main className="lg:col-span-8 space-y-6">
          <section className={`${finelyOsCatalogCard('rose')} p-5 lg:p-6`} data-fc-accent="rose">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Public site — videos hidden</div>
            <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-sm font-semibold max-w-3xl`}>
              Demo and walkthrough videos are <strong>admin-only</strong> until polished. Visitors see static previews instead. Flip{' '}
              <code className="opacity-80">PUBLIC_DEMO_VIDEOS_ENABLED</code> in <code className="opacity-80">publicMediaPolicy.ts</code> when ready to go live.
            </p>
          </section>

          {showFunnelPreview ? (
            <section className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8 space-y-4`} data-fc-accent="rose">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Draft — free guide hero video</div>
              <p className={`${FINELY_OS_ENTITY_BODY} text-sm font-semibold max-w-2xl`}>
                This autoplay funnel video is hidden from <code className="opacity-80">/free-guide</code> until demos go public.
              </p>
              <div className="max-w-lg">
                <FreeDisputeGuideHeroVideo />
              </div>
            </section>
          ) : selectedTour ? (
            <section className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-5`} data-fc-accent="violet">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                    <Film size={16} />
                    <span>Tour inspector</span>
                  </div>
                  <h2 className="mt-2 text-3xl font-extrabold">{selectedTour.title}</h2>
                  <div className={`mt-2 ${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case`}>{selectedTour.startPath}</div>
                </div>
                <TourVideoStatusBadge tourId={selectedTour.id} />
              </div>

              <p className={`text-base font-semibold ${FINELY_OS_ENTITY_BODY}`}>
                {selectedTour.steps.length} steps · {selectedSop?.title ?? 'No linked SOP'} · Lane: {selectedTour.lane}
              </p>

              <FinelyOsPaginatedStack
                items={selectedTour.steps}
                pageSize={6}
                itemSpacingClassName="space-y-2"
                renderItem={(step, idx) => (
                  <div
                    key={`${selectedTour.id}-step-${idx}`}
                    className="rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                  >
                    <div className={`${FINELY_OS_ENTITY_VALUE} text-sm font-extrabold`}>
                      Step {idx + 1}: {step.label ?? step.highlightLabel ?? 'Untitled'}
                    </div>
                    <p className={`mt-1 text-sm font-semibold ${FINELY_OS_ENTITY_BODY}`}>{step.narrationPlain}</p>
                    {step.instructionLines?.length ? (
                      <ul className={`mt-2 text-xs font-semibold ${FINELY_OS_ENTITY_BODY} list-disc pl-4 space-y-1`}>
                        {step.instructionLines.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                )}
              />

              <div className="flex flex-wrap gap-2">
                <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => setPreviewId(selectedTour.id)}>
                  <Play size={14} /> Preview steps
                </button>
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(selectedTour.startPath)}>
                  Open route <ArrowRight size={12} />
                </button>
              </div>
            </section>
          ) : (
            <section className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8`} data-fc-accent="violet">
              <p className={`text-base font-semibold ${FINELY_OS_ENTITY_BODY}`}>Select a tour from the queue to inspect.</p>
            </section>
          )}

          <section className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-4`} data-fc-accent="sky">
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
              <Terminal size={16} />
              <span>Tour factory</span>
            </div>
            <p className={`${FINELY_OS_ENTITY_BODY} text-base font-semibold`}>
              {tourStats.total} tours · {tourStats.withSop} linked SOPs · {tourStats.lanes} lanes. Run{' '}
              <code className="opacity-80">npm run tour:scan:video</code> to record demo MP4s, then publish from{' '}
              <code className="opacity-80">public/tours/demos/</code>. Manual uploads live in{' '}
              <button type="button" className="underline font-bold" onClick={() => navigate('/admin/resources')}>
                Resources
              </button>
              .
            </p>
            <TourVideoFactoryPanel />
          </section>

          <section className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-4`} data-fc-accent="emerald">
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
              <RefreshCw size={16} />
              <span>Regenerate pipeline</span>
            </div>
            <p className={`${FINELY_OS_ENTITY_BODY} text-base font-semibold`}>
              Run these in order from the project root. Dev server must be on port <strong>5173</strong> for capture.
            </p>
            <div className="flex flex-wrap gap-2">
              {factoryCommands.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={FINELY_OS_SECONDARY_BTN}
                  onClick={() => void copyCmd(item.id, item.cmd)}
                >
                  <Copy size={14} /> {copiedCmd === item.id ? 'Copied!' : item.label}
                </button>
              ))}
            </div>
          </section>

          <section className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8 space-y-4`} data-fc-accent="rose">
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
              <Scan size={16} />
              <span>Site scanner — video-recorder mode</span>
            </div>
            <p className={`${FINELY_OS_ENTITY_BODY} text-base font-semibold`}>
              Playwright walks each route, scrolls to controls, draws a pulsing green ring + animated cursor + label chip, and saves screenshots to{' '}
              <code className="opacity-80">public/tours/site-scan/</code>. With <code className="opacity-80">--video</code>, screen recordings land in{' '}
              <code className="opacity-80">public/tours/demos/{'{target-id}'}.mp4</code> for training and sales.
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              {SITE_SCAN_TARGETS.map((target) => (
                <div key={target.id} className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-2">
                  <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold text-sm`}>{target.title}</div>
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case`}>{target.path}</div>
                  <ul className={`${FINELY_OS_ENTITY_BODY} text-xs space-y-1 list-disc pl-4 font-semibold`}>
                    {target.selectors.map((s) => (
                      <li key={s.selector}>
                        <span className="text-emerald-300">{s.label}</span> — {s.narration}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => void copyCmd('scan-video', 'npm run tour:scan:video')}>
                <Copy size={14} /> {copiedCmd === 'scan-video' ? 'Copied!' : 'Copy tour:scan:video'}
              </button>
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => void copyCmd('scan-site', 'npm run tour:scan')}>
                <Copy size={14} /> {copiedCmd === 'scan-site' ? 'Copied!' : 'Copy tour:scan'}
              </button>
            </div>
          </section>
        </main>
      </div>

      <FinelyTourPlayer tour={previewTour} open={Boolean(previewTour)} onClose={() => setPreviewId(null)} allowVoice />

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
