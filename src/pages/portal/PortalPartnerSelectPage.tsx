import React, { useMemo, useState } from 'react';
import { ArrowRight, Search, ShieldAlert, Trash2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { listPartners } from '../../data/partnersRepo';
import { ADMIN_PARTNER_OVERRIDE_KEY } from '../../portal/getOrCreatePartnerForSession';
import { useAuth } from '../../auth/AuthProvider';

export default function PortalPartnerSelectPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  const [query, setQuery] = useState('');
  const partners = useMemo(() => listPartners(), []);

  const nextPath = useMemo(() => {
    try {
      const sp = new URLSearchParams(location.search);
      const next = sp.get('next');
      if (!next) return '/portal/dashboard';
      if (!next.startsWith('/portal')) return '/portal/dashboard';
      if (next.startsWith('/portal/select-partner')) return '/portal/dashboard';
      return next;
    } catch {
      return '/portal/dashboard';
    }
  }, [location.search]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return partners;
    return partners.filter((p) => {
      const hay = `${p.profile.fullName || ''} ${p.profile.email || ''} ${p.id}`.toLowerCase();
      return hay.includes(q);
    });
  }, [partners, query]);

  const selectPartner = (partnerId: string) => {
    const id = (partnerId || '').trim();
    if (!id) return;
    try {
      localStorage.setItem(ADMIN_PARTNER_OVERRIDE_KEY, id);
    } catch {
      // ignore
    }
    navigate(nextPath, { replace: true });
  };

  const clear = () => {
    try {
      localStorage.removeItem(ADMIN_PARTNER_OVERRIDE_KEY);
    } catch {
      // ignore
    }
  };

  const current = useMemo(() => {
    try {
      return (localStorage.getItem(ADMIN_PARTNER_OVERRIDE_KEY) || '').trim();
    } catch {
      return '';
    }
  }, []);

  return (
    <PageShell
      badge="Partner Portal"
      title="Select partner context"
      subtitle="You’re signed in as an admin. Pick a partner profile to view the Partner Portal modules (letters, reports, evidence, debt workflows)."
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 text-amber-300">
                <ShieldAlert size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Admin mode</span>
              </div>
              <div className="mt-2 text-white/70 text-sm">
                Signed in as: <span className="text-white/90 font-semibold">{auth.user?.email || 'admin'}</span>
              </div>
              <div className="mt-1 text-white/50 text-xs">
                This selection is stored locally as <span className="font-mono">{ADMIN_PARTNER_OVERRIDE_KEY}</span>.
              </div>
              {current ? (
                <div className="mt-3 text-white/60 text-sm">
                  Current selection ID: <span className="font-mono text-white/80">{current}</span>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
              title="Clear selected partner context"
            >
              <Trash2 size={14} /> Clear
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Search size={16} className="text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search partners by name/email/id…"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono shrink-0">
              {filtered.length}/{partners.length}
            </div>
          </div>

          <div className="divide-y divide-white/10 rounded-2xl border border-white/10 overflow-hidden bg-black/20">
            {filtered.length === 0 ? (
              <div className="p-6 text-white/60 text-sm">No partners match that search.</div>
            ) : (
              filtered.slice(0, 200).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectPartner(p.id)}
                  className="w-full text-left px-5 py-4 hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-white font-semibold truncate">{p.profile.fullName || 'Partner'}</div>
                      <div className="mt-1 text-white/60 text-sm truncate">{p.profile.email || '—'}</div>
                      <div className="mt-2 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                        {p.id}
                      </div>
                    </div>
                    <div className="shrink-0 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-200">
                      Select <ArrowRight size={14} />
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
          {filtered.length > 200 ? (
            <div className="text-[11px] text-white/40">Showing first 200 results. Refine search to narrow down.</div>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}

