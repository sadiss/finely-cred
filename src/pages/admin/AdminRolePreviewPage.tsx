import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  FileSignature,
  Wallet,
} from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useMappedAdminNavigate } from '../../features/workspaceLightPreview/product/partner/usePartnerProductNavigation';
import { PageShell } from '../../components/layout/PageShell';
import { HosAccessCodesAdminPanel } from '../../components/heta/HosAccessCodesAdminPanel';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsInlineListItem,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';
import { capabilitiesForRole, workflowIdForCapabilityRole, type RoleCapabilityRole } from '../../config/roleCapabilityMatrix';
import {
  ROLE_PREVIEW_ORDER,
  parseRolePreviewRole,
  rolePreviewEntry,
  type RolePreviewRole,
} from '../../config/rolePreviewCatalog';
import { activateRolePreview } from '../../lib/adminRolePreview';
import { RoleWorkflowPanel } from '../../components/workflow/RoleWorkflowPanel';
import { demoRoleWorkflowProgress } from '../../lib/roleWorkflowProgress';
import {
  ROLE_PREVIEW_CONFIG,
  ROLE_PREVIEW_DETAIL_TABS,
  ROLE_PREVIEW_ORDER_LIST,
  ROLE_PREVIEW_TAB_ACCENTS,
  rolePreviewLaunchCourse,
  rolePreviewProvisionHint,
  type RolePreviewDetailTab,
  type RolePreviewSurfaceRole,
} from '../../features/workspaceLightPreview/product/admin/rolePreviewSurfaceModel';

type RoleType = RolePreviewSurfaceRole;
const ROLE_CONFIG = ROLE_PREVIEW_CONFIG;
const ROLE_ORDER = ROLE_PREVIEW_ORDER_LIST;
const TAB_ACCENTS = ROLE_PREVIEW_TAB_ACCENTS;
const DETAIL_TABS = ROLE_PREVIEW_DETAIL_TABS;
type DetailTab = RolePreviewDetailTab;

function AdminRolePreviewFrame({
  embedded,
  children,
}: {
  embedded: boolean;
  children: React.ReactNode;
}) {
  if (embedded) return <>{children}</>;
  return (
    <PageShell
      badge="Admin"
      title="Role preview"
      subtitle="Inspect what each role sees — access, contracts, and payouts."
    >
      {children}
    </PageShell>
  );
}

