import React, { useMemo } from 'react';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { getBookstoreProductBySlug } from '../data/bookstoreRepo';
import { formatPrice } from '../config/pricingCatalog';

export default function BookstoreProductPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const product = useMemo(() => getBookstoreProductBySlug(id || ''), [id]);

  return (
    <PageShell
      badge="Store"
      title={product ? product.title : 'Product Detail'}
      subtitle={product ? product.sub : 'Premium playbook detail page.'}
    >
      <div className="space-y-6">
        <button
          onClick={() => navigate('/bookstore')}
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={16} /> Back to Bookstore
        </button>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-4">
          <div className="inline-flex items-center gap-2 text-amber-400">
            <BookOpen size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">{product ? 'Book' : 'Product'}</span>
          </div>

          {!product ? (
            <div className="text-white/60 text-sm">
              Product not found. Return to the bookstore to browse available titles.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-white font-semibold text-2xl">{product.title}</div>
                  <div className="mt-1 text-white/60 text-sm">{product.desc}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Price</div>
                  <div className="mt-1 text-white font-black text-2xl">{formatPrice(product.priceAmount)}</div>
                </div>
              </div>

              {product.bullets?.length ? (
                <ul className="list-disc pl-5 text-white/75 text-sm space-y-1">
                  {product.bullets.slice(0, 10).map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : null}

              {product.contentMarkdown ? (
                <details className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <summary className="cursor-pointer select-none">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Preview (expand)</div>
                    <div className="mt-1 text-white/70 text-sm">Show the full content on page scroll (no internal scrolling).</div>
                  </summary>
                  <pre className="mt-4 whitespace-pre-wrap text-white/70 text-sm leading-relaxed">
                    {product.contentMarkdown.trim()}
                  </pre>
                </details>
              ) : null}
            </>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/onboarding')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
            >
              Start onboarding <ArrowRight size={14} />
            </button>
            <button
              onClick={() => navigate('/checkout')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-[10px] font-black uppercase tracking-widest text-white/80 transition-all"
            >
              Go to checkout <ArrowRight size={14} />
            </button>
            <button
              onClick={() => navigate('/resources')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
            >
              Back to resources <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

