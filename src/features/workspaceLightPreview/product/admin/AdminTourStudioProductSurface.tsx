import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Film, Play, Scan } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TOUR_MANIFEST } from '../../../../config/tourManifest';
import { getPlatformSop } from '../../../../domain/platformSops';
import { FinelyTourPlayer } from '../../../../components/tours/FinelyTourPlayer';
import { TourVideoStatusBadge } from '../../../../components/tours/TourVideoStatusBadge';
import { TourVideoFactoryPanel } from '../../../tours/TourVideoFactoryPanel';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';

/**
 * Walkthrough library. One column of cards. Opening a tour replaces the list
 * with a full-width step view — never a side-by-side queue and inspector.
 */
export default function AdminTourStudioProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'sky';
  const [openTourId, setOpenTourId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showTools, setShowTools] = useState(false);

  const openTour = useMemo(() => TOUR_MANIFEST.find((t) => t.id === openTourId) ?? null, [openTourId]);
  const previewTour = useMemo(() => TOUR_MANIFEST.find((t) => t.id === previewId) ?? null, [previewId]);
  const openSop = openTour?.relatedSopId ? getPlatformSop(openTour.relatedSopId) : null;

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Tour Studio"
      title="Tour Studio"
      description="Build short walkthrough videos that show partners how to use Finely."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={navItem?.icon}
      primaryAction={
        <ProductPagePrimaryAction
          label={openTour ? 'Preview' : 'Preview a walkthrough'}
          onClick={() => setPreviewId(openTour?.id ?? TOUR_MANIFEST[0]?.id ?? null)}
          disabled={!TOUR_MANIFEST.length}
        />
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => setShowTools((v) => !v)}>
          {showTools ? 'Hide recording tools' : 'Record a new video'}
        </button>
      }
      metrics={[
        { label: 'Walkthroughs', value: String(TOUR_MANIFEST.length), hint: 'Ready to preview', accent: 'emerald' },
      ]}
      metricTitle="Your walkthroughs"
      metricDescription="Preview plays the video. Edit opens the steps on this page."
    >
      <div className="fc-admin-readable space-y-8">
        <p className="max-w-3xl text-lg leading-relaxed text-[#e8e8e8]">
          Build short walkthrough videos that show partners how to use Finely. Pick a walkthrough, then Preview it or Edit its steps.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={FINELY_OS_PRIMARY_BTN}
            onClick={() => setPreviewId(openTour?.id ?? TOUR_MANIFEST[0]?.id ?? null)}
            disabled={!TOUR_MANIFEST.length}
          >
            <Play size={16} /> Preview
          </button>
          <button
            type="button"
            className={FINELY_OS_SECONDARY_BTN}
            onClick={() => setOpenTourId(TOUR_MANIFEST[0]?.id ?? null)}
            disabled={!TOUR_MANIFEST.length || Boolean(openTour)}
          >
            Edit
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setShowTools(true)}>
            <Scan size={16} /> Create
          </button>
        </div>

        {showTools ? (
          <section className="space-y-4 rounded-2xl border border-white/15 bg-[#0b1110] p-6">
            <h2 className="text-xl font-semibold text-[#e8e8e8]">Record a new walkthrough</h2>
            <p className="max-w-3xl text-base leading-relaxed text-[#e8e8e8]">
              These tools capture screens and assemble MP4s. They stay out of the way until you need a new video.
            </p>
            <TourVideoFactoryPanel />
          </section>
        ) : null}

        {openTour ? (
          <section className="space-y-6">
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setOpenTourId(null)}>
              <ArrowLeft size={16} /> All walkthroughs
            </button>
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-semibold text-[#e8e8e8]">{openTour.title}</h2>
                  <p className="mt-2 text-base text-[#e8e8e8]">
                    {openTour.steps.length} steps
                    {openSop ? ` · ${openSop.title}` : ''}
                  </p>
                </div>
                <TourVideoStatusBadge tourId={openTour.id} />
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => setPreviewId(openTour.id)}>
                  <Play size={16} /> Preview
                </button>
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(openTour.startPath)}>
                  Open the screen <ArrowRight size={14} />
                </button>
              </div>
              <FinelyOsPaginatedStack
                items={openTour.steps}
                pageSize={8}
                itemSpacingClassName="space-y-4"
                renderItem={(step, idx) => (
                  <article key={`${openTour.id}-step-${idx}`} className="rounded-2xl border border-white/15 bg-[#0b1110] px-5 py-4">
                    <h3 className="text-lg font-semibold text-[#e8e8e8]">
                      Step {idx + 1}: {step.label ?? step.highlightLabel ?? 'Untitled'}
                    </h3>
                    <p className="mt-2 text-base leading-relaxed text-[#e8e8e8]">{step.narrationPlain}</p>
                  </article>
                )}
              />
            </div>
          </section>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {TOUR_MANIFEST.map((tour) => (
              <article key={tour.id} className="flex flex-col gap-4 rounded-2xl border border-white/15 bg-[#0b1110] p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-[#e8e8e8]">{tour.title}</h2>
                    <p className={`mt-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>{tour.steps.length} steps</p>
                  </div>
                  <Film size={20} className="text-[#fbbf24]" aria-hidden />
                </div>
                <TourVideoStatusBadge tourId={tour.id} />
                <p className={`${FINELY_OS_ENTITY_BODY} text-[#e8e8e8]`}>
                  A short walkthrough partners can watch inside Finely.
                </p>
                <div className="mt-auto flex flex-wrap gap-3">
                  <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => setPreviewId(tour.id)}>
                    <Play size={14} /> Preview
                  </button>
                  <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setOpenTourId(tour.id)}>
                    Edit
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <FinelyTourPlayer tour={previewTour} open={Boolean(previewTour)} onClose={() => setPreviewId(null)} allowVoice />
    </ProductHubScaffold>
  );
}
