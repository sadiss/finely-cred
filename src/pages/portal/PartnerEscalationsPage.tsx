import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MessageSquare, Send, AlertCircle, Clock, CheckCircle, Scale, Paperclip, ExternalLink } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { listEscalationsByPartner, createEscalation } from '../../data/escalationsRepo';
import type { EscalationTopic, EscalationPriority } from '../../domain/escalations';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { listRegulatoryComplaintsByPartner, createRegulatoryComplaint, markRegulatoryComplaintSubmitted } from '../../data/regulatoryComplaintsRepo';
import type { RegulatoryBody, RegulatoryTargetType } from '../../domain/regulatoryComplaints';
import { listCasesByPartner, getCase } from '../../data/casesRepo';
import type { DisputeRoundLabel } from '../../domain/disputeWorkflow';
import { listEvidenceByPartner } from '../../data/evidenceRepo';
import { getBlobUrl } from '../../storage/getBlobUrl';
import { openUrlInNewTab } from '../../utils/download';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyOsEmptyState } from '../../features/os/FinelyOsEmptyState';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsInlineListItem,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

const TOPICS: { value: EscalationTopic; label: string }[] = [
  { value: 'billing', label: 'Billing' },
  { value: 'service', label: 'Service quality' },
  { value: 'dispute_process', label: 'Dispute process' },
  { value: 'documents_access', label: 'Documents & access' },
  { value: 'legal_letters', label: 'Legal letters / debt' },
  { value: 'other', label: 'Other' },
];

