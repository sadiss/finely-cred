import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { PhysicalEbook } from '../components/landing';
import { useAuth } from '../auth/AuthProvider';
import { isAdminEmail } from '../auth/admin';
import { listBookstoreProducts } from '../data/bookstoreRepo';
import { formatPrice } from '../config/pricingCatalog';

export default function BookstorePage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const isAdmin = isAdminEmail(auth.user?.email);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const products = useMemo(() => listBookstoreProducts({ includeUnpublished: isAdmin }), [isAdmin, version]);
  return (
    <PageShell
      badge="Store"
      title="Bookstore"
      subtitle="Premium resources and playbooks."
    >
      <div className="space-y-8">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-amber-400">
              <BookOpen size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Featured titles</span>
            </div>
            <p className="mt-3 text-white/60 text-sm">
              Browse details, outcomes, and delivery notes. Admins can publish and edit titles instantly.
            </p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => navigate('/admin/bookstore')}
              className="fc-button-brand"
            >
              Manage bookstore <ArrowRight size={14} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
          {products.map((p) => (
            <div key={p.id} className="w-full max-w-[340px] space-y-4">
              <PhysicalEbook
                title={p.title}
                sub={p.sub}
                vol={p.vol || '01'}
                price={formatPrice(p.priceAmount)}
                accentColor={p.accentColor}
              />
              <button
                onClick={() => navigate(`/bookstore/${p.slug}`)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
              >
                View details <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

