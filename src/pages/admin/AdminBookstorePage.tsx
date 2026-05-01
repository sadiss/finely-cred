import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Plus, Save, Search, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import type { BookstoreProduct } from '../../domain/bookstore';
import {
  createBookstoreProduct,
  deleteBookstoreProduct,
  listBookstoreProducts,
  upsertBookstoreProduct,
} from '../../data/bookstoreRepo';
import { formatPrice } from '../../config/pricingCatalog';

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
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <button
            type="button"
            onClick={() => {
              const p = createBookstoreProduct({ title: 'New book', sub: 'Resource' });
              window.dispatchEvent(new Event('finely:store'));
              setSelectedId(p.id);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
          >
            <Plus size={14} /> New book
          </button>
        </div>

        {notice && <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-emerald-100">{notice}</div>}

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-white/70">
              <Search size={16} className="text-white/40" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search books…"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{products.length} items</div>

            <div className="space-y-2">
              {products.map((p) => {
                const active = p.id === (selected?.id ?? '');
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${
                      active ? 'border-amber-500/40 bg-amber-500/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 text-amber-300">
                          <BookOpen size={16} />
                          <span className="text-xs font-semibold uppercase tracking-wider">
                            {p.published ? 'Published' : 'Draft'}
                          </span>
                        </div>
                        <div className="mt-2 text-white font-semibold truncate">{p.title}</div>
                        <div className="mt-1 text-white/60 text-sm truncate">{p.sub}</div>
                        <div className="mt-2 text-[10px] uppercase tracking-widest text-white/40 font-mono truncate">
                          {p.slug} • {formatPrice(p.priceAmount)}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-5">
            {!draft ? (
              <div className="text-white/60">Select a book to edit.</div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-white font-semibold">Editor</div>
                    <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{draft.id}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={save}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                    >
                      <Save size={14} /> Save
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
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-200 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/15 transition-all"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <label className="block">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Slug (URL)</div>
                    <input
                      value={draft.slug}
                      onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                      className="fc-input mt-2 font-mono"
                      placeholder="my-book-slug"
                    />
                  </label>
                  <label className="block">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Published</div>
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, published: !draft.published })}
                      className={`mt-2 w-full rounded-xl border px-4 py-3 text-left transition-all ${
                        draft.published
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                          : 'border-white/10 bg-black/30 text-white/60 hover:bg-white/[0.03]'
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
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Title</div>
                    <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="fc-input mt-2" />
                  </label>
                  <label className="block">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Subtitle</div>
                    <input value={draft.sub} onChange={(e) => setDraft({ ...draft, sub: e.target.value })} className="fc-input mt-2" />
                  </label>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <label className="block">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Volume</div>
                    <input
                      value={draft.vol ?? ''}
                      onChange={(e) => setDraft({ ...draft, vol: e.target.value })}
                      className="fc-input mt-2 font-mono"
                      placeholder="04"
                    />
                  </label>
                  <label className="block">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Accent color</div>
                    <input
                      value={draft.accentColor}
                      onChange={(e) => setDraft({ ...draft, accentColor: e.target.value })}
                      className="fc-input mt-2 font-mono"
                      placeholder="#f59e0b"
                    />
                  </label>
                  <label className="block">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Price (cents)</div>
                    <input
                      type="number"
                      value={draft.priceAmount}
                      onChange={(e) => setDraft({ ...draft, priceAmount: parseInt(e.target.value || '0', 10) })}
                      className="fc-input mt-2 font-mono"
                    />
                    <div className="mt-1 text-white/50 text-xs">Preview: {formatPrice(draft.priceAmount)}</div>
                  </label>
                </div>

                <label className="block">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Short description</div>
                  <textarea
                    value={draft.desc}
                    onChange={(e) => setDraft({ ...draft, desc: e.target.value })}
                    className="mt-2 w-full min-h-[80px] bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 text-sm outline-none focus:border-amber-500 transition-colors"
                  />
                </label>

                <label className="block">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Bullets (one per line)</div>
                  <textarea
                    value={bulletsRaw}
                    onChange={(e) => setBulletsRaw(e.target.value)}
                    className="mt-2 w-full min-h-[120px] bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 text-sm outline-none focus:border-amber-500 transition-colors"
                  />
                </label>

                <label className="block">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">In-depth content (markdown)</div>
                  <textarea
                    value={draft.contentMarkdown ?? ''}
                    onChange={(e) => setDraft({ ...draft, contentMarkdown: e.target.value })}
                    className="mt-2 w-full min-h-[260px] bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 font-mono text-[12px] outline-none focus:border-amber-500 transition-colors"
                  />
                </label>
              </>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

