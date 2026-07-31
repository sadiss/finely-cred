import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, ScrollText, Send, Archive } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { listLettersByPartner, setLetterArchived, upsertLetter } from '../../data/lettersRepo';
import { listEvidenceByPartner } from '../../data/evidenceRepo';
import { listCreditAnalysisReportsByPartner } from '../../data/creditAnalysisReportsRepo';
import { CreditAnalysisDeliverableStrip } from '../../components/reports/CreditAnalysisDeliverableCard';
import { openBlobRefInNewTab } from '../../lib/openBlobRef';
import type { LetterRecord, LetterStatus } from '../../domain/letters';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { MailLetterModal } from '../../components/letters/MailLetterModal';
import { BatchMailWizard, type BatchMailItemResult } from '../../components/letters/BatchMailWizard';
import { SavedLetterCard } from '../../components/letters/SavedLetterCard';
import { MailProviderStatusBanner } from '../../components/mailing/MailProviderStatusBanner';
import { notifyLetterMailed } from '../../lib/letterMailedNotify';
import { notifyLetterLifecycle } from '../../lib/letterLifecycleNotify';
import { loadLettersCommandCenterDraft } from '../../data/lettersCommandCenterDraftRepo';
import { letterStudioResumeUrl } from '../../lib/letterStudioResume';
import { bureauFullName } from '../../utils/bureaus';
import type { Bureau } from '../../domain/creditReports';
import { addAuditEvent } from '../../data/auditRepo';
import { checkDisputeLetterEvidenceGate } from '../../lib/evidenceGates';
import { checkIdentityVaultGate } from '../../lib/documentVaultGates';
import { onDisputeLetterMailed } from '../../lib/disputeRoundEngine';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyUnifiedHubLayout, FinelyUnifiedSection } from '../../features/unified/FinelyUnifiedHubLayout';
import {
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_ACCENT_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

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
  const { partner } = usePartnerSession();
  const letters = useMemo(() => (partner ? listLettersByPartner(partner.id) : []), [partner]);
  const analysisReports = useMemo(() => {
    if (!partner) return [];
    return listCreditAnalysisReportsByPartner(partner.id);
  }, [partner]);
  const [status, setStatus] = useState<LetterStatus | 'all'>('all');
  const [mailOpen, setMailOpen] = useState(false);
  const [mailLetter, setMailLetter] = useState<LetterRecord | null>(null);
  const [batchOpen, setBatchOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [autoPreviewId, setAutoPreviewId] = useState<string | null>(null);
  const [view, setView] = useState<'active' | 'archived'>('active');
  const [mailGateErr, setMailGateErr] = useState<string | null>(null);
  const [openErr, setOpenErr] = useState<string | null>(null);
  type VaultTab = 'letters' | 'analysis';
  const [hubTab, setHubTab] = useState<VaultTab>('letters');
  const evidence = useMemo(() => (partner ? listEvidenceByPartner(partner.id) : []), [partner]);

  const studioDraftResume = useMemo(() => {
    if (!partner) return null;
    const draft = loadLettersCommandCenterDraft(partner.id);
    if (!draft?.selectedDisputes?.length) return null;
    return letterStudioResumeUrl(draft);
  }, [partner, letters.length]);

  useEffect(() => {
    try {
      const sp = new URLSearchParams(location.search || '');
      const id = (sp.get('letterId') || '').trim();
      const preview = sp.get('preview') === '1';
      if (!id) return;
      setStatus('all');
      setHighlightId(id);
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
    const isBankruptcy = (l: LetterRecord) => {
      const meta = (l.meta ?? {}) as Record<string, unknown>;
      return meta.context === 'bankruptcy' || meta.templateCategory === 'bankruptcy';
    };
    const byType = (t: LetterRecord['type']) => filtered.filter((l) => l.type === t && !isBankruptcy(l));
    const dispute = byType('dispute');
    const validation = byType('validation');
    const court = byType('court');
    const bankruptcy = filtered.filter(isBankruptcy);
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
      { id: 'dispute', label: 'Bureaus', letters: dispute, disputeByBureau },
      { id: 'validation', label: 'Validation / DV', letters: validation },
      { id: 'court', label: 'Court / Affidavit', letters: court },
      { id: 'bankruptcy', label: 'Bankruptcy', letters: bankruptcy },
    ] as const;
  }, [filtered]);

  const vaultKpis = useMemo(
    () => [
      { label: 'Active', value: String(counts.active), hint: 'In vault', accent: 'emerald' as const },
      { label: 'Archived', value: String(counts.archived), hint: 'Stored', accent: 'violet' as const },
      { label: 'Shown', value: String(filtered.length), hint: 'Current filter', accent: 'amber' as const },
      { label: 'Analysis PDFs', value: String(analysisReports.length), hint: 'Saved reports', accent: 'sky' as const },
    ],
    [counts, filtered.length, analysisReports.length],
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

  const openEvidencePdf = async (e: any) => {
    setOpenErr(null);
    const ref = String(e?.blobRef || '').trim();
    if (!ref) {
      setOpenErr('No file reference on this document.');
      return;
    }
    const result = await openBlobRefInNewTab({ blobRef: ref, mimeType: 'application/pdf' });
    if (!result.ok) setOpenErr(result.message);
  };

  const canMail = isFeatureEnabled('letterMailing');
  const pdfReadyActive = useMemo(
    () => letters.filter((l) => !l.archivedAt && Boolean(l.pdfBlobRef)),
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
    if (!partner) return;
    for (const r of results) {
      const letter = letters.find((l) => l.id === r.letterId);
      if (!letter) continue;
      const addr = {
        to: r.to || letter.mailing?.to || { name: '', addressLine1: '', city: '', state: '', zip: '' },
        from: r.from || letter.mailing?.from || { name: '', addressLine1: '', city: '', state: '', zip: '' },
      };
      if (r.ok) {
        const updated = upsertLetter({
          ...letter,
          status: 'mailed',
          mailing: {
            provider: 'finely',
            providerId: r.providerId || letter.mailing?.providerId || 'batch',
            createdAt: new Date().toISOString(),
            status: 'mailed',
            ...addr,
          },
        });
        onDisputeLetterMailed({ letter: updated, actor: 'partner' });
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
        actorEmail: email || undefined,
        actorRole: 'partner',
      });
    }
    setSelectedIds(new Set());
    navigate(0);
  };

  const toggleArchive = (l: LetterRecord) => {
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
  };

  const renderVaultLetter = (l: LetterRecord) => (
    <div key={l.id} className="relative">
      {canMail && l.pdfBlobRef && view === 'active' ? (
        <label className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/70 px-2 py-1 text-[10px] uppercase tracking-widest text-white/70">
          <input type="checkbox" checked={selectedIds.has(l.id)} onChange={() => toggleSelect(l.id)} />
          Select
        </label>
      ) : null}
      <SavedLetterCard
        id={`letter-${l.id}`}
        letter={l}
        highlighted={highlightId === l.id}
        autoOpenPreview={autoPreviewId === l.id}
        evidence={evidence}
        canMail={canMail}
        onOpenPdf={() => void openPdf(l)}
        onMail={() => {
          if (!l.pdfBlobRef) return;
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
        mailDisabled={!l.pdfBlobRef}
        onResumeStudio={
          l.type === 'dispute' && !l.pdfBlobRef && studioDraftResume
            ? () => navigate(studioDraftResume)
            : undefined
        }
      />
    </div>
  );

  return (
    <PageShell
      badge="Partner Portal"
      title="Letters Vault"
      subtitle="Stored letters (PDF) with status tracking. This is your permanent letter archive."
    >
      {!partner ? (
        <div className={FINELY_OS_PAGE}>
          <div className={`${FINELY_OS_LUXURY_EMPTY} text-left`}>No partner profile found for this account.</div>
          <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_PRIMARY_BTN}>
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      ) : (
        <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.letters]}>
          <div className={`${FINELY_OS_COMPACT_PAGE} max-w-6xl`}>
          {mailOpen && mailLetter ? (
            <MailLetterModal
              open={mailOpen}
              partnerId={partner.id}
              letter={mailLetter}
              evidence={evidence}
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
                  actorEmail: email || undefined,
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
                  actorEmail: email || undefined,
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
                  actorEmail: email || undefined,
                  actorRole: 'partner',
                });
              }}
              trackHref="/portal/letters/vault"
            />
          ) : null}
          {batchOpen ? (
            <BatchMailWizard
              open={batchOpen}
              partnerId={partner.id}
              letters={letters.filter((l) => !l.archivedAt)}
              defaultSelectedIds={[...selectedIds]}
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
              onClose={() => setBatchOpen(false)}
              onComplete={applyBatchResults}
            />
          ) : null}
          <button type="button" onClick={() => navigate('/portal/letters')} className={FINELY_OS_BACK_LINK} title="Back to Letter Studio">
            <ArrowLeft size={16} /> Letter Studio
          </button>
          <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
            First-timer mail path: Select letters → Confirm address → Mail → Track. Open Letter Studio to build more PDFs.
          </p>
          {canMail ? <MailProviderStatusBanner compact letterCount={selectedIds.size || 1} /> : null}
          {canMail && pdfReadyActive.length > 0 ? (
            <div className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/30 bg-black/70 px-3 py-2 backdrop-blur">
              <span className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
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
                  className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60`}
                  disabled={selectedIds.size === 0}
                  onClick={() => setBatchOpen(true)}
                >
                  <Send size={14} /> Mail selected
                </button>
              </div>
            </div>
          ) : null}

          {studioDraftResume ? (
            <div className={`${finelyOsCatalogCard('amber')} !p-4 flex flex-wrap items-center justify-between gap-3`}>
              <div>
                <div className="text-sm font-semibold text-amber-50">Letter draft in progress</div>
                <p className={`${FINELY_OS_ENTITY_BODY} text-sm mt-1`}>Your bureau letter studio draft is saved — continue where you left off.</p>
              </div>
              <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate(studioDraftResume)}>
                Resume Letter Studio
              </button>
            </div>
          ) : null}

          {mailGateErr ? <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony text-sm text-rose-200 border border-rose-500/30 bg-rose-500/10`}>{mailGateErr}</div> : null}
          {openErr ? <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony text-sm text-rose-200 border border-rose-500/30 bg-rose-500/10`}>{openErr}</div> : null}

          <FinelyUnifiedHubLayout
            eyebrow="Letters vault"
            title="Stored PDFs & mail tracking"
            subtitle="Bureau, validation, court, and bankruptcy letters — plus saved analysis reports."
            accent="emerald"
            kpis={vaultKpis}
            tabs={[
              { id: 'letters', label: 'Letters', badge: filtered.length || undefined },
              { id: 'analysis', label: 'Analysis reports', badge: analysisReports.length || undefined },
            ]}
            activeTab={hubTab}
            onTabChange={(id) => setHubTab(id as VaultTab)}
            primaryAction={{ label: 'Letter Studio', onClick: () => navigate('/portal/letters') }}
            secondaryAction={{ label: 'Upload responses', onClick: () => navigate('/portal/documents') }}
          >
            {hubTab === 'letters' && (
              <div className="space-y-4">
          <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-4`}>
            <div className={FINELY_OS_ENTITY_LABEL}>Next best action</div>
            <div className={FINELY_OS_ENTITY_BODY}>Generate a new letter, download/print it, and then track it here after mailing.</div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => navigate('/portal/letters')} className={FINELY_OS_SUCCESS_BTN}>
                <ScrollText size={14} /> Resume letters
              </button>
              <button type="button" onClick={() => navigate('/portal/documents')} className={FINELY_OS_SECONDARY_BTN} title="Upload bureau responses and any supporting documents">
                <Send size={14} /> Upload response documents
              </button>
            </div>
          </div>

          <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
            <div className="flex items-center gap-2 text-violet-300">
              <ScrollText size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Letters</span>
              <span className={`ml-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
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
                <label className={FINELY_OS_ENTITY_LABEL}>Status</label>
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
                { label: 'Bureaus', value: (view === 'archived' ? counts.archivedByType.dispute : counts.activeByType.dispute) ?? 0, accent: 'violet' as const },
                { label: 'Validation / DV', value: (view === 'archived' ? counts.archivedByType.validation : counts.activeByType.validation) ?? 0, accent: 'amber' as const },
                { label: 'Court', value: (view === 'archived' ? counts.archivedByType.court : counts.activeByType.court) ?? 0, accent: 'rose' as const },
                { label: 'Bankruptcy', value: filtered.filter((l) => {
                  const meta = (l.meta ?? {}) as Record<string, unknown>;
                  return meta.context === 'bankruptcy' || meta.templateCategory === 'bankruptcy';
                }).length, accent: 'sky' as const },
              ].map((stat) => (
                <div key={stat.label} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                  <div className={FINELY_OS_ENTITY_LABEL}>{stat.label}</div>
                  <div className={`mt-2 text-2xl font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{stat.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-4">
              {filtered.length === 0 ? (
                <div className={FINELY_OS_ENTITY_BODY}>No letters in this view yet.</div>
              ) : (
                groups.map((g) => (
                  <details key={g.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony overflow-hidden`} open>
                    <summary className="cursor-pointer select-none px-5 py-4 flex items-center justify-between gap-3 hover:bg-white/[0.04] transition-colors">
                      <div className="min-w-0">
                        <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{g.label}</div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                          {g.letters.length} letter{g.letters.length === 1 ? '' : 's'}
                        </div>
                      </div>
                      <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-sm`}>Show</div>
                    </summary>
                    <div className="p-5 pt-0">
                      {g.id === 'dispute' ? (
                        <div className="space-y-4">
                          {Object.entries((g as any).disputeByBureau as Record<string, LetterRecord[]>)
                            .sort((a, b) => a[0].localeCompare(b[0]))
                            .map(([bureau, arr]) => (
                              <details key={bureau} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony overflow-hidden`} open>
                                <summary className="cursor-pointer select-none px-5 py-4 flex items-center justify-between gap-3 hover:bg-white/[0.04] transition-colors">
                                  <div className={FINELY_OS_ENTITY_VALUE}>
                                    {bureau === 'EXP' || bureau === 'EQF' || bureau === 'TUC'
                                      ? bureauFullName(bureau as Bureau)
                                      : bureau}
                                  </div>
                                  <div className={FINELY_OS_ENTITY_SUBLABEL}>{arr.length}</div>
                                </summary>
                                <div className="p-5 pt-0">
                                  <FinelyOsPaginatedStack
                                    items={arr}
                                    pageSize={8}
                                    itemSpacingClassName="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                                    emptyMessage="No letters for this bureau."
                                    renderItem={(l) => renderVaultLetter(l)}
                                  />
                                </div>
                              </details>
                            ))}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <FinelyOsPaginatedStack
                            items={g.letters}
                            pageSize={8}
                            itemSpacingClassName="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                            emptyMessage="No letters in this group."
                            renderItem={(l) => renderVaultLetter(l)}
                          />
                        </div>
                      )}
                    </div>
                  </details>
                ))
              )}
            </div>
          </div>
              </div>
            )}

            {hubTab === 'analysis' && (
          <FinelyUnifiedSection title="Strategy reports" subtitle="Credit analysis PDFs — separate from dispute evidence.">
            <CreditAnalysisDeliverableStrip
              items={analysisReports}
              emptyHint="None yet. Generate one from Reports after uploading and parsing a credit file."
            />
          </FinelyUnifiedSection>
            )}
          </FinelyUnifiedHubLayout>

          <FinelyOsPageFooter />
          </div>
        </EntitlementGate>
      )}
    </PageShell>
  );
}

