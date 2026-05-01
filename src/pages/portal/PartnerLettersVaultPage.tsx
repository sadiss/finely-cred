import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, ScrollText, Send, Archive } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { getOrCreatePartnerForSession } from '../../portal/getOrCreatePartnerForSession';
import { listLettersByPartner, setLetterArchived, upsertLetter } from '../../data/lettersRepo';
import { listEvidenceByPartner } from '../../data/evidenceRepo';
import { getBlobUrl } from '../../storage/getBlobUrl';
import { openUrlInNewTab } from '../../utils/download';
import type { LetterRecord, LetterStatus } from '../../domain/letters';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { MailLetterModal } from '../../components/letters/MailLetterModal';
import { addAuditEvent } from '../../data/auditRepo';
import { createTask } from '../../data/tasksRepo';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';

const STATUS: { value: LetterStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'generated', label: 'Generated' },
  { value: 'mail_pending', label: 'Mail pending' },
  { value: 'mail_failed', label: 'Mail failed' },
  { value: 'mailed', label: 'Mailed' },
  { value: 'waiting_response', label: 'Waiting response' },
  { value: 'completed', label: 'Completed' },
];

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function PartnerLettersVaultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const email = auth.user?.email || '';
  const partner = useMemo(() => getOrCreatePartnerForSession({ user: auth.user }), [auth.user]);
  const letters = useMemo(() => (partner ? listLettersByPartner(partner.id) : []), [partner]);
  const analysisReports = useMemo(() => {
    if (!partner) return [];
    return listEvidenceByPartner(partner.id)
      .filter((e: any) => Array.isArray((e as any).tags) && (e as any).tags.includes('analysis_report'))
      .filter((e: any) => String((e as any).mimeType || '').toLowerCase() === 'application/pdf')
      .slice()
      .sort((a: any, b: any) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  }, [partner]);
  const [status, setStatus] = useState<LetterStatus | 'all'>('all');
  const [mailOpen, setMailOpen] = useState(false);
  const [mailLetter, setMailLetter] = useState<LetterRecord | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [view, setView] = useState<'active' | 'archived'>('active');
  const [showAllByGroupId, setShowAllByGroupId] = useState<Record<string, boolean>>({});
  const [showAllByDisputeBureau, setShowAllByDisputeBureau] = useState<Record<string, boolean>>({});

  const LETTERS_LIMIT = 8;

  useEffect(() => {
    try {
      const sp = new URLSearchParams(location.search || '');
      const id = (sp.get('letterId') || '').trim();
      if (!id) return;
      setStatus('all');
      setHighlightId(id);
      setTimeout(() => {
        const el = document.getElementById(`letter-${id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
      const t = window.setTimeout(() => setHighlightId(null), 4500);
      return () => window.clearTimeout(t);
    } catch {
      // ignore
    }
  }, [location.search]);

  const filtered = useMemo(() => {
    const base = letters.filter((l) => (view === 'archived' ? Boolean(l.archivedAt) : !l.archivedAt));
    if (status === 'all') return base;
    return base.filter((l) => (l.status ?? 'generated') === status);
  }, [letters, status, view]);

  const counts = useMemo(() => {
    const active = letters.filter((l) => !l.archivedAt);
    const archived = letters.filter((l) => Boolean(l.archivedAt));
    const byType = (arr: LetterRecord[]) =>
      arr.reduce(
        (m, l) => ({ ...m, [l.type]: (m[l.type] ?? 0) + 1 }),
        {} as Record<string, number>,
      );
    return {
      active: active.length,
      archived: archived.length,
      activeByType: byType(active),
      archivedByType: byType(archived),
    };
  }, [letters]);

  const groups = useMemo(() => {
    const byType = (t: LetterRecord['type']) => filtered.filter((l) => l.type === t);
    const dispute = byType('dispute');
    const validation = byType('validation');
    const court = byType('court');
    const disputeByBureau = dispute.reduce(
      (m, l) => {
        const bureau = l.meta && 'bureau' in (l.meta as any) ? String((l.meta as any).bureau || 'Unknown') : 'Unknown';
        m[bureau] = m[bureau] ?? [];
        m[bureau].push(l);
        return m;
      },
      {} as Record<string, LetterRecord[]>,
    );
    return [
      { id: 'dispute', label: 'Dispute letters', letters: dispute, disputeByBureau },
      { id: 'validation', label: 'Validation / DV', letters: validation },
      { id: 'court', label: 'Court / Affidavit', letters: court },
    ] as const;
  }, [filtered]);

  const openPdf = async (l: LetterRecord) => {
    if (!l.pdfBlobRef) return;
    const res = await getBlobUrl(l.pdfBlobRef, { mimeType: 'application/pdf' });
    if (!res?.url) return;
    openUrlInNewTab({ url: res.url, revoke: res.revoke, revokeAfterMs: 60_000 });
  };

  const openEvidencePdf = async (e: any) => {
    const ref = String(e?.blobRef || '').trim();
    if (!ref) return;
    const res = await getBlobUrl(ref, { mimeType: 'application/pdf' });
    if (!res?.url) return;
    openUrlInNewTab({ url: res.url, revoke: res.revoke, revokeAfterMs: 60_000 });
  };

  const canMail = isFeatureEnabled('letterMailing');

  return (
    <PageShell
      badge="Partner Portal"
      title="Letters Vault"
      subtitle="Stored letters (PDF) with status tracking. This is your permanent letter archive."
    >
      {!partner ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 text-white/60">
            No partner profile found for this account.
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      ) : (
        <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.letters]}>
          <div className="space-y-6">
          {mailOpen && mailLetter ? (
            <MailLetterModal
              open={mailOpen}
              partnerId={partner.id}
              letter={mailLetter}
              defaultFromName={partner.profile.fullName || 'Partner'}
              defaultFromAddress={(() => {
                const route: any = partner.primaryRoute ? (partner.routes as any)?.[partner.primaryRoute] : null;
                const p = route?.personal ?? null;
                if (!p) return undefined;
                return {
                  addressLine1: p.address1 ?? '',
                  addressLine2: p.address2 ?? '',
                  city: p.city ?? '',
                  state: p.state ?? '',
                  zip: p.postalCode ?? '',
                };
              })()}
              onClose={() => {
                setMailOpen(false);
                setMailLetter(null);
              }}
              onStatus={({ status: st, error, to, from }) => {
                upsertLetter({
                  ...mailLetter,
                  status: st,
                  mailing: {
                    provider: 'lob',
                    providerId: mailLetter.mailing?.providerId,
                    createdAt: mailLetter.mailing?.createdAt ?? new Date().toISOString(),
                    expectedDeliveryDate: mailLetter.mailing?.expectedDeliveryDate,
                    status: st === 'mail_pending' ? 'pending' : st === 'mail_failed' ? 'failed' : mailLetter.mailing?.status,
                    lastError: st === 'mail_failed' ? (error ?? 'Mailing failed') : undefined,
                    to,
                    from,
                  },
                });
              }}
              onMailed={({ providerId, expectedDeliveryDate, to, from }) => {
                const updated = upsertLetter({
                  ...mailLetter,
                  status: 'mailed',
                  mailing: {
                    provider: 'lob',
                    providerId,
                    createdAt: new Date().toISOString(),
                    expectedDeliveryDate,
                    status: 'mailed',
                    to,
                    from,
                  },
                });
                addAuditEvent({
                  partnerId: partner.id,
                  actorType: 'partner',
                  actorEmail: email || undefined,
                  action: 'letter.mailed',
                  entityType: 'letter',
                  entityId: updated.id,
                  meta: { provider: 'lob', providerId, expectedDeliveryDate: expectedDeliveryDate ?? null },
                });

                // Follow-up task (best-effort 35-day window).
                const due = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString();
                createTask({
                  partnerId: partner.id,
                  title: `Follow up: bureau response window for "${updated.title}"`,
                  kind: 'follow_up',
                  status: 'pending',
                  stage: 'disputes',
                  dueAt: due,
                  relatedLetterId: updated.id,
                  notes: 'Watch for bureau response mail. Upload the response immediately to Documents Vault when it arrives.',
                  assignedTo: 'partner',
                });
              }}
            />
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => navigate('/portal/letters')}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
              title="Back to Letters Command Center"
            >
              <ArrowLeft size={16} /> Letters Command Center
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Next best action</div>
            <div className="mt-2 text-white/70 text-sm">
              Generate a new letter, download/print it, and then track it here after mailing.
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/portal/letters')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
              >
                <ScrollText size={14} /> Resume letters
              </button>
              <button
                type="button"
                onClick={() => navigate('/portal/documents')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/80 transition-all"
                title="Upload bureau responses and any supporting documents"
              >
                <Send size={14} /> Upload response documents
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6">
            <div className="flex items-center gap-2 text-amber-400">
              <ScrollText size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Letters</span>
              <span className="ml-2 text-[10px] uppercase tracking-widest text-white/40">
                {filtered.length} shown / {letters.length} total
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setView('active')}
                  className={
                    'px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ' +
                    (view === 'active'
                      ? 'bg-amber-500 text-black border-amber-400'
                      : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white')
                  }
                >
                  Active ({counts.active})
                </button>
                <button
                  type="button"
                  onClick={() => setView('archived')}
                  className={
                    'px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ' +
                    (view === 'archived'
                      ? 'bg-amber-500 text-black border-amber-400'
                      : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white')
                  }
                >
                  Archived ({counts.archived})
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-[11px]"
                >
                  {STATUS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 grid md:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Dispute</div>
                <div className="mt-2 text-2xl font-semibold text-white">{(view === 'archived' ? counts.archivedByType.dispute : counts.activeByType.dispute) ?? 0}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Validation / DV</div>
                <div className="mt-2 text-2xl font-semibold text-white">{(view === 'archived' ? counts.archivedByType.validation : counts.activeByType.validation) ?? 0}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Court</div>
                <div className="mt-2 text-2xl font-semibold text-white">{(view === 'archived' ? counts.archivedByType.court : counts.activeByType.court) ?? 0}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Total shown</div>
                <div className="mt-2 text-2xl font-semibold text-white">{filtered.length}</div>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {filtered.length === 0 ? (
                <div className="text-white/60 text-sm">No letters in this view yet.</div>
              ) : (
                groups.map((g) => (
                  <details key={g.id} className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden" open>
                    <summary className="cursor-pointer select-none px-5 py-4 flex items-center justify-between gap-3 hover:bg-white/[0.03] transition-colors">
                      <div className="min-w-0">
                        <div className="text-white font-semibold truncate">{g.label}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">{g.letters.length} letter{g.letters.length === 1 ? '' : 's'}</div>
                      </div>
                      <div className="text-white/50 text-sm">Show</div>
                    </summary>
                    <div className="p-5 pt-0">
                      {g.id === 'dispute' ? (
                        <div className="space-y-4">
                          {Object.entries((g as any).disputeByBureau as Record<string, LetterRecord[]>)
                            .sort((a, b) => a[0].localeCompare(b[0]))
                            .map(([bureau, arr]) => (
                              <details
                                key={bureau}
                                className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden"
                                open
                              >
                                <summary className="cursor-pointer select-none px-5 py-4 flex items-center justify-between gap-3 hover:bg-white/[0.03] transition-colors">
                                  <div className="text-white font-semibold">{bureau}</div>
                                  <div className="text-[10px] uppercase tracking-widest text-white/40">{arr.length}</div>
                                </summary>
                                <div className="p-5 pt-0">
                                  {arr.length > LETTERS_LIMIT ? (
                                    <div className="flex justify-end mb-3">
                                      <button
                                        type="button"
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                                        onClick={() =>
                                          setShowAllByDisputeBureau((m) => ({ ...m, [bureau]: !Boolean(m[bureau]) }))
                                        }
                                        title={showAllByDisputeBureau[bureau] ? 'Show less' : 'Show all'}
                                      >
                                        {showAllByDisputeBureau[bureau] ? 'Show less' : `Show all (${arr.length})`}
                                      </button>
                                    </div>
                                  ) : null}
                                  <div className="grid lg:grid-cols-2 gap-4">
                                    {(showAllByDisputeBureau[bureau] ? arr : arr.slice(0, LETTERS_LIMIT)).map((l) => (
                                      <div
                                        key={l.id}
                                        id={`letter-${l.id}`}
                                        className={`rounded-2xl border bg-white/[0.02] p-5 transition-all ${
                                          highlightId === l.id ? 'border-amber-500/40 ring-2 ring-amber-500/30' : 'border-white/10'
                                        }`}
                                      >
                                      <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0">
                                          <div className="text-white font-semibold truncate">{l.title}</div>
                                          <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                            {fmtWhen(l.createdAt)} • {(l.status ?? 'generated').replaceAll('_', ' ')}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => void openPdf(l)}
                                            disabled={!l.pdfBlobRef}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                          >
                                            <Download size={14} /> Open PDF
                                          </button>
                                          {canMail ? (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (!l.pdfBlobRef) return;
                                                setMailLetter(l);
                                                setMailOpen(true);
                                              }}
                                              disabled={!l.pdfBlobRef}
                                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                              title="Mail this letter (US only)"
                                            >
                                              <Send size={14} /> Mail
                                            </button>
                                          ) : null}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const phrase = view === 'archived' ? 'UNARCHIVE' : 'ARCHIVE';
                                              const ok = window.prompt(`Type ${phrase} to confirm.`) === phrase;
                                              if (!ok) return;
                                              const updated = setLetterArchived({ letterId: l.id, archived: view !== 'archived' });
                                              if (!updated || !partner) return;
                                              addAuditEvent({
                                                partnerId: partner.id,
                                                actorType: 'partner',
                                                actorEmail: email || undefined,
                                                action: view === 'archived' ? 'letter.unarchived' : 'letter.archived',
                                                entityType: 'letter',
                                                entityId: l.id,
                                                meta: { type: l.type },
                                              });
                                              navigate(0);
                                            }}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/40 hover:bg-black/35 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                                            title={view === 'archived' ? 'Restore to active vault' : 'Archive this letter (undoable)'}
                                          >
                                            <Archive size={14} /> {view === 'archived' ? 'Unarchive' : 'Archive'}
                                          </button>
                                        </div>
                                      </div>
                                      <details className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
                                        <summary className="cursor-pointer select-none text-[10px] font-black uppercase tracking-widest text-white/60">
                                          Snapshot
                                        </summary>
                                        <div className="mt-3 text-[11px] text-white/70">
                                          <div dangerouslySetInnerHTML={{ __html: l.body }} />
                                        </div>
                                      </details>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </details>
                            ))}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {g.letters.length > LETTERS_LIMIT ? (
                            <div className="flex justify-end">
                              <button
                                type="button"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                                onClick={() =>
                                  setShowAllByGroupId((m) => ({ ...m, [g.id]: !Boolean(m[g.id]) }))
                                }
                                title={showAllByGroupId[g.id] ? 'Show less' : 'Show all'}
                              >
                                {showAllByGroupId[g.id] ? 'Show less' : `Show all (${g.letters.length})`}
                              </button>
                            </div>
                          ) : null}
                          <div className="grid lg:grid-cols-2 gap-4">
                            {(showAllByGroupId[g.id] ? g.letters : g.letters.slice(0, LETTERS_LIMIT)).map((l) => (
                              <div
                                key={l.id}
                                id={`letter-${l.id}`}
                                className={`rounded-2xl border bg-white/[0.02] p-5 transition-all ${
                                  highlightId === l.id ? 'border-amber-500/40 ring-2 ring-amber-500/30' : 'border-white/10'
                                }`}
                              >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-white font-semibold truncate">{l.title}</div>
                                  <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                    {fmtWhen(l.createdAt)} • {(l.status ?? 'generated').replaceAll('_', ' ')} • {l.type}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => void openPdf(l)}
                                    disabled={!l.pdfBlobRef}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                  >
                                    <Download size={14} /> Open PDF
                                  </button>
                                  {canMail ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!l.pdfBlobRef) return;
                                        setMailLetter(l);
                                        setMailOpen(true);
                                      }}
                                      disabled={!l.pdfBlobRef}
                                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                      title="Mail this letter (US only)"
                                    >
                                      <Send size={14} /> Mail
                                    </button>
                                  ) : null}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const phrase = view === 'archived' ? 'UNARCHIVE' : 'ARCHIVE';
                                      const ok = window.prompt(`Type ${phrase} to confirm.`) === phrase;
                                      if (!ok) return;
                                      const updated = setLetterArchived({ letterId: l.id, archived: view !== 'archived' });
                                      if (!updated || !partner) return;
                                      addAuditEvent({
                                        partnerId: partner.id,
                                        actorType: 'partner',
                                        actorEmail: email || undefined,
                                        action: view === 'archived' ? 'letter.unarchived' : 'letter.archived',
                                        entityType: 'letter',
                                        entityId: l.id,
                                        meta: { type: l.type },
                                      });
                                      navigate(0);
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/40 hover:bg-black/35 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                                  >
                                    <Archive size={14} /> {view === 'archived' ? 'Unarchive' : 'Archive'}
                                  </button>
                                </div>
                              </div>
                              <details className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
                                <summary className="cursor-pointer select-none text-[10px] font-black uppercase tracking-widest text-white/60">
                                  Snapshot
                                </summary>
                                <div className="mt-3 text-[11px] text-white/70">
                                  <div dangerouslySetInnerHTML={{ __html: l.body }} />
                                </div>
                              </details>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </details>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6">
            <div className="flex items-center gap-2 text-amber-400">
              <ScrollText size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Saved analysis reports</span>
              <span className="ml-2 text-[10px] uppercase tracking-widest text-white/40">
                {analysisReports.length} PDF{analysisReports.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="mt-3 text-white/55 text-sm">
              Credit Analysis Reports generated from your uploads (variants + optional exhibits). Stored as PDFs.
            </div>

            {analysisReports.length === 0 ? (
              <div className="mt-4 text-white/60 text-sm">
                None yet. Generate one from <button type="button" className="text-amber-300 underline" onClick={() => navigate('/portal/reports')}>Reports</button>.
              </div>
            ) : (
              <div className="mt-5 grid lg:grid-cols-2 gap-4">
                {analysisReports.slice(0, 12).map((r: any) => (
                  <div key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <div className="text-white font-semibold truncate">{r.filename || 'Credit Analysis Report.pdf'}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                      {fmtWhen(r.createdAt)} • report_id:{String(r.reportId || '—').slice(0, 8)}
                    </div>
                    {r.caption ? <div className="mt-2 text-white/60 text-sm line-clamp-2">{r.caption}</div> : null}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void openEvidencePdf(r)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all"
                      >
                        <Download size={14} /> Open PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/portal/documents')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                      >
                        View in Documents <Send size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>
        </EntitlementGate>
      )}
    </PageShell>
  );
}

