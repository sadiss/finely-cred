import React, { useMemo, useState } from 'react';
import { ArrowLeft, Scale, FileWarning, ChevronDown, ChevronRight, FileText, BookOpen, AlertTriangle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { getDebt, upsertDebt } from '../../data/debtRepo';
import { listEvidenceByPartner, upsertEvidence, deleteEvidence } from '../../data/evidenceRepo';
import { getOrCreatePartnerForSession } from '../../portal/getOrCreatePartnerForSession';
import type { DebtLetterType, DebtScenario } from '../../domain/debtLegal';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { hasEntitlement } from '../../data/billingRepo';
import {
  DEBT_LETTER_SPECS,
  SCENARIO_RECOMMENDATIONS,
  recommendScenarioFromDebt,
  getLetterBody,
} from '../../legal/debtLetterTemplates';
import { EvidencePickerModal } from '../../components/evidence/EvidencePickerModal';
import { upsertLetter } from '../../data/lettersRepo';
import { newId } from '../../utils/ids';
import { generateTextPdfToVault } from '../../letters/generateTextPdf';
import { getCanonicalPartnerIdentity } from '../../utils/canonicalPartnerIdentity';
import { getCustomFieldValues } from '../../data/customFieldValuesRepo';
import { FINELY_TENANT_ID } from '../../domain/tenants';

const SCENARIO_OPTIONS: { value: DebtScenario; label: string }[] = [
  { value: 'first_contact', label: 'First contact from collector' },
  { value: 'validation_period', label: 'Within 30-day validation window' },
  { value: 'post_validation', label: 'After validation request' },
  { value: 'time_barred', label: 'Debt may be time-barred (SOL)' },
  { value: 'summons_served', label: 'Summons / complaint served' },
  { value: 'post_35_days', label: 'Past answer deadline (e.g. 35 days)' },
  { value: 'unknown', label: 'Not sure — show all options' },
];

export default function PartnerDebtDetailPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const partner = useMemo(() => getOrCreatePartnerForSession({ user: auth.user }), [auth.user]);
  const [debt, setDebtState] = useState(() => (id ? getDebt(id) : null));
  const [evidenceVersion, setEvidenceVersion] = useState(0);

  const [scenarioOverride, setScenarioOverride] = useState<DebtScenario | null>(null);
  const [expandedLetter, setExpandedLetter] = useState<string | null>(null);
  const [expandedLegal, setExpandedLegal] = useState<string | null>(null);
  const [draft, setDraft] = useState<null | { specId: DebtLetterType; type: 'validation' | 'court'; text: string; evidenceId?: string }>(null);
  const [draftBusy, setDraftBusy] = useState(false);
  const [draftErr, setDraftErr] = useState<string | null>(null);
  const [draftEvidencePickerOpen, setDraftEvidencePickerOpen] = useState(false);
  const [lastSavedLetter, setLastSavedLetter] = useState<null | { id: string; title: string }>(null);

  const debtForPartner = debt && partner && debt.partnerId === partner.id;
  const recommendedScenario = debtForPartner
    ? (scenarioOverride ?? recommendScenarioFromDebt(debt))
    : 'unknown';
  const scenarioRec = useMemo(
    () => SCENARIO_RECOMMENDATIONS.find((r) => r.scenario === recommendedScenario),
    [recommendedScenario]
  );
  const letterSpecsByType = useMemo(() => new Map(DEBT_LETTER_SPECS.map((s) => [s.id, s])), []);

  const today = new Date().toISOString().slice(0, 10);
  const debtorName = partner?.profile.fullName || (auth.user?.user_metadata as { name?: string } | undefined)?.name || 'Your Full Legal Name';
  const tenantId = (partner?.tenantId || '').trim() || FINELY_TENANT_ID;
  const partnerCf = useMemo(() => (partner ? getCustomFieldValues('partners', partner.id, tenantId) : null), [partner?.id, tenantId]);
  const canonicalIdentity = useMemo(() => {
    if (!partner) return null;
    return getCanonicalPartnerIdentity({ partner, tenantId, partnerCf });
  }, [partner?.id, tenantId, partnerCf?.updatedAt]);
  const evidence = useMemo(() => (partner ? listEvidenceByPartner(partner.id) : []), [partner, evidenceVersion]);
  const hasTemplateAccess = useMemo(() => {
    if (!partner) return false;
    return hasEntitlement(partner.id, ENTITLEMENT_KEYS.templates);
  }, [partner]);

  const handleUpdateDebt = (updates: Partial<typeof debt>) => {
    if (!debt) return;
    const next = upsertDebt({ ...debt, ...updates });
    setDebtState(next);
  };

  if (!partner) {
    return (
      <PageShell badge="Partner Portal" title="Debt case" subtitle="">
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/60">
            No partner profile found. Use the main dashboard to access the portal.
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px]"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      </PageShell>
    );
  }

  if (!id || !debt || debt.partnerId !== partner.id) {
    return (
      <PageShell badge="Partner Portal" title="Debt case not found" subtitle="">
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/60">
            This debt or summons case does not exist or you don't have access to it.
          </div>
          <button
            onClick={() => navigate('/portal/debt')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px]"
          >
            <ArrowLeft size={14} /> Back to Debt Center
          </button>
        </div>
      </PageShell>
    );
  }

  const isSummons = debt.type === 'summons';

  return (
    <PageShell
      badge="Partner Portal"
      title={debt.name}
      subtitle={isSummons ? 'Summons / court matter' : 'Debt / collection account'}
    >
      <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.debt]}>
        {lastSavedLetter ? (
          <div className="mb-6 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-emerald-200 font-semibold truncate">Saved to Letters Vault</div>
              <div className="mt-1 text-emerald-100/80 text-sm truncate">{lastSavedLetter.title}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(`/portal/letters/vault?letterId=${encodeURIComponent(lastSavedLetter.id)}`)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
              >
                Open vault
              </button>
              <button
                type="button"
                onClick={() => setLastSavedLetter(null)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : null}
        {draft ? (
          <>
            <EvidencePickerModal
              open={draftEvidencePickerOpen}
              title="Attach an enclosure"
              subtitle="Select a file from your Evidence Vault (or upload a new one)."
              partnerId={partner.id}
              items={evidence}
              selectedEvidenceId={draft.evidenceId}
              pickLabel="Attach"
              onPick={(evidenceId) => {
                setDraft((prev) => (prev ? { ...prev, evidenceId } : prev));
                setDraftEvidencePickerOpen(false);
              }}
              onUpsert={(item) => {
                upsertEvidence(item);
                setEvidenceVersion((v) => v + 1);
              }}
              onDelete={(eId) => {
                deleteEvidence(eId);
                setEvidenceVersion((v) => v + 1);
              }}
              onClose={() => setDraftEvidencePickerOpen(false)}
              autoPickOnUpload={true}
            />

            {/* Mobile-only: keep as modal (desktop uses right panel). */}
            <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 lg:hidden">
              <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={() => {
                  if (draftBusy) return;
                  setDraftErr(null);
                  setDraft(null);
                }}
              />
              <div
                className="relative w-full max-w-6xl rounded-3xl border border-white/10 bg-[#0a0f0d] shadow-2xl overflow-hidden"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-white/10 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Letter draft</div>
                    <div className="mt-2 text-2xl font-light text-white truncate">
                      {draft.type === 'court' ? 'Court / affidavit letter' : 'Validation / DV letter'}
                    </div>
                    <div className="mt-1 text-white/60 text-sm">
                      Edit the draft, preview it on paper, then save to your Letters Vault.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (draftBusy) return;
                      setDraftErr(null);
                      setDraft(null);
                    }}
                    className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={draftBusy}
                  >
                    Close
                  </button>
                </div>

                <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
                  {draftErr ? (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200/90 text-sm">
                      {draftErr}
                    </div>
                  ) : null}

                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-white font-semibold">Editor</div>
                        <button
                          type="button"
                          onClick={() => setDraftEvidencePickerOpen(true)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                          title="Attach an enclosure/evidence file to this letter"
                        >
                          Attach evidence
                        </button>
                      </div>

                      {draft.evidenceId ? (
                        <div className="text-[11px] text-white/50">
                          Attached:{' '}
                          <span className="text-white/80 font-mono">
                            {evidence.find((x) => x.id === draft.evidenceId)?.filename ?? draft.evidenceId}
                          </span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-white/40">No enclosure attached (optional).</div>
                      )}

                      <textarea
                        value={draft.text}
                        onChange={(e) => setDraft((prev) => (prev ? { ...prev, text: e.target.value } : prev))}
                        rows={18}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors text-sm font-mono"
                        placeholder="Write your letter here…"
                      />
                      <div className="text-[11px] text-white/40">
                        Tip: keep your contact email off mailed letters; use only your name + mailing address.
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-white font-semibold">Paper preview</div>
                      <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-inner">
                        <pre className="text-black text-[12px] leading-5 whitespace-pre-wrap font-serif">{draft.text || ''}</pre>
                      </div>
                      <div className="text-[11px] text-white/40">
                        Preview is forced to black-on-white for readability (matches print/PDF output).
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      disabled={draftBusy}
                      onClick={async () => {
                        if (!draft.text.trim()) {
                          setDraftErr('Draft is empty.');
                          return;
                        }
                        setDraftBusy(true);
                        setDraftErr(null);
                        try {
                          const createdAt = new Date().toISOString();
                          const spec = letterSpecsByType.get(draft.specId);
                          const title = spec ? `${spec.title} • ${debt.name}` : `${draft.type} letter • ${debt.name}`;
                          const pdf = await generateTextPdfToVault({
                            text: draft.text,
                            filename: `FinelyCred_${draft.type}_${debt.name}_${today}.pdf`,
                            meta: { partnerId: partner.id, debtId: debt.id, type: draft.type },
                          });

                          const saved = upsertLetter({
                            id: newId('letter'),
                            partnerId: partner.id,
                            type: draft.type,
                            title,
                            createdAt,
                            body: draft.text,
                            status: 'generated',
                            pdfBlobRef: pdf.pdfBlobRef ?? undefined,
                            pdfFilename: pdf.filename,
                            relatedEvidenceIds: draft.evidenceId ? [draft.evidenceId] : [],
                            meta:
                              draft.type === 'court'
                                ? {
                                    context: 'debt',
                                    debtId: debt.id,
                                    letterSpecId: draft.specId,
                                    scenario: recommendedScenario,
                                    courtCaseNumber: debt.courtCaseNumber,
                                    jurisdictionState: debt.stateJurisdiction,
                                  }
                                : {
                                    context: 'debt',
                                    debtId: debt.id,
                                    letterSpecId: draft.specId,
                                    scenario: recommendedScenario,
                                  },
                          });
                          try {
                            window.dispatchEvent(new CustomEvent('finely:store'));
                          } catch {
                            // ignore
                          }
                          setLastSavedLetter({ id: saved.id, title: saved.title });

                          setDraft(null);
                        } catch (e: any) {
                          setDraftErr(e?.message || 'Failed to save letter.');
                        } finally {
                          setDraftBusy(false);
                        }
                      }}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      title="Save this letter (PDF) into Letters Vault"
                    >
                      {draftBusy ? 'Saving…' : 'Save to Letters Vault'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => navigate('/portal/debt')}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft size={16} /> Debt Center
            </button>
            <button
              onClick={() => navigate('/portal/dashboard')}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft size={16} /> Partner Dashboard
            </button>
          </div>

        {/* Case summary */}
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-6">
          <div className="flex items-center gap-3">
            {isSummons ? (
              <FileWarning size={24} className="text-amber-400" />
            ) : (
              <Scale size={24} className="text-amber-400" />
            )}
            <div>
              <div className="text-[10px] uppercase tracking-widest text-white/40">{debt.type}</div>
              <div className="text-white font-semibold">{debt.name}</div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Amount</div>
              <div className="mt-1 text-white font-mono">
                {(debt.amountCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Status</div>
              <div className="mt-1 text-white capitalize">{debt.status.replace('_', ' ')}</div>
            </div>
            {debt.dueDate && (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Due date</div>
                <div className="mt-1 text-white">{new Date(debt.dueDate).toLocaleDateString()}</div>
              </div>
            )}
            {debt.courtCaseNumber && (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Case number</div>
                <div className="mt-1 text-white font-mono text-sm">{debt.courtCaseNumber}</div>
              </div>
            )}
          </div>
        </div>

        {/* Legal strategy dates — drive scenario recommendation */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText size={18} className="text-amber-400" />
            Legal strategy dates
          </h2>
          <p className="text-white/60 text-sm">
            Enter dates so we can recommend which letter or affidavit to use (e.g. 30-day validation window, 35-day answer deadline, SOL).
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">First contact (collector)</label>
              <input
                type="date"
                value={debt.firstContactDate ?? ''}
                onChange={(e) => handleUpdateDebt({ firstContactDate: e.target.value || undefined })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">Last payment (SOL)</label>
              <input
                type="date"
                value={debt.lastPaymentDate ?? ''}
                onChange={(e) => handleUpdateDebt({ lastPaymentDate: e.target.value || undefined })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">Date served (summons)</label>
              <input
                type="date"
                value={debt.dateServed ?? ''}
                onChange={(e) => handleUpdateDebt({ dateServed: e.target.value || undefined })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">State / jurisdiction</label>
              <input
                type="text"
                value={debt.stateJurisdiction ?? ''}
                onChange={(e) => handleUpdateDebt({ stateJurisdiction: e.target.value || undefined })}
                placeholder="e.g. CA, NY"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">Override situation</label>
            <select
              value={scenarioOverride ?? ''}
              onChange={(e) => setScenarioOverride((e.target.value || null) as DebtScenario | null)}
              className="w-full max-w-xs bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
            >
              <option value="">Auto from dates above</option>
              {SCENARIO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Recommended situation + warning */}
        {scenarioRec && (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-3">
            <h2 className="text-lg font-semibold text-white">Your situation</h2>
            <p className="text-white/80">{scenarioRec.label}</p>
            <p className="text-white/60 text-sm">{scenarioRec.description}</p>
            {scenarioRec.legalWarning && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200/90 text-sm">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <span>{scenarioRec.legalWarning}</span>
              </div>
            )}
          </div>
        )}

        {/* Letter options — deep legal */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <BookOpen size={20} className="text-amber-400" />
            Letters & affidavits — legal basis
          </h2>
          <p className="text-white/60 text-sm max-w-2xl">
            Choose the letter or affidavit that fits your situation. Each is grounded in contract law, banking law, and consumer protection (FDCPA, FCRA, state SOL).
          </p>
          <div className="space-y-3">
            {(scenarioRec?.recommendedLetterTypes ?? DEBT_LETTER_SPECS.map((s) => s.id)).map((letterId) => {
              const spec = letterSpecsByType.get(letterId);
              if (!spec) return null;
              const isRec = scenarioRec?.recommendedLetterTypes?.includes(letterId);
              const isExpanded = expandedLetter === spec.id;
              return (
                <div
                  key={spec.id}
                  className={`rounded-2xl border overflow-hidden ${isRec ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/10 bg-black/30'}`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedLetter(isExpanded ? null : spec.id)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-amber-400">{isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-semibold">{spec.title}</span>
                          {isRec && (
                            <span className="text-[10px] uppercase tracking-widest text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">Recommended</span>
                          )}
                        </div>
                        <p className="text-white/50 text-sm mt-0.5">{spec.shortDescription}</p>
                      </div>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-0 space-y-4 border-t border-white/10 mt-0 pt-5">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">When to use</div>
                        <ul className="list-disc list-inside text-white/80 text-sm space-y-1">
                          {spec.whenToUse.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Legal basis</div>
                        <div className="space-y-2">
                          {spec.legalBasis.map((b) => (
                            <div key={b.cite} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                              <div className="font-mono text-amber-300/90 text-xs">{b.shortName}</div>
                              <div className="text-white/70 text-sm mt-1">{b.description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {spec.contractLawAngle && (
                        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                          <div className="text-[10px] uppercase tracking-widest text-white/40">Contract law</div>
                          <p className="text-white/80 text-sm mt-1">{spec.contractLawAngle}</p>
                        </div>
                      )}
                      {spec.bankingLawAngle && (
                        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                          <div className="text-[10px] uppercase tracking-widest text-white/40">Banking / UCC</div>
                          <p className="text-white/80 text-sm mt-1">{spec.bankingLawAngle}</p>
                        </div>
                      )}
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                        <div className="text-[10px] uppercase tracking-widest text-amber-400/80">Key principle</div>
                        <p className="text-amber-100/90 text-sm mt-1">{spec.keyPrinciple}</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-[10px] uppercase tracking-widest text-white/40">Draft (personalize and send)</div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                              onClick={() => {
                                const isCourt = spec.id.includes('summons') || spec.id.includes('answer') || spec.id.includes('affidavit') || isSummons;
                                const baseText = hasTemplateAccess
                                  ? getLetterBody(spec.id, {
                                      creditorName: debt.name,
                                      debtorName,
                                      date: today,
                                      debtorAddress1: canonicalIdentity?.address1 ?? canonicalIdentity?.addressLine1,
                                      debtorAddress2: canonicalIdentity?.address2,
                                      debtorCity: canonicalIdentity?.city,
                                      debtorState: canonicalIdentity?.state,
                                      debtorPostalCode: canonicalIdentity?.postalCode,
                                      debtorPhone: canonicalIdentity?.phone,
                                      debtorEmail: partner.profile.email,
                                      recipientName: debt.name,
                                      caseNumber: debt.courtCaseNumber,
                                      stateNote: debt.stateJurisdiction ? ` In ${debt.stateJurisdiction}, the applicable SOL may apply.` : undefined,
                                    })
                                  : `DATE: ${today}\n\nTO WHOM IT MAY CONCERN,\n\nI am writing regarding ${debt.name}.\n\n[Write your request here.]\n\nSincerely,\n${debtorName}\n`;
                                setDraft({ specId: spec.id, type: isCourt ? 'court' : 'validation', text: baseText });
                              }}
                              title="Build an editable draft and save it to your Letters Vault"
                            >
                              Build draft
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                              onClick={() => navigate('/portal/letters/vault')}
                              title="Open your Letters Vault"
                            >
                              Letters Vault
                            </button>
                          </div>
                        </div>

                        <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.templates]}>
                          <pre className="text-white/80 text-xs whitespace-pre-wrap font-sans overflow-x-auto">
                            {getLetterBody(spec.id, {
                              creditorName: debt.name,
                              debtorName,
                              date: today,
                              debtorAddress1: canonicalIdentity?.address1 ?? canonicalIdentity?.addressLine1,
                              debtorAddress2: canonicalIdentity?.address2,
                              debtorCity: canonicalIdentity?.city,
                              debtorState: canonicalIdentity?.state,
                              debtorPostalCode: canonicalIdentity?.postalCode,
                              debtorPhone: canonicalIdentity?.phone,
                              debtorEmail: partner.profile.email,
                              recipientName: debt.name,
                              caseNumber: debt.courtCaseNumber,
                              stateNote: debt.stateJurisdiction ? ` In ${debt.stateJurisdiction}, the applicable SOL may apply.` : undefined,
                            })}
                          </pre>
                        </EntitlementGate>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Deep legal reference */}
        <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
          <h2 className="text-lg font-semibold text-white p-5 border-b border-white/10">Legal framework — contract, banking, procedure</h2>
          {[
            {
              id: 'contract',
              title: 'Contract law',
              body: 'A valid contract requires offer, acceptance, and consideration. The party claiming a right to collect must prove the existence of an enforceable agreement and, where the debt was assigned, a valid chain of title. Absent a signed contract or competent evidence of the obligation, the consumer can dispute the debt and put the collector to its proof. Defenses include lack of consideration, statute of frauds (where applicable), and failure to prove assignment.',
            },
            {
              id: 'banking',
              title: 'Banking law & UCC',
              body: 'Under the UCC and banking principles, the burden of proving signature and holder-in-due-course status often rests on the party seeking to enforce an instrument. For assigned debt, the collector must prove the assignment and the underlying obligation. Best evidence and burden-of-proof rules support demanding validation and disputing unverified claims.',
            },
            {
              id: 'procedure',
              title: 'Civil procedure & SOL',
              body: 'Statute of limitations varies by state and claim type (e.g. written contract, open account). Once the SOL has run, the right to sue may be extinguished. Asserting SOL is an affirmative defense; it must be raised in the answer. Answer deadlines (e.g. 20–35 days from service) are often jurisdictional—missing them can lead to default. If the deadline passed, a motion to set aside default with an affidavit and meritorious defenses may be available.',
            },
            {
              id: 'evidence',
              title: 'Evidence & burden of proof',
              body: 'The plaintiff bears the burden of proving each element of its claim. Account statements or screenshots alone may be insufficient to prove the existence of a valid contract or chain of assignment. Validation requests and affidavits of dispute put the collector to its proof and create a record of your position.',
            },
          ].map((block) => {
            const open = expandedLegal === block.id;
            return (
              <div key={block.id} className="border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setExpandedLegal(open ? null : block.id)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-white font-medium">{block.title}</span>
                  <span className="text-amber-400">{open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
                </button>
                {open && (
                  <div className="px-5 pb-5 pt-0 text-white/70 text-sm leading-relaxed">
                    {block.body}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-white/40 text-xs max-w-2xl">
          This tool provides legal information and letter templates for educational and strategic use. It is not legal advice. Laws vary by jurisdiction. Consult a licensed attorney for advice specific to your situation.
        </p>
          </div>

          {/* Desktop: focused draft panel */}
          <div className="hidden lg:block lg:col-span-5">
            <div className="sticky top-24">
              {draft ? (
                <div className="rounded-3xl border border-white/10 bg-[#0a0f0d] shadow-2xl overflow-hidden">
                  <div className="p-5 border-b border-white/10 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-widest text-white/40">Focused draft panel</div>
                      <div className="mt-2 text-white font-semibold truncate">
                        {draft.type === 'court' ? 'Court / affidavit draft' : 'Validation / DV draft'}
                      </div>
                      <div className="mt-1 text-white/60 text-sm">Edit → preview → save to Letters Vault (then mail from vault).</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (draftBusy) return;
                        setDraftErr(null);
                        setDraft(null);
                      }}
                      className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={draftBusy}
                    >
                      Close
                    </button>
                  </div>
                  <div className="p-5 space-y-4">
                    {draftErr ? (
                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200/90 text-sm">{draftErr}</div>
                    ) : null}

                    <div className="flex items-center justify-between gap-3">
                      <div className="text-white font-semibold">Editor</div>
                      <button
                        type="button"
                        onClick={() => setDraftEvidencePickerOpen(true)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                        title="Attach an enclosure/evidence file to this letter"
                      >
                        Attach evidence
                      </button>
                    </div>

                    {draft.evidenceId ? (
                      <div className="text-[11px] text-white/50">
                        Attached:{' '}
                        <span className="text-white/80 font-mono">{evidence.find((x) => x.id === draft.evidenceId)?.filename ?? draft.evidenceId}</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-white/40">No enclosure attached (optional).</div>
                    )}

                    <textarea
                      value={draft.text}
                      onChange={(e) => setDraft((prev) => (prev ? { ...prev, text: e.target.value } : prev))}
                      rows={14}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors text-sm font-mono"
                      placeholder="Write your letter here…"
                    />

                    <details className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <summary className="cursor-pointer select-none text-[10px] font-black uppercase tracking-widest text-white/60">
                        Preview (print view)
                      </summary>
                      <div className="mt-3 rounded-2xl border border-white/10 bg-white p-5 shadow-inner">
                        <pre className="text-black text-[12px] leading-5 whitespace-pre-wrap font-serif">{draft.text || ''}</pre>
                      </div>
                    </details>

                    <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                      <button
                        type="button"
                        disabled={draftBusy}
                        onClick={async () => {
                          if (!draft.text.trim()) {
                            setDraftErr('Draft is empty.');
                            return;
                          }
                          setDraftBusy(true);
                          setDraftErr(null);
                          try {
                            const createdAt = new Date().toISOString();
                            const spec = letterSpecsByType.get(draft.specId);
                            const title = spec ? `${spec.title} • ${debt.name}` : `${draft.type} letter • ${debt.name}`;
                            const pdf = await generateTextPdfToVault({
                              text: draft.text,
                              filename: `FinelyCred_${draft.type}_${debt.name}_${today}.pdf`,
                              meta: { partnerId: partner.id, debtId: debt.id, type: draft.type },
                            });

                            const saved = upsertLetter({
                              id: newId('letter'),
                              partnerId: partner.id,
                              type: draft.type,
                              title,
                              createdAt,
                              body: draft.text,
                              status: 'generated',
                              pdfBlobRef: pdf.pdfBlobRef ?? undefined,
                              pdfFilename: pdf.filename,
                              relatedEvidenceIds: draft.evidenceId ? [draft.evidenceId] : [],
                              meta:
                                draft.type === 'court'
                                  ? {
                                      context: 'debt',
                                      debtId: debt.id,
                                      letterSpecId: draft.specId,
                                      scenario: recommendedScenario,
                                      courtCaseNumber: debt.courtCaseNumber,
                                      jurisdictionState: debt.stateJurisdiction,
                                    }
                                  : {
                                      context: 'debt',
                                      debtId: debt.id,
                                      letterSpecId: draft.specId,
                                      scenario: recommendedScenario,
                                    },
                            });
                            try {
                              window.dispatchEvent(new CustomEvent('finely:store'));
                            } catch {
                              // ignore
                            }
                            setLastSavedLetter({ id: saved.id, title: saved.title });
                            setDraft(null);
                          } catch (e: any) {
                            setDraftErr(e?.message || 'Failed to save letter.');
                          } finally {
                            setDraftBusy(false);
                          }
                        }}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        title="Save this letter (PDF) into Letters Vault"
                      >
                        {draftBusy ? 'Saving…' : 'Save to Letters Vault'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/70 text-sm space-y-3">
                  <div className="text-white font-semibold">Focused drafting</div>
                  <div>
                    Click <span className="text-white/85 font-semibold">Build draft</span> on any letter to open the editor here (desktop) or as a
                    modal (mobile).
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/portal/letters/vault')}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                  >
                    Open Letters Vault
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </EntitlementGate>
    </PageShell>
  );
}
