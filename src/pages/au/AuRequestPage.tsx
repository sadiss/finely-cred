import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BadgeCheck, CheckCircle2, FileUp, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { getOrCreatePartnerForSession } from '../../portal/getOrCreatePartnerForSession';
import { createTask } from '../../data/tasksRepo';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import type { AuBuyerOrder, AuBuyerOrderEvidenceKind, AuBuyerOrderListing } from '../../domain/auBuyerOrders';
import { addAuBuyerOrderEvidence, addAuBuyerOrderEvent, createAuBuyerOrder, getAuBuyerOrder, setAuBuyerOrderStatus, upsertAuBuyerOrder } from '../../data/auBuyerOrdersRepo';
import { EvidenceUploader } from '../../components/evidence/EvidenceUploader';

function fmtUsd(cents: number) {
  return `$${(Math.max(0, Math.round(cents)) / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function safeInt(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

export default function AuRequestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const partner = useMemo(() => getOrCreatePartnerForSession({ user: auth.user }), [auth.user]);

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
  const [step, setStep] = useState<'eligibility' | 'terms' | 'docs' | 'review'>('eligibility');
  const [selectedEvidenceKind, setSelectedEvidenceKind] = useState<AuBuyerOrderEvidenceKind>('government_id');
  const [acceptedName, setAcceptedName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const order = useMemo(() => (orderId ? getAuBuyerOrder(orderId) : null), [orderId, version]);
  const listing = order?.listing ?? listingFromQuery;

  useEffect(() => {
    if (!partner) return;
    if (orderId) return;
    // Create a draft order once and persist it via the URL.
    const created = createAuBuyerOrder({
      tenantId: partner.tenantId || getActiveTenantId(),
      partnerId: partner.id,
      buyerUserId: auth.user?.id,
      buyerEmail: auth.user?.email ?? undefined,
      listing: listingFromQuery,
    });
    // Create initial partner tasks (document gathering).
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
    navigate(`/au/request?orderId=${encodeURIComponent(created.id)}`, { replace: true });
  }, [partner?.id, orderId, listingFromQuery.bank, listingFromQuery.limit, listingFromQuery.age, listingFromQuery.priceCents]);

  useEffect(() => {
    if (!order) return;
    setAcceptedName(order.terms.acceptedName ?? '');
  }, [order?.id]);

  if (!partner) {
    return (
      <PageShell badge="AU" title="AU Request" subtitle="Unable to load your profile.">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/60 text-sm">No partner profile found for this session.</div>
      </PageShell>
    );
  }

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
    if (!order) return;
    setErr(null);
    setBusy(true);
    try {
      if (!order.eligibility.checked) throw new Error('Complete the eligibility checklist first.');
      if (!order.terms.acceptedAt) throw new Error('Accept the terms before submitting.');
      if (order.evidence.length === 0) throw new Error('Upload at least one document before submitting.');
      setAuBuyerOrderStatus(order.id, 'submitted', 'Buyer submitted intake.');
      addAuBuyerOrderEvent(order.id, { kind: 'submitted', title: 'Submitted for review' });
      // Create ops-facing review task (shows in workflow queue).
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
      navigate('/au/orders');
    } catch (e: any) {
      setErr(e?.message || 'Submit failed.');
    } finally {
      setBusy(false);
    }
  };

  const canAdvanceEligibility =
    Boolean(order?.eligibility.hasNoRecentLatePayments) &&
    Boolean(order?.eligibility.understandsNoGuarantees) &&
    Boolean(order?.eligibility.agreesNotToMisrepresentIdentity) &&
    Boolean(order?.eligibility.understandsRemovalTimingVaries);

  return (
    <PageShell badge="AU" title="AU Buyer Intake" subtitle="A guided flow to qualify, protect you, and keep ops processing fast and clean.">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={() => navigate('/au/marketplace')} className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
            <ArrowLeft size={16} /> AU Marketplace
          </button>
          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">order: {order?.id ?? 'creating…'}</div>
        </div>

        {err && <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 text-rose-100 text-sm">{err}</div>}

        <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">Selected tradeline</div>
              <div className="mt-2 text-2xl font-light text-white">{listing.bank}</div>
              <div className="mt-2 text-white/60 text-sm">
                {listing.limit} • {listing.age} • <span className="text-amber-300 font-semibold">{fmtUsd(listing.priceCents)}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStep('eligibility')}
                className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest ${
                  step === 'eligibility' ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : 'border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.05]'
                }`}
              >
                Eligibility
              </button>
              <button
                type="button"
                onClick={() => setStep('terms')}
                className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest ${
                  step === 'terms' ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : 'border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.05]'
                }`}
              >
                Terms
              </button>
              <button
                type="button"
                onClick={() => setStep('docs')}
                className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest ${
                  step === 'docs' ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : 'border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.05]'
                }`}
              >
                Documents
              </button>
              <button
                type="button"
                onClick={() => setStep('review')}
                className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest ${
                  step === 'review' ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : 'border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.05]'
                }`}
              >
                Review
              </button>
            </div>
          </div>
        </div>

        {step === 'eligibility' && order && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
            <div className="inline-flex items-center gap-2 text-amber-400">
              <ShieldCheck size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Eligibility & expectations</span>
            </div>
            <div className="text-white/60 text-sm">
              This is a self-attestation checklist so we can process quickly and avoid mismatches. Nothing here is a promise of results.
            </div>

            <details className="rounded-2xl border border-white/10 bg-black/30 p-5" open>
              <summary className="cursor-pointer select-none text-white font-semibold">
                Buyer details (required for matching)
              </summary>
              <div className="mt-3 text-white/60 text-sm">
                Enter the info we should use to match docs and prevent posting errors. Avoid sharing full SSNs (last-4 only, optional).
              </div>
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Legal name</label>
                  <input
                    value={order.buyer?.legalName ?? ''}
                    onChange={(e) => setBuyer({ legalName: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/30 text-sm"
                    placeholder="Full legal name"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Phone</label>
                  <input
                    value={order.buyer?.phone ?? ''}
                    onChange={(e) => setBuyer({ phone: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/30 text-sm"
                    placeholder="(555) 555-5555"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Address</label>
                  <input
                    value={order.buyer?.address1 ?? ''}
                    onChange={(e) => setBuyer({ address1: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/30 text-sm"
                    placeholder="Street address"
                  />
                  <input
                    value={order.buyer?.address2 ?? ''}
                    onChange={(e) => setBuyer({ address2: e.target.value })}
                    className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/30 text-sm"
                    placeholder="Apt, unit, etc. (optional)"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">City</label>
                  <input
                    value={order.buyer?.city ?? ''}
                    onChange={(e) => setBuyer({ city: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/30 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">State</label>
                    <input
                      value={order.buyer?.state ?? ''}
                      onChange={(e) => setBuyer({ state: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/30 text-sm"
                      placeholder="ST"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">ZIP</label>
                    <input
                      value={order.buyer?.postalCode ?? ''}
                      onChange={(e) => setBuyer({ postalCode: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/30 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">DOB (optional)</label>
                  <input
                    type="date"
                    value={order.buyer?.dob ?? ''}
                    onChange={(e) => setBuyer({ dob: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">SSN last-4 (optional)</label>
                  <input
                    value={order.buyer?.ssnLast4 ?? ''}
                    onChange={(e) => setBuyer({ ssnLast4: e.target.value.replace(/[^\d]/g, '').slice(0, 4) })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/30 text-sm font-mono"
                    placeholder="1234"
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Desired post-by (optional)</label>
                  <input
                    type="date"
                    value={order.buyer?.desiredPostByDate ?? ''}
                    onChange={(e) => setBuyer({ desiredPostByDate: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Country</label>
                  <input
                    value={order.buyer?.country ?? ''}
                    onChange={(e) => setBuyer({ country: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/30 text-sm"
                    placeholder="USA"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Notes (optional)</label>
                  <textarea
                    value={order.buyer?.notes ?? ''}
                    onChange={(e) => setBuyer({ notes: e.target.value })}
                    rows={3}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/30 text-sm resize-y"
                    placeholder="Any constraints or context for ops…"
                  />
                </div>
              </div>
            </details>

            <div className="space-y-3">
              {[
                {
                  key: 'hasNoRecentLatePayments' as const,
                  label: 'I understand AUs are not for “fixing” active delinquencies, and my profile is not currently being wrecked by recent late payments.',
                },
                { key: 'understandsNoGuarantees' as const, label: 'I understand there are no guarantees. Posting/reporting timing can vary by issuer and bureau.' },
                { key: 'understandsRemovalTimingVaries' as const, label: 'I understand removal timing varies, and AUs may be removed later per agreement.' },
                { key: 'agreesNotToMisrepresentIdentity' as const, label: 'I will not misrepresent identity or attempt unauthorized access to any account.' },
              ].map((x) => (
                <label key={x.key} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean((order.eligibility as any)[x.key])}
                    onChange={(e) => setEligibility({ [x.key]: e.target.checked } as any)}
                    className="mt-1 accent-amber-500"
                  />
                  <div className="text-white/70 text-sm">{x.label}</div>
                </label>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-white/40 text-xs">
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
                  setEligibility({ checked: true } as any);
                  addAuBuyerOrderEvent(order.id, { kind: 'eligibility_confirmed', title: 'Eligibility confirmed' });
                  setStep('terms');
                }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
              >
                Continue <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {step === 'terms' && order && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
            <div className="inline-flex items-center gap-2 text-amber-400">
              <BadgeCheck size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Terms & consent</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-white/60 text-sm space-y-2">
              <div className="text-white/80 font-semibold">Summary (plain language)</div>
              <ul className="list-disc ml-5 space-y-1">
                <li>We coordinate an AU seat placement using verified inventory and operational checks.</li>
                <li>Reporting/posting is not guaranteed and timing varies by issuer and bureau.</li>
                <li>You agree to provide accurate identity details and required documents.</li>
                <li>We may cancel/refund per policy if the file is ineligible or documents cannot be verified.</li>
              </ul>
            </div>
            <label className="block">
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Type your full legal name</div>
              <input
                value={acceptedName}
                onChange={(e) => setAcceptedName(e.target.value)}
                className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="Full name"
              />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep('eligibility')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/[0.06] hover:bg-white/[0.09] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <button
                type="button"
                onClick={acceptTerms}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
              >
                Accept & continue <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {step === 'docs' && order && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
              <div className="inline-flex items-center gap-2 text-amber-400">
                <FileUp size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Upload documents</span>
              </div>
              <div className="text-white/60 text-sm">
                Upload required documents. These are stored privately and linked to your AU order.
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <label className="block">
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Document type</div>
                  <select
                    value={selectedEvidenceKind}
                    onChange={(e) => setSelectedEvidenceKind(e.target.value as any)}
                    className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80"
                  >
                    <option value="government_id">Government ID</option>
                    <option value="proof_of_address">Proof of address</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white/60 text-sm">
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
                addAuBuyerOrderEvent(order.id, { kind: 'docs_uploaded', title: 'Document uploaded', note: `${selectedEvidenceKind}: ${item.filename}` });
                window.dispatchEvent(new Event('finely:store'));
                setVersion((v) => v + 1);
              }}
            />

            <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
              <div className="text-white/80 font-semibold">Uploaded</div>
              <div className="mt-3 space-y-2">
                {order.evidence.length === 0 ? (
                  <div className="text-white/50 text-sm">No documents uploaded yet.</div>
                ) : (
                  order.evidence.slice(0, 10).map((e) => (
                    <div key={e.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="text-white/80 text-sm font-semibold">{e.title}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                        {e.kind} • {new Date(e.uploadedAt).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep('review')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                >
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'review' && order && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
            <div className="inline-flex items-center gap-2 text-amber-400">
              <Sparkles size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Review & submit</span>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Eligibility</div>
                <div className="mt-2 text-white/80 text-sm">{order.eligibility.checked ? 'Complete' : 'Incomplete'}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Terms</div>
                <div className="mt-2 text-white/80 text-sm">{order.terms.acceptedAt ? `Accepted (${order.terms.acceptedName})` : 'Not accepted'}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Documents</div>
                <div className="mt-2 text-white/80 text-sm">{order.evidence.length} uploaded</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep('docs')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/[0.06] hover:bg-white/[0.09] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={busy}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60"
              >
                <CheckCircle2 size={14} /> {busy ? 'Submitting…' : 'Submit order'}
              </button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

