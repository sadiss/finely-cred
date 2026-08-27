import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  ExternalLink,
  FileCheck,
  Layout,
  Library,
  Mail,
  Sparkles,
  Tags,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listFreeGuidesEffective } from '../../../../data/freeGuidesRepo';
import { listCommsTemplates } from '../../../../data/commsRepo';
import { listComplianceReviews } from '../../../../data/complianceReviewRepo';
import { categoryLabels, type PricingCategory } from '../../../../config/pricingCatalog';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';

type ModuleId = 'resources' | 'comms' | 'pricing';

type ContentModule = {
  id: ModuleId;
  label: string;
  title: string;
  description: string;
  icon: typeof Library;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
  path: string;
  bullets: string[];
  statLabel: string;
  statValue: string;
};

const PRICING_CATEGORIES = Object.keys(categoryLabels) as PricingCategory[];

export default function AdminCmsProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'rose';
  const [selectedModuleId, setSelectedModuleId] = useState<ModuleId>('resources');

  const guideCount = useMemo(() => listFreeGuidesEffective().length, []);
  const templateCount = useMemo(() => listCommsTemplates().length, []);
  const compliancePending = useMemo(
    () => listComplianceReviews().filter((r) => r.status !== 'approved').length,
    [],
  );

  const modules: ContentModule[] = useMemo(
    () => [
      {
        id: 'resources',
        label: 'Editor',
        title: 'Resources',
        description: 'Edit public guides and partner-facing education.',
        icon: Library,
        accent: 'emerald',
        path: '/admin/resources',
        statLabel: 'Live guides',
        statValue: String(guideCount),
        bullets: [
          'Guides, courses, videos, and template bases.',
          'Publish and unpublish partner education content.',
          'Link tours and downloadable assets.',
        ],
      },
      {
        id: 'comms',
        label: 'Editor',
        title: 'Comms studio',
        description: 'Templates and delivery logic for partner communication.',
        icon: Mail,
        accent: 'violet',
        path: '/admin/comms',
        statLabel: 'Templates',
        statValue: String(templateCount),
        bullets: [
          'Welcome experiences and partner messaging.',
          'Templates route into Communication Hub threads.',
          'Delivery only — not a duplicate inbox.',
        ],
      },
      {
        id: 'pricing',
        label: 'Audit',
        title: 'Public pricing',
        description: 'Review what partners see on DIY, DFY, and hybrid package rails.',
        icon: Sparkles,
        accent: 'rose',
        path: '/pricing',
        statLabel: 'Categories',
        statValue: String(PRICING_CATEGORIES.length),
        bullets: [
          'Live compare page — read-only audit from admin.',
          'DIY, DFY, and hybrid package rails.',
          'Category coverage and tier labels.',
        ],
      },
    ],
    [guideCount, templateCount],
  );

  const selectedModule = modules.find((m) => m.id === selectedModuleId) ?? modules[0]!;
  const SelectedIcon = selectedModule.icon;

  const deckCells = [
    {
      id: 'guides',
      label: 'Live guides',
      value: guideCount,
      hint: 'Public education',
      accent: 'emerald' as const,
      icon: Library,
      onClick: () => setSelectedModuleId('resources'),
    },
    {
      id: 'templates',
      label: 'Comms templates',
      value: templateCount,
      hint: 'Partner messaging',
      accent: 'violet' as const,
      icon: Mail,
      onClick: () => setSelectedModuleId('comms'),
    },
    {
      id: 'pricing',
      label: 'Pricing rails',
      value: PRICING_CATEGORIES.length,
      hint: 'Compare categories',
      accent: 'sky' as const,
      icon: Tags,
      onClick: () => setSelectedModuleId('pricing'),
    },
    {
      id: 'compliance',
      label: 'Review gate',
      value: compliancePending,
      hint: compliancePending ? 'Pending approval' : 'All approved',
      accent: 'rose' as const,
      icon: FileCheck,
      onClick: () => navigate('/admin/compliance-review'),
    },
  ];

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Studio"
      title="Site content"
      description="Command deck for guides, partner messaging, and public pricing — open the live editor for each surface."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={navItem?.icon}
      primaryAction={
        <ProductPagePrimaryAction
          label={`Open ${selectedModule.title}`}
          onClick={() => navigate(selectedModule.path)}
        />
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/comms')}>
          Comms studio
        </button>
      }
      metrics={[
        {
          label: 'Guides',
          value: String(guideCount),
          hint: 'Public education',
          accent: 'emerald',
          onClick: () => setSelectedModuleId('resources'),
        },
        {
          label: 'Templates',
          value: String(templateCount),
          hint: 'Partner messaging',
          accent: 'violet',
          onClick: () => setSelectedModuleId('comms'),
        },
        {
          label: 'Categories',
          value: String(PRICING_CATEGORIES.length),
          hint: 'Pricing compare',
          accent: 'sky',
          onClick: () => setSelectedModuleId('pricing'),
        },
        {
          label: 'Compliance',
          value: String(compliancePending),
          hint: 'Awaiting review',
          accent: 'rose',
          onClick: () => navigate('/admin/compliance-review'),
        },
      ]}
      metricTitle="Content pulse"
      metricDescription="Deck tiles below mirror live counts — pick a module to inspect scope."
    >
      <div className={FINELY_OS_PAGE} data-surface-layout="command-deck">
        <section className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-6`} data-fc-accent="sky">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <Layout size={18} />
                <span>Content command deck</span>
              </div>
              <h2 className="mt-3 text-3xl font-extrabold">What ships on the public site</h2>
              <p className={`mt-3 max-w-3xl text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                Three live editors cover partner education, messaging templates, and pricing audit. Compliance gate tracks
                doctrine-derived routes before they merge.
              </p>
            </div>
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate(selectedModule.path)}>
              Open {selectedModule.title} <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {deckCells.map((cell) => {
              const Icon = cell.icon;
              return (
                <button
                  key={cell.id}
                  type="button"
                  onClick={cell.onClick}
                  className={`${finelyOsCatalogCard(cell.accent)} p-5 lg:p-6 text-left transition hover:brightness-[1.02]`}
                  data-fc-accent={cell.accent}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>{cell.label}</div>
                      <div className={`mt-2 text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{cell.value}</div>
                      <div className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{cell.hint}</div>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                      <Icon size={20} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-12 items-start min-h-[480px]">
          <nav
            className={`lg:col-span-4 flex flex-col gap-3 ${finelyOsCatalogCard('violet')} p-5 lg:p-6`}
            data-fc-accent="violet"
            aria-label="Content modules"
          >
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Module navigator</div>
            <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
              Pick a surface — counts refresh from live stores.
            </p>

            <div className="space-y-2">
              {modules.map((module) => {
                const ModuleIcon = module.icon;
                const active = selectedModuleId === module.id;
                return (
                  <button
                    key={module.id}
                    type="button"
                    onClick={() => setSelectedModuleId(module.id)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      active
                        ? 'border-violet-400/50 bg-violet-500/15 ring-2 ring-violet-400/20'
                        : 'border-white/10 bg-black/15 hover:border-white/25'
                    }`}
                    data-fc-accent={module.accent}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/20">
                          <ModuleIcon size={18} />
                        </span>
                        <div className="min-w-0">
                          <div className={`text-xs font-extrabold uppercase tracking-wide ${FINELY_OS_ENTITY_SUBLABEL}`}>
                            {module.label}
                          </div>
                          <div className={`mt-1 text-xl font-extrabold truncate ${FINELY_OS_ENTITY_VALUE}`}>
                            {module.title}
                          </div>
                          <p className={`mt-1 text-sm font-semibold ${FINELY_OS_ENTITY_BODY} line-clamp-2`}>
                            {module.description}
                          </p>
                        </div>
                      </div>
                      <div className={`text-2xl font-extrabold shrink-0 ${FINELY_OS_ENTITY_VALUE}`}>
                        {module.statValue}
                      </div>
                    </div>
                    <div className={`mt-2 text-xs font-bold ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
                      {module.statLabel}
                    </div>
                  </button>
                );
              })}
            </div>

            {compliancePending > 0 ? (
              <button
                type="button"
                onClick={() => navigate('/admin/compliance-review')}
                className={`${finelyOsCatalogCard('rose')} p-4 text-left w-full`}
                data-fc-accent="rose"
              >
                <div className="flex items-center gap-2">
                  <FileCheck size={16} />
                  <span className="text-sm font-extrabold">{compliancePending} route(s) need compliance review</span>
                </div>
              </button>
            ) : null}
          </nav>

          <main className={`lg:col-span-8 ${finelyOsCatalogCard(selectedModule.accent)} p-6 lg:p-8 space-y-6`} data-fc-accent={selectedModule.accent}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                  <SelectedIcon size={18} />
                  <span>{selectedModule.label}</span>
                </div>
                <h2 className="mt-3 text-3xl font-extrabold">{selectedModule.title}</h2>
                <p className={`mt-3 max-w-3xl text-base font-semibold ${FINELY_OS_ENTITY_BODY}`}>
                  {selectedModule.description}
                </p>
              </div>
              <div className="text-right">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>{selectedModule.statLabel}</div>
                <div className={`mt-1 text-4xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{selectedModule.statValue}</div>
              </div>
            </div>

            <ul className={`space-y-3 ${FINELY_OS_ENTITY_BODY}`}>
              {selectedModule.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-base font-semibold">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            <div className={`${finelyOsCatalogCard('sky')} p-5 lg:p-6 space-y-4`} data-fc-accent="sky">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Open live editor</div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate(selectedModule.path)}>
                  <ExternalLink size={14} /> Open {selectedModule.title}
                </button>
                {selectedModule.id !== 'resources' ? (
                  <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/resources')}>
                    Resources
                  </button>
                ) : null}
                {selectedModule.id !== 'comms' ? (
                  <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/comms')}>
                    Comms studio
                  </button>
                ) : null}
                {selectedModule.id !== 'pricing' ? (
                  <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/pricing')}>
                    Public pricing
                  </button>
                ) : null}
              </div>
            </div>

            {selectedModule.id === 'pricing' ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {PRICING_CATEGORIES.slice(0, 6).map((cat, idx) => {
                  const catAccent = ['emerald', 'violet', 'sky', 'rose'][idx % 4] as 'emerald' | 'violet' | 'sky' | 'rose';
                  return (
                    <div
                      key={cat}
                      className={`${finelyOsCatalogCard(catAccent)} p-4`}
                      data-fc-accent={catAccent}
                    >
                      <div className={`text-sm font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{categoryLabels[cat]}</div>
                      <div className={`mt-1 text-xs font-bold ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal font-mono`}>
                        {cat}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </main>
        </div>
      </div>

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
