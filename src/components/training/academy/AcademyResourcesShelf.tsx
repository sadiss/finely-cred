import React from 'react';
import { ExternalLink, Library } from 'lucide-react';

const RESOURCES = [
  { en: 'CFPB — consumer complaints', url: 'https://www.consumerfinance.gov/complaint/', tag: 'public' },
  { en: 'FTC — credit reporting', url: 'https://consumer.ftc.gov/articles/disputing-errors-credit-reports', tag: 'public' },
  { en: 'FDIC — consumer resources', url: 'https://www.fdic.gov/consumers', tag: 'public' },
  { en: 'Academy workflow map', path: '/admin/specialist-academy/workflow', tag: 'internal' },
  { en: 'Track H — Metro 2 lesson', path: '/admin/specialist-academy/h-metro2', tag: 'internal' },
  { en: 'Lead Intel (OSM / CSE fallback)', path: '/admin/lead-intel', tag: 'admin' },
];

export function AcademyResourcesShelf({ lang }: { lang: 'en' | 'ht' }) {
  return (
    <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6 space-y-3">
      <div className="flex items-center gap-2 text-violet-100 font-semibold">
        <Library size={18} /> {lang === 'ht' ? 'Resous' : 'Resources shelf'}
      </div>
      <ul className="space-y-2">
        {RESOURCES.map((r) => (
          <li key={r.en}>
            {r.url ? (
              <a
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-sky-300 hover:text-sky-200"
              >
                {r.en} <ExternalLink size={12} />
              </a>
            ) : (
              <a href={r.path} className="text-sm text-amber-300 hover:text-amber-200">
                {r.en}
              </a>
            )}
            <span className="ml-2 text-[10px] uppercase text-white/35">{r.tag}</span>
          </li>
        ))}
      </ul>
      <p className="text-white/45 text-xs">
        {lang === 'ht'
          ? 'Adapters: OSM san kle, Google CSE ak secret, Bing slot — gade PLATFORM-OS.md'
          : 'API adapters: OSM (no key), Google CSE (cx + secret), Bing slot — see PLATFORM-OS.md'}
      </p>
    </div>
  );
}
