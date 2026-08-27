import React from 'react';
import { ArrowLeft, ExternalLink, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminIvoryPreviewShell, IVORY_PREVIEW_SURFACES } from '../../features/adminIvoryPreview';
import {
  FINELY_OS_PAGE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsGlassPanel } from '../../features/os/FinelyOsGlassPanel';

/**
 * Admin-only hub of layout/structure previews (tiles, not long lists).
 * Dark canvas matches live /admin — theme redesign is out of scope here.
 */
export default function AdminIvoryPreviewHubPage() {
  const navigate = useNavigate();

  return (
    <AdminIvoryPreviewShell surfaceId="hub" showSwitcher={false}>
      <div className={`mx-auto max-w-7xl px-4 py-6 sm:px-6 ${FINELY_OS_PAGE}`}>
        <FinelyOsGlassPanel
          icon={Sparkles}
          title="Structure previews"
          subtitle="Redesign layout and boxes on the live dark admin theme. Preview routes wrap the same page components — live pages stay untouched."
          accent="violet"
          actions={
            <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_SECONDARY_BTN}>
              <ArrowLeft size={14} /> Admin dashboard
            </button>
          }
        >
          <p className={FINELY_OS_ENTITY_BODY}>
            Open a Ready tile to inspect structure. Live admin routes stay on the same dark theme.
          </p>
        </FinelyOsGlassPanel>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {IVORY_PREVIEW_SURFACES.map((surface, i) => {
            const soon = surface.status === 'soon';
            const accent = (['emerald', 'violet', 'sky', 'rose'] as const)[i % 4];
            return (
              <button
                key={surface.id}
                type="button"
                disabled={soon}
                onClick={() => {
                  if (!soon) navigate(surface.path);
                }}
                className={`${finelyOsCatalogCard(accent)} text-left ${soon ? 'cursor-not-allowed opacity-70' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className={FINELY_OS_ENTITY_VALUE}>{surface.title}</div>
                  {soon ? (
                    <span className="shrink-0 rounded-full border border-white/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white/70">
                      Coming soon
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-200">
                      Ready
                    </span>
                  )}
                </div>
                <p className={`${FINELY_OS_ENTITY_BODY} mt-3`}>{surface.blurb}</p>
                {!soon && surface.livePath ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/70">
                    <span className="font-mono text-white/80">{surface.path}</span>
                    <span
                      role="link"
                      tabIndex={0}
                      className="inline-flex items-center gap-1 font-bold text-sky-300 hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(surface.livePath!);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(surface.livePath!);
                        }
                      }}
                    >
                      Live <ExternalLink size={14} />
                    </span>
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className={finelyOsCatalogCard('sky')}>
          <strong className={FINELY_OS_ENTITY_VALUE}>How to compare:</strong>
          <p className={`${FINELY_OS_ENTITY_BODY} mt-2`}>
            Open a Ready tile, then use <em>Open live</em> in the preview banner (or open the live path in another tab). Live{' '}
            <code>/admin</code> stays on the same dark theme.
          </p>
        </div>
      </div>
    </AdminIvoryPreviewShell>
  );
}
