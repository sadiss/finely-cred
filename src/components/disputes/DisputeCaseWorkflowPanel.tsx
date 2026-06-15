import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Gavel,
  Mail,
  MessageSquare,
  Scale,
  Send,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getCase,
  markCaseRoundMailed,
  markCaseRoundReadyForNext,
  markCaseRoundResponseReceived,
} from '../../data/casesRepo';
import { listDisputeActionsByCase } from '../../data/disputeWorkflowRepo';
import { listEscalationsByCase } from '../../data/escalationsRepo';
import { listRegulatoryComplaintsByCase } from '../../data/regulatoryComplaintsRepo';
import { createThread, listThreadsByCase } from '../../data/supportRepo';
import type { DisputeCase } from '../../domain/cases';
import {
  DISPUTE_ROUND_ORDER,
  INTER_ROUND_GUIDANCE,
  ROUND_STATUS_LABELS,
  inferRoundStatus,
  isRoundOverdue,
  isRoundDueSoon,
  roundPipelineState,
  suggestNextRound,
  type DisputeRoundLabel,
} from '../../domain/disputeWorkflow';
import { Button } from '../ui';

type Props = {
  caseId: string;
  partnerId: string;
  mode?: 'partner' | 'admin';
  onUpdated?: () => void;
};

function statusTone(status: string): string {
  switch (status) {
    case 'response_received':
    case 'ready_for_next_round':
      return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20';
    case 'mailed':
    case 'awaiting_response':
      return 'text-amber-300 bg-amber-500/10 border-amber-500/20';
    case 'escalated':
      return 'text-red-300 bg-red-500/10 border-red-500/20';
    default:
      return 'text-white/60 bg-white/5 border-white/[0.08]';
  }
}

