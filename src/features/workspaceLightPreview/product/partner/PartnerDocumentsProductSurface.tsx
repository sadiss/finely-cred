import React, { useMemo, useState } from 'react';
import {
  CircleHelp,
  FileCheck2,
  FolderOpen,
  PlayCircle,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../auth/AuthProvider';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { ENTITLEMENT_KEYS } from '../../../../billing/entitlements';
import { EntitlementGate } from '../../../../components/billing/EntitlementGate';
import { getPartnerSync } from '../../../../data/partnersRepo';
import { listEvidenceByPartner } from '../../../../data/evidenceRepo';
import { listProcessedDocumentsByPartner } from '../../../../data/documentsRepo';
import { listLettersByPartner } from '../../../../data/lettersRepo';
import {
  PartnerDocumentsVaultWorkspace,
  type PartnerDocumentsVaultNavigation,
  type PartnerDocumentsVaultTab,
} from '../../../../components/evidence/PartnerDocumentsVaultWorkspace';
import { checkIdentityDocumentGate } from '../../../../lib/documentVaultGates';
import { evidenceDestination } from '../../../../lib/evidenceVaultGrouping';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  finelyOsCatalogCard,
} from '../../../../features/os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import './partnerDocumentsSurface.css';

const FILE_DRAWERS: Array<{
  id: PartnerDocumentsVaultTab;
  title: string;
  desc: string;
  accent: 'emerald' | 'violet' | 'sky';
  icon: typeof UploadCloud;
}> = [
  { id: 'upload', title: 'Upload & scan', desc: 'ID, address proof, and statements.', accent: 'emerald', icon: UploadCloud },
  { id: 'vault', title: 'Your files', desc: 'Every document on file.', accent: 'violet', icon: FolderOpen },
  { id: 'intel', title: 'Doc intel', desc: 'Extracted fields from uploads.', accent: 'sky', icon: FileCheck2 },
];

function documentsNavigation(map: (href: string) => string): PartnerDocumentsVaultNavigation {
  return {
    documentsPath: map('/portal/documents'),
    reportsPath: map('/portal/reports'),
    lettersPath: map('/portal/letters'),
    disputesPath: map('/portal/disputes'),
    evidenceVaultPath: map('/portal/evidence'),
    dashboardPath: map('/portal/dashboard'),
    businessProfilePath: map('/business/profile'),
  };
}

