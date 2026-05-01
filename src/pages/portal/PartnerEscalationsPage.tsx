import React, { useMemo, useState } from 'react';
import { ArrowLeft, MessageSquare, Send, AlertCircle, Clock, CheckCircle, Scale, Paperclip, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { getOrCreatePartnerForSession } from '../../portal/getOrCreatePartnerForSession';
import { listEscalationsByPartner, createEscalation } from '../../data/escalationsRepo';
import type { EscalationTopic, EscalationPriority } from '../../domain/escalations';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { listRegulatoryComplaintsByPartner, createRegulatoryComplaint, markRegulatoryComplaintSubmitted } from '../../data/regulatoryComplaintsRepo';
import type { RegulatoryBody, RegulatoryTargetType } from '../../domain/regulatoryComplaints';
import { listCasesByPartner } from '../../data/casesRepo';
import { listEvidenceByPartner } from '../../data/evidenceRepo';
import { getBlobUrl } from '../../storage/getBlobUrl';
import { openUrlInNewTab } from '../../utils/download';

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
      return <CheckCircle size={14} className="text-emerald-400" />;
    case 'in_review':
    case 'pending_partner':
      return <Clock size={14} className="text-amber-400" />;
    default:
      return <AlertCircle size={14} className="text-amber-400" />;
  }
}

