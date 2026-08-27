import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ScrollText, Send } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { deleteLetter, listLettersByPartner, markLetterFinal, setLetterArchived, upsertLetter } from '../../data/lettersRepo';
import { listCasesByPartner } from '../../data/casesRepo';
import { describeDisputeEffectiveness, summarizeDisputeEffectiveness } from '../../lib/disputeEffectiveness';
import { syncDisputeDeadlinePassedTasks } from '../../lib/disputeDeadlineEngine';
import { backfillPartnerLettersMailTo } from '../../lib/letterMailToBackfill';
import { listEvidenceByPartner } from '../../data/evidenceRepo';
import { openBlobRefInNewTab } from '../../lib/openBlobRef';
import type { LetterRecord, LetterStatus } from '../../domain/letters';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { MailLetterModal } from './MailLetterModal';
import { BatchMailWizard, type BatchMailItemResult } from './BatchMailWizard';
import { SavedLetterCard } from './SavedLetterCard';
import { MailProviderStatusBanner } from '../mailing/MailProviderStatusBanner';
import { notifyLetterMailed } from '../../lib/letterMailedNotify';
import { notifyLetterLifecycle } from '../../lib/letterLifecycleNotify';
import { isLetterDraft } from '../../lib/letterDraftLifecycle';
import { MarkLetterFinalModal } from './MarkLetterFinalModal';
import { loadLettersCommandCenterDraft } from '../../data/lettersCommandCenterDraftRepo';
import { letterStudioResumeUrl } from '../../lib/letterStudioResume';
import { bureauFullName } from '../../utils/bureaus';
import type { Bureau } from '../../domain/creditReports';
import { addAuditEvent } from '../../data/auditRepo';
import { checkDisputeLetterEvidenceGate } from '../../lib/evidenceGates';
import { checkIdentityVaultGate } from '../../lib/documentVaultGates';
import { onDisputeLetterMailed } from '../../lib/disputeRoundEngine';
import { canOpenMailModal, isLetterPhysicallyMailed } from '../../lib/letterMailState';
import { letterVaultPrimaryStatus } from '../../lib/letterVaultStatus';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import type { Partner } from '../../domain/partners';
import {
  FINELY_OS_COMPACT_PAGE,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsViewTab,
  FINELY_OS_BACK_LINK,
} from '../../features/os/finelyOsLightUi';
import '../partner/partnerVaultWorkspace.css';
import './partnerLetterStudio.css';

const STATUS: { value: LetterStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'generated', label: 'Final / generated' },
  { value: 'mail_pending', label: 'Mail pending' },
  { value: 'mail_failed', label: 'Mail failed' },
  { value: 'mailed', label: 'Mailed' },
  { value: 'waiting_response', label: 'Waiting response' },
  { value: 'completed', label: 'Completed' },
];

export type PartnerLettersVaultNavigation = {
  studioPath: string;
  documentsPath: string;
  vaultPath: string;
};

/**
 * Saved/sent/completed letter library with mail, status tracking, and history.
 * Shared by the live portal vault page and workspace-light preview.
 */
