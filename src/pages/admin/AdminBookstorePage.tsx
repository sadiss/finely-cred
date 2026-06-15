import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Headphones, Loader2, Plus, Save, Search, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import type { BookstoreProduct } from '../../domain/bookstore';
import {
  createBookstoreProduct,
  deleteBookstoreProduct,
  listBookstoreProducts,
  upsertBookstoreProduct,
} from '../../data/bookstoreRepo';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsOverviewStatTile } from '../../features/os/FinelyOsOverviewStatTile';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { formatPrice } from '../../config/pricingCatalog';
import { narrateBookstoreProduct } from '../../lib/bookstoreVoiceNarrate';
import { getVoiceStudioStatus } from '../../lib/voiceStudioClient';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_ENTITY_CHIP,
  finelyOsCatalogCard,
  finelyOsStatusChip,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_DANGER_BTN,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_LUXURY_EMPTY,
  finelyOsListItem,
} from '../../features/os/finelyOsLightUi';

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

function bulletsToText(bullets: string[]) {
  return (bullets ?? []).join('\n');
}

function textToBullets(text: string) {
  return (text || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 24);
}

export default function AdminBookstorePage() {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [voiceBusy, setVoiceBusy] = useState(false);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const products = useMemo(() => {
    const all = listBookstoreProducts({ includeUnpublished: true });
    const query = q.trim().toLowerCase();
    if (!query) return all;
    return all.filter((p) => `${p.title} ${p.sub} ${p.slug} ${p.desc}`.toLowerCase().includes(query));
  }, [q, version]);

  const selected = useMemo(() => {
    if (!selectedId) return products[0] ?? null;
    return products.find((p) => p.id === selectedId) ?? products[0] ?? null;
  }, [products, selectedId]);

  const [draft, setDraft] = useState<BookstoreProduct | null>(selected ? clone(selected) : null);
  const [bulletsRaw, setBulletsRaw] = useState('');

  useEffect(() => {
    if (!selected) {
      setDraft(null);
      setBulletsRaw('');
      return;
    }
    setSelectedId(selected.id);
    setDraft(clone(selected));
    setBulletsRaw(bulletsToText(selected.bullets));
  }, [selected?.id]);

  const publishedCount = products.filter((p) => p.published).length;
  const draftCount = products.length - publishedCount;

  const save = () => {
    if (!draft) return;
    const cleaned: BookstoreProduct = {
      ...draft,
      slug: (draft.slug || '').trim().toLowerCase().replace(/\s+/g, '-'),
      title: (draft.title || '').trim() || 'Untitled book',
      sub: (draft.sub || '').trim() || 'Resource',
      vol: (draft.vol || '').trim() || undefined,
      accentColor: (draft.accentColor || '').trim() || '#f59e0b',
      priceAmount: Number.isFinite(draft.priceAmount) ? Math.max(0, Math.round(draft.priceAmount)) : 0,
      desc: (draft.desc || '').trim(),
      bullets: textToBullets(bulletsRaw),
      contentMarkdown: (draft.contentMarkdown || '').toString(),
    };
    upsertBookstoreProduct(cleaned);
    window.dispatchEvent(new Event('finely:store'));
    setNotice('Saved.');
    window.setTimeout(() => setNotice(null), 1500);
    setVersion((v) => v + 1);
  };

  return (
    <PageShell badge="Admin" title="Bookstore" subtitle="Create, edit, publish, and expand in-depth books.">
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <button
            type="button"
            onClick={() => {
              const p = createBookstoreProduct({ title: 'New book', sub: 'Resource' });
              window.dispatchEvent(new Event('finely:store'));
              setSelectedId(p.id);
            }}
            className={FINELY_OS_SUCCESS_BTN}
          >
            <Plus size={14} /> New book
          </button>
        </div>

        {notice && <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div>}

        <div className="grid sm:grid-cols-3 gap-4">
          <FinelyOsOverviewStatTile icon={BookOpen} label="Titles" value={products.length} accent="violet" iconAccent="violet" />
          <FinelyOsOverviewStatTile icon={Save} label="Published" value={publishedCount} accent="emerald" iconAccent="emerald" />
          <FinelyOsOverviewStatTile icon={BookOpen} label="Drafts" value={draftCount} accent="violet" iconAccent="violet" />
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className={`lg:col-span-4 space-y-4 ${finelyOsCatalogCard('violet')} !p-5`} data-fc-accent="violet">
            <div className={`flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
              <Search size={16} className="text-violet-700 shrink-0" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search books…"
                className={`bg-transparent outline-none w-full text-sm ${FINELY_OS_ENTITY_VALUE} placeholder:opacity-40`}
              />
            </div>
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{products.length} items</div>

            <FinelyOsPaginatedStack
              items={products}
              pageSize={10}
              itemSpacingClassName="space-y-2"
              emptyMessage="No books match."
              renderItem={(p) => {
                const active = p.id === (selected?.id ?? '');
                return (
                  <button key={p.id} type="button" onClick={() => setSelectedId(p.id)} className={finelyOsListItem(active, 'violet')}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 text-violet-700">
                          <BookOpen size={16} />
                          <span className="text-xs font-semibold uppercase tracking-wider">{p.published ? 'Published' : 'Draft'}</span>
                        </div>
                        <div className={`mt-2 ${FINELY_OS_ENTITY_VALUE} font-semibold truncate`}>{p.title}</div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-sm truncate`}>{p.sub}</div>
                        <div className={`mt-2 ${FINELY_OS_ENTITY_SUBLABEL} font-mono truncate`}>
                          {p.slug} • {formatPrice(p.priceAmount)}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              }}
            />
          </div>

          <div className={`lg:col-span-8 space-y-5 ${finelyOsCatalogCard('emerald')} !p-5`} data-fc-accent="emerald">
            {!draft ? (
              <div className={FINELY_OS_LUXURY_EMPTY}>Select a book to edit.</div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>Editor</div>
                    <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{draft.id}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={save} className={FINELY_OS_PRIMARY_BTN}>
                      <Save size={14} /> Save
                    </button>
                    <button
                      type="button"
                      disabled={voiceBusy || !draft.contentMarkdown?.trim()}
                      onClick={async () => {
                        if (!draft) return;
                        setVoiceBusy(true);
                        try {
                          const studio = getVoiceStudioStatus();
                          if (!studio.available) throw new Error(studio.reason ?? 'Voice Studio unavailable.');
                          const res = await narrateBookstoreProduct({ product: draft });
                          setNotice(`Narration: ${res.ok} chapters rendered${res.failed ? `, ${res.failed} failed` : ''}.`);
                        } catch (e: unknown) {
                          setNotice((e as Error)?.message ?? 'Narration failed.');
                        } finally {
                          setVoiceBusy(false);
                          window.setTimeout(() => setNotice(null), 4000);
                        }
                      }}
                      className={FINELY_OS_SUCCESS_BTN}
                    >
                      {voiceBusy ? <Loader2 size={14} className="animate-spin" /> : <Headphones size={14} />} Generate narration
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!draft) return;
                        deleteBookstoreProduct(draft.id);
                        window.dispatchEvent(new Event('finely:store'));
                        setSelectedId(null);
                        setVersion((v) => v + 1);
                      }}
                      className={FINELY_OS_DANGER_BTN}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <label className="block">
                    <div className={FINELY_OS_ENTITY_LABEL}>Slug (URL)</div>
                    <input
                      value={draft.slug}
                      onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                      className={`${FINELY_OS_ENTITY_INPUT} font-mono`}
                      placeholder="my-book-slug"
                    />
                  </label>
                  <label className="block">
                    <div className={FINELY_OS_ENTITY_LABEL}>Published</div>
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, published: !draft.published })}
                      className={`mt-2 w-full rounded-xl border px-4 py-3 text-left transition-all ${
                        draft.published
                          ? finelyOsStatusChip('ok')
                          : `${FINELY_OS_ENTITY_CHIP} hover:bg-white/[0.06] w-full`
                      }`}
                    >
                      <div className="text-xs font-semibold uppercase tracking-wider">{draft.published ? 'Published' : 'Draft'}</div>
                      <div className="mt-1 text-xs opacity-80">
                        {draft.published ? 'Visible on the public bookstore.' : 'Hidden unless you are an admin.'}
                      </div>
                    </button>
                  </label>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <label className="block">
                    <div className={FINELY_OS_ENTITY_LABEL}>Title</div>
                    <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className={FINELY_OS_ENTITY_INPUT} />
                  </label>
                  <label className="block">
                    <div className={FINELY_OS_ENTITY_LABEL}>Subtitle</div>
                    <input value={draft.sub} onChange={(e) => setDraft({ ...draft, sub: e.target.value })} className={FINELY_OS_ENTITY_INPUT} />
                  </label>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <label className="block">
                    <div className={FINELY_OS_ENTITY_LABEL}>Volume</div>
                    <input
                      value={draft.vol ?? ''}
                      onChange={(e) => setDraft({ ...draft, vol: e.target.value })}
                      className={`${FINELY_OS_ENTITY_INPUT} font-mono`}
                      placeholder="04"
                    />
                  </label>
                  <label className="block">
                    <div className={FINELY_OS_ENTITY_LABEL}>Accent color</div>
                    <input
                      value={draft.accentColor}
                      onChange={(e) => setDraft({ ...draft, accentColor: e.target.value })}
                      className={`${FINELY_OS_ENTITY_INPUT} font-mono`}
                      placeholder="#f59e0b"
                    />
                  </label>
                  <label className="block">
                    <div className={FINELY_OS_ENTITY_LABEL}>Price (cents)</div>
                    <input
                      type="number"
                      value={draft.priceAmount}
                      onChange={(e) => setDraft({ ...draft, priceAmount: parseInt(e.target.value || '0', 10) })}
                      className={`${FINELY_OS_ENTITY_INPUT} font-mono`}
                    />
                    <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} text-xs`}>Preview: {formatPrice(draft.priceAmount)}</div>
                  </label>
                </div>

                <label className="block">
                  <div className={FINELY_OS_ENTITY_LABEL}>Short description</div>
                  <textarea
                    value={draft.desc}
                    onChange={(e) => setDraft({ ...draft, desc: e.target.value })}
                    className={`${FINELY_OS_ENTITY_INPUT} min-h-[80px]`}
                  />
                </label>

                <label className="block">
                  <div className={FINELY_OS_ENTITY_LABEL}>Bullets (one per line)</div>
                  <textarea value={bulletsRaw} onChange={(e) => setBulletsRaw(e.target.value)} className={`${FINELY_OS_ENTITY_INPUT} min-h-[120px]`} />
                </label>

                <label className="block">
                  <div className={FINELY_OS_ENTITY_LABEL}>In-depth content (markdown)</div>
                  <textarea
                    value={draft.contentMarkdown ?? ''}
                    onChange={(e) => setDraft({ ...draft, contentMarkdown: e.target.value })}
                    className={`${FINELY_OS_ENTITY_INPUT} min-h-[260px] font-mono text-[12px]`}
                  />
                </label>
              </>
            )}
          </div>
        </div>
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
