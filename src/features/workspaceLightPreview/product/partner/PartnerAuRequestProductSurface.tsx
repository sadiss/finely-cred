import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CircleHelp,
  FileUp,
  PlayCircle,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../../../auth/AuthProvider';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { getPartnerSync } from '../../../../data/partnersRepo';
import { createTask } from '../../../../data/tasksRepo';
import { getActiveTenantId } from '../../../../tenancy/activeTenant';
import type { AuBuyerOrder, AuBuyerOrderEvidenceKind, AuBuyerOrderListing } from '../../../../domain/auBuyerOrders';
import {
  addAuBuyerOrderEvidence,
  addAuBuyerOrderEvent,
  createAuBuyerOrder,
  getAuBuyerOrder,
  setAuBuyerOrderStatus,
  upsertAuBuyerOrder,
} from '../../../../data/auBuyerOrdersRepo';
import { EvidenceUploader } from '../../../../components/evidence/EvidenceUploader';
import { AuBuyerCommandStrip } from '../../../../components/au/AuBuyerCommandStrip';
import { MarketingStaffChatStrip } from '../../../../components/marketing/MarketingStaffChatStrip';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsInlineListItem,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';

const formLabel = `block ${FINELY_OS_ENTITY_LABEL} mb-1`;
const formInput = FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '');
const formSelect = FINELY_OS_ENTITY_SELECT;