export function DisputeCaseWorkflowPanel({ caseId, partnerId, mode = 'partner', onUpdated }: Props) {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [responseNotes, setResponseNotes] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const disputeCase = useMemo(() => getCase(caseId), [caseId, version]);
  const suggestedRound = useMemo(() => (disputeCase ? suggestNextRound(disputeCase) : 'Round 1'), [disputeCase]);
  const pipeline = useMemo(() => (disputeCase ? roundPipelineState(disputeCase) : []), [disputeCase]);
  const actions = useMemo(() => listDisputeActionsByCase(caseId), [caseId, version]);
  const escalations = useMemo(() => listEscalationsByCase(caseId), [caseId, version]);
  const complaints = useMemo(() => listRegulatoryComplaintsByCase(caseId), [caseId, version]);
  const threads = useMemo(() => listThreadsByCase(caseId), [caseId, version]);

  if (!disputeCase || disputeCase.partnerId !== partnerId) return null;

  const activeRound = pipeline.find((p) => p.isCurrent)?.round ?? suggestedRound;
  const guidance = INTER_ROUND_GUIDANCE[activeRound];

  const refresh = () => {
    setVersion((v) => v + 1);
    onUpdated?.();
  };

  const runAction = (key: string, fn: () => void) => {
    setBusy(key);
    try {
      fn();
      refresh();
    } finally {
      setBusy(null);
    }
  };

  const openLetters = (round?: DisputeRoundLabel) => {
    const q = new URLSearchParams({ caseId });
    if (round) q.set('round', round);
    navigate(mode === 'admin' ? `/portal/letters?${q}` : `/portal/letters?${q}`);
  };

  const openComplaints = (round?: DisputeRoundLabel) => {
    const q = new URLSearchParams({ caseId });
    if (round) q.set('round', round);
    navigate(`/portal/escalations?${q}`);
  };

  const handleMessageTeam = () => {
    if (!messageBody.trim()) return;
    const { thread } = createThread({
      partnerId,
      topic: 'disputes',
      subject: `Case collaboration • ${disputeCase.title}`,
      relatedCaseId: caseId,
      initialMessage: { body: messageBody.trim(), fromPartner: mode === 'partner' },
    });
    setMessageBody('');
    navigate(mode === 'admin' ? `/admin/support?threadId=${encodeURIComponent(thread.id)}` : '/portal/messages?hub=team');
  };

  return (
    <div className="space-y-6">
      <div className="fc-elevated-card p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-amber-400">
              <Sparkles size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider">Dispute workflow</span>
            </div>
            <p className="mt-2 text-white font-semibold">Round pipeline — Rounds 1, 2, 3</p>
            <p className="mt-1 text-white/60 text-sm">
              Track mail dates, bureau responses, and inter-round complaints in one place. Suggested next step:{' '}
              <span className="text-white/90 font-semibold">{suggestedRound}</span>.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => openLetters(suggestedRound)}>
            Generate {suggestedRound} letter <ArrowRight size={14} />
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          {pipeline.map((step) => {
            const status = step.record ? inferRoundStatus(step.record) : 'draft';
            const overdue = isRoundOverdue(step.record);
            const dueSoon = isRoundDueSoon(step.record);
            return (
              <div
                key={step.round}
                className={`rounded-xl border p-4 space-y-3 ${
                  step.isCurrent
                    ? 'border-amber-500/30 bg-amber-500/5'
                    : step.isSuggestedNext
                      ? 'border-emerald-500/20 bg-emerald-500/5'
                      : 'border-white/[0.08] bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white font-semibold">{step.round}</span>
                  {step.isCurrent ? (
                    <span className="text-[9px] uppercase tracking-widest text-amber-300 font-bold">Current</span>
                  ) : step.isSuggestedNext ? (
                    <span className="text-[9px] uppercase tracking-widest text-emerald-300 font-bold">Next</span>
                  ) : null}
                </div>
                <div className={`inline-flex px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${statusTone(status)}`}>
                  {ROUND_STATUS_LABELS[status]}
                </div>
                {step.record?.dueAt ? (
                  <p className={`text-xs ${overdue ? 'text-red-300' : dueSoon ? 'text-amber-300' : 'text-white/50'}`}>
                    Due {new Date(step.record.dueAt).toLocaleDateString()}
                    {overdue ? ' • overdue' : dueSoon ? ' • due soon' : ''}
                  </p>
                ) : (
                  <p className="text-xs text-white/40">Not started</p>
                )}
                {step.record?.letterId ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/portal/letters/vault?letterId=${encodeURIComponent(step.record!.letterId!)}`)}
                    className="text-[10px] uppercase tracking-widest text-emerald-300 hover:text-emerald-200"
                  >
                    View letter
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="fc-light-glass-panel fc-light-chrome-panel rounded-xl p-4 space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-white/40">{guidance.title}</p>
          <ul className="space-y-2">
            {guidance.betweenRounds.map((line) => (
              <li key={line} className="flex items-start gap-2 text-sm text-white/70">
                <CheckCircle2 size={14} className="text-amber-400 mt-0.5 shrink-0" />
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-2">
          {DISPUTE_ROUND_ORDER.map((round) => (
            <div key={round} className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] uppercase tracking-widest text-white/40 mr-1">{round}</span>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => runAction(`mail-${round}`, () => markCaseRoundMailed({ caseId, round, createdBy: mode }))}
                className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest text-white/70"
              >
                <Send size={12} className="inline mr-1" /> Mark mailed
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() =>
                  runAction(`response-${round}`, () =>
                    markCaseRoundResponseReceived({
                      caseId,
                      round,
                      notes: responseNotes.trim() || undefined,
                      createdBy: mode,
                    }),
                  )
                }
                className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest text-white/70"
              >
                <Mail size={12} className="inline mr-1" /> Log response
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => runAction(`next-${round}`, () => markCaseRoundReadyForNext({ caseId, round, createdBy: mode }))}
                className="px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-[10px] font-bold uppercase tracking-widest text-emerald-200"
              >
                Ready for next
              </button>
            </div>
          ))}
        </div>

        <textarea
          value={responseNotes}
          onChange={(e) => setResponseNotes(e.target.value)}
          placeholder="Optional notes when logging bureau response (results, deletions, verification, etc.)"
          className="w-full min-h-[72px] fc-light-glass-panel fc-light-chrome-panel rounded-xl px-4 py-3 text-sm text-white/80 placeholder:text-white/30 outline-none focus:border-amber-500/40"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="fc-elevated-card p-6 space-y-4">
          <div className="flex items-center gap-2 text-white/80">
            <Gavel size={16} className="text-amber-400" />
            <span className="font-semibold">Inter-round actions</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => openComplaints(activeRound)}>
              <Scale size={14} /> CFPB / regulatory
            </Button>
            <Button variant="outline" size="sm" onClick={() => openComplaints(activeRound)}>
              <ShieldAlert size={14} /> Internal escalation
            </Button>
            <Button variant="outline" size="sm" onClick={() => openLetters(suggestedRound)}>
              <FileText size={14} /> Letter studio
            </Button>
          </div>
          {(escalations.length > 0 || complaints.length > 0) && (
            <div className="space-y-2 pt-2 border-t border-white/[0.08]">
              {escalations.map((e) => (
                <div key={e.id} className="rounded-lg fc-light-glass-panel fc-light-chrome-panel border p-3 text-sm">
                  <span className="text-white/90 font-medium">{e.title}</span>
                  <span className="ml-2 text-[10px] uppercase tracking-widest text-white/40">{e.status}</span>
                </div>
              ))}
              {complaints.map((c) => (
                <div key={c.id} className="rounded-lg fc-light-glass-panel fc-light-chrome-panel border p-3 text-sm">
                  <span className="text-white/90 font-medium">{c.body} → {c.targetName}</span>
                  <span className="ml-2 text-[10px] uppercase tracking-widest text-white/40">{c.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="fc-elevated-card p-6 space-y-4">
          <div className="flex items-center gap-2 text-white/80">
            <MessageSquare size={16} className="text-amber-400" />
            <span className="font-semibold">Team communication</span>
          </div>
          <p className="text-sm text-white/60">
            Message admin, partner, or assigned specialist with this case linked automatically.
          </p>
          <textarea
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            placeholder="Ask for review, share bureau response, or request specialist support…"
            className="w-full min-h-[88px] fc-light-glass-panel fc-light-chrome-panel rounded-xl px-4 py-3 text-sm text-white/80 placeholder:text-white/30 outline-none focus:border-amber-500/40"
          />
          <Button variant="primary" size="sm" onClick={handleMessageTeam} disabled={!messageBody.trim()}>
            Send case-linked message
          </Button>
          {threads.length > 0 ? (
            <div className="space-y-2 pt-2 border-t border-white/[0.08]">
              {threads.slice(0, 3).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => navigate(mode === 'admin' ? `/admin/support?threadId=${t.id}` : '/portal/messages?hub=team')}
                  className="w-full text-left rounded-lg fc-light-glass-panel fc-light-chrome-panel border p-3 text-sm text-white/80 hover:bg-white/[0.05]"
                >
                  {t.subject}
                  <span className="block text-[10px] uppercase tracking-widest text-white/40 mt-1">{t.status}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="fc-elevated-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-white/80">
          <Clock size={16} className="text-amber-400" />
          <span className="font-semibold">Unified timeline</span>
        </div>
        {actions.length === 0 ? (
          <p className="text-white/50 text-sm">No workflow events yet. Mark a round mailed or file a complaint to start the timeline.</p>
        ) : (
          <div className="space-y-3">
            {actions.map((a) => (
              <div key={a.id} className="flex gap-3 fc-light-glass-panel fc-light-chrome-panel rounded-xl p-4">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-white font-medium">{a.title}</span>
                    {a.round ? (
                      <span className="text-[9px] uppercase tracking-widest text-white/40 font-mono">{a.round}</span>
                    ) : null}
                    <span className="text-[9px] uppercase tracking-widest text-white/30">{a.createdBy}</span>
                  </div>
                  {a.body ? <p className="mt-1 text-sm text-white/60">{a.body}</p> : null}
                  <p className="mt-1 text-[10px] text-white/30">{new Date(a.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function useDisputeCaseSnapshot(caseId: string): DisputeCase | null {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);
  return useMemo(() => getCase(caseId), [caseId, version]);
}
