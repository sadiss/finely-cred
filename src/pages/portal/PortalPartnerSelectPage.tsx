import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Search, ShieldAlert, Trash2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import type { Partner } from '../../domain/partners';
import { listPartners } from '../../data/partnersRepo';
import { ADMIN_PARTNER_OVERRIDE_KEY } from '../../portal/getOrCreatePartnerForSession';
import { useAuth } from '../../auth/AuthProvider';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PAGE,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_TOOLBAR,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

const SELECT_ACCENTS = ['emerald', 'sky', 'violet', 'amber', 'fuchsia'] as const;

export default function PortalPartnerSelectPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  const [query, setQuery] = useState('');
  const [partners, setPartners] = useState<Partner[]>([]);
  useEffect(() => { listPartners().then(setPartners); }, []);

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
      subtitle="You're signed in as an admin. Pick a partner profile to view the Partner Portal modules (letters, reports, evidence, debt workflows)."
    >
      <div className={FINELY_OS_PAGE}>
        <div className={`${FINELY_OS_NOTICE_WARN} space-y-3`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 text-fuchsia-200">
                <ShieldAlert size={16} />
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Admin mode</span>
              </div>
              <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
                Signed in as: <span className={FINELY_OS_ENTITY_VALUE}>{auth.user?.email || 'admin'}</span>
              </div>
              <div className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                This selection is stored locally as <span className="font-mono">{ADMIN_PARTNER_OVERRIDE_KEY}</span>.
              </div>
              {current ? (
                <div className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>
                  Current selection ID: <span className={`font-mono ${FINELY_OS_ENTITY_VALUE}`}>{current}</span>
                </div>
              ) : null}
            </div>
            <button type="button" onClick={clear} className={FINELY_OS_SECONDARY_BTN} title="Clear selected partner context">
              <Trash2 size={14} /> Clear
            </button>
          </div>
        </div>

        <div className={`${finelyOsCatalogCard('violet')} !p-6 space-y-4`} data-fc-accent="violet">
          <div className={`${FINELY_OS_TOOLBAR} !p-2`}>
            <Search size={16} className="opacity-45 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search partners by name/email/id…"
              className="w-full min-w-0 bg-transparent outline-none placeholder:opacity-40"
            />
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono shrink-0`}>
              {filtered.length}/{partners.length}
            </div>
          </div>

          <FinelyOsPaginatedStack
            items={filtered}
            pageSize={12}
            itemSpacingClassName="space-y-2"
            emptyMessage="No partners match that search."
            renderItem={(p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectPartner(p.id)}
                className={`w-full text-left ${finelyOsCatalogCard(SELECT_ACCENTS[idx % SELECT_ACCENTS.length])} !px-5 !py-4 hover:border-violet-400/30 transition-colors`}
                data-fc-accent={SELECT_ACCENTS[idx % SELECT_ACCENTS.length]}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{p.profile.fullName || 'Partner'}</div>
                    <div className={`mt-1 truncate ${FINELY_OS_ENTITY_BODY}`}>{p.profile.email || '—'}</div>
                    <div className={`mt-2 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{p.id}</div>
                  </div>
                  <div className="shrink-0 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-fuchsia-700">
                    Select <ArrowRight size={14} />
                  </div>
                </div>
              </button>
            )}
          />
        </div>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
