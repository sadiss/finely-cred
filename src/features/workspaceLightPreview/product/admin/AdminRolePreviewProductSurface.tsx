import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ExternalLink,
  FileSignature,
  Shield,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useMappedAdminNavigate } from '../partner/usePartnerProductNavigation';
import { HosAccessCodesAdminPanel } from '../../../../components/heta/HosAccessCodesAdminPanel';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsInlineListItem,
  finelyOsViewTab,
} from '../../../os/finelyOsLightUi';
import { capabilitiesForRole, workflowIdForCapabilityRole, type RoleCapabilityRole } from '../../../../config/roleCapabilityMatrix';
import { parseRolePreviewRole, rolePreviewEntry } from '../../../../config/rolePreviewCatalog';
import { activateRolePreview } from '../../../../lib/adminRolePreview';
import { RoleWorkflowPanel } from '../../../../components/workflow/RoleWorkflowPanel';
import { demoRoleWorkflowProgress } from '../../../../lib/roleWorkflowProgress';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import type { ProductMetric } from '../components/ProductUi';
import {
  ROLE_PREVIEW_CONFIG,
  ROLE_PREVIEW_DETAIL_TABS,
  ROLE_PREVIEW_ORDER_LIST,
  rolePreviewLaunchCourse,
  rolePreviewProvisionHint,
  type RolePreviewDetailTab,
  type RolePreviewSurfaceRole,
} from './rolePreviewSurfaceModel';
import './adminRolePreviewProductSurface.css';

const MOSAIC_ACCENTS = ['emerald', 'violet', 'sky', 'rose'] as const;

