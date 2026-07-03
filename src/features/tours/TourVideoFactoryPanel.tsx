import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Clapperboard, Compass, Copy, Film, Loader2, PlayCircle, Sparkles } from 'lucide-react';
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
import { contentStudioUrlForTour, intakeFromTour } from '../studioCommandOs/tourVideoBridge';
import { createContentStudioJob, setSelectedContentStudioJobId } from '../studioCommandOs/contentStudioRepo';
import { listTourClipJobs, type TourClipJob } from '../../data/tourClipJobsRepo';

export function TourVideoFactoryPanel() {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const clipJobs = useMemo(() => listTourClipJobs(), [version]);
  const stats = useMemo(
    () => ({
      queued: clipJobs.filter((j) => j.status === 'queued').length,
      processing: clipJobs.filter((j) => j.status === 'processing').length,
      ready: clipJobs.filter((j) => j.status === 'ready').length,
      failed: clipJobs.filter((j) => j.status === 'failed').length,
    }),
    [clipJobs],
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

  const generateTourInContentStudio = (tourId: string) => {
    const tour = TOUR_MANIFEST.find((t) => t.id === tourId);
    if (!tour) return;
    const job = createContentStudioJob(intakeFromTour(tour));
    setSelectedContentStudioJobId(job.id);
    setNotice(`Content Studio job created for "${tour.title}".`);
    navigate(contentStudioUrlForTour(tourId));
    setVersion((v) => v + 1);
  };

  const queueAllNavigationVideos = () => {
    setBusy(true);
    try {
      for (const tour of TOUR_MANIFEST) {
        createContentStudioJob(intakeFromTour(tour));
      }
      setNotice(`Queued ${TOUR_MANIFEST.length} navigation tutorial jobs in Content Studio.`);
      navigate('/admin/content-studio?room=navigation_tours');
      setVersion((v) => v + 1);
    } finally {
      setBusy(false);
    }
  };

  const openNavigationWorkroom = () => navigate('/admin/content-studio?room=navigation_tours');

  return (
    <div className={`${finelyOsCatalogCard('violet')} !p-6 space-y-5`} data-fc-accent="violet">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl space-y-2">
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>
            <Compass size={16} />
            <span>Navigation tutorial video factory</span>
          </div>
          <p className={FINELY_OS_ENTITY_BODY}>
            AI-generated screen-walkthrough tutorials for every tour in the manifest — plus Playwright capture for pixel-perfect MP4s.
            Clip queue: {stats.queued} queued · {stats.processing} processing · {stats.ready} ready · {stats.failed} failed.
          </p>
          {notice ? <p className="text-sm text-emerald-200/90">{notice}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={FINELY_OS_PRIMARY_BTN} disabled={busy} onClick={queueAllNavigationVideos}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Queue all AI tutorials
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={openNavigationWorkroom}>
            Navigation workroom <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => void copyCmd('scan-video', 'npm run tour:scan:video')}>
          <Copy size={14} /> {copiedCmd === 'scan-video' ? 'Copied!' : 'Playwright scan:video'}
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => void copyCmd('assemble', 'npm run tour:assemble -- --all')}>
          <Copy size={14} /> {copiedCmd === 'assemble' ? 'Copied!' : 'Assemble all MP4s'}
        </button>
      </div>

      <FinelyOsPaginatedStack
        items={TOUR_MANIFEST}
        pageSize={6}
        itemSpacingClassName="grid md:grid-cols-2 gap-3"
        renderItem={(tour) => {
          const jobs = clipJobs.filter((j) => j.tourId === tour.id);
          return (
            <div key={tour.id} className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className={`${FINELY_OS_ENTITY_VALUE} text-sm font-semibold`}>{tour.title}</div>
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-xs`}>{tour.steps.length} steps · {tour.lane}</div>
                </div>
                <TourVideoStatusBadge tourId={tour.id} />
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => generateTourInContentStudio(tour.id)}>
                  <Clapperboard size={12} /> AI tutorial
                </button>
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(tour.startPath)}>
                  <PlayCircle size={12} /> Route
                </button>
              </div>
              {jobs.length ? (
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-xs`}>{jobs.length} clip job(s)</div>
              ) : null}
            </div>
          );
        }}
      />

      {clipJobs.length ? (
        <div className="space-y-2">
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>Recent clip jobs</div>
          <FinelyOsPaginatedStack
            items={clipJobs.slice(0, 40)}
            pageSize={5}
            renderItem={(job: TourClipJob) => (
              <div key={job.id} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>{job.title}</div>
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-xs`}>{job.status} · {job.tourId ?? 'unassigned'}</div>
                </div>
                <Film size={14} className="opacity-40" />
              </div>
            )}
          />
        </div>
      ) : null}
    </div>
  );
}
