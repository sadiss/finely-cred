import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  ExternalLink,
  FileSignature,
  Shield,
  Users,
  Wallet,
} from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useMappedAdminNavigate } from '../partner/usePartnerProductNavigation';
import { HosAccessCodesAdminPanel } from '../../../../components/heta/HosAccessCodesAdminPanel';
import {
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
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
  ROLE_PREVIEW_TAB_ACCENTS,
  rolePreviewLaunchCourse,
  rolePreviewProvisionHint,
  type RolePreviewDetailTab,
  type RolePreviewSurfaceRole,
} from './rolePreviewSurfaceModel';
import './adminRolePreviewProductSurface.css';

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

  const goToProvisioning = () => {
    if (config.addPath.startsWith('/admin/role-preview')) {
      const suffix = config.addPath.slice('/admin/role-preview'.length);
      navigate(`${location.pathname}${suffix}`);
      return;
    }
    navigate(config.addPath);
  };

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
    },
    {
      label: 'Routes',
      value: String(config.access.length),
      hint: 'Primary entry paths',
      accent: 'emerald',
      onClick: () => setDetailTab('routes'),
    },
    {
      label: 'Contracts',
      value: String(config.contracts.length),
      hint: 'Signing surfaces',
      accent: 'rose',
      onClick: () => setDetailTab('contracts'),
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
        <ul className="space-y-2">
          {config.access.map((a) => (
            <li key={a.path} className={`${finelyOsInlineListItem()} p-4`}>
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
        <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-4`} data-fc-accent="sky">
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
            <BadgeCheck size={14} /> Role capability matrix
          </div>
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
      description="Split workbench — pick a lane on the mosaic, inspect routes and contracts, then provision access."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={navItem?.icon ?? Shield}
      metrics={metrics}
      metricTitle="Role access studio"
      metricDescription="Each tile opens a lane inspector — not a cloned tab strip."
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
      <section className="fc-admin-role-workbench" data-surface-layout="split-workbench">
        <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8`} data-fc-accent="violet">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-400/30 bg-violet-500/15">
                <Icon size={28} />
              </div>
              <div>
                <p className={FINELY_OS_ENTITY_SUBLABEL}>{config.shortLabel} lane</p>
                <h2 className="text-3xl font-extrabold">{config.title}</h2>
                <p className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                  What this role experiences — routes, contracts, payouts, and capability matrix.
                </p>
              </div>
            </div>
            <button type="button" className={FINELY_OS_SUCCESS_BTN} onClick={goToProvisioning}>
              {config.addLabel} <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="fc-admin-role-layout">
          <nav className="fc-admin-role-mosaic" aria-label="Role lanes">
            {ROLE_PREVIEW_ORDER_LIST.map((r) => {
              const tile = ROLE_PREVIEW_CONFIG[r];
              const TileIcon = tile.icon;
              const tabAccent = ROLE_PREVIEW_TAB_ACCENTS[r];
              return (
                <button
                  key={r}
                  type="button"
                  className={`${finelyOsCatalogCard(tabAccent)} fc-admin-role-mosaic-tile`}
                  data-fc-accent={tabAccent}
                  data-selected={roleKey === r ? 'true' : undefined}
                  onClick={() => goToRolePreview(r)}
                  aria-pressed={roleKey === r}
                >
                  <span className="fc-admin-role-mosaic-tile-head">
                    <TileIcon size={16} />
                    {tile.shortLabel}
                  </span>
                  <span className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{tile.title}</span>
                </button>
              );
            })}
          </nav>

          <div className="min-w-0 space-y-4">
            <div className="fc-admin-role-inspector-bed">
              <div className="fc-admin-role-detail-tabs" role="tablist" aria-label="Role detail">
                {ROLE_PREVIEW_DETAIL_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={detailTab === t.id}
                    className={finelyOsViewTab(detailTab === t.id, ROLE_PREVIEW_TAB_ACCENTS[roleKey])}
                    onClick={() => setDetailTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div>
                <p className={FINELY_OS_ENTITY_SUBLABEL}>Inspector</p>
                <h3 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                  {ROLE_PREVIEW_DETAIL_TABS.find((t) => t.id === detailTab)?.label}
                </h3>
              </div>
              <div className="mt-6">{renderDetailBody()}</div>
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
          </div>

          <aside className="fc-admin-role-provision-rail">
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

            <div className={`${finelyOsCatalogCard('sky')} p-6 space-y-3`} data-fc-accent="sky">
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

            <div className={`${FINELY_OS_BANNER} p-5`}>
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-500`}>Partner terminology</div>
              <p className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                Portal users are partners in every lane — never clients or customers in product copy.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
