import React from 'react';
import { Globe, ExternalLink, FileText } from 'lucide-react';
import { PUBLIC_SEO_CATALOG } from '../../data/publicSeoCatalog';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_GLASS_CATALOG,
  FINELY_OS_SECONDARY_BTN,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

export function AdminSeoHealthPanel() {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className={`${FINELY_OS_GLASS_CATALOG} space-y-4`}>
      <div>
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-sky-300`}>
          <Globe size={16} />
          <span>SEO & schema</span>
        </div>
        <h3 className={FINELY_OS_ENTITY_TITLE}>Public page meta catalog</h3>
        <p className={FINELY_OS_ENTITY_BODY}>
          Marketing routes with title, description, and JSON-LD WebPage schema via usePublicSeoMeta.
          Static sitemap: <span className="font-mono">npm run sitemap:generate</span> (runs before build).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <a href={`${origin}/sitemap.xml`} target="_blank" rel="noreferrer" className={FINELY_OS_SECONDARY_BTN}>
          sitemap.xml <ExternalLink size={12} />
        </a>
        <a href={`${origin}/robots.txt`} target="_blank" rel="noreferrer" className={FINELY_OS_SECONDARY_BTN}>
          robots.txt <ExternalLink size={12} />
        </a>
        <span className={`inline-flex items-center gap-1.5 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          <FileText size={12} /> {PUBLIC_SEO_CATALOG.length} indexed routes
        </span>
      </div>

      <ul className="space-y-2">
        {PUBLIC_SEO_CATALOG.map((route) => (
          <li key={route.path} className="flex flex-wrap items-center justify-between gap-3 fc-light-glass-panel fc-light-chrome-panel rounded-xl px-4 py-3">
            <div className="min-w-0">
              <div className="font-semibold text-white/90">{route.title}</div>
              <div className={`truncate font-mono text-xs ${FINELY_OS_ENTITY_BODY}`}>{route.path}</div>
              <div className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY} line-clamp-2`}>{route.description}</div>
            </div>
            <div className="flex items-center gap-2">
              {route.hasSchema ? finelyOsStatusChip('ok') : finelyOsStatusChip('warn')}
              <a href={`${origin}${route.path}`} target="_blank" rel="noreferrer" className={FINELY_OS_SECONDARY_BTN}>
                Preview <ExternalLink size={12} />
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