export default function PartnerEscalationsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const partner = useMemo(() => getOrCreatePartnerForSession({ user: auth.user }), [auth.user]);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner || !formTitle.trim() || !formDescription.trim()) return;
    createEscalation({
      partnerId: partner.id,
      topic: formTopic,
      title: formTitle.trim(),
      description: formDescription.trim(),
      priority: formPriority,
    });
    setFormTitle('');
    setFormDescription('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const openCount = escalations.filter((e) => e.status === 'open' || e.status === 'in_review').length;
  const openComplaints = complaints.filter((c) => c.status === 'draft' || c.status === 'submitted' || c.status === 'in_review').length;

  return (
    <PageShell
      badge="Partner Portal"
      title="Complaints & Escalations"
      subtitle="Submit a formal escalation. Our team will review and respond; you can track status here."
    >
      {!partner ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 text-white/60">
            No partner profile found. If you're an admin, use Partner Management to pick a partner.
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      ) : (
        <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.escalations]}>
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={() => navigate('/portal/dashboard')}
                className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
              >
                <ArrowLeft size={16} /> Partner Dashboard
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
              >
                <ArrowLeft size={16} /> Finely Cred
              </button>
            </div>

          {/* Submit escalation form */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Send size={18} className="text-amber-400" />
              Submit an escalation
            </h2>
            <p className="text-white/60 text-sm">
              Use this for billing issues, service complaints, or any request that needs formal tracking and a response.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Topic</label>
                  <select
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value as EscalationTopic)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                  >
                    {TOPICS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as EscalationPriority)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Short summary"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe the issue and what resolution you need..."
                  rows={4}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 resize-y"
                  required
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 text-black font-bold text-sm hover:brightness-110 transition-all"
                >
                  <Send size={14} /> Submit escalation
                </button>
                {submitted && <span className="text-amber-400 text-sm">Escalation submitted. We'll respond and update status here.</span>}
              </div>
            </form>
          </div>

          {/* My escalations */}
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <MessageSquare size={18} className="text-amber-400" />
              My escalations
              {openCount > 0 && (
                <span className="text-[10px] uppercase tracking-widest text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
                  {openCount} open
                </span>
              )}
            </h2>
            {escalations.length === 0 ? (
              <p className="text-white/50 text-sm">No escalations yet. Submit one above when you need formal tracking.</p>
            ) : (
              <ul className="space-y-4">
                {escalations.map((e) => (
                  <li key={e.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {statusIcon(e.status)}
                        <span className="text-white font-medium">{e.title}</span>
                        <span className="text-[10px] uppercase tracking-widest text-white/40">
                          {TOPICS.find((t) => t.value === e.topic)?.label ?? e.topic}
                        </span>
                        <span className={`text-[10px] uppercase tracking-widest ${
                          e.priority === 'urgent' ? 'text-red-400' : e.priority === 'high' ? 'text-amber-400' : 'text-white/40'
                        }`}>
                          {e.priority}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase tracking-widest text-white/40 capitalize">
                        {e.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-white/60 text-sm">{e.description}</p>
                    {(e.status === 'resolved' || e.status === 'closed') && e.resolutionNote && (
                      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                        <div className="text-[10px] uppercase tracking-widest text-emerald-400/80 mb-1">Resolution</div>
                        <p className="text-white/80 text-sm">{e.resolutionNote}</p>
                      </div>
                    )}
                    <p className="text-white/40 text-xs">{new Date(e.createdAt).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Regulatory complaints module */}
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Scale size={18} className="text-amber-400" />
                  Regulatory complaints (CFPB / AG / FTC / BBB)
                  {openComplaints > 0 && (
                    <span className="text-[10px] uppercase tracking-widest text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded">
                      {openComplaints} active
                    </span>
                  )}
                </h2>
                <p className="mt-2 text-white/60 text-sm">
                  Draft → submit → track. Attach your evidence vault items so you have a clean, auditable record of what was sent.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/portal/disputes')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                title="Open dispute center"
              >
                Open disputes <ExternalLink size={14} />
              </button>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-4">
              <div className="text-[10px] uppercase tracking-widest text-amber-200/80">Create a complaint draft</div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Body</label>
                  <select
                    value={complaintBody}
                    onChange={(e) => setComplaintBody(e.target.value as RegulatoryBody)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                  >
                    <option value="CFPB">CFPB</option>
                    <option value="AG">Attorney General</option>
                    <option value="FTC">FTC</option>
                    <option value="BBB">BBB</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Target type</label>
                  <select
                    value={complaintTargetType}
                    onChange={(e) => setComplaintTargetType(e.target.value as RegulatoryTargetType)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
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
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Target name</label>
                  <input
                    value={complaintTargetName}
                    onChange={(e) => setComplaintTargetName(e.target.value)}
                    placeholder="Example: Experian / Equifax / TransUnion / Midland Credit"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Link to a case (optional)</label>
                  <select
                    value={complaintCaseId}
                    onChange={(e) => setComplaintCaseId(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                  >
                    <option value="">No case linked</option>
                    {cases.slice(0, 50).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title || c.id} ({c.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Narrative</label>
                <textarea
                  value={complaintNarrative}
                  onChange={(e) => setComplaintNarrative(e.target.value)}
                  rows={5}
                  placeholder="What happened, what you tried (letters/disputes), what you want corrected, and what evidence you attached."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 resize-y"
                />
                <div className="mt-2 text-[11px] text-white/50">
                  Educational only — not legal advice. Keep it factual, chronological, and reference your exhibits.
                </div>
              </div>

              <details className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <summary className="cursor-pointer select-none flex items-center justify-between gap-3">
                  <div className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-2">
                    <Paperclip size={14} className="text-amber-400" /> Attach evidence ({complaintEvidenceIds.length})
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-amber-300/80">Expand</div>
                </summary>
                <div className="mt-3 grid md:grid-cols-2 gap-2">
                  {evidence.slice(0, 40).map((ev) => (
                    <label
                      key={ev.id}
                      className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={complaintEvidenceIds.includes(ev.id)}
                        onChange={() =>
                          setComplaintEvidenceIds((prev) => (prev.includes(ev.id) ? prev.filter((x) => x !== ev.id) : [...prev, ev.id]))
                        }
                        className="mt-1 accent-amber-500"
                      />
                      <div className="min-w-0">
                        <div className="text-white/80 text-sm truncate">{ev.filename || ev.caption || ev.id}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono truncate">
                          {ev.mimeType} • {new Date(ev.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </label>
                  ))}
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
                      caseId: complaintCaseId || undefined,
                    });
                    setComplaintTargetName('');
                    setComplaintNarrative('');
                    setComplaintEvidenceIds([]);
                    setComplaintCaseId('');
                    setComplaintRefNo('');
                    setComplaintJustSubmittedId(null);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 text-black font-bold text-sm hover:brightness-110 transition-all"
                >
                  <Send size={14} /> Save draft
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/portal/documents')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                >
                  Open documents <ExternalLink size={14} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-[10px] uppercase tracking-widest text-white/40">My complaint drafts & tracking</div>
              {complaints.length === 0 ? (
                <div className="text-white/50 text-sm">No regulatory complaints yet.</div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-3">
                  {complaints.slice(0, 12).map((c) => (
                    <div key={c.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-white font-semibold truncate">
                            {c.body} • {c.targetName}
                          </div>
                          <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            {c.status} • {c.targetType}
                            {c.caseId ? ` • case:${c.caseId}` : ''}
                          </div>
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-white/40">{new Date(c.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="text-white/60 text-sm line-clamp-4 whitespace-pre-wrap">{c.narrative}</div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-[10px] font-black uppercase tracking-widest text-white/60">
                          <Paperclip size={12} /> {c.evidenceIds.length} exhibit{c.evidenceIds.length === 1 ? '' : 's'}
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
                              className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white/80 text-sm font-mono placeholder:text-white/30"
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
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15 text-[10px] font-black uppercase tracking-widest text-amber-100 transition-all"
                              title="Mark as submitted after you file it online/mail/phone"
                            >
                              Mark submitted
                            </button>
                          </>
                        ) : null}
                        {c.referenceNumber ? (
                          <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            ref: <span className="text-white/70">{c.referenceNumber}</span>
                          </span>
                        ) : null}
                      </div>

                      {c.evidenceIds.length ? (
                        <details className="rounded-xl border border-white/10 bg-black/30 p-4">
                          <summary className="cursor-pointer select-none text-[10px] uppercase tracking-widest text-white/40">
                            Exhibits (open)
                          </summary>
                          <div className="mt-3 space-y-2">
                            {c.evidenceIds.slice(0, 8).map((id) => {
                              const ev = evidence.find((x) => x.id === id) ?? null;
                              if (!ev?.blobRef) return <div key={id} className="text-white/50 text-sm font-mono">{id}</div>;
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
                                  className="w-full text-left rounded-xl border border-white/10 bg-white/[0.02] p-3 hover:bg-white/[0.05] transition-colors"
                                  title="Open exhibit"
                                >
                                  <div className="text-white/80 text-sm truncate">{ev.filename || ev.caption || ev.id}</div>
                                  <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono truncate">
                                    {ev.mimeType}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </details>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
              <div className="text-[11px] text-white/45">
                Tip: After submission, add your reference number here and attach any confirmation PDFs to Documents.
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/portal/messages')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <Send size={14} /> Open Messages & Support
          </button>
          </div>
        </EntitlementGate>
      )}
    </PageShell>
  );
}
