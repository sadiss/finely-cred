import React, { useMemo, useState } from 'react';
import { ArrowRight, Copy, Film, Play, RefreshCw, Scan, Terminal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { TOUR_MANIFEST } from '../../config/tourManifest';
import { SITE_SCAN_TARGETS } from '../../config/tourSiteScanner';
import { getPlatformSop } from '../../domain/platformSops';
import { FinelyTourPlayer } from '../../components/tours/FinelyTourPlayer';
import { TourVideoStatusBadge } from '../../components/tours/TourVideoStatusBadge';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import {
  FINELY_OS_PAGE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

export default function AdminTourStudioPage() {
  const navigate = useNavigate();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const previewTour = useMemo(() => TOUR_MANIFEST.find((t) => t.id === previewId) ?? null, [previewId]);
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
      { id: 'scan-site', label: 'Site scanner (recorder)', cmd: 'npm run tour:scan' },
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
    <PageShell
      badge="Admin"
      title="Tour Studio"
      subtitle="Manifest tours, step previews, and factory pipeline status — Part C Launch OS."
    >
      <div className={`${FINELY_OS_PAGE} space-y-6`}>
        <div className={`${finelyOsCatalogCard('violet')} !p-6 flex flex-wrap items-center justify-between gap-4`} data-fc-accent="violet">
          <div className="max-w-2xl space-y-2">
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>
              <Terminal size={16} />
              <span>Tour factory</span>
            </div>
            <p className={FINELY_OS_ENTITY_BODY}>
              {tourStats.total} tours · {tourStats.withSop} linked SOPs · {tourStats.lanes} lanes. Run{' '}
              <code className="opacity-80">npm run tour:scan</code> to walk the site like a video recorder (highlighted buttons + screenshots), then{' '}
              <code className="opacity-80">npm run tour:capture -- --all</code> ·{' '}
              <code className="opacity-80">npm run tour:assemble</code>.
              See <button type="button" className="underline" onClick={() => navigate('/admin/resources')}>Resources</button> for manual MP4 uploads.
            </p>
          </div>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/resources#videos')}>
            Public videos <ArrowRight size={14} />
          </button>
        </div>

        <div className={`${finelyOsCatalogCard('sky')} !p-5 space-y-4`} data-fc-accent="sky">
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-sky-300`}>
            <Scan size={16} />
            <span>Site scanner — video-recorder mode</span>
          </div>
          <p className={FINELY_OS_ENTITY_BODY}>
            Playwright walks each route below, scrolls to the highlighted control, draws a pulsing ring, and saves step screenshots +
            <code className="opacity-80"> highlights.json</code> under <code className="opacity-80">public/tours/site-scan/</code>.
            The tour player loads these for button highlights and per-step instruction checklists.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {SITE_SCAN_TARGETS.map((target) => (
              <div key={target.id} className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-2">
                <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold text-sm`}>{target.title}</div>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case`}>{target.path}</div>
                <ul className={`${FINELY_OS_ENTITY_BODY} text-xs space-y-1 list-disc pl-4`}>
                  {target.selectors.map((s) => (
                    <li key={s.selector}>
                      <span className="text-emerald-300">{s.label}</span> — {s.narration}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => void copyCmd('scan-site', 'npm run tour:scan')}>
            <Copy size={14} /> {copiedCmd === 'scan-site' ? 'Copied!' : 'Copy npm run tour:scan'}
          </button>
        </div>

        <div className={`${finelyOsCatalogCard('emerald')} !p-5 space-y-4`} data-fc-accent="emerald">
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300`}>
            <RefreshCw size={16} />
            <span>Regenerate pipeline</span>
          </div>
          <p className={FINELY_OS_ENTITY_BODY}>
            Run these in order from the project root. Dev server must be on port 5175 for capture.
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
        </div>

        <FinelyOsPaginatedStack
          items={TOUR_MANIFEST}
          pageSize={8}
          itemSpacingClassName="grid md:grid-cols-2 gap-4"
          renderItem={(tour) => {
            const sop = tour.relatedSopId ? getPlatformSop(tour.relatedSopId) : null;
            return (
              <div key={tour.id} className={`${finelyOsCatalogCard('sky')} !p-5 space-y-3`} data-fc-accent="sky">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>{tour.title}</div>
                    <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-1`}>{tour.startPath}</div>
                    <div className="mt-2">
                      <TourVideoStatusBadge tourId={tour.id} />
                    </div>
                  </div>
                  <Film size={18} className="opacity-50 shrink-0" />
                </div>
                <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>{tour.steps.length} steps · {sop?.title ?? 'No linked SOP'}</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => setPreviewId(tour.id)}>
                    <Play size={14} /> Preview steps
                  </button>
                  <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(tour.startPath)}>
                    Open route <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            );
          }}
        />

        <FinelyOsPageFooter />
      </div>

      <FinelyTourPlayer tour={previewTour} open={Boolean(previewTour)} onClose={() => setPreviewId(null)} />
    </PageShell>
  );
}
