import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Bookmark, Headphones, ChevronLeft, ChevronRight } from 'lucide-react';
import type { BookstoreProduct } from '../../domain/bookstore';
import { splitBookIntoChapters } from '../../domain/libraryEntitlements';
import { addBookmark, getReadingProgress, listBookmarks, saveReadingProgress } from '../../data/libraryRepo';
import { buildDefaultNarration, getGuideNarration } from '../../resources/guideNarration';
import { FinelyAudioPlayer } from '../audio/FinelyAudioPlayer';
import { BookMarkdownRenderer } from '../bookstore/BookMarkdownRenderer';
import { downloadBookstorePdf } from '../../resources/buildBookstorePdf';
import { Download } from 'lucide-react';
import {FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_GLASS_INNER,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlassShell,
  finelyOsCatalogCard,} from '../../features/os/finelyOsLightUi';

type Mode = 'read' | 'listen';

export function BookReaderPanel({
  product,
  partnerId,
  onBack,
  initialMode = 'read',
}: {
  product: BookstoreProduct;
  partnerId: string;
  onBack: () => void;
  initialMode?: Mode;
}) {
  const chapters = useMemo(
    () => splitBookIntoChapters(product.contentMarkdown ?? '', product.slug),
    [product.contentMarkdown, product.slug],
  );

  const saved = getReadingProgress(partnerId, product.slug);
  const initialChapter = saved?.chapterId
    ? Math.max(0, chapters.findIndex((c) => c.id === saved.chapterId))
    : 0;

  const [chapterIdx, setChapterIdx] = useState(initialChapter >= 0 ? initialChapter : 0);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [bookmarks, setBookmarks] = useState(() => listBookmarks(partnerId, product.slug));
  const [exportBusy, setExportBusy] = useState(false);

  const chapter = chapters[chapterIdx] ?? chapters[0]!;

  const narration = useMemo(() => {
    const custom = getGuideNarration(
      `ebook-${product.slug}-${chapter.id}`,
      `${product.title} — ${chapter.title}`,
      [{ heading: chapter.title, bullets: chapter.body.split('\n').filter((l) => l.trim().length > 20).slice(0, 12) }],
    );
    if (custom.segments.length > 3) return custom;
    return buildDefaultNarration(
      `ebook-${product.slug}-${chapter.id}`,
      `${product.title} — ${chapter.title}`,
      [{ heading: chapter.title, bullets: [chapter.body.slice(0, 2000)] }],
    );
  }, [chapter.body, chapter.id, chapter.title, product.slug, product.title]);

  useEffect(() => {
    saveReadingProgress({
      partnerId,
      bookSlug: product.slug,
      chapterId: chapter.id,
      scrollPercent: Math.round(((chapterIdx + 1) / chapters.length) * 100),
      audioSeconds: 0,
    });
  }, [chapter.id, chapterIdx, chapters.length, partnerId, product.slug]);

  const addChapterBookmark = () => {
    const bm = addBookmark({
      partnerId,
      bookSlug: product.slug,
      chapterId: chapter.id,
      label: chapter.title,
    });
    setBookmarks((prev) => [bm, ...prev]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className={FINELY_OS_SECONDARY_BTN}>
          ← My Library
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('read')}
            className={mode === 'read' ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN}
          >
            <BookOpen size={14} /> Read
          </button>
          <button
            type="button"
            onClick={() => setMode('listen')}
            className={mode === 'listen' ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN}
          >
            <Headphones size={14} /> Listen
          </button>
        </div>
      </div>

      <div className={finelyOsGlassShell('panel', 'amber')}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>
          Chapter {chapterIdx + 1} of {chapters.length}
        </div>
        <div className={`${FINELY_OS_ENTITY_VALUE} text-xl font-bold mt-1`}>{chapter.title}</div>
        <div className={`${FINELY_OS_ENTITY_BODY} text-sm mt-1`}>{product.title}</div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <button
            type="button"
            disabled={chapterIdx <= 0}
            onClick={() => setChapterIdx((i) => Math.max(0, i - 1))}
            className={FINELY_OS_SECONDARY_BTN}
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <button
            type="button"
            disabled={chapterIdx >= chapters.length - 1}
            onClick={() => setChapterIdx((i) => Math.min(chapters.length - 1, i + 1))}
            className={FINELY_OS_SECONDARY_BTN}
          >
            Next <ChevronRight size={14} />
          </button>
          <button type="button" onClick={addChapterBookmark} className={FINELY_OS_SECONDARY_BTN}>
            <Bookmark size={14} /> Bookmark
          </button>
          <button
            type="button"
            disabled={exportBusy}
            onClick={async () => {
              setExportBusy(true);
              try {
                await downloadBookstorePdf({ product, previewOnly: false });
              } finally {
                setExportBusy(false);
              }
            }}
            className={FINELY_OS_SECONDARY_BTN}
          >
            <Download size={14} /> {exportBusy ? 'Exporting…' : 'Export PDF'}
          </button>
        </div>
      </div>

      {mode === 'read' ? (
        <article className={`${finelyOsCatalogCard('sky')} !p-6 fc-surface-harmony`}>
          <BookMarkdownRenderer markdown={chapter.body} accent="amber" />
        </article>
      ) : (
        <FinelyAudioPlayer
          narration={narration}
          contentType="ebook"
          autoPlayPreview={initialMode === 'listen'}
          presetOnly
          tenantId="finely_cred"
        />
      )}

      {bookmarks.length > 0 ? (
        <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Bookmarks</div>
          <ul className="mt-2 space-y-1">
            {bookmarks.slice(0, 8).map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  className="text-sm text-emerald-300 hover:underline"
                  onClick={() => {
                    const idx = chapters.findIndex((c) => c.id === b.chapterId);
                    if (idx >= 0) setChapterIdx(idx);
                  }}
                >
                  {b.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
