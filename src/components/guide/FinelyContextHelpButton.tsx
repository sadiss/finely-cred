import React, { useMemo, useState } from 'react';
import { HelpCircle, X, BookOpen, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { contextHelpForPath, routeKnowledgeForPath, launchOsHelpForPath } from '../../lib/knowledgeBaseRouter';
import { getModulePlaybookForPath } from '../../config/modulePlaybooks';
import { canShowPublicDemoVideos } from '../../config/publicMediaPolicy';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_GLASS_CATALOG,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';

function isAppHelpRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/portal') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/owners-guide')
  );
}

export function FinelyContextHelpButton() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const ctx = useMemo(() => contextHelpForPath(pathname), [pathname]);
  const launch = useMemo(() => launchOsHelpForPath(pathname), [pathname]);
  const moduleGuide = useMemo(() => getModulePlaybookForPath(pathname), [pathname]);
  const kb = useMemo(() => (open ? routeKnowledgeForPath(pathname) : null), [open, pathname]);

  if (!isAppHelpRoute(pathname)) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Context help"
        title={`Help: ${ctx.label}`}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-[170] flex h-12 w-12 items-center justify-center rounded-full border border-violet-400/30 bg-violet-950/90 text-violet-200 shadow-xl backdrop-blur hover:bg-violet-900/95 transition-all"
      >
        {open ? <X size={20} /> : <HelpCircle size={22} />}
      </button>

      {open ? (
        <div className="fixed bottom-20 right-6 z-[170] w-[min(100vw-2rem,380px)]">
          <div className={`${FINELY_OS_GLASS_CATALOG} space-y-4 p-4`}>
            <div>
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-amber-300`}>
                <Sparkles size={14} />
                <span>Context help</span>
              </div>
              <h3 className="mt-1 text-lg font-semibold text-white/95">{ctx.label}</h3>
              <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                KB category: <span className="text-white/70">{ctx.category}</span>
              </p>
            </div>

            {moduleGuide ? (
              <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>{moduleGuide.plainSummary}</p>
            ) : null}

            {launch.sop ? (
              <div className={`rounded-lg border px-3 py-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                <div className="font-medium text-white/90">{launch.sop.title}</div>
                <p className="mt-1 text-white/70">{launch.sop.whenToUse}</p>
                <ol className="mt-2 list-decimal pl-5 space-y-1 text-white/75">
                  {launch.sop.steps.slice(0, 4).map((s) => (
                    <li key={s.order}>{s.label}</li>
                  ))}
                </ol>
                {launch.tour && canShowPublicDemoVideos(pathname) ? (
                  <p className="mt-2 text-amber-200/90">Tip: use Watch how for {launch.tour.title}.</p>
                ) : null}
              </div>
            ) : null}

            {kb?.chunks.length ? (
              <ul className={`space-y-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                {kb.chunks.slice(0, 3).map((c) => (
                  <li key={c.article.id} className="rounded-lg fc-light-glass-panel fc-light-chrome-panel border px-3 py-2">
                    <div className="font-medium text-white/85">{c.article.title}</div>
                    <div className="mt-1 text-white/65 line-clamp-3">{c.excerpt}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>Open the owner&apos;s guide for full workflows on this screen.</p>
            )}

            <div className="flex flex-wrap gap-2">
              <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate(ctx.ownersGuideHref)}>
                <BookOpen size={14} /> Owner&apos;s guide
              </button>
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/help-center')}>
                Launch playbooks
              </button>
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
