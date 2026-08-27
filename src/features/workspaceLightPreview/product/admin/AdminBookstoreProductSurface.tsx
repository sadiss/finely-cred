import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Headphones, Loader2, Save, Search, Sparkles, Trash2 } from 'lucide-react';
import type { BookstoreProduct } from '../../../../domain/bookstore';
import {
  createBookstoreProduct,
  deleteBookstoreProduct,
  listBookstoreProducts,
  upsertBookstoreProduct,
} from '../../../../data/bookstoreRepo';
import { formatPrice } from '../../../../config/pricingCatalog';
import { narrateBookstoreProduct } from '../../../../lib/bookstoreVoiceNarrate';
import { getVoiceStudioStatus } from '../../../../lib/voiceStudioClient';
import {
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
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import './adminBookstoreProductSurface.css';

const SHELF_ACCENTS = ['violet', 'emerald', 'sky', 'rose'] as const;

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

function safeCoverStyle(accentColor?: string) {
  const coverColor = accentColor?.trim();
  if (!coverColor) return undefined;
  const lower = coverColor.toLowerCase();
  if (lower.includes('f59e0b') || lower.includes('amber') || lower.includes('gold')) return undefined;
  return { background: `linear-gradient(155deg, ${coverColor}, rgba(15, 23, 42, 0.55))` };
}

function BookCover({
  product,
  accent,
  size = 'shelf',
}: {
  product: BookstoreProduct;
  accent: (typeof SHELF_ACCENTS)[number];
  size?: 'hero' | 'shelf';
}) {
  const style = safeCoverStyle(product.accentColor);
  const dims = size === 'hero' ? 'w-24 h-36' : 'fc-admin-bookstore-cover';
  return (
    <div
      className={`${dims} flex shrink-0 items-center justify-center rounded-lg border-2 border-white/20 shadow-lg ${!style ? finelyOsCatalogCard(accent) : ''}`}
      data-fc-accent={accent}
      style={style}
    >
      <BookOpen size={size === 'hero' ? 36 : 24} className="text-white/90" />
    </div>
  );
}

export default function AdminBookstoreProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'emerald';
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
      accentColor: (draft.accentColor || '').trim() || '#8b5cf6',
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

  const createBook = () => {
    const p = createBookstoreProduct({ title: 'New book', sub: 'Resource' });
    window.dispatchEvent(new Event('finely:store'));
    setSelectedId(p.id);
  };

  const heroAccent = SHELF_ACCENTS[0];

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Studio"
      title="Bookstore"
      description="Create, edit, publish, and expand in-depth books."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={navItem?.icon}
      primaryAction={<ProductPagePrimaryAction label="New book" onClick={createBook} />}
      metrics={[
        { label: 'Titles', value: String(products.length), hint: 'On the shelf', accent: 'violet' },
        { label: 'Published', value: String(publishedCount), hint: 'Live in bookstore', accent: 'emerald' },
        { label: 'Drafts', value: String(draftCount), hint: 'Admin-only', accent: 'sky' },
        { label: 'Editing', value: draft?.title?.slice(0, 14) ?? '—', hint: 'Current title', accent: 'rose' },
      ]}
      metricTitle="Book inventory"
      metricDescription="Storefront mosaic on the left — compose studio on the right."
      metricsVariant="instrument"
    >
      {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}

      <div className="fc-admin-bookstore-layout" data-surface-layout="storefront-mosaic">
        <div className="space-y-6">
          {selected ? (
            <div className={`fc-admin-bookstore-hero ${finelyOsCatalogCard('violet')}`} data-fc-accent="violet">
              <BookCover product={selected} accent={heroAccent} size="hero" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 ${FINELY_OS_ENTITY_CHIP}`}>
                    <Sparkles size={12} /> Featured
                  </span>
                  <span className={selected.published ? finelyOsStatusChip('ok') : FINELY_OS_ENTITY_CHIP}>
                    {selected.published ? 'Published' : 'Draft'}
                  </span>
                  {selected.vol ? <span className={FINELY_OS_ENTITY_CHIP}>Vol {selected.vol}</span> : null}
                </div>
                <h2 className="mt-3 text-3xl font-extrabold">{selected.title}</h2>
                <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{selected.sub}</p>
                <div className={`mt-2 font-mono text-sm ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
                  {selected.slug} • {formatPrice(selected.priceAmount)}
                </div>
              </div>
            </div>
          ) : null}

          <section className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-5`} data-fc-accent="emerald">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <BookOpen size={16} />
                <span>Storefront shelf</span>
              </div>
              <div className={`flex items-center gap-2 flex-1 min-w-[200px] max-w-sm px-4 py-3 rounded-xl border border-white/10`}>
                <Search size={14} className="text-emerald-500 shrink-0" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search books…"
                  className={`bg-transparent outline-none w-full text-base ${FINELY_OS_ENTITY_VALUE} placeholder:opacity-40`}
                />
              </div>
              <span className={`font-mono text-sm ${FINELY_OS_ENTITY_SUBLABEL}`}>{products.length} titles</span>
            </div>

            {products.length === 0 ? (
              <div className={FINELY_OS_LUXURY_EMPTY}>No books match. Create a new title to fill the shelf.</div>
            ) : (
              <div className="fc-admin-bookstore-shelf">
                {products.map((p, index) => {
                  const active = p.id === (selected?.id ?? '');
                  const rowAccent = SHELF_ACCENTS[index % SHELF_ACCENTS.length];
                  return (
                    <button
                      key={p.id}
                      type="button"
                      data-selected={active ? 'true' : undefined}
                      onClick={() => setSelectedId(p.id)}
                      className={`fc-admin-bookstore-spine ${finelyOsCatalogCard(rowAccent)}`}
                      data-fc-accent={rowAccent}
                    >
                      <BookCover product={p} accent={rowAccent} />
                      <div className={`text-sm font-extrabold leading-tight line-clamp-2 ${FINELY_OS_ENTITY_VALUE}`}>{p.title}</div>
                      <span className={p.published ? finelyOsStatusChip('ok') : FINELY_OS_ENTITY_CHIP}>
                        {p.published ? 'Live' : 'Draft'}
                      </span>
                      <div className={`font-mono text-[11px] ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
                        {formatPrice(p.priceAmount)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="fc-admin-bookstore-studio">
          <section className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-5`} data-fc-accent="sky">
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
              <Save size={16} />
              <span>Compose studio</span>
            </div>

            {!draft ? (
              <div className={FINELY_OS_LUXURY_EMPTY}>Pick a spine from the storefront to edit.</div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{draft.title}</div>
                    <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono text-xs normal-case tracking-normal`}>{draft.id}</div>
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
                        draft.published ? finelyOsStatusChip('ok') : `${FINELY_OS_ENTITY_CHIP} hover:bg-white/[0.06] w-full`
                      }`}
                    >
                      <div className="text-xs font-bold uppercase tracking-wider">{draft.published ? 'Published' : 'Draft'}</div>
                      <div className="mt-1 text-sm font-semibold opacity-80">
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
                      placeholder="#8b5cf6"
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
                    rows={4}
                    className={FINELY_OS_ENTITY_INPUT}
                  />
                </label>

                <label className="block">
                  <div className={FINELY_OS_ENTITY_LABEL}>Bullets (one per line)</div>
                  <textarea value={bulletsRaw} onChange={(e) => setBulletsRaw(e.target.value)} rows={4} className={FINELY_OS_ENTITY_INPUT} />
                </label>

                <label className="block">
                  <div className={FINELY_OS_ENTITY_LABEL}>In-depth content (markdown)</div>
                  <textarea
                    value={draft.contentMarkdown ?? ''}
                    onChange={(e) => setDraft({ ...draft, contentMarkdown: e.target.value })}
                    rows={12}
                    className={`${FINELY_OS_ENTITY_INPUT} min-h-[320px] font-mono text-sm`}
                  />
                </label>
              </>
            )}
          </section>
        </aside>
      </div>
    </ProductHubScaffold>
  );
}
