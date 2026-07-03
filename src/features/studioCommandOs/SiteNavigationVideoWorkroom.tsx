import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Clapperboard, Compass, Film, Loader2, PlayCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TOUR_MANIFEST } from '../../config/tourManifest';
import { FinelyOsPaginatedStack } from '../os/FinelyOsPaginatedStack';
import { TourVideoStatusBadge } from '../../components/tours/TourVideoStatusBadge';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../os/finelyOsLightUi';
import {
  buildTourNavigationPrompt,
  contentStudioUrlForTour,
  intakeFromTour,
  videoCommandRequestFromTour,
} from './tourVideoBridge';
import { createContentStudioJob, setSelectedContentStudioJobId } from './contentStudioRepo';
import { listTourClipJobs } from '../../data/tourClipJobsRepo';
import { GeminiStyleVideoCommand } from './GeminiStyleVideoCommand';

type Props = {
  selectedTourId?: string | null;
};

export function SiteNavigationVideoWorkroom({ selectedTourId }: Props) {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [previewTourId, setPreviewTourId] = useState<string | null>(selectedTourId ?? null);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    if (selectedTourId) setPreviewTourId(selectedTourId);
  }, [selectedTourId]);

  const clipJobs = useMemo(() => listTourClipJobs(), [version]);
  const previewTour = useMemo(
    () => TOUR_MANIFEST.find((t) => t.id === previewTourId) ?? TOUR_MANIFEST[0] ?? null,
    [previewTourId],
  );

  const tourStats = useMemo(
    () => ({
      total: TOUR_MANIFEST.length,
      withClipJob: new Set(clipJobs.map((j) => j.tourId).filter(Boolean)).size,
      ready: clipJobs.filter((j) => j.status === 'ready').length,
    }),
    [clipJobs],
  );

  const startTourVideo = (tourId: string) => {
    const tour = TOUR_MANIFEST.find((t) => t.id === tourId);
    if (!tour) return;
    const job = createContentStudioJob(intakeFromTour(tour));
    setSelectedContentStudioJobId(job.id);
    setPreviewTourId(tourId);
    setNotice(`Navigation tutorial job created for "${tour.title}".`);
    const params = new URLSearchParams({ room: 'navigation_tours', tourId });
    navigate(`/admin/content-studio?${params.toString()}`);
    setVersion((v) => v + 1);
  };

  const queueAllTours = () => {
    setBusy(true);
    try {
      let firstId: string | null = null;
      for (const tour of TOUR_MANIFEST) {
        const job = createContentStudioJob(intakeFromTour(tour));
        if (!firstId) {
          firstId = job.id;
          setSelectedContentStudioJobId(job.id);
          setPreviewTourId(tour.id);
        }
      }
      setNotice(`Queued ${TOUR_MANIFEST.length} site navigation tutorial jobs.`);
      navigate('/admin/content-studio?room=navigation_tours');
      setVersion((v) => v + 1);
    } finally {
      setBusy(false);
    }
  };

  const videoInitialRequest = previewTour ? videoCommandRequestFromTour(previewTour) : undefined;

  return (
    <div className="space-y-6">
      <div className={`${finelyOsCatalogCard('violet')} !p-6 space-y-4`} data-fc-accent="violet">
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>
          <Compass size={16} />
          <span>Site navigation tutorial factory</span>
        </div>
        <p className={FINELY_OS_ENTITY_BODY}>
          {tourStats.total} tours · {tourStats.withClipJob} with clip jobs · {tourStats.ready} ready clips.
          Generate screen-walkthrough videos for every route — public, portal, admin, and partner lanes.
        </p>
        {notice ? <p className="text-sm text-emerald-200/90">{notice}</p> : null}
        <div className="flex flex-wrap gap-2">
          <button type="button" className={FINELY_OS_PRIMARY_BTN} disabled={busy} onClick={queueAllTours}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Queue all tour videos
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/tour-studio')}>
            Open Tour Studio <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <FinelyOsPaginatedStack
        items={TOUR_MANIFEST}
        pageSize={8}
        itemSpacingClassName="grid md:grid-cols-2 gap-4"
        renderItem={(tour) => {
          const jobsForTour = clipJobs.filter((j) => j.tourId === tour.id);
          const active = previewTourId === tour.id;
          return (
            <div key={tour.id} className={`${finelyOsCatalogCard(active ? 'amber' : 'sky')} !p-5 space-y-3`} data-fc-accent={active ? 'amber' : 'sky'}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>{tour.title}</div>
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-1`}>{tour.startPath} · {tour.lane}</div>
                  <div className="mt-2">
                    <TourVideoStatusBadge tourId={tour.id} />
                  </div>
                </div>
                <Film size={18} className="opacity-50 shrink-0" />
              </div>
              <p className={`${FINELY_OS_ENTITY_BODY} text-xs line-clamp-3`}>{buildTourNavigationPrompt(tour).slice(0, 220)}…</p>
              <p className={`${FINELY_OS_ENTITY_SUBLABEL} text-xs`}>{tour.steps.length} steps · {jobsForTour.length} clip job(s)</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => startTourVideo(tour.id)}>
                  <Clapperboard size={14} /> Generate tutorial
                </button>
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setPreviewTourId(tour.id)}>
                  <PlayCircle size={14} /> Preview prompt
                </button>
              </div>
            </div>
          );
        }}
      />

      {previewTour ? (
        <div className="space-y-3">
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-amber-300`}>Video command — {previewTour.title}</div>
          <GeminiStyleVideoCommand key={previewTour.id} initialRequest={videoInitialRequest} />
        </div>
      ) : null}
    </div>
  );
}
