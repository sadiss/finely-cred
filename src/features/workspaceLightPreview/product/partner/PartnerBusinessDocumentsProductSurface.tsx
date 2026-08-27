import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  CircleHelp,
  FileCheck2,
  FolderOpen,
  PlayCircle,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { BusinessCommandStrip } from '../../../../components/business/BusinessCommandStrip';
import { getOrCreateCapitalPlan, setDocNotes, setDocStatus } from '../../../../data/capitalReadinessRepo';
import { hasEntitlement } from '../../../../data/billingRepo';
import { listEvidenceByPartner } from '../../../../data/evidenceRepo';
import { getPartnerSync } from '../../../../data/partnersRepo';
import type { CapitalDocItem, CapitalDocKey, CapitalDocStatus } from '../../../../domain/capitalReadiness';
import type { Partner } from '../../../../domain/partners';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import { getPartnerServiceLine, getWorkspaceProductNavItem } from '../workspaceProductNav';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductDashboardSkeleton, ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import './partnerBusinessDocumentsMosaic.css';

const SERVICE_LINE_ID = 'business' as const;

const DOC_FAMILIES = [
  { id: 'entity', title: 'Entity docs', desc: 'Articles, operating agreement, EIN letter, SOS filings.', accent: 'emerald' as const, icon: FileCheck2 },
  { id: 'identity', title: 'Identity + ownership', desc: 'Owner ID, ownership structure, verification artifacts.', accent: 'violet' as const, icon: ShieldCheck },
  { id: 'banking', title: 'Banking', desc: 'Statements, balances, proof of revenue cadence.', accent: 'sky' as const, icon: FolderOpen },
  { id: 'compliance', title: 'Compliance', desc: 'Licenses, domain/email proofs, 411, insurance.', accent: 'rose' as const, icon: UploadCloud },
] as const;

const DOC_STATUS: { value: CapitalDocStatus; label: string }[] = [
  { value: 'missing', label: 'Missing' },
  { value: 'draft', label: 'Draft' },
  { value: 'ready', label: 'Ready' },
];

const ENTITY_KEYS = new Set<CapitalDocKey>(['articles', 'ein_letter', 'operating_agreement']);
const BANKING_KEYS = new Set<CapitalDocKey>(['bank_statements', 'profit_loss', 'balance_sheet', 'tax_returns']);
const COMPLIANCE_KEYS = new Set<CapitalDocKey>(['business_license', 'website', 'phone_411', 'address_proof', 'duns', 'naics']);

function familyKeys(id: string): Set<CapitalDocKey> {
  if (id === 'entity') return ENTITY_KEYS;
  if (id === 'banking') return BANKING_KEYS;
  if (id === 'compliance') return COMPLIANCE_KEYS;
  return new Set<CapitalDocKey>(['vendor_accounts']);
}

function docStatusTone(status: CapitalDocStatus): 'ok' | 'warn' | 'blocked' {
  if (status === 'ready') return 'ok';
  if (status === 'draft') return 'warn';
  return 'blocked';
}

function partnerOwnsBusinessLine(partnerId: string): boolean {
  const line = getPartnerServiceLine(SERVICE_LINE_ID);
  if (line.entitlementAnyOf.length === 0) return true;
  return line.entitlementAnyOf.some((key) => hasEntitlement(partnerId, key));
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'locked' }
  | { status: 'ready'; partner: Partner; evidenceCount: number };

