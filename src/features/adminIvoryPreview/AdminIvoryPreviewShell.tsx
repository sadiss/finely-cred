import React from 'react';
import { ArrowLeft, ExternalLink, LayoutGrid, Sparkles } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { IvoryPreviewProvider } from './IvoryPreviewProvider';
import { IVORY_PREVIEW_READY, type IvoryPreviewSurface } from './ivoryPreviewCatalog';

function surfaceForPath(pathname: string): IvoryPreviewSurface | undefined {
  return IVORY_PREVIEW_READY.find((s) => s.path === pathname);
}

/**
 * Shared layout-preview chrome: Preview-only banner + surface switcher chips.
 * Wraps children with IvoryPreviewProvider (dark tokens on wrapper only).
 */
export function AdminIvoryPreviewShell({
  surfaceId,
  children,
  showSwitcher = true,
}: {
  surfaceId?: string;
  children: React.ReactNode;
  showSwitcher?: boolean;
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active = surfaceForPath(pathname);
  const resolvedId = surfaceId ?? active?.id ?? null;
  const livePath = active?.livePath;

  return (
    <IvoryPreviewProvider surfaceId={resolvedId}>
      <div className="sticky top-0 z-[220] border-b border-white/10 bg-[#0a100e]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:px-6">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/25 bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-200">
              <Sparkles size={12} /> Layout preview
            </span>
            <span className="truncate text-sm text-white/70">
              Structure preview — live theme unchanged
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/admin/preview')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.06] px-2.5 py-1.5 text-xs font-medium text-white/85 hover:bg-white/[0.1]"
            >
              <LayoutGrid size={13} /> All previews
            </button>
            {livePath ? (
              <Link
                to={livePath}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.06] px-2.5 py-1.5 text-xs font-medium text-white/85 hover:bg-white/[0.1]"
                title="Open the live admin surface"
              >
                Open live <ExternalLink size={12} />
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-2 py-1.5 text-xs text-white/55 hover:text-white/90"
            >
              <ArrowLeft size={13} /> Admin
            </button>
          </div>
        </div>

        {showSwitcher ? (
          <div className="mx-auto flex max-w-7xl flex-wrap gap-1.5 px-4 pb-2.5 sm:px-6">
            {IVORY_PREVIEW_READY.map((s) => {
              const on = pathname === s.path;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => navigate(s.path)}
                  className={[
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    on
                      ? 'border-amber-400/35 bg-amber-500/20 text-amber-100 shadow-sm'
                      : 'border-white/12 bg-white/[0.05] text-white/70 hover:bg-white/[0.1] hover:text-white/90',
                  ].join(' ')}
                >
                  {s.title}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
      {children}
    </IvoryPreviewProvider>
  );
}