function fmtUsd(cents: number) {
  return `$${(Math.max(0, Math.round(cents)) / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function safeInt(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

const STEPS = ['eligibility', 'terms', 'docs', 'review'] as const;
type Step = (typeof STEPS)[number];

const STEP_LABELS: Record<Step, string> = {
  eligibility: 'Eligibility',
  terms: 'Terms',
  docs: 'Documents',
  review: 'Review',
};

export default function PartnerAuRequestProductSurface({
  role,
  pageId,
  partnerId,
  dataMode,
}: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const location = useLocation();
  const auth = useAuth();
  const { partner: sessionPartner } = usePartnerSession();
  const partner = useMemo(
    () => (partnerId ? getPartnerSync(partnerId) ?? sessionPartner : sessionPartner),
    [partnerId, sessionPartner],
  );
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? ShieldCheck;
  const accent = navItem?.accent ?? 'violet';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const archetype = getWorkspaceProductArchetype(role, pageId);
  const isDemo = dataMode === 'demo' || !partner;
  const demoSpec = getWorkspaceProductPageSpec('partner', pageId);

  const qs = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const orderId = (qs.get('orderId') || '').trim();

  const listingFromQuery: AuBuyerOrderListing = useMemo(() => {
    const source = (qs.get('source') || '').trim() === 'seller' ? 'seller' : 'demo';
    return {
      source,
      bank: (qs.get('bank') || '').trim() || 'Tradeline',
      limit: (qs.get('limit') || '').trim() || '—',
      age: (qs.get('age') || '').trim() || '—',
      priceCents: Math.max(0, safeInt(qs.get('priceCents'))),
      sellerId: (qs.get('sellerId') || '').trim() || undefined,
      listingId: (qs.get('listingId') || '').trim() || undefined,
    };
  }, [location.search]);

  const [version, setVersion] = useState(0);
  const [step, setStep] = useState<Step>('eligibility');
  const [selectedEvidenceKind, setSelectedEvidenceKind] = useState<AuBuyerOrderEvidenceKind>('government_id');
  const [acceptedName, setAcceptedName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const order = useMemo(() => (orderId && !isDemo ? getAuBuyerOrder(orderId) : null), [orderId, version, isDemo]);
  const listing = order?.listing ?? listingFromQuery;

  useEffect(() => {
    if (isDemo || !partner) return;
    if (orderId) return;
    const created = createAuBuyerOrder({
      tenantId: partner.tenantId || getActiveTenantId(),
      partnerId: partner.id,
      buyerUserId: auth.user?.id,
      buyerEmail: auth.user?.email ?? undefined,
      listing: listingFromQuery,
    });
    try {
      const dueAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString();
      createTask({
        partnerId: partner.id,
        title: 'AU Order: Upload government ID',
        kind: 'upload_document',
        priority: 'normal',
        stage: 'identity',
        status: 'pending',
        dueAt,
        assignedTo: 'partner',
        notes: `Order ${created.id}: Upload a clear government ID (front/back if applicable).`,
      });
      createTask({
        partnerId: partner.id,
        title: 'AU Order: Upload proof of address',
        kind: 'upload_document',
        priority: 'normal',
        stage: 'identity',
        status: 'pending',
        dueAt,
        assignedTo: 'partner',
        notes: `Order ${created.id}: Upload a recent proof of address (utility bill, lease, etc.).`,
      });
    } catch {
      // best-effort
    }
    navigate(`${mapPortalHref('/au/request')}?orderId=${encodeURIComponent(created.id)}`, { replace: true });
  }, [
    isDemo,
    partner?.id,
    orderId,
    listingFromQuery.bank,
    listingFromQuery.limit,
    listingFromQuery.age,
    listingFromQuery.priceCents,
    auth.user?.id,
    auth.user?.email,
    mapPortalHref,
    navigate,
  ]);

  useEffect(() => {
    if (!order) return;
    setAcceptedName(order.terms.acceptedName ?? '');
  }, [order?.id]);

  const setEligibility = (patch: Partial<AuBuyerOrder['eligibility']>) => {
    if (!order) return;
    const next = { ...order, eligibility: { ...order.eligibility, ...patch } };
    upsertAuBuyerOrder(next);
    window.dispatchEvent(new Event('finely:store'));
    setVersion((v) => v + 1);
  };

  const setBuyer = (patch: Partial<NonNullable<AuBuyerOrder['buyer']>>) => {
    if (!order) return;
    const next = { ...order, buyer: { ...(order.buyer ?? {}), ...patch } };
    upsertAuBuyerOrder(next);
    window.dispatchEvent(new Event('finely:store'));
    setVersion((v) => v + 1);
  };

  const acceptTerms = () => {
    if (!order) return;
    const name = acceptedName.trim();
    if (!name) {
      setErr('Please type your full legal name to accept the terms.');
      return;
    }
    setErr(null);
    const next = {
      ...order,
      terms: { ...order.terms, acceptedAt: new Date().toISOString(), acceptedName: name },
    };
    upsertAuBuyerOrder(next);
    addAuBuyerOrderEvent(order.id, { kind: 'terms_accepted', title: 'Terms accepted', note: `Accepted by ${name}` });
    window.dispatchEvent(new Event('finely:store'));
    setVersion((v) => v + 1);
    setStep('docs');
  };

  const submit = async () => {
    if (!order || !partner) return;
    setErr(null);
    setBusy(true);
    try {
      if (!order.eligibility.checked) throw new Error('Complete the eligibility checklist first.');
      if (!order.terms.acceptedAt) throw new Error('Accept the terms before submitting.');
      if (order.evidence.length === 0) throw new Error('Upload at least one document before submitting.');
      setAuBuyerOrderStatus(order.id, 'submitted', 'Buyer submitted intake.');
      addAuBuyerOrderEvent(order.id, { kind: 'submitted', title: 'Submitted for review' });
      try {
        createTask({
          partnerId: partner.id,
          title: `AU Order review: ${order.listing.bank} • ${order.listing.limit}`,
          kind: 'review_results',
          priority: 'normal',
          stage: 'intake',
          status: 'pending',
          assignedTo: 'admin',
          notes: `Order ${order.id}: review eligibility + documents, then schedule posting timeline.`,
        });
      } catch {
        // best-effort
      }
      window.dispatchEvent(new Event('finely:store'));
      setVersion((v) => v + 1);
      navigate(mapPortalHref('/au/orders'));
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Submit failed.');
    } finally {
      setBusy(false);
    }
  };

  const canAdvanceEligibility =
    Boolean(order?.eligibility.hasNoRecentLatePayments) &&
    Boolean(order?.eligibility.understandsNoGuarantees) &&
    Boolean(order?.eligibility.agreesNotToMisrepresentIdentity) &&
    Boolean(order?.eligibility.understandsRemovalTimingVaries);

  const metrics: ProductMetric[] = [
    {
      label: 'Order',
      value: order?.id?.slice(0, 8) ?? '…',
      hint: 'Reference',
      accent: 'violet',
      icon: ShieldCheck,
    },
    {
      label: 'Step',
      value: STEP_LABELS[step],
      hint: 'Current stage',
      accent: 'emerald',
      icon: CheckCircle2,
    },
    {
      label: 'Price',
      value: fmtUsd(listing.priceCents),
      hint: listing.bank,
      accent: 'sky',
      icon: Sparkles,
    },
    {
      label: 'Documents',
      value: order?.evidence.length ?? 0,
      hint: 'Uploaded',
      accent: 'rose',
      icon: FileUp,
    },
  ];

  const askFinelyPrompt = 'What documents do I need for this AU placement request?';

  const stepForm = (
    <>
      {step === 'eligibility' && order ? (
        <div className={`space-y-4 ${finelyOsCatalogCard('violet')} p-6 lg:p-8`}>
          <div className="inline-flex items-center gap-2 text-fuchsia-400">
            <ShieldCheck size={18} />
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Eligibility & expectations</span>
          </div>
          <div className={FINELY_OS_ENTITY_BODY}>
            This is a self-attestation checklist so we can process quickly and avoid mismatches. Nothing here is a promise
            of results.
          </div>

          <details className={`${finelyOsCatalogCard('sky')} fc-surface-harmony p-4`} open>
            <summary className={`cursor-pointer select-none ${FINELY_OS_ENTITY_VALUE}`}>
              Buyer details (required for matching)
            </summary>
            <div className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>
              Enter the info we should use to match docs and prevent posting errors. Avoid sharing full SSNs (last-4 only,
              optional).
            </div>
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div>
                <label className={formLabel}>Legal name</label>
                <input
                  value={order.buyer?.legalName ?? ''}
                  onChange={(e) => setBuyer({ legalName: e.target.value })}
                  className={formInput}
                  placeholder="Full legal name"
                />
              </div>
              <div>
                <label className={formLabel}>Phone</label>
                <input
                  value={order.buyer?.phone ?? ''}
                  onChange={(e) => setBuyer({ phone: e.target.value })}
                  className={formInput}
                  placeholder="(555) 555-5555"
                />
              </div>
              <div className="md:col-span-2">
                <label className={formLabel}>Address</label>
                <input
                  value={order.buyer?.address1 ?? ''}
                  onChange={(e) => setBuyer({ address1: e.target.value })}
                  className={formInput}
                  placeholder="Street address"
                />
                <input
                  value={order.buyer?.address2 ?? ''}
                  onChange={(e) => setBuyer({ address2: e.target.value })}
                  className={`${formInput} mt-2`}
                  placeholder="Apt, unit, etc. (optional)"
                />
              </div>
              <div>
                <label className={formLabel}>City</label>
                <input value={order.buyer?.city ?? ''} onChange={(e) => setBuyer({ city: e.target.value })} className={formInput} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={formLabel}>State</label>
                  <input
                    value={order.buyer?.state ?? ''}
                    onChange={(e) => setBuyer({ state: e.target.value })}
                    className={formInput}
                    placeholder="ST"
                  />
                </div>
                <div>
                  <label className={formLabel}>ZIP</label>
                  <input
                    value={order.buyer?.postalCode ?? ''}
                    onChange={(e) => setBuyer({ postalCode: e.target.value })}
                    className={formInput}
                  />
                </div>
              </div>
              <div>
                <label className={formLabel}>DOB (optional)</label>
                <input
                  type="date"
                  value={order.buyer?.dob ?? ''}
                  onChange={(e) => setBuyer({ dob: e.target.value })}
                  className={formInput}
                />
              </div>
              <div>
                <label className={formLabel}>SSN last-4 (optional)</label>
                <input
                  value={order.buyer?.ssnLast4 ?? ''}
                  onChange={(e) => setBuyer({ ssnLast4: e.target.value.replace(/[^\d]/g, '').slice(0, 4) })}
                  className={`${formInput} font-mono`}
                  placeholder="1234"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className={formLabel}>Desired post-by (optional)</label>
                <input
                  type="date"
                  value={order.buyer?.desiredPostByDate ?? ''}
                  onChange={(e) => setBuyer({ desiredPostByDate: e.target.value })}
                  className={formInput}
                />
              </div>
              <div>
                <label className={formLabel}>Country</label>
                <input
                  value={order.buyer?.country ?? ''}
                  onChange={(e) => setBuyer({ country: e.target.value })}
                  className={formInput}
                  placeholder="USA"
                />
              </div>
              <div className="md:col-span-2">
                <label className={formLabel}>Notes (optional)</label>
                <textarea
                  value={order.buyer?.notes ?? ''}
                  onChange={(e) => setBuyer({ notes: e.target.value })}
                  rows={4}
                  className={`${formInput} resize-y min-h-[120px]`}
                  placeholder="Any constraints or context for ops…"
                />
              </div>
            </div>
          </details>

          <div className="space-y-3">
            {[
              {
                key: 'hasNoRecentLatePayments' as const,
                label:
                  'I understand AUs are not for “fixing” active delinquencies, and my profile is not currently being wrecked by recent late payments.',
              },
              {
                key: 'understandsNoGuarantees' as const,
                label: 'I understand there are no guarantees. Posting/reporting timing can vary by issuer and bureau.',
              },
              {
                key: 'understandsRemovalTimingVaries' as const,
                label: 'I understand removal timing varies, and AUs may be removed later per agreement.',
              },
              {
                key: 'agreesNotToMisrepresentIdentity' as const,
                label: 'I will not misrepresent identity or attempt unauthorized access to any account.',
              },
            ].map((x) => (
              <label
                key={x.key}
                className={`flex items-start gap-3 p-4 cursor-pointer ${finelyOsInlineListItem(Boolean((order.eligibility as Record<string, boolean>)[x.key]))}`}
              >
                <input
                  type="checkbox"
                  checked={Boolean((order.eligibility as Record<string, boolean>)[x.key])}
                  onChange={(e) => setEligibility({ [x.key]: e.target.checked } as Partial<AuBuyerOrder['eligibility']>)}
                  className="mt-1"
                />
                <div className={FINELY_OS_ENTITY_BODY}>{x.label}</div>
              </label>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_BODY} text-xs`}>
              <ShieldAlert size={14} />
              We are not providing legal advice. This is an operational intake.
            </div>
            <button
              type="button"
              onClick={() => {
                if (!canAdvanceEligibility) {
                  setErr('Complete all eligibility checks to continue.');
                  return;
                }
                setErr(null);
                setEligibility({ checked: true });
                addAuBuyerOrderEvent(order.id, { kind: 'eligibility_confirmed', title: 'Eligibility confirmed' });
                setStep('terms');
              }}
              className={FINELY_OS_PRIMARY_BTN}
            >
              Continue <ArrowRight size={14} />
            </button>
          </div>
        </div>
      ) : null}

      {step === 'terms' && order ? (
        <div className={`space-y-4 ${finelyOsCatalogCard('violet')} p-6 lg:p-8`}>
          <div className="inline-flex items-center gap-2 text-fuchsia-400">
            <BadgeCheck size={18} />
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Terms & consent</span>
          </div>
          <div className={`${finelyOsCatalogCard('sky')} fc-surface-harmony space-y-2 p-4`}>
            <div className={FINELY_OS_ENTITY_VALUE}>Summary (plain language)</div>
            <ul className={`list-disc ml-5 space-y-1 ${FINELY_OS_ENTITY_BODY}`}>
              <li>We coordinate an AU seat placement using verified inventory and operational checks.</li>
              <li>Reporting/posting is not guaranteed and timing varies by issuer and bureau.</li>
              <li>You agree to provide accurate identity details and required documents.</li>
              <li>We may cancel/refund per policy if the file is ineligible or documents cannot be verified.</li>
            </ul>
          </div>
          <label className="block">
            <span className={formLabel}>Type your full legal name</span>
            <input value={acceptedName} onChange={(e) => setAcceptedName(e.target.value)} className={formInput} placeholder="Full name" />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => setStep('eligibility')} className={FINELY_OS_SECONDARY_BTN}>
              <ArrowLeft size={14} /> Back
            </button>
            <button type="button" onClick={acceptTerms} className={FINELY_OS_PRIMARY_BTN}>
              Accept & continue <ArrowRight size={14} />
            </button>
          </div>
        </div>
      ) : null}

      {step === 'docs' && order && partner ? (
        <div className="space-y-6">
          <div className={`space-y-4 ${finelyOsCatalogCard('violet')} p-6 lg:p-8`}>
            <div className="inline-flex items-center gap-2 text-fuchsia-400">
              <FileUp size={18} />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Upload documents</span>
            </div>
            <div className={FINELY_OS_ENTITY_BODY}>
              Upload required documents. These are stored privately and linked to your AU order.
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <label className="block">
                <span className={formLabel}>Document type</span>
                <select
                  value={selectedEvidenceKind}
                  onChange={(e) => setSelectedEvidenceKind(e.target.value as AuBuyerOrderEvidenceKind)}
                  className={formSelect}
                >
                  <option value="government_id">Government ID</option>
                  <option value="proof_of_address">Proof of address</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <div className={FINELY_OS_NOTICE_WARN}>
                Tip: Add a caption like “ID front” / “utility bill” so ops can verify fast.
              </div>
            </div>
          </div>

          <EvidenceUploader
            partnerId={partner.id}
            reportId={`au-order:${order.id}`}
            onCreated={(item, file) => {
              addAuBuyerOrderEvidence(order.id, {
                kind: selectedEvidenceKind,
                title: item.caption || item.filename || 'Document',
                blobRef: item.blobRef!,
                filename: file?.name ?? item.filename,
                mimeType: file?.type ?? item.mimeType,
                sizeBytes: file?.size ?? item.sizeBytes,
              });
              addAuBuyerOrderEvent(order.id, {
                kind: 'docs_uploaded',
                title: 'Document uploaded',
                note: `${selectedEvidenceKind}: ${item.filename}`,
              });
              window.dispatchEvent(new Event('finely:store'));
              setVersion((v) => v + 1);
            }}
          />

          <div className={`space-y-4 ${finelyOsCatalogCard('sky')} p-6 lg:p-8`}>
            <div className={FINELY_OS_ENTITY_VALUE}>Uploaded</div>
            <div className="space-y-2">
              {order.evidence.length === 0 ? (
                <div className={FINELY_OS_ENTITY_BODY}>No documents uploaded yet.</div>
              ) : (
                order.evidence.slice(0, 10).map((e) => (
                  <div key={e.id} className={`p-4 ${finelyOsInlineListItem()}`}>
                    <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>{e.title}</div>
                    <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                      {e.kind} • {new Date(e.uploadedAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => setStep('review')} className={FINELY_OS_PRIMARY_BTN}>
                Continue <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {step === 'review' && order ? (
        <div className={`space-y-4 ${finelyOsCatalogCard('rose')} p-6 lg:p-8`}>
          <div className="inline-flex items-center gap-2 text-rose-400">
            <Sparkles size={18} />
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Review & submit</span>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className={`${finelyOsCatalogCard('emerald')} fc-surface-harmony space-y-1 p-4`} data-fc-accent="emerald">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Eligibility</div>
              <div className={FINELY_OS_ENTITY_BODY}>{order.eligibility.checked ? 'Complete' : 'Incomplete'}</div>
            </div>
            <div className={`${finelyOsCatalogCard('violet')} fc-surface-harmony space-y-1 p-4`} data-fc-accent="violet">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Terms</div>
              <div className={FINELY_OS_ENTITY_BODY}>
                {order.terms.acceptedAt ? `Accepted (${order.terms.acceptedName})` : 'Not accepted'}
              </div>
            </div>
            <div className={`${finelyOsCatalogCard('rose')} fc-surface-harmony space-y-1 p-4`} data-fc-accent="rose">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Documents</div>
              <div className={FINELY_OS_ENTITY_BODY}>{order.evidence.length} uploaded</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => setStep('docs')} className={FINELY_OS_SECONDARY_BTN}>
              <ArrowLeft size={14} /> Back
            </button>
            <button type="button" onClick={submit} disabled={busy} className={`${FINELY_OS_SUCCESS_BTN} disabled:opacity-60`}>
              <CheckCircle2 size={14} /> {busy ? 'Submitting…' : 'Submit order'}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );

  const composeStudio = (
    <section className="fc-wlp-section space-y-6" data-surface-layout="compose-studio">
      <AuBuyerCommandStrip />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => navigate(mapPortalHref('/au/marketplace'))} className="fc-wlp-btn-secondary">
          <ArrowLeft size={16} /> AU Marketplace
        </button>
        <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>order: {order?.id ?? 'creating…'}</div>
      </div>

      {err ? <div className={FINELY_OS_NOTICE_ERROR}>{err}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] items-start">
        <div className="space-y-4 min-w-0">
          <div className="flex flex-wrap gap-2">
            {STEPS.map((s, index) => {
              const active = step === s;
              const done =
                (s === 'eligibility' && order?.eligibility.checked) ||
                (s === 'terms' && order?.terms.acceptedAt) ||
                (s === 'docs' && (order?.evidence.length ?? 0) > 0) ||
                (s === 'review' && order?.status === 'submitted');
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStep(s)}
                  className={`rounded-xl px-4 py-3 text-sm font-bold border transition-all ${
                    active ? 'ring-2 ring-white/20' : 'opacity-80 hover:opacity-100'
                  }`}
                  data-fcm-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[index % 4]}
                >
                  {index + 1}. {STEP_LABELS[s]}
                  {done ? ' ✓' : ''}
                </button>
              );
            })}
          </div>

          {isDemo ? (
            <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 ${FINELY_OS_ENTITY_BODY}`}>
              Demo preview — sign in and pick a marketplace listing to start a real AU buyer intake with eligibility,
              terms, documents, and review.
            </div>
          ) : (
            stepForm
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4">
          <div className={`${finelyOsCatalogCard('emerald')} p-6 space-y-3`} data-fc-accent="emerald">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Placement</div>
            <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{listing.bank}</div>
            <div className={FINELY_OS_ENTITY_BODY}>
              {listing.limit} · {listing.age} · {fmtUsd(listing.priceCents)}
            </div>
          </div>

          <div className={`${finelyOsCatalogCard('violet')} p-6 space-y-3`} data-fc-accent="violet">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Intake status</div>
            <div className="space-y-2">
              {STEPS.map((s) => {
                const complete =
                  (s === 'eligibility' && order?.eligibility.checked) ||
                  (s === 'terms' && order?.terms.acceptedAt) ||
                  (s === 'docs' && (order?.evidence.length ?? 0) > 0) ||
                  (s === 'review' && order?.status === 'submitted');
                return (
                  <div key={s} className="flex items-center justify-between gap-2">
                    <span className={FINELY_OS_ENTITY_BODY}>{STEP_LABELS[s]}</span>
                    <span className={complete ? finelyOsStatusChip('ok') : finelyOsStatusChip('warn')}>
                      {complete ? 'Done' : step === s ? 'Now' : 'Pending'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`${finelyOsCatalogCard('sky')} p-6 space-y-3`} data-fc-accent="sky">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Need help?</div>
            <p className={FINELY_OS_ENTITY_BODY}>
              Stuck on eligibility, documents, or terms? Ask Finely or chat with an AU intake specialist while you
              complete your request.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={FINELY_OS_SECONDARY_BTN}
                onClick={() =>
                  openProductCopilot({ prompt: askFinelyPrompt, contextLabel: navItem?.label ?? 'AU request' })
                }
              >
                <CircleHelp size={14} /> Ask Finely
              </button>
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/resources#presenter-demo')}>
                <PlayCircle size={14} /> Watch how
              </button>
            </div>
          </div>
        </aside>
      </div>

      {!isDemo && partner ? (
        <MarketingStaffChatStrip
          roleId="finely_advisor"
          goal="tradelines"
          roleLabel="AU intake specialist"
          subline="Stuck on eligibility, documents, or terms? Chat while you complete your buyer request."
          buttonTone="secondary"
        />
      ) : null}
    </section>
  );

  if (isDemo) {
    return (
      <ProductHubScaffold
        role={role}
        eyebrow={demoSpec?.eyebrow ?? 'AU buyer intake'}
        title={demoSpec?.title ?? listing.bank}
        description={
          demoSpec?.description ??
          `${listing.limit} · ${listing.age} · ${fmtUsd(listing.priceCents)} — structured authorized user tradeline request.`
        }
        status={`Step: ${STEP_LABELS[step]} · demo data`}
        freshness="demo snapshot"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        archetype={archetype}
        metrics={metrics}
        metricTitle="Buyer intake"
        metricDescription="Complete eligibility, terms, documents, and review — then submit for ops review."
        primaryAction={
          <ProductPagePrimaryAction label="Browse marketplace" onClick={() => navigate(mapPortalHref('/au/marketplace'))} />
        }
      >
        {composeStudio}
        <p className="fc-wlp-section-description fc-wlp-compliance-line">
          Results vary · not legal advice · funding subject to underwriting
        </p>
      </ProductHubScaffold>
    );
  }

  if (!partner) {
    return (
      <ProductHubScaffold
        role={role}
        eyebrow="AU buyer intake"
        title="Sign in to request a placement"
        description="Ask for a specific authorized user placement with eligibility, terms, and documents."
        status="Sign in required"
        freshness="just now"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        primaryAction={<ProductPagePrimaryAction label="Sign in" onClick={() => navigate('/login')} />}
      >
        <ProductEmptyState
          title="Unable to load your profile"
          description="No partner profile found for this session."
          action={
            <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate('/login')}>
              Sign in
            </button>
          }
        />
      </ProductHubScaffold>
    );
  }

  return (
    <ProductHubScaffold
      role={role}
      eyebrow="AU buyer intake"
      title={listing.bank}
      description={`${listing.limit} · ${listing.age} · ${fmtUsd(listing.priceCents)}`}
      status={`Step: ${STEP_LABELS[step]} · live data`}
      freshness="just now"
      accent={accent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      archetype={archetype}
      metrics={metrics}
      metricTitle="Buyer intake"
      metricDescription="Big compose studio on the left — placement summary and status rail on the right."
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(mapPortalHref('/au/marketplace'))}>
          Marketplace
        </button>
      }
    >
      {composeStudio}
      <p className="fc-wlp-section-description fc-wlp-compliance-line">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
