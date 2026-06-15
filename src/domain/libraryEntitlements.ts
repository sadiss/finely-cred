/** My Library — bookstore entitlements and reading progress. */

export type LibraryBookEntitlement = {
  partnerId: string;
  bookSlug: string;
  grantedAt: string;
  source: 'purchase' | 'admin_grant' | 'demo' | 'subscription';
  agreementId?: string;
};

export type LibraryReadingProgress = {
  partnerId: string;
  bookSlug: string;
  chapterId: string;
  scrollPercent: number;
  audioSeconds: number;
  updatedAt: string;
};

export type LibraryBookmark = {
  id: string;
  partnerId: string;
  bookSlug: string;
  chapterId: string;
  label: string;
  note?: string;
  createdAt: string;
};

export const LIBRARY_ENTITLEMENT_PREFIX = 'library.book.';

export function libraryEntitlementKey(bookSlug: string) {
  return `${LIBRARY_ENTITLEMENT_PREFIX}${bookSlug}` as `${typeof LIBRARY_ENTITLEMENT_PREFIX}${string}`;
}

export type BookChapter = {
  id: string;
  title: string;
  body: string;
  index: number;
};

/** Split markdown into readable chapters (## headings). */
export function splitBookIntoChapters(markdown: string, bookSlug: string): BookChapter[] {
  const raw = (markdown || '').trim();
  if (!raw) {
    return [{ id: 'intro', title: 'Introduction', body: 'Content coming soon.', index: 0 }];
  }

  const chunks = raw.split(/\n(?=## )/);
  if (chunks.length <= 1 && !raw.includes('\n## ')) {
    const titleMatch = raw.match(/^#\s+(.+)/m);
    return [
      {
        id: `${bookSlug}-full`,
        title: titleMatch?.[1]?.trim() ?? 'Full book',
        body: raw,
        index: 0,
      },
    ];
  }

  return chunks.map((chunk, index) => {
    const lines = chunk.trim().split('\n');
    const headingLine = lines.find((l) => l.startsWith('## ')) ?? lines.find((l) => l.startsWith('# '));
    const title = headingLine?.replace(/^#+\s*/, '').trim() ?? `Chapter ${index + 1}`;
    const id = `${bookSlug}-ch-${index + 1}`;
    return { id, title, body: chunk.trim(), index };
  });
}
