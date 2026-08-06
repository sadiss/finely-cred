import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, ExternalLink, FileText, Gavel, Image as ImageIcon, Lock, PenLine, Scale, ScrollText, Send, ShieldAlert, Sparkles, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Bureau, ParsedCreditReport } from '../../domain/creditReports';
import type { Partner } from '../../domain/partners';
import { PageShell } from '../layout/PageShell';
import { listReportsByPartner } from '../../data/reportsRepo';
import { listEvidenceByPartner, upsertEvidence, deleteEvidence } from '../../data/evidenceRepo';
import { EvidencePickerModal } from '../evidence/EvidencePickerModal';
import { LetterStepPath, type LetterStepPathItem } from './LetterStepPath';
import { LetterBureauTabs } from './LetterBureauTabs';
import { LetterAddressSummary, LetterDisclaimerFooter } from './LetterAddressSummary';
import { DebtTrackEasyFlow } from './DebtTrackEasyFlow';
import { LetterEasyFlowShell } from './LetterEasyFlowShell';
import { buildLetterStudioTrackTabs, LetterTrackTabs } from './LetterTrackTabs';
import {
  buildDebtLetterPathSteps,
  runDebtLetterStep,
  type DebtLetterStepId,
  type DebtLetterTrack,
} from '../../lib/letterDebtFlow';
import { resolveDebtDraftBaseTitle, resolveDebtDraftTitle } from '../../lib/resolveDebtDraftTitle';
import { isValidDisputeBuildStep } from '../../lib/letterStudioResume';
import { identityPacketStatus } from '../../lib/identityEvidence';
import { deriveTradelineContradictions, getDisputeReasonsLibraryAsText, suggestDisputeReasons, suggestDisputeReasonsForCandidate } from '../../creditReports/disputeReasons';
import { buildEnrichedReasonsForCandidate, buildCaseContextBlock } from '../../lib/disputeLetterBuilder';
import { filterFactualDisputeReasons, pickBestDisputeReasons } from '../../creditReports/disputeFactualReasons';
import { buildDisputeReasonsWithAi } from '../../lib/disputeReasonAi';
import { DisputeReasonsLibraryPanel } from './DisputeReasonsLibraryPanel';
import { downloadInlineDisputeLetterPdf, type DisputeLetterItem } from '../../letters/generateDisputePdfInline';
import { buildFiveStepDisputeIntro, buildFiveStepItemPreamble, dominantNegativeTypeFromCandidates } from '../../letters/disputeFiveStepLetter';
import { listLettersByPartner, upsertLetter } from '../../data/lettersRepo';
import { getCourtOutcomeByDebtCase } from '../../data/courtOutcomeRepo';
import { addAuditEvent } from '../../data/auditRepo';
import { newId } from '../../utils/ids';
import { addRoundToCase, createDisputeCase, getCase, listCasesByPartner } from '../../data/casesRepo';
import { suggestNextRound, DISPUTE_ROUND_ORDER, INTER_ROUND_GUIDANCE, type DisputeRoundLabel } from '../../domain/disputeWorkflow';
import { addDaysIso, candidateToCaseItem, nowIso } from '../../domain/cases';
import { createTask, listTasksByPartner } from '../../data/tasksRepo';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { hasEntitlement } from '../../data/billingRepo';
import { listDebtByPartner, upsertDebt } from '../../data/debtRepo';
import { listProcessedDocumentsByPartner } from '../../data/documentsRepo';
import {
  buildSummonsAffidavitContext,
  captureSenderSnapshot,
  contactsFromParsedReport,
  extractReportDebtSignals,
  formatSummonsContextForPrompt,
  matchCreditorContactForName,
  resolveDebtPartyInfo,
} from '../../lib/debtCreditorIntel';
import { selfIdentityFromPersonalInfo, type SelfPartyIdentity } from '../../creditReports/creditorContactExtract';
import { ValidationCenterView } from '../debt/ValidationCenterView';
import { AffidavitCourtCenterView } from '../debt/AffidavitCourtCenterView';
import { ExtractedCourtFactsPanel } from '../debt/ExtractedCourtFactsPanel';
import { BankruptcyLetterStudioPanel } from './BankruptcyLetterStudioPanel';
import { ForeclosureCenterView } from '../debt/ForeclosureCenterView';
import { RepossessionCenterView } from '../debt/RepossessionCenterView';
import { generateCatalogLetterBody } from '../../legal/generateCatalogLetter';
import { catalogEntryById } from '../../legal/debtLetterCatalog';
import { letterTrackFamily } from '../../lib/letterProductLabels';
import { DebtLetterRichDraftWorkspace } from './DebtLetterPreview';
import { SmartProofUploader } from '../evidence/SmartProofUploader';
import { DEBT_LETTER_SPECS, SCENARIO_RECOMMENDATIONS, recommendScenarioFromDebt, getLetterBody } from '../../legal/debtLetterTemplates';
import type { DebtLetterType, DebtScenario } from '../../domain/debtLegal';
import { EntitlementGate } from '../billing/EntitlementGate';
import { generateTextPdfToVault } from '../../letters/generateTextPdf';
import { TEMPLATE_BASES } from '../../templates';
import { TEMPLATE_VARIANTS, TEMPLATE_TONES } from '../../templates/variants';
import type { TemplateTone, TemplateVariantRecipe } from '../../domain/templates';
import { renderTemplate } from '../../templates/render';
import { DisputePickerModal, type SelectedDispute } from '../disputes/DisputePickerModal';
import { rankEvidenceMatches, scoreEvidenceForAccount, evidenceMatchesAccount, describeEvidenceMismatch, EVIDENCE_MATCH_ATTACH_MIN } from '../../utils/evidenceMatch';
import { findMatchingTradeline } from '../../lib/captureTradelineEvidenceScreenshot';
import type { EvidencePickerAccount } from '../evidence/EvidencePickerModal';
import { formatNumberedDisputeReasons, DISPUTE_DELETE_NOW } from '../../letters/disputeLetterFormat';
import {
  clearLettersCommandCenterDraft,
  loadLettersCommandCenterDraft,
  saveLettersCommandCenterDraft,
} from '../../data/lettersCommandCenterDraftRepo';
import { TemplatesVaultPanel } from '../templates/TemplatesVaultPanel';
import type { TemplateVaultItem } from '../../domain/templateVault';
import { createTemplateVaultItem, defaultRequiredEntitlementsForCategory, getTemplateVaultItem } from '../../data/templateVaultRepo';
import { readActiveTemplateIdFromSession } from '../templates/TemplateLibraryHub';
import { LetterDisputeCoachStrip } from './LetterDisputeCoachStrip';
import { bureauDisputeAddress, SUBJECT_LINE } from '../../letters/disputeLetterTemplate';
import { getBlobUrl } from '../../storage/getBlobUrl';
import { openBlobRefInNewTab } from '../../lib/openBlobRef';
import { isLegacyPendingReportBlob } from '../../lib/legacyPendingReport';
import { PartnerCreditWorkloadStrip } from '../partner/PartnerCreditWorkloadStrip';
import { downloadBlob, downloadText, openUrlInNewTab, triggerBrowserDownload } from '../../utils/download';
import { RichTextEditor } from '../ui/RichTextEditor';
import { htmlToPlainText, isProbablyHtml, plainTextToHtml, sanitizeHtmlForPreview } from '../../utils/richText';
import { callAiGateway } from '../../lib/aiClient';
import { extractFirstJsonObject } from '../../utils/jsonExtract';
import { canUseAiDraft } from '../../billing/aiDraftAccess';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { classifyCandidateNegativeType, NEGATIVE_PLAYBOOKS, type NegativeType } from '../../creditReports/negativePlaybooks';
import {
  aggregateLetterLaws,
  letterCitationsToPromptLines,
  makeCustomLetterCitation,
  resolveBureauDisputeLaws,
  type LetterCitation,
} from '../../domain/bureauDisputeLawResolver';
import { letterCategoryForCandidate } from '../../creditReports/letterCategory';
import { getCustomFieldValues } from '../../data/customFieldValuesRepo';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import { injectPrintSafeCss } from './paperPreviewSrcDoc';
import {
  hasCompleteLetterMailingAddress,
  highlightMissingLetterPlaceholders,
  letterDateDisplay,
  resolveCityStateZip,
  senderPreviewLines,
} from '../../lib/letterSenderBlock';
import { resolveLetterMailRecipient } from '../../lib/letterMailingAddress';
import {
  enrichRecipientAddress,
  enrichmentToDebtPatch,
  type AddressEnrichmentResult,
} from '../../lib/recipientAddressEnrichment';
import { notifyLetterLifecycle } from '../../lib/letterLifecycleNotify';
import { LetterEmailPartnerToggle } from './LetterEmailPartnerToggle';
import { getNotificationPrefs } from '../../data/notificationPrefsRepo';
import { LetterEscalationPanel } from './LetterEscalationPanel';
import { getCanonicalPartnerIdentity } from '../../utils/canonicalPartnerIdentity';
import { bureauFullName, bureauShortCode } from '../../utils/bureaus';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_BANNER,
  FINELY_OS_DANGER_BTN,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_VIEW_TABS,
  FINELY_OS_FIXED_OVERLAY,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_AI_DRAFT_BTN_SM,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

const LCC_AI_DRAFT_BTN =
  'inline-flex items-center gap-2 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-fuchsia-100 hover:bg-fuchsia-500/15 transition-all disabled:opacity-60 disabled:cursor-not-allowed';

const LCC_AI_DRAFT_BTN_SM =
  'inline-flex items-center gap-2 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-fuchsia-100 hover:bg-fuchsia-500/15 transition-all disabled:opacity-60';

const LCC_MODAL_SHELL = `${finelyOsCatalogCard('violet')} !p-0 overflow-hidden shadow-2xl flex flex-col`;

export type LettersStudioTab = 'dispute' | 'validation' | 'court' | 'foreclosure' | 'repossession' | 'bankruptcy' | 'templates';
type TabKey = LettersStudioTab;
type LetterTone = 'formal' | 'neutral' | 'conversational';
type LetterRound = DisputeRoundLabel;

function requiredPackKeyForNegativeType(nt: NegativeType): string | null {
  if (nt === 'bankruptcy') return ENTITLEMENT_KEYS.packBankruptcy;
  if (nt === 'repossession') return ENTITLEMENT_KEYS.packRepossession;
  if (nt === 'foreclosure') return ENTITLEMENT_KEYS.packForeclosure;
  if (nt === 'student_loan') return ENTITLEMENT_KEYS.packStudentLoans;
  if (nt === 'inquiry') return ENTITLEMENT_KEYS.packInquiries;
  return null;
}

function safeText(v: any) {
  const s = String(v ?? '').trim();
  return s || '';
}

function tabBtn(active: boolean) {
  return finelyOsViewTab(active, 'emerald');
}

function safePartnerName(name: string) {
  return (name || 'Partner').replace(/[^\w\-]+/g, '_').replace(/^_+|_+$/g, '');
}

type DebtDraftTrack = 'validation' | 'court' | 'foreclosure' | 'repossession';

function letterTypeForDebtDraft(track: DebtDraftTrack): import('../../domain/letters').LetterType {
  return track === 'validation' ? 'validation' : 'court';
}

/**
 * Draft tagging follows the letter, not the open tab. Drafting a court answer from the
 * Validation tab must still be stored (and labelled) as court work — and vice versa.
 */
function resolveDebtDraftTrack(args: {
  catalogId?: string;
  specId?: string;
  fallback: DebtDraftTrack;
}): DebtDraftTrack {
  const entry = args.catalogId ? catalogEntryById(args.catalogId) : undefined;
  const category = entry?.category;
  if (category === 'court' || category === 'securitization') return 'court';
  if (category === 'foreclosure') return 'foreclosure';
  if (category === 'repossession') return 'repossession';
  if (category === 'validation' || category === 'negotiation') return 'validation';
  const family = letterTrackFamily({
    catalogId: args.catalogId,
    letterType: args.specId || entry?.letterType,
    category,
  });
  if (family === 'court') return 'court';
  // Bureau / furnisher letters are mailed dispute letters, never court filings.
  if (family === 'validation' || family === 'credit') return 'validation';
  return args.fallback;
}

function metaForDebtDraft(
  draft: { type: DebtDraftTrack; specId: string; catalogId?: string },
  debt: { id?: string } | null | undefined,
  scenario: string,
): import('../../domain/letters').ValidationLetterMeta | import('../../domain/letters').CourtLetterMeta {
  const common = {
    context: 'debt' as const,
    debtId: debt?.id,
    letterSpecId: draft.specId,
    scenario,
    ...(draft.catalogId ? { catalogId: draft.catalogId, debtTrack: draft.type } : {}),
  };
  if (draft.type === 'court' || draft.type === 'foreclosure' || draft.type === 'repossession') {
    return {
      ...common,
      courtCaseNumber: (debt as { courtCaseNumber?: string })?.courtCaseNumber,
      jurisdictionState: (debt as { stateJurisdiction?: string })?.stateJurisdiction,
    };
  }
  return common;
}

const GENERIC_REASON_MARKERS = [
  'the information appears inaccurate, incomplete',
  'provide the method of verification used',
  'if you cannot verify the item as reported',
];

function isGenericDisputeReason(text: string): boolean {
  const n = text.toLowerCase();
  if (GENERIC_REASON_MARKERS.some((m) => n.includes(m))) return true;
  return filterFactualDisputeReasons([text]).length === 0;
}

function pickAutoReasonTexts(suggestions: { text: string }[], count = 8): string[] {
  const texts = pickBestDisputeReasons(
    suggestions.map((s) => s.text.trim()).filter(Boolean),
    count * 2,
  );
  return texts.slice(0, count);
}