export default function PartnerDocumentsProductSurface({
  role,
  pageId,
  partnerId,
  dataMode,
}: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const auth = useAuth();
  const email = auth.user?.email || '';
  const { partner: sessionPartner } = usePartnerSession();
  const isDemo = dataMode === 'demo' || !partnerId;
  const mapPortalHref = usePartnerProductPathResolver();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? FolderOpen;
  const accent = navItem?.accent ?? 'sky';
  const surfaceMode = navItem?.surfaceMode ?? 'light';

  const [activeTab, setActiveTab] = useState<PartnerDocumentsVaultTab>('upload');

  const partner = useMemo(() => {
    if (partnerId) return getPartnerSync(partnerId) ?? sessionPartner;
    return sessionPartner;
  }, [partnerId, sessionPartner]);

  const navigation = useMemo(() => documentsNavigation(mapPortalHref), [mapPortalHref]);

  const evidence = useMemo(() => {
    if (!partner) return [];
    return listEvidenceByPartner(partner.id).filter((item) => evidenceDestination(item) === 'documents');
  }, [partner]);

  const processed = useMemo(
    () => (partner ? listProcessedDocumentsByPartner(partner.id) : []),
    [partner],
  );
  const lettersCount = useMemo(() => (partner ? listLettersByPartner(partner.id).length : 0), [partner]);
  const idGate = useMemo(() => checkIdentityDocumentGate(evidence), [evidence]);
  const idGateOk = idGate.ok;

  const metrics: ProductMetric[] = [
    {
      label: 'Documents on file',
      value: evidence.length,
      hint: idGateOk ? 'IDs and supporting docs' : 'Upload identity proof',
      accent: 'sky',
      icon: FolderOpen,
      onClick: () => setActiveTab('vault'),
    },
    {
      label: 'Still needed',
      value: idGate.missing.length,
      hint: idGateOk ? 'ID and address on file' : idGate.missing.map((m) => m.label).join(' · '),
      accent: 'rose',
      icon: ShieldCheck,
      onClick: () => setActiveTab('upload'),
    },
    {
      label: 'Letters',
      value: lettersCount,
      hint: 'Dispute and validation',
      accent: 'violet',
      icon: FileCheck2,
      onClick: () => navigate(navigation.lettersPath),
    },
    {
      label: 'Processed',
      value: processed.length,
      hint: 'Doc intel extracts',
      accent: 'emerald',
      icon: UploadCloud,
      onClick: () => setActiveTab('intel'),
    },
  ];

  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button
        type="button"
        onClick={() => openProductCopilot({ prompt: 'What documents do I need to upload?', contextLabel: 'Documents vault' })}
      >
        <CircleHelp size={15} /> Ask Finely
      </button>
      <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
        <PlayCircle size={15} /> Watch how
      </button>
    </div>
  );

  if (isDemo && !partner) {
    return (
      <ProductEmptyState
        title="Sign in to open Documents vault"
        description="Upload ID, proof of address, statements, and correspondence — separate from dispute exhibit crops in Evidence vault."
        action={
          <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate('/login')}>
            Sign in
          </button>
        }
      />
    );
  }

  if (!partner) {
    return (
      <ProductEmptyState
        title="Partner profile not found"
        description="Return to the dashboard and pick a partner context, or sign in with a partner account."
        action={
          <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(mapPortalHref('/portal/dashboard'))}>
            Return to dashboard
          </button>
        }
      />
    );
  }

  const activeDrawer = FILE_DRAWERS.find((d) => d.id === activeTab) ?? FILE_DRAWERS[0];
  const ActiveIcon = activeDrawer.icon;

  const drawerValue = (id: PartnerDocumentsVaultTab) => {
    if (id === 'upload') return idGateOk ? 'Ready' : `${idGate.missing.length} needed`;
    if (id === 'vault') return String(evidence.length);
    return String(processed.length);
  };

  const workbenchBody = (
    <section className={`fc-wlp-section ${FINELY_OS_PAGE} space-y-6`} data-surface-layout="file-cabinet-mosaic">
      <div className="fc-wlp-documents-cabinet">
        <div className="fc-wlp-documents-drawers" role="tablist" aria-label="File cabinet">
          {FILE_DRAWERS.map((drawer) => {
            const Icon = drawer.icon;
            const active = activeTab === drawer.id;
            return (
              <button
                key={drawer.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-active={active ? 'true' : undefined}
                className={`fc-wlp-documents-drawer ${finelyOsCatalogCard(drawer.accent)} p-5 lg:p-6`}
                data-fc-accent={drawer.accent}
                onClick={() => setActiveTab(drawer.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className={`fc-wlp-documents-drawer-value ${FINELY_OS_ENTITY_VALUE}`}>{drawerValue(drawer.id)}</div>
                    <div className={`mt-1 text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{drawer.title}</div>
                    <div className={`mt-1 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{drawer.desc}</div>
                  </div>
                </div>
              </button>
            );
          })}

          <div className={`fc-wlp-documents-checklist ${finelyOsCatalogCard('rose')} p-5 lg:p-6`} data-fc-accent="rose">
            <div className={`text-sm font-extrabold ${FINELY_OS_ENTITY_SUBLABEL}`}>Mailing checklist</div>
            {idGateOk ? (
              <div className={`fc-wlp-documents-checklist-item ${FINELY_OS_ENTITY_BODY}`}>
                <ShieldCheck size={16} /> Identity proof complete
              </div>
            ) : (
              idGate.missing.map((item) => (
                <div key={item.kind} className={`fc-wlp-documents-checklist-item ${FINELY_OS_ENTITY_BODY}`}>
                  <ShieldCheck size={16} /> {item.label}
                </div>
              ))
            )}
            <div className={`fc-wlp-documents-checklist-item ${FINELY_OS_ENTITY_BODY}`}>
              <FileCheck2 size={16} /> {lettersCount} letter{lettersCount === 1 ? '' : 's'} on file
            </div>
          </div>
        </div>

        <div className="fc-wlp-documents-stage space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <ActiveIcon size={24} />
            <div>
              <h2 className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{activeDrawer.title}</h2>
              <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{activeDrawer.desc}</p>
            </div>
          </div>
          <div className={`${finelyOsCatalogCard(activeDrawer.accent)} p-6 lg:p-8`} data-fc-accent={activeDrawer.accent}>
            <PartnerDocumentsVaultWorkspace
              partner={partner}
              actorEmail={email}
              navigation={navigation}
              surface="light"
              embedded
              tab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.documents]}>
      <ProductHubScaffold
        role={role}
        pageId="documents"
        eyebrow="Documents vault"
        title="Your uploads — ID, address, and paperwork"
        description="Government ID, proof of address, statements, and correspondence — separate from dispute exhibits."
        status={`${evidence.length} document${evidence.length === 1 ? '' : 's'} · live data`}
        freshness={evidence.length ? 'on file' : 'empty vault'}
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        metricsVariant="grid"
        primaryAction={
          <ProductPagePrimaryAction label="Upload document" onClick={() => setActiveTab('upload')} />
        }
        secondaryAction={
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(navigation.evidenceVaultPath)}>
            Evidence vault
          </button>
        }
        metrics={metrics}
        metricTitle="Cabinet summary"
        metricDescription="Files on file, identity gate, letters, and doc intel extracts."
      >
        {workbenchBody}
        <aside className="fc-wlp-page-guide mt-6">
          <div className="fc-wlp-page-guide-icon">
            <PageIcon size={22} strokeWidth={2.05} />
          </div>
          <div className="fc-wlp-eyebrow">What to do next</div>
          <h2>{idGateOk ? 'Keep paperwork current' : 'Upload required identity proof'}</h2>
          <p>
            {idGateOk
              ? 'Refresh statements and correspondence as they arrive — dispute exhibit crops stay in Evidence vault.'
              : `Upload ${idGate.missing.map((m) => m.label).join(' and ')} so Letter Studio can mail on your behalf.`}
          </p>
          <ol>
            <li>Choose document type and scan or upload files.</li>
            <li>Review extracted fields under Doc intel.</li>
            <li>Keep bureau replies in Evidence vault instead.</li>
          </ol>
          {guideActions}
        </aside>
        <p className="fc-wlp-section-description fc-wlp-compliance-line mt-4">
          Results vary · not legal advice · funding subject to underwriting
        </p>
      </ProductHubScaffold>
    </EntitlementGate>
  );
}
