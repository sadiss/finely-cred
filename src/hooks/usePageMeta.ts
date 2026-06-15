import { useEffect } from 'react';

/** Set document title + meta description for public/marketing routes (tier 329). */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title.includes('Finely') ? title : `${title} — Finely Cred`;
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    const prevDesc = meta?.getAttribute('content') ?? '';
    if (description) {
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'description';
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', description);
    }
    return () => {
      document.title = prevTitle;
      if (description && meta) meta.setAttribute('content', prevDesc);
    };
  }, [title, description]);
}