const PRIORITIES: { value: EscalationPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

function statusIcon(status: string) {
  switch (status) {
    case 'resolved':
    case 'closed':
      return <CheckCircle size={14} className="text-emerald-600" />;
    case 'in_review':
    case 'pending_partner':
      return <Clock size={14} className="text-violet-300" />;
    default:
      return <AlertCircle size={14} className="text-violet-300" />;
  }
}

export default function PartnerEscalationsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { partner } = usePartnerSession();
  type EscTab = 'submit' | 'track' | 'regulatory';
  const [tab, setTab] = useState<EscTab>('submit');
  const escalations = useMemo(() => (partner ? listEscalationsByPartner(partner.id) : []), [partner]);
  const complaints = useMemo(() => (partner ? listRegulatoryComplaintsByPartner(partner.id) : []), [partner]);
  const cases = useMemo(() => (partner ? listCasesByPartner(partner.id) : []), [partner]);
  const evidence = useMemo(() => (partner ? listEvidenceByPartner(partner.id) : []), [partner]);

  const [formTopic, setFormTopic] = useState<EscalationTopic>('billing');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<EscalationPriority>('medium');
  const [submitted, setSubmitted] = useState(false);

  const [complaintBody, setComplaintBody] = useState<RegulatoryBody>('CFPB');
  const [complaintTargetType, setComplaintTargetType] = useState<RegulatoryTargetType>('bureau');
  const [complaintTargetName, setComplaintTargetName] = useState('');
  const [complaintCaseId, setComplaintCaseId] = useState<string>('');
  const [complaintNarrative, setComplaintNarrative] = useState('');
  const [complaintEvidenceIds, setComplaintEvidenceIds] = useState<string[]>([]);
  const [complaintRefNo, setComplaintRefNo] = useState('');
  const [complaintJustSubmittedId, setComplaintJustSubmittedId] = useState<string | null>(null);

  const linkedCaseId = searchParams.get('caseId') || '';
  const linkedRound = (searchParams.get('round') || '') as DisputeRoundLabel | '';
  const linkedCase = useMemo(() => (linkedCaseId ? getCase(linkedCaseId) : null), [linkedCaseId]);

  useEffect(() => {
    if (linkedCaseId) {
      setComplaintCaseId(linkedCaseId);
      setFormTopic('dispute_process');
    }
    if (linkedRound === 'Round 1' || linkedRound === 'Round 2' || linkedRound === 'Round 3') {
      setComplaintDisputeRound(linkedRound);
      setFormDisputeRound(linkedRound);
    }
  }, [linkedCaseId, linkedRound]);

  const [formCaseId, setFormCaseId] = useState('');
  const [formDisputeRound, setFormDisputeRound] = useState<DisputeRoundLabel | ''>('');
  const [complaintDisputeRound, setComplaintDisputeRound] = useState<DisputeRoundLabel | ''>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner || !formTitle.trim() || !formDescription.trim()) return;
    createEscalation({
      partnerId: partner.id,
      topic: formTopic,
      title: formTitle.trim(),
      description: formDescription.trim(),
      priority: formPriority,
      caseId: formCaseId || linkedCaseId || undefined,
      disputeRound: formDisputeRound || undefined,
    });
    setFormTitle('');
    setFormDescription('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const openCount = escalations.filter((e) => e.status === 'open' || e.status === 'in_review').length;
  const openComplaints = complaints.filter((c) => c.status === 'draft' || c.status === 'submitted' || c.status === 'in_review').length;

  const formLabel = `block ${FINELY_OS_ENTITY_LABEL} mb-1`;

  return (
    <PageShell
      badge="Partner Portal"
      title="Complaints & Escalations"
      subtitle="Submit a formal escalation. Our team will review and respond; you can track status here."
    >
      {!partner ? (
        <div className={FINELY_OS_PAGE}>
          <div className={`${FINELY_OS_LUXURY_EMPTY} text-left`}>
            No partner profile found. If you're an admin, use Partner Management to pick a partner.
          </div>
          <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_PRIMARY_BTN}>
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      ) : (
        <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.escalations]}>
          <div className={FINELY_OS_PAGE}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button type="button" onClick={() => navigate('/portal/dashboard')} className={FINELY_OS_BACK_LINK}>
                <ArrowLeft size={16} /> Partner Dashboard
              </button>
              <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_BACK_LINK}>
                <ArrowLeft size={16} /> Finely Cred
              </button>
            </div>

            <FinelyUnifiedHubLayout
              eyebrow="Complaints & escalations"
              title="Formal tracking with audit trail"
              subtitle="Submit service escalations, track responses, and draft regulatory complaints with evidence attached."
              accent="fuchsia"
              kpis={[
                { label: 'Open', value: String(openCount), hint: 'Escalations', accent: 'fuchsia' },
                { label: 'Regulatory', value: String(openComplaints), hint: 'Active drafts', accent: 'violet' },
                { label: 'Cases', value: String(cases.length), hint: 'Linkable', accent: 'amber' },
                { label: 'Evidence', value: String(evidence.length), hint: 'Vault items', accent: 'emerald' },
              ]}
              tabs={[
                { id: 'submit', label: 'Submit' },
                { id: 'track', label: 'My escalations', badge: openCount || undefined },
                { id: 'regulatory', label: 'Regulatory', badge: openComplaints || undefined },
              ]}
              activeTab={tab}
              onTabChange={(id) => setTab(id as EscTab)}
              primaryAction={{ label: 'Communication hub', onClick: () => navigate('/portal/messages') }}
              secondaryAction={{ label: 'Dispute center', onClick: () => navigate('/portal/disputes') }}
            >
            {tab === 'submit' && (
            <div className={`${finelyOsCatalogCard('violet')} !p-5 border-fuchsia-500/25 space-y-4`}>
              <h2 className={`${FINELY_OS_ENTITY_TITLE} flex items-center gap-2 text-lg`}>
                <Send size={18} className="text-fuchsia-300" />
                Submit an escalation
              </h2>
              <p className={FINELY_OS_ENTITY_BODY}>
                Use this for billing issues, service complaints, or any request that needs formal tracking and a response.
              </p>
              {linkedCase ? (
                <div className={FINELY_OS_NOTICE_WARN}>
                  Linked to case: <span className="font-semibold">{linkedCase.title}</span>
                  {linkedRound ? ` • ${linkedRound}` : ''}
                </div>
              ) : null}
              <form id="escalation-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={formLabel}>Topic</label>
                    <select value={formTopic} onChange={(e) => setFormTopic(e.target.value as EscalationTopic)} className={FINELY_OS_ENTITY_SELECT}>
                      {TOPICS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={formLabel}>Priority</label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value as EscalationPriority)}
                      className={FINELY_OS_ENTITY_SELECT}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={formLabel}>Link to case (optional)</label>
                    <select value={formCaseId || linkedCaseId} onChange={(e) => setFormCaseId(e.target.value)} className={FINELY_OS_ENTITY_SELECT}>
                      <option value="">No case linked</option>
                      {cases.slice(0, 12).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title || c.id} ({c.status})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={formLabel}>Dispute round</label>
                    <select
                      value={formDisputeRound || linkedRound}
                      onChange={(e) => setFormDisputeRound(e.target.value as DisputeRoundLabel | '')}
                      className={FINELY_OS_ENTITY_SELECT}
                    >
                      <option value="">Not round-specific</option>
                      <option value="Round 1">Round 1</option>
                      <option value="Round 2">Round 2</option>
                      <option value="Round 3">Round 3</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={formLabel}>Title</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Short summary"
                    className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}
                    required
                  />
                </div>
                <div>
                  <label className={formLabel}>Description</label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Describe the issue and what resolution you need..."
                    rows={4}
                    className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} resize-y min-h-[6rem]`}
                    required
                  />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <button type="submit" className={FINELY_OS_SUCCESS_BTN}>
                    <Send size={14} /> Submit escalation
                  </button>
                  {submitted ? <span className="text-emerald-300 text-sm">Escalation submitted. We'll respond and update status here.</span> : null}
                </div>
              </form>
            </div>
            )}

            {tab === 'track' && (
            <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
              <h2 className={`${FINELY_OS_ENTITY_TITLE} flex items-center gap-2 text-lg flex-wrap`}>
                <MessageSquare size={18} className="text-violet-300" />
                My escalations
                {openCount > 0 ? <span className={finelyOsStatusChip('warn')}>{openCount} open</span> : null}
              </h2>
              {escalations.length === 0 ? (
                <FinelyOsEmptyState
                  icon={MessageSquare}
                  title="No escalations yet"
                  description="Submit the form above when you need formal tracking on billing, service, or dispute-process issues."
                  primaryAction={{ label: 'Scroll to form', onClick: () => document.getElementById('escalation-form')?.scrollIntoView({ behavior: 'smooth' }) }}
                />
              ) : (
                <FinelyOsPaginatedStack
                  items={escalations}
                  pageSize={8}
                  itemSpacingClassName="space-y-4"
                  renderItem={(e) => (
                    <div key={e.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {statusIcon(e.status)}
                          <span className={FINELY_OS_ENTITY_VALUE}>{e.title}</span>
                          <span className={FINELY_OS_ENTITY_SUBLABEL}>{TOPICS.find((t) => t.value === e.topic)?.label ?? e.topic}</span>
                          <span
                            className={`text-[10px] uppercase tracking-widest ${
                              e.priority === 'urgent' ? 'text-rose-300' : e.priority === 'high' ? 'text-fuchsia-300' : 'text-white/45'
                            }`}
                          >
                            {e.priority}
                          </span>
                        </div>
                        <span className={`${FINELY_OS_ENTITY_SUBLABEL} capitalize`}>{e.status.replace('_', ' ')}</span>
                      </div>
                      <p className={FINELY_OS_ENTITY_BODY}>{e.description}</p>
                      {(e.status === 'resolved' || e.status === 'closed') && e.resolutionNote ? (
                        <div className={FINELY_OS_NOTICE_SUCCESS}>
                          <div className="text-[10px] uppercase tracking-widest text-emerald-200 mb-1 font-bold">Resolution</div>
                          <p>{e.resolutionNote}</p>
                        </div>
                      ) : null}
                      <p className={`${FINELY_OS_ENTITY_SUBLABEL} text-xs`}>{new Date(e.createdAt).toLocaleString()}</p>
                    </div>
                  )}
                />
              )}
            </div>
            )}

            {tab === 'regulatory' && (
            <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className={`${FINELY_OS_ENTITY_TITLE} flex items-center gap-2 text-lg flex-wrap`}>
                    <Scale size={18} className="text-fuchsia-300" />
                    Regulatory complaints (CFPB / AG / FTC / BBB)
                    {openComplaints > 0 ? <span className={finelyOsStatusChip('warn')}>{openComplaints} active</span> : null}
                  </h2>
                  <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
                    Draft → submit → track. Attach your evidence vault items so you have a clean, auditable record of what was sent.
                  </p>
                </div>
                <button type="button" onClick={() => navigate('/portal/disputes')} className={FINELY_OS_SECONDARY_BTN} title="Open dispute center">
                  Open disputes <ExternalLink size={14} />
                </button>
              </div>

              <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony border-fuchsia-500/25 space-y-4`}>
                <div className={FINELY_OS_ENTITY_LABEL}>Create a complaint draft</div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={formLabel}>Body</label>
                    <select value={complaintBody} onChange={(e) => setComplaintBody(e.target.value as RegulatoryBody)} className={FINELY_OS_ENTITY_SELECT}>
                      <option value="CFPB">CFPB</option>
                      <option value="AG">Attorney General</option>
                      <option value="FTC">FTC</option>
                      <option value="BBB">BBB</option>
                    </select>
                  </div>
                  <div>
                    <label className={formLabel}>Target type</label>
                    <select
                      value={complaintTargetType}
                      onChange={(e) => setComplaintTargetType(e.target.value as RegulatoryTargetType)}
                      className={FINELY_OS_ENTITY_SELECT}
                    >
                      <option value="bureau">Credit bureau</option>
                      <option value="furnisher">Furnisher / creditor</option>
                      <option value="collector">Collector</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={formLabel}>Target name</label>
                    <input
                      value={complaintTargetName}
                      onChange={(e) => setComplaintTargetName(e.target.value)}
                      placeholder="Example: Experian / Equifax / TransUnion / Midland Credit"
                      className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}
                    />
                  </div>
                  <div>
                    <label className={formLabel}>Link to a case (optional)</label>
                    <select value={complaintCaseId || linkedCaseId} onChange={(e) => setComplaintCaseId(e.target.value)} className={FINELY_OS_ENTITY_SELECT}>
                      <option value="">No case linked</option>
                      {cases.slice(0, 12).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title || c.id} ({c.status})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={formLabel}>Dispute round</label>
                    <select
                      value={complaintDisputeRound || linkedRound}
                      onChange={(e) => setComplaintDisputeRound(e.target.value as DisputeRoundLabel | '')}
                      className={FINELY_OS_ENTITY_SELECT}
                    >
                      <option value="">Not round-specific</option>
                      <option value="Round 1">Round 1</option>
                      <option value="Round 2">Round 2</option>
                      <option value="Round 3">Round 3</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={formLabel}>Narrative</label>
                  <textarea
                    value={complaintNarrative}
                    onChange={(e) => setComplaintNarrative(e.target.value)}
                    rows={5}
                    placeholder="What happened, what you tried (letters/disputes), what you want corrected, and what evidence you attached."
                    className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} resize-y min-h-[8rem]`}
                  />
                  <div className={`mt-2 text-[11px] ${FINELY_OS_ENTITY_SUBLABEL}`}>
                    Educational only — not legal advice. Keep it factual, chronological, and reference your exhibits.
                  </div>
                </div>

                <details className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                  <summary className="cursor-pointer select-none flex items-center justify-between gap-3">
                    <div className={`${FINELY_OS_ENTITY_LABEL} flex items-center gap-2`}>
                      <Paperclip size={14} className="text-fuchsia-300" /> Attach evidence ({complaintEvidenceIds.length})
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-fuchsia-300">Expand</div>
                  </summary>
                  <div className="mt-3">
                    <FinelyOsPaginatedStack
                      items={evidence}
                      pageSize={8}
                      itemSpacingClassName="grid md:grid-cols-2 gap-2"
                      emptyMessage="No evidence uploaded yet."
                      renderItem={(ev) => (
                        <label key={ev.id} className={`flex items-start gap-2 ${finelyOsInlineListItem()} !p-3 cursor-pointer`}>
                          <input
                            type="checkbox"
                            checked={complaintEvidenceIds.includes(ev.id)}
                            onChange={() =>
                              setComplaintEvidenceIds((prev) => (prev.includes(ev.id) ? prev.filter((x) => x !== ev.id) : [...prev, ev.id]))
                            }
                            className="mt-1 accent-violet-500"
                          />
                          <div className="min-w-0">
                            <div className={`${FINELY_OS_ENTITY_VALUE} text-sm truncate`}>{ev.filename || ev.caption || ev.id}</div>
                            <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} truncate`}>
                              {ev.mimeType} • {new Date(ev.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </label>
                      )}
                    />
                  </div>
                </details>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!partner) return;
                      if (!complaintTargetName.trim() || !complaintNarrative.trim()) return;
                      createRegulatoryComplaint({
                        partnerId: partner.id,
                        body: complaintBody,
                        targetType: complaintTargetType,
                        targetName: complaintTargetName.trim(),
                        narrative: complaintNarrative.trim(),
                        evidenceIds: complaintEvidenceIds,
                        caseId: complaintCaseId || linkedCaseId || undefined,
                        disputeRound: complaintDisputeRound || (linkedRound as DisputeRoundLabel) || undefined,
                      });
                      setComplaintTargetName('');
                      setComplaintNarrative('');
                      setComplaintEvidenceIds([]);
                      setComplaintCaseId('');
                      setComplaintRefNo('');
                      setComplaintJustSubmittedId(null);
                    }}
                    className={FINELY_OS_SUCCESS_BTN}
                  >
                    <Send size={14} /> Save draft
                  </button>
                  <button type="button" onClick={() => navigate('/portal/documents')} className={FINELY_OS_SECONDARY_BTN}>
                    Open documents <ExternalLink size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className={FINELY_OS_ENTITY_LABEL}>My complaint drafts & tracking</div>
                {complaints.length === 0 ? (
                  <div className={FINELY_OS_ENTITY_BODY}>No regulatory complaints yet.</div>
                ) : (
                  <FinelyOsPaginatedStack
                    items={complaints}
                    pageSize={8}
                    itemSpacingClassName="grid lg:grid-cols-2 gap-3"
                    renderItem={(c) => (
                      <div key={c.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>
                              {c.body} • {c.targetName}
                            </div>
                            <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                              {c.status} • {c.targetType}
                              {c.caseId ? ` • case:${c.caseId}` : ''}
                            </div>
                          </div>
                          <div className={FINELY_OS_ENTITY_SUBLABEL}>{new Date(c.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className={`${FINELY_OS_ENTITY_BODY} line-clamp-4 whitespace-pre-wrap`}>{c.narrative}</div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={FINELY_OS_ENTITY_CHIP}>
                            <Paperclip size={12} className="inline mr-1" /> {c.evidenceIds.length} exhibit{c.evidenceIds.length === 1 ? '' : 's'}
                          </span>
                          {c.status === 'draft' ? (
                            <>
                              <input
                                value={complaintJustSubmittedId === c.id ? complaintRefNo : ''}
                                onChange={(e) => {
                                  setComplaintJustSubmittedId(c.id);
                                  setComplaintRefNo(e.target.value);
                                }}
                                placeholder="Reference # (after submission)"
                                className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} !py-2 text-sm font-mono max-w-[220px]`}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  markRegulatoryComplaintSubmitted({
                                    id: c.id,
                                    referenceNumber: complaintJustSubmittedId === c.id ? complaintRefNo.trim() : undefined,
                                    submissionMethod: 'online',
                                  });
                                  setComplaintRefNo('');
                                  setComplaintJustSubmittedId(null);
                                }}
                                className={FINELY_OS_SECONDARY_BTN}
                                title="Mark as submitted after you file it online/mail/phone"
                              >
                                Mark submitted
                              </button>
                            </>
                          ) : null}
                          {c.referenceNumber ? (
                            <span className={FINELY_OS_ENTITY_SUBLABEL}>
                              ref: <span className={FINELY_OS_ENTITY_VALUE}>{c.referenceNumber}</span>
                            </span>
                          ) : null}
                        </div>

                        {c.evidenceIds.length ? (
                          <details className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                            <summary className={`cursor-pointer select-none ${FINELY_OS_ENTITY_LABEL}`}>Exhibits (open)</summary>
                            <div className="mt-3 space-y-2">
                              {c.evidenceIds.slice(0, 8).map((id) => {
                                const ev = evidence.find((x) => x.id === id) ?? null;
                                if (!ev?.blobRef) return <div key={id} className={`${FINELY_OS_ENTITY_BODY} font-mono`}>{id}</div>;
                                return (
                                  <button
                                    key={id}
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        const res = await getBlobUrl(ev.blobRef!, { mimeType: ev.mimeType, preferSigned: true });
                                        if (!res?.url) return;
                                        openUrlInNewTab({ url: res.url, revoke: res.revoke, revokeAfterMs: 60_000 });
                                      } catch {
                                        // ignore
                                      }
                                    }}
                                    className={`w-full text-left ${finelyOsInlineListItem()} !p-3`}
                                    title="Open exhibit"
                                  >
                                    <div className={`${FINELY_OS_ENTITY_VALUE} text-sm truncate`}>{ev.filename || ev.caption || ev.id}</div>
                                    <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} truncate`}>{ev.mimeType}</div>
                                  </button>
                                );
                              })}
                            </div>
                          </details>
                        ) : null}
                      </div>
                    )}
                  />
                )}
                <div className={`text-[11px] ${FINELY_OS_ENTITY_SUBLABEL}`}>
                  Tip: After submission, add your reference number here and attach any confirmation PDFs to Documents.
                </div>
              </div>
            </div>
            )}
            </FinelyUnifiedHubLayout>

            <FinelyOsPageFooter />
          </div>
        </EntitlementGate>
      )}
    </PageShell>
  );
}