export default function AdminRolePreviewPage({ embedded = false }: { embedded?: boolean } = {}) {
  const navigate = useMappedAdminNavigate();
  const rawNavigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [detailTab, setDetailTab] = useState<DetailTab>('experience');
  const roleRaw = params.get('role');
  const role: RoleType = parseRolePreviewRole(roleRaw);

  const config = useMemo(() => ROLE_CONFIG[role], [role]);
  const capabilities = useMemo(() => capabilitiesForRole(role as RoleCapabilityRole), [role]);
  const workflowId = useMemo(() => workflowIdForCapabilityRole(role as RoleCapabilityRole), [role]);
  const workflowDemoProgress = useMemo(
    () => (workflowId ? demoRoleWorkflowProgress(workflowId) : undefined),
    [workflowId],
  );
  const launchCourse = useMemo(() => rolePreviewLaunchCourse(role), [role]);
  const Icon = config.icon;
  const goToRolePreview = (nextRole: RoleType) => {
    navigate(`${location.pathname}?role=${nextRole}`);
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

  return (
    <AdminRolePreviewFrame embedded={embedded}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {!embedded ? (
            <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
              <ArrowLeft size={16} /> Admin Dashboard
            </button>
          ) : (
            <div className="fc-wlp-role-preview-intro">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Role access studio</div>
              <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>Inspect every product lane before provisioning access.</p>
            </div>
          )}
          <div
            className={`${FINELY_OS_VIEW_TABS} flex flex-wrap gap-1 max-w-full max-h-[min(40vh,14rem)] overflow-y-auto overscroll-contain`}
            role="tablist"
            aria-label="Role previews"
          >
            {ROLE_ORDER.map((r) => (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={role === r}
                onClick={() => goToRolePreview(r)}
                className={finelyOsViewTab(role === r, TAB_ACCENTS[r])}
              >
                {ROLE_CONFIG[r].shortLabel}
              </button>
            ))}
          </div>
        </div>

        <FinelyUnifiedHubLayout
          eyebrow={`${config.shortLabel} role preview`}
          title={config.title}
          subtitle="What this role experiences — routes, contracts, payouts, and capability matrix."
          accent={config.accent}
          variant={embedded ? 'workspaceLight' : 'default'}
          tabs={DETAIL_TABS.map((t) => ({ id: t.id, label: t.label }))}
          activeTab={detailTab}
          onTabChange={(id) => setDetailTab(id as DetailTab)}
          primaryAction={{ label: config.addLabel, onClick: goToProvisioning }}
          secondaryAction={{
            label: 'Open live view',
            onClick: () => {
              const path = activateRolePreview(role);
              rawNavigate(path);
            },
          }}
          primaryActionClassName={embedded ? FINELY_OS_SUCCESS_BTN : undefined}
          secondaryActionClassName={embedded ? FINELY_OS_SECONDARY_BTN : undefined}
        >
          {detailTab === 'experience' && (
            <div className="space-y-4">
              {role === 'heta_society' ? <HosAccessCodesAdminPanel /> : null}
              <ul className={`space-y-2 ${FINELY_OS_ENTITY_BODY}`}>
                {config.preview.map((item, i) => (
                  <li key={i} className={`${finelyOsInlineListItem()} p-4 flex items-start gap-2`}>
                    <span className="text-fuchsia-300">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {detailTab === 'routes' && (
            <ul className="space-y-2">
              {config.access.map((a) => (
                <li key={a.path} className={`${finelyOsInlineListItem()} p-4`}>
                  <button
                    type="button"
                    onClick={() => navigate(a.path)}
                    className={`text-sm ${FINELY_OS_ENTITY_BODY} hover:text-white underline underline-offset-4 decoration-white/20`}
                  >
                    {a.label}
                  </button>
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono text-[9px] mt-0.5`}>{a.path}</div>
                </li>
              ))}
            </ul>
          )}

          {detailTab === 'contracts' && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className={`${finelyOsInlineListItem()} p-5 space-y-3`}>
                <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                  <FileSignature size={12} /> Contracts & signing
                </div>
                <ul className={`space-y-2 ${FINELY_OS_ENTITY_BODY}`}>
                  {config.contracts.map((c, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-violet-300">•</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`${finelyOsInlineListItem()} p-5 space-y-3`}>
                <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                  <Wallet size={12} /> Payouts
                </div>
                <ul className={`space-y-2 ${FINELY_OS_ENTITY_BODY}`}>
                  {config.payouts.map((p, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-300">•</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {detailTab === 'capabilities' && capabilities ? (
            <div className={`${finelyOsInlineListItem()} p-5 space-y-3`}>
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <BadgeCheck size={12} /> Role capability matrix
              </div>
              <div className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
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
                  <span className="font-mono text-[11px]">{capabilities.primaryRoutes.join(' · ')}</span>
                </div>
              </div>
              {workflowId ? (
                <RoleWorkflowPanel roleId={workflowId} compact completedSteps={workflowDemoProgress} />
              ) : null}
            </div>
          ) : detailTab === 'capabilities' ? (
            <p className={FINELY_OS_ENTITY_BODY}>No capability matrix entry for this role.</p>
          ) : null}
        </FinelyUnifiedHubLayout>

        {launchCourse ? (
          <div className={`${finelyOsCatalogCard('violet')} space-y-3`} data-fc-accent="violet">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Launch training track</div>
            <div className={FINELY_OS_ENTITY_VALUE}>{launchCourse.title}</div>
            <p className={FINELY_OS_ENTITY_BODY}>{launchCourse.desc}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={embedded ? FINELY_OS_SUCCESS_BTN : FINELY_OS_PRIMARY_BTN} onClick={() => navigate(launchCourse.hubPath)}>
                Open training hub <ArrowRight size={14} />
              </button>
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/launch-os')}>
                All playbooks
              </button>
            </div>
          </div>
        ) : null}

        <div className={`${FINELY_OS_BANNER} flex flex-wrap items-center justify-between gap-4`}>
          <div>
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300`}>Provision this role</div>
            <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>{rolePreviewProvisionHint(role)}</p>
            <p className={`mt-2 text-xs font-mono text-white/45`}>
              Live lane: {rolePreviewEntry(role).previewPath}
            </p>
          </div>
          <button type="button" onClick={goToProvisioning} className={embedded ? FINELY_OS_SUCCESS_BTN : FINELY_OS_PRIMARY_BTN}>
            {config.addLabel} <ArrowRight size={14} />
          </button>
        </div>
        <FinelyOsPageFooter />
      </div>
    </AdminRolePreviewFrame>
  );
}
