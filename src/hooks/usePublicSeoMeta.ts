import { useEffect } from 'react';
import { usePageMeta } from './usePageMeta';
import { buildAudioObjectSchema, buildOrganizationSchema, buildWebPageSchema, injectJsonLd } from '../lib/seoSchema';

/** Title, description, and JSON-LD for public marketing routes (Phase 35). */
export function usePublicSeoMeta(args: {
  title: string;
  description: string;
  path: string;
  audio?: { name: string; description: string; contentUrl?: string; durationSec?: number };
}) {
  usePageMeta(args.title, args.description);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const origin = window.location.origin;
    const pageUrl = `${origin}${args.path === '/' ? '' : args.path}`;

    const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('property', 'og:title', args.title);
    setMeta('property', 'og:description', args.description);
    setMeta('property', 'og:url', pageUrl);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:image', `${origin}/brand/finely-cred-logo-dark.png`);

    injectJsonLd('fc-org-schema', buildOrganizationSchema(origin));
    injectJsonLd(
      'fc-webpage-schema',
      buildWebPageSchema({
        origin,
        path: args.path,
        name: args.title,
        description: args.description,
      }),
    );
    if (args.audio) {
      injectJsonLd(
        'fc-audio-schema',
        buildAudioObjectSchema({
          origin,
          name: args.audio.name,
          description: args.audio.description,
          contentUrl: args.audio.contentUrl,
          durationSec: args.audio.durationSec,
        }),
      );
    }
    return () => {
      document.getElementById('fc-webpage-schema')?.remove();
      document.getElementById('fc-audio-schema')?.remove();
    };
  }, [args.title, args.description, args.path, args.audio?.name, args.audio?.description, args.audio?.contentUrl, args.audio?.durationSec]);
}