function renderDisputeSnapshotHtml(args: {
  bureau: Bureau;
  round: string;
  tone: string;
  intro?: string;
  items: DisputeLetterItem[];
  sender?: { name?: string; addressLine1?: string; addressLine2?: string; cityStateZip?: string };
  bureauAddress?: { name: string; lines: string[] };
  subjectLine?: string;
}) {
  const esc = (s: string) =>
    (s || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');

  const senderName = (args.sender?.name || '').trim() || 'â€”';
  const senderLines = [senderName, args.sender?.addressLine1, args.sender?.addressLine2, args.sender?.cityStateZip]
    .map((x) => String(x || '').trim())
    .filter(Boolean);
  const bureauAddr = args.bureauAddress ?? bureauDisputeAddress(args.bureau);
  const subject = (args.subjectLine || '').trim() || SUBJECT_LINE;

  const introHtml = (args.intro || '').trim()
    ? `<div style="margin-top:10px;color:rgba(255,255,255,0.75);font-size:12px;line-height:1.6;white-space:pre-wrap">${esc(args.intro || '')}</div>`
    : '';

      const itemsHtml = (args.items || [])
    .map((it, idx) => {
      const reasons = formatNumberedDisputeReasons(it.reasons ?? []);
      const narrative = (it.narrative || '').trim();
      const preamble = buildFiveStepItemPreamble({
        candidate: it.candidate,
        round: args.round,
        exhibitLabel: it.evidence?.filename ? 'Exhibit 1' : 'Exhibit A',
      });
      const evName = (it.evidence?.filename || '').trim();
      return `
        <div style="margin-top:12px;padding:12px;border:1px solid rgba(255,255,255,0.08);border-radius:14px;background:rgba(255,255,255,0.02)">
          <div style="font-weight:700;color:#fff">${idx + 1}. ${esc(it.candidate.account)} â€” ${esc(it.candidate.type)}</div>
          <div style="margin-top:4px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.45);font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono','Courier New', monospace;">
            bureau: ${esc(bureauShortCode(it.candidate.bureau as any))} â€¢ code: ${esc(it.candidate.code)} â€¢ request: ${esc(it.candidate.status)}
          </div>
          <div style="margin-top:6px;color:rgba(255,255,255,0.55);font-size:11px;line-height:1.5">${esc(preamble)}</div>
          ${
            evName
              ? `<div style="margin-top:8px;color:rgba(255,255,255,0.7);font-size:12px">
                   Evidence: <span style="color:rgba(255,255,255,0.85);font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono','Courier New', monospace;">${esc(evName)}</span>
                 </div>`
              : ''
          }
          
          ${
            reasons.length
              ? `<div style="margin-top:8px;color:rgba(255,255,255,0.7);font-size:12px">Factual dispute reasons:</div>
                 <ol style="margin-top:6px;color:rgba(255,255,255,0.75);font-size:12px;line-height:1.6;padding-left:18px">
                   ${reasons.map((r) => `<li>${esc(r.replace(/^\d+\.\s*/, ''))}</li>`).join('')}
                 </ol>
                 <div style="margin-top:10px;font-weight:700;letter-spacing:0.08em">${esc(DISPUTE_DELETE_NOW)}</div>`
              : ''
          }
          ${
            narrative
              ? `<div style="margin-top:10px;color:rgba(255,255,255,0.7);font-size:12px">Narrative:</div>
                 <div style="margin-top:6px;color:rgba(255,255,255,0.75);font-size:12px;line-height:1.6;white-space:pre-wrap">${esc(narrative)}</div>`
              : ''
          }
        </div>
      `;
    })
    .join('\n');

  return `
    <div>
      <div style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.45)">Dispute letter snapshot</div>
      <div style="margin-top:6px;color:rgba(255,255,255,0.85);font-size:12px;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono','Courier New', monospace;">
        ${esc(bureauShortCode(args.bureau))} â€¢ ${esc(args.round)} â€¢ ${esc(args.tone)}
      </div>
      <div style="margin-top:10px;padding:12px;border:1px solid rgba(255,255,255,0.08);border-radius:14px;background:rgba(255,255,255,0.02)">
        <div style="display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start;justify-content:space-between">
          <div style="min-width:220px">
            <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.45)">Sender</div>
            <div style="margin-top:6px;color:rgba(255,255,255,0.85);font-size:12px;line-height:1.55">
              ${senderLines.map((l) => `<div>${esc(l)}</div>`).join('')}
            </div>
          </div>
          <div style="min-width:260px">
            <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.45)">Recipient</div>
            <div style="margin-top:6px;color:rgba(255,255,255,0.85);font-size:12px;line-height:1.55">
              <div style="font-weight:700">${esc(bureauAddr.name)}</div>
              ${bureauAddr.lines.map((l) => `<div>${esc(l)}</div>`).join('')}
            </div>
          </div>
        </div>
        <div style="margin-top:10px;color:rgba(255,255,255,0.85);font-size:12px;font-weight:700">${esc(subject)}</div>
      </div>
      ${introHtml}
      ${itemsHtml}
    </div>
  `;
}

function disputeToneForFiveStep(tone: LetterTone): 'formal' | 'neutral' | 'conversational' {
  if (tone === 'conversational') return 'conversational';
  if (tone === 'formal') return 'formal';
  return 'neutral';
}

function isStockDisputeIntro(text: string): boolean {
  const t = text.trim().toLowerCase();
  return (
    // Legacy free-guide Step 1–5 teaching blocks that must not stay in letter drafts
    /\bstep\s*[1-5]\s*[—\-:]/.test(t) ||
    t.includes('5-step dispute framework') ||
    t.includes('one clean target beats ten') ||
    t.includes('this letter applies only to the items listed below') ||
    t.includes('this letter applies only to the specific item') ||
    t.includes('this letter disputes only:') ||
    t.includes('each numbered reason below states one factual problem') ||
    t.includes('inaccurate information on my credit report is blocking')
  );
}

function defaultDisputeIntro(
  tone: LetterTone,
  negativeType: NegativeType = 'unknown',
  round = 'Round 1',
  accountLabel?: string,
  transferNote?: string,
) {
  return buildFiveStepDisputeIntro({
    tone: disputeToneForFiveStep(tone),
    negativeType,
    round,
    accountLabel,
    transferNote,
  });
}

function mergeTransferNote(intro: string, transferNote: string): string {
  const note = transferNote.trim();
  if (!note) return intro;
  const probe = note.slice(0, Math.min(24, note.length)).toLowerCase();
  if (probe && intro.toLowerCase().includes(probe)) return intro;
  return `${intro}\n\nPrior dispute history: ${note}`;
}

function defaultDisputeFooter(tone: LetterTone) {
  if (tone === 'formal') {
    return (
      `Please review the attached exhibits and numbered factual reasons. Delete any account or field that is reporting inaccurately as described. Send me an updated copy of my credit report showing what was deleted or corrected within the time period required by applicable law (typically 30 days).\n\n` +
      `Please do not sell, share, or disclose my personal information beyond what is required to process this dispute.`
    );
  }
  if (tone === 'conversational') {
    return (
      `Please review the exhibit and numbered reasons and delete what is reporting wrong. Send me an updated report in writing within the time required by law (typically 30 days).\n\n` +
      `Please do not share or sell my personal information beyond what is needed to handle this dispute.`
    );
  }
  return (
    `Please review the attached exhibits and numbered factual reasons and delete inaccurate reporting as described. Send written confirmation and an updated report within the time period required by applicable law (typically 30 days).\n\n` +
    `Please do not sell or share my personal information beyond what is required to process this dispute.`
  );
}

function ensureHtmlDraft(s: string) {
  const v = (s || '').trim();
  if (!v) return '<p></p>';
  return isProbablyHtml(v) ? v : plainTextToHtml(v);
}

function DisputeLetterPaperPreview({
  bureau,
  partnerName,
  sender,
  bureauAddress,
  subjectLine,
  introHtml,
  footerHtml,
  items,
  view = 'single',
}: {
  bureau: Bureau;
  partnerName: string;
  sender?: { name?: string; addressLine1?: string; addressLine2?: string; cityStateZip?: string };
  bureauAddress?: { name: string; lines: string[] };
  subjectLine?: string;
  introHtml: string;
  footerHtml: string;
  items: DisputeLetterItem[];
  /** single = one page at a time (best in side panel); spread = 2-up pages (book style). */
  view?: 'single' | 'spread';
}) {
  const [imgByKey, setImgByKey] = useState<Record<string, { url: string; revoke?: () => void }>>({});
  const [pageIndex, setPageIndex] = useState(0);

  const pages = useMemo(() => {
    // Cheap pagination heuristic: keep a true page-sized preview (no endless preview).
    // Items with evidence images consume more vertical space, so they get more weight.
    const cap = 6; // tuned for ~1 page at our preview sizes
    const out: Array<Array<{ it: DisputeLetterItem; idx: number }>> = [];
    let cur: Array<{ it: DisputeLetterItem; idx: number }> = [];
    let used = 0;
    for (let i = 0; i < (items || []).length; i++) {
      const it = items[i]!;
      const mime = String(it.evidence?.mimeType || '').toLowerCase();
      const w = mime.startsWith('image/') ? 2 : 1;
      if (cur.length > 0 && used + w > cap) {
        out.push(cur);
        cur = [];
        used = 0;
      }
      cur.push({ it, idx: i });
      used += w;
    }
    if (cur.length > 0 || out.length === 0) out.push(cur);
    return out;
  }, [items]);

  useEffect(() => {
    setPageIndex(0);
  }, [items.length]);

  useEffect(() => {
    let alive = true;
    const next: Record<string, { url: string; revoke?: () => void }> = {};
    const prev = imgByKey;

    const load = async () => {
      for (const it of items) {
        const key = it.candidate.id || it.candidate.account;
        const ref = it.evidence?.blobRef;
        const mime = it.evidence?.mimeType || '';
        const mimeLower = String(mime || '').toLowerCase();
        const filename = String(it.evidence?.filename || '');
        const looksLikeImage =
          mimeLower.startsWith('image/') ||
          (!mimeLower && /\.(png|jpe?g|webp|gif)$/i.test(filename));
        if (!ref || !looksLikeImage) continue;
        if (prev[key]) {
          next[key] = prev[key]!;
          continue;
        }
        const res = await getBlobUrl(ref, { mimeType: mime, preferSigned: true });
        if (!alive) {
          res?.revoke?.();
          continue;
        }
        if (res?.url) next[key] = { url: res.url, revoke: res.revoke };
      }
      if (!alive) return;
      // Revoke URLs we no longer need.
      for (const k of Object.keys(prev)) {
        if (!next[k]) prev[k]?.revoke?.();
      }
      setImgByKey(next);
    };

    void load();
    return () => {
      alive = false;
      for (const k of Object.keys(next)) next[k]?.revoke?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((x) => `${x.candidate.id}:${x.evidence?.blobRef || ''}`).join('|')]);

  const senderName = (sender?.name || '').trim() || partnerName;
  const senderLines = [senderName, sender?.addressLine1, sender?.addressLine2, sender?.cityStateZip].map((x) => String(x || '').trim()).filter(Boolean);
  const bureauAddr = bureauAddress ?? bureauDisputeAddress(bureau);
  const headerDate = new Date().toLocaleDateString();
  const subject = (subjectLine || '').trim() || SUBJECT_LINE;
  const pageCount = Math.max(1, pages.length);
  const safePageIndex = Math.max(0, Math.min(pageIndex, pageCount - 1));
  const isSpread = view === 'spread';
  const step = isSpread ? 2 : 1;
  const spreadStart = isSpread ? (safePageIndex % 2 === 0 ? safePageIndex : safePageIndex - 1) : safePageIndex;
  const leftPageIndex = Math.max(0, Math.min(spreadStart, pageCount - 1));
  const rightPageIndex = leftPageIndex + 1;
  const shownPages: Array<{
    pageIndex: number;
    blocks: Array<{ it: DisputeLetterItem; idx: number }>;
    isFirst: boolean;
    isLast: boolean;
  }> = [
    {
      pageIndex: leftPageIndex,
      blocks: pages[leftPageIndex] ?? [],
      isFirst: leftPageIndex === 0,
      isLast: leftPageIndex === pageCount - 1,
    },
    ...(isSpread && rightPageIndex < pageCount
      ? [
          {
            pageIndex: rightPageIndex,
            blocks: pages[rightPageIndex] ?? [],
            isFirst: false,
            isLast: rightPageIndex === pageCount - 1,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-white font-semibold">Paper preview</div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/50 font-mono">
          <span>
            Pages {leftPageIndex + 1}
            {isSpread && rightPageIndex < pageCount ? `â€“${rightPageIndex + 1}` : ''} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPageIndex((p) => Math.max(0, p - step))}
            disabled={leftPageIndex <= 0}
            className={`inline-flex items-center gap-2 px-3 py-2 ${FINELY_OS_SECONDARY_BTN}`}
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setPageIndex((p) => Math.min(pageCount - 1, p + step))}
            disabled={leftPageIndex >= pageCount - 1 || (isSpread && leftPageIndex >= pageCount - 2)}
            className={`inline-flex items-center gap-2 px-3 py-2 ${FINELY_OS_SECONDARY_BTN}`}
          >
            Next
          </button>
        </div>
      </div>

      <div className={`grid gap-6 ${isSpread ? 'md:grid-cols-2' : ''}`}>
        {shownPages.map((p) => (
          <div key={p.pageIndex} className="fc-light-glass-panel fc-light-chrome-panel p-3">
            <div className="rounded-xl border border-black/10 bg-white shadow-xl overflow-hidden">
              <div className="mx-auto w-full max-w-[860px] h-[1060px] p-10">
                <div className="text-black text-[12px] leading-5 font-serif space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-[10px] uppercase tracking-widest text-black/50 font-mono">
                      Page {p.pageIndex + 1} of {pageCount}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-black/35 font-mono">{bureau}</div>
                  </div>

                  <div className="text-right space-y-0.5">
                    {senderLines.map((l, idx) => (
                      <div key={idx}>{l}</div>
                    ))}
                    <div>{headerDate}</div>
                  </div>

                  {p.isFirst ? (
                    <>
                      <div className="space-y-0.5">
                        <div className="font-semibold">{bureauAddr.name}</div>
                        {bureauAddr.lines.map((l, idx) => (
                          <div key={idx}>{l}</div>
                        ))}
                      </div>

                      <div className="font-semibold">{subject}</div>

                      <div
                        className="fc-paper-prose"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtmlForPreview(introHtml || '') }}
                      />
                    </>
                  ) : (
                    <div className="text-[10px] uppercase tracking-widest text-black/50">{subject} (continued)</div>
                  )}

                  <div className="space-y-6">
                    {p.blocks.map(({ it, idx }) => {
                      const key = it.candidate.id || it.candidate.account;
                      const reasons = formatNumberedDisputeReasons(it.reasons ?? []);
                      const img = imgByKey[key]?.url || '';
                      return (
                        <div key={key} className="space-y-2">
                          <div className="font-semibold">
                            {idx + 1}. {it.candidate.account} â€” {it.candidate.type}
                          </div>
                          <div className="text-[11px] text-black/60">
                            bureau: {bureauShortCode(it.candidate.bureau)} â€¢ legal basis: {it.candidate.code} â€¢ request: {it.candidate.status}
                          </div>
                          <div className="text-[11px] text-black/60">
                            evidence: <span className="font-semibold text-black/80">{it.evidence?.filename || 'â€”'}</span>
                          </div>

                          {img ? (
                            <div className="bg-white">
                              <img
                                src={img}
                                alt={it.evidence?.filename || 'Evidence'}
                                className="w-full max-h-[280px] object-contain bg-white border border-black/10 rounded-md"
                              />
                            </div>
                          ) : (
                            <div className="rounded-xl border border-black/10 bg-white p-4 text-[11px] text-black/50">
                              {it.evidence?.blobRef
                                ? 'Evidence screenshot is linked but could not be loaded (try re-attaching the screenshot).'
                                : 'Evidence screenshot not selected for this item.'}
                            </div>
                          )}

                          <div className="text-[11px] font-semibold">Factual dispute reasons:</div>
                          {reasons.length ? (
                            <ol className="list-decimal pl-5 text-[12px] leading-5 space-y-1">
                              {reasons.map((r, ri) => (
                                <li key={ri}>{r.replace(/^\d+\.\s*/, '')}</li>
                              ))}
                            </ol>
                          ) : (
                            <div className="text-[11px] text-black/50">No reasons selected for this item.</div>
                          )}
                          {reasons.length ? (
                            <div className="mt-2 text-[12px] font-bold tracking-wide">{DISPUTE_DELETE_NOW}</div>
                          ) : null}

                          {(it.narrative || '').trim() ? (
                            <>
                              <div className="mt-3 text-[11px] font-semibold">Narrative:</div>
                              <div className="text-[12px] leading-5 whitespace-pre-wrap">{String(it.narrative || '').trim()}</div>
                            </>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  {p.isLast ? (
                    <div className="pt-2 space-y-4">
                      <div
                        className="fc-paper-prose"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtmlForPreview(footerHtml || '') }}
                      />
                      <div>
                        <div>Sincerely,</div>
                        <div className="mt-6">{senderName}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 text-[10px] uppercase tracking-widest text-black/40">Continued on next pageâ€¦</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="text-[11px] text-white/40">
        Preview is page-sized (US Letter). The generated PDF includes your screenshots inline exactly as attached.
      </div>
    </div>
  );
}

function escText(s: string) {
  return String(s || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function DisputeLetterIframePreview({
  bureau,
  partnerName,
  sender,
  bureauAddress,
  subjectLine,
  introHtml,
  footerHtml,
  items,
  round = 'Round 1',
  onOpenFull,
  iframeHeightClassName = 'h-[min(78vh,900px)]',
}: {
  bureau: Bureau;
  partnerName: string;
  sender?: { name?: string; addressLine1?: string; addressLine2?: string; cityStateZip?: string };
  bureauAddress?: { name: string; lines: string[] };
  subjectLine?: string;
  introHtml: string;
  footerHtml: string;
  items: DisputeLetterItem[];
  round?: string;
  onOpenFull?: () => void;
  iframeHeightClassName?: string;
}) {
  const [imgByKey, setImgByKey] = useState<Record<string, { url: string; revoke?: () => void }>>({});

  useEffect(() => {
    let alive = true;
    const next: Record<string, { url: string; revoke?: () => void }> = {};
    const prev = imgByKey;

    const load = async () => {
      for (const it of items) {
        const key = it.candidate.id || it.candidate.account;
        const ref = it.evidence?.blobRef;
        const mime = String(it.evidence?.mimeType || '');
        const filename = String(it.evidence?.filename || '');
        const looksLikeImage =
          mime.toLowerCase().startsWith('image/') || (!mime && /\.(png|jpe?g|webp|gif)$/i.test(filename));
        if (!ref || !looksLikeImage) continue;
        if (prev[key]) {
          next[key] = prev[key]!;
          continue;
        }
        const res = await getBlobUrl(ref, { mimeType: mime || undefined, preferSigned: true });
        if (!alive) {
          res?.revoke?.();
          continue;
        }
        if (res?.url) next[key] = { url: res.url, revoke: res.revoke };
      }
      if (!alive) return;
      for (const k of Object.keys(prev)) if (!next[k]) prev[k]?.revoke?.();
      setImgByKey(next);
    };

    void load();
    return () => {
      alive = false;
      for (const k of Object.keys(next)) next[k]?.revoke?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((x) => `${x.candidate.id}:${x.evidence?.blobRef || ''}`).join('|')]);

  const srcDoc = useMemo(() => {
    const senderFields = {
      name: (sender?.name || '').trim() || partnerName,
      addressLine1: sender?.addressLine1,
      addressLine2: sender?.addressLine2,
      cityStateZip: sender?.cityStateZip,
    };
    const preview = senderPreviewLines(senderFields);
    const senderName = preview.lines[0] || partnerName;
    const senderRest = preview.lines.slice(1);
    const missingClass = preview.missing ? ' class="fc-letter-missing"' : '';
    const bureauAddr = bureauAddress ?? bureauDisputeAddress(bureau);
    const headerDate = letterDateDisplay();
    const subject = (subjectLine || '').trim() || SUBJECT_LINE;

    const body = `
      <div class="page">
        <div class="header">
          <div class="right">
            <div${missingClass}>${escText(senderName)}</div>
            ${senderRest.map((l) => `<div${missingClass}>${escText(l)}</div>`).join('')}
            <div>${escText(headerDate)}</div>
          </div>
        </div>

        <div class="addr">
          <div class="bureau">${escText(bureauAddr.name)}</div>
          ${bureauAddr.lines.map((l) => `<div>${escText(l)}</div>`).join('')}
        </div>

        <div class="subject">${escText(subject)}</div>

        <div class="prose">${sanitizeHtmlForPreview(introHtml || '')}</div>

        ${(() => {
          const groups = aggregateLetterLaws(
            items.map((it) => ({
              negativeType: classifyCandidateNegativeType(it.candidate as any),
              laws: it.laws,
            })),
          );
          if (!groups.length) return '';
          return `<div class="lawBlock"><div class="label">Applicable law for this letter</div>${groups
            .map(
              (g) =>
                `<div class="lawGroup"><strong>${escText(g.label)} (${g.itemCount})</strong><div class="meta">${escText(g.approachBlurb)}</div><ul>${g.citations
                  .map((l) => `<li>${escText(l.shortLabel ? `${l.cite} — ${l.shortLabel}` : l.cite)}</li>`)
                  .join('')}</ul></div>`,
            )
            .join('')}</div>`;
        })()}

        <div class="items">
          ${items
            .map((it, idx) => {
              const key = it.candidate.id || it.candidate.account;
              const img = imgByKey[key]?.url || '';
              const reasons = (it.reasons ?? []).map((r) => String(r || '').trim()).filter(Boolean);
              const narrative = String(it.narrative || '').trim();
              const preamble = buildFiveStepItemPreamble({
                candidate: it.candidate,
                round,
                exhibitLabel: it.evidence?.filename ? 'Exhibit 1' : 'Exhibit A',
              });
              return `
                <div class="item">
                  <div class="itemTitle">${idx + 1}. ${escText(it.candidate.account)} â€” ${escText(it.candidate.type)}</div>
                  <div class="meta">bureau code: ${escText(it.candidate.bureau)} â€¢ legal basis: ${escText(it.candidate.code)} â€¢ request: ${escText(it.candidate.status)}</div>
                  <div class="meta" style="margin-top:6px;line-height:1.45">${escText(preamble)}</div>
                  <div class="meta">evidence: <strong>${escText(it.evidence?.filename || 'â€”')}</strong></div>
                  ${
                    img
                      ? `<div class="imgWrap"><img src="${escText(img)}" alt="${escText(it.evidence?.filename || 'Evidence')}" /></div>`
                      : `<div class="imgMissing">${it.evidence?.blobRef ? 'Evidence is linked but could not be loaded.' : 'Evidence screenshot not selected for this item.'}</div>`
                  }
                  
                  <div class="label">Dispute reasons:</div>
                  ${
                    reasons.length
                      ? `<ul>${reasons.map((r) => `<li>${escText(r)}</li>`).join('')}</ul>`
                      : `<div class="muted">No reasons selected for this item.</div>`
                  }
                  ${
                    narrative
                      ? `<div class="label">Narrative:</div><div class="narrative">${escText(narrative).replaceAll('\n', '<br/>')}</div>`
                      : ``
                  }
                </div>
              `;
            })
            .join('')}
        </div>

        <div class="prose">${sanitizeHtmlForPreview(footerHtml || '')}</div>

        <div class="sig">
          <div>Sincerely,</div>
          <div class="sigName">${escText(senderName)}</div>
        </div>
      </div>
    `;

    const extraCss = `
      body{padding:16px}
      .page{max-width:860px;margin:0 auto;background:#fff;border:1px solid rgba(0,0,0,0.08);border-radius:12px;padding:40px}
      .header{display:flex;justify-content:flex-end}
      .right{text-align:right;font-size:12px;line-height:1.4;color:#111}
      .addr{margin-top:18px;font-size:12px;line-height:1.4}
      .addr .bureau{font-weight:700}
      .lawBlock{margin:14px 0;padding:12px;border:1px solid #ddd;border-radius:8px}.lawGroup{margin-top:10px}.lawBlock .label{font-weight:700;margin-bottom:6px}.subject{margin-top:18px;font-weight:700;font-size:12px}
      .prose{margin-top:14px;font-size:12px;line-height:1.55;color:#111}
      .items{margin-top:18px}
      .item{margin-top:14px;padding-top:10px;border-top:1px solid rgba(0,0,0,0.08)}
      .itemTitle{font-weight:700;font-size:12px}
      .meta{margin-top:4px;font-size:11px;color:rgba(0,0,0,0.65)}
      .label{margin-top:10px;font-weight:700;font-size:11px}
      ul{margin:6px 0 0 0;padding-left:18px;font-size:12px;line-height:1.5}
      .muted{margin-top:6px;font-size:11px;color:rgba(0,0,0,0.55)}
      .imgWrap{margin-top:10px;background:#fff;border:1px solid rgba(0,0,0,0.08);border-radius:10px;padding:10px}
      /* Exhibit sizing: keep aspect ratio, but let it read like a real page exhibit. */
      .imgWrap img{width:100%;max-height:520px;object-fit:contain;display:block;background:#fff}
      .imgMissing{margin-top:10px;border:1px solid rgba(0,0,0,0.08);border-radius:10px;padding:12px;font-size:11px;color:rgba(0,0,0,0.55)}
      .narrative{margin-top:6px;font-size:12px;line-height:1.5;white-space:normal}
      .sig{margin-top:20px;font-size:12px;line-height:1.55}
      .sigName{margin-top:20px}
      .fc-letter-missing{color:#b91c1c!important;font-weight:700;background:#fef2f2;border:1px solid #fecaca;padding:0 2px;border-radius:2px}
    `.trim();

    return injectPrintSafeCss({ html: body, extraCss });
  }, [bureau, bureauAddress, footerHtml, imgByKey, introHtml, items, partnerName, round, sender, subjectLine]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-white font-semibold">Paper preview</div>
        {onOpenFull ? (
          <button
            type="button"
            onClick={onOpenFull}
            className={`inline-flex items-center gap-2 px-3 py-2 ${FINELY_OS_SECONDARY_BTN}`}
          >
            Full preview
          </button>
        ) : null}
      </div>
      <div className="rounded-2xl border border-white/10 bg-white overflow-hidden shadow-lg shadow-black/20">
        <div className="p-2 md:p-3 bg-white">
          <iframe
            title="Letter preview"
            srcDoc={srcDoc}
            className={`w-full ${iframeHeightClassName} rounded-xl border border-black/10 bg-white`}
          />
        </div>
      </div>
      <div className="text-[11px] text-white/40">Compact preview. Use Full preview for page-by-page review.</div>
    </div>
  );
}


function looksLikeImageEvidence(mimeType?: string, filename?: string): boolean {
  const mimeLower = String(mimeType || '').toLowerCase();
  const name = String(filename || '');
  return mimeLower.startsWith('image/') || (!mimeLower && /\.(png|jpe?g|webp|gif|bmp)$/i.test(name));
}

function evidenceLinkStatus(ev: { blobRef?: string; mimeType?: string; filename?: string } | null): {
  label: string;
  tone: 'ok' | 'warn' | 'err' | 'neutral';
} {
  if (!ev?.blobRef) return { label: 'Missing screenshot', tone: 'err' };
  if (isLegacyPendingReportBlob(ev.blobRef)) return { label: 'Re-upload required', tone: 'warn' };
  if (!looksLikeImageEvidence(ev.mimeType, ev.filename)) return { label: 'PDF attached', tone: 'neutral' };
  return { label: 'Screenshot linked', tone: 'ok' };
}

function InlineEvidenceThumb({
  blobRef,
  mimeType,
  filename,
  alt,
  size = 'md',
}: {
  blobRef: string;
  mimeType?: string;
  filename?: string;
  alt: string;
  size?: 'sm' | 'md';
}) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [url, setUrl] = useState('');
  const [revoke, setRevoke] = useState<null | (() => void)>(null);

  const boxClass =
    size === 'sm'
      ? 'h-16 w-24 rounded-xl border border-dashed border-white/15 bg-black/30'
      : 'h-28 w-44 rounded-2xl border border-dashed border-white/15 bg-black/30';
  const imgClass =
    size === 'sm'
      ? 'h-16 w-24 rounded-xl border border-sky-400/25 bg-gradient-to-br from-slate-900 to-black object-contain'
      : 'h-28 w-44 rounded-2xl border border-sky-400/25 bg-gradient-to-br from-slate-900 to-black object-contain shadow-lg shadow-sky-500/10 cursor-pointer ring-1 ring-white/10 hover:ring-sky-400/40 transition-all';

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    setUrl('');
    try {
      revoke?.();
    } catch {
      // ignore
    }
    setRevoke(null);

    if (!blobRef || !looksLikeImageEvidence(mimeType, filename)) {
      setStatus('error');
      return;
    }
    if (isLegacyPendingReportBlob(blobRef)) {
      setStatus('error');
      return;
    }

    const timeout = window.setTimeout(() => {
      if (alive) setStatus((s) => (s === 'loading' ? 'error' : s));
    }, 12000);

    const run = async () => {
      try {
        const res = await getBlobUrl(blobRef, { mimeType, preferSigned: true });
        if (!alive) {
          res?.revoke?.();
          return;
        }
        if (!res?.url) {
          setStatus('error');
          return;
        }
        setUrl(res.url);
        setRevoke(res.revoke ?? null);
        setStatus('ready');
      } catch {
        if (alive) setStatus('error');
      }
    };
    void run();

    return () => {
      alive = false;
      window.clearTimeout(timeout);
      try {
        revoke?.();
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blobRef, mimeType, filename]);

  if (status === 'loading') {
    return (
      <div className={`${boxClass} flex items-center justify-center text-[10px] text-white/40 uppercase tracking-widest`}>
        Loading…
      </div>
    );
  }
  if (status === 'error' || !url) {
    const legacy = isLegacyPendingReportBlob(blobRef);
    const isPdf = !looksLikeImageEvidence(mimeType, filename);
    return (
      <div className={`${boxClass} flex flex-col items-center justify-center gap-1 px-2 text-center`}>
        {isPdf ? <FileText size={18} className="text-white/50" /> : <ImageIcon size={18} className="text-white/50" />}
        <span className="text-[9px] text-white/50 uppercase tracking-widest">
          {legacy ? 'Re-upload required' : isPdf ? 'PDF attached' : "Couldn't load"}
        </span>
        {!isPdf ? (
          <button
            type="button"
            className="text-[9px] text-sky-300 underline"
            onClick={(e) => {
              e.stopPropagation();
              void openBlobRefInNewTab({ blobRef, mimeType, preferSigned: true });
            }}
          >
            Open
          </button>
        ) : null}
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={alt}
      className={imgClass}
      title="Click to open full-size"
      onError={() => setStatus('error')}
      onClick={(e) => {
        e.stopPropagation();
        void (async () => {
          try {
            const result = await openBlobRefInNewTab({ blobRef, mimeType, preferSigned: true });
            if (!result.ok) window.alert(result.message);
          } catch {
            // ignore
          }
        })();
      }}
    />
  );
}

export function LettersCommandCenter({
  partner,
  layout = 'standalone',
  unifiedShell,
  activeTab,
  onTabChange,
  onOpenVault,
  onOpenReports,
  onOpenDisputeCenter,
  onOpenDebtCenter,
  onRequestGrantEntitlements,
  debtCenterMode = false,
}: {
  partner: Partner;
  layout?: 'standalone' | 'embedded';
  unifiedShell?: boolean;
  activeTab?: LettersStudioTab;
  onTabChange?: (tab: LettersStudioTab) => void;
  onOpenVault?: (args?: { letterId?: string }) => void;
  onOpenReports?: () => void;
  onOpenDisputeCenter?: () => void;
  onOpenDebtCenter?: () => void;
  onRequestGrantEntitlements?: (keys: string[]) => void;
  /** Dedicated validation/affidavit mode: hides dispute/template navigation and dispute shortcuts. */
  debtCenterMode?: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [internalTab, setInternalTab] = useState<TabKey>('dispute');
  const tab = activeTab ?? internalTab;
  const setTab = (next: TabKey) => {
    if (onTabChange) onTabChange(next);
    else setInternalTab(next);
  };
  const [templatesReturnTab, setTemplatesReturnTab] = useState<LettersStudioTab>('dispute');
  useEffect(() => {
    if (tab !== 'templates') setTemplatesReturnTab(tab as LettersStudioTab);
  }, [tab]);
  const [returnNotice, setReturnNotice] = useState<string | null>(null);

  const [storeVersion, setStoreVersion] = useState(0);
  useEffect(() => {
    const onStore = (ev: Event) => {
      setStoreVersion((v) => v + 1);
      // Evidence is stored in localJsonStore and written from other screens (Reports/Credit Intel).
      // Listen for that key specifically so screenshot linking updates without refresh.
      try {
        const key = String((ev as any)?.detail?.key || '');
        if (key === 'finely.evidence.v1') setEvidenceVersion((v) => v + 1);
      } catch {
        // ignore
      }
    };
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const [evidenceVersion, setEvidenceVersion] = useState(0);
  const evidence = useMemo(() => (partner ? listEvidenceByPartner(partner.id) : []), [partner, evidenceVersion]);
  const screenshotEvidence = useMemo(() => evidence.filter((x) => x.type === 'screenshot'), [evidence]);

  const canSeeTemplates = useMemo(() => {
    if (!partner) return false;
    return hasEntitlement(partner.id, ENTITLEMENT_KEYS.templates);
  }, [partner, storeVersion]);

  const canSeeDebtTracks = useMemo(() => {
    if (!partner) return false;
    return hasEntitlement(partner.id, ENTITLEMENT_KEYS.debt);
  }, [partner, storeVersion]);

  /** Debt / Litigation Command must generate real catalog bodies without Template library entitlement. */
  const canGenerateDebtLetterBodies = useMemo(() => {
    if (!partner) return false;
    if (layout === 'embedded' || debtCenterMode) return true;
    return (
      hasEntitlement(partner.id, ENTITLEMENT_KEYS.debt) ||
      hasEntitlement(partner.id, ENTITLEMENT_KEYS.letters) ||
      hasEntitlement(partner.id, ENTITLEMENT_KEYS.templates)
    );
  }, [partner, layout, debtCenterMode, storeVersion]);

  const canUseLetters = useMemo(() => {
    // Admin embedded context should not be blocked by partner plan.
    if (layout === 'embedded') return true;
    // Debt-lane partners generate + vault debt/court letters without a separate Letters pack.
    return (
      hasEntitlement(partner.id, ENTITLEMENT_KEYS.letters) ||
      hasEntitlement(partner.id, ENTITLEMENT_KEYS.debt)
    );
  }, [layout, partner.id, storeVersion]);

  // --- Dispute letter flow (multi-bureau, split per bureau) ---
  const reports = useMemo(() => (partner ? listReportsByPartner(partner.id) : []), [partner, storeVersion]);
  const disputeCases = useMemo(() => (partner ? listCasesByPartner(partner.id) : []), [partner, storeVersion]);

  const suggestedRoundByBureau = useMemo(() => {
    const out = { EXP: 'Round 1', EQF: 'Round 1', TUC: 'Round 1' } as Record<Bureau, LetterRound>;
    for (const c of disputeCases) {
      out[c.bureau] = suggestNextRound(c);
    }
    return out;
  }, [disputeCases]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedDisputes, setSelectedDisputes] = useState<SelectedDispute[]>([]);
  const [evidenceByCandidateId, setEvidenceByCandidateId] = useState<Record<string, string | undefined>>({});
  const [evidenceIdsByCandidateId, setEvidenceIdsByCandidateId] = useState<Record<string, string[]>>({});
  const [reasonsByCandidateId, setReasonsByCandidateId] = useState<Record<string, string[]>>({});
  const [lawsByCandidateId, setLawsByCandidateId] = useState<Record<string, LetterCitation[]>>({});
  const [customLawDraftByKey, setCustomLawDraftByKey] = useState<Record<string, string>>({});
  const [reasonsLibraryOpen, setReasonsLibraryOpen] = useState(false);
  const [reasonLibraryFocusKey, setReasonLibraryFocusKey] = useState<string | null>(null);
  const [evidencePicker, setEvidencePicker] = useState<null | { candidateId?: string }>(null);
  const [identityEvidenceIds, setIdentityEvidenceIds] = useState<string[]>([]);
  const [identityPickerOpen, setIdentityPickerOpen] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [autoMatchNoteByCandidateId, setAutoMatchNoteByCandidateId] = useState<Record<string, string>>({});

  const [toneByBureau, setToneByBureau] = useState<Record<Bureau, LetterTone>>({
    EXP: 'formal',
    EQF: 'formal',
    TUC: 'formal',
  });
  const [roundByBureau, setRoundByBureau] = useState<Record<Bureau, LetterRound>>({
    EXP: 'Round 1',
    EQF: 'Round 1',
    TUC: 'Round 1',
  });
  const [roundTransferNote, setRoundTransferNote] = useState('');
  useEffect(() => {
    if (!disputeCases.length) return;
    setRoundByBureau((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const c of disputeCases) {
        const suggested = suggestNextRound(c);
        if (prev[c.bureau] === 'Round 1' && suggested !== 'Round 1') {
          next[c.bureau] = suggested;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [disputeCases.length, partner?.id]);

  useEffect(() => {
    const model = partner?.journeySignals?.supportModel;
    if (!model) return;
    if (model === 'transferred_company') {
      setRoundByBureau((prev) => {
        const allR1 = (['EXP', 'EQF', 'TUC'] as Bureau[]).every((b) => prev[b] === 'Round 1');
        if (!allR1) return prev;
        return { EXP: 'Round 2', EQF: 'Round 2', TUC: 'Round 2' };
      });
      const prior = String(partner.journeySignals?.priorCompany || '').trim();
      if (prior) {
        setRoundTransferNote((prev) => prev || `Transferred from ${prior} — prior company already mailed Round 1.`);
      } else {
        setRoundTransferNote((prev) => prev || 'Transferred from another credit company — starting at Round 2 with Finely Cred.');
      }
    }
    if (model === 'finely_specialist' && partner.journeySignals?.helperName) {
      setRoundTransferNote((prev) => prev || `Working with Finely specialist ${partner.journeySignals?.helperName}.`);
    }
  }, [partner?.id, partner?.journeySignals?.supportModel, partner?.journeySignals?.priorCompany, partner?.journeySignals?.helperName]);
  const [introByBureau, setIntroByBureau] = useState<Record<Bureau, string>>({
    EXP: plainTextToHtml(defaultDisputeIntro('formal')),
    EQF: plainTextToHtml(defaultDisputeIntro('formal')),
    TUC: plainTextToHtml(defaultDisputeIntro('formal')),
  });
  const [footerByBureau, setFooterByBureau] = useState<Record<Bureau, string>>({
    EXP: plainTextToHtml(defaultDisputeFooter('formal')),
    EQF: plainTextToHtml(defaultDisputeFooter('formal')),
    TUC: plainTextToHtml(defaultDisputeFooter('formal')),
  });

  // Header/address overrides (editable; applied to generated PDF + previews)
  const [senderName, setSenderName] = useState('');
  const [senderAddressLine1, setSenderAddressLine1] = useState('');
  const [senderAddressLine2, setSenderAddressLine2] = useState('');
  const [senderCityStateZip, setSenderCityStateZip] = useState('');
  const [subjectLineByBureau, setSubjectLineByBureau] = useState<Record<Bureau, string>>({
    EXP: SUBJECT_LINE,
    EQF: SUBJECT_LINE,
    TUC: SUBJECT_LINE,
  });
  const [bureauAddressDraftByBureau, setBureauAddressDraftByBureau] = useState<Record<Bureau, { name: string; linesText: string }>>({
    EXP: { name: bureauDisputeAddress('EXP').name, linesText: bureauDisputeAddress('EXP').lines.join('\n') },
    EQF: { name: bureauDisputeAddress('EQF').name, linesText: bureauDisputeAddress('EQF').lines.join('\n') },
    TUC: { name: bureauDisputeAddress('TUC').name, linesText: bureauDisputeAddress('TUC').lines.join('\n') },
  });

  const [aiNarrativeByCandidateKey, setAiNarrativeByCandidateKey] = useState<Record<string, string>>({});
  const [aiQuestionsByBureau, setAiQuestionsByBureau] = useState<Partial<Record<Bureau, string[]>>>({});
  const [aiBusyByBureau, setAiBusyByBureau] = useState<Record<Bureau, boolean>>({ EXP: false, EQF: false, TUC: false });
  const [aiErrByBureau, setAiErrByBureau] = useState<Partial<Record<Bureau, string | null>>>({});

  const canAiDraft = useMemo(
    () => canUseAiDraft({ partnerId: partner.id, isAdminContext: layout === 'embedded' }),
    [partner.id, layout, storeVersion],
  );
  const aiGatewayEnabled = useMemo(() => isFeatureEnabled('aiGateway'), [storeVersion]);

  const [pdfBusyByBureau, setPdfBusyByBureau] = useState<Record<Bureau, boolean>>({ EXP: false, EQF: false, TUC: false });
  const [pdfErr, setPdfErr] = useState<string | null>(null);
  const [emailPartnerOnEvents, setEmailPartnerOnEvents] = useState(() => {
    try {
      return getNotificationPrefs({ partnerId: partner?.id }).emailLetterLifecycle !== false;
    } catch {
      return true;
    }
  });
  const [addressLookupBusy, setAddressLookupBusy] = useState(false);
  const [addressEnrichMeta, setAddressEnrichMeta] = useState<AddressEnrichmentResult | null>(null);

  const notifyPartnerLetterEvent = (args: {
    event: 'generated' | 'saved' | 'ready_to_mail';
    letterIds: string[];
    letterTitles: string[];
  }) => {
    if (!partner?.id) return;
    void notifyLetterLifecycle({
      partnerId: partner.id,
      partner,
      event: args.event,
      letterIds: args.letterIds,
      letterTitles: args.letterTitles,
      emailPartner: emailPartnerOnEvents,
      actorRole: layout === 'embedded' ? 'admin' : 'partner',
    });
  };
  const [studioOpenByBureau, setStudioOpenByBureau] = useState<Record<Bureau, boolean>>({ EXP: true, EQF: true, TUC: true });
  const [workspaceBureau, setWorkspaceBureau] = useState<Bureau>('EXP');
  const [lastGeneratedAtByBureau, setLastGeneratedAtByBureau] = useState<Record<Bureau, string | null>>({
    EXP: null,
    EQF: null,
    TUC: null,
  });

  const [bulkUndo, setBulkUndo] = useState<null | { bureau: Bureau; prevReasonsByCandidateId: Record<string, string[]> }>(null);
  const [groupByCreditorByBureau, setGroupByCreditorByBureau] = useState<Record<Bureau, boolean>>({ EXP: true, EQF: true, TUC: true });
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [disputeTemplatesOpen, setDisputeTemplatesOpen] = useState<null | Bureau>(null);
  const [focusedKeyByBureau, setFocusedKeyByBureau] = useState<Record<Bureau, string | null>>({ EXP: null, EQF: null, TUC: null });
  const [previewModalBureau, setPreviewModalBureau] = useState<null | Bureau>(null);

  const isPaidLettersPackage = useMemo(() => {
    // Practical heuristic: paid packages grant templates access; trials often do not.
    // This matches user intent: only prompt â€œsave vs save+downloadâ€ for non-package users.
    return hasEntitlement(partner.id, ENTITLEMENT_KEYS.templates);
  }, [partner.id, storeVersion]);

  const [pdfChoice, setPdfChoice] = useState<null | { kind: 'dispute'; bureau: Bureau } | { kind: 'debt' }>(null);

  const shouldPromptForDownload = (args: { kind: 'dispute' | 'debt' }) => {
    if (layout === 'embedded') return false; // admin: save-only
    if (isPaidLettersPackage) return false; // package: save-only
    // partners without package: prompt each time
    return true;
  };

  const downloadFromBlobRef = async (blobRef: string, filename: string, mimeType = 'application/pdf') => {
    const res = await getBlobUrl(blobRef, { mimeType, preferSigned: true });
    if (!res?.url) throw new Error('Download link unavailable.');
    triggerBrowserDownload({
      url: res.url,
      filename: filename || 'letter.pdf',
      revoke: res.revoke,
      revokeAfterMs: 60_000,
      targetBlank: true,
    });
  };

  const openVault = (args?: { letterId?: string; preview?: boolean }) => {
    if (onOpenVault) return onOpenVault(args);
    const qs = new URLSearchParams();
    if (args?.letterId) qs.set('letterId', args.letterId);
    if (args?.preview) qs.set('preview', '1');
    const to = args?.letterId ? `/portal/letters/vault?${qs.toString()}` : '/portal/letters/vault';
    navigate(to);
  };

  const openReports = () => {
    if (onOpenReports) return onOpenReports();
    navigate('/portal/reports');
  };

  const isCollectionsType = (type: string | undefined | null) => {
    const t = (type || '').toLowerCase();
    return t.includes('collection') || t.includes('charge-off') || t.includes('charge off');
  };

  const goCapture = (args?: { candidate?: SelectedDispute | null }) => {
    // Standalone portal flow: deep-link directly into Credit Intel Collections/Accounts and back.
    if (layout !== 'standalone') return openReports();
    const candidate = args?.candidate ?? null;
    const intelTab = candidate ? (isCollectionsType(candidate.candidate.type) ? 'collections' : 'accounts') : 'collections';
    const scrollToAccount = candidate ? candidate.candidate.account : '';
    const qs = new URLSearchParams();
    qs.set('intelTab', intelTab);
    if (scrollToAccount) qs.set('scrollToAccount', scrollToAccount);
    qs.set('returnTo', '/portal/letters?fromCapture=1');
    navigate(`/portal/reports?${qs.toString()}`);
  };

  // One-time notice when returning from capture flow.
  useEffect(() => {
    if (layout !== 'standalone') return;
    const q = new URLSearchParams(location.search);
    const from = q.get('fromCapture');
    if (!from) return;
    setReturnNotice('Your dispute selections were saved. Attach screenshots to continue.');
    q.delete('fromCapture');
    const next = q.toString();
    navigate(`${location.pathname}${next ? `?${next}` : ''}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, location.pathname, location.search]);

  // Deep-link helper: /portal/letters?openPicker=1
  const didAutoPicker = React.useRef(false);
  useEffect(() => {
    if (layout !== 'standalone') return;
    if (didAutoPicker.current) return;
    const q = new URLSearchParams(location.search);
    const open = (q.get('openPicker') || '').trim();
    if (open !== '1') return;
    didAutoPicker.current = true;
    setTab('dispute');
    setPickerOpen(true);
    q.delete('openPicker');
    const next = q.toString();
    navigate(`${location.pathname}${next ? `?${next}` : ''}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, location.pathname, location.search]);

  const openDisputeCenter = () => {
    if (onOpenDisputeCenter) return onOpenDisputeCenter();
    navigate('/portal/disputes');
  };

  const openDebtCenter = () => {
    if (onOpenDebtCenter) return onOpenDebtCenter();
    navigate('/portal/debt');
  };

  const clearDisputeStudioDraft = () => {
    if (!partner) return;
    const ok = window.confirm(
      'Clear the entire dispute letter studio draft?\n\nThis will remove selected disputes, evidence links, reasons, AI narratives/questions, and header/address overrides. This cannot be undone.',
    );
    if (!ok) return;
    try {
      clearLettersCommandCenterDraft(partner.id);
    } catch {
      // ignore
    }
    setPdfErr(null);
    setReturnNotice('Cleared dispute letter studio draft.');
    setPickerOpen(false);
    setEvidencePicker(null);
    setPreviewModalBureau(null);
    setFocusedKeyByBureau({ EXP: null, EQF: null, TUC: null });
    setCollapsedGroups({});
    setBulkUndo(null);

    setSelectedDisputes([]);
    setEvidenceByCandidateId({});
    setEvidenceIdsByCandidateId({});
    setIdentityEvidenceIds([]);
    setIdentityPickerOpen(false);
    setDraftSavedAt(null);
    setReasonsByCandidateId({});
    setLawsByCandidateId({});
    setCustomLawDraftByKey({});
    setAiNarrativeByCandidateKey({});
    setAiQuestionsByBureau({});
    setAiErrByBureau({});
    setAiBusyByBureau({ EXP: false, EQF: false, TUC: false });

    setLastGeneratedAtByBureau({ EXP: null, EQF: null, TUC: null });
    setStudioOpenByBureau({ EXP: true, EQF: true, TUC: true });

    // Restore safe defaults for editable blocks.
    setSenderName(canonicalIdentity.fullName || partner.profile.fullName || '');
    setSenderAddressLine1(canonicalIdentity.address1 || canonicalIdentity.addressLine1 || '');
    setSenderAddressLine2(canonicalIdentity.address2 || '');
    setSenderCityStateZip(canonicalIdentity.cityStateZip || '');
    setSubjectLineByBureau({ EXP: SUBJECT_LINE, EQF: SUBJECT_LINE, TUC: SUBJECT_LINE });
    setBureauAddressDraftByBureau({
      EXP: { name: bureauDisputeAddress('EXP').name, linesText: bureauDisputeAddress('EXP').lines.join('\n') },
      EQF: { name: bureauDisputeAddress('EQF').name, linesText: bureauDisputeAddress('EQF').lines.join('\n') },
      TUC: { name: bureauDisputeAddress('TUC').name, linesText: bureauDisputeAddress('TUC').lines.join('\n') },
    });
  };

  type AiBureauDisputeDraft = {
    intro?: string;
    items?: Array<{ key: string; narrative?: string }>;
    questions?: string[];
  };

  const runAiDraftForBureau = async (b: Bureau) => {
    setAiErrByBureau((prev) => ({ ...prev, [b]: null }));
    setReturnNotice(null);

    if (!aiGatewayEnabled) {
      setAiErrByBureau((prev) => ({ ...prev, [b]: 'AI drafting is currently disabled in Settings (Feature Flags â†’ AI Gateway).' }));
      return;
    }
    if (!canAiDraft) {
      setAiErrByBureau((prev) => ({ ...prev, [b]: 'AI drafting is a premium feature (or admin-only in pilot). Upgrade to unlock.' }));
      return;
    }

    const items = selectedByBureau[b] ?? [];
    if (!items.length) {
      setAiErrByBureau((prev) => ({ ...prev, [b]: 'No dispute items selected for this bureau.' }));
      return;
    }

    // Specialty packs: if the selection includes a packed negative type, require that pack entitlement.
    const missingPacks = (() => {
      const types = Array.from(new Set(items.map((s) => classifyCandidateNegativeType(s.candidate as any))));
      const needed = types.map((t) => requiredPackKeyForNegativeType(t as any)).filter((x): x is string => Boolean(x));
      const missing = needed.filter((k) => !hasEntitlement(partner.id, k));
      return Array.from(new Set(missing));
    })();
    if (missingPacks.length) {
      setAiErrByBureau((prev) => ({
        ...prev,
        [b]: `This selection includes specialty negatives that require a letter pack. Missing: ${missingPacks.join(', ')}`,
      }));
      return;
    }

    const busy = aiBusyByBureau[b];
    if (busy) return;

    setAiBusyByBureau((prev) => ({ ...prev, [b]: true }));
    try {
      const tone = toneByBureau[b];
      const round = roundByBureau[b];
      const partnerName = partner.profile.fullName || 'Partner';
      const state = (partner.routes?.[partner.primaryRoute || 'personal_restore']?.personal?.state || '').toUpperCase() || '';

      const normName = (x: string) => (x || '').toLowerCase().replace(/\s+/g, ' ').trim();
      const findTradeline = (parsed: any, accountName: string) => {
        const tls = (parsed?.tradelines ?? []) as any[];
        return (
          tls.find((x) => normName(x.creditorName) === normName(accountName)) ??
          tls.find((x) => normName(accountName).includes(normName(x.creditorName))) ??
          tls.find((x) => normName(x.creditorName).includes(normName(accountName))) ??
          null
        );
      };
      const factsFor = (tl: any) => {
        if (!tl) return '';
        const parts: string[] = [];
        const push = (k: string, v: any) => {
          const s2 = v == null ? '' : String(v).trim();
          if (s2 && s2 !== '-') parts.push(`${k}=${s2}`);
        };
        push('Status', tl.accountStatus);
        push('Type', tl.accountType);
        push('Opened', tl.dateOpened);
        push('Closed', tl.dateClosed);
        push('DOFD', tl.dofd);
        push('Balance', tl.balance);
        push('CreditLimit', tl.creditLimit);
        push('HighBalance', tl.highBalance);
        push('PastDue', tl.pastDue);
        return parts.join('; ');
      };

      const payloadItems = items.map((s) => {
        const negativeType = classifyCandidateNegativeType(s.candidate as any);
        const playbook = NEGATIVE_PLAYBOOKS[negativeType] ?? NEGATIVE_PLAYBOOKS.unknown;
        const rid = (s.source.kind === 'report' ? s.source.reportId : '') || s.candidate.reportId || '';
        const parsed = rid ? parsedByReportId.get(rid) : undefined;
        const tl = findTradeline(parsed, s.candidate.account);
        const enrichedReasons = buildEnrichedReasonsForCandidate({
          candidate: s.candidate as any,
          parsed,
          existing: (reasonsByCandidateId[s.key] ?? []).map((x) => x.trim()).filter(Boolean),
          evidence: (() => {
            const evId = evidenceByCandidateId[s.key] || evidenceIdsByCandidateId[s.key]?.[0];
            return evId ? evidence.find((x) => x.id === evId) ?? null : null;
          })(),
          maxReasons: 5,
        });
        return ({
        key: s.key,
        account: s.candidate.account,
        type: s.candidate.type,
        negativeType,
        playbookHint: playbook.aiHint,
        request: s.candidate.status,
        legalBasis: s.candidate.code,
        reasons: enrichedReasons,
        facts: factsFor(tl),
        contradictions: tl ? deriveTradelineContradictions(tl).map((r) => r.text) : [],
        evidenceAttached: Boolean(evidenceByCandidateId[s.key] || evidenceIdsByCandidateId[s.key]?.length),
        caseContext: buildCaseContextBlock({
          candidate: s.candidate as any,
          parsed,
          bureau: b,
          round,
          reasons: enrichedReasons,
        }),
        });
      });

      const system = `You are a credit dispute letter drafter. Dispute REASONS must be factual findings â€” what is reporting on the file â€” not commands to the bureau.

Return ONLY valid JSON (no markdown). Schema:
{
  "intro": string,
  "items": [{"key": string, "narrative": string}],
  "questions": string[]
}

LETTER SHAPE (mailed letter body only — one tradeline focus when possible):
- intro = consumer opening paragraphs only (what looks wrong, real-life impact, FCRA dispute rights).
- Then the generated PDF will enclose the negative (account screenshot / inquiry exhibit) and list numbered factual reasons + applicable law.
- Do NOT include Free Dispute Letter Guide teaching content. Never write "Step 1", "Step 2", "Step 3", "Step 4", "Step 5", "5-step framework", power moves, or educational how-to bullets in intro or narratives.

WRITING STANDARD:
- For EACH item narrative: use SELECTED_REASONS and DETECTED_ISSUES as first-person factual statements (creditor name, status line, balance, dates, payment-grid codes, cross-bureau differences). Quote field values when provided in ACCOUNT_FACTS.
- NEVER rewrite reasons as bureau commands ("please verify", "please delete", "pursuant to", "method of verification", "demand reinvestigation", "reinvestigation"). Those belong in the letter closing, not in per-item reasons.
- Each factual reason must be ONE clear point (one date problem, one balance contradiction, one cross-bureau difference). No semicolon field dumps or Metro 2 codes.
- PLAYBOOK_HINT is internal strategy context only â€” do not paste command-style language from it.
- Use ONLY provided facts. NEVER invent balances, dates, account numbers, or legal citations. Use [BRACKET] placeholders when facts are missing and add to "questions".
- SELECTED_LAWS are the only statutes allowed for this bureau letter. Do NOT draft FDCPA debt-validation requests (§1692g) unless those cites are listed.
- Put law references only in the Applicable law sense — do not rewrite SELECTED_REASONS into legal demands.
- If EVIDENCE_ATTACHED is yes, note the exhibit supports the factual discrepancy described.
- Round ${round}: if Round 2+, note prior dispute and that the same inaccurate fields still report â€” still as factual statements, not demands.
- Each item narrative: 4-8 sentences listing the specific negatives and contradictions on the file for this account.
- intro: 2-4 first-person paragraphs matching TONE. No step headings or guide framework language.
- questions: only genuine gaps that would strengthen factual findings.`;

      const user = `DRAFT A BUREAU DISPUTE LETTER.\n\nBUREAU: ${b}\nROUND: ${round}\nTONE: ${tone}\nCONSUMER_NAME: ${partnerName}\nSTATE: ${state || '[STATE]'}\n\nDISPUTE_ITEMS (keyed):\n${payloadItems
        .map((it) => {
          const reasons = it.reasons.length ? it.reasons.map((r) => `- ${r}`).join('\n') : '- (none selected)';
          const issues = it.contradictions.length ? it.contradictions.map((r) => `- ${r}`).join('\n') : '- (none auto-detected)';
          const laws = letterCitationsToPromptLines(lawsByCandidateId[it.key] ?? resolveBureauDisputeLaws(it.negativeType));
          return `KEY: ${it.key}\nACCOUNT: ${it.account}\nTYPE: ${it.type}\nNEGATIVE_TYPE: ${it.negativeType}\nPLAYBOOK_HINT: ${it.playbookHint}\nREQUEST: ${it.request}\nLEGAL_BASIS_LABEL: ${it.legalBasis}\nACCOUNT_FACTS: ${it.facts || '(not parsed)'}\nDETECTED_ISSUES:\n${issues}\nEVIDENCE_ATTACHED: ${it.evidenceAttached ? 'yes (a screenshot exhibit is attached for this item)' : 'no'}\nSELECTED_LAWS (use only these cites):\n${laws}\nSELECTED_REASONS (factual â€” use verbatim in narrative):\n${reasons}\nCASE_CONTEXT:\n${it.caseContext}\n`;
        })
        .join('\n')}\n\nOUTPUT:\n- intro: opening paragraphs only (no header/address).\n- items: one narrative per KEY.\n- questions: list any follow-up questions you need to make the draft stronger.`;

      const ai = await callAiGateway({
        taskType: 'letter_draft_dispute',
        responseFormat: 'json',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        context: { bureau: b, round, tone, partnerId: partner.id },
      });

      const parsed = extractFirstJsonObject(ai.text || '') as AiBureauDisputeDraft;
      const intro = String(parsed?.intro || '').trim();
      const questions = Array.isArray(parsed?.questions) ? parsed!.questions.map((q) => String(q || '').trim()).filter(Boolean).slice(0, 12) : [];
      const itemDrafts = Array.isArray(parsed?.items) ? parsed!.items : [];

      if (intro) {
        // Keep AI opening as letter prose only — never prepend free-guide Step 1–5 teaching blocks.
        const cleaned = intro
          .replace(/\n?\s*Step\s*[1-5]\s*[—\-:].*?(?=\n\s*Step\s*[1-5]\s*[—\-:]|\n\n|$)/gis, '')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        const withTransfer = mergeTransferNote(cleaned || intro, roundTransferNote);
        setIntroByBureau((prev) => ({ ...prev, [b]: ensureHtmlDraft(withTransfer) }));
      }
      if (questions.length) {
        setAiQuestionsByBureau((prev) => ({ ...prev, [b]: questions }));
      } else {
        setAiQuestionsByBureau((prev) => {
          const out = { ...(prev || {}) };
          delete out[b];
          return out;
        });
      }

      if (itemDrafts.length) {
        setAiNarrativeByCandidateKey((prev) => {
          const out = { ...prev };
          for (const it of itemDrafts) {
            const key = String(it?.key || '').trim();
            if (!key) continue;
            if (!items.some((s) => s.key === key)) continue;
            const narrative = String(it?.narrative || '').trim();
            if (!narrative) continue;
            out[key] = narrative;
          }
          return out;
        });
      }

      setReturnNotice('AI drafted your opening paragraphs and item narratives. Review and edit before generating.');
    } catch (e: any) {
      setAiErrByBureau((prev) => ({ ...prev, [b]: e?.message || 'AI draft failed.' }));
    } finally {
      setAiBusyByBureau((prev) => ({ ...prev, [b]: false }));
    }
  };

  const runAiDraftDebtLetter = async () => {
    if (!draft) return;
    setDraftErr(null);
    setDraftNotice(null);

    if (!aiGatewayEnabled) {
      setDraftErr('AI drafting is currently disabled in Settings (Feature Flags â†’ AI Gateway).');
      return;
    }
    if (!canAiDraft) {
      setDraftErr('AI drafting is a premium feature (or admin-only in pilot). Upgrade to unlock.');
      return;
    }
    if (draftBusy) return;

    setDraftBusy(true);
    try {
      const spec = DEBT_LETTER_SPECS.find((s) => s.id === draft.specId) ?? null;
      const debtName = debt?.recipientName || debtPartyInfo?.recipientName || debt?.name || 'Creditor / Collector';
      const jurisdictionState = String((debt as any)?.stateJurisdiction || summonsAffidavitContext.jurisdictionState || '').toUpperCase() || '';
      const caseNumber = String((debt as any)?.courtCaseNumber || summonsAffidavitContext.caseNumber || '').trim() || '';
      const recipientBlock = [
        debtPartyInfo?.recipientName ? `RECIPIENT_NAME: ${debtPartyInfo.recipientName}` : '',
        debtPartyInfo?.recipientAddress ? `RECIPIENT_ADDRESS: ${debtPartyInfo.recipientAddress}` : '',
        debtPartyInfo?.accountNumberMasked ? `ACCOUNT_REF: ${debtPartyInfo.accountNumberMasked}` : '',
        debtPartyInfo?.originalCreditor ? `ORIGINAL_CREDITOR: ${debtPartyInfo.originalCreditor}` : '',
      ]
        .filter(Boolean)
        .join('\n');
      const summonsBlock = draft.type === 'court' ? formatSummonsContextForPrompt(summonsAffidavitContext) : '';

      const legalBasis = spec?.legalBasis?.map((c) => `${c.shortName} (${c.cite}): ${c.description}`).join('\n') ?? '';

      const system = `You draft print-ready consumer debt/legal letters. Return ONLY the letter body text (no JSON, no markdown).\n\nRules:\n- Do not invent facts (amounts, dates, account numbers, court deadlines). If missing, use placeholders like [DATE], [ACCOUNT_REF], [CASE_NUMBER], [STATE], [AMOUNT], [LAST_PAYMENT_DATE].\n- Keep it firm and professional. Avoid giving legal advice.\n- If citations are provided below, you may reference them, but do not add new citations that are not provided.\n- When SUMMONS_AND_EVIDENCE is provided, tailor defenses and factual paragraphs to those extracted facts â€” do not contradict uploaded document details.\n`;

      const user = `DRAFT A LETTER.\n\nLETTER_TYPE: ${draft.type}\nSPEC: ${spec?.title || draft.specId}\nSCENARIO: ${String(recommendedScenario || 'unknown')}\nDEBT_CASE_NAME: ${debtName}\nSTATE: ${jurisdictionState || '[STATE]'}\nCASE_NUMBER: ${caseNumber || '[CASE_NUMBER]'}\nDEBT_TYPE: ${String((debt as any)?.type || '')}\n\nRECIPIENT_AND_ACCOUNT:\n${recipientBlock || '(not provided)'}\n\n${summonsBlock ? `SUMMONS_AND_EVIDENCE:\n${summonsBlock}\n\n` : ''}KEY_PRINCIPLE:\n${spec?.keyPrinciple || ''}\n\nWHEN_TO_USE:\n${(spec?.whenToUse || []).map((x) => `- ${x}`).join('\n')}\n\nLEGAL_BASIS:\n${legalBasis || '(none provided)'}\n\nOUTPUT:\n- Provide the body text only.\n- Include a short section that lists what documents youâ€™re requesting (if applicable).\n- If this is a court/affidavit draft, keep it structured and include placeholders for jurisdiction-specific filings.`;

      const ai = await callAiGateway({
        taskType: 'legal_debt_letter_draft',
        responseFormat: 'text',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        context: { partnerId: partner.id, debtId: debt?.id ?? null, specId: draft.specId, scenario: String(recommendedScenario || '') },
      });

      const text = String(ai.text || '').trim();
      if (!text) throw new Error('AI returned empty output.');
      setDraft((prev) => (prev ? { ...prev, html: ensureHtmlDraft(text) } : prev));
      setDraftNotice('AI drafted this letter. Review and edit before saving.');
    } catch (e: any) {
      setDraftErr(e?.message || 'AI draft failed.');
    } finally {
      setDraftBusy(false);
    }
  };

  const generateDisputeLetterForBureau = async (b: Bureau, opts: { download: boolean }) => {
    const items = selectedByBureau[b] ?? [];
    if (!items.length) {
      setPdfErr(`Select disputes for ${bureauShortCode(b)} first â€” click "Select disputes" or open the picker.`);
      setPickerOpen(true);
      return;
    }

    // Enforce: one negative category per bureau letter (collections + charge-offs are the same category).
    const cats = Array.from(new Set(items.map((s) => letterCategoryForCandidate(s.candidate as any).key)));
    if (cats.length > 1) {
      const labels = Array.from(new Set(items.map((s) => letterCategoryForCandidate(s.candidate as any).label)));
      setPdfErr(`This ${bureauShortCode(b)} letter mixes multiple negative categories (${labels.join(', ')}). Split them into separate letters.`);
      return;
    }

    if (!canUseLetters) {
      setPdfErr('Letters is locked on your current plan. Open Billing to unlock Letters.');
      return;
    }

    const missingPacks = (() => {
      const types = Array.from(new Set(items.map((s) => classifyCandidateNegativeType(s.candidate as any))));
      const needed = types.map((t) => requiredPackKeyForNegativeType(t as any)).filter((x): x is string => Boolean(x));
      const missing = needed.filter((k) => !hasEntitlement(partner.id, k));
      return Array.from(new Set(missing));
    })();
    if (missingPacks.length) {
      setPdfErr(`This selection includes specialty negatives that require a letter pack. Missing: ${missingPacks.join(', ')}`);
      return;
    }

    const busy = pdfBusyByBureau[b];
    if (busy) return;

    const round = roundByBureau[b];
    const tone = toneByBureau[b];
      let introHtml = introByBureau[b];
      if (activeVaultTemplate?.bodyText?.trim()) {
        introHtml = plainTextToHtml(activeVaultTemplate.bodyText.trim());
      } else if (tplRendered?.text?.trim() && String(tplBase?.category || '').includes('dispute')) {
        introHtml = plainTextToHtml(tplRendered.text.trim());
      }
      const introTextRaw = htmlToPlainText(introHtml || '');
      const dominant = dominantNegativeTypeFromCandidates(items.map((s) => s.candidate as import('../../domain/creditReports').DisputeCandidate));
      const fiveStepIntro = buildFiveStepDisputeIntro({
        tone: disputeToneForFiveStep(tone),
        negativeType: dominant,
        round,
        accountLabel: items.length === 1 ? items[0]?.candidate.account : undefined,
        transferNote: roundTransferNote.trim() || undefined,
      });
      const introText =
        !introTextRaw.trim() || isStockDisputeIntro(introTextRaw)
          ? fiveStepIntro
          : mergeTransferNote(introTextRaw, roundTransferNote);

    setPdfErr(null);
    setPdfBusyByBureau((prev) => ({ ...prev, [b]: true }));
    try {
      const evidenceMismatches = items
        .flatMap((s) => {
          const ids = evidenceIdsByCandidateId[s.key]?.length ? evidenceIdsByCandidateId[s.key]! : evidenceByCandidateId[s.key] ? [evidenceByCandidateId[s.key]!] : [];
          return ids.map((evId) => {
            const ev = evidence.find((x) => x.id === evId) ?? null;
            if (!ev) return null;
            if (evidenceMatchesAccount({ accountName: s.candidate.account, candidateType: s.candidate.type, evidence: ev })) return null;
            return `${s.candidate.account}: ${describeEvidenceMismatch({ accountName: s.candidate.account, evidence: ev })}`;
          });
        })
        .filter(Boolean) as string[];
      if (evidenceMismatches.length) {
        setPdfErr(`Evidence mismatch â€” fix before generating:\n${evidenceMismatches.join('\n')}`);
        return;
      }

      // Auto-fill: if an item has no selected reasons, apply the top suggested baseline reasons
      // so generation is never blocked by an empty reasons list.
      const autoFilledReasonsByCandidateId: Record<string, string[]> = { ...reasonsByCandidateId };
      let autoFilledCount = 0;
      let aiRankedCount = 0;
      for (const s of items) {
        const cur = (autoFilledReasonsByCandidateId[s.key] ?? []).map((x) => String(x || '').trim()).filter(Boolean);
        if (cur.length >= 3) continue;
        const rid = (s.source.kind === 'report' ? s.source.reportId : '') || s.candidate.reportId || '';
        const parsed = rid ? parsedByReportId.get(rid) : undefined;
        const evId = evidenceByCandidateId[s.key] || evidenceIdsByCandidateId[s.key]?.[0];
        const ev = evId ? evidence.find((x) => x.id === evId) : null;
        const aiRes = await buildDisputeReasonsWithAi({
          candidate: s.candidate as any,
          parsed,
          existing: cur,
          evidence: ev,
          maxReasons: 5,
          preferAi: true,
        });
        const enriched = aiRes.reasons;
        if (aiRes.usedAi) aiRankedCount += 1;
        if (enriched.length <= cur.length) continue;
        autoFilledReasonsByCandidateId[s.key] = enriched;
        autoFilledCount += 1;
      }
      if (autoFilledCount) {
        setReasonsByCandidateId((prev) => ({ ...prev, ...autoFilledReasonsByCandidateId }));
        setReturnNotice(
          `Auto-filled ${autoFilledCount} item${autoFilledCount === 1 ? '' : 's'} with dispute reasons${aiRankedCount ? ` (${aiRankedCount} AI-ranked)` : ' (Metro 2 + library)'}. Review/edit anytime.`,
        );
      }

      // Seed purpose-correct bureau laws when an item has none yet.
      const autoFilledLawsByCandidateId: Record<string, LetterCitation[]> = { ...lawsByCandidateId };
      let autoLawCount = 0;
      for (const s of items) {
        const cur = autoFilledLawsByCandidateId[s.key] ?? [];
        if (cur.length) continue;
        autoFilledLawsByCandidateId[s.key] = resolveBureauDisputeLaws(classifyCandidateNegativeType(s.candidate as any));
        autoLawCount += 1;
      }
      if (autoLawCount) {
        setLawsByCandidateId((prev) => ({ ...prev, ...autoFilledLawsByCandidateId }));
      }

      const disputeItems: DisputeLetterItem[] = items.map((s) => {
        const evIds = evidenceIdsByCandidateId[s.key]?.length ? evidenceIdsByCandidateId[s.key]! : evidenceByCandidateId[s.key] ? [evidenceByCandidateId[s.key]!] : [];
        const itemEvidence = evIds.map((id) => evidence.find((x) => x.id === id)).filter(Boolean) as typeof evidence;
        const identityExhibits = identityEvidenceIds
          .map((id) => evidence.find((x) => x.id === id))
          .filter(Boolean) as typeof evidence;
        const linkedEvidence = [...itemEvidence, ...identityExhibits.filter((x) => !itemEvidence.some((y) => y.id === x.id))];
        const ev = linkedEvidence[0] ?? null;
        return {
          candidate: { ...s.candidate, id: s.key },
          evidence: ev ? { filename: ev.filename, blobRef: ev.blobRef, mimeType: ev.mimeType } : null,
          evidenceList: linkedEvidence.map((item) => ({ filename: item.filename, blobRef: item.blobRef, mimeType: item.mimeType })),
          reasons: autoFilledReasonsByCandidateId[s.key] ?? [],
          laws: (autoFilledLawsByCandidateId[s.key] ?? []).map((l) => ({ cite: l.cite, shortLabel: l.shortLabel })),
          narrative:
            (aiNarrativeByCandidateKey[s.key] || '').trim() ||
            buildFiveStepItemPreamble({
              candidate: { ...s.candidate, id: s.key } as import('../../domain/creditReports').DisputeCandidate,
              round,
              exhibitLabel: linkedEvidence.length ? 'Exhibit 1' : 'Exhibit A',
            }),
        };
      });
      const missingEvidence = disputeItems.filter((x) => !x.evidence?.blobRef);

      const footerHtml = footerByBureau[b] || plainTextToHtml(defaultDisputeFooter(tone));
      const footerText = htmlToPlainText(footerHtml || '') || defaultDisputeFooter(tone);

      addAuditEvent({
        partnerId: partner.id,
        actorType: layout === 'embedded' ? 'admin' : 'partner',
        actorEmail: undefined,
        action: 'letter.dispute_ready',
        entityType: 'partner',
        entityId: partner.id,
        meta: { kind: 'dispute', bureau: b, items: disputeItems.length, missingEvidence: missingEvidence.length },
      });

      const res = await downloadInlineDisputeLetterPdf({
        partnerName: canonicalIdentity.fullName || 'Partner',
        bureau: b,
        round,
        tone,
        items: disputeItems,
        introOverride: introText,
        footerOverride: footerText,
        senderNameOverride: senderName || undefined,
        senderAddress: {
          addressLine1: senderAddressLine1 || canonicalIdentity.addressLine1,
          addressLine2: senderAddressLine2 || canonicalIdentity.address2,
          cityStateZip: senderCityStateZip || canonicalIdentity.cityStateZip,
        },
        bureauAddressOverride: (() => {
          const cur = bureauAddressDraftByBureau[b];
          const name = String(cur?.name || '').trim() || bureauDisputeAddress(b).name;
          const lines = String(cur?.linesText || '')
            .split('\n')
            .map((x) => x.trim())
            .filter(Boolean);
          return { name, lines: lines.length ? lines : bureauDisputeAddress(b).lines };
        })(),
        subjectLineOverride: (subjectLineByBureau[b] || '').trim() || undefined,
        filename: `FinelyCred_Dispute_${safePartnerName(senderName || canonicalIdentity.fullName)}_${bureauShortCode(b)}_${today}.pdf`,
        persistToVault: true,
        autoDownload: false,
        includeBlob: opts.download,
      });

      if (opts.download && res.blob) downloadBlob({ blob: res.blob, filename: res.filename });

      const createdAt = nowIso();
      const letterId = newId('letter');
      const letter = upsertLetter({
        id: letterId,
        partnerId: partner.id,
        type: 'dispute',
        title: `Dispute letter â€¢ ${bureauShortCode(b)} â€¢ ${round}`,
        createdAt,
        body: renderDisputeSnapshotHtml({
          bureau: b,
          round,
          tone,
          intro: introText,
          items: disputeItems,
          sender: {
            name: senderName || canonicalIdentity.fullName || undefined,
            addressLine1: senderAddressLine1 || canonicalIdentity.addressLine1,
            addressLine2: senderAddressLine2 || canonicalIdentity.address2,
            cityStateZip: senderCityStateZip || canonicalIdentity.cityStateZip,
          },
          bureauAddress: (() => {
            const cur = bureauAddressDraftByBureau[b];
            const name = String(cur?.name || '').trim() || bureauDisputeAddress(b).name;
            const lines = String(cur?.linesText || '')
              .split('\n')
              .map((x) => x.trim())
              .filter(Boolean);
            return { name, lines: lines.length ? lines : bureauDisputeAddress(b).lines };
          })(),
          subjectLine: (subjectLineByBureau[b] || '').trim() || SUBJECT_LINE,
        }),
        status: 'generated',
        pdfBlobRef: res.pdfBlobRef ?? undefined,
        pdfFilename: res.filename,
        relatedEvidenceIds: disputeItems
          .map((x) => evidenceByCandidateId[String(x.candidate.id || '')])
          .filter((x): x is string => Boolean(x)),
        meta: {
          bureau: b,
          round,
          tone,
          introOverride: introText,
          footerOverride: footerText,
          candidateIds: disputeItems.map((x) => x.candidate.id),
          evidenceByCandidateId,
          reasonsByCandidateId,
          aiNarrativeByCandidateKey,
          aiQuestions: aiQuestionsByBureau?.[b] ?? [],
        },
      });

      addAuditEvent({
        partnerId: partner.id,
        actorType: layout === 'embedded' ? 'admin' : 'partner',
        actorEmail: undefined,
        action: 'letter.generated',
        entityType: 'letter',
        entityId: letter.id,
        meta: { kind: 'dispute', bureau: b, round, tone, items: disputeItems.length, pdfSaved: Boolean(res.pdfBlobRef) },
      });
      addAuditEvent({
        partnerId: partner.id,
        actorType: layout === 'embedded' ? 'admin' : 'partner',
        actorEmail: undefined,
        action: 'letter.saved',
        entityType: 'letter',
        entityId: letter.id,
        meta: { kind: 'dispute', pdfBlobRef: res.pdfBlobRef ?? null, filename: res.filename },
      });
      notifyPartnerLetterEvent({
        event: 'saved',
        letterIds: [letter.id],
        letterTitles: [letter.title || `${b} dispute letter`],
      });

      // Save/track the round inside Dispute Center (cases).
      const onlyCaseId = (() => {
        const caseIds = new Set(items.filter((x) => x.source.kind === 'case').map((x) => (x.source as any).caseId));
        if (caseIds.size !== 1) return null;
        const id = Array.from(caseIds)[0] as string;
        const allFromSame = items.every((x) => x.source.kind === 'case' && (x.source as any).caseId === id);
        return allFromSame ? id : null;
      })();

      const roundMeta = { round, tone, createdAt, letterId: letter.id };
      const caseItems = disputeItems.map((x) =>
        candidateToCaseItem(x.candidate as any, {
          evidenceId: evidenceByCandidateId[x.candidate.id],
          reasons: reasonsByCandidateId[x.candidate.id] ?? [],
        }),
      );

      const ensureTrackerTasks = (caseId: string) => {
        const existing = listTasksByPartner(partner.id).filter((t) => t.relatedCaseId === caseId);
        const haveTag = (tag: string) => existing.some((t) => (t.tags ?? []).includes(tag));
        const actorDefault: 'partner' | 'admin' = layout === 'embedded' ? 'admin' : 'partner';

        const types: NegativeType[] = Array.from(
          new Set(
            disputeItems
              .map((x) => classifyCandidateNegativeType(x.candidate as any))
              .map((x) => (NEGATIVE_PLAYBOOKS[x] ? x : 'unknown') as NegativeType),
          ),
        );

        for (const nt of types) {
          const pb = NEGATIVE_PLAYBOOKS[nt] ?? NEGATIVE_PLAYBOOKS.unknown;
          const tag = `playbook:${pb.key}`;
          if (haveTag(tag)) continue;
          for (const tmpl of pb.tasks) {
            const priority = tmpl.priority ?? 'normal';
            const dueDays = priority === 'urgent' ? 2 : priority === 'high' ? 4 : priority === 'low' ? 14 : 7;
            createTask({
              partnerId: partner.id,
              title: tmpl.title,
              kind: tmpl.kind,
              status: 'pending',
              stage: tmpl.stage,
              priority,
              dueAt: addDaysIso(createdAt, dueDays),
              relatedCaseId: caseId,
              relatedLetterId: letter.id,
              assignedTo: tmpl.assignedTo ?? actorDefault,
              tags: Array.from(new Set([tag, `bureau:${b}`, ...(tmpl.tags ?? [])])),
              notes: tmpl.notes,
            });
          }

          addAuditEvent({
            partnerId: partner.id,
            actorType: actorDefault,
            actorEmail: undefined,
            action: 'case.playbook_tasks_created',
            entityType: 'case',
            entityId: caseId,
            meta: { bureau: b, negativeType: pb.key, tasks: pb.tasks.length },
          });
        }
      };

      if (onlyCaseId) {
        addRoundToCase({ caseId: onlyCaseId, round: roundMeta as any, replaceIfSameRound: true });
        ensureTrackerTasks(onlyCaseId);
      } else {
        const reportIds = Array.from(new Set(disputeItems.map((x) => x.candidate.reportId).filter((x): x is string => Boolean(x))));
        const created = createDisputeCase({
          partnerId: partner.id,
          bureau: b,
          title:
            disputeItems.length === 1
              ? `${disputeItems[0]!.candidate.account} â€” ${disputeItems[0]!.candidate.type}`
              : `Dispute â€¢ ${bureauShortCode(b)} â€¢ ${disputeItems.length} items`,
          latestReportId: reportIds.length === 1 ? reportIds[0] : undefined,
          items: caseItems,
          initialRound: roundMeta as any,
        });
        ensureTrackerTasks(created.id);
      }

      setLastGeneratedAtByBureau((prev) => ({ ...prev, [b]: createdAt }));

      // After generating, clear this bureau's selection so items don't remain "stuck" as selected.
      // (You can always re-open the picker and re-add items for a revision.)
      const clearedKeys = new Set((selectedByBureau[b] ?? []).map((x) => x.key));
      setSelectedDisputes((prev) => prev.filter((x) => x.candidate.bureau !== b));
      setEvidenceByCandidateId((prev) => {
        const out = { ...prev };
        for (const k of Object.keys(out)) if (clearedKeys.has(k)) delete out[k];
        return out;
      });
      setReasonsByCandidateId((prev) => {
        const out = { ...prev };
        for (const k of Object.keys(out)) if (clearedKeys.has(k)) delete out[k];
        return out;
      });
      setLawsByCandidateId((prev) => {
        const out = { ...prev };
        for (const k of Object.keys(out)) if (clearedKeys.has(k)) delete out[k];
        return out;
      });
      setAiNarrativeByCandidateKey((prev) => {
        const out = { ...prev };
        for (const k of Object.keys(out)) if (clearedKeys.has(k)) delete out[k];
        return out;
      });
      setFocusedKeyByBureau((prev) => ({ ...prev, [b]: null }));

      openVault({ letterId: letter.id, preview: true });
    } catch (e: any) {
      setPdfErr(e?.message || 'Failed to generate PDF.');
    } finally {
      setPdfBusyByBureau((prev) => ({ ...prev, [b]: false }));
    }
  };

  // Deep-link support: `?caseId=...` preloads that case into the selection.
  useEffect(() => {
    if (!partner) return;
    const caseId = new URLSearchParams(location.search).get('caseId');
    if (!caseId) return;
    const c = getCase(caseId);
    if (!c || c.partnerId !== partner.id) return;
    setTab('dispute');
    const items: SelectedDispute[] = (c.items || []).map((it) => ({
      key: it.candidateId || it.id,
      candidate: {
        id: it.candidateId || it.id,
        bureau: it.bureau,
        account: it.account,
        type: it.type,
        status: it.status,
        code: it.code,
        reportId: it.reportId,
      },
      source: { kind: 'case', caseId: c.id, caseItemId: it.id },
      prefillEvidenceId: it.evidenceId,
      prefillReasons: it.reasons ?? [],
    }));
    setSelectedDisputes(items);
    const ev: Record<string, string | undefined> = {};
    const rs: Record<string, string[]> = {};
    for (const it of c.items || []) {
      const key = it.candidateId || it.id;
      ev[key] = it.evidenceId;
      rs[key] = (it.reasons ?? []).map((x) => x.trim()).filter(Boolean);
    }
    setEvidenceByCandidateId(ev);
    setReasonsByCandidateId(rs);
    const lawSeed: Record<string, LetterCitation[]> = {};
    for (const it of c.items || []) {
      const key = it.candidateId || it.id;
      lawSeed[key] = resolveBureauDisputeLaws(
        classifyCandidateNegativeType({
          id: key,
          bureau: it.bureau,
          account: it.account,
          type: it.type,
          status: it.status,
          code: it.code,
          reportId: it.reportId,
        } as any),
      );
    }
    setLawsByCandidateId(lawSeed);
    const roundParam = new URLSearchParams(location.search).get('round') as LetterRound | null;
    const suggested = suggestNextRound(c);
    const nextRound =
      roundParam && DISPUTE_ROUND_ORDER.includes(roundParam as DisputeRoundLabel)
        ? (roundParam as DisputeRoundLabel)
        : suggested;
    setRoundByBureau((prev) => ({ ...prev, [c.bureau]: nextRound }));
  }, [location.search, partner?.id]);

  // Auto-restore saved progress (unless explicitly deep-linking a case).
  const [didRestore, setDidRestore] = useState(false);
  useEffect(() => {
    if (!partner) return;
    if (didRestore) return;
    setDidRestore(true);

    const q = new URLSearchParams(location.search);
    if (q.get('caseId')) return;

    const draft = loadLettersCommandCenterDraft(partner.id);
    if (!draft) return;

    setTab('dispute');
    const nextSelected = Array.isArray(draft.selectedDisputes) ? draft.selectedDisputes : [];
    const keySet = new Set(nextSelected.map((s) => s.key));
    const pickMap = <T,>(m: Record<string, T> | undefined) =>
      Object.fromEntries(Object.entries(m || {}).filter(([k]) => keySet.has(k)));

    setSelectedDisputes(nextSelected);
    setEvidenceByCandidateId(pickMap(draft.evidenceByCandidateId) as any);
    if (Array.isArray(draft.identityEvidenceIds)) setIdentityEvidenceIds(draft.identityEvidenceIds.filter(Boolean));
    if (draft.savedAt) setDraftSavedAt(draft.savedAt);
    setReasonsByCandidateId(pickMap(draft.reasonsByCandidateId) as any);
    if (draft.lawsByCandidateId) {
      setLawsByCandidateId(pickMap(draft.lawsByCandidateId as Record<string, LetterCitation[]>) as any);
    } else {
      const seeded: Record<string, LetterCitation[]> = {};
      for (const s of nextSelected) {
        seeded[s.key] = resolveBureauDisputeLaws(classifyCandidateNegativeType(s.candidate as any));
      }
      setLawsByCandidateId(seeded);
    }
    if (draft.aiNarrativeByCandidateKey) setAiNarrativeByCandidateKey(pickMap(draft.aiNarrativeByCandidateKey) as any);
    if (draft.aiQuestionsByBureau) setAiQuestionsByBureau(draft.aiQuestionsByBureau as any);
    if (draft.toneByBureau) setToneByBureau((prev) => ({ ...prev, ...(draft.toneByBureau as any) }));
    if (draft.roundByBureau) setRoundByBureau((prev) => ({ ...prev, ...(draft.roundByBureau as any) }));
    if (typeof (draft as any).roundTransferNote === 'string') setRoundTransferNote((draft as any).roundTransferNote);
    if (draft.introByBureau) {
      const next: any = {};
      for (const [k, v] of Object.entries(draft.introByBureau as any)) next[k] = ensureHtmlDraft(String(v || ''));
      setIntroByBureau((prev) => ({ ...prev, ...next }));
    }
    if ((draft as any).footerByBureau) {
      const next: any = {};
      for (const [k, v] of Object.entries((draft as any).footerByBureau as any)) next[k] = ensureHtmlDraft(String(v || ''));
      setFooterByBureau((prev) => ({ ...prev, ...next }));
    }
    if ((draft as any).sender) {
      const s = (draft as any).sender || {};
      if (typeof s.name === 'string') setSenderName(s.name);
      if (typeof s.addressLine1 === 'string') setSenderAddressLine1(s.addressLine1);
      if (typeof s.addressLine2 === 'string') setSenderAddressLine2(s.addressLine2);
      if (typeof s.cityStateZip === 'string') setSenderCityStateZip(s.cityStateZip);
    }
    if ((draft as any).subjectLineByBureau) {
      setSubjectLineByBureau((prev) => ({ ...prev, ...((draft as any).subjectLineByBureau as any) }));
    }
    if ((draft as any).bureauAddressByBureau) {
      const raw = (draft as any).bureauAddressByBureau as any;
      setBureauAddressDraftByBureau((prev) => {
        const next = { ...prev } as any;
        for (const [k, v] of Object.entries(raw || {})) {
          const name = String((v as any)?.name || '').trim();
          const lines = Array.isArray((v as any)?.lines) ? (v as any).lines.map((x: any) => String(x || '').trim()).filter(Boolean) : [];
          if (!name && lines.length === 0) continue;
          next[k] = { name: name || next[k]?.name || '', linesText: lines.join('\n') };
        }
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner?.id]);

  // Auto-save progress (debounced).
 // Auto-save progress (debounced).
// Important:
// - Disable in embedded/admin mode to avoid parent detail page render loops.
// - Do not treat default bureau subject/address values as "draft content".
// - Do not write the same snapshot repeatedly.
// - Avoid triggering finely:store loops from saveLettersCommandCenterDraft.
const lastSavedDraftJsonRef = React.useRef<string>('');

useEffect(() => {
  if (!partner?.id) return;

  // Autosave in portal and embedded admin so leaving Letters does not wipe progress.
  const cleanRecord = <T,>(obj: Record<string, T | undefined | null>): Record<string, NonNullable<T>> =>
    Object.fromEntries(
      Object.entries(obj || {}).filter(([, value]) => {
        if (value === null) return false;
        if (Array.isArray(value)) return value.length > 0;
        if (value && typeof value === 'object') return Object.keys(value as any).length > 0;
        return value != null && String(value).trim() !== '';
      }),
    ) as Record<string, NonNullable<T>>;

  const cleanStringRecord = <K extends string>(obj: Record<K, string>): Record<string, string> =>
    Object.fromEntries(
      Object.entries(obj || {}).filter(([, value]) => String(value || '').trim() !== ''),
    ) as Record<string, string>;

  const defaultSubjectLineByBureau: Record<Bureau, string> = {
    EXP: SUBJECT_LINE,
    EQF: SUBJECT_LINE,
    TUC: SUBJECT_LINE,
  };

  const subjectOverrides = Object.fromEntries(
    (['EXP', 'EQF', 'TUC'] as Bureau[])
      .map((b) => {
        const current = String(subjectLineByBureau[b] || '').trim();
        const defaultValue = String(defaultSubjectLineByBureau[b] || '').trim();
        return [b, current && current !== defaultValue ? current : ''];
      })
      .filter(([, value]) => Boolean(value)),
  ) as Partial<Record<Bureau, string>>;

  const bureauAddressOverrides = Object.fromEntries(
    (['EXP', 'EQF', 'TUC'] as Bureau[])
      .map((b) => {
        const cur = bureauAddressDraftByBureau[b];
        const defaultAddr = bureauDisputeAddress(b);

        const name = String(cur?.name || '').trim();
        const linesText = String(cur?.linesText || '').trim();

        const defaultName = String(defaultAddr.name || '').trim();
        const defaultLinesText = defaultAddr.lines.join('\n').trim();

        const changed = name !== defaultName || linesText !== defaultLinesText;
        if (!changed) return null;

        const lines = linesText
          .split('\n')
          .map((x) => x.trim())
          .filter(Boolean);

        return [
          b,
          {
            name: name || defaultAddr.name,
            lines: lines.length ? lines : defaultAddr.lines,
          },
        ];
      })
      .filter(Boolean) as Array<[Bureau, { name: string; lines: string[] }]>,
  ) as Partial<Record<Bureau, { name: string; lines: string[] }>>;

  const sender = {
    name: senderName.trim() || undefined,
    addressLine1: senderAddressLine1.trim() || undefined,
    addressLine2: senderAddressLine2.trim() || undefined,
    cityStateZip: senderCityStateZip.trim() || undefined,
  };

  const hasSender = Object.values(sender).some(Boolean);

  const draftPayload = {
    selectedDisputes,
    evidenceByCandidateId: cleanRecord(evidenceByCandidateId),
    identityEvidenceIds: identityEvidenceIds.filter(Boolean),
    reasonsByCandidateId: cleanRecord(reasonsByCandidateId),
    lawsByCandidateId: cleanRecord(lawsByCandidateId as any),
    aiNarrativeByCandidateKey: cleanStringRecord(aiNarrativeByCandidateKey),
    aiQuestionsByBureau: cleanRecord(aiQuestionsByBureau as any),
    toneByBureau: toneByBureau as any,
    roundByBureau: roundByBureau as any,
    roundTransferNote: roundTransferNote.trim() || undefined,
    introByBureau,
    footerByBureau,
    sender: hasSender ? sender : undefined,
    subjectLineByBureau: subjectOverrides,
    bureauAddressByBureau: bureauAddressOverrides as any,
  };

  const hasAnything =
    selectedDisputes.length > 0 ||
    identityEvidenceIds.length > 0 ||
    Object.keys(draftPayload.evidenceByCandidateId).length > 0 ||
    Object.keys(draftPayload.reasonsByCandidateId).length > 0 ||
    Object.keys(draftPayload.lawsByCandidateId || {}).length > 0 ||
    Object.keys(draftPayload.aiNarrativeByCandidateKey).length > 0 ||
    Object.keys(draftPayload.aiQuestionsByBureau).length > 0 ||
    hasSender ||
    Object.keys(subjectOverrides).length > 0 ||
    Object.keys(bureauAddressOverrides).length > 0;

  const draftJson = JSON.stringify(draftPayload);

  const t = window.setTimeout(() => {
    if (!partner?.id) return;

    if (!hasAnything) {
      if (lastSavedDraftJsonRef.current !== '') {
        clearLettersCommandCenterDraft(partner.id);
        lastSavedDraftJsonRef.current = '';
      }
      return;
    }

    // Prevent repeated storage writes that trigger finely:store and re-render loops.
    if (lastSavedDraftJsonRef.current === draftJson) return;

    saveLettersCommandCenterDraft(partner.id, draftPayload as any);
    lastSavedDraftJsonRef.current = draftJson;
    setDraftSavedAt(new Date().toISOString());
  }, 500);

  return () => window.clearTimeout(t);
}, [
  partner?.id,
  layout,
  selectedDisputes,
  evidenceByCandidateId,
  identityEvidenceIds,
  reasonsByCandidateId,
  lawsByCandidateId,
  aiNarrativeByCandidateKey,
  aiQuestionsByBureau,
  toneByBureau,
  roundByBureau,
  roundTransferNote,
  introByBureau,
  footerByBureau,
  senderName,
  senderAddressLine1,
  senderAddressLine2,
  senderCityStateZip,
  subjectLineByBureau,
  bureauAddressDraftByBureau,
]);

  const selectedByBureau = useMemo(() => {
    const m: Record<Bureau, SelectedDispute[]> = { EXP: [], EQF: [], TUC: [] };
    for (const s of selectedDisputes) m[s.candidate.bureau].push(s);
    return m;
  }, [selectedDisputes]);

  // Seed bureau-purpose laws for newly selected disputes (editable in Focused item).
  useEffect(() => {
    if (!selectedDisputes.length) return;
    setLawsByCandidateId((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const s of selectedDisputes) {
        if (next[s.key]?.length) continue;
        next[s.key] = resolveBureauDisputeLaws(classifyCandidateNegativeType(s.candidate as any));
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [selectedDisputes]);

  const disputeCountsByBureau = useMemo(
    () =>
      ({
        EXP: selectedByBureau.EXP.length,
        EQF: selectedByBureau.EQF.length,
        TUC: selectedByBureau.TUC.length,
      }) as Record<Bureau, number>,
    [selectedByBureau],
  );

  const missingEvidenceByBureau = useMemo(() => {
    const out: Record<Bureau, number> = { EXP: 0, EQF: 0, TUC: 0 };
    for (const s of selectedDisputes) {
      const b = s.candidate.bureau;
      if (!evidenceByCandidateId[s.key]) out[b] = (out[b] ?? 0) + 1;
    }
    return out;
  }, [selectedDisputes, evidenceByCandidateId]);

  useEffect(() => {
    if (!selectedDisputes.length) return;
    if ((selectedByBureau[workspaceBureau] ?? []).length > 0) return;
    const next = (['EXP', 'EQF', 'TUC'] as Bureau[]).find((b) => (selectedByBureau[b] ?? []).length > 0);
    if (next) setWorkspaceBureau(next);
  }, [selectedDisputes.length, selectedByBureau, workspaceBureau]);

  useEffect(() => {
    if (tab !== 'dispute') return;
    setIntroByBureau((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const b of ['EXP', 'EQF', 'TUC'] as Bureau[]) {
        const items = selectedByBureau[b] ?? [];
        if (!items.length) continue;
        const raw = htmlToPlainText(prev[b] || '');
        if (!isStockDisputeIntro(raw)) continue;
        const dominant = dominantNegativeTypeFromCandidates(items.map((s) => s.candidate as import('../../domain/creditReports').DisputeCandidate));
        const built = buildFiveStepDisputeIntro({
          tone: disputeToneForFiveStep(toneByBureau[b]),
          negativeType: dominant,
          round: roundByBureau[b],
          accountLabel: items.length === 1 ? items[0]?.candidate.account : undefined,
          transferNote: roundTransferNote.trim() || undefined,
        });
        if (raw.trim() !== built.trim()) {
          next[b] = plainTextToHtml(built);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [selectedDisputes, roundByBureau, toneByBureau, tab, selectedByBureau]);

  const evidencePickerCandidate = useMemo(() => {
    const cid = evidencePicker?.candidateId;
    if (!cid) return null;
    return selectedDisputes.find((s) => s.key === cid) ?? null;
  }, [evidencePicker?.candidateId, selectedDisputes]);

  const evidencePickerItems = useMemo(() => {
    if (!evidencePickerCandidate) return evidence;
    const ranked = rankEvidenceMatches({
      accountName: evidencePickerCandidate.candidate.account,
      candidateType: evidencePickerCandidate.candidate.type,
      evidence: screenshotEvidence,
    });
    const byId = new Map(screenshotEvidence.map((x) => [x.id, x]));
    const sortedScreens = ranked.map((r) => byId.get(r.evidenceId)).filter(Boolean) as typeof screenshotEvidence;
    // Append non-screenshot items so uploads still show in full vault mode if needed.
    const others = evidence.filter((x) => x.type !== 'screenshot');
    return [...sortedScreens, ...others];
  }, [evidence, evidencePickerCandidate, screenshotEvidence]);

  const parsedByReportId = useMemo(() => {
    const m = new Map<string, ParsedCreditReport>();
    for (const r of reports) {
      if (r.parsed) m.set(r.id, r.parsed as any);
    }
    return m;
  }, [reports]);

  // Selectable accounts for the in-popup "choose account + take screenshot" capture flow.
  const evidencePickerAccounts = useMemo((): EvidencePickerAccount[] => {
    return selectedDisputes.map((s): EvidencePickerAccount => {
      const rid = (s.source.kind === 'report' ? s.source.reportId : '') || s.candidate.reportId || '';
      const parsed = rid ? parsedByReportId.get(rid) : undefined;
      const tradeline = parsed ? findMatchingTradeline(parsed, s.candidate.account) : null;
      return {
        id: s.key,
        label: s.candidate.account,
        creditorName: s.candidate.account,
        type: s.candidate.type,
        bureau: s.candidate.bureau,
        last4: tradeline?.accountNumberMasked ?? null,
        tradeline,
        reportId: rid || undefined,
      };
    });
  }, [selectedDisputes, parsedByReportId]);

  const suggestionsById = useMemo(() => {
    const m: Record<string, { id: string; text: string }[]> = {};
    for (const s of selectedDisputes) {
      if (s.source.kind === 'case') {
        const uniq = Array.from(new Set((s.prefillReasons ?? []).map((x) => x.trim()).filter(Boolean)));
        m[s.key] = uniq.map((text, idx) => ({ id: `${s.key}_${idx}`, text }));
        continue;
      }
      const rid = s.source.reportId || s.candidate.reportId || '';
      const parsed = rid ? parsedByReportId.get(rid) : undefined;
      const texts = buildEnrichedReasonsForCandidate({
        candidate: s.candidate as any,
        parsed,
        evidence: (() => {
          const evId = evidenceByCandidateId[s.key];
          return evId ? evidence.find((x) => x.id === evId) ?? null : null;
        })(),
        maxReasons: 5,
      });
      m[s.key] = texts.map((text, idx) => ({ id: `${s.key}_${idx}`, text }));
    }
    return m;
  }, [selectedDisputes, parsedByReportId, evidenceByCandidateId, evidence]);

  // --- Validation/Court letter flow (Debt module) ---
  const debtCases = useMemo(() => (partner ? listDebtByPartner(partner.id) : []), [partner, storeVersion]);
  const [debtId, setDebtId] = useState<string>(debtCases[0]?.id ?? '');
  useEffect(() => {
    if (!debtCases.some((d) => d.id === debtId)) {
      setDebtId(debtCases[0]?.id ?? '');
    }
  }, [partner?.id, debtCases, debtId]);
  const debt = useMemo(() => debtCases.find((d) => d.id === debtId) ?? null, [debtCases, debtId]);
  const processedDocuments = useMemo(
    () => (partner ? listProcessedDocumentsByPartner(partner.id) : []),
    [partner, storeVersion],
  );
  const [selectedSummonsDocId, setSelectedSummonsDocId] = useState<string | null>(null);
  const recommendedScenario = useMemo(() => (debt ? recommendScenarioFromDebt(debt as any) : 'unknown'), [debt]);

  const creditorContacts = useMemo(() => {
    const out: import('../../domain/creditReports').ParsedCreditorContact[] = [];
    for (const r of reports) {
      for (const c of contactsFromParsedReport((r as any)?.parsed)) {
        if (!String(c?.creditorName || '').trim()) continue;
        out.push(c);
      }
    }
    // De-dupe by name + address + account so two placements from one collector
    // stay separate rows instead of bunching into a single contact.
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const uniq = new Map<string, (typeof out)[number]>();
    for (const c of out) {
      const key = `${norm(c.creditorName)}|${norm(c.address || '')}|${norm(c.accountNumberMasked || '')}`;
      if (!uniq.has(key)) uniq.set(key, c);
    }
    return Array.from(uniq.values()).slice(0, 200);
  }, [reports.length, storeVersion]);

  // Prefer address-bearing Creditor Contacts rows (phone-only must not win).
  const matchedCreditorContact = useMemo(() => {
    if (!debt?.name && !debt?.collectorName && !debt?.recipientName) return null;
    return (
      matchCreditorContactForName(
        debt?.recipientName || debt?.name || '',
        creditorContacts,
        debt?.accountNumberMasked,
      ) ||
      (debt?.collectorName
        ? matchCreditorContactForName(debt.collectorName, creditorContacts, debt.accountNumberMasked)
        : null) ||
      null
    );
  }, [debt?.id, debt?.name, debt?.recipientName, debt?.collectorName, debt?.accountNumberMasked, creditorContacts]);

  const today = new Date().toISOString().slice(0, 10);
  const letterDate = letterDateDisplay();

  const tenantId = safeText((partner as any)?.tenantId) || FINELY_TENANT_ID;
  const partnerCf = useMemo(() => getCustomFieldValues('partners', partner.id, tenantId), [partner.id, tenantId]);

  const canonicalIdentity = useMemo(() => {
    const pi = (reports[0] as any)?.parsed?.personalInfo ?? null;
    return getCanonicalPartnerIdentity({ partner, tenantId, partnerCf, reportPersonalInfo: pi });
  }, [partner, partnerCf?.updatedAt, reports.length, tenantId]);

  const letterSelfIdentity = useMemo<SelfPartyIdentity>(() => {
    const addresses: string[] = [
      [canonicalIdentity.address1 || canonicalIdentity.addressLine1, canonicalIdentity.address2, canonicalIdentity.cityStateZip]
        .filter(Boolean)
        .join(' '),
    ].filter(Boolean);
    for (const r of reports) {
      const fromPi = selfIdentityFromPersonalInfo((r as any)?.parsed?.personalInfo);
      for (const a of fromPi?.addresses || []) {
        if (a) addresses.push(String(a));
      }
    }
    return {
      fullName: canonicalIdentity.fullName || undefined,
      addresses,
    };
  }, [
    canonicalIdentity.fullName,
    canonicalIdentity.address1,
    canonicalIdentity.addressLine1,
    canonicalIdentity.address2,
    canonicalIdentity.cityStateZip,
    reports,
    storeVersion,
  ]);

  // Default sender fields from canonical identity (but do not clobber user edits).
  useEffect(() => {
    setSenderName((prev) => (prev.trim() ? prev : canonicalIdentity.fullName || partner.profile.fullName || ''));
    setSenderAddressLine1((prev) => (prev.trim() ? prev : canonicalIdentity.address1 || canonicalIdentity.addressLine1 || ''));
    setSenderAddressLine2((prev) => (prev.trim() ? prev : canonicalIdentity.address2 || ''));
    setSenderCityStateZip((prev) => (prev.trim() ? prev : canonicalIdentity.cityStateZip || ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canonicalIdentity.fullName, canonicalIdentity.address1, canonicalIdentity.address2, canonicalIdentity.addressLine1, canonicalIdentity.cityStateZip, partner.profile.fullName]);

  const senderMailingComplete = useMemo(
    () =>
      hasCompleteLetterMailingAddress({
        name: senderName || canonicalIdentity.fullName,
        addressLine1: senderAddressLine1 || canonicalIdentity.address1 || canonicalIdentity.addressLine1,
        addressLine2: senderAddressLine2 || canonicalIdentity.address2,
        cityStateZip: senderCityStateZip || canonicalIdentity.cityStateZip,
        city: canonicalIdentity.city,
        state: canonicalIdentity.state,
        postalCode: canonicalIdentity.postalCode,
      }),
    [
      senderName,
      senderAddressLine1,
      senderAddressLine2,
      senderCityStateZip,
      canonicalIdentity.fullName,
      canonicalIdentity.address1,
      canonicalIdentity.addressLine1,
      canonicalIdentity.address2,
      canonicalIdentity.cityStateZip,
      canonicalIdentity.city,
      canonicalIdentity.state,
      canonicalIdentity.postalCode,
    ],
  );

  const debtPartyInfo = useMemo(
    () =>
      resolveDebtPartyInfo({
        debt,
        signals: extractReportDebtSignals(reports),
        contacts: creditorContacts,
        documents: processedDocuments,
        self: letterSelfIdentity,
      }),
    [debt, creditorContacts, processedDocuments, reports, storeVersion, letterSelfIdentity],
  );

  const summonsAffidavitContext = useMemo(
    () =>
      buildSummonsAffidavitContext({
        debt,
        documents: processedDocuments.filter((d) => !selectedSummonsDocId || d.id === selectedSummonsDocId),
        party: debtPartyInfo,
      }),
    [debt, processedDocuments, selectedSummonsDocId, debtPartyInfo],
  );

  const handleDebtIntelChange = (next: import('../../domain/debt').DebtCase) => {
    upsertDebt(next);
    setDebtId(next.id);
    try {
      window.dispatchEvent(new CustomEvent('finely:store'));
    } catch {
      // ignore
    }
  };

  const persistDebtSenderSnapshot = () => {
    if (!debt) return;
    const snap = captureSenderSnapshot({
      fullName: senderName || canonicalIdentity.fullName || '',
      address1: senderAddressLine1 || canonicalIdentity.address1 || canonicalIdentity.addressLine1,
      address2: senderAddressLine2 || canonicalIdentity.address2,
      city: canonicalIdentity.city,
      state: canonicalIdentity.state,
      postalCode: canonicalIdentity.postalCode,
      phone: canonicalIdentity.phone,
      // Do not snapshot partner login email onto letter sender blocks.
      email: undefined,
    });
    handleDebtIntelChange({ ...debt, senderSnapshot: snap });
  };

  const buildDebtLetterArgs = () => {
    const isCourtDraft = draft?.type === 'court';
    const firm = isCourtDraft
      ? debt?.plaintiffLawFirm || debt?.collectorName || debtPartyInfo?.collectorName || debtPartyInfo?.recipientName
      : debt?.plaintiffLawFirm;
    const firmAddress = isCourtDraft
      ? debt?.plaintiffLawFirmAddress || debt?.recipientAddress || debtPartyInfo?.recipientAddress || ''
      : debt?.plaintiffLawFirmAddress || '';
    const reportAddr =
      matchedCreditorContact?.address ||
      (debtPartyInfo?.matchedFrom === 'report_contact' || debtPartyInfo?.matchedFrom === 'tradeline'
        ? debtPartyInfo.recipientAddress
        : '') ||
      '';
    const mailTo = resolveLetterMailRecipient({
      preferCounsel: isCourtDraft,
      plaintiffLawFirm: firm,
      plaintiffLawFirmAddress: firmAddress,
      recipientName: debt?.recipientName || debtPartyInfo?.recipientName || debt?.name,
      recipientAddress: debt?.recipientAddress || debtPartyInfo?.recipientAddress,
      reportContactAddress: reportAddr,
      debtCollectorName: debt?.collectorName || debtPartyInfo?.collectorName,
      collectorName: debt?.collectorName,
      creditorName: debt?.name,
      debtName: debt?.name,
      originalCreditorName: debt?.originalCreditor || debtPartyInfo?.originalCreditor,
      plaintiffAttorneyName: debt?.plaintiffAttorneyName,
      senderName: canonicalIdentity.fullName,
      senderAddress1: canonicalIdentity.address1 ?? canonicalIdentity.addressLine1,
      senderCity: canonicalIdentity.city,
      senderPostalCode: canonicalIdentity.postalCode,
    });
    // Persist directory / report-contact TO onto the case when empty (never partner address).
    // Validation: recipient only. Court: may also seed counsel.
    if (
      debt &&
      !mailTo.missing &&
      (mailTo.source === 'directory' || mailTo.source === 'enrichment') &&
      !debt.plaintiffLawFirmAddress &&
      !debt.recipientAddress
    ) {
      handleDebtIntelChange({
        ...debt,
        recipientName: debt.recipientName || mailTo.name,
        recipientAddress: mailTo.address,
        ...(isCourtDraft
          ? {
              plaintiffLawFirm: debt.plaintiffLawFirm || firm || mailTo.name,
              plaintiffLawFirmAddress: mailTo.address,
            }
          : {}),
      });
    }
    if (mailTo.missing) {
      setDraftNotice(mailTo.missingReason || 'Fill the creditor / law firm mailing address before mailing.');
    } else {
      setDraftNotice(
        mailTo.source === 'directory'
          ? 'TO block filled from known firm / collector directory — verify before mailing.'
          : null,
      );
    }
    return {
      creditorName: mailTo.name,
      debtorName: canonicalIdentity.fullName,
      date: letterDate,
      debtorAddress1: canonicalIdentity.address1 ?? canonicalIdentity.addressLine1,
      debtorAddress2: canonicalIdentity.address2,
      debtorCity: canonicalIdentity.city,
      debtorState: canonicalIdentity.state,
      debtorPostalCode: canonicalIdentity.postalCode,
      debtorPhone: canonicalIdentity.phone,
      // Default: no email on letter paper (mailing address + name only).
      debtorEmail: undefined,
      recipientName: mailTo.name,
      recipientAddress: mailTo.address,
      caseNumber: debt?.courtCaseNumber || summonsAffidavitContext.caseNumber,
      plaintiffLawFirm: firm || mailTo.name || summonsAffidavitContext.plaintiffLawFirm,
      plaintiffLawFirmAddress: mailTo.missing
        ? summonsAffidavitContext.counselAddress
        : mailTo.address || summonsAffidavitContext.counselAddress,
      plaintiffAttorneyName: debt?.plaintiffAttorneyName || summonsAffidavitContext.plaintiffAttorneyName,
      plaintiffAttorneyBarNumber: debt?.plaintiffAttorneyBarNumber || summonsAffidavitContext.plaintiffAttorneyBar,
      debtCollectorName: debt?.collectorName || debtPartyInfo?.collectorName || summonsAffidavitContext.collectorName,
      originalCreditorName:
        debt?.originalCreditor || debtPartyInfo?.originalCreditor || summonsAffidavitContext.originalCreditor,
      accountNumber: debt?.accountNumberMasked || summonsAffidavitContext.accountNumberMasked,
      loanId: debt?.loanId,
      borrowerId: debt?.borrowerId,
      affidavitState: canonicalIdentity.state || debt?.stateJurisdiction || summonsAffidavitContext.jurisdictionState,
      affidavitCounty: debt?.affidavitCounty || summonsAffidavitContext.affidavitCounty,
      stateNote: (debt?.stateJurisdiction || summonsAffidavitContext.jurisdictionState)
        ? ` In ${debt?.stateJurisdiction || summonsAffidavitContext.jurisdictionState}, the applicable SOL may apply.`
        : undefined,
      // Always merge scrape/case court fields so validation + affidavits get amount/court/counsel too.
      summonsContext: {
        courtName: summonsAffidavitContext.courtName || debt?.courtName,
        courtDivision: summonsAffidavitContext.courtDivision,
        amountClaimed:
          summonsAffidavitContext.amountClaimed ||
          (debt?.amountCents && debt.amountCents > 0
            ? `$${(debt.amountCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : undefined),
        dateServed: summonsAffidavitContext.dateServed || debt?.dateServed,
        hearingDate: summonsAffidavitContext.hearingDate || debt?.hearingDate,
        jurisdictionState: summonsAffidavitContext.jurisdictionState || debt?.stateJurisdiction,
        collectorName: summonsAffidavitContext.collectorName || debt?.collectorName,
        counselName: summonsAffidavitContext.counselName || debt?.plaintiffLawFirm,
        plaintiffLawFirm: summonsAffidavitContext.plaintiffLawFirm || debt?.plaintiffLawFirm,
        plaintiffAttorneyName: summonsAffidavitContext.plaintiffAttorneyName || debt?.plaintiffAttorneyName,
        plaintiffAttorneyBar: summonsAffidavitContext.plaintiffAttorneyBar || debt?.plaintiffAttorneyBarNumber,
        counselAddress:
          summonsAffidavitContext.counselAddress || debt?.plaintiffLawFirmAddress || debt?.recipientAddress,
        judgeName: summonsAffidavitContext.judgeName,
        caseCaption: summonsAffidavitContext.caseCaption,
        defendantName: summonsAffidavitContext.defendantName,
        documentFacts: summonsAffidavitContext.entityFacts,
      },
    };
  };

  const [draft, setDraft] = useState<null | {
    type: 'validation' | 'court' | 'foreclosure' | 'repossession';
    specId: DebtLetterType | string;
    catalogId?: string;
    /** Partner-facing document title matching the selected letter type */
    title?: string;
    html: string;
    evidenceId?: string;
    /** Forces paper preview when opened from suggestion / build CTAs */
    preferPreview?: boolean;
    previewKey?: string;
    /** Vault letter id created on Generate — Save updates the same record */
    letterId?: string;
  }>(null);
  const [generateBusy, setGenerateBusy] = useState(false);
  const [draftBusy, setDraftBusy] = useState(false);
  const [draftErr, setDraftErr] = useState<string | null>(null);
  const [draftEvidencePickerOpen, setDraftEvidencePickerOpen] = useState(false);
  const [draftTemplatesOpen, setDraftTemplatesOpen] = useState(false);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);

  const fillDebtRecipientAddress = async () => {
    if (!debt) {
      setDraftNotice('Select a debt case first, then fill the mailing address.');
      return;
    }
    setAddressLookupBusy(true);
    try {
      const result = await enrichRecipientAddress({
        preferCounsel: draft?.type === 'court' || Boolean(debt.courtCaseNumber),
        nameCandidates: [
          debt.plaintiffLawFirm,
          debt.plaintiffAttorneyName,
          debt.collectorName,
          debt.recipientName,
          debt.name,
          debtPartyInfo?.recipientName,
          debt.originalCreditor,
          matchedCreditorContact?.creditorName,
        ],
        addressCandidates: [
          debt.plaintiffLawFirmAddress,
          debt.recipientAddress,
          debtPartyInfo?.recipientAddress,
          matchedCreditorContact?.address,
        ],
        phone: debt.recipientPhone || debtPartyInfo?.recipientPhone || matchedCreditorContact?.phone,
      });
      setAddressEnrichMeta(result);
      if (!result?.address) {
        setDraftNotice(result?.hint || 'No mailing address found — enter it from the notice or summons.');
        return;
      }
      handleDebtIntelChange({
        ...debt,
        ...enrichmentToDebtPatch(result),
        recipientName: result.name || debt.recipientName,
        recipientAddress: result.address,
      });
      setDraftNotice(result.hint);
    } finally {
      setAddressLookupBusy(false);
    }
  };

  // Auto-fill TO address when a debt draft opens and the case is missing mailing fields.
  useEffect(() => {
    if (!draft || !debt) return;
    if (debt.recipientAddress || debt.plaintiffLawFirmAddress) return;
    if (debtPartyInfo?.recipientAddress) {
      handleDebtIntelChange({
        ...debt,
        recipientName: debt.recipientName || debtPartyInfo.recipientName,
        recipientAddress: debtPartyInfo.recipientAddress,
        // Do not copy collector mailing into plaintiff — that poisons validation TO.
      });
      setAddressEnrichMeta({
        name: debtPartyInfo.recipientName,
        address: debtPartyInfo.recipientAddress,
        structured: null,
        source: debtPartyInfo.matchedFrom === 'directory' ? 'directory' : 'tradeline',
        confidence: 'medium',
        verifyRequired: true,
        hint: 'Auto-filled recipient address — verify before mailing.',
      });
      return;
    }
    void fillDebtRecipientAddress();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when draft/debt identity changes
  }, [draft?.letterId, draft?.specId, debt?.id]);

  // --- Templates browser (entitled only) ---
  const visibleTemplateBases = useMemo(() => {
    if (!partner) return TEMPLATE_BASES;
    return TEMPLATE_BASES.filter((b) => {
      const req = (b as any).requiredEntitlements as string[] | undefined;
      if (!req || req.length === 0) return true;
      return req.every((k) => hasEntitlement(partner.id, k));
    });
  }, [partner?.id, storeVersion]);

  const [tplBaseId, setTplBaseId] = useState<string>(visibleTemplateBases[0]?.id ?? '');
  const [tplVariantId, setTplVariantId] = useState<string>(TEMPLATE_VARIANTS[0]?.id ?? '');
  const [tplTone, setTplTone] = useState<TemplateTone>((TEMPLATE_TONES[0]?.id as TemplateTone) ?? 'formal');
  const [tplVersion, setTplVersion] = useState(1);
  const tplVariant = useMemo<TemplateVariantRecipe>(
    () => TEMPLATE_VARIANTS.find((v) => v.id === tplVariantId) ?? TEMPLATE_VARIANTS[0]!,
    [tplVariantId],
  );
  const tplBase = useMemo(() => visibleTemplateBases.find((b) => b.id === tplBaseId) ?? null, [tplBaseId, visibleTemplateBases]);

  useEffect(() => {
    if (!tplBaseId && visibleTemplateBases[0]?.id) setTplBaseId(visibleTemplateBases[0].id);
    const stillVisible = visibleTemplateBases.some((b) => b.id === tplBaseId);
    if (!stillVisible && visibleTemplateBases[0]?.id) setTplBaseId(visibleTemplateBases[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleTemplateBases.length, partner?.id]);
  const [tplCreditorName, setTplCreditorName] = useState('');
  const [tplAccountRef, setTplAccountRef] = useState('');
  const [tplBureau, setTplBureau] = useState<'EXP' | 'EQF' | 'TUC'>('EXP');

  const tplRendered = useMemo(() => {
    if (!tplBase || !partner) return null;
    const ctx = {
      nowIso: new Date().toISOString(),
      jurisdictionState: (canonicalIdentity.state || '').toUpperCase() || undefined,
      partner: {
        id: partner.id,
        fullName: canonicalIdentity.fullName,
        email: undefined,
        phone: canonicalIdentity.phone,
        address1: canonicalIdentity.address1 ?? canonicalIdentity.addressLine1,
        address2: canonicalIdentity.address2,
        city: canonicalIdentity.city,
        state: canonicalIdentity.state,
        postalCode: canonicalIdentity.postalCode,
      },
      bureau: tplBureau,
      creditorName: tplCreditorName.trim() || undefined,
      accountRef: tplAccountRef.trim() || undefined,
    };
    return renderTemplate({ baseId: tplBase.id, variant: tplVariant, ctx, version: tplVersion, tone: tplTone });
  }, [tplBase, partner, tplVariant, tplVersion, tplTone, tplBureau, tplCreditorName, tplAccountRef, canonicalIdentity]);

  const [tplText, setTplText] = useState('');
  const [tplSaveType, setTplSaveType] = useState<'validation' | 'court'>('validation');
  const [tplSaveBusy, setTplSaveBusy] = useState(false);
  const [tplSaveErr, setTplSaveErr] = useState<string | null>(null);
  const [activeVaultTemplate, setActiveVaultTemplate] = useState<TemplateVaultItem | null>(null);

  useEffect(() => {
    if (!tplRendered) return;
    setTplText(tplRendered.text);
  }, [tplRendered?.baseId, tplRendered?.variantId, tplRendered?.tone, tplRendered?.version]);

  const letterStudioTrackTabs = useMemo(
    () =>
      buildLetterStudioTrackTabs({
        mode: debtCenterMode ? 'debt' : 'credit',
        hasTemplates: canSeeTemplates,
      }),
    [debtCenterMode, canSeeTemplates],
  );

  // Credit Letters must not land on debt-only tracks (validation / affidavits).
  useEffect(() => {
    if (debtCenterMode) return;
    if (tab === 'validation' || tab === 'court') setTab('dispute');
  }, [debtCenterMode, tab]);

  const disputeEvidenceLinked = useMemo(() => {
    const keys = new Set(selectedDisputes.map((x) => x.key));
    let linked = 0;
    for (const k of keys) if (evidenceByCandidateId[k]) linked += 1;
    return { linked, total: keys.size };
  }, [evidenceByCandidateId, selectedDisputes]);

  const disputeReasonsSelected = useMemo(() => {
    const keys = new Set(selectedDisputes.map((x) => x.key));
    let withAny = 0;
    for (const k of keys) if ((reasonsByCandidateId[k] ?? []).filter(Boolean).length > 0) withAny += 1;
    return { withAny, total: keys.size };
  }, [reasonsByCandidateId, selectedDisputes]);

  const restoreHud = useMemo(() => {
    const lettersGeneratedCount = Object.values(lastGeneratedAtByBureau).filter(Boolean).length;
    const steps = [
      {
        id: 'upload',
        label: 'Upload report',
        done: reports.length > 0,
        hint: 'Upload an IdentityIQ/MyScoreIQ HTML/PDF so we can detect negative items.',
        meta: `${reports.length} report${reports.length === 1 ? '' : 's'}`,
      },
      {
        id: 'intel',
        label: 'Review intel',
        done: reports.length > 0,
        hint: 'Review Accounts/Collections and confirm what you want to dispute this round.',
        meta: 'in Reports',
      },
      {
        id: 'evidence',
        label: 'Capture evidence',
        done: screenshotEvidence.length > 0,
        hint: 'Capture clean screenshots from Accounts/Collections so each dispute item has proof attached.',
        meta: `${screenshotEvidence.length} screenshot${screenshotEvidence.length === 1 ? '' : 's'}`,
      },
      {
        id: 'disputes',
        label: 'Select disputes',
        done: selectedDisputes.length > 0,
        hint: 'Pick dispute items in the popup. We auto-split them into separate bureau letters (EXP/EQF/Trans).',
        meta: `${selectedDisputes.length} selected`,
      },
      {
        id: 'reasons',
        label: 'Select reasons',
        done: disputeReasonsSelected.withAny > 0,
        hint: 'Select at least 1 reason per item (or use Auto reasons).',
        meta: disputeReasonsSelected.total ? `${disputeReasonsSelected.withAny}/${disputeReasonsSelected.total} with reasons` : '0 selected',
      },
      {
        id: 'pdf',
        label: 'Generate PDF',
        done: lettersGeneratedCount > 0,
        hint: 'Generate a bureau PDF and save it to Letters Vault (download is optional based on access).',
        meta: `${lettersGeneratedCount}/3 letters generated`,
      },
      {
        id: 'mail',
        label: 'Mail / Track',
        done: false,
        hint: 'Mail the PDF(s), then track deadlines and bureau responses in Tasks + Dispute Center.',
        meta: 'tasks + cases',
      },
    ] as const;
    const doneCount = steps.filter((s) => s.done).length;
    const pct = Math.round((doneCount / steps.length) * 100);
    return { steps, doneCount, pct };
  }, [
    disputeReasonsSelected.withAny,
    lastGeneratedAtByBureau,
    reports.length,
    screenshotEvidence.length,
    selectedDisputes.length,
  ]);

  const nextBestAction = useMemo(() => {
    if (reports.length === 0) return { key: 'upload_report' as const, label: 'Upload your report' };
    if (screenshotEvidence.length === 0) return { key: 'capture_evidence' as const, label: 'Capture your first screenshot' };
    if (selectedDisputes.length === 0) return { key: 'choose_disputes' as const, label: 'Choose disputes' };
    if (disputeEvidenceLinked.total > 0 && disputeEvidenceLinked.linked < disputeEvidenceLinked.total)
      return { key: 'attach_missing_evidence' as const, label: 'Attach missing evidence' };
    if (disputeReasonsSelected.total > 0 && disputeReasonsSelected.withAny < disputeReasonsSelected.total)
      return { key: 'auto_reasons' as const, label: 'Auto-select reasons' };
    return { key: 'generate_pdf' as const, label: 'Generate your PDF' };
  }, [
    disputeEvidenceLinked.linked,
    disputeEvidenceLinked.total,
    disputeReasonsSelected.total,
    disputeReasonsSelected.withAny,
    reports.length,
    screenshotEvidence.length,
    selectedDisputes.length,
  ]);

  const runNextBestAction = () => {
    if (nextBestAction.key === 'upload_report') return openReports();
    if (nextBestAction.key === 'capture_evidence') return goCapture({ candidate: null });
    if (nextBestAction.key === 'choose_disputes') return setPickerOpen(true);
    if (nextBestAction.key === 'attach_missing_evidence') {
      const target = selectedDisputes.find((x) => !evidenceByCandidateId[x.key]) ?? null;
      if (!target) return;
      if (screenshotEvidence.length === 0) return goCapture({ candidate: target });
      setEvidencePicker({ candidateId: target.key });
      return;
    }
    if (nextBestAction.key === 'auto_reasons') {
      const b = (['EXP', 'EQF', 'TUC'] as Bureau[]).find((bb) => (selectedByBureau[bb] ?? []).some((s) => (reasonsByCandidateId[s.key] ?? []).length === 0));
      if (!b) return;
      const items = selectedByBureau[b] ?? [];
      const prev: Record<string, string[]> = {};
      for (const s of items) prev[s.key] = reasonsByCandidateId[s.key] ?? [];
      setBulkUndo({ bureau: b, prevReasonsByCandidateId: prev });
      setReasonsByCandidateId((cur) => {
        const out = { ...cur };
        for (const s of items) {
          const suggested = (suggestionsById[s.key] ?? []).slice(0, 3).map((x) => x.text);
          if (suggested.length) out[s.key] = suggested;
        }
        return out;
      });
      return;
    }
    if (nextBestAction.key === 'generate_pdf') {
      const b = (['EXP', 'EQF', 'TUC'] as Bureau[]).find((bb) => (selectedByBureau[bb] ?? []).length > 0) ?? 'EXP';
      const el = document.getElementById(`fc-bureau-${b}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
  };

  type LetterBuildStepId =
    | 'report'
    | 'disputes'
    | 'screenshots'
    | 'reasons'
    | 'laws'
    | 'identity'
    | 'ai'
    | 'templates'
    | 'generate'
    | 'mail'
    | 'escalate';

  const disputeMailedCount = useMemo(() => {
    if (!partner) return 0;
    void storeVersion;
    return listLettersByPartner(partner.id).filter(
      (l) => l.type === 'dispute' && (l.status === 'mailed' || l.status === 'mail_pending'),
    ).length;
  }, [partner?.id, storeVersion]);

  const letterBuildPathSteps = useMemo((): LetterStepPathItem[] => {
    const lawsDone =
      selectedDisputes.length > 0 &&
      selectedDisputes.every((s) => (lawsByCandidateId[s.key] ?? []).length > 0);
    const generatedCount = Object.values(lastGeneratedAtByBureau).filter(Boolean).length;
    return [
      {
        id: 'report',
        label: 'Report',
        meta: reports.length ? `${reports.length} on file` : 'Upload a report',
        done: reports.length > 0,
      },
      {
        id: 'disputes',
        label: 'Disputes',
        meta: `${selectedDisputes.length} selected`,
        done: selectedDisputes.length > 0,
      },
      {
        id: 'screenshots',
        label: 'Screenshots',
        meta: `${disputeEvidenceLinked.linked}/${disputeEvidenceLinked.total || 0} linked`,
        done: disputeEvidenceLinked.total > 0 && disputeEvidenceLinked.linked >= disputeEvidenceLinked.total,
      },
      {
        id: 'reasons',
        label: 'Reasons',
        meta: `${disputeReasonsSelected.withAny}/${disputeReasonsSelected.total || 0}`,
        done:
          disputeReasonsSelected.total > 0 &&
          disputeReasonsSelected.withAny >= disputeReasonsSelected.total,
      },
      {
        id: 'laws',
        label: 'Laws',
        meta: 'once on letter',
        done: lawsDone,
        disabled: selectedDisputes.length === 0,
        disabledReason: 'Select disputes first',
      },
      {
        id: 'identity',
        label: 'ID & SSN',
        meta: identityPacketStatus(evidence, identityEvidenceIds).label,
        done: identityPacketStatus(evidence, identityEvidenceIds).complete,
      },
      { id: 'ai', label: 'AI draft', meta: 'optional', done: false, optional: true },
      { id: 'templates', label: 'Templates', meta: 'optional', done: false, optional: true },
      {
        id: 'generate',
        label: 'Generate',
        meta: `${generatedCount}/3`,
        done: generatedCount > 0,
      },
      {
        id: 'mail',
        label: 'Mail & track',
        meta: disputeMailedCount > 0 ? `${disputeMailedCount} sent` : 'Certified mail',
        done: disputeMailedCount > 0,
        disabled: generatedCount === 0,
        disabledReason: 'Generate a bureau letter first',
      },
      {
        id: 'escalate',
        label: 'Escalate',
        meta: 'If the bureau stalls',
        done: false,
        optional: true,
      },
    ];
  }, [
    disputeEvidenceLinked.linked,
    disputeEvidenceLinked.total,
    disputeMailedCount,
    disputeReasonsSelected.total,
    disputeReasonsSelected.withAny,
    evidence,
    identityEvidenceIds,
    lastGeneratedAtByBureau,
    lawsByCandidateId,
    reports.length,
    selectedDisputes,
  ]);

  const scrollToGenerateForBureau = (b: Bureau) => {
    const el = document.getElementById(`fc-bureau-${b}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el?.classList.add('ring-2', 'ring-amber-400/60', 'ring-offset-2', 'ring-offset-black');
    window.setTimeout(() => {
      el?.classList.remove('ring-2', 'ring-amber-400/60', 'ring-offset-2', 'ring-offset-black');
    }, 1500);
  };

  const runLetterBuildStep = (id: LetterBuildStepId) => {
    setTab('dispute');
    if (id === 'report') {
      if (reports.length === 0) {
        openReports();
        return;
      }
      setPickerOpen(true);
      return;
    }
    if (id === 'mail') {
      openVault();
      return;
    }
    if (id === 'escalate') {
      const el = document.getElementById('fc-dispute-step-escalate');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      navigate('/portal/escalations?tab=regulatory');
      return;
    }
    if (id === 'disputes') {
      setPickerOpen(true);
      return;
    }
    if (id === 'screenshots') {
      const target = selectedDisputes.find((x) => !evidenceByCandidateId[x.key]) ?? selectedDisputes[0] ?? null;
      if (!target) {
        setPickerOpen(true);
        return;
      }
      setWorkspaceBureau(target.candidate.bureau);
      setFocusedKeyByBureau((prev) => ({ ...prev, [target.candidate.bureau]: target.key }));
      if (screenshotEvidence.length === 0) {
        goCapture({ candidate: target });
        return;
      }
      setEvidencePicker({ candidateId: target.key });
      return;
    }
    if (id === 'reasons') {
      const target =
        selectedDisputes.find((x) => (reasonsByCandidateId[x.key] ?? []).filter(Boolean).length === 0) ??
        selectedDisputes[0] ??
        null;
      if (!target) return;
      setWorkspaceBureau(target.candidate.bureau);
      setFocusedKeyByBureau((prev) => ({ ...prev, [target.candidate.bureau]: target.key }));
      window.requestAnimationFrame(() =>
        document.getElementById('fc-focused-item')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      );
      return;
    }
    if (id === 'laws') {
      const target =
        selectedDisputes.find((x) => (lawsByCandidateId[x.key] ?? []).length === 0) ?? selectedDisputes[0] ?? null;
      if (!target) return;
      setWorkspaceBureau(target.candidate.bureau);
      setFocusedKeyByBureau((prev) => ({ ...prev, [target.candidate.bureau]: target.key }));
      window.requestAnimationFrame(() =>
        document.getElementById('fc-laws-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      );
      return;
    }
    if (id === 'identity') {
      setIdentityPickerOpen(true);
      return;
    }
    if (id === 'ai' || id === 'templates' || id === 'generate') {
      const b =
        (selectedByBureau[workspaceBureau] ?? []).length > 0
          ? workspaceBureau
          : ((['EXP', 'EQF', 'TUC'] as Bureau[]).find((bb) => (selectedByBureau[bb] ?? []).length > 0) ?? 'EXP');
      setWorkspaceBureau(b);
      scrollToGenerateForBureau(b);
      if (id === 'templates') setDisputeTemplatesOpen(b);
    }
  };

  const runLetterBuildContinue = () => {
    const mainSteps = letterBuildPathSteps.filter((s) => !s.optional);
    const next =
      mainSteps.find((s) => !s.done && !s.disabled) ?? mainSteps.find((s) => !s.done) ?? null;
    const ready = mainSteps.filter((s) => s.id !== 'generate').every((s) => s.done || s.disabled);
    if (ready) {
      const b =
        (selectedByBureau[workspaceBureau] ?? []).length > 0
          ? workspaceBureau
          : ((['EXP', 'EQF', 'TUC'] as Bureau[]).find((bb) => (selectedByBureau[bb] ?? []).length > 0) ?? 'EXP');
      setTab('dispute');
      setWorkspaceBureau(b);
      scrollToGenerateForBureau(b);
      return;
    }
    if (next) runLetterBuildStep(next.id as LetterBuildStepId);
  };

  const openGeneratedDebtDraft = (args: {
    track: DebtDraftTrack;
    specId: string;
    catalogId?: string;
    bodyText: string;
  }) => {
    const plain = String(args.bodyText || '').trim();
    if (!plain) {
      setDraftErr('Letter generation returned an empty body. Confirm case fields and try Generate letter again.');
      return;
    }
    if (/letter templates locked/i.test(plain)) {
      setDraftErr('Letter generation is locked on this plan. Grant Debt or Letters access, then click Generate letter.');
      return;
    }
    const previewKey = `${args.track}:${args.catalogId || args.specId}:${Date.now()}`;
    const letterId = newId('letter');
    const title = resolveDebtDraftTitle({
      specId: args.specId,
      catalogId: args.catalogId,
      track: args.track,
      debtName: debt?.name,
    });
    try {
      upsertLetter({
        id: letterId,
        partnerId: partner.id,
        type: letterTypeForDebtDraft(args.track),
        title,
        createdAt: new Date().toISOString(),
        body: plain,
        status: 'generated',
        relatedEvidenceIds: [],
        meta: metaForDebtDraft(
          { type: args.track, specId: args.specId, catalogId: args.catalogId },
          debt,
          String(recommendedScenario || ''),
        ),
      });
      addAuditEvent({
        partnerId: partner.id,
        actorType: layout === 'embedded' ? 'admin' : 'partner',
        actorEmail: undefined,
        action: 'letter.saved',
        entityType: 'letter',
        entityId: letterId,
        meta: { kind: args.track, debtId: debt?.id ?? null, source: 'generate_letter', catalogId: args.catalogId ?? null },
      });
      notifyPartnerLetterEvent({
        event: 'generated',
        letterIds: [letterId],
        letterTitles: [title],
      });
    } catch (e: any) {
      setDraftNotice(e?.message || 'Draft opened, but vault save failed — use Save to Letters Vault.');
    }
    setDraft({
      specId: args.specId,
      catalogId: args.catalogId,
      type: args.track,
      title,
      html: plainTextToHtml(plain),
      preferPreview: true,
      previewKey,
      letterId,
    });
    // Ensure the modal paper preview is in view after Generate (never silent success).
    window.setTimeout(() => {
      document.getElementById('fc-letter-paper-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const buildDebtCenterDraft = (specId: DebtLetterType, isCourt: boolean) => {
    setGenerateBusy(true);
    setDraftErr(null);
    try {
      persistDebtSenderSnapshot();
      if (specId === 'courtroom_day_kit') {
        // Never fail silently — generate the court answer letter instead of a kit PDF.
        const mergeArgs = buildDebtLetterArgs();
        const baseText = getLetterBody('courtroom_written_answer', mergeArgs);
        openGeneratedDebtDraft({
          track: 'court',
          specId: 'courtroom_written_answer',
          catalogId: 'court_courtroom_written_answer',
          bodyText: baseText,
        });
        setDraftNotice(
          'Court-day kit stays on the Hearing step (UI only). Generated your court answer letter instead.',
        );
        return;
      }
      if (!canGenerateDebtLetterBodies) {
        setDraftErr('Debt letter generation is locked. Grant Debt or Letters access, then click Generate letter.');
        return;
      }
      const mergeArgs = buildDebtLetterArgs();
      if (!mergeArgs.recipientAddress?.trim() && !mergeArgs.plaintiffLawFirmAddress?.trim()) {
        setDraftErr(
          'Recipient mailing address is missing. Confirm the firm / collector TO address on the case, then Generate letter again.',
        );
      }
      const baseText = getLetterBody(specId, mergeArgs);
      openGeneratedDebtDraft({
        track: resolveDebtDraftTrack({ specId, fallback: isCourt ? 'court' : 'validation' }),
        specId,
        bodyText: baseText,
      });
    } catch (e: any) {
      const msg = e?.message || 'Failed to generate letter. Check case fields and try again.';
      setDraftErr(msg);
      console.error('[Generate letter]', msg, e);
    } finally {
      setGenerateBusy(false);
    }
  };

  const buildCatalogDraft = (catalogId: string, tabTrack: DebtDraftTrack) => {
    setGenerateBusy(true);
    setDraftErr(null);
    try {
      persistDebtSenderSnapshot();
      // Kit IDs must not block Generate — fall through to court answer letter.
      const resolvedCatalogId =
        catalogId === 'court_courtroom_day_kit' || catalogId === 'courtroom_day_kit'
          ? 'court_courtroom_written_answer'
          : catalogId;
      if (resolvedCatalogId !== catalogId) {
        setDraftNotice(
          'Court-day kit stays on the Hearing step (UI only). Generating your court answer letter instead.',
        );
      }
      if (!canGenerateDebtLetterBodies) {
        setDraftErr('Debt letter generation is locked. Grant Debt or Letters access, then click Generate letter.');
        return;
      }
      const mergeArgs = buildDebtLetterArgs();
      if (!mergeArgs.recipientAddress?.trim() && !mergeArgs.plaintiffLawFirmAddress?.trim()) {
        setDraftErr(
          'Recipient mailing address is missing. Confirm the firm / collector TO address on the case, then Generate letter again.',
        );
      }
      let baseText = '';
      const entry = catalogEntryById(resolvedCatalogId);
      const resolvedSpecId = (entry?.letterType || resolvedCatalogId) as string;
      // Track comes from the catalog entry — the open tab is only a fallback.
      const track = resolveDebtDraftTrack({
        catalogId: resolvedCatalogId,
        specId: resolvedSpecId,
        fallback: tabTrack,
      });
      try {
        baseText = generateCatalogLetterBody(resolvedCatalogId, mergeArgs);
      } catch (inner: any) {
        // Fall back to typed body when catalog path throws (e.g. mis-tagged kit).
        const fallbackType = (entry?.letterType ||
          (track === 'court' ? 'courtroom_written_answer' : 'validation_request')) as DebtLetterType;
        baseText = getLetterBody(fallbackType, mergeArgs);
        if (!baseText?.trim()) throw inner;
      }
      openGeneratedDebtDraft({
        track,
        specId: resolvedSpecId,
        catalogId: resolvedCatalogId,
        bodyText: baseText,
      });
    } catch (e: any) {
      const msg = e?.message || 'Failed to generate letter. Check case fields and try again.';
      setDraftErr(msg);
      console.error('[Generate letter]', msg, e);
    } finally {
      setGenerateBusy(false);
    }
  };

  const debtCenterSenderFields = {
    fullName: senderName || canonicalIdentity.fullName || '',
    address1: senderAddressLine1 || canonicalIdentity.address1 || canonicalIdentity.addressLine1 || '',
    address2: senderAddressLine2 || canonicalIdentity.address2 || '',
    city: canonicalIdentity.city || '',
    state: canonicalIdentity.state || '',
    postalCode: canonicalIdentity.postalCode || '',
    phone: canonicalIdentity.phone || '',
    // Letter sender UI: mailing identity only — never auto-fill login email onto paper.
    email: '',
  };

  const debtCenterSharedProps = {
    debt,
    debtId,
    debtCases,
    reports,
    processedDocuments,
    recommendedScenario: recommendedScenario as DebtScenario,
    senderFields: debtCenterSenderFields,
    onDebtChange: handleDebtIntelChange,
    onSenderPersist: persistDebtSenderSnapshot,
    onDebtIdChange: setDebtId,
    onOpenDebtCenter: openDebtCenter,
    canSeeTemplates,
  };

  const debtProofCount = useMemo(() => {
    const docs = processedDocuments.length;
    const ev = evidence.length;
    return docs + ev;
  }, [processedDocuments.length, evidence.length]);

  const debtTrack: DebtLetterTrack =
    tab === 'validation' ||
    tab === 'court' ||
    tab === 'foreclosure' ||
    tab === 'repossession' ||
    tab === 'bankruptcy'
      ? (tab as DebtLetterTrack)
      : 'debt';

  /** Court matters that already ended in a payment plan get the compliance rail, not the defense rail. */
  const debtCourtOutcome = useMemo(
    () => (debtId ? getCourtOutcomeByDebtCase(debtId) : null),
    [debtId, storeVersion],
  );
  const debtPostCourtPlan = Boolean(debtCourtOutcome?.plan);
  /** Decided without a plan (dismissed / satisfied / case resolved) — close-out rail, not defense. */
  const debtPostCourtDecided = !debtPostCourtPlan && (Boolean(debtCourtOutcome) || debt?.status === 'resolved');

  const debtMailedCount = useMemo(() => {
    if (!partner) return 0;
    void storeVersion;
    return listLettersByPartner(partner.id).filter(
      (l) => l.type !== 'dispute' && (l.status === 'mailed' || l.status === 'mail_pending'),
    ).length;
  }, [partner?.id, storeVersion]);

  const debtLetterPathSteps = useMemo(
    () =>
      buildDebtLetterPathSteps({
        track: debtTrack,
        hasCase: Boolean(debtId),
        proofCount: debtProofCount,
        hasChosenLetter: Boolean(draft),
        hasDraftBody: Boolean(draft?.html?.trim()),
        savedToVault: Boolean(draft?.letterId),
        mailedCount: debtMailedCount,
        postCourtPlan: debtPostCourtPlan,
        postCourtDecided: debtPostCourtDecided,
      }),
    [debtTrack, debtId, debtProofCount, draft, debtMailedCount, debtPostCourtPlan, debtPostCourtDecided],
  );

  const runDebtLetterBuildStep = (id: DebtLetterStepId) => {
    runDebtLetterStep(id, {
      openDraft: () => {
        if (draft) {
          document.getElementById('fc-debt-step-draft')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      },
    });
    if (id === 'generate' && draft) {
      document.getElementById('fc-debt-step-generate')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const runDebtLetterBuildContinue = () => {
    const mainSteps = debtLetterPathSteps.filter((s) => !s.optional);
    const next =
      mainSteps.find((s) => !s.done && !s.disabled) ?? mainSteps.find((s) => !s.done) ?? null;
    if (next) runDebtLetterBuildStep(next.id as DebtLetterStepId);
  };

  const [didApplyStepDeepLink, setDidApplyStepDeepLink] = useState(false);
  useEffect(() => {
    if (!partner || !didRestore || didApplyStepDeepLink) return;
    const step = new URLSearchParams(location.search).get('step');
    if (!isValidDisputeBuildStep(step)) return;
    setDidApplyStepDeepLink(true);
    setTab('dispute');
    const t = window.setTimeout(() => runLetterBuildStep(step), 200);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner?.id, didRestore, didApplyStepDeepLink, location.search]);

  const disputeBureau = workspaceBureau;
  const disputeBureauItems = selectedByBureau[disputeBureau] ?? [];

  const main = (
    <>
      {/* Full paper preview modal (templates-style iframe) */}
      {previewModalBureau ? (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewModalBureau(null)} />
          <div
            className="relative w-full max-w-6xl max-h-[92vh] rounded-3xl border border-white/[0.08] bg-[#0a0f0d] shadow-2xl overflow-hidden flex flex-col"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 md:p-6 border-b border-white/[0.08] flex items-start justify-between gap-4 shrink-0">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Paper preview</div>
                <div className="mt-2 text-2xl font-light text-white truncate">Full letter preview</div>
                <div className="mt-1 text-white/60 text-sm">This is the same print-safe preview style used in Templates.</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewModalBureau(null)}
                  className="hidden sm:inline-flex px-3 py-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewModalBureau(null)}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-white/70 transition-all"
                  aria-label="Close preview"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              {(() => {
                const b = previewModalBureau;
                const bureauItems = (selectedByBureau[b] ?? []) as SelectedDispute[];
                const tone = toneByBureau[b];
                const round = roundByBureau[b];
                const introHtml = introByBureau[b];
                const footerHtml = footerByBureau[b] || plainTextToHtml(defaultDisputeFooter(tone));
                const partnerName = partner?.profile.fullName || 'Partner';
                const items = bureauItems.map((s) => {
                  const evId = evidenceByCandidateId[s.key];
                  const ev = evId ? evidence.find((x) => x.id === evId) : null;
                  return {
                    candidate: { ...s.candidate, id: s.key } as any,
                    evidence: ev ? { filename: ev.filename, blobRef: ev.blobRef, mimeType: ev.mimeType } : null,
                    reasons: reasonsByCandidateId[s.key] ?? [],
                    laws: (lawsByCandidateId[s.key] ?? []).map((l) => ({ cite: l.cite, shortLabel: l.shortLabel })),
                    narrative: (aiNarrativeByCandidateKey[s.key] || '').trim() || null,
                  };
                });
                return (
                  <DisputeLetterIframePreview
                    bureau={b}
                    partnerName={partnerName}
                    introHtml={ensureHtmlDraft(introHtml || '')}
                    footerHtml={ensureHtmlDraft(footerHtml || '')}
                    items={items as any}
                    round={round}
                    iframeHeightClassName="h-[58vh] md:h-[66vh] lg:h-[70vh]"
                  />
                );
              })()}
            </div>
          </div>
        </div>
      ) : null}

      {partner && identityPickerOpen ? (
        <EvidencePickerModal
          open={identityPickerOpen}
          title="Attach ID & SSN"
          subtitle="Select government ID and Social Security card for this letter packet. Upload them in Documents if missing."
          partnerId={partner.id}
          items={evidence}
          selectedEvidenceIds={identityEvidenceIds}
          filter="identity"
          pickLabel="Add to packet"
          emptyHint="No ID/SSN docs yet — open Documents vault and upload ID + Social Security card."
          onPickMany={(ids) => setIdentityEvidenceIds(ids)}
          onUpsert={(item) => {
            upsertEvidence(item);
            setEvidenceVersion((v) => v + 1);
          }}
          onDelete={(id) => {
            deleteEvidence(id);
            setEvidenceVersion((v) => v + 1);
            setIdentityEvidenceIds((cur) => cur.filter((x) => x !== id));
          }}
          onOpenFullVault={() => {
            setIdentityPickerOpen(false);
            navigate('/portal/documents');
          }}
          onClose={() => setIdentityPickerOpen(false)}
          autoPickOnUpload={false}
          strictAccountMatch={false}
        />
      ) : null}

      {/* Evidence picker for dispute items */}
      {partner && evidencePicker && (
        <EvidencePickerModal
          open={Boolean(evidencePicker)}
          title={
            evidencePickerCandidate
              ? `Attach screenshot · ${evidencePickerCandidate.candidate.account}`
              : evidencePicker.candidateId
                ? 'Attach screenshot'
                : 'Screenshot vault'
          }
          subtitle={
            evidencePickerCandidate
              ? `Choose the account below, then take a screenshot right here — it auto-attaches to ${evidencePickerCandidate.candidate.account}.`
              : 'Choose a screenshot to attach (or upload a new one).'
          }
          partnerId={partner.id}
          items={evidencePickerItems}
          selectedEvidenceId={evidencePicker.candidateId ? evidenceByCandidateId[evidencePicker.candidateId] : undefined}
          selectedEvidenceIds={evidencePicker.candidateId ? evidenceIdsByCandidateId[evidencePicker.candidateId] ?? [] : undefined}
          filter="screenshots"
          matchAccount={evidencePickerCandidate?.candidate.account}
          matchCandidateType={evidencePickerCandidate?.candidate.type}
          strictAccountMatch={Boolean(evidencePicker.candidateId)}
          emptyHint="No matching screenshots for this account. Choose the account above and take a screenshot right here."
          onGoCapture={() => goCapture({ candidate: evidencePickerCandidate })}
          pickLabel="Attach"
          accounts={evidencePicker.candidateId ? evidencePickerAccounts : undefined}
          selectedAccountId={evidencePicker.candidateId}
          onSelectAccount={(id) => setEvidencePicker({ candidateId: id })}
          onPick={
            evidencePicker.candidateId
              ? (evidenceId) => {
                  const cid = evidencePicker.candidateId!;
                  const s = selectedDisputes.find((x) => x.key === cid) ?? null;
                  const requested = evidence.find((x) => x.id === evidenceId) ?? null;
                  if (s && requested && !evidenceMatchesAccount({
                    accountName: s.candidate.account,
                    candidateType: s.candidate.type,
                    evidence: requested,
                  })) {
                    setPdfErr(describeEvidenceMismatch({ accountName: s.candidate.account, evidence: requested }));
                    return;
                  }

                  const requestedScore =
                    s && requested ? scoreEvidenceForAccount({ accountName: s.candidate.account, candidateType: s.candidate.type, evidence: requested }) : 0;

                  const ranked = s
                    ? rankEvidenceMatches({ accountName: s.candidate.account, candidateType: s.candidate.type, evidence: screenshotEvidence })
                    : [];
                  const best = ranked[0] ?? null;

                  const shouldAutoFix =
                    Boolean(s && best && best.evidenceId) &&
                    (best!.score >= 0.78 && (requestedScore < EVIDENCE_MATCH_ATTACH_MIN || best!.score >= requestedScore + 0.22));

                  const finalEvidenceId = shouldAutoFix ? best!.evidenceId : evidenceId;
                  const finalEvidence = evidence.find((x) => x.id === finalEvidenceId) ?? null;
                  if (s && finalEvidence && !evidenceMatchesAccount({
                    accountName: s.candidate.account,
                    candidateType: s.candidate.type,
                    evidence: finalEvidence,
                  })) {
                    setPdfErr(describeEvidenceMismatch({ accountName: s.candidate.account, evidence: finalEvidence }));
                    return;
                  }

                  setEvidenceByCandidateId((prev) => ({ ...prev, [cid]: finalEvidenceId }));
                  setAutoMatchNoteByCandidateId((prev) => {
                    const next = { ...prev };
                    if (shouldAutoFix && s) {
                      const bestItem = evidence.find((x) => x.id === finalEvidenceId) ?? null;
                      next[cid] = `We auto-selected the best matching screenshot: ${bestItem?.filename || 'screenshot'}. You can change it.`;
                    } else {
                      delete next[cid];
                    }
                    return next;
                  });
                  setEvidencePicker(null);
                }
              : undefined
          }
          onPickMany={
            evidencePicker.candidateId
              ? (evidenceIds) => {
                  const cid = evidencePicker.candidateId!;
                  const s = selectedDisputes.find((x) => x.key === cid) ?? null;
                  if (s) {
                    const mismatch = evidenceIds
                      .map((id) => evidence.find((x) => x.id === id) ?? null)
                      .find((ev) => ev && !evidenceMatchesAccount({ accountName: s.candidate.account, candidateType: s.candidate.type, evidence: ev }));
                    if (mismatch) {
                      setPdfErr(describeEvidenceMismatch({ accountName: s.candidate.account, evidence: mismatch }));
                      return;
                    }
                  }
                  setEvidenceIdsByCandidateId((prev) => ({ ...prev, [cid]: evidenceIds }));
                  setEvidenceByCandidateId((prev) => ({ ...prev, [cid]: evidenceIds[0] }));
                  setAutoMatchNoteByCandidateId((prev) => {
                    const next = { ...prev };
                    if (evidenceIds.length > 1) next[cid] = `${evidenceIds.length} screenshots attached for this account. The first one is used as the primary exhibit.`;
                    else delete next[cid];
                    return next;
                  });
                }
              : undefined
          }
          onUpsert={(item) => {
            upsertEvidence(item);
            setEvidenceVersion((v) => v + 1);
          }}
          onDelete={(eId) => {
            deleteEvidence(eId);
            setEvidenceVersion((v) => v + 1);
          }}
          onClose={() => setEvidencePicker(null)}
          autoPickOnUpload={Boolean(evidencePicker.candidateId)}
        />
      )}

      {/* Dispute template picker (applies to Opening paragraphs + preview) */}
      {disputeTemplatesOpen ? (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDisputeTemplatesOpen(null)} />
          <div
            className="relative w-full max-w-5xl max-h-[92vh] rounded-3xl border border-white/[0.08] bg-[#0a0f0d] shadow-2xl overflow-hidden flex flex-col"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 md:p-6 border-b border-white/[0.08] flex items-start justify-between gap-4 shrink-0">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Templates</div>
                <div className="mt-2 text-2xl font-light text-white truncate">Apply a dispute template</div>
                <div className="mt-1 text-white/60 text-sm">
                  Choosing a template replaces the <span className="text-white/80 font-semibold">Opening paragraphs</span> and updates the paper preview instantly.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDisputeTemplatesOpen(null)}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-white/70 transition-all"
                aria-label="Close template picker"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <TemplatesVaultPanel
                tenantId={partner.tenantId}
                partnerId={partner.id}
                variant={layout === 'embedded' ? 'admin' : 'partner'}
                allowCreate={layout === 'embedded'}
                allowEdit={layout === 'embedded'}
                defaultCategory={'credit_dispute' as any}
                onUseText={(text) => {
                  const b = disputeTemplatesOpen;
                  if (!b) return;
                  setIntroByBureau((prev) => ({ ...prev, [b]: plainTextToHtml(text) }));
                  setReturnNotice('Applied template to Opening paragraphs. You can keep editing in the studio.');
                  setDisputeTemplatesOpen(null);
                }}
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* Debt draft modal (validation/court + template exports) */}
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

          {draftTemplatesOpen ? (
            <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDraftTemplatesOpen(false)} />
              <div
                className="relative w-full max-w-5xl max-h-[92vh] rounded-3xl border border-white/[0.08] bg-[#0a0f0d] shadow-2xl overflow-hidden flex flex-col"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 md:p-6 border-b border-white/[0.08] flex items-start justify-between gap-4 shrink-0">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Templates</div>
                    <div className="mt-2 text-2xl font-light text-white truncate">Insert a template</div>
                    <div className="mt-1 text-white/60 text-sm">Pick a saved template to insert into your draft, or attach a file as an enclosure.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDraftTemplatesOpen(false)}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-white/70 transition-all"
                    aria-label="Close template picker"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                  <TemplatesVaultPanel
                    tenantId={partner.tenantId}
                    partnerId={partner.id}
                    variant={layout === 'embedded' ? 'admin' : 'partner'}
                    allowCreate={layout === 'embedded'}
                    allowEdit={layout === 'embedded'}
                    defaultCategory={draft?.type === 'court' ? ('court_filing' as any) : ('debt_collection' as any)}
                    onUseText={(text) => {
                      setDraft((prev) => (prev ? { ...prev, html: plainTextToHtml(text) } : prev));
                      setDraftNotice('Inserted template text into your draft.');
                      setDraftTemplatesOpen(false);
                    }}
                    onAttachFile={async (t) => {
                      try {
                        if (!t.blobRef) throw new Error('Template file not available.');
                        // Create a partner-scoped evidence record that points at the same blobRef (so it can be used as an enclosure).
                        const evidenceId = newId('evidence');
                        upsertEvidence({
                          id: evidenceId,
                          partnerId: partner.id,
                          type: 'upload',
                          source: 'upload',
                          caption: `Template enclosure: ${t.title}`,
                          filename: t.filename || `${t.title}.pdf`,
                          mimeType: t.mimeType || 'application/octet-stream',
                          sizeBytes: t.sizeBytes || 0,
                          blobRef: t.blobRef,
                          createdAt: new Date().toISOString(),
                        } as any);
                        setEvidenceVersion((v) => v + 1);
                        setDraft((prev) => (prev ? { ...prev, evidenceId } : prev));
                        setDraftNotice(`Attached enclosure: ${t.filename || t.title}`);
                        setDraftTemplatesOpen(false);
                      } catch (e: any) {
                        setDraftErr(e?.message || 'Failed to attach template file.');
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
            <div
              className="absolute inset-0"
              onClick={() => {
                if (draftBusy) return;
                setDraftErr(null);
                setDraft(null);
              }}
            />
            <div
              className={`relative w-full max-w-5xl max-h-[min(88vh,780px)] rounded-2xl ${finelyOsCatalogCard(draft.type === 'court' ? 'fuchsia' : 'emerald')} !p-0 overflow-hidden flex flex-col shadow-[0_0_60px_-12px_rgba(251,191,36,0.35)]`}
              role="dialog"
              aria-modal="true"
              aria-label="Generated letter preview"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b border-white/[0.08] flex items-start justify-between gap-3 shrink-0">
                <div className="min-w-0">
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Generated letter · paper preview</div>
                  <div className={`mt-1 truncate ${FINELY_OS_ENTITY_TITLE}`}>
                    {draft.title ||
                      resolveDebtDraftBaseTitle({
                        specId: draft.specId,
                        catalogId: draft.catalogId,
                        track: draft.type,
                      })}
                  </div>
                  {draft.letterId ? (
                    <p className="mt-0.5 text-[11px] text-emerald-200/85">Saved to Letters Vault as a draft — edit below, then update PDF when ready.</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <button
                    type="button"
                    onClick={() => setDraftTemplatesOpen(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                    title="Insert a saved template or attach a file enclosure"
                    disabled={draftBusy}
                  >
                    Templates
                  </button>
                  {canAiDraft ? (
                    <button
                      type="button"
                      onClick={() => void runAiDraftDebtLetter()}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60"
                      title="AI drafts this letter using the selected scenario + legal basis"
                      disabled={draftBusy || !aiGatewayEnabled}
                    >
                      <Sparkles size={14} /> {!aiGatewayEnabled ? 'AI disabled' : draftBusy ? 'Draftingâ€¦' : 'AI draft'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate('/portal/billing')}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                      title="Premium feature: upgrade to unlock AI drafting"
                      disabled={draftBusy}
                    >
                      <Lock size={14} /> Premium AI
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      if (draftBusy) return;
                      try {
                        const category = draft.type === 'court' ? ('court_filing' as any) : ('debt_collection' as any);
                        createTemplateVaultItem({
                          tenantId: partner.tenantId,
                          title: `${resolveDebtDraftBaseTitle({
                            specId: draft.specId,
                            catalogId: draft.catalogId,
                            track: draft.type,
                          })} template • ${new Date().toISOString().slice(0, 10)}`,
                          category,
                          kind: 'text',
                          bodyText: htmlToPlainText(draft.html || ''),
                          requiredEntitlements: defaultRequiredEntitlementsForCategory(category),
                          createdBy: { actorType: 'partner' },
                        } as any);
                        setDraftNotice('Saved this draft as a new template.');
                      } catch (e: any) {
                        setDraftErr(e?.message || 'Failed to save as template.');
                      }
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                    title="Save this draft text as a reusable template"
                    disabled={draftBusy}
                  >
                    Save as template
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (draftBusy) return;
                      setDraftErr(null);
                      setDraft(null);
                    }}
                    className="hidden sm:inline-flex px-3 py-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={draftBusy}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (draftBusy) return;
                      setDraftErr(null);
                      setDraft(null);
                    }}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-white/70 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={draftBusy}
                    aria-label="Close draft"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {draftErr ? (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200/90 text-sm">{draftErr}</div>
                ) : null}

                <div id="fc-debt-step-draft" className="space-y-3 scroll-mt-3">
                  <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-50/95 font-semibold">
                    Edit letter — every field and the full body are editable before you save or mail.
                  </div>
                  {draft.type === 'court' || draft.type === 'foreclosure' || draft.type === 'repossession' ? (
                    <ExtractedCourtFactsPanel debt={debt} summonsContext={summonsAffidavitContext} compact />
                  ) : null}
                  {draftNotice ? (
                    <div className="rounded-xl border border-rose-400/40 bg-rose-500/15 px-3 py-2 text-xs text-rose-50 space-y-1">
                      <div className="font-bold">Recipient address required</div>
                      <p>{draftNotice}</p>
                      <p className="text-rose-100/80">
                        Confirm parties on the case (firm / collector mailing address). We will never put your home address in the TO block.
                      </p>
                    </div>
                  ) : null}
                  <DebtLetterRichDraftWorkspace
                    html={ensureHtmlDraft(draft.html || '')}
                    onChangeHtml={(html) => setDraft((prev) => (prev ? { ...prev, html } : prev))}
                    accent={draft.type === 'court' ? 'fuchsia' : 'emerald'}
                    minHeightPx={280}
                    editorLabel="Edit letter"
                    heroLayout={Boolean(draft.preferPreview)}
                    initialView="preview"
                    previewResetKey={draft.previewKey || `${draft.specId}:${draft.catalogId || ''}`}
                    showAddressChrome={false}
                  />

                  <details className="rounded-xl border border-white/10 bg-black/25 !p-3">
                    <summary className="cursor-pointer select-none text-sm font-semibold text-white">
                      Enclosure evidence {draft.evidenceId ? '(attached)' : '(optional)'}
                    </summary>
                    <div className="mt-3 space-y-2">
                      <button
                        type="button"
                        onClick={() => setDraftEvidencePickerOpen(true)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                        title="Attach an enclosure/evidence file to this letter"
                      >
                        Attach evidence
                      </button>
                      {draft.evidenceId ? (
                        <>
                          <div className="text-[11px] text-white/50">
                            Attached:{' '}
                            <span className="text-white/80 font-mono">{evidence.find((x) => x.id === draft.evidenceId)?.filename ?? draft.evidenceId}</span>
                          </div>
                          {(() => {
                            const ev = evidence.find((x) => x.id === draft.evidenceId) ?? null;
                            if (!ev?.blobRef) return null;
                            const isImg = String(ev.mimeType || '').toLowerCase().startsWith('image/');
                            if (!isImg) return null;
                            return <InlineEvidenceThumb blobRef={ev.blobRef} mimeType={ev.mimeType} alt={ev.filename || 'Evidence'} />;
                          })()}
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                            onClick={() => {
                              const ev = evidence.find((x) => x.id === draft.evidenceId) ?? null;
                              if (!ev?.blobRef) return;
                              void (async () => {
                                try {
                                  const result = await openBlobRefInNewTab({
                                    blobRef: ev.blobRef,
                                    mimeType: ev.mimeType,
                                    preferSigned: true,
                                  });
                                  if (!result.ok) window.alert(result.message);
                                } catch {
                                  // ignore
                                }
                              })();
                            }}
                            title="Open the attached enclosure"
                          >
                            Open enclosure <ExternalLink size={14} />
                          </button>
                        </>
                      ) : (
                        <div className="text-[11px] text-white/40">No enclosure attached.</div>
                      )}
                    </div>
                  </details>

                  <div id="fc-debt-step-preview" className="scroll-mt-3">
                    <LetterAddressSummary
                      defaultOpen={false}
                      recipientKind="creditor"
                      enrichmentSource={
                        addressEnrichMeta?.source ||
                        (debt?.recipientAddress || debt?.plaintiffLawFirmAddress
                          ? 'case'
                          : debtPartyInfo?.matchedFrom === 'directory'
                            ? 'directory'
                            : debtPartyInfo?.autoFilled
                              ? 'tradeline'
                              : undefined)
                      }
                      verifyRequired={
                        addressEnrichMeta?.verifyRequired ||
                        !(debt?.recipientAddress || debt?.plaintiffLawFirmAddress || debtPartyInfo?.recipientAddress)
                      }
                      enrichmentHint={addressEnrichMeta?.hint}
                      lookupBusy={addressLookupBusy}
                      onLookupAddress={() => void fillDebtRecipientAddress()}
                      value={{
                        fromName: senderName,
                        fromLine1: senderAddressLine1,
                        fromLine2: senderAddressLine2,
                        fromCityStateZip:
                          senderCityStateZip ||
                          resolveCityStateZip({
                            cityStateZip: senderCityStateZip,
                            city: canonicalIdentity.city,
                            state: canonicalIdentity.state,
                            postalCode: canonicalIdentity.postalCode,
                          }),
                        ...(() => {
                          const mailTo = resolveLetterMailRecipient({
                            preferCounsel: draft?.type === 'court',
                            plaintiffLawFirm: debt?.plaintiffLawFirm,
                            plaintiffLawFirmAddress: debt?.plaintiffLawFirmAddress,
                            recipientName: debt?.recipientName || debtPartyInfo?.recipientName || debt?.name,
                            recipientAddress: debt?.recipientAddress || debtPartyInfo?.recipientAddress,
                            debtCollectorName: debt?.collectorName || debtPartyInfo?.collectorName,
                            collectorName: debt?.collectorName,
                            creditorName: debt?.name,
                            originalCreditorName: debt?.originalCreditor || debtPartyInfo?.originalCreditor,
                            plaintiffAttorneyName: debt?.plaintiffAttorneyName,
                            senderName: canonicalIdentity.fullName,
                            senderAddress1: canonicalIdentity.address1 ?? canonicalIdentity.addressLine1,
                            senderCity: canonicalIdentity.city,
                            senderPostalCode: canonicalIdentity.postalCode,
                          });
                          return {
                            toName: mailTo.name,
                            toLinesText: mailTo.missing ? '' : mailTo.address,
                          };
                        })(),
                        subject: `Re: ${debt?.name || 'debt matter'}`,
                      }}
                      onChange={(patch) => {
                        if (patch.fromName !== undefined) setSenderName(patch.fromName);
                        if (patch.fromLine1 !== undefined) setSenderAddressLine1(patch.fromLine1);
                        if (patch.fromLine2 !== undefined) setSenderAddressLine2(patch.fromLine2);
                        if (patch.fromCityStateZip !== undefined) setSenderCityStateZip(patch.fromCityStateZip);
                        if (patch.toName !== undefined && debt) {
                          handleDebtIntelChange({ ...debt, recipientName: patch.toName });
                        }
                        if (patch.toLinesText !== undefined && debt) {
                          handleDebtIntelChange({
                            ...debt,
                            recipientAddress: patch.toLinesText,
                          });
                        }
                      }}
                    />
                    {!senderMailingComplete ? (
                      <div className="mt-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                        Add your mailing address before saving — missing lines appear in red on the preview.
                      </div>
                    ) : null}
                    <div className="mt-2 text-[11px] text-white/45">
                      Letter date: <span className="text-white/75">{letterDate}</span>
                      <span className="block mt-1 text-white/40">Keep contact email off mailed letters — name and mailing address only.</span>
                    </div>
                  </div>
                </div>

                <div id="fc-debt-step-generate" className="flex flex-wrap items-center justify-between gap-3 pt-2 scroll-mt-3 border-t border-white/10 sticky bottom-0 z-10 bg-[#0a0f0d]/95 backdrop-blur-sm py-3 -mx-1 px-1">
                  <LetterEmailPartnerToggle
                    checked={emailPartnerOnEvents}
                    onChange={setEmailPartnerOnEvents}
                    hint={layout === 'embedded' ? 'Notify partner by email' : 'Email me on save'}
                    label={layout === 'embedded' ? 'Email partner' : 'Email me'}
                  />
                  <button
                    type="button"
                    disabled={draftBusy}
                    onClick={async () => {
                      if (!canUseLetters) {
                        setDraftErr('Letters is locked on your current plan. Open Billing to unlock Letters.');
                        return;
                      }
                      const plain = htmlToPlainText(draft.html || '');
                      if (!plain.trim()) {
                        setDraftErr('Draft is empty.');
                        return;
                      }
                      if (shouldPromptForDownload({ kind: 'debt' })) {
                        setPdfChoice({ kind: 'debt' });
                        return;
                      }
                      setDraftBusy(true);
                      setDraftErr(null);
                      try {
                        persistDebtSenderSnapshot();
                        const createdAt = new Date().toISOString();
                        const title =
                          draft.title ||
                          resolveDebtDraftTitle({
                            specId: draft.specId,
                            catalogId: draft.catalogId,
                            track: draft.type,
                            debtName: debt?.name,
                          });

                        const pdf = await generateTextPdfToVault({
                          text: plain,
                          filename: `FinelyCred_${draft.type}_${safePartnerName(debt?.name || 'letter')}_${today}.pdf`,
                          meta: { partnerId: partner.id, debtId: debt?.id, type: draft.type },
                        });

                        const saved = upsertLetter({
                          id: draft.letterId || newId('letter'),
                          partnerId: partner.id,
                          type: letterTypeForDebtDraft(draft.type),
                          title,
                          createdAt,
                          body: plain,
                          status: 'generated',
                          pdfBlobRef: pdf.pdfBlobRef ?? undefined,
                          pdfFilename: pdf.filename,
                          relatedEvidenceIds: draft.evidenceId ? [draft.evidenceId] : [],
                          meta: metaForDebtDraft(draft, debt, String(recommendedScenario || '')),
                        });
                        addAuditEvent({
                          partnerId: partner.id,
                          actorType: layout === 'embedded' ? 'admin' : 'partner',
                          actorEmail: undefined,
                          action: 'letter.saved',
                          entityType: 'letter',
                          entityId: saved.id,
                          meta: { kind: draft.type, pdfBlobRef: pdf.pdfBlobRef ?? null, filename: pdf.filename, debtId: debt?.id ?? null },
                        });
                        notifyPartnerLetterEvent({
                          event: 'saved',
                          letterIds: [saved.id],
                          letterTitles: [title],
                        });

                        setDraft(null);
                        openVault();
                      } catch (e: any) {
                        setDraftErr(e?.message || 'Failed to save letter.');
                      } finally {
                        setDraftBusy(false);
                      }
                    }}
                    className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60 disabled:cursor-not-allowed`}
                    title="Save this letter (PDF) into Letters Vault"
                  >
                    {draftBusy ? 'Saving…' : draft.letterId ? 'Save PDF → Vault' : 'Save PDF → Vault'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* Global â€œSave vs Save+Downloadâ€ chooser (partner-only) */}
      {pdfChoice ? (
        <div className="fixed inset-0 z-[170] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPdfChoice(null)} />
          <div
            className="relative w-full max-w-2xl max-h-[92vh] rounded-3xl border border-white/[0.08] bg-[#0a0f0d] shadow-2xl overflow-hidden flex flex-col"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 md:p-6 border-b border-white/[0.08] flex items-start justify-between gap-4 shrink-0">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Generate PDF</div>
                <div className="mt-2 text-2xl font-light text-white">How do you want to proceed?</div>
                <div className="mt-1 text-white/60 text-sm">By default, we save the PDF into your profile (Letters Vault).</div>
              </div>
              <button
                type="button"
                onClick={() => setPdfChoice(null)}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-white/70 transition-all"
                aria-label="Close"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
              <button
                type="button"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                onClick={async () => {
                  const choice = pdfChoice;
                  setPdfChoice(null);
                  if (!choice) return;
                  if (choice.kind === 'debt') {
                    // Save-only (no download)
                    // Re-trigger the existing save handler by setting shouldPrompt false behavior inline:
                    // We simply run the same logic as the button, without download.
                    if (!draft) return;
                    const plain = htmlToPlainText(draft.html || '');
                    if (!plain.trim()) return;
                    setDraftBusy(true);
                    setDraftErr(null);
                    try {
                      persistDebtSenderSnapshot();
                      const createdAt = new Date().toISOString();
                      const title =
                        draft.title ||
                        resolveDebtDraftTitle({
                          specId: draft.specId,
                          catalogId: draft.catalogId,
                          track: draft.type,
                          debtName: debt?.name,
                        });

                      const pdf = await generateTextPdfToVault({
                        text: plain,
                        filename: `FinelyCred_${draft.type}_${safePartnerName(debt?.name || 'letter')}_${today}.pdf`,
                        meta: { partnerId: partner.id, debtId: debt?.id, type: draft.type },
                      });

                      const saved = upsertLetter({
                        id: draft.letterId || newId('letter'),
                        partnerId: partner.id,
                        type: letterTypeForDebtDraft(draft.type),
                        title,
                        createdAt,
                        body: plain,
                        status: 'generated',
                        pdfBlobRef: pdf.pdfBlobRef ?? undefined,
                        pdfFilename: pdf.filename,
                        relatedEvidenceIds: draft.evidenceId ? [draft.evidenceId] : [],
                        meta: metaForDebtDraft(draft, debt, String(recommendedScenario || '')),
                      });
                      addAuditEvent({
                        partnerId: partner.id,
                        actorType: layout === 'embedded' ? 'admin' : 'partner',
                        actorEmail: undefined,
                        action: 'letter.saved',
                        entityType: 'letter',
                        entityId: saved.id,
                        meta: { kind: draft.type, pdfBlobRef: pdf.pdfBlobRef ?? null, filename: pdf.filename, debtId: debt?.id ?? null },
                      });
                      notifyPartnerLetterEvent({
                        event: 'saved',
                        letterIds: [saved.id],
                        letterTitles: [title],
                      });

                      setDraft(null);
                      openVault();
                    } catch (e: any) {
                      setDraftErr(e?.message || 'Failed to save letter.');
                    } finally {
                      setDraftBusy(false);
                    }
                  }
                  if (choice.kind === 'dispute') {
                    await generateDisputeLetterForBureau(choice.bureau, { download: false });
                  }
                }}
              >
                Save only (recommended)
              </button>

              <button
                type="button"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/80 transition-all"
                onClick={async () => {
                  const choice = pdfChoice;
                  setPdfChoice(null);
                  if (!choice) return;
                  if (choice.kind === 'debt') {
                    if (!draft) return;
                    const plain = htmlToPlainText(draft.html || '');
                    if (!plain.trim()) return;
                    setDraftBusy(true);
                    setDraftErr(null);
                    try {
                      persistDebtSenderSnapshot();
                      const createdAt = new Date().toISOString();
                      const title =
                        draft.title ||
                        resolveDebtDraftTitle({
                          specId: draft.specId,
                          catalogId: draft.catalogId,
                          track: draft.type,
                          debtName: debt?.name,
                        });

                      const pdf = await generateTextPdfToVault({
                        text: plain,
                        filename: `FinelyCred_${draft.type}_${safePartnerName(debt?.name || 'letter')}_${today}.pdf`,
                        meta: { partnerId: partner.id, debtId: debt?.id, type: draft.type },
                      });

                      const saved = upsertLetter({
                        id: draft.letterId || newId('letter'),
                        partnerId: partner.id,
                        type: letterTypeForDebtDraft(draft.type),
                        title,
                        createdAt,
                        body: plain,
                        status: 'generated',
                        pdfBlobRef: pdf.pdfBlobRef ?? undefined,
                        pdfFilename: pdf.filename,
                        relatedEvidenceIds: draft.evidenceId ? [draft.evidenceId] : [],
                        meta: metaForDebtDraft(draft, debt, String(recommendedScenario || '')),
                      });
                      addAuditEvent({
                        partnerId: partner.id,
                        actorType: layout === 'embedded' ? 'admin' : 'partner',
                        actorEmail: undefined,
                        action: 'letter.saved',
                        entityType: 'letter',
                        entityId: saved.id,
                        meta: { kind: draft.type, pdfBlobRef: pdf.pdfBlobRef ?? null, filename: pdf.filename, debtId: debt?.id ?? null },
                      });
                      notifyPartnerLetterEvent({
                        event: 'saved',
                        letterIds: [saved.id],
                        letterTitles: [title],
                      });

                      if (pdf.pdfBlobRef) {
                        await downloadFromBlobRef(pdf.pdfBlobRef, pdf.filename, 'application/pdf');
                      } else {
                        setDraftErr('Saved, but could not generate a download link.');
                      }

                      setDraft(null);
                      openVault();
                    } catch (e: any) {
                      setDraftErr(e?.message || 'Failed to save letter.');
                    } finally {
                      setDraftBusy(false);
                    }
                  }

                  if (choice.kind === 'dispute') {
                    await generateDisputeLetterForBureau(choice.bureau, { download: true });
                  }
                }}
              >
                Save + download
              </button>

              <button
                type="button"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/[0.08] bg-black/40 hover:bg-black/35 text-[10px] font-black uppercase tracking-widest text-white/60 transition-all"
                onClick={() => setPdfChoice(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div data-fc-letter-studio="1" className="space-y-3 w-full">
        {layout === 'standalone' && !unifiedShell ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => navigate('/portal/dashboard')}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft size={16} /> Partner Dashboard
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => openVault()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                title="Open your Letters Vault (saved PDFs)"
              >
                <ScrollText size={14} /> Letters Vault
              </button>
            </div>
          </div>
        ) : null}

        {!unifiedShell && !debtCenterMode ? (
          <LetterTrackTabs tabs={letterStudioTrackTabs} activeTab={tab} onTabChange={setTab} />
        ) : null}

        {debtCenterMode && !(activeTab != null && onTabChange) ? (
          <div className="flex flex-wrap gap-2 p-1 rounded-2xl border border-white/10 bg-black/30">
            {(
              [
                { key: 'validation' as const, label: 'Validation', accent: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100' },
                { key: 'court' as const, label: 'Affidavits & Court', accent: 'border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-100' },
                { key: 'foreclosure' as const, label: 'Foreclosure', accent: 'border-amber-400/40 bg-amber-500/15 text-amber-100' },
                { key: 'repossession' as const, label: 'Repossession', accent: 'border-rose-400/40 bg-rose-500/15 text-rose-100' },
                { key: 'bankruptcy' as const, label: 'Bankruptcy', accent: 'border-sky-400/40 bg-sky-500/15 text-sky-100' },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                className={
                  (tab === t.key ? t.accent : 'bg-white/5 text-white/75 border-white/10 hover:bg-white/10') +
                  ' inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all'
                }
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : null}

        {tab === 'dispute' ? (
          <details open className="fc-light-glass-panel fc-light-chrome-panel !p-4">
            <summary className="cursor-pointer list-none flex flex-wrap items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
              <div className="text-[10px] uppercase tracking-widest text-amber-200/80">Letter journey · your next steps</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-white/70">{restoreHud.pct}% complete</div>
            </summary>
            <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
              <div className="text-white/60 text-sm max-w-5xl">
                Open by default: upload report → choose Round 1/2 → select disputes → evidence → saved PDF.
              </div>
              <div className="flex flex-wrap gap-2">
                {restoreHud.steps.map((s) => (
                  <div
                    key={s.id}
                    className={
                      'px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ' +
                      (s.done ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100/90' : 'border-white/[0.08] bg-black/40 text-white/50')
                    }
                    title={`${s.hint} ${s.meta ? `(${s.meta})` : ''}`.trim()}
                  >
                    {s.label}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-white/55 text-sm">
                  Next: <span className="text-white/85 font-semibold">{nextBestAction.label}</span>
                </div>
                <button
                  type="button"
                  onClick={runNextBestAction}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/25 bg-amber-500/15 hover:bg-amber-500/20 text-[10px] font-black uppercase tracking-widest text-amber-100 transition-all"
                >
                  Do next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </details>
        ) : null}

        {tab === 'dispute' && (
          <EntitlementGate
            partnerId={partner.id}
            requiredKeys={[ENTITLEMENT_KEYS.disputes]}
            hideBillingCta={layout === 'embedded'}
            lockedActions={
              onRequestGrantEntitlements ? (
                <button
                  type="button"
                  onClick={() =>
                    onRequestGrantEntitlements([ENTITLEMENT_KEYS.disputes, ENTITLEMENT_KEYS.letters])
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-400/40 bg-amber-500/15 hover:bg-amber-500/25 text-[10px] font-black uppercase tracking-widest text-amber-50 transition-all"
                >
                  Grant Credit Letters access
                </button>
              ) : layout === 'embedded' ? (
                <p className="text-sm text-white/60">
                  Scroll to Access at the bottom of this partner profile and tap Grant Credit Letters / Bureaus access.
                </p>
              ) : null
            }
          >
            <LetterEasyFlowShell
              contextTitle="Step 1 — Choose Round 1 or Round 2+"
              contextSubtitle="Round 1 = first bureau letters. Round 2+ = transferred from another company or following up after a prior letter."
              context={
                <>
                  <div className="flex flex-wrap items-start justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const r = roundByBureau.EXP;
                        setRoundByBureau({ EXP: r, EQF: r, TUC: r });
                      }}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/70 hover:text-white"
                    >
                      Sync all bureaus
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { id: 'fresh', label: 'New partner · Round 1', round: 'Round 1' as LetterRound, hint: 'First letters with Finely Cred' },
                        { id: 'transfer', label: 'Transferred · Round 2', round: 'Round 2' as LetterRound, hint: 'Prior company already mailed Round 1' },
                        { id: 'followup', label: 'Deep follow-up · Round 3', round: 'Round 3' as LetterRound, hint: 'Bureau responded — escalate angle' },
                        { id: 'escalate', label: 'Escalation · Round 4', round: 'Round 4' as LetterRound, hint: 'Pattern of non-compliance' },
                      ] as const
                    ).map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setRoundByBureau({ EXP: preset.round, EQF: preset.round, TUC: preset.round });
                          for (const b of ['EXP', 'EQF', 'TUC'] as Bureau[]) {
                            const items = selectedByBureau[b] ?? [];
                            if (!items.length) continue;
                            const dominant = dominantNegativeTypeFromCandidates(items.map((s) => s.candidate as import('../../domain/creditReports').DisputeCandidate));
                            setIntroByBureau((prev) => ({
                              ...prev,
                              [b]:
                                prev[b] && !isStockDisputeIntro(htmlToPlainText(prev[b]))
                                  ? prev[b]
                                  : plainTextToHtml(
                                      defaultDisputeIntro(
                                        toneByBureau[b],
                                        dominant,
                                        preset.round,
                                        items.length === 1 ? items[0]?.candidate.account : undefined,
                                        roundTransferNote,
                                      ),
                                    ),
                            }));
                          }
                        }}
                        className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-left hover:border-amber-400/35 hover:bg-amber-500/10 transition-all"
                      >
                        <div className="text-sm font-semibold text-amber-100">{preset.label}</div>
                        <div className="text-xs text-white/45 mt-0.5">{preset.hint}</div>
                      </button>
                    ))}
                  </div>
                  <div className="grid lg:grid-cols-3 gap-3">
                    {(['EXP', 'EQF', 'TUC'] as Bureau[]).map((b) => {
                      const round = roundByBureau[b];
                      const guidance = INTER_ROUND_GUIDANCE[round];
                      const suggested = suggestedRoundByBureau[b];
                      return (
                        <div key={b} className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-white">{bureauFullName(b)}</span>
                            <span className="text-xs text-fuchsia-200/80">{guidance.title}</span>
                          </div>
                          {suggested !== round ? (
                            <button
                              type="button"
                              onClick={() => {
                                setRoundByBureau((prev) => ({ ...prev, [b]: suggested }));
                                const items = selectedByBureau[b] ?? [];
                                if (items.length) {
                                  const dominant = dominantNegativeTypeFromCandidates(items.map((s) => s.candidate as import('../../domain/creditReports').DisputeCandidate));
                                  setIntroByBureau((prev) => ({
                                    ...prev,
                                    [b]: plainTextToHtml(
                                      defaultDisputeIntro(toneByBureau[b], dominant, suggested, items.length === 1 ? items[0]?.candidate.account : undefined, roundTransferNote),
                                    ),
                                  }));
                                }
                              }}
                              className="w-full rounded-lg border border-sky-400/30 bg-sky-500/10 px-2 py-1.5 text-xs font-semibold text-sky-100 text-left"
                            >
                              Smart suggest: {suggested.replace('Round ', 'R')} (from case history)
                            </button>
                          ) : null}
                          <div className="flex flex-wrap gap-1.5">
                            {DISPUTE_ROUND_ORDER.map((r) => (
                              <button
                                key={r}
                                type="button"
                                onClick={() => {
                                  setRoundByBureau((prev) => ({ ...prev, [b]: r }));
                                  const dominant = dominantNegativeTypeFromCandidates(
                                    selectedDisputes.filter((s) => s.candidate.bureau === b).map((s) => s.candidate),
                                  );
                                  setIntroByBureau((prev) => ({
                                    ...prev,
                                    [b]:
                                      prev[b] && !isStockDisputeIntro(htmlToPlainText(prev[b]))
                                        ? prev[b]
                                        : plainTextToHtml(defaultDisputeIntro(toneByBureau[b], dominant, r, undefined, roundTransferNote)),
                                  }));
                                }}
                                className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                                  round === r
                                    ? 'border-amber-400/50 bg-amber-500/20 text-amber-100'
                                    : suggested === r
                                      ? 'border-sky-400/30 bg-sky-500/10 text-sky-100'
                                      : 'border-white/10 text-white/45 hover:border-white/20'
                                }`}
                              >
                                {r.replace('Round ', 'R')}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-white/45 leading-relaxed">{guidance.betweenRounds[0]}</p>
                        </div>
                      );
                    })}
                  </div>
                  <label className="block">
                    <span className="text-xs font-semibold text-white/50">Transfer note (optional)</span>
                    <input
                      value={roundTransferNote}
                      onChange={(e) => setRoundTransferNote(e.target.value)}
                      placeholder="e.g. Round 1 mailed with prior company in March 2026 — starting Round 2 here"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white/85 placeholder:text-white/25"
                    />
                  </label>
                </>
              }
              actions={
                <LetterStepPath
                  showDraftBanner={Boolean(draftSavedAt) && selectedDisputes.length > 0}
                  draftSavedAt={draftSavedAt}
                  onContinue={runLetterBuildContinue}
                  onDiscardDraft={() => {
                    if (!partner?.id) return;
                    if (!window.confirm('Discard the in-progress letter draft?')) return;
                    clearDisputeStudioDraft();
                    setIdentityEvidenceIds([]);
                    setDraftSavedAt(null);
                  }}
                  steps={letterBuildPathSteps}
                  onStep={(id) => runLetterBuildStep(id as LetterBuildStepId)}
                />
              }
              work={
            <div className="space-y-3 w-full">
              <div className="rounded-2xl border border-white/[0.08] bg-black/30 !p-4 space-y-3 w-full">
                <PartnerCreditWorkloadStrip
                  partnerId={partner.id}
                  selectedDisputes={selectedDisputes}
                  evidenceByCandidateId={evidenceByCandidateId as Record<string, string>}
                  reasonsByCandidateId={reasonsByCandidateId}
                  compact
                />

                {selectedDisputes.length > 0 ? (
                  <div className="rounded-xl border border-amber-400/30 bg-amber-500/[0.07] !p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[10px] font-black uppercase tracking-widest text-amber-200/80">
                        Selected negatives ({selectedDisputes.length})
                      </div>
                      {evidencePickerCandidate ? (
                        <div className="text-[10px] text-white/60">
                          Attaching screenshot for{' '}
                          <span className="text-amber-200 font-bold">{evidencePickerCandidate.candidate.account}</span>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
                      {selectedDisputes.map((s) => {
                        const isTargeted = evidencePicker?.candidateId === s.key;
                        const hasEvidence = Boolean(evidenceByCandidateId[s.key]);
                        return (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => {
                              setWorkspaceBureau(s.candidate.bureau);
                              setFocusedKeyByBureau((prev) => ({ ...prev, [s.candidate.bureau]: s.key }));
                            }}
                            title={`${s.candidate.account} \u00b7 ${s.candidate.type} \u00b7 ${bureauShortCode(s.candidate.bureau)}${hasEvidence ? ' \u00b7 screenshot attached' : ' \u00b7 no screenshot yet'}`}
                            className={
                              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all max-w-[220px] ' +
                              (isTargeted
                                ? 'border-amber-400 bg-amber-500 text-black shadow-[0_0_16px_-2px_rgba(251,191,36,0.65)]'
                                : hasEvidence
                                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20'
                                  : 'border-white/15 bg-black/40 text-white/75 hover:bg-white/10')
                            }
                          >
                            <span className="truncate">{s.candidate.account}</span>
                            <span className={isTargeted ? 'text-black/60 text-[10px]' : 'opacity-60 text-[10px]'}>
                              {bureauShortCode(s.candidate.bureau)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white">Bureau letters</div>
                    <div className="mt-2 text-white/70 text-sm">
                      Use the path above to <span className="text-white font-medium">Select disputes</span>, then attach evidence inline. Selections split into separate bureau letters (Experian, Equifax, TransUnion).
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openDisputeCenter()}
                      className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                      title="Open dispute case tracking"
                    >
                      Dispute cases <ChevronRight size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setReasonsLibraryOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                      title="Reference-only dispute reasons library"
                    >
                      <FileText size={14} /> Reason library
                    </button>
                  </div>
                </div>

                <div className="text-sm text-white/50">
                  Selected: <span className="text-white/80 font-medium">{selectedDisputes.length}</span>
                  {selectedDisputes.length === 0 ? (
                    <span className="text-white/40"> — use the path step <span className="text-amber-200/90">Select disputes</span> to open the picker</span>
                  ) : null}
                </div>
              </div>

              {pdfErr ? (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200/90 text-sm">{pdfErr}</div>
              ) : null}

              {returnNotice ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-white/75 text-sm">{returnNotice}</div>
              ) : null}

              {screenshotEvidence.length === 0 ? (
                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5 text-white/70">
                  <div className="text-white/90 font-semibold">No screenshots taken yet</div>
                  <div className="mt-1 text-sm text-white/60">
                    Take screenshots from Reports (Accounts/Collections) or upload an image in the screenshot picker. Once screenshots exist, you can attach them per dispute item.
                  </div>
                </div>
              ) : null}

              {selectedDisputes.length === 0 ? (
                <div className="fc-light-glass-panel fc-light-chrome-panel !p-4 space-y-3 text-white/70">
                  <div className="text-white font-semibold text-sm">No disputes selected yet</div>
                  <p className="text-sm text-white/55">
                    {reports.length === 0
                      ? 'Upload a credit report first — then Round 1 / Round 2 choices and selectable negatives appear.'
                      : 'Use Continue — Disputes (or Select disputes) to open the picker and choose accounts for this round.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-400/40 bg-amber-500/15 hover:bg-amber-500/25 text-[10px] font-black uppercase tracking-widest text-amber-50"
                    >
                      Select disputes
                    </button>
                    {reports.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => openReports()}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/12 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70"
                      >
                        Upload report
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <>
                  <LetterBureauTabs
                    active={workspaceBureau}
                    counts={disputeCountsByBureau}
                    missingEvidence={missingEvidenceByBureau}
                    onChange={setWorkspaceBureau}
                  />
                  {disputeBureauItems.length > 0 ? (
                  (() => {
                  const b = disputeBureau;
                  const items = disputeBureauItems;
                  const busy = pdfBusyByBureau[b];
                  const aiBusy = aiBusyByBureau[b];
                  const aiErr = aiErrByBureau[b] ?? null;
                  const aiQuestions = aiQuestionsByBureau?.[b] ?? [];
                  const round = roundByBureau[b];
                  const tone = toneByBureau[b];
                  const introHtml = introByBureau[b];
                  const footerHtml = footerByBureau[b] || plainTextToHtml(defaultDisputeFooter(tone));
                  const studioOpen = studioOpenByBureau[b] ?? true;

                  const anyMissingEvidence = items.some((s) => !evidenceByCandidateId[s.key]);
                  const anyMissingInputs = false;
                  const evidenceDone = items.filter((s) => Boolean(evidenceByCandidateId[s.key])).length;
                  const reasonsDone = items.filter((s) => (reasonsByCandidateId[s.key] ?? []).filter(Boolean).length > 0).length;
                  const readiness = Math.round(
                    ((items.length ? evidenceDone / items.length : 0) * 0.6 + (items.length ? reasonsDone / items.length : 0) * 0.4) * 100,
                  );
                  const groupOn = groupByCreditorByBureau[b] ?? true;
                  return (
                    <div key={b} id={`fc-bureau-${b}`} className="rounded-2xl border border-white/[0.08] bg-black/30 !p-4 space-y-3">
                      <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {round} · {items.length} dispute{items.length === 1 ? '' : 's'}
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <div
                              className={
                                'px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest ' +
                                (readiness >= 85
                                  ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100/90'
                                  : readiness >= 55
                                    ? 'border-amber-500/25 bg-amber-500/10 text-amber-100/90'
                                    : 'border-red-500/25 bg-red-500/10 text-red-100/90')
                              }
                              title="Evidence is weighted higher than reasons (because itâ€™s the proof)"
                            >
                              Readiness {readiness}%
                            </div>
                            {anyMissingEvidence ? (
                              <div className="px-3 py-2 rounded-xl border border-amber-500/25 bg-amber-500/10 text-[10px] font-black uppercase tracking-widest text-amber-100/90">
                                Evidence optional
                              </div>
                            ) : null}
                            {reasonsDone < items.length ? (
                              <div className="px-3 py-2 fc-light-glass-panel fc-light-chrome-panel rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60">
                                Reasons {reasonsDone}/{items.length}
                              </div>
                            ) : null}
                            {lastGeneratedAtByBureau[b] ? (
                              <div className="px-3 py-2 fc-light-glass-panel fc-light-chrome-panel rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60">
                                Generated
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              const prev: Record<string, string[]> = {};
                              for (const s of items) prev[s.key] = reasonsByCandidateId[s.key] ?? [];
                              setBulkUndo({ bureau: b, prevReasonsByCandidateId: prev });
                              setReasonsByCandidateId((cur) => {
                                const out = { ...cur };
                                for (const s of items) {
                                  const suggested = (suggestionsById[s.key] ?? []).slice(0, 3).map((x) => x.text);
                                  if (suggested.length) out[s.key] = suggested;
                                }
                                return out;
                              });
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                            title="Apply recommended reasons to every selected item (stores an Undo snapshot)"
                          >
                            Auto reasons
                          </button>

                          {canAiDraft ? (
                            <button
                              type="button"
                              onClick={() => void runAiDraftForBureau(b)}
                              disabled={aiBusy || !aiGatewayEnabled}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                              title={
                                aiGatewayEnabled
                                  ? 'AI drafts opening paragraphs + per-item narratives using your selected reasons'
                                  : 'AI drafting is disabled in Settings'
                              }
                            >
                              <Sparkles size={14} /> {!aiGatewayEnabled ? 'AI disabled' : aiBusy ? 'Draftingâ€¦' : 'AI draft letter'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => navigate('/portal/billing')}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                              title="Premium feature: upgrade to unlock AI drafting"
                            >
                              <Lock size={14} /> Premium AI
                            </button>
                          )}

                          {bulkUndo?.bureau === b ? (
                            <button
                              type="button"
                              onClick={() => {
                                const prev = bulkUndo.prevReasonsByCandidateId;
                                setBulkUndo(null);
                                setReasonsByCandidateId((cur) => {
                                  const out = { ...cur };
                                  for (const k of Object.keys(prev)) out[k] = prev[k] ?? [];
                                  return out;
                                });
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/25 bg-amber-500/10 hover:bg-amber-500/15 text-[10px] font-black uppercase tracking-widest text-amber-100 transition-all"
                              title="Undo the last bulk reasons action"
                            >
                              Undo
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setGroupByCreditorByBureau((prev) => ({ ...prev, [b]: !(prev[b] ?? true) }))}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                            title="Group items by company name (reduces long lists)"
                          >
                            {groupOn ? 'Grouped' : 'Ungrouped'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const keys = new Set(items.map((x) => x.key));
                              setBulkUndo(null);
                              setLastGeneratedAtByBureau((prev) => ({ ...prev, [b]: null }));
                              setEvidenceByCandidateId((cur) => {
                                const out = { ...cur };
                                for (const k of keys) delete out[k];
                                return out;
                              });
                              setReasonsByCandidateId((cur) => {
                                const out = { ...cur };
                                for (const k of keys) delete out[k];
                                return out;
                              });
                              setAiNarrativeByCandidateKey((cur) => {
                                const out = { ...cur };
                                for (const k of keys) delete out[k];
                                return out;
                              });
                              setAiQuestionsByBureau((prev) => ({ ...prev, [b]: [] }));
                              setAiErrByBureau((prev) => ({ ...prev, [b]: null }));
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-black/40 hover:bg-black/35 text-[10px] font-black uppercase tracking-widest text-white/60 transition-all"
                            title="Clear evidence + reasons for this bureau (keeps disputes selected)"
                          >
                            Reset
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const keys = new Set(items.map((x) => x.key));
                              setSelectedDisputes((prev) => prev.filter((x) => x.candidate.bureau !== b));
                              setBulkUndo(null);
                              setLastGeneratedAtByBureau((prev) => ({ ...prev, [b]: null }));
                              setFocusedKeyByBureau((prev) => ({ ...prev, [b]: null }));
                              setEvidenceByCandidateId((cur) => {
                                const out = { ...cur };
                                for (const k of keys) delete out[k];
                                return out;
                              });
                              setReasonsByCandidateId((cur) => {
                                const out = { ...cur };
                                for (const k of keys) delete out[k];
                                return out;
                              });
                              setAiNarrativeByCandidateKey((cur) => {
                                const out = { ...cur };
                                for (const k of keys) delete out[k];
                                return out;
                              });
                              setAiQuestionsByBureau((prev) => ({ ...prev, [b]: [] }));
                              setAiErrByBureau((prev) => ({ ...prev, [b]: null }));
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/25 bg-red-500/10 hover:bg-red-500/15 text-[10px] font-black uppercase tracking-widest text-red-100/80 transition-all"
                            title="Remove all disputes for this bureau from the letter (full reset)"
                          >
                            Clear disputes
                          </button>
                          <button
                            type="button"
                            onClick={() => setStudioOpenByBureau((prev) => ({ ...prev, [b]: !(prev[b] ?? true) }))}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                            title="Toggle editor + preview"
                          >
                            <ScrollText size={14} /> {studioOpen ? 'Hide studio' : 'Open studio'}
                          </button>
                          <div>
                            <div className="text-xs font-semibold text-white/50">Tone</div>
                            <select
                              value={tone}
                              onChange={(e) => {
                                const nextTone = e.target.value as LetterTone;
                                setToneByBureau((prev) => ({ ...prev, [b]: nextTone }));
                                const dominant = dominantNegativeTypeFromCandidates(items.map((s) => s.candidate as import('../../domain/creditReports').DisputeCandidate));
                                setIntroByBureau((prev) => ({
                                  ...prev,
                                  [b]:
                                    prev[b] && !isStockDisputeIntro(htmlToPlainText(prev[b]))
                                      ? prev[b]
                                      : plainTextToHtml(
                                          defaultDisputeIntro(
                                            nextTone,
                                            dominant,
                                            round,
                                            items.length === 1 ? items[0]?.candidate.account : undefined,
                                            roundTransferNote,
                                          ),
                                        ),
                                }));
                                setFooterByBureau((prev) => ({ ...prev, [b]: prev[b] || plainTextToHtml(defaultDisputeFooter(nextTone)) }));
                              }}
                              className="mt-2 bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                            >
                              <option value="formal">Formal</option>
                              <option value="neutral">Neutral</option>
                              <option value="conversational">Conversational</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {aiErr ? (
                        <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-red-100/90 text-sm">
                          {aiErr}
                        </div>
                      ) : null}

                      {aiQuestions.length ? (
                        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-white/75">
                          <div className="text-[10px] font-black uppercase tracking-widest text-amber-200/80">AI follow-up questions</div>
                          <ul className="mt-2 list-disc pl-5 text-sm text-white/75 space-y-1">
                            {aiQuestions.map((q, i) => (
                              <li key={`${b}_q_${i}`}>{q}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {/* Preflight */}
                      {anyMissingEvidence && studioOpen ? (
                        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-[10px] font-black uppercase tracking-widest text-amber-200/80">Preflight</div>
                              <div className="mt-1 text-white/75 text-sm">
                                Screenshots are optional, but attaching them makes disputes stronger and faster.
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {anyMissingEvidence ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const target = items.find((x) => !evidenceByCandidateId[x.key]) ?? null;
                                    if (!target) return;
                                    setFocusedKeyByBureau((prev) => ({ ...prev, [b]: target.key }));
                                    if (screenshotEvidence.length === 0) return goCapture({ candidate: target });
                                    setEvidencePicker({ candidateId: target.key });
                                  }}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                                  title="Jump to the first item without a screenshot"
                                >
                                  Attach screenshot <ChevronRight size={14} />
                                </button>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                            <span className="px-3 py-2 rounded-xl border border-white/[0.08] bg-black/40 text-white/60">
                              Missing screenshots{' '}
                              <span className="text-white/80">
                                {items.filter((x) => !evidenceByCandidateId[x.key]).length}/{items.length}
                              </span>
                            </span>
                          </div>
                        </div>
                      ) : null}

                      {studioOpen ? (
                        <div className="space-y-3">
                          <div className="space-y-3">
                            <div className="space-y-2">
                              {!senderMailingComplete ? (
                                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                                  Mailing address required — add your street and city/state/ZIP in Edit below.
                                </div>
                              ) : null}
                              <LetterAddressSummary
                                value={{
                                  fromName: senderName,
                                  fromLine1: senderAddressLine1,
                                  fromLine2: senderAddressLine2,
                                  fromCityStateZip: senderCityStateZip,
                                  toName: bureauAddressDraftByBureau[b]?.name ?? '',
                                  toLinesText: bureauAddressDraftByBureau[b]?.linesText ?? '',
                                  subject: subjectLineByBureau[b] ?? SUBJECT_LINE,
                                }}
                                onChange={(patch) => {
                                  if (patch.fromName !== undefined) setSenderName(patch.fromName);
                                  if (patch.fromLine1 !== undefined) setSenderAddressLine1(patch.fromLine1);
                                  if (patch.fromLine2 !== undefined) setSenderAddressLine2(patch.fromLine2);
                                  if (patch.fromCityStateZip !== undefined) setSenderCityStateZip(patch.fromCityStateZip);
                                  if (patch.toName !== undefined) {
                                    setBureauAddressDraftByBureau((prev) => ({
                                      ...prev,
                                      [b]: { ...(prev[b] || { name: '', linesText: '' }), name: patch.toName! },
                                    }));
                                  }
                                  if (patch.toLinesText !== undefined) {
                                    setBureauAddressDraftByBureau((prev) => ({
                                      ...prev,
                                      [b]: { ...(prev[b] || { name: '', linesText: '' }), linesText: patch.toLinesText! },
                                    }));
                                  }
                                  if (patch.subject !== undefined) {
                                    setSubjectLineByBureau((prev) => ({ ...prev, [b]: patch.subject! }));
                                  }
                                }}
                              />
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSenderName(canonicalIdentity.fullName || partner.profile.fullName || '');
                                    setSenderAddressLine1(canonicalIdentity.address1 || canonicalIdentity.addressLine1 || '');
                                    setSenderAddressLine2(canonicalIdentity.address2 || '');
                                    setSenderCityStateZip(canonicalIdentity.cityStateZip || '');
                                  }}
                                  className={`${FINELY_OS_SECONDARY_BTN} text-xs`}
                                  title="Reset sender fields to the partner's canonical identity"
                                >
                                  Reset sender
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const def = bureauDisputeAddress(b);
                                    setSubjectLineByBureau((prev) => ({ ...prev, [b]: SUBJECT_LINE }));
                                    setBureauAddressDraftByBureau((prev) => ({
                                      ...prev,
                                      [b]: { name: def.name, linesText: def.lines.join('\n') },
                                    }));
                                  }}
                                  className={`${FINELY_OS_SECONDARY_BTN} text-xs`}
                                  title="Reset bureau recipient address + subject line to defaults"
                                >
                                  Reset bureau
                                </button>
                              </div>
                              <p className="text-xs text-white/45">
                                Date on letters: <span className="text-white/75">{letterDate}</span> (auto-filled)
                              </p>
                            </div>

                            <div className="fc-light-glass-panel fc-light-chrome-panel p-5 space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="text-[10px] uppercase tracking-widest text-white/40">Opening paragraphs</div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setDisputeTemplatesOpen(b)}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                                    title="Apply a saved dispute template"
                                  >
                                    Templates
                                  </button>
                                  {canAiDraft ? (
                                    <button
                                      type="button"
                                      onClick={() => void runAiDraftForBureau(b)}
                                      disabled={aiBusy || !aiGatewayEnabled}
                                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all disabled:opacity-60"
                                      title="Have AI draft the opening + narratives for this bureau"
                                    >
                                      <Sparkles size={14} /> {!aiGatewayEnabled ? 'AI disabled' : aiBusy ? 'Draftingâ€¦' : 'AI draft'}
                                    </button>
                                  ) : null}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const dominant = dominantNegativeTypeFromCandidates(
                                        items.map((s) => s.candidate as import('../../domain/creditReports').DisputeCandidate),
                                      );
                                      setIntroByBureau((prev) => ({
                                        ...prev,
                                        [b]: plainTextToHtml(
                                          defaultDisputeIntro(
                                            tone,
                                            dominant,
                                            round,
                                            items.length === 1 ? items[0]?.candidate.account : undefined,
                                            roundTransferNote,
                                          ),
                                        ),
                                      }));
                                    }}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] bg-black/40 hover:bg-black/35 text-[10px] font-black uppercase tracking-widest text-white/60 transition-all"
                                    title="Reset opening paragraphs to the default for this tone"
                                  >
                                    Reset
                                  </button>
                                </div>
                              </div>
                              <RichTextEditor
                                valueHtml={ensureHtmlDraft(introHtml || '')}
                                onChangeHtml={(html) => setIntroByBureau((prev) => ({ ...prev, [b]: html }))}
                                placeholder="Write the opening paragraphs hereâ€¦"
                                minHeightPx={260}
                              />
                              <div className="text-[11px] text-white/40">
                                The rest of the letter is structured automatically (items, screenshots, reasons).
                              </div>
                            </div>

                            <div className="fc-light-glass-panel fc-light-chrome-panel p-5 space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="text-[10px] uppercase tracking-widest text-white/40">Closing / demand block</div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setFooterByBureau((prev) => ({ ...prev, [b]: plainTextToHtml(defaultDisputeFooter(tone)) }))}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] bg-black/40 hover:bg-black/35 text-[10px] font-black uppercase tracking-widest text-white/60 transition-all"
                                    title="Reset closing block to the default for this tone"
                                  >
                                    Reset
                                  </button>
                                </div>
                              </div>
                              <RichTextEditor
                                valueHtml={ensureHtmlDraft(footerHtml || '')}
                                onChangeHtml={(html) => setFooterByBureau((prev) => ({ ...prev, [b]: html }))}
                                placeholder="Write the closing block hereâ€¦"
                                minHeightPx={320}
                              />
                              <div className="text-[11px] text-white/40">
                                This is the editable bottom section. Signature is appended automatically.
                              </div>
                            </div>

                          </div>
                        </div>
                      ) : null}

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 sticky bottom-0 z-10 bg-[#0a0f0d]/90 backdrop-blur-sm py-2">
                        <LetterEmailPartnerToggle
                          checked={emailPartnerOnEvents}
                          onChange={setEmailPartnerOnEvents}
                          hint={layout === 'embedded' ? 'Notify partner' : 'Email me'}
                          label={layout === 'embedded' ? 'Email partner' : 'Email me'}
                        />
                        <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          className={FINELY_OS_SECONDARY_BTN}
                          onClick={() => {
                            const target = items.find((x) => !evidenceByCandidateId[x.key]) ?? items[0] ?? null;
                            if (!target) return;
                            setFocusedKeyByBureau((prev) => ({ ...prev, [b]: target.key }));
                            if (screenshotEvidence.length === 0) return goCapture({ candidate: target });
                            setEvidencePicker({ candidateId: target.key });
                          }}
                        >
                          Attach screenshot <ExternalLink size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={async () => {
                            if (!canUseLetters) {
                              setPdfErr('Letters is locked on your current plan. Open Billing to unlock Letters.');
                              return;
                            }
                            if (shouldPromptForDownload({ kind: 'dispute' })) {
                              setPdfChoice({ kind: 'dispute', bureau: b });
                              return;
                            }
                            await generateDisputeLetterForBureau(b, { download: false });
                          }}
                          className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60 disabled:cursor-not-allowed`}
                          title="Generate PDF and save it to Letters Vault"
                        >
                          <PenLine size={14} /> {busy ? 'Generating…' : 'Generate PDF → Vault'}
                        </button>
                        </div>
                      </div>
                    </div>
                  );
                  })()
                  ) : null}
                </>
              )}

            </div>
              }
              paper={
                disputeBureauItems.length > 0 && (studioOpenByBureau[disputeBureau] ?? true) ? (
                  (() => {
                    const b = disputeBureau;
                    const items = disputeBureauItems;
                    const introHtml = introByBureau[b];
                    const footerHtml = footerByBureau[b] || plainTextToHtml(defaultDisputeFooter(toneByBureau[b]));
                    const round = roundByBureau[b];
                    return (
                      <DisputeLetterIframePreview
                        bureau={b}
                        partnerName={senderName || canonicalIdentity.fullName || partner.profile.fullName || 'Partner'}
                        sender={{
                          name: senderName || undefined,
                          addressLine1: senderAddressLine1 || canonicalIdentity.addressLine1,
                          addressLine2: senderAddressLine2 || canonicalIdentity.address2,
                          cityStateZip: senderCityStateZip || canonicalIdentity.cityStateZip,
                        }}
                        bureauAddress={(() => {
                          const cur = bureauAddressDraftByBureau[b];
                          const name = String(cur?.name || '').trim() || bureauDisputeAddress(b).name;
                          const lines = String(cur?.linesText || '')
                            .split('\n')
                            .map((x) => x.trim())
                            .filter(Boolean);
                          return { name, lines: lines.length ? lines : bureauDisputeAddress(b).lines };
                        })()}
                        subjectLine={(subjectLineByBureau[b] || '').trim() || SUBJECT_LINE}
                        introHtml={ensureHtmlDraft(introHtml || '')}
                        footerHtml={ensureHtmlDraft(footerHtml || '')}
                        round={round}
                        items={items.map((s) => {
                          const evId = evidenceByCandidateId[s.key];
                          const ev = evId ? evidence.find((x) => x.id === evId) : null;
                          return {
                            candidate: { ...s.candidate, id: s.key } as any,
                            evidence: ev ? { filename: ev.filename, blobRef: ev.blobRef, mimeType: ev.mimeType } : null,
                            reasons: reasonsByCandidateId[s.key] ?? [],
                            laws: (lawsByCandidateId[s.key] ?? []).map((l) => ({ cite: l.cite, shortLabel: l.shortLabel })),
                            narrative: (aiNarrativeByCandidateKey[s.key] || '').trim() || null,
                          };
                        })}
                        onOpenFull={() => setPreviewModalBureau(b)}
                        iframeHeightClassName="h-[min(72vh,820px)]"
                      />
                    );
                  })()
                ) : (
                  <div className="rounded-xl border border-white/10 bg-black/30 !p-4 text-sm text-white/50 text-center">
                    Select disputes and open studio to preview your bureau letter.
                  </div>
                )
              }
              rail={
                disputeBureauItems.length > 0 ? (
                  (() => {
                    const b = disputeBureau;
                    const items = disputeBureauItems;
                    const groupOn = groupByCreditorByBureau[b] ?? true;
                    const groups = (() => {
                      if (!groupOn) return [{ key: 'all', label: 'All items', items }];
                      const m = new Map();
                      for (const s of items) {
                        const k = (s.candidate.account || 'Unknown').trim() || 'Unknown';
                        const arr = m.get(k) ?? [];
                        arr.push(s);
                        m.set(k, arr);
                      }
                      return Array.from(m.entries())
                        .sort((a, bb) => a[0].localeCompare(bb[0]))
                        .map(([label, items]) => ({ key: label, label, items }));
                    })();
                    const focusedKey = (() => {
                      const cur = focusedKeyByBureau[b];
                      if (cur && items.some((x) => x.key === cur)) return cur;
                      return items[0]?.key ?? null;
                    })();
                    const focused = focusedKey ? items.find((x) => x.key === focusedKey) ?? null : null;
                    const evId = focused ? evidenceByCandidateId[focused.key] : undefined;
                    const ev = evId ? evidence.find((x) => x.id === evId) ?? null : null;
                    const suggestions = focused ? (suggestionsById[focused.key] ?? []) : [];
                    const selectedReasons = focused ? (reasonsByCandidateId[focused.key] ?? []) : [];
                    const selectedLaws = focused ? (lawsByCandidateId[focused.key] ?? []) : [];
                    const customLawDraft = focused ? (customLawDraftByKey[focused.key] ?? '') : '';
                    const focusedNegativeType = focused
                      ? classifyCandidateNegativeType(focused.candidate as any)
                      : ('unknown' as NegativeType);
                    const focusedPlaybook = NEGATIVE_PLAYBOOKS[focusedNegativeType] ?? NEGATIVE_PLAYBOOKS.unknown;
                    const narrative = focused ? (aiNarrativeByCandidateKey[focused.key] ?? '') : '';
                    return (
                      <div className="space-y-3">
                        <div className="rounded-xl border border-white/10 bg-black/30 !p-3 space-y-2">
                          <div className="text-[10px] uppercase tracking-widest text-white/50">Selected disputes</div>
                          <div className="space-y-2 max-h-[38vh] overflow-y-auto pr-1">
                            {groups.map((g) => {
                              const gid = b + ':' + g.key;
                              const collapsed = collapsedGroups[gid] ?? false;
                              return (
                                <div key={gid} className="rounded-xl border border-white/[0.08] bg-black/40 overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => setCollapsedGroups((prev) => ({ ...prev, [gid]: !(prev[gid] ?? false) }))}
                                    className="w-full px-3 py-2 flex items-center justify-between gap-2 text-left hover:bg-white/[0.03]"
                                  >
                                    <span className="text-sm font-semibold text-white truncate">{g.label}</span>
                                    <span className="text-xs text-white/60">{collapsed ? 'Expand' : 'Collapse'}</span>
                                  </button>
                                  {!collapsed ? (
                                    <div className="p-2 pt-0 space-y-2">
                                      {g.items.map((s: (typeof items)[number]) => {
                                        const rowEvId = evidenceByCandidateId[s.key];
                                        const rowEv = rowEvId ? evidence.find((x) => x.id === rowEvId) ?? null : null;
                                        const reasonCount = (reasonsByCandidateId[s.key] ?? []).filter(Boolean).length;
                                        const isFocused = focusedKey === s.key;
                                        const evStatus = evidenceLinkStatus(rowEv);
                                        return (
                                          <button
                                            key={s.key}
                                            type="button"
                                            onClick={() => setFocusedKeyByBureau((prev) => ({ ...prev, [b]: s.key }))}
                                            className={
                                              'w-full rounded-xl border p-3 text-left space-y-2 transition-all ' +
                                              (isFocused
                                                ? 'border-amber-500/45 bg-amber-500/12 ring-1 ring-amber-400/25'
                                                : 'border-white/[0.12] bg-black/45 hover:bg-white/[0.04]')
                                            }
                                          >
                                            <div className="text-sm font-semibold text-white truncate">{s.candidate.account}</div>
                                            <div className="text-xs text-white/60">{s.candidate.type}</div>
                                            <div className="flex flex-wrap gap-1.5">
                                              <span className="px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase text-white/70">{evStatus.label}</span>
                                              <span className="px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase text-white/70">Reasons {reasonCount}</span>
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        {focused ? (
                          <div id="fc-focused-item" className="rounded-xl border border-white/10 bg-black/30 !p-3 space-y-3 max-h-[48vh] overflow-y-auto">
                            <div className="text-[10px] uppercase tracking-widest text-white/50">Focused item</div>
                            <div className="text-sm font-semibold text-white">{focused.candidate.account} — {focused.candidate.type}</div>
                            <button
                              type="button"
                              onClick={() => {
                                const key = focused.key;
                                setSelectedDisputes((prev) => prev.filter((x) => x.key !== key));
                                setEvidenceByCandidateId((prev) => { const out = { ...prev }; delete out[key]; return out; });
                                setReasonsByCandidateId((prev) => { const out = { ...prev }; delete out[key]; return out; });
                                setLawsByCandidateId((prev) => { const out = { ...prev }; delete out[key]; return out; });
                                setAiNarrativeByCandidateKey((prev) => { const out = { ...prev }; delete out[key]; return out; });
                                setFocusedKeyByBureau((prev) => ({ ...prev, [b]: null }));
                                setLastGeneratedAtByBureau((prev) => ({ ...prev, [b]: null }));
                              }}
                              className="px-3 py-1.5 rounded-lg border border-red-500/25 bg-red-500/10 text-[10px] font-black uppercase text-red-100"
                            >
                              Remove dispute
                            </button>
                            <div className="rounded-lg border border-white/10 bg-black/40 !p-3 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] uppercase tracking-widest text-white/45">Evidence</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (screenshotEvidence.length === 0) return goCapture({ candidate: focused });
                                    setEvidencePicker({ candidateId: focused.key });
                                  }}
                                  className="px-2 py-1 rounded-lg bg-amber-500 text-black text-[10px] font-black uppercase"
                                >
                                  {ev ? 'Replace' : 'Attach'}
                                </button>
                              </div>
                              {ev ? <div className="text-xs text-white/70 truncate">{ev.filename}</div> : <div className="text-xs text-white/50">No evidence attached</div>}
                            </div>
                            <div className="rounded-lg border border-white/10 bg-black/40 !p-3 space-y-2">
                              <div className="text-[10px] uppercase tracking-widest text-white/45">Reasons ({selectedReasons.filter(Boolean).length})</div>
                              {suggestions.slice(0, 8).map((r) => {
                                const selected = selectedReasons.includes(r.text);
                                return (
                                  <label key={r.id} className="flex items-start gap-2 text-xs text-white/75 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      className="mt-0.5"
                                      checked={selected}
                                      onChange={() => {
                                        setReasonsByCandidateId((prev) => {
                                          const cur = prev[focused.key] ?? [];
                                          const next = selected ? cur.filter((x) => x !== r.text) : [...cur, r.text];
                                          return { ...prev, [focused.key]: next };
                                        });
                                      }}
                                    />
                                    <span>{r.text}</span>
                                  </label>
                                );
                              })}
                            </div>
                            <div id="fc-laws-panel" className="rounded-lg border border-white/10 bg-black/40 !p-3 space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-[10px] uppercase tracking-widest text-white/45">
                                  Laws ({selectedLaws.length})
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const seeded = resolveBureauDisputeLaws(
                                        classifyCandidateNegativeType(focused.candidate as any),
                                      );
                                      setLawsByCandidateId((prev) => ({ ...prev, [focused.key]: seeded }));
                                    }}
                                    className="px-2 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[9px] font-bold uppercase text-white/65"
                                    title="Reset to suggested bureau laws for this negative type"
                                  >
                                    Reset
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setLawsByCandidateId((prev) => ({ ...prev, [focused.key]: [] }))}
                                    className="px-2 py-1 rounded-lg border border-white/10 bg-black/30 text-[9px] font-bold uppercase text-white/55"
                                    title="Clear all laws for this item"
                                  >
                                    Clear
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-white/50 leading-snug" title={focusedPlaybook.aiHint}>
                                <span className="text-white/70 font-medium">{focusedPlaybook.label}:</span>{' '}
                                {focusedPlaybook.aiHint}
                              </p>
                              {selectedLaws.length ? (
                                <div className="space-y-1.5">
                                  {selectedLaws.map((law) => (
                                    <div
                                      key={law.id}
                                      className="flex items-start gap-1.5 rounded-lg border border-white/10 bg-black/30 !p-2"
                                    >
                                      <div className="min-w-0 flex-1 space-y-1">
                                        <input
                                          value={law.cite}
                                          onChange={(e) => {
                                            const cite = e.target.value;
                                            setLawsByCandidateId((prev) => ({
                                              ...prev,
                                              [focused.key]: (prev[focused.key] ?? []).map((l) =>
                                                l.id === law.id ? { ...l, cite, source: 'custom' as const } : l,
                                              ),
                                            }));
                                          }}
                                          className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs text-white/90"
                                          placeholder="Citation"
                                        />
                                        <input
                                          value={law.shortLabel}
                                          onChange={(e) => {
                                            const shortLabel = e.target.value;
                                            setLawsByCandidateId((prev) => ({
                                              ...prev,
                                              [focused.key]: (prev[focused.key] ?? []).map((l) =>
                                                l.id === law.id ? { ...l, shortLabel, source: 'custom' as const } : l,
                                              ),
                                            }));
                                          }}
                                          className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-white/70"
                                          placeholder="Short label"
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setLawsByCandidateId((prev) => ({
                                            ...prev,
                                            [focused.key]: (prev[focused.key] ?? []).filter((l) => l.id !== law.id),
                                          }))
                                        }
                                        className="shrink-0 px-2 py-1 rounded-md border border-red-500/25 bg-red-500/10 text-[9px] font-bold uppercase text-red-100"
                                        title="Remove this law"
                                      >
                                        Del
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs text-white/50">No laws — reset suggested or add a custom cite.</div>
                              )}
                              <div className="flex flex-wrap items-center gap-1.5">
                                <input
                                  value={customLawDraft}
                                  onChange={(e) =>
                                    setCustomLawDraftByKey((prev) => ({ ...prev, [focused.key]: e.target.value }))
                                  }
                                  className="min-w-[120px] flex-1 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs text-white/90"
                                  placeholder="Add custom law / statute"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const raw = customLawDraft.trim();
                                    if (!raw) return;
                                    const next = makeCustomLetterCitation(raw);
                                    setLawsByCandidateId((prev) => ({
                                      ...prev,
                                      [focused.key]: [...(prev[focused.key] ?? []), next],
                                    }));
                                    setCustomLawDraftByKey((prev) => ({ ...prev, [focused.key]: '' }));
                                  }}
                                  className="px-2 py-1 rounded-md border border-emerald-400/30 bg-emerald-500/15 text-[9px] font-bold uppercase text-emerald-100"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                            <textarea
                              value={narrative}
                              onChange={(e) => setAiNarrativeByCandidateKey((prev) => ({ ...prev, [focused.key]: e.target.value }))}
                              rows={3}
                              placeholder="Optional narrative for this item…"
                              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/80"
                            />
                          </div>
                        ) : null}
                      </div>
                    );
                  })()
                ) : null
              }
              footer={
                <>
              <details className="rounded-xl border border-white/10 bg-black/25 !p-3" open={screenshotEvidence.length === 0}>
                <summary className="cursor-pointer text-sm font-semibold text-white">
                  Screenshots & proof {screenshotEvidence.length === 0 ? '(upload or capture)' : `(${screenshotEvidence.length} recent)`}
                </summary>
                <div className="mt-3 space-y-3">
                  <p className="text-xs text-white/50">
                    Bureau dispute screenshots: capture from <span className="text-white/75">Reports</span> or upload here. General documents live in the Evidence vault.
                  </p>
                  {screenshotEvidence.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {screenshotEvidence.slice(0, 8).map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className="rounded-xl border border-white/10 bg-black/30 p-2 hover:border-sky-400/30 transition-all"
                          title={s.filename || 'Attach to focused dispute'}
                          onClick={() => {
                            const focusedKey = focusedKeyByBureau[workspaceBureau];
                            if (focusedKey) {
                              setEvidenceByCandidateId((prev) => ({ ...prev, [focusedKey]: s.id }));
                              setReturnNotice('Screenshot attached to the focused dispute item.');
                            } else {
                              setReturnNotice('Select a dispute item first, then click a screenshot to attach.');
                            }
                          }}
                        >
                          <InlineEvidenceThumb
                            blobRef={s.blobRef}
                            mimeType={s.mimeType}
                            filename={s.filename}
                            alt={s.filename || 'Screenshot'}
                            size="sm"
                          />
                          <div className="mt-1 max-w-[6rem] truncate text-[9px] text-white/45">{s.filename || 'Screenshot'}</div>
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <SmartProofUploader
                    partner={partner}
                    email={partner.profile.email}
                    compact
                    uploadContext="bureau"
                    onUploaded={() => {
                      setEvidenceVersion((v) => v + 1);
                      setReturnNotice('Upload complete — attach screenshots to each dispute item above.');
                    }}
                  />
                </div>
              </details>

              <section className="rounded-2xl border border-violet-500/20 bg-black/30 p-5 sm:p-6 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">Dispute letter coach</h3>
                  <p className="mt-1 text-xs text-white/55">
                    Full-width help with reasons, evidence, and 5-step framing — not squeezed into a side panel.
                  </p>
                </div>
                <LetterDisputeCoachStrip bureau={workspaceBureau} partnerId={partner.id} />
              </section>

              <LetterDisclaimerFooter />
                </>
              }
            />

            <DisputePickerModal
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                reports={reports.map((r) => ({ id: r.id, filename: r.filename, parsed: (r.parsed ?? null) as any }))}
                cases={disputeCases}
                initialSelected={selectedDisputes}
                onApply={(next) => {
                  setSelectedDisputes(next);
                  addAuditEvent({
                    partnerId: partner.id,
                    actorType: layout === 'embedded' ? 'admin' : 'partner',
                    actorEmail: undefined,
                    action: 'letter.disputes_selected',
                    entityType: 'partner',
                    entityId: partner.id,
                    meta: {
                      count: next.length,
                      byBureau: next.reduce(
                        (m, s) => ({ ...m, [s.candidate.bureau]: (m[s.candidate.bureau] ?? 0) + 1 }),
                        {} as Record<string, number>,
                      ),
                    },
                  });
                  const nextKeys = new Set(next.map((x) => x.key));
                  setEvidenceByCandidateId((prev) => {
                    const out: Record<string, string | undefined> = {};
                    for (const k of Object.keys(prev)) if (nextKeys.has(k)) out[k] = prev[k];
                    for (const s of next) {
                      if (!out[s.key] && s.prefillEvidenceId) out[s.key] = s.prefillEvidenceId;
                    }
                    return out;
                  });
                  setEvidenceIdsByCandidateId((prev) => {
                    const out: Record<string, string[]> = {};
                    for (const k of Object.keys(prev)) if (nextKeys.has(k)) out[k] = prev[k];
                    for (const s of next) {
                      if ((!out[s.key] || out[s.key].length === 0) && s.prefillEvidenceId) out[s.key] = [s.prefillEvidenceId];
                    }
                    return out;
                  });
                  setReasonsByCandidateId((prev) => {
                    const out: Record<string, string[]> = {};
                    for (const k of Object.keys(prev)) if (nextKeys.has(k)) out[k] = prev[k];
                    for (const s of next) {
                      if ((!out[s.key] || out[s.key].length === 0) && s.prefillReasons?.length) {
                        out[s.key] = s.prefillReasons.map((x) => x.trim()).filter(Boolean);
                      }
                    }
                    return out;
                  });
                  setAiNarrativeByCandidateKey((prev) => {
                    const out: Record<string, string> = {};
                    for (const k of Object.keys(prev)) if (nextKeys.has(k)) out[k] = prev[k] ?? '';
                    return out;
                  });
                  setAiQuestionsByBureau((prev) => {
                    const bureaus = new Set(next.map((x) => x.candidate.bureau));
                    const out: Partial<Record<Bureau, string[]>> = {};
                    for (const [k, v] of Object.entries(prev || {})) {
                      const b = k as Bureau;
                      if (!bureaus.has(b)) continue;
                      out[b] = Array.isArray(v) ? v : [];
                    }
                    return out;
                  });
                }}
              />

            <section id="fc-dispute-step-escalate">
              <LetterEscalationPanel track="bureau_dispute" accent="sky" />
            </section>
          </EntitlementGate>
        )}

        {tab === 'validation' && (
          <EntitlementGate
            partnerId={partner.id}
            requiredKeys={[ENTITLEMENT_KEYS.debt]}
            hideBillingCta={layout === 'embedded'}
            lockedActions={
              layout === 'embedded' && onRequestGrantEntitlements ? (
                <button
                  type="button"
                  onClick={() => onRequestGrantEntitlements([ENTITLEMENT_KEYS.debt])}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                >
                  Grant access
                </button>
              ) : null
            }
          >
            <DebtTrackEasyFlow
              track={debtTrack}
              steps={debtLetterPathSteps}
              onStep={runDebtLetterBuildStep}
              onContinue={runDebtLetterBuildContinue}
            >
            <ValidationCenterView
              {...debtCenterSharedProps}
              partner={partner}
              showPathSwitcher
              onSwitchToCourt={() => setTab('court')}
              onSwitchToBankruptcy={() => setTab('bankruptcy')}
              onBuildDraft={(specId) => buildDebtCenterDraft(specId, false)}
              onBuildCatalogDraft={(id) => buildCatalogDraft(id, 'validation')}
              generateBusy={generateBusy}
              generateError={draftErr}
            />
            </DebtTrackEasyFlow>
          </EntitlementGate>
        )}

        {tab === 'court' && (
          <EntitlementGate
            partnerId={partner.id}
            requiredKeys={[ENTITLEMENT_KEYS.debt]}
            hideBillingCta={layout === 'embedded'}
            lockedActions={
              layout === 'embedded' && onRequestGrantEntitlements ? (
                <button
                  type="button"
                  onClick={() => onRequestGrantEntitlements([ENTITLEMENT_KEYS.debt])}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                >
                  Grant access
                </button>
              ) : null
            }
          >
            <DebtTrackEasyFlow
              track={debtTrack}
              steps={debtLetterPathSteps}
              onStep={runDebtLetterBuildStep}
              onContinue={runDebtLetterBuildContinue}
              postCourtPlan={debtPostCourtPlan}
              postCourtDecided={debtPostCourtDecided}
              hideEscalationLadder={debtPostCourtPlan}
            >
            <AffidavitCourtCenterView
              {...debtCenterSharedProps}
              partner={partner}
              showPathSwitcher
              onSwitchToValidation={() => setTab('validation')}
              onSwitchToBankruptcy={() => setTab('bankruptcy')}
              onBuildDraft={(specId) => buildDebtCenterDraft(specId, true)}
              onBuildCatalogDraft={(id) => buildCatalogDraft(id, 'court')}
              generateBusy={generateBusy}
              generateError={draftErr}
              selectedSummonsDocId={selectedSummonsDocId}
              onSummonsDocChange={setSelectedSummonsDocId}
              summonsDocCount={processedDocuments.filter((d) => {
                const t = String(d.docType || '').toLowerCase();
                return t.includes('summons') || t.includes('complaint');
              }).length}
            />
            </DebtTrackEasyFlow>
          </EntitlementGate>
        )}

        {tab === 'foreclosure' && (
          <EntitlementGate
            partnerId={partner.id}
            requiredKeys={debtCenterMode ? [ENTITLEMENT_KEYS.debt] : [ENTITLEMENT_KEYS.letters]}
            hideBillingCta={layout === 'embedded'}
            lockedActions={
              onRequestGrantEntitlements ? (
                <button
                  type="button"
                  onClick={() =>
                    onRequestGrantEntitlements(
                      debtCenterMode
                        ? [ENTITLEMENT_KEYS.debt]
                        : [ENTITLEMENT_KEYS.letters, ENTITLEMENT_KEYS.packForeclosure],
                    )
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-400/40 bg-amber-500/15 hover:bg-amber-500/25 text-[10px] font-black uppercase tracking-widest text-amber-50 transition-all"
                >
                  Grant access
                </button>
              ) : null
            }
          >
            <DebtTrackEasyFlow
              track={debtTrack}
              steps={debtLetterPathSteps}
              onStep={runDebtLetterBuildStep}
              onContinue={runDebtLetterBuildContinue}
            >
            <ForeclosureCenterView
              {...debtCenterSharedProps}
              partner={partner}
              letterHub={debtCenterMode ? 'debt' : 'credit'}
              onSwitchToValidation={() => setTab('validation')}
              onSwitchToRepossession={() => setTab('repossession')}
              onBuildCatalogDraft={(id) => buildCatalogDraft(id, 'foreclosure')}
            />
            </DebtTrackEasyFlow>
          </EntitlementGate>
        )}

        {tab === 'repossession' && (
          <EntitlementGate
            partnerId={partner.id}
            requiredKeys={debtCenterMode ? [ENTITLEMENT_KEYS.debt] : [ENTITLEMENT_KEYS.letters]}
            hideBillingCta={layout === 'embedded'}
            lockedActions={
              onRequestGrantEntitlements ? (
                <button
                  type="button"
                  onClick={() =>
                    onRequestGrantEntitlements(
                      debtCenterMode
                        ? [ENTITLEMENT_KEYS.debt]
                        : [ENTITLEMENT_KEYS.letters, ENTITLEMENT_KEYS.packRepossession],
                    )
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-400/40 bg-amber-500/15 hover:bg-amber-500/25 text-[10px] font-black uppercase tracking-widest text-amber-50 transition-all"
                >
                  Grant access
                </button>
              ) : null
            }
          >
            <DebtTrackEasyFlow
              track={debtTrack}
              steps={debtLetterPathSteps}
              onStep={runDebtLetterBuildStep}
              onContinue={runDebtLetterBuildContinue}
            >
            <RepossessionCenterView
              {...debtCenterSharedProps}
              partner={partner}
              letterHub={debtCenterMode ? 'debt' : 'credit'}
              onSwitchToValidation={() => setTab('validation')}
              onSwitchToForeclosure={() => setTab('foreclosure')}
              onBuildCatalogDraft={(id) => buildCatalogDraft(id, 'repossession')}
            />
            </DebtTrackEasyFlow>
          </EntitlementGate>
        )}

        {tab === 'bankruptcy' && (
          <EntitlementGate
            partnerId={partner.id}
            requiredKeys={
              debtCenterMode
                ? [ENTITLEMENT_KEYS.debt]
                : [ENTITLEMENT_KEYS.disputes, ENTITLEMENT_KEYS.letters]
            }
            hideBillingCta={layout === 'embedded'}
            lockedActions={
              onRequestGrantEntitlements ? (
                <button
                  type="button"
                  onClick={() =>
                    onRequestGrantEntitlements(
                      debtCenterMode
                        ? [ENTITLEMENT_KEYS.debt]
                        : [ENTITLEMENT_KEYS.disputes, ENTITLEMENT_KEYS.letters, ENTITLEMENT_KEYS.packBankruptcy],
                    )
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-400/40 bg-amber-500/15 hover:bg-amber-500/25 text-[10px] font-black uppercase tracking-widest text-amber-50 transition-all"
                >
                  Grant access
                </button>
              ) : null
            }
          >
            <BankruptcyLetterStudioPanel
              partner={partner}
              showPathSwitcher
              onSwitchToValidation={() => setTab('validation')}
              onSwitchToCourt={() => setTab('court')}
              onSavedToVault={(letterId) => {
                setDraftNotice(`Saved to Letters Vault (${letterId.slice(0, 8)}…).`);
                openVault?.({ letterId });
              }}
            />
          </EntitlementGate>
        )}

        {tab === 'templates' && canSeeTemplates && (
          <EntitlementGate
            partnerId={partner.id}
            requiredKeys={[ENTITLEMENT_KEYS.templates]}
            hideBillingCta={layout === 'embedded'}
            lockedActions={
              layout === 'embedded' && onRequestGrantEntitlements ? (
                <button
                  type="button"
                  onClick={() => onRequestGrantEntitlements([ENTITLEMENT_KEYS.templates])}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                >
                  Grant access
                </button>
              ) : null
            }
          >
            <div className="space-y-6">
              <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-amber-50">Continue in Letter Studio</div>
                  <p className="text-sm text-white/65 mt-1">Pick a template here, then drop it into your active track — bureau, validation, or court.</p>
                </div>
                <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => setTab(templatesReturnTab)}>
                  Continue — {templatesReturnTab === 'dispute' ? 'Bureaus' : templatesReturnTab} <ChevronRight size={16} />
                </button>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-black/30 p-6 space-y-4">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Template browser</div>

                  <TemplatesVaultPanel
                    tenantId={partner.tenantId}
                    partnerId={partner.id}
                    variant={layout === 'embedded' ? 'admin' : 'partner'}
                    allowCreate={true}
                    allowEdit={layout === 'embedded'}
                    onUseText={(text, t) => {
                      setActiveVaultTemplate(t);
                      setTplText(text);
                    }}
                    onAttachFile={() => {
                      setTplSaveErr(null);
                      setTplSaveErr('To attach a file template as an enclosure, open Validation/Court and click â€œTemplatesâ€.');
                    }}
                  />

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Template</label>
                    <select
                      value={tplBaseId}
                      onChange={(e) => setTplBaseId(e.target.value)}
                      className="mt-2 w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                    >
                      {visibleTemplateBases.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title}
                        </option>
                      ))}
                    </select>
                    <div className="mt-2 text-[11px] text-white/40">{tplBase?.description}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Variant</label>
                      <select
                        value={tplVariantId}
                        onChange={(e) => setTplVariantId(e.target.value)}
                        className="mt-2 w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                      >
                        {TEMPLATE_VARIANTS.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Tone</label>
                      <select
                        value={tplTone}
                        onChange={(e) => setTplTone(e.target.value as TemplateTone)}
                        className="mt-2 w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                      >
                        {TEMPLATE_TONES.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Version</label>
                      <input
                        type="number"
                        min={1}
                        value={tplVersion}
                        onChange={(e) => setTplVersion(Math.max(1, Math.round(Number(e.target.value) || 1)))}
                        className="mt-2 w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Bureau</label>
                      <select
                        value={tplBureau}
                        onChange={(e) => setTplBureau(e.target.value as any)}
                        className="mt-2 w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                      >
                        <option value="EXP">Experian</option>
                        <option value="EQF">Equifax</option>
                        <option value="TUC">TransUnion (Trans)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Creditor name (optional)</label>
                    <input
                      value={tplCreditorName}
                      onChange={(e) => setTplCreditorName(e.target.value)}
                      className="mt-2 w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="e.g. ABC Collections"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Account reference (optional)</label>
                    <input
                      value={tplAccountRef}
                      onChange={(e) => setTplAccountRef(e.target.value)}
                      className="mt-2 w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="Last 4 / reference #"
                    />
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-white/[0.08] bg-black/30 p-6 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-white font-semibold">Editor</div>
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40">Save as</label>
                      <select
                        value={tplSaveType}
                        onChange={(e) => setTplSaveType(e.target.value as any)}
                        className="bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-white text-[11px]"
                      >
                        <option value="validation">Validation / DV</option>
                        <option value="court">Court / Affidavit</option>
                      </select>
                    </div>
                  </div>

                  <textarea
                    value={tplText}
                    onChange={(e) => setTplText(e.target.value)}
                    rows={16}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-2xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors text-sm font-mono"
                    placeholder="Pick a template to load textâ€¦"
                  />
                  <div className="text-[11px] text-white/40">
                    {activeVaultTemplate ? (
                      <span>
                        Loaded from saved template: <span className="text-white/70 font-semibold">{activeVaultTemplate.title}</span>. You can edit below.
                      </span>
                    ) : (
                      <span>Edit the template text, preview it on paper, then save it into your Letters Vault.</span>
                    )}
                  </div>

                  {tplSaveErr ? (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200/90 text-sm">{tplSaveErr}</div>
                  ) : null}

                  <button
                    type="button"
                    disabled={!tplRendered || tplSaveBusy || !tplText.trim()}
                    onClick={async () => {
                      if (!tplRendered) return;
                      if (!tplText.trim()) return;
                      setTplSaveErr(null);
                      setTplSaveBusy(true);
                      try {
                        const createdAt = new Date().toISOString();
                        const pdf = await generateTextPdfToVault({
                          text: tplText,
                          filename: `FinelyCred_Template_${tplSaveType}_${safePartnerName(partner.profile.fullName)}_${today}.pdf`,
                          meta: { partnerId: partner.id, type: tplSaveType },
                        });

                        upsertLetter({
                          id: newId('letter'),
                          partnerId: partner.id,
                          type: tplSaveType,
                          title: `${tplRendered.title} â€¢ template`,
                          createdAt,
                          body: `<pre style="white-space:pre-wrap;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono','Courier New', monospace;">${tplText
                            .replaceAll('&', '&amp;')
                            .replaceAll('<', '&lt;')
                            .replaceAll('>', '&gt;')}</pre>`,
                          status: 'generated',
                          pdfBlobRef: pdf.pdfBlobRef ?? undefined,
                          pdfFilename: pdf.filename,
                          meta: {
                            context: 'template',
                            templateBaseId: tplRendered.baseId,
                            templateVariantId: tplRendered.variantId,
                            templateTone: tplRendered.tone,
                            templateVersion: tplRendered.version,
                            templateCategory: tplRendered.category,
                          },
                        });

                        openVault();
                      } catch (e: any) {
                        setTplSaveErr(e?.message || 'Failed to save template letter.');
                      } finally {
                        setTplSaveBusy(false);
                      }
                    }}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {tplSaveBusy ? 'Savingâ€¦' : 'Save to Letters Vault'} <ChevronRight size={16} />
                  </button>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-black/30 p-6 space-y-3">
                  <div className="text-white font-semibold">Paper preview</div>
                  <div className="rounded-2xl border border-white/[0.08] bg-white p-6 shadow-inner">
                    <pre className="text-black text-[12px] leading-5 whitespace-pre-wrap font-serif">{tplText}</pre>
                  </div>
                  <div className="text-[11px] text-white/40">Preview is forced to black-on-white for readability (matches print/PDF output).</div>
                </div>
              </div>
            </div>
          </EntitlementGate>
        )}
      </div>

      {reasonsLibraryOpen && partner ? (
        <DisputeReasonsLibraryPanel
          commandHub
          open={reasonsLibraryOpen}
          partnerId={partner.id}
          onClose={() => setReasonsLibraryOpen(false)}
          onApplyReason={(text) => {
            void navigator.clipboard?.writeText(text);
            setReasonsLibraryOpen(false);
            setReturnNotice('Reason copied from Reasons OS â€” paste into the active dispute item.');
          }}
        />
      ) : null}
    </>
  );

  if (layout === 'embedded' || unifiedShell) return main;

  return (
    <PageShell
      badge="Partner Portal"
      title="Letter Studio"
      subtitle="Pick context â†’ build a draft â†’ edit â†’ paper preview â†’ save to Letters Vault."
    >
      {main}
    </PageShell>
  );
}