export function PartnerLettersVaultWorkspace({
  partner,
  actorEmail = '',
  navigation,
  surface = 'dark',
  embedded = false,
}: {
  partner: Partner;
  actorEmail?: string;
  navigation: PartnerLettersVaultNavigation;
  surface?: 'dark' | 'light';
  /** Hides chrome when nested inside a product surface shell. */
  embedded?: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [lettersVersion, setLettersVersion] = useState(0);
  const letters = useMemo(
    () => listLettersByPartner(partner.id),
    [partner.id, lettersVersion],
  );
  const [status, setStatus] = useState<LetterStatus | 'all'>('all');
  const [mailOpen, setMailOpen] = useState(false);
  const [mailLetter, setMailLetter] = useState<LetterRecord | null>(null);
  const [batchOpen, setBatchOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [selectedLetterId, setSelectedLetterId] = useState<string | null>(null);
  const [autoPreviewId, setAutoPreviewId] = useState<string | null>(null);
  const [view, setView] = useState<'active' | 'archived'>('active');
  const [mailGateErr, setMailGateErr] = useState<string | null>(null);
  const [openErr, setOpenErr] = useState<string | null>(null);
  const [markFinalLetter, setMarkFinalLetter] = useState<LetterRecord | null>(null);
  const [markFinalBusy, setMarkFinalBusy] = useState(false);
  const [markFinalEmail, setMarkFinalEmail] = useState(true);
  const evidence = useMemo(() => listEvidenceByPartner(partner.id), [partner.id, lettersVersion]);

  const bumpLetters = () => setLettersVersion((v) => v + 1);

  useEffect(() => {
    syncDisputeDeadlinePassedTasks(partner.id);
  }, [partner.id]);

  const effectiveness = useMemo(() => summarizeDisputeEffectiveness(listCasesByPartner(partner.id)), [partner.id, lettersVersion]);

  const studioDraftResume = useMemo(() => {
    const draft = loadLettersCommandCenterDraft(partner.id);
    if (!draft?.selectedDisputes?.length) return null;
    return letterStudioResumeUrl(draft, navigation.studioPath);
  }, [partner.id, letters.length, navigation.studioPath]);

  useEffect(() => {
    const sessionKey = `finely.letterMailToBackfill::${partner.id}`;
    if (typeof window !== 'undefined' && sessionStorage.getItem(sessionKey) === '1') return;
    const changed = backfillPartnerLettersMailTo(partner.id);
    if (changed > 0) bumpLetters();
    if (typeof window !== 'undefined') sessionStorage.setItem(sessionKey, '1');
  }, [partner.id]);

  useEffect(() => {
    try {
      const sp = new URLSearchParams(location.search || '');
      const id = (sp.get('letterId') || '').trim();
      const preview = sp.get('preview') === '1';
      if (!id) return;
      setStatus('all');
      setHighlightId(id);
      setSelectedLetterId(id);
      if (preview) setAutoPreviewId(id);
      setTimeout(() => {
        const el = document.getElementById(`letter-${id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
      const t = window.setTimeout(() => setHighlightId(null), 4500);
      if (preview) {
        window.setTimeout(() => setAutoPreviewId(null), 800);
      }
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

  const draftLetters = useMemo(
    () => letters.filter((l) => !l.archivedAt && isLetterDraft(l)),
    [letters],
  );

  const vaultLetters = useMemo(
    () => filtered.filter((l) => !isLetterDraft(l)),
    [filtered],
  );

  const queueLetters = useMemo(() => (status === 'draft' ? filtered : vaultLetters), [status, filtered, vaultLetters]);

  const selectedLetter = useMemo(
    () => queueLetters.find((l) => l.id === selectedLetterId) ?? null,
    [queueLetters, selectedLetterId],
  );

  useEffect(() => {
    if (!queueLetters.length) {
      setSelectedLetterId(null);
      return;
    }
    if (!selectedLetterId || !queueLetters.some((l) => l.id === selectedLetterId)) {
      setSelectedLetterId(queueLetters[0].id);
    }
  }, [queueLetters, selectedLetterId]);

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

  const confirmMarkLetterFinal = async () => {
    if (!markFinalLetter) return;
    setMarkFinalBusy(true);
    try {
      const updated = markLetterFinal(markFinalLetter);
      addAuditEvent({
        partnerId: partner.id,
        actorType: 'partner',
        actorEmail: actorEmail || undefined,
        action: 'letter.marked_final',
        entityType: 'letter',
        entityId: updated.id,
        meta: { type: updated.type, title: updated.title },
      });
      if (markFinalEmail) {
        void notifyLetterLifecycle({
          partnerId: partner.id,
          partner,
          event: 'ready_to_mail',
          letterIds: [updated.id],
          letterTitles: [updated.title],
          emailPartner: true,
          actorEmail: actorEmail || undefined,
          actorRole: 'partner',
        });
      }
      setMarkFinalLetter(null);
      bumpLetters();
    } finally {
      setMarkFinalBusy(false);
    }
  };

  const vaultKpis = useMemo(
    () => [
      {
        label: 'Active',
        value: String(counts.active),
        hint: effectiveness.logged ? `${describeDisputeEffectiveness(effectiveness)} · Results vary` : 'In vault',
        accent: 'emerald' as const,
      },
      { label: 'Archived', value: String(counts.archived), hint: 'Stored', accent: 'violet' as const },
      { label: 'Shown', value: String(filtered.length), hint: 'Current filter', accent: 'fuchsia' as const },
    ],
    [counts, filtered.length, effectiveness],
  );

  const openPdf = async (l: LetterRecord) => {
    setOpenErr(null);
    if (!l.pdfBlobRef) {
      setOpenErr('No PDF stored — use Preview letter text on the card or regenerate in Letter Studio.');
      return;
    }
    const result = await openBlobRefInNewTab({ blobRef: l.pdfBlobRef, mimeType: 'application/pdf' });
    if (!result.ok) setOpenErr(result.message);
  };

  const canMail = isFeatureEnabled('letterMailing');
  const pdfReadyActive = useMemo(
    () =>
      letters.filter(
        (l) => !l.archivedAt && Boolean(l.pdfBlobRef) && !isLetterDraft(l) && !isLetterPhysicallyMailed(l),
      ),
    [letters],
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyBatchResults = (results: BatchMailItemResult[]) => {
    for (const r of results) {
      const letter = letters.find((l) => l.id === r.letterId);
      if (!letter) continue;
      const addr = {
        to: r.to || letter.mailing?.to || { name: '', addressLine1: '', city: '', state: '', zip: '' },
        from: r.from || letter.mailing?.from || { name: '', addressLine1: '', city: '', state: '', zip: '' },
      };
      if (r.ok && r.providerId) {
        const updated = upsertLetter({
          ...letter,
          status: 'mailed',
          mailing: {
            provider: 'finely',
            providerId: r.providerId,
            createdAt: new Date().toISOString(),
            status: 'mailed',
            ...addr,
          },
        });
        onDisputeLetterMailed({ letter: updated, actor: 'partner' });
      } else if (r.ok) {
        upsertLetter({
          ...letter,
          status: 'mail_failed',
          mailing: {
            provider: 'finely',
            providerId: letter.mailing?.providerId,
            createdAt: letter.mailing?.createdAt ?? new Date().toISOString(),
            status: 'failed',
            lastError: 'Mail provider did not return a job reference — do not resend until status is confirmed.',
            ...addr,
          },
        });
      } else {
        upsertLetter({
          ...letter,
          status: 'mail_failed',
          mailing: {
            provider: 'finely',
            providerId: letter.mailing?.providerId,
            createdAt: letter.mailing?.createdAt ?? new Date().toISOString(),
            status: 'failed',
            lastError: r.error || 'Mailing failed',
            ...addr,
          },
        });
      }
    }
    const ok = results.filter((r) => r.ok);
    if (ok.length) {
      void notifyLetterMailed({
        partnerId: partner.id,
        partner,
        letterIds: ok.map((r) => r.letterId),
        letterTitles: ok.map((r) => letters.find((l) => l.id === r.letterId)?.title || r.letterId),
        providerIds: ok.map((r) => r.providerId || ''),
        to: ok[0]?.to,
        from: ok[0]?.from,
        actorEmail: actorEmail || undefined,
        actorRole: 'partner',
      });
    }
    setSelectedIds(new Set());
    bumpLetters();
  };

  const toggleArchive = (l: LetterRecord) => {
    const phrase = view === 'archived' ? 'UNARCHIVE' : 'ARCHIVE';
    const ok = window.prompt(`Type ${phrase} to confirm.`) === phrase;
    if (!ok) return;
    const updated = setLetterArchived({ letterId: l.id, archived: view !== 'archived' });
    if (!updated) return;
    addAuditEvent({
      partnerId: partner.id,
      actorType: 'partner',
      actorEmail: actorEmail || undefined,
      action: view === 'archived' ? 'letter.unarchived' : 'letter.archived',
      entityType: 'letter',
      entityId: l.id,
      meta: { type: l.type },
    });
    bumpLetters();
  };

  const defaultFromAddress = (() => {
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
  })();

  const queueRowAccent = (letter: LetterRecord, index: number): 'emerald' | 'violet' | 'sky' | 'rose' | 'fuchsia' => {
    if (letter.type === 'validation') return 'sky';
    if (letter.type === 'court') return 'rose';
    const meta = (letter.meta ?? {}) as Record<string, unknown>;
    if (meta.context === 'bankruptcy' || meta.templateCategory === 'bankruptcy') return 'violet';
    return (['fuchsia', 'emerald', 'sky', 'rose'] as const)[index % 4];
  };

  const renderQueueRow = (letter: LetterRecord, index: number) => {
    const active = selectedLetterId === letter.id;
    const accent = queueRowAccent(letter, index);
    const vaultStatus = letterVaultPrimaryStatus(letter);
    const bureau =
      letter.meta && typeof letter.meta === 'object' && 'bureau' in letter.meta
        ? String((letter.meta as { bureau?: Bureau }).bureau || '')
        : '';
    const bureauLabel =
      bureau === 'EXP' || bureau === 'EQF' || bureau === 'TUC' ? bureauFullName(bureau as Bureau) : bureau;
    return (
      <button
        key={letter.id}
        type="button"
        className="fc-vault-queue-row"
        data-accent={accent}
        data-active={active ? 'true' : 'false'}
        onClick={() => setSelectedLetterId(letter.id)}
      >
        <div className="fc-vault-queue-row-title">{letter.title}</div>
        <div className="fc-vault-queue-row-meta">
          <span className="fc-vault-status-chip" data-tone={vaultStatus.tone === 'blocked' ? 'blocked' : 'ok'}>
            {vaultStatus.label}
          </span>
          {bureauLabel ? <span className="fc-vault-queue-row-bureau">{bureauLabel}</span> : null}
        </div>
      </button>
    );
  };

  const renderVaultLetter = (l: LetterRecord, opts?: { inspector?: boolean }) => (
    <div key={l.id} className="relative">
      {canMail && l.pdfBlobRef && view === 'active' && !isLetterPhysicallyMailed(l) ? (
        <label className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/70 px-2 py-1 text-[10px] uppercase tracking-widest text-white/70">
          <input type="checkbox" checked={selectedIds.has(l.id)} onChange={() => toggleSelect(l.id)} />
          Select
        </label>
      ) : null}
      <SavedLetterCard
        id={`letter-${l.id}`}
        letter={l}
        highlighted={highlightId === l.id}
        defaultSnapshotOpen={Boolean(opts?.inspector)}
        autoOpenPreview={autoPreviewId === l.id}
        evidence={evidence}
        canMail={canMail && !isLetterDraft(l)}
        onOpenPdf={() => void openPdf(l)}
        onMail={() => {
          if (!l.pdfBlobRef || isLetterDraft(l)) return;
          const gate = canOpenMailModal(l);
          if (!gate.ok) {
            setMailGateErr(gate.reason || 'This letter cannot be mailed again.');
            return;
          }
          setMailGateErr(null);
          if (l.type === 'dispute') {
            const idGate = checkIdentityVaultGate(evidence);
            if (!idGate.ok) {
              setMailGateErr(
                `Upload government ID and proof of address in Documents Vault before mailing dispute letters. Missing: ${idGate.missing.map((m) => m.label).join(', ')}.`,
              );
              return;
            }
            const evGate = checkDisputeLetterEvidenceGate({ letter: l, evidence });
            if (!evGate.ok) {
              setMailGateErr(evGate.message);
              return;
            }
          }
          setMailLetter(l);
          setMailOpen(true);
        }}
        onArchive={() => toggleArchive(l)}
        pdfDisabled={!l.pdfBlobRef}
        mailDisabled={!l.pdfBlobRef || isLetterDraft(l) || isLetterPhysicallyMailed(l)}
        onResumeStudio={
          l.type === 'dispute' && !l.pdfBlobRef && studioDraftResume
            ? () => navigate(studioDraftResume)
            : undefined
        }
        onDelete={() => {
          const did = deleteLetter({ letterId: l.id });
          if (!did) return;
          addAuditEvent({
            partnerId: partner.id,
            actorType: 'partner',
            actorEmail: actorEmail || undefined,
            action: 'letter.deleted',
            entityType: 'letter',
            entityId: l.id,
            meta: { type: l.type, title: l.title },
          });
          bumpLetters();
        }}
        onMarkFinal={isLetterDraft(l) ? () => setMarkFinalLetter(l) : undefined}
      />
    </div>
  );

  return (
    <div
      className={FINELY_OS_COMPACT_PAGE}
      data-fc-partner-vault-workspace="1"
      data-fc-partner-vault-surface={surface}
      data-fc-letter-vault-ledger="1"
      data-surface-kind="letters-vault"
      data-surface-layout="queue-detail"
    >
      {mailOpen && mailLetter ? (
        <MailLetterModal
          open={mailOpen}
          partnerId={partner.id}
          letter={mailLetter}
          evidence={evidence}
          defaultFromName={partner.profile.fullName || 'Partner'}
          defaultFromAddress={defaultFromAddress}
          onClose={() => {
            setMailOpen(false);
            setMailLetter(null);
          }}
          onStatus={({ status: st, error, to, from }) => {
            upsertLetter({
              ...mailLetter,
              status: st,
              mailing: {
                provider: 'finely',
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
                provider: 'finely',
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
              actorEmail: actorEmail || undefined,
              action: 'letter.mailed',
              entityType: 'letter',
              entityId: updated.id,
              meta: { provider: 'finely', providerId, expectedDeliveryDate: expectedDeliveryDate ?? null },
            });
            onDisputeLetterMailed({ letter: updated, actor: 'partner' });
          }}
          onNotifyMailed={({ providerId, expectedDeliveryDate, to, from }) =>
            void notifyLetterMailed({
              partnerId: partner.id,
              partner,
              letterIds: [mailLetter.id],
              letterTitles: [mailLetter.title],
              providerIds: [providerId],
              to,
              from,
              expectedDeliveryDate,
              actorEmail: actorEmail || undefined,
              actorRole: 'partner',
            })
          }
          onNotifyReadyToMail={({ emailPartner: wantEmail }) => {
            if (!wantEmail) return;
            void notifyLetterLifecycle({
              partnerId: partner.id,
              partner,
              event: 'ready_to_mail',
              letterIds: [mailLetter.id],
              letterTitles: [mailLetter.title],
              emailPartner: true,
              actorEmail: actorEmail || undefined,
              actorRole: 'partner',
            });
          }}
          trackHref={navigation.vaultPath}
        />
      ) : null}
      {batchOpen ? (
        <BatchMailWizard
          open={batchOpen}
          partnerId={partner.id}
          letters={letters.filter((l) => !l.archivedAt)}
          defaultSelectedIds={[...selectedIds]}
          defaultFromName={partner.profile.fullName || 'Partner'}
          defaultFromAddress={defaultFromAddress}
          onClose={() => setBatchOpen(false)}
          onComplete={applyBatchResults}
        />
      ) : null}
      {markFinalLetter ? (
        <MarkLetterFinalModal
          open={Boolean(markFinalLetter)}
          title={markFinalLetter.title}
          withPdf={Boolean(markFinalLetter.pdfBlobRef)}
          emailPartner={markFinalEmail}
          onEmailPartnerChange={setMarkFinalEmail}
          emailHint="Sends one email when you mark this letter final — not on every edit."
          busy={markFinalBusy}
          onClose={() => setMarkFinalLetter(null)}
          onConfirm={() => void confirmMarkLetterFinal()}
        />
      ) : null}
      {!embedded ? (
        <button type="button" onClick={() => navigate(navigation.studioPath)} className={FINELY_OS_BACK_LINK} title="Back to Letter Studio">
          <ArrowLeft size={16} /> Letter Studio
        </button>
      ) : null}

      {!embedded ? (
      <header className="fc-vault-ledger-hero space-y-4">
        <div className="relative z-[1] flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="fc-vault-eyebrow">Letters vault</p>
            <h1 className="fc-vault-ledger-title">Stored PDFs &amp; mail tracking</h1>
            <p className="fc-vault-body">
              Select letters → confirm address → mail → track responses. Build new dispute letters in Letter Studio.
            </p>
          </div>
          <div className="relative z-[1] flex shrink-0 flex-wrap gap-2">
            <button type="button" onClick={() => navigate(navigation.documentsPath)} className={FINELY_OS_SECONDARY_BTN}>
              <Send size={14} /> Upload responses
            </button>
            <button type="button" onClick={() => navigate(navigation.studioPath)} className={FINELY_OS_SUCCESS_BTN}>
              <ScrollText size={14} /> Letter Studio
            </button>
          </div>
        </div>
        <div className="relative z-[1] grid gap-3 sm:grid-cols-3">
          {vaultKpis.map((kpi) => (
            <div key={kpi.label} className={`${finelyOsCatalogCard(kpi.accent)} !p-4 fc-surface-harmony`} data-accent={kpi.accent}>
              <div className="fc-vault-eyebrow">{kpi.label}</div>
              <div className="mt-2 fc-vault-stat-value">{kpi.value}</div>
              {kpi.hint ? <div className="mt-1 fc-vault-sublabel">{kpi.hint}</div> : null}
            </div>
          ))}
        </div>
      </header>
      ) : null}

      {canMail ? <MailProviderStatusBanner compact letterCount={selectedIds.size || 1} /> : null}
      {canMail && pdfReadyActive.length > 0 ? (
        <div className="fc-vault-sticky-bar sticky top-2 z-20 flex flex-wrap items-center justify-between gap-2" data-accent="violet">
          <span className="fc-vault-body text-sm">
            {selectedIds.size} selected · {pdfReadyActive.length} PDF-ready
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={FINELY_OS_SECONDARY_BTN}
              onClick={() => setSelectedIds(new Set(pdfReadyActive.map((l) => l.id)))}
            >
              Select all ready
            </button>
            <button
              type="button"
              className="fc-vault-action-btn"
              data-accent="violet"
              disabled={selectedIds.size === 0}
              onClick={() => setBatchOpen(true)}
            >
              <Send size={14} /> Mail selected
            </button>
          </div>
        </div>
      ) : null}

      {studioDraftResume ? (
        <div className="fc-vault-callout flex flex-wrap items-center justify-between gap-3" data-accent="violet">
          <div>
            <div className="fc-vault-callout-title">Letter draft in progress</div>
            <p className="fc-vault-body text-sm mt-1">Your bureau letter studio draft is saved — continue where you left off.</p>
          </div>
          <button type="button" className="fc-vault-action-btn" data-accent="violet" onClick={() => navigate(studioDraftResume)}>
            Resume Letter Studio
          </button>
        </div>
      ) : null}

      {draftLetters.length > 0 && view === 'active' && status !== 'generated' ? (
        <div className="fc-vault-callout space-y-3" data-accent="sky">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="fc-vault-callout-title">Drafts box</div>
              <p className="fc-vault-body text-sm mt-1">
                {draftLetters.length} work-in-progress letter{draftLetters.length === 1 ? '' : 's'} — edit freely, then mark as final when ready to send.
              </p>
            </div>
          </div>
          <FinelyOsPaginatedStack
            items={status === 'draft' ? filtered : draftLetters}
            pageSize={6}
            itemSpacingClassName="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
            emptyMessage="No draft letters."
            renderItem={(l) => renderVaultLetter(l)}
          />
        </div>
      ) : null}

      {mailGateErr ? (
        <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony text-sm text-rose-200 border border-rose-500/30 bg-rose-500/10`}>
          {mailGateErr}
        </div>
      ) : null}
      {openErr ? (
        <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony text-sm text-rose-200 border border-rose-500/30 bg-rose-500/10`}>
          {openErr}
        </div>
      ) : null}

      <div className="space-y-4">
        {!embedded ? (
          <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-4`} data-accent="sky">
            <div className="fc-vault-eyebrow">Next best action</div>
            <div className="fc-vault-body">Generate a new letter, download/print it, and then track it here after mailing.</div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => navigate(navigation.studioPath)} className={FINELY_OS_SUCCESS_BTN}>
                <ScrollText size={14} /> Resume letters
              </button>
              <button
                type="button"
                onClick={() => navigate(navigation.documentsPath)}
                className={FINELY_OS_SECONDARY_BTN}
                title="Upload bureau responses and any supporting documents"
              >
                <Send size={14} /> Upload response documents
              </button>
            </div>
          </div>
        ) : null}

          <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`} data-accent="violet">
            <div className="flex items-center gap-2">
              <ScrollText size={18} className="text-violet-500" />
              <span className="fc-vault-eyebrow normal-case tracking-wider">Letters</span>
              <span className="ml-2 fc-vault-sublabel">
                {filtered.length} shown / {letters.length} total
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className={FINELY_OS_VIEW_TABS}>
                <button type="button" onClick={() => setView('active')} className={finelyOsViewTab(view === 'active', 'emerald')}>
                  Active ({counts.active})
                </button>
                <button type="button" onClick={() => setView('archived')} className={finelyOsViewTab(view === 'archived', 'emerald')}>
                  Archived ({counts.archived})
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="fc-vault-eyebrow">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as any)} className={FINELY_OS_ENTITY_SELECT}>
                  {STATUS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              {[
                {
                  label: 'Bureaus',
                  value: (view === 'archived' ? counts.archivedByType.dispute : counts.activeByType.dispute) ?? 0,
                  accent: 'violet' as const,
                },
                {
                  label: 'Validation / DV',
                  value: (view === 'archived' ? counts.archivedByType.validation : counts.activeByType.validation) ?? 0,
                  accent: 'fuchsia' as const,
                },
                {
                  label: 'Court',
                  value: (view === 'archived' ? counts.archivedByType.court : counts.activeByType.court) ?? 0,
                  accent: 'rose' as const,
                },
                {
                  label: 'Bankruptcy',
                  value: filtered.filter((l) => {
                    const meta = (l.meta ?? {}) as Record<string, unknown>;
                    return meta.context === 'bankruptcy' || meta.templateCategory === 'bankruptcy';
                  }).length,
                  accent: 'sky' as const,
                },
              ].map((stat) => (
                <div key={stat.label} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`} data-accent={stat.accent}>
                  <div className="fc-vault-eyebrow">{stat.label}</div>
                  <div className="mt-2 fc-vault-stat-value">{stat.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 fc-vault-queue-detail grid gap-6 lg:grid-cols-[minmax(300px,360px)_1fr] items-start">
              <aside className="fc-vault-queue-panel min-w-0 space-y-3" aria-label="Letter queue">
                <div className="fc-vault-eyebrow">Letter queue</div>
                {queueLetters.length === 0 ? (
                  <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`} data-accent="sky">
                    <div className="fc-vault-body">
                      {status === 'draft' ? 'No draft letters in this view yet.' : 'No final letters in this view yet.'}
                    </div>
                  </div>
                ) : (
                  <FinelyOsPaginatedStack
                    items={queueLetters}
                    pageSize={12}
                    itemSpacingClassName="space-y-2"
                    emptyMessage="No letters match this filter."
                    renderItem={(letter, index) => renderQueueRow(letter, index)}
                  />
                )}
              </aside>

              <div className="fc-vault-detail-panel min-w-0 space-y-3" aria-label="Selected letter detail">
                <div className="fc-vault-eyebrow">Letter detail</div>
                {selectedLetter ? (
                  renderVaultLetter(selectedLetter, { inspector: true })
                ) : (
                  <div className={`${finelyOsCatalogCard('violet')} !p-6 lg:!p-8 fc-surface-harmony`} data-accent="violet">
                    <div className="fc-vault-callout-title">Pick a letter</div>
                    <p className="fc-vault-body text-base mt-2">
                      Select a saved letter from the queue to preview PDFs, mail, archive, or resume in Letter Studio.
                    </p>
                    <button type="button" onClick={() => navigate(navigation.studioPath)} className={`${FINELY_OS_SUCCESS_BTN} mt-4`}>
                      <ScrollText size={14} /> Open Letter Studio
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}
