import React from 'react';
import { ArrowLeft, ExternalLink, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminIvoryPreviewShell, IVORY_PREVIEW_SURFACES } from '../../features/adminIvoryPreview';

/**
 * Admin-only hub of layout/structure previews (tiles, not long lists).
 * Dark canvas matches live /admin — theme redesign is out of scope here.
 */
export default function AdminIvoryPreviewHubPage() {
  const navigate = useNavigate();

  return (
    <AdminIvoryPreviewShell surfaceId="hub" showSwitcher={false}>
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-200/80">
              <Sparkles size={14} /> Layout preview
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Structure previews
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/65">
              Redesign layout and boxes on the live dark admin theme. Preview routes wrap the same page
              components — live pages stay untouched.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2 text-sm font-medium text-white/85 hover:bg-white/[0.1]"
          >
            <ArrowLeft size={14} /> Admin dashboard
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {IVORY_PREVIEW_SURFACES.map((surface) => {
            const soon = surface.status === 'soon';
            return (
              <button
                key={surface.id}
                type="button"
                disabled={soon}
                onClick={() => {
                  if (!soon) navigate(surface.path);
                }}
                className={[
                  'rounded-2xl border border-white/10 bg-white/[0.05] p-5 text-left transition-all',
                  soon
                    ? 'cursor-not-allowed opacity-70'
                    : 'hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.08]',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-base font-semibold text-white">{surface.title}</div>
                  {soon ? (
                    <span className="shrink-0 rounded-full border border-white/12 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/55">
                      Coming soon
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full border border-emerald-400/25 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-200">
                      Ready
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{surface.blurb}</p>
                {!soon && surface.livePath ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/45">
                    <span className="font-mono text-white/70">{surface.path}</span>
                    <span
                      role="link"
                      tabIndex={0}
                      className="inline-flex items-center gap-1 text-amber-200 hover:underline"
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
                      Live <ExternalLink size={11} />
                    </span>
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
          <strong className="font-semibold text-white">How to compare:</strong> open a Ready tile, then use{' '}
          <em>Open live</em> in the preview banner (or open the live path in another tab). Live{' '}
          <code className="text-white/85">/admin</code> stays on the same dark theme.
        </div>
      </div>
    </AdminIvoryPreviewShell>
  );
}