export default function AdminRolePreviewProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useMappedAdminNavigate();
  const rawNavigate = useNavigate();
  const location = useLocation();
  const [params, setSearchParams] = useSearchParams();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'violet';

  const roleKey: RolePreviewSurfaceRole = parseRolePreviewRole(params.get('role'));
  const [detailTab, setDetailTab] = useState<RolePreviewDetailTab>('experience');
  const [inspectorOpen, setInspectorOpen] = useState(false);

  const config = ROLE_PREVIEW_CONFIG[roleKey];
  const capabilities = useMemo(() => capabilitiesForRole(roleKey as RoleCapabilityRole), [roleKey]);
  const workflowId = useMemo(() => workflowIdForCapabilityRole(roleKey as RoleCapabilityRole), [roleKey]);
  const workflowDemoProgress = useMemo(
    () => (workflowId ? demoRoleWorkflowProgress(workflowId) : undefined),
    [workflowId],
  );
  const launchCourse = useMemo(() => rolePreviewLaunchCourse(roleKey), [roleKey]);
  const Icon = config.icon;

  const goToRolePreview = (nextRole: RolePreviewSurfaceRole) => {
    const next = new URLSearchParams(params);
    next.set('role', nextRole);
    setSearchParams(next, { replace: true });
    if (nextRole !== 'admin') activateRolePreview(nextRole);
  };

  const openRole = (nextRole: RolePreviewSurfaceRole, tab: RolePreviewDetailTab = 'experience') => {
    goToRolePreview(nextRole);
    setDetailTab(tab);
    setInspectorOpen(true);
  };

  const goToProvisioning = () => {
    if (config.addPath.startsWith('/admin/role-preview')) {
      const suffix = config.addPath.slice('/admin/role-preview'.length);
      navigate(`${location.pathname}${suffix}`);
      setDetailTab('experience');
      setInspectorOpen(true);
      return;
    }
    navigate(config.addPath);
  };

  useEffect(() => {
    if (!inspectorOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInspectorOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inspectorOpen]);

  const metrics: ProductMetric[] = [
    {
      label: 'Roles',
      value: String(ROLE_PREVIEW_ORDER_LIST.length),
      hint: 'Product lanes to inspect',
      accent: 'violet',
      icon: Users,
    },
    {
      label: 'Active lane',
      value: config.shortLabel,
      hint: config.title,
      accent: 'sky',
      icon: Icon,
      onClick: () => setInspectorOpen(true),
    },
    {
      label: 'Routes',
      value: String(config.access.length),
      hint: 'Primary entry paths',
      accent: 'emerald',
      onClick: () => {
        setDetailTab('routes');
        setInspectorOpen(true);
      },
    },
    {
      label: 'Contracts',
      value: String(config.contracts.length),
      hint: 'Signing surfaces',
      accent: 'rose',
      onClick: () => {
        setDetailTab('contracts');
        setInspectorOpen(true);
      },
    },
  ];

  const renderDetailBody = () => {
    if (detailTab === 'experience') {
      return (
        <div className="space-y-4">
          {roleKey === 'heta_society' ? <HosAccessCodesAdminPanel /> : null}
          <ul className={`space-y-2 ${FINELY_OS_ENTITY_BODY}`}>
            {config.preview.map((item, i) => (
              <li key={i} className={`${finelyOsInlineListItem()} p-4 flex items-start gap-2`}>
                <span className="text-violet-400">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    if (detailTab === 'routes') {
      return (
        <ul className="grid gap-5 sm:grid-cols-2">
          {config.access.map((a) => (
            <li key={a.path} className={`${finelyOsInlineListItem()} p-5`}>
              <button
                type="button"
                onClick={() => navigate(a.path)}
                className={`text-base font-bold ${FINELY_OS_ENTITY_BODY} hover:underline underline-offset-4`}
              >
                {a.label}
              </button>
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono text-xs mt-0.5 normal-case tracking-normal`}>{a.path}</div>
            </li>
          ))}
        </ul>
      );
    }

    if (detailTab === 'contracts') {
      return (
        <div className="grid md:grid-cols-2 gap-4">
          <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-3`} data-fc-accent="violet">
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
              <FileSignature size={14} /> Contracts & signing
            </div>
            <ul className={`space-y-2 ${FINELY_OS_ENTITY_BODY}`}>
              {config.contracts.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-base font-bold">
                  <span className="text-violet-400">•</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-3`} data-fc-accent="emerald">
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
              <Wallet size={14} /> Payouts
            </div>
            <ul className={`space-y-2 ${FINELY_OS_ENTITY_BODY}`}>
              {config.payouts.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-base font-bold">
                  <span className="text-emerald-400">•</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    if (capabilities) {
      return (
        <div className="space-y-4">
          <div className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
            <div>
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Earn model: </span>
              {capabilities.earnModel}
            </div>
            <div className="mt-2">
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Entitlements: </span>
              {capabilities.entitlements.join(' · ')}
            </div>
            <div className="mt-2">
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Primary routes: </span>
              <span className="font-mono text-sm">{capabilities.primaryRoutes.join(' · ')}</span>
            </div>
          </div>
          {workflowId ? (
            <RoleWorkflowPanel roleId={workflowId} compact completedSteps={workflowDemoProgress} />
          ) : null}
        </div>
      );
    }

    return <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>No capability matrix entry for this role.</p>;
  };

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Platform"
      title="Role preview"
      description="Inspect each product lane — routes, contracts, and access — before you provision it."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={navItem?.icon ?? Shield}
      metrics={metrics}
      metricTitle="Role access studio"
      metricDescription="Open a role tile to review experience, routes, and contracts."
      primaryAction={<ProductPagePrimaryAction label={config.addLabel} onClick={goToProvisioning} />}
      secondaryAction={
        <button
          type="button"
          className="fc-wlp-btn-secondary"
          onClick={() => {
            const path = activateRolePreview(roleKey);
            rawNavigate(path);
          }}
        >
          <ExternalLink size={14} /> Open live view
        </button>
      }
    >
      <section className={FINELY_OS_PAGE} data-surface-layout="catalog-mosaic">
        <nav className="fc-admin-role-mosaic" aria-label="Role lanes">
          {ROLE_PREVIEW_ORDER_LIST.map((r, idx) => {
            const tile = ROLE_PREVIEW_CONFIG[r];
            const TileIcon = tile.icon;
            const tileAccent = MOSAIC_ACCENTS[idx % MOSAIC_ACCENTS.length];
            return (
              <button
                key={r}
                type="button"
                className={`${finelyOsCatalogCard(tileAccent)} fc-admin-role-mosaic-tile`}
                data-fc-accent={tileAccent}
                data-selected={roleKey === r ? 'true' : undefined}
                onClick={() => openRole(r)}
                aria-pressed={roleKey === r}
              >
                <span className="fc-admin-role-mosaic-tile-head">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[0.06]">
                    <TileIcon size={22} />
                  </span>
                  {tile.shortLabel}
                </span>
                <span className="text-xl font-extrabold">{tile.title}</span>
                <span className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{tile.access.length} routes</span>
              </button>
            );
          })}
        </nav>
      </section>

      {inspectorOpen ? (
        <div
          className="fc-wlp-local-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`${config.title} role inspector`}
          onClick={() => setInspectorOpen(false)}
        >
          <div
            className="fc-wlp-local-modal fc-wlp-wide-drawer p-6 lg:p-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-400/30 bg-violet-500/15">
                  <Icon size={28} />
                </div>
                <div className="min-w-0">
                  <p className={FINELY_OS_ENTITY_SUBLABEL}>{config.shortLabel} lane</p>
                  <h2 className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{config.title}</h2>
                  <p className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                    Routes, contracts, payouts, and the capability matrix for this role.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={FINELY_OS_SUCCESS_BTN} onClick={goToProvisioning}>
                  {config.addLabel} <ArrowRight size={14} />
                </button>
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setInspectorOpen(false)} aria-label="Close role inspector">
                  <X size={14} /> Close
                </button>
              </div>
            </div>

            <div className="fc-admin-role-detail-tabs" role="tablist" aria-label="Role detail">
              {ROLE_PREVIEW_DETAIL_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={detailTab === t.id}
                  className={finelyOsViewTab(detailTab === t.id, MOSAIC_ACCENTS[ROLE_PREVIEW_ORDER_LIST.indexOf(roleKey) % MOSAIC_ACCENTS.length])}
                  onClick={() => setDetailTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div>
              <p className={FINELY_OS_ENTITY_SUBLABEL}>{ROLE_PREVIEW_DETAIL_TABS.find((t) => t.id === detailTab)?.label}</p>
              <div className="mt-4">{renderDetailBody()}</div>
            </div>

            {launchCourse ? (
              <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-3`} data-fc-accent="emerald">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Launch training track</div>
                <div className={`text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{launchCourse.title}</div>
                <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{launchCourse.desc}</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={FINELY_OS_SUCCESS_BTN} onClick={() => navigate(launchCourse.hubPath)}>
                    Open training hub <ArrowRight size={14} />
                  </button>
                  <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/launch-os')}>
                    All playbooks
                  </button>
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8 space-y-4`} data-fc-accent="rose">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Provision this role</div>
                <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{rolePreviewProvisionHint(roleKey)}</p>
                <p className={`text-xs font-mono ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
                  Live lane: {rolePreviewEntry(roleKey).previewPath}
                </p>
                <button type="button" onClick={goToProvisioning} className={FINELY_OS_PRIMARY_BTN}>
                  {config.addLabel} <ArrowRight size={14} />
                </button>
              </div>
              <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-3`} data-fc-accent="sky">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Quick open</div>
                <button
                  type="button"
                  className={`${FINELY_OS_SECONDARY_BTN} w-full justify-center`}
                  onClick={() => {
                    const path = activateRolePreview(roleKey);
                    rawNavigate(path);
                  }}
                >
                  <ExternalLink size={14} /> Live preview
                </button>
                <button type="button" className={`${FINELY_OS_SECONDARY_BTN} w-full justify-center`} onClick={() => navigate('/admin/access')}>
                  Control center
                </button>
              </div>
            </div>

            <div className={FINELY_OS_NOTICE_SUCCESS}>
              Portal accounts are partners in every lane — never clients or customers in product copy.
            </div>
          </div>
        </div>
      ) : null}

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
