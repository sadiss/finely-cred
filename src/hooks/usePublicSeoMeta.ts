import { useEffect } from 'react';
import { usePageMeta } from './usePageMeta';
import {
  buildArticleSchema,
  buildAudioObjectSchema,
  buildFaqPageSchema,
  buildHowToSchema,
  buildLocalBusinessSchema,
  buildOrganizationSchema,
  buildWebPageSchema,
  buildWebSiteSchema,
  injectJsonLd,
} from '../lib/seoSchema';

function upsertLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

function isArticlePath(path: string) {
  return path.startsWith('/resources/') && path !== '/resources/videos' && path !== '/resources/pins';
}

/** Title, description, canonical, and JSON-LD for public marketing routes (Phase 35). */
export function usePublicSeoMeta(args: {
  title: string;
  description: string;
  path: string;
  audio?: { name: string; description: string; contentUrl?: string; durationSec?: number };
  faqs?: Array<{ q: string; a: string }>;
  howTo?: { name: string; description: string; steps: string[] };
  local?: { city: string; state: string };
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

    setMeta('name', 'robots', 'index, follow');
    setMeta('property', 'og:title', args.title);
    setMeta('property', 'og:description', args.description);
    setMeta('property', 'og:url', pageUrl);
    setMeta('property', 'og:type', isArticlePath(args.path) ? 'article' : 'website');
    setMeta('property', 'og:image', `${origin}/brand/finely-cred-logo-dark.png`);
    upsertLink('canonical', pageUrl);

    injectJsonLd('fc-org-schema', buildOrganizationSchema(origin));
    injectJsonLd('fc-website-schema', buildWebSiteSchema(origin));
    injectJsonLd(
      'fc-webpage-schema',
      buildWebPageSchema({
        origin,
        path: args.path,
        name: args.title,
        description: args.description,
      }),
    );
    if (isArticlePath(args.path)) {
      injectJsonLd(
        'fc-article-schema',
        buildArticleSchema({
          origin,
          path: args.path,
          name: args.title,
          description: args.description,
        }),
      );
    } else {
      document.getElementById('fc-article-schema')?.remove();
    }
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
    if (args.faqs?.length) {
      injectJsonLd('fc-faq-schema', buildFaqPageSchema({ questions: args.faqs }));
    }
    if (args.howTo) {
      injectJsonLd('fc-howto-schema', buildHowToSchema(args.howTo));
    }
    if (args.local) {
      injectJsonLd(
        'fc-local-schema',
        buildLocalBusinessSchema({
          origin,
          city: args.local.city,
          state: args.local.state,
          description: args.description,
        }),
      );
    }
    return () => {
      document.getElementById('fc-webpage-schema')?.remove();
      document.getElementById('fc-article-schema')?.remove();
      document.getElementById('fc-audio-schema')?.remove();
      document.getElementById('fc-faq-schema')?.remove();
      document.getElementById('fc-howto-schema')?.remove();
      document.getElementById('fc-local-schema')?.remove();
    };
  }, [
    args.title,
    args.description,
    args.path,
    args.audio?.name,
    args.audio?.description,
    args.audio?.contentUrl,
    args.audio?.durationSec,
    args.faqs,
    args.howTo,
    args.local?.city,
    args.local?.state,
  ]);
}
