import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, FolderOpen, Search, ShieldAlert, Trash2, UserCircle2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import type { Partner } from '../../../../domain/partners';
import { listPartners } from '../../../../data/partnersRepo';
import { ADMIN_PARTNER_OVERRIDE_KEY } from '../../../../portal/getOrCreatePartnerForSession';
import { useAuth } from '../../../../auth/AuthProvider';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductEmptyState } from '../components/ProductUi';
import { useMappedPartnerNavigate } from './usePartnerProductNavigation';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PAGE,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_TOOLBAR,
  finelyOsCatalogCard,
} from '../../../os/finelyOsLightUi';
import './partnerSelectPartnerSurface.css';

const MOSAIC_ACCENTS = ['emerald', 'violet', 'sky', 'rose'] as const;

const DEMO_PARTNERS: Partner[] = [
  {
    id: 'ptr-demo-alpha',
    tenantId: 'finely',
    status: 'active',
    profile: { fullName: 'Ava Martinez', email: 'ava@example.com' },
    consents: {},
    routes: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ptr-demo-beta',
    tenantId: 'finely',
    status: 'active',
    profile: { fullName: 'Jordan Lee', email: 'jordan@example.com' },
    consents: {},
    routes: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ptr-demo-gamma',
    tenantId: 'finely',
    status: 'active',
    profile: { fullName: 'Morgan Chen', email: 'morgan@example.com' },
    consents: {},
    routes: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ptr-demo-delta',
    tenantId: 'finely',
    status: 'active',
    profile: { fullName: 'Priya Shah', email: 'priya@example.com' },
    consents: {},
    routes: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function PartnerSelectPartnerProductSurface({
  role,
  pageId,
  dataMode,
}: WorkspaceProductSurfaceProps) {
  const mappedNavigate = useMappedPartnerNavigate();
  const location = useLocation();
  const auth = useAuth();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? UserCircle2;
  const accent = navItem?.accent ?? 'violet';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const archetype = getWorkspaceProductArchetype(role, pageId);
  const isDemo = dataMode === 'demo';
  const demoSpec = getWorkspaceProductPageSpec('partner', pageId);

  const [query, setQuery] = useState('');
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    if (isDemo) {
      setPartners(DEMO_PARTNERS);
      return;
    }
    listPartners().then(setPartners);
  }, [isDemo]);

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
    if (isDemo) {
      openProductCopilot({
        prompt: `I want to preview the portal as partner ${id}. What modules can I open?`,
        contextLabel: 'Partner context',
      });
      return;
    }
    try {
      localStorage.setItem(ADMIN_PARTNER_OVERRIDE_KEY, id);
    } catch {
      // ignore
    }
    mappedNavigate(nextPath, { replace: true });
  };

  const clear = () => {
    try {
      localStorage.removeItem(ADMIN_PARTNER_OVERRIDE_KEY);
    } catch {
      // ignore
    }
  };

  const current = useMemo(() => {
    if (isDemo) return '';
    try {
      return (localStorage.getItem(ADMIN_PARTNER_OVERRIDE_KEY) || '').trim();
    } catch {
      return '';
    }
  }, [isDemo]);

  const currentPartner = useMemo(
    () => (current ? partners.find((p) => p.id === current) ?? null : null),
    [current, partners],
  );

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow={demoSpec?.eyebrow ?? 'Partner portal'}
      title={demoSpec?.title ?? 'Pick a partner file'}
      description={
        demoSpec?.description ??
        'Bento mosaic of partner profiles — letters, reports, evidence, and debt workflows open under that context.'
      }
      status={isDemo ? 'Demo mosaic' : `${filtered.length} partner${filtered.length === 1 ? '' : 's'}`}
      freshness={isDemo ? 'demo snapshot' : 'just now'}
      accent={accent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      archetype={archetype}
      metricTitle="Partner file mosaic"
      metricDescription="Each tile opens portal modules under that partner context."
      primaryAction={
        isDemo ? (
          <ProductPagePrimaryAction
            label="Ask Finely"
            onClick={() =>
              openProductCopilot({
                prompt: 'How do I preview the partner portal as an admin?',
                contextLabel: 'Partner context',
              })
            }
          />
        ) : (
          <ProductPagePrimaryAction label="Portal dashboard" onClick={() => mappedNavigate('/portal/dashboard')} />
        )
      }
      secondaryAction={
        !isDemo && current ? (
          <button type="button" className="fc-wlp-btn-secondary" onClick={clear}>
            <Trash2 size={14} /> Clear selection
          </button>
        ) : undefined
      }
    >
      <section className={`fc-wlp-section ${FINELY_OS_PAGE}`} data-surface-layout="catalog-mosaic">
        <header className="fc-partner-picker-hero">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <FolderOpen size={16} /> Partner file navigator
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900">
                {currentPartner ? currentPartner.profile.fullName || 'Selected partner' : 'Choose a partner file'}
              </h2>
              <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                {currentPartner
                  ? `${currentPartner.profile.email || '—'} · opens ${nextPath.replace('/portal/', '')}`
                  : 'Search the mosaic and open portal modules under that partner context.'}
              </p>
            </div>
            {!isDemo && current ? (
              <button type="button" onClick={clear} className={FINELY_OS_SECONDARY_BTN}>
                <Trash2 size={14} /> Clear selection
              </button>
            ) : null}
          </div>

          <div className={`${FINELY_OS_TOOLBAR} !p-4`}>
            <Search size={18} className="opacity-45 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search partners by name, email, or id…"
              className="w-full min-w-0 bg-transparent outline-none text-base font-bold placeholder:opacity-40"
              aria-label="Search partners"
            />
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono shrink-0 text-sm`}>
              {filtered.length}/{partners.length}
            </div>
          </div>
        </header>

        {!isDemo ? (
          <div className={`${FINELY_OS_NOTICE_WARN} space-y-3`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 text-fuchsia-200">
                  <ShieldAlert size={16} />
                  <span className={FINELY_OS_ENTITY_SUBLABEL}>Admin preview</span>
                </div>
                <div className={`mt-2 font-bold ${FINELY_OS_ENTITY_BODY}`}>
                  Signed in as: <span className={FINELY_OS_ENTITY_VALUE}>{auth.user?.email || 'admin'}</span>
                </div>
                <div className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                  Selection is stored locally for portal preview.
                </div>
                {current ? (
                  <div className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>
                    Current partner ID: <span className={`font-mono font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{current}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-w-0">
            {filtered.length === 0 ? (
              <ProductEmptyState title="No matches" description="No partners match that search." />
            ) : (
              <FinelyOsPaginatedStack
                items={filtered}
                pageSize={12}
                itemSpacingClassName="fc-partner-picker-bento"
                emptyMessage="No partners match that search."
                renderItem={(p, idx) => {
                  const family = MOSAIC_ACCENTS[idx % MOSAIC_ACCENTS.length];
                  const isCurrent = current === p.id;
                  const featured = idx === 0 || isCurrent;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectPartner(p.id)}
                      className={`fc-partner-picker-tile ${finelyOsCatalogCard(family)} p-6 lg:p-8 transition-all hover:scale-[1.01]`}
                      data-fc-accent={family}
                      data-active={isCurrent ? 'true' : undefined}
                      data-size={featured ? 'featured' : undefined}
                    >
                      <div className="fc-partner-picker-tile-icon">
                        <UserCircle2 size={28} />
                      </div>
                      <div className="mt-6 min-w-0">
                        <div className={`text-xl font-extrabold truncate ${FINELY_OS_ENTITY_VALUE}`}>
                          {p.profile.fullName || 'Partner'}
                        </div>
                        <div className={`mt-1 truncate text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                          {p.profile.email || '—'}
                        </div>
                        <div className={`mt-3 ${FINELY_OS_ENTITY_SUBLABEL} font-mono truncate text-sm`}>{p.id}</div>
                      </div>
                      <div className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-fuchsia-300">
                        Open portal <ArrowRight size={14} />
                      </div>
                    </button>
                  );
                }}
              />
            )}
          </div>

          <aside className={`fc-partner-picker-rail ${finelyOsCatalogCard('violet')}`} data-fc-accent="violet">
            <div className="text-xs font-black uppercase tracking-widest text-violet-300">What opens next</div>
            <h3 className="text-2xl font-extrabold">Portal modules</h3>
            <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
              Letters, reports, evidence vault, debt workflows, and disputes all read the selected partner file.
            </p>
            <div className={`${finelyOsCatalogCard('sky')} p-4 space-y-2`} data-fc-accent="sky">
              <div className={`text-sm font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Destination</div>
              <div className={`font-mono text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{nextPath}</div>
            </div>
            <div className={`${finelyOsCatalogCard('emerald')} p-4 space-y-2`} data-fc-accent="emerald">
              <div className={`text-sm font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>In mosaic</div>
              <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{filtered.length}</div>
              <div className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>partner files match</div>
            </div>
          </aside>
        </div>
      </section>
    </ProductHubScaffold>
  );
}