export default function PartnerBusinessDocumentsProductSurface({ role, pageId, partnerId, dataMode }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const { partner: sessionPartner } = usePartnerSession();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? FileCheck2;
  const scaffoldAccent = navItem?.accent ?? 'emerald';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const serviceLine = getPartnerServiceLine(SERVICE_LINE_ID);
  const isDemo = dataMode === 'demo' || !partnerId;

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [retryToken, setRetryToken] = useState(0);
  const [version, setVersion] = useState(0);
  const [activeFamily, setActiveFamily] = useState<string>('entity');

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    setState({ status: 'loading' });
    try {
      if (!partnerOwnsBusinessLine(partnerId!)) {
        if (!cancelled) setState({ status: 'locked' });
        return;
      }
      const loaded = getPartnerSync(partnerId!);
      if (!loaded) throw new Error('Partner profile not found.');
      const evidenceCount = listEvidenceByPartner(loaded.id).length;
      if (!cancelled) setState({ status: 'ready', partner: loaded, evidenceCount });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load business documents.';
      if (!cancelled) setState({ status: 'error', message });
    }
    return () => { cancelled = true; };
  }, [isDemo, partnerId, retryToken]);

  const demoSpec = useMemo(() => getWorkspaceProductPageSpec('partner', pageId), [pageId]);
  const partner = state.status === 'ready' ? state.partner : sessionPartner;
  const plan = partner ? getOrCreateCapitalPlan(partner.id) : null;
  const docs = plan?.docs ?? [];
  const readyDocs = docs.filter((d) => d.status === 'ready').length;
  const missingDocs = docs.filter((d) => d.status === 'missing').length;
  const evidenceCount = state.status === 'ready' ? state.evidenceCount : 0;

  const familyDocs = useMemo(() => {
    const keys = familyKeys(activeFamily);
    return docs.filter((d) => keys.has(d.key));
  }, [activeFamily, docs, version]);

  const familyReadyCount = (id: string) => {
    const keys = familyKeys(id);
    const family = docs.filter((d) => keys.has(d.key));
    return family.filter((d) => d.status === 'ready').length;
  };

  const familyTotal = (id: string) => docs.filter((d) => familyKeys(id).has(d.key)).length;

  const metrics: ProductMetric[] = [
    { label: 'Groups ready', value: `${DOC_FAMILIES.filter((t) => familyTotal(t.id) > 0 && familyReadyCount(t.id) === familyTotal(t.id)).length}/4`, hint: 'Readiness families', accent: 'emerald', icon: FileCheck2, onClick: () => navigate(mapPortalHref('/business/documents')) },
    { label: 'Docs ready', value: `${readyDocs}/${docs.length}`, hint: missingDocs ? `${missingDocs} missing` : 'Package tracked', accent: 'sky', icon: ShieldCheck, onClick: () => navigate(mapPortalHref('/business/billion-path')) },
    { label: 'Vault uploads', value: evidenceCount, hint: 'Portal documents vault', accent: 'violet', icon: FolderOpen, onClick: () => navigate(mapPortalHref('/portal/documents')) },
    { label: 'Missing', value: missingDocs, hint: 'Upload on Capital readiness', accent: 'rose', icon: UploadCloud, onClick: () => navigate(mapPortalHref('/business/billion-path')) },
  ];

  const activeFamilyMeta = DOC_FAMILIES.find((t) => t.id === activeFamily) ?? DOC_FAMILIES[0];
  const ActiveFamilyIcon = activeFamilyMeta.icon;

  const setDoc = (key: CapitalDocKey, status: CapitalDocStatus) => {
    if (!partner) return;
    setDocStatus(partner.id, key, status);
    setVersion((v) => v + 1);
  };

  const setNote = (key: CapitalDocKey, notes: string) => {
    if (!partner) return;
    setDocNotes(partner.id, key, notes);
    setVersion((v) => v + 1);
  };

  const renderDocRow = (doc: CapitalDocItem, idx: number) => {
    const accent = (['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4];
    return (
      <div key={doc.key} className={`fc-wlp-biz-docs-row ${finelyOsCatalogCard(accent)}`} data-fc-accent={accent}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className={`text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{doc.label}</div>
            <span className={finelyOsStatusChip(docStatusTone(doc.status))}>{doc.status}</span>
          </div>
          {doc.notes ? <p className={`mt-2 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{doc.notes}</p> : null}
        </div>
        <div className="flex flex-col gap-2 min-w-[180px]">
          <label className="block">
            <div className={FINELY_OS_ENTITY_LABEL}>Status</div>
            <select
              value={doc.status}
              onChange={(e) => setDoc(doc.key, e.target.value as CapitalDocStatus)}
              className={`mt-1 w-full ${FINELY_OS_ENTITY_SELECT}`}
              disabled={!partner}
            >
              {DOC_STATUS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <div className={FINELY_OS_ENTITY_LABEL}>Notes</div>
            <input
              defaultValue={doc.notes ?? ''}
              onBlur={(e) => setNote(doc.key, e.target.value)}
              className={`mt-1 w-full ${FINELY_OS_ENTITY_INPUT}`}
              placeholder="Where the file lives"
              disabled={!partner}
            />
          </label>
        </div>
      </div>
    );
  };

  const mosaicBody = (
    <section className={`fc-wlp-section ${FINELY_OS_PAGE} space-y-6`} data-surface-layout="catalog-mosaic">
      <BusinessCommandStrip partner={partner ?? null} />

      <div className={`${finelyOsCatalogCard(missingDocs ? 'rose' : 'emerald')} p-6 lg:p-8 flex flex-wrap items-center justify-between gap-4`} data-fc-accent={missingDocs ? 'rose' : 'emerald'}>
        <div className="flex items-start gap-4 min-w-0">
          <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10">
            <UploadCloud size={26} />
          </div>
          <div>
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Underwriting package</p>
            <h2 className={`mt-1 text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
              {missingDocs ? `${missingDocs} document${missingDocs === 1 ? '' : 's'} still missing` : 'Document package is current'}
            </h2>
            <p className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
              Pick a family below, mark status, then upload finished files to the secure portal vault.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => navigate(mapPortalHref('/portal/documents'))} className={FINELY_OS_PRIMARY_BTN}>
            Open Documents Vault
          </button>
          <button type="button" onClick={() => navigate(mapPortalHref('/business/billion-path'))} className={FINELY_OS_SECONDARY_BTN}>
            Capital readiness
          </button>
        </div>
      </div>

      <div className="fc-wlp-biz-docs-mosaic">
        {DOC_FAMILIES.map((family) => {
          const Icon = family.icon;
          const active = activeFamily === family.id;
          const total = familyTotal(family.id);
          const ready = familyReadyCount(family.id);
          return (
            <button
              key={family.id}
              type="button"
              data-active={active ? 'true' : undefined}
              className={`fc-wlp-biz-docs-mosaic-tile ${finelyOsCatalogCard(family.accent)}`}
              data-fc-accent={family.accent}
              onClick={() => setActiveFamily(family.id)}
            >
              <div className="fc-wlp-biz-docs-mosaic-icon">
                <Icon size={24} />
              </div>
              <div className="fc-wlp-biz-docs-mosaic-value mt-4">{total ? `${ready}/${total}` : '—'}</div>
              <div className={`mt-2 text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{family.title}</div>
              <p className={`mt-2 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{family.desc}</p>
            </button>
          );
        })}
      </div>

      <div className={`fc-wlp-biz-docs-compose ${finelyOsCatalogCard(activeFamilyMeta.accent)} p-6 lg:p-8 space-y-5`} data-fc-accent={activeFamilyMeta.accent}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <ActiveFamilyIcon size={22} />
            </div>
            <div>
              <p className={FINELY_OS_ENTITY_SUBLABEL}>Compose strip</p>
              <h2 className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{activeFamilyMeta.title}</h2>
              <p className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{activeFamilyMeta.desc}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate(mapPortalHref('/portal/documents'))} className={FINELY_OS_PRIMARY_BTN}>
              Upload to vault
            </button>
            <button type="button" onClick={() => navigate(mapPortalHref('/portal/messages'))} className={FINELY_OS_SECONDARY_BTN}>
              Ask support
            </button>
          </div>
        </div>

        {familyDocs.length === 0 ? (
          <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>No checklist items in this family yet.</p>
        ) : (
          <FinelyOsPaginatedStack
            items={familyDocs}
            pageSize={6}
            itemSpacingClassName="space-y-0"
            emptyMessage="No documents in this family."
            renderItem={(doc, idx) => renderDocRow(doc, idx)}
          />
        )}

        <div className={`${finelyOsCatalogCard('sky')} p-4 flex flex-wrap items-center gap-3`} data-fc-accent="sky">
          <CheckCircle2 size={18} className="text-sky-500 shrink-0" />
          <p className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
            Mark status here, upload the file in Documents Vault, and keep names consistent with your business profile.
          </p>
        </div>
      </div>
    </section>
  );

  const askFinelyPrompt = 'Which business document should I upload first for fundability?';
  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button type="button" onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: navItem?.label ?? 'Business documents' })}>
        <CircleHelp size={15} /> Ask Finely
      </button>
      <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
        <PlayCircle size={15} /> Watch how
      </button>
    </div>
  );

  if (isDemo) {
    return (
      <ProductHubScaffold role={role} pageId={pageId} eyebrow={demoSpec?.eyebrow ?? 'Business documents'} title={demoSpec?.title ?? 'Business documents'} description={demoSpec?.description ?? 'Entity, banking, and compliance artifacts.'} status={`${demoSpec?.status ?? 'Demo'} · demo data`} freshness="demo snapshot" accent={scaffoldAccent} surfaceMode={surfaceMode} icon={PageIcon} metrics={metrics} metricTitle="Readiness mosaic" metricDescription="Families on the mosaic — checklist and status in the compose strip." primaryAction={<ProductPagePrimaryAction label="Open Documents Vault" onClick={() => navigate(mapPortalHref('/portal/documents'))} />}>
        {mosaicBody}
        <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
      </ProductHubScaffold>
    );
  }

  if (state.status === 'loading') return <ProductDashboardSkeleton label="Loading business documents" />;
  if (state.status === 'error') {
    return (
      <ProductHubScaffold role={role} pageId={pageId} eyebrow="Business documents" title="Business documents" description="Document readiness vault." status="Error" freshness="just now" accent={scaffoldAccent} surfaceMode={surfaceMode} icon={PageIcon} primaryAction={<ProductPagePrimaryAction label="Try again" onClick={() => setRetryToken((v) => v + 1)} />}>
        <ProductEmptyState title="Could not load documents" description={state.message} action={<button type="button" className="fc-wlp-btn-primary" onClick={() => setRetryToken((v) => v + 1)}>Try again</button>} />
      </ProductHubScaffold>
    );
  }
  if (state.status === 'locked') {
    return (
      <ProductHubScaffold role={role} pageId={pageId} eyebrow="Business documents" title="Business documents" description="Document readiness vault." status="Not started" freshness="just now" accent={scaffoldAccent} surfaceMode={surfaceMode} icon={PageIcon} metrics={metrics} primaryAction={<ProductPagePrimaryAction label="Explore business credit" onClick={() => navigate(serviceLine.upsellPath)} />}>
        <ProductEmptyState title="Not started yet" description={serviceLine.upsellHeadline} action={<button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(serviceLine.upsellPath)}>See business options</button>} />
      </ProductHubScaffold>
    );
  }

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Business documents"
      title="Business documents"
      description="Entity, banking, and compliance artifacts lenders expect — organized before you apply."
      status={`${missingDocs ? `${missingDocs} missing` : 'Checklist current'} · live data`}
      freshness="just now"
      accent={scaffoldAccent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      metrics={metrics}
      metricTitle="Readiness mosaic"
      metricDescription="Mosaic families — compose strip updates status and notes."
      primaryAction={<ProductPagePrimaryAction label="Open Documents Vault" onClick={() => navigate(mapPortalHref('/portal/documents'))} />}
      secondaryAction={<button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(mapPortalHref('/business/profile'))}>Business profile</button>}
    >
      {mosaicBody}
      <aside className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 mt-6 space-y-3`} data-fc-accent="violet">
        <div className="fc-wlp-eyebrow">What to do next</div>
        <h2 className="text-2xl font-extrabold">Package before pitch</h2>
        <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Lenders ask for the same four document groups — have them ready before any intro.</p>
        {guideActions}
      </aside>
      <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
    </ProductHubScaffold>
  );
}
