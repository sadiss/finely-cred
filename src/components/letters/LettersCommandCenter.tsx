import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, ExternalLink, FileText, Gavel, Lock, PenLine, Scale, ScrollText, ShieldAlert, Sparkles, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Bureau, ParsedCreditReport } from '../../domain/creditReports';
import type { Partner } from '../../domain/partners';
import { PageShell } from '../layout/PageShell';
import { listReportsByPartner } from '../../data/reportsRepo';
import { listEvidenceByPartner, upsertEvidence, deleteEvidence } from '../../data/evidenceRepo';
import { EvidencePickerModal } from '../evidence/EvidencePickerModal';
import { deriveTradelineContradictions, getDisputeReasonsLibraryAsText, suggestDisputeReasons, suggestDisputeReasonsForCandidate } from '../../creditReports/disputeReasons';
import { buildEnrichedReasonsForCandidate, buildCaseContextBlock } from '../../lib/disputeLetterBuilder';
import { filterFactualDisputeReasons, pickBestDisputeReasons } from '../../creditReports/disputeFactualReasons';
import { buildDisputeReasonsWithAi } from '../../lib/disputeReasonAi';
import { DisputeReasonsLibraryPanel } from './DisputeReasonsLibraryPanel';
import { downloadInlineDisputeLetterPdf, type DisputeLetterItem } from '../../letters/generateDisputePdfInline';
import { upsertLetter } from '../../data/lettersRepo';
import { addAuditEvent } from '../../data/auditRepo';
import { newId } from '../../utils/ids';
import { addRoundToCase, createDisputeCase, getCase, listCasesByPartner } from '../../data/casesRepo';
import { suggestNextRound } from '../../domain/disputeWorkflow';
import { addDaysIso, candidateToCaseItem, nowIso } from '../../domain/cases';
import { createTask, listTasksByPartner } from '../../data/tasksRepo';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { hasEntitlement } from '../../data/billingRepo';
import { listDebtByPartner } from '../../data/debtRepo';
import { DEBT_LETTER_SPECS, SCENARIO_RECOMMENDATIONS, recommendScenarioFromDebt, getLetterBody } from '../../legal/debtLetterTemplates';
import type { DebtLetterType, DebtScenario } from '../../domain/debtLegal';
import { EntitlementGate } from '../billing/EntitlementGate';
import { generateTextPdfToVault } from '../../letters/generateTextPdf';
import { TEMPLATE_BASES } from '../../templates';
import { TEMPLATE_VARIANTS, TEMPLATE_TONES } from '../../templates/variants';
import type { TemplateTone, TemplateVariantRecipe } from '../../domain/templates';
import { renderTemplate } from '../../templates/render';
import { DisputePickerModal, type SelectedDispute } from '../disputes/DisputePickerModal';
import { rankEvidenceMatches, scoreEvidenceForAccount } from '../../utils/evidenceMatch';
import {
  clearLettersCommandCenterDraft,
  loadLettersCommandCenterDraft,
  saveLettersCommandCenterDraft,
} from '../../data/lettersCommandCenterDraftRepo';
import { TemplatesVaultPanel } from '../templates/TemplatesVaultPanel';
import type { TemplateVaultItem } from '../../domain/templateVault';
import { createTemplateVaultItem, defaultRequiredEntitlementsForCategory, getTemplateVaultItem } from '../../data/templateVaultRepo';
import { readActiveTemplateIdFromSession } from '../templates/TemplateLibraryHub';
import { LetterStudioDisputeRail, type DisputeRailItem } from './LetterStudioDisputeRail';
import { bureauDisputeAddress, SUBJECT_LINE } from '../../letters/disputeLetterTemplate';
import { getBlobUrl } from '../../storage/getBlobUrl';
import { openBlobRefInNewTab } from '../../lib/openBlobRef';
import { downloadBlob, downloadText, openUrlInNewTab, triggerBrowserDownload } from '../../utils/download';
import { RichTextEditor } from '../ui/RichTextEditor';
import { htmlToPlainText, isProbablyHtml, plainTextToHtml, sanitizeHtmlForPreview } from '../../utils/richText';
import { callAiGateway } from '../../lib/aiClient';
import { extractFirstJsonObject } from '../../utils/jsonExtract';
import { canUseAiDraft } from '../../billing/aiDraftAccess';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { classifyCandidateNegativeType, NEGATIVE_PLAYBOOKS, type NegativeType } from '../../creditReports/negativePlaybooks';
import { letterCategoryForCandidate } from '../../creditReports/letterCategory';
import { getCustomFieldValues } from '../../data/customFieldValuesRepo';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import { injectPrintSafeCss } from './paperPreviewSrcDoc';
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
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

const LCC_AI_DRAFT_BTN =
  'inline-flex items-center gap-2 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-fuchsia-100 hover:bg-fuchsia-500/15 transition-all disabled:opacity-60 disabled:cursor-not-allowed';

const LCC_AI_DRAFT_BTN_SM =
  'inline-flex items-center gap-2 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-fuchsia-100 hover:bg-fuchsia-500/15 transition-all disabled:opacity-60';

const LCC_MODAL_SHELL = `${finelyOsCatalogCard('violet')} !p-0 overflow-hidden shadow-2xl flex flex-col`;

export type LettersStudioTab = 'dispute' | 'validation' | 'court' | 'templates';
type TabKey = LettersStudioTab;
type LetterTone = 'formal' | 'neutral' | 'conversational';
type LetterRound = 'Round 1' | 'Round 2' | 'Round 3';

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

  const senderName = (args.sender?.name || '').trim() || '—';
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
      const reasons = (it.reasons ?? []).map((r) => r.trim()).filter(Boolean);
      const narrative = (it.narrative || '').trim();
      const evName = (it.evidence?.filename || '').trim();
      return `
        <div style="margin-top:12px;padding:12px;border:1px solid rgba(255,255,255,0.08);border-radius:14px;background:rgba(255,255,255,0.02)">
          <div style="font-weight:700;color:#fff">${idx + 1}. ${esc(it.candidate.account)} — ${esc(it.candidate.type)}</div>
          <div style="margin-top:4px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.45);font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono','Courier New', monospace;">
            bureau: ${esc(bureauShortCode(it.candidate.bureau as any))} • code: ${esc(it.candidate.code)} • request: ${esc(it.candidate.status)}
          </div>
          ${
            evName
              ? `<div style="margin-top:8px;color:rgba(255,255,255,0.7);font-size:12px">
                   Evidence: <span style="color:rgba(255,255,255,0.85);font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono','Courier New', monospace;">${esc(evName)}</span>
                 </div>`
              : ''
          }
          ${
            reasons.length
              ? `<div style="margin-top:8px;color:rgba(255,255,255,0.7);font-size:12px">Reasons:</div>
                 <ul style="margin-top:6px;color:rgba(255,255,255,0.75);font-size:12px;line-height:1.6">
                   ${reasons.map((r) => `<li>${esc(r)}</li>`).join('')}
                 </ul>`
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
        ${esc(bureauShortCode(args.bureau))} • ${esc(args.round)} • ${esc(args.tone)}
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

function defaultDisputeIntro(tone: LetterTone) {
  if (tone === 'formal') {
    return `TO WHOM IT MAY CONCERN,\n\nI am writing to dispute inaccurate and/or unverified information appearing on my credit file. This letter applies only to the items listed below.\n\nPlease investigate and provide written results. If any item cannot be verified as reported with competent evidence, it must be deleted or corrected.`;
  }
  if (tone === 'conversational') {
    return `Hello,\n\nI’m reaching out because several items still look inaccurate or incomplete on my credit file. This letter applies only to the items listed below.\n\nPlease reinvestigate and send me the results in writing. If an item can’t be verified, please delete or correct it.`;
  }
  return `Hello,\n\nI’m following up to dispute inaccurate and/or unverified information on my credit file. This letter applies only to the items listed below.\n\nPlease reinvestigate and provide written results. If verification cannot be produced, the item must be deleted or corrected.`;
}

function defaultDisputeFooter(tone: LetterTone) {
  if (tone === 'formal') {
    return (
      `Please complete your reinvestigation and provide the results in writing within the time period required by applicable law (typically 30 days). ` +
      `If you verify any item, please provide the method of verification and a complete description of the procedures used to determine accuracy.\n\n` +
      `I also request that you do not sell, share, or disclose my personal information beyond what is required to conduct this reinvestigation, ` +
      `and that you honor any applicable opt-out preferences. Please communicate results in writing.`
    );
  }
  if (tone === 'conversational') {
    return (
      `Please send me the results in writing within the time period required by law (typically 30 days). ` +
      `If you say an item is verified, please tell me how you verified it.\n\n` +
      `Also, please don’t share or sell my personal information beyond what’s required to complete this investigation.`
    );
  }
  return (
    `Please complete your reinvestigation and provide the results in writing within the time period required by applicable law (typically 30 days). ` +
    `If you verify any item, please provide the method of verification.\n\n` +
    `Please do not sell or share my personal information beyond what is required to conduct this reinvestigation.`
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
            {isSpread && rightPageIndex < pageCount ? `–${rightPageIndex + 1}` : ''} / {pageCount}
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
                      const reasons = (it.reasons ?? []).map((r) => r.trim()).filter(Boolean);
                      const img = imgByKey[key]?.url || '';
                      return (
                        <div key={key} className="space-y-2">
                          <div className="font-semibold">
                            {idx + 1}. {it.candidate.account} — {it.candidate.type}
                          </div>
                          <div className="text-[11px] text-black/60">
                            bureau: {bureauShortCode(it.candidate.bureau)} • legal basis: {it.candidate.code} • request: {it.candidate.status}
                          </div>
                          <div className="text-[11px] text-black/60">
                            evidence: <span className="font-semibold text-black/80">{it.evidence?.filename || '—'}</span>
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

                          <div className="text-[11px] font-semibold">Dispute reasons:</div>
                          {reasons.length ? (
                            <ul className="list-disc pl-5 text-[12px] leading-5">
                              {reasons.map((r, ri) => (
                                <li key={ri}>{r}</li>
                              ))}
                            </ul>
                          ) : (
                            <div className="text-[11px] text-black/50">No reasons selected for this item.</div>
                          )}

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
                    <div className="pt-2 text-[10px] uppercase tracking-widest text-black/40">Continued on next page…</div>
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
  onOpenFull,
  iframeHeightClassName = 'h-[720px]',
}: {
  bureau: Bureau;
  partnerName: string;
  sender?: { name?: string; addressLine1?: string; addressLine2?: string; cityStateZip?: string };
  bureauAddress?: { name: string; lines: string[] };
  subjectLine?: string;
  introHtml: string;
  footerHtml: string;
  items: DisputeLetterItem[];
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
    const senderName = (sender?.name || '').trim() || partnerName;
    const senderLines = [senderName, sender?.addressLine1, sender?.addressLine2, sender?.cityStateZip]
      .map((x) => String(x || '').trim())
      .filter(Boolean);
    const bureauAddr = bureauAddress ?? bureauDisputeAddress(bureau);
    const headerDate = new Date().toLocaleDateString();
    const subject = (subjectLine || '').trim() || SUBJECT_LINE;

    const body = `
      <div class="page">
        <div class="header">
          <div class="right">
            ${senderLines.map((l) => `<div>${escText(l)}</div>`).join('')}
            <div>${escText(headerDate)}</div>
          </div>
        </div>

        <div class="addr">
          <div class="bureau">${escText(bureauAddr.name)}</div>
          ${bureauAddr.lines.map((l) => `<div>${escText(l)}</div>`).join('')}
        </div>

        <div class="subject">${escText(subject)}</div>

        <div class="prose">${sanitizeHtmlForPreview(introHtml || '')}</div>

        <div class="items">
          ${items
            .map((it, idx) => {
              const key = it.candidate.id || it.candidate.account;
              const img = imgByKey[key]?.url || '';
              const reasons = (it.reasons ?? []).map((r) => String(r || '').trim()).filter(Boolean);
              const narrative = String(it.narrative || '').trim();
              return `
                <div class="item">
                  <div class="itemTitle">${idx + 1}. ${escText(it.candidate.account)} — ${escText(it.candidate.type)}</div>
                  <div class="meta">bureau code: ${escText(it.candidate.bureau)} • legal basis: ${escText(it.candidate.code)} • request: ${escText(it.candidate.status)}</div>
                  <div class="meta">evidence: <strong>${escText(it.evidence?.filename || '—')}</strong></div>
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
      .subject{margin-top:18px;font-weight:700;font-size:12px}
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
    `.trim();

    return injectPrintSafeCss({ html: body, extraCss });
  }, [bureau, bureauAddress, footerHtml, imgByKey, introHtml, items, partnerName, sender, subjectLine]);

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
      <div className="rounded-2xl border border-white/15 bg-white overflow-hidden shadow-lg">
        <div className="p-3 md:p-4 bg-white">
          <iframe
            title="Letter preview"
            srcDoc={srcDoc}
            className={`w-full ${iframeHeightClassName} rounded-xl border border-black/10 bg-white`}
          />
        </div>
      </div>
      <div className="text-[11px] text-white/40">Preview is print-safe (forced black-on-white) and matches the saved PDF output.</div>
    </div>
  );
}

function InlineEvidenceThumb({ blobRef, mimeType, alt }: { blobRef: string; mimeType?: string; alt: string }) {
  const [url, setUrl] = useState<string>('');
  const [revoke, setRevoke] = useState<null | (() => void)>(null);

  useEffect(() => {
    let alive = true;
    setUrl('');
    try {
      revoke?.();
    } catch {
      // ignore
    }
    setRevoke(null);

    const run = async () => {
      const res = await getBlobUrl(blobRef, { mimeType, preferSigned: true });
      if (!alive) {
        res?.revoke?.();
        return;
      }
      if (!res?.url) return;
      setUrl(res.url);
      setRevoke(res.revoke ?? null);
    };
    void run();

    return () => {
      alive = false;
      try {
        revoke?.();
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blobRef, mimeType]);

  if (!url) return null;
  return (
    <img
      src={url}
      alt={alt}
      className="h-24 w-40 rounded-2xl border border-white/[0.08] bg-white object-contain cursor-pointer"
      title="Click to open full-size"
      onClick={(e) => {
        e.stopPropagation();
        // Important: open a *fresh* URL so it stays valid even if this thumbnail unmounts.
        // (Object URLs can go blank if revoked on component cleanup.)
        void (async () => {
          try {
            const result = await openBlobRefInNewTab({ blobRef, mimeType, preferSigned: true });
            if (!result.ok) {
              window.alert(result.message);
            }
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
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [internalTab, setInternalTab] = useState<TabKey>('dispute');
  const tab = activeTab ?? internalTab;
  const setTab = (next: TabKey) => {
    if (onTabChange) onTabChange(next);
    else setInternalTab(next);
  };
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

  const canUseLetters = useMemo(() => {
    // Admin embedded context should not be blocked by partner plan.
    if (layout === 'embedded') return true;
    return hasEntitlement(partner.id, ENTITLEMENT_KEYS.letters);
  }, [layout, partner.id, storeVersion]);

  // --- Dispute letter flow (multi-bureau, split per bureau) ---
  const reports = useMemo(() => (partner ? listReportsByPartner(partner.id) : []), [partner]);
  const disputeCases = useMemo(() => (partner ? listCasesByPartner(partner.id) : []), [partner, storeVersion]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedDisputes, setSelectedDisputes] = useState<SelectedDispute[]>([]);
  const [evidenceByCandidateId, setEvidenceByCandidateId] = useState<Record<string, string | undefined>>({});
  const [reasonsByCandidateId, setReasonsByCandidateId] = useState<Record<string, string[]>>({});
  const [reasonsLibraryOpen, setReasonsLibraryOpen] = useState(false);
  const [reasonLibraryFocusKey, setReasonLibraryFocusKey] = useState<string | null>(null);
  const [evidencePicker, setEvidencePicker] = useState<null | { candidateId?: string }>(null);
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
  const [studioOpenByBureau, setStudioOpenByBureau] = useState<Record<Bureau, boolean>>({ EXP: true, EQF: true, TUC: true });
  // Collapsible live letter preview (default hidden so the focused-item editor is
  // front-and-center and the preview doesn't bury it). The "Full preview" modal
  // remains available for the large view.
  const [previewOpen, setPreviewOpen] = useState(true);
  const [letterRailCollapsed, setLetterRailCollapsed] = useState(true);
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
    // This matches user intent: only prompt “save vs save+download” for non-package users.
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

  const openVault = (args?: { letterId?: string }) => {
    if (onOpenVault) return onOpenVault(args);
    const to = args?.letterId ? `/portal/letters/vault?letterId=${encodeURIComponent(args.letterId)}` : '/portal/letters/vault';
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
    setReasonsByCandidateId({});
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
      setAiErrByBureau((prev) => ({ ...prev, [b]: 'AI drafting is currently disabled in Settings (Feature Flags → AI Gateway).' }));
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
          maxReasons: 8,
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
        evidenceAttached: Boolean(evidenceByCandidateId[s.key]),
        caseContext: buildCaseContextBlock({
          candidate: s.candidate as any,
          parsed,
          bureau: b,
          round,
          reasons: enrichedReasons,
        }),
        });
      });

      const system = `You are a credit dispute letter drafter. Dispute REASONS must be factual findings — what is reporting on the file — not commands to the bureau.

Return ONLY valid JSON (no markdown). Schema:
{
  "intro": string,
  "items": [{"key": string, "narrative": string}],
  "questions": string[]
}

WRITING STANDARD:
- For EACH item narrative: use SELECTED_REASONS and DETECTED_ISSUES as first-person factual statements (creditor name, status line, balance, dates, payment-grid codes, cross-bureau differences). Quote field values when provided in ACCOUNT_FACTS.
- NEVER rewrite reasons as bureau commands ("please verify", "please delete", "pursuant to", "method of verification", "demand reinvestigation"). Those belong in the letter closing, not in per-item reasons.
- PLAYBOOK_HINT is internal strategy context only — do not paste command-style language from it.
- Use ONLY provided facts. NEVER invent balances, dates, account numbers, or legal citations. Use [BRACKET] placeholders when facts are missing and add to "questions".
- If EVIDENCE_ATTACHED is yes, note the exhibit supports the factual discrepancy described.
- Round ${round}: if Round 2+, note prior dispute and that the same inaccurate fields still report — still as factual statements, not demands.
- Each item narrative: 4-8 sentences listing the specific negatives and contradictions on the file for this account.
- intro: 2-4 paragraphs matching TONE; identify yourself, scope (items below), and that you dispute the accuracy of the reporting shown — save procedural closing language for standard letter footers.
- questions: only genuine gaps that would strengthen factual findings.`;

      const user = `DRAFT A BUREAU DISPUTE LETTER.\n\nBUREAU: ${b}\nROUND: ${round}\nTONE: ${tone}\nCONSUMER_NAME: ${partnerName}\nSTATE: ${state || '[STATE]'}\n\nDISPUTE_ITEMS (keyed):\n${payloadItems
        .map((it) => {
          const reasons = it.reasons.length ? it.reasons.map((r) => `- ${r}`).join('\n') : '- (none selected)';
          const issues = it.contradictions.length ? it.contradictions.map((r) => `- ${r}`).join('\n') : '- (none auto-detected)';
          return `KEY: ${it.key}\nACCOUNT: ${it.account}\nTYPE: ${it.type}\nNEGATIVE_TYPE: ${it.negativeType}\nPLAYBOOK_HINT: ${it.playbookHint}\nREQUEST: ${it.request}\nLEGAL_BASIS_LABEL: ${it.legalBasis}\nACCOUNT_FACTS: ${it.facts || '(not parsed)'}\nDETECTED_ISSUES:\n${issues}\nEVIDENCE_ATTACHED: ${it.evidenceAttached ? 'yes (a screenshot exhibit is attached for this item)' : 'no'}\nSELECTED_REASONS (factual — use verbatim in narrative):\n${reasons}\nCASE_CONTEXT:\n${it.caseContext}\n`;
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
        setIntroByBureau((prev) => ({ ...prev, [b]: ensureHtmlDraft(intro) }));
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
      setDraftErr('AI drafting is currently disabled in Settings (Feature Flags → AI Gateway).');
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
      const debtName = debt?.name || 'Creditor / Collector';
      const jurisdictionState = String((debt as any)?.stateJurisdiction || '').toUpperCase() || '';
      const caseNumber = String((debt as any)?.courtCaseNumber || '').trim() || '';

      const legalBasis = spec?.legalBasis?.map((c) => `${c.shortName} (${c.cite}): ${c.description}`).join('\n') ?? '';

      const system = `You draft print-ready consumer debt/legal letters. Return ONLY the letter body text (no JSON, no markdown).\n\nRules:\n- Do not invent facts (amounts, dates, account numbers, court deadlines). If missing, use placeholders like [DATE], [ACCOUNT_REF], [CASE_NUMBER], [STATE], [AMOUNT], [LAST_PAYMENT_DATE].\n- Keep it firm and professional. Avoid giving legal advice.\n- If citations are provided below, you may reference them, but do not add new citations that are not provided.\n`;

      const user = `DRAFT A LETTER.\n\nLETTER_TYPE: ${draft.type}\nSPEC: ${spec?.title || draft.specId}\nSCENARIO: ${String(recommendedScenario || 'unknown')}\nDEBT_CASE_NAME: ${debtName}\nSTATE: ${jurisdictionState || '[STATE]'}\nCASE_NUMBER: ${caseNumber || '[CASE_NUMBER]'}\nDEBT_TYPE: ${String((debt as any)?.type || '')}\n\nKEY_PRINCIPLE:\n${spec?.keyPrinciple || ''}\n\nWHEN_TO_USE:\n${(spec?.whenToUse || []).map((x) => `- ${x}`).join('\n')}\n\nLEGAL_BASIS:\n${legalBasis || '(none provided)'}\n\nOUTPUT:\n- Provide the body text only.\n- Include a short section that lists what documents you’re requesting (if applicable).\n- If this is a court/affidavit draft, keep it structured and include placeholders for jurisdiction-specific filings.`;

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
      setPdfErr(`Select disputes for ${bureauShortCode(b)} first — click "Select disputes" or open the picker.`);
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
      const introText = htmlToPlainText(introHtml || '');

    setPdfErr(null);
    setPdfBusyByBureau((prev) => ({ ...prev, [b]: true }));
    try {
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
        const aiRes = await buildDisputeReasonsWithAi({
          candidate: s.candidate as any,
          parsed,
          existing: cur,
          maxReasons: 12,
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

      const disputeItems: DisputeLetterItem[] = items.map((s) => {
        const evId = evidenceByCandidateId[s.key];
        const ev = evId ? evidence.find((x) => x.id === evId) : null;
        return {
          candidate: { ...s.candidate, id: s.key },
          evidence: ev ? { filename: ev.filename, blobRef: ev.blobRef, mimeType: ev.mimeType } : null,
          reasons: autoFilledReasonsByCandidateId[s.key] ?? [],
          narrative: (aiNarrativeByCandidateKey[s.key] || '').trim() || null,
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
        title: `Dispute letter • ${bureauShortCode(b)} • ${round}`,
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
              ? `${disputeItems[0]!.candidate.account} — ${disputeItems[0]!.candidate.type}`
              : `Dispute • ${bureauShortCode(b)} • ${disputeItems.length} items`,
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
      setAiNarrativeByCandidateKey((prev) => {
        const out = { ...prev };
        for (const k of Object.keys(out)) if (clearedKeys.has(k)) delete out[k];
        return out;
      });
      setFocusedKeyByBureau((prev) => ({ ...prev, [b]: null }));

      openVault({ letterId: letter.id });
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
    const roundParam = new URLSearchParams(location.search).get('round') as LetterRound | null;
    const suggested = suggestNextRound(c);
    const nextRound =
      roundParam === 'Round 1' || roundParam === 'Round 2' || roundParam === 'Round 3' ? roundParam : suggested;
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
    setReasonsByCandidateId(pickMap(draft.reasonsByCandidateId) as any);
    if (draft.aiNarrativeByCandidateKey) setAiNarrativeByCandidateKey(pickMap(draft.aiNarrativeByCandidateKey) as any);
    if (draft.aiQuestionsByBureau) setAiQuestionsByBureau(draft.aiQuestionsByBureau as any);
    if (draft.toneByBureau) setToneByBureau((prev) => ({ ...prev, ...(draft.toneByBureau as any) }));
    if (draft.roundByBureau) setRoundByBureau((prev) => ({ ...prev, ...(draft.roundByBureau as any) }));
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

  // In PartnerDetailPage, LettersCommandCenter is mounted as layout="embedded".
  // Auto-save is only needed in the standalone portal flow.
  if (layout === 'embedded') return;

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
    reasonsByCandidateId: cleanRecord(reasonsByCandidateId),
    aiNarrativeByCandidateKey: cleanStringRecord(aiNarrativeByCandidateKey),
    aiQuestionsByBureau: cleanRecord(aiQuestionsByBureau as any),
    toneByBureau: toneByBureau as any,
    roundByBureau: roundByBureau as any,
    introByBureau,
    footerByBureau,
    sender: hasSender ? sender : undefined,
    subjectLineByBureau: subjectOverrides,
    bureauAddressByBureau: bureauAddressOverrides as any,
  };

  const hasAnything =
    selectedDisputes.length > 0 ||
    Object.keys(draftPayload.evidenceByCandidateId).length > 0 ||
    Object.keys(draftPayload.reasonsByCandidateId).length > 0 ||
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

    saveLettersCommandCenterDraft(partner.id, draftPayload);
    lastSavedDraftJsonRef.current = draftJson;
  }, 500);

  return () => window.clearTimeout(t);
}, [
  partner?.id,
  layout,
  selectedDisputes,
  evidenceByCandidateId,
  reasonsByCandidateId,
  aiNarrativeByCandidateKey,
  aiQuestionsByBureau,
  toneByBureau,
  roundByBureau,
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

  const disputeRailItems = useMemo((): DisputeRailItem[] => {
    const out: DisputeRailItem[] = [];
    for (const b of ['EXP', 'EQF', 'TUC'] as Bureau[]) {
      for (const s of selectedByBureau[b] ?? []) {
        out.push({
          key: s.key,
          bureau: b,
          account: s.candidate.account,
          type: s.candidate.type,
          code: s.candidate.code,
          hasEvidence: Boolean(evidenceByCandidateId[s.key]),
          reasonCount: (reasonsByCandidateId[s.key] ?? []).filter(Boolean).length,
        });
      }
    }
    return out;
  }, [selectedByBureau, evidenceByCandidateId, reasonsByCandidateId]);

  const disputeCountsByBureau = useMemo(
    () =>
      ({
        EXP: selectedByBureau.EXP.length,
        EQF: selectedByBureau.EQF.length,
        TUC: selectedByBureau.TUC.length,
      }) as Record<Bureau, number>,
    [selectedByBureau],
  );

  useEffect(() => {
    if (!selectedDisputes.length) return;
    if ((selectedByBureau[workspaceBureau] ?? []).length > 0) return;
    const next = (['EXP', 'EQF', 'TUC'] as Bureau[]).find((b) => (selectedByBureau[b] ?? []).length > 0);
    if (next) setWorkspaceBureau(next);
  }, [selectedDisputes.length, selectedByBureau, workspaceBureau]);

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
        maxReasons: 12,
      });
      m[s.key] = texts.map((text, idx) => ({ id: `${s.key}_${idx}`, text }));
    }
    return m;
  }, [selectedDisputes, parsedByReportId]);

  // --- Validation/Court letter flow (Debt module) ---
  const debtCases = useMemo(() => (partner ? listDebtByPartner(partner.id) : []), [partner]);
  const [debtId, setDebtId] = useState<string>(debtCases[0]?.id ?? '');
  const debt = useMemo(() => debtCases.find((d) => d.id === debtId) ?? null, [debtCases, debtId]);
  const recommendedScenario = useMemo(() => (debt ? recommendScenarioFromDebt(debt as any) : 'unknown'), [debt]);

  const creditorContacts = useMemo(() => {
    const out: Array<{ creditorName: string; address?: string; phone?: string }> = [];
    for (const r of reports) {
      const parsed = (r as any)?.parsed as any;
      const contacts = Array.isArray(parsed?.creditorContacts) ? parsed.creditorContacts : [];
      for (const c of contacts) {
        const name = String(c?.creditorName || '').trim();
        if (!name) continue;
        out.push({ creditorName: name, address: String(c?.address || '').trim() || undefined, phone: String(c?.phone || '').trim() || undefined });
      }
    }
    // De-dupe by normalized name + address (best effort).
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const uniq = new Map<string, (typeof out)[number]>();
    for (const c of out) {
      const key = `${norm(c.creditorName)}|${norm(c.address || '')}`;
      if (!uniq.has(key)) uniq.set(key, c);
    }
    return Array.from(uniq.values()).slice(0, 200);
  }, [reports.length, storeVersion]);

  const matchedCreditorContact = useMemo(() => {
    if (!debt?.name) return null;
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const target = norm(debt.name);
    if (!target) return null;
    // Prefer exact-ish matches.
    const exact = creditorContacts.find((c) => norm(c.creditorName) === target) ?? null;
    if (exact) return exact;
    // Fallback: contains match (handles "ABC Collections, LLC" vs "ABC Collections").
    return creditorContacts.find((c) => norm(c.creditorName).includes(target) || target.includes(norm(c.creditorName))) ?? null;
  }, [debt?.id, debt?.name, creditorContacts]);

  const today = new Date().toISOString().slice(0, 10);

  const tenantId = safeText((partner as any)?.tenantId) || FINELY_TENANT_ID;
  const partnerCf = useMemo(() => getCustomFieldValues('partners', partner.id, tenantId), [partner.id, tenantId]);

  const canonicalIdentity = useMemo(() => {
    const pi = (reports[0] as any)?.parsed?.personalInfo ?? null;
    return getCanonicalPartnerIdentity({ partner, tenantId, partnerCf, reportPersonalInfo: pi });
  }, [partner, partnerCf?.updatedAt, reports.length, tenantId]);

  // Default sender fields from canonical identity (but do not clobber user edits).
  useEffect(() => {
    setSenderName((prev) => (prev.trim() ? prev : canonicalIdentity.fullName || partner.profile.fullName || ''));
    setSenderAddressLine1((prev) => (prev.trim() ? prev : canonicalIdentity.address1 || canonicalIdentity.addressLine1 || ''));
    setSenderAddressLine2((prev) => (prev.trim() ? prev : canonicalIdentity.address2 || ''));
    setSenderCityStateZip((prev) => (prev.trim() ? prev : canonicalIdentity.cityStateZip || ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canonicalIdentity.fullName, canonicalIdentity.address1, canonicalIdentity.address2, canonicalIdentity.addressLine1, canonicalIdentity.cityStateZip, partner.profile.fullName]);

  const [draft, setDraft] = useState<null | { type: 'validation' | 'court'; specId: DebtLetterType; html: string; evidenceId?: string }>(null);
  const [draftBusy, setDraftBusy] = useState(false);
  const [draftErr, setDraftErr] = useState<string | null>(null);
  const [draftEvidencePickerOpen, setDraftEvidencePickerOpen] = useState(false);
  const [draftTemplatesOpen, setDraftTemplatesOpen] = useState(false);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);
  const [draftPreviewFull, setDraftPreviewFull] = useState(false);

  useEffect(() => {
    setDraftPreviewFull(false);
  }, [draft?.type, (draft as any)?.specId]);

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

  const tabKeys: Array<{ key: TabKey; label: string; icon: React.ReactNode; hidden?: boolean }> = [
    { key: 'dispute', label: 'Dispute', icon: <Gavel size={12} className="inline mr-2" /> },
    { key: 'validation', label: 'Validation / DV', icon: <ShieldAlert size={12} className="inline mr-2" /> },
    { key: 'court', label: 'Court / Affidavit', icon: <Scale size={12} className="inline mr-2" /> },
    { key: 'templates', label: 'Templates', icon: <ScrollText size={12} className="inline mr-2" />, hidden: !canSeeTemplates },
  ];

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

  const main = (
    <>
      {/* Full paper preview modal (templates-style iframe) */}
      {previewModalBureau ? (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
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
                    iframeHeightClassName="h-[58vh] md:h-[66vh] lg:h-[70vh]"
                  />
                );
              })()}
            </div>
          </div>
        </div>
      ) : null}

      {/* Evidence picker for dispute items */}
      {partner && evidencePicker && (
        <EvidencePickerModal
          open={Boolean(evidencePicker)}
          title={evidencePicker.candidateId ? 'Attach screenshot' : 'Screenshot vault'}
          subtitle={
            evidencePickerCandidate
              ? `Choose a screenshot for ${evidencePickerCandidate.candidate.account}.`
              : 'Choose a screenshot to attach (or upload a new one).'
          }
          partnerId={partner.id}
          items={evidencePickerItems}
          selectedEvidenceId={evidencePicker.candidateId ? evidenceByCandidateId[evidencePicker.candidateId] : undefined}
          filter="screenshots"
          emptyHint="No screenshots taken yet. Capture screenshots from Reports (Accounts/Collections) or upload an image here."
          onGoCapture={() => goCapture({ candidate: evidencePickerCandidate })}
          pickLabel="Attach"
          onPick={
            evidencePicker.candidateId
              ? (evidenceId) => {
                  const cid = evidencePicker.candidateId!;
                  const s = selectedDisputes.find((x) => x.key === cid) ?? null;
                  const requested = evidence.find((x) => x.id === evidenceId) ?? null;
                  const requestedScore =
                    s && requested ? scoreEvidenceForAccount({ accountName: s.candidate.account, candidateType: s.candidate.type, evidence: requested }) : 0;

                  const ranked = s
                    ? rankEvidenceMatches({ accountName: s.candidate.account, candidateType: s.candidate.type, evidence: screenshotEvidence })
                    : [];
                  const best = ranked[0] ?? null;

                  const shouldAutoFix =
                    Boolean(s && best && best.evidenceId) &&
                    (best!.score >= 0.78 && (requestedScore < 0.58 || best!.score >= requestedScore + 0.22));

                  const finalEvidenceId = shouldAutoFix ? best!.evidenceId : evidenceId;

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

          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => {
                if (draftBusy) return;
                setDraftErr(null);
                setDraft(null);
              }}
            />
            <div
              className="relative w-full max-w-6xl max-h-[92vh] rounded-3xl border border-white/[0.08] bg-[#0a0f0d] shadow-2xl overflow-hidden flex flex-col"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 md:p-6 border-b border-white/[0.08] flex items-start justify-between gap-4 shrink-0">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Letter draft</div>
                  <div className="mt-2 text-2xl font-light text-white truncate">
                    {draft.type === 'court' ? 'Court / affidavit letter' : 'Validation / DV letter'}
                  </div>
                  <div className="mt-1 text-white/60 text-sm">Edit the draft, preview it on paper, then save to your Letters Vault.</div>
                </div>
                <div className="flex items-center gap-2">
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
                      <Sparkles size={14} /> {!aiGatewayEnabled ? 'AI disabled' : draftBusy ? 'Drafting…' : 'AI draft'}
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
                          title: `${draft.type === 'court' ? 'Court' : 'Validation'} template • ${new Date().toISOString().slice(0, 10)}`,
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

              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {draftErr ? (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200/90 text-sm">{draftErr}</div>
                ) : null}

                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-white font-semibold">Editor</div>
                      <button
                        type="button"
                        onClick={() => setDraftEvidencePickerOpen(true)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                        title="Attach an enclosure/evidence file to this letter"
                      >
                        Attach evidence
                      </button>
                    </div>

                    {draftNotice ? <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-[12px] text-white/75">{draftNotice}</div> : null}
                    {draft.evidenceId ? (
                      <div className="text-[11px] text-white/50">
                        Attached:{' '}
                        <span className="text-white/80 font-mono">{evidence.find((x) => x.id === draft.evidenceId)?.filename ?? draft.evidenceId}</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-white/40">No enclosure attached (optional).</div>
                    )}
                    {draft.evidenceId ? (
                      <div className="pt-1">
                        {(() => {
                          const ev = evidence.find((x) => x.id === draft.evidenceId) ?? null;
                          if (!ev?.blobRef) return null;
                          const isImg = String(ev.mimeType || '').toLowerCase().startsWith('image/');
                          if (!isImg) return null;
                          return <InlineEvidenceThumb blobRef={ev.blobRef} mimeType={ev.mimeType} alt={ev.filename || 'Evidence'} />;
                        })()}
                      </div>
                    ) : null}
                    {draft.evidenceId ? (
                      <div className="flex flex-wrap items-center gap-2">
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
                      </div>
                    ) : null}

                    <RichTextEditor
                      valueHtml={ensureHtmlDraft(draft.html || '')}
                      onChangeHtml={(html) => setDraft((prev) => (prev ? { ...prev, html } : prev))}
                      placeholder="Write your letter here…"
                      minHeightPx={520}
                    />
                    <div className="text-[11px] text-white/40">Tip: keep your contact email off mailed letters; use only your name + mailing address.</div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-white font-semibold">Paper preview</div>
                      <button
                        type="button"
                        onClick={() => setDraftPreviewFull((v) => !v)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                        title={draftPreviewFull ? 'Collapse to page preview' : 'Expand full preview'}
                      >
                        {draftPreviewFull ? 'Collapse' : 'Full preview'}
                      </button>
                    </div>
                    <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-3">
                      <div className="rounded-xl border border-black/10 bg-white shadow-xl overflow-hidden">
                        <div className={`mx-auto w-full max-w-[860px] ${draftPreviewFull ? 'p-10' : 'h-[1060px] p-10'}`}>
                          <div className="fc-paper-prose" dangerouslySetInnerHTML={{ __html: sanitizeHtmlForPreview(draft.html || '') }} />
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] text-white/40">Preview is forced to black-on-white for readability (matches print/PDF output).</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
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
                        const createdAt = new Date().toISOString();
                        const title =
                          debt && DEBT_LETTER_SPECS.find((s) => s.id === draft.specId)
                            ? `${DEBT_LETTER_SPECS.find((s) => s.id === draft.specId)!.title} • ${debt.name}`
                            : `${draft.type} letter`;

                        const pdf = await generateTextPdfToVault({
                          text: plain,
                          filename: `FinelyCred_${draft.type}_${safePartnerName(debt?.name || 'letter')}_${today}.pdf`,
                          meta: { partnerId: partner.id, debtId: debt?.id, type: draft.type },
                        });

                        const saved = upsertLetter({
                          id: newId('letter'),
                          partnerId: partner.id,
                          type: draft.type,
                          title,
                          createdAt,
                          body: plain,
                          status: 'generated',
                          pdfBlobRef: pdf.pdfBlobRef ?? undefined,
                          pdfFilename: pdf.filename,
                          relatedEvidenceIds: draft.evidenceId ? [draft.evidenceId] : [],
                          meta:
                            draft.type === 'court'
                              ? {
                                  context: 'debt',
                                  debtId: debt?.id,
                                  letterSpecId: draft.specId,
                                  scenario: String(recommendedScenario || ''),
                                  courtCaseNumber: (debt as any)?.courtCaseNumber,
                                  jurisdictionState: (debt as any)?.stateJurisdiction,
                                }
                              : {
                                  context: 'debt',
                                  debtId: debt?.id,
                                  letterSpecId: draft.specId,
                                  scenario: String(recommendedScenario || ''),
                                },
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

                        setDraft(null);
                        openVault();
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

      {/* Global “Save vs Save+Download” chooser (partner-only) */}
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
                      const createdAt = new Date().toISOString();
                      const title =
                        debt && DEBT_LETTER_SPECS.find((s) => s.id === draft.specId)
                          ? `${DEBT_LETTER_SPECS.find((s) => s.id === draft.specId)!.title} • ${debt.name}`
                          : `${draft.type} letter`;

                      const pdf = await generateTextPdfToVault({
                        text: plain,
                        filename: `FinelyCred_${draft.type}_${safePartnerName(debt?.name || 'letter')}_${today}.pdf`,
                        meta: { partnerId: partner.id, debtId: debt?.id, type: draft.type },
                      });

                      const saved = upsertLetter({
                        id: newId('letter'),
                        partnerId: partner.id,
                        type: draft.type,
                        title,
                        createdAt,
                        body: plain,
                        status: 'generated',
                        pdfBlobRef: pdf.pdfBlobRef ?? undefined,
                        pdfFilename: pdf.filename,
                        relatedEvidenceIds: draft.evidenceId ? [draft.evidenceId] : [],
                        meta:
                          draft.type === 'court'
                            ? {
                                context: 'debt',
                                debtId: debt?.id,
                                letterSpecId: draft.specId,
                                scenario: String(recommendedScenario || ''),
                                courtCaseNumber: (debt as any)?.courtCaseNumber,
                                jurisdictionState: (debt as any)?.stateJurisdiction,
                              }
                            : {
                                context: 'debt',
                                debtId: debt?.id,
                                letterSpecId: draft.specId,
                                scenario: String(recommendedScenario || ''),
                              },
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
                      const createdAt = new Date().toISOString();
                      const title =
                        debt && DEBT_LETTER_SPECS.find((s) => s.id === draft.specId)
                          ? `${DEBT_LETTER_SPECS.find((s) => s.id === draft.specId)!.title} • ${debt.name}`
                          : `${draft.type} letter`;

                      const pdf = await generateTextPdfToVault({
                        text: plain,
                        filename: `FinelyCred_${draft.type}_${safePartnerName(debt?.name || 'letter')}_${today}.pdf`,
                        meta: { partnerId: partner.id, debtId: debt?.id, type: draft.type },
                      });

                      const saved = upsertLetter({
                        id: newId('letter'),
                        partnerId: partner.id,
                        type: draft.type,
                        title,
                        createdAt,
                        body: plain,
                        status: 'generated',
                        pdfBlobRef: pdf.pdfBlobRef ?? undefined,
                        pdfFilename: pdf.filename,
                        relatedEvidenceIds: draft.evidenceId ? [draft.evidenceId] : [],
                        meta:
                          draft.type === 'court'
                            ? {
                                context: 'debt',
                                debtId: debt?.id,
                                letterSpecId: draft.specId,
                                scenario: String(recommendedScenario || ''),
                                courtCaseNumber: (debt as any)?.courtCaseNumber,
                                jurisdictionState: (debt as any)?.stateJurisdiction,
                              }
                            : {
                                context: 'debt',
                                debtId: debt?.id,
                                letterSpecId: draft.specId,
                                scenario: String(recommendedScenario || ''),
                              },
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

      <div data-fc-letter-studio="1" className="space-y-8">
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

        {!unifiedShell ? (
        <div className="flex flex-wrap gap-3">
          {tabKeys.filter((t) => !t.hidden).map((t) => (
            <button key={t.key} className={tabBtn(tab === t.key)} onClick={() => setTab(t.key)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        ) : null}

        {/* Always-visible dispute selection shortcut (so it can't be missed). */}
        <div className="fc-light-glass-panel fc-light-chrome-panel p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-white/60 text-sm">
            Disputes selected: <span className="text-white/90 font-semibold">{selectedDisputes.length}</span>
            {selectedDisputes.length ? (
              <span className="text-white/40 text-sm"> — split automatically into EXP / EQF / Trans letters</span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setTab('dispute');
                setPickerOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
              title="Select which items to dispute (from a report or case)"
            >
              <Gavel size={14} /> Select disputes
            </button>
            {selectedDisputes.length ? (
              <button
                type="button"
                onClick={clearDisputeStudioDraft}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/25 bg-red-500/10 hover:bg-red-500/15 text-[10px] font-black uppercase tracking-widest text-red-100/80 transition-all"
                title="Clear the entire dispute letter studio draft (full reset)"
              >
                Clear studio
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => openDisputeCenter()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
              title="Open dispute case tracking"
            >
              Dispute Center <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {tab === 'dispute' && (
          <EntitlementGate
            partnerId={partner.id}
            requiredKeys={[ENTITLEMENT_KEYS.disputes]}
            hideBillingCta={layout === 'embedded'}
            lockedActions={
              layout === 'embedded' && onRequestGrantEntitlements ? (
                <button
                  type="button"
                  onClick={() => onRequestGrantEntitlements([ENTITLEMENT_KEYS.disputes])}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                >
                  Grant access
                </button>
              ) : null
            }
          >
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/[0.08] bg-black/30 p-6 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Dispute letters</div>
                    <div className="mt-2 text-white/70 text-sm max-w-3xl">
                      Choose disputes in a popup, then attach evidence inline. Selections automatically split into separate bureau letters (EXP/EQF/Trans).
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                    >
                      <Gavel size={14} /> Select disputes
                    </button>
                    <button
                      type="button"
                      onClick={() => openDisputeCenter()}
                      className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                      title="Open dispute case tracking"
                    >
                      Dispute Center <ChevronRight size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setReasonsLibraryOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                      title="Download dispute reasons library (reference text)"
                    >
                      <FileText size={14} /> Reasons OS
                    </button>
                  </div>
                </div>

                <div className="fc-light-glass-panel fc-light-chrome-panel p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Restore progress</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/70">{restoreHud.pct}%</div>
                  </div>
                  <div className="mt-2 text-white/60 text-sm max-w-5xl">
                    This is the dispute-letter workflow from start → saved PDF. Steps auto-complete based on your saved work (reports, screenshots,
                    selected items, and reasons). If evidence is missing, PDF generation is blocked to keep your letter “mail-ready.”
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
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
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                    <span className="px-3 py-2 rounded-xl border border-white/[0.08] bg-black/40 text-white/60">
                      Reports <span className="text-white/80">{reports.length}</span>
                    </span>
                    <span className="px-3 py-2 rounded-xl border border-white/[0.08] bg-black/40 text-white/60">
                      Screenshots <span className="text-white/80">{screenshotEvidence.length}</span>
                    </span>
                    <span className="px-3 py-2 rounded-xl border border-white/[0.08] bg-black/40 text-white/60">
                      Disputes <span className="text-white/80">{selectedDisputes.length}</span>
                    </span>
                    <span className="px-3 py-2 rounded-xl border border-white/[0.08] bg-black/40 text-white/60">
                      Evidence linked{' '}
                      <span className="text-white/80">
                        {disputeEvidenceLinked.linked}/{disputeEvidenceLinked.total}
                      </span>
                    </span>
                    <span className="px-3 py-2 rounded-xl border border-white/[0.08] bg-black/40 text-white/60">
                      Reasons{' '}
                      <span className="text-white/80">
                        {disputeReasonsSelected.withAny}/{disputeReasonsSelected.total}
                      </span>
                    </span>
                    <span className="px-3 py-2 rounded-xl border border-white/[0.08] bg-black/40 text-white/60">
                      Letters generated{' '}
                      <span className="text-white/80">{Object.values(lastGeneratedAtByBureau).filter(Boolean).length}</span>
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-white/55 text-sm">
                      Next: <span className="text-white/85 font-semibold">{nextBestAction.label}</span>
                      {nextBestAction.key === 'generate_pdf' ? (
                        <span className="text-white/45 text-sm"> — saves to Letters Vault</span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={runNextBestAction}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/25 bg-amber-500/15 hover:bg-amber-500/20 text-[10px] font-black uppercase tracking-widest text-amber-100 transition-all"
                      title={nextBestAction.label}
                    >
                      Do next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-white/40">
                  Selected: <span className="text-white/70">{selectedDisputes.length}</span>
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
                <div className="fc-light-glass-panel fc-light-chrome-panel p-6 text-white/60">
                  No disputes selected yet. Click <span className="text-white/80 font-semibold">Choose disputes</span> to pick items from a report or a saved case.
                </div>
              ) : (
                <>
                  {layout === 'embedded' ? (
                    <div className="flex flex-wrap gap-2 border-b border-white/[0.08] pb-3 mb-1">
                      {(['EXP', 'EQF', 'TUC'] as Bureau[]).map((b) => {
                        const count = (selectedByBureau[b] ?? []).length;
                        if (!count) return null;
                        const on = workspaceBureau === b;
                        return (
                          <button
                            key={b}
                            type="button"
                            onClick={() => setWorkspaceBureau(b)}
                            className={
                              'px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ' +
                              (on
                                ? 'bg-amber-500 text-black border-amber-400'
                                : 'bg-white/5 text-white/70 border-white/[0.08] hover:bg-white/10 hover:text-white')
                            }
                            title={bureauFullName(b)}
                          >
                            {bureauShortCode(b)} ({count})
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                  {(['EXP', 'EQF', 'TUC'] as Bureau[])
                    .filter((b) => layout !== 'embedded' || b === workspaceBureau)
                    .map((b) => {
                  const items = selectedByBureau[b] ?? [];
                  if (!items.length) return null;
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
                    <div key={b} id={`fc-bureau-${b}`} className="rounded-2xl border border-white/[0.08] bg-black/30 p-6 space-y-4">
                      <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-white/40">Letter</div>
                          <div className="mt-2 text-xl font-semibold text-white">
                            {bureauFullName(b)} ({bureauShortCode(b)})
                          </div>
                          <div className="mt-1 text-[11px] text-white/40">
                            {items.length} dispute{items.length === 1 ? '' : 's'} selected
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
                              title="Evidence is weighted higher than reasons (because it’s the proof)"
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
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                              title={
                                aiGatewayEnabled
                                  ? 'AI drafts opening paragraphs + per-item narratives using your selected reasons'
                                  : 'AI drafting is disabled in Settings'
                              }
                            >
                              <Sparkles size={14} /> {!aiGatewayEnabled ? 'AI disabled' : aiBusy ? 'Drafting…' : 'AI draft letter'}
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
                            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Round</div>
                            <select
                              value={round}
                              onChange={(e) => setRoundByBureau((prev) => ({ ...prev, [b]: e.target.value as LetterRound }))}
                              className="mt-2 bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                            >
                              <option value="Round 1">Round 1</option>
                              <option value="Round 2">Round 2</option>
                              <option value="Round 3">Round 3</option>
                            </select>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Tone</div>
                            <select
                              value={tone}
                              onChange={(e) => {
                                const nextTone = e.target.value as LetterTone;
                                setToneByBureau((prev) => ({ ...prev, [b]: nextTone }));
                                setIntroByBureau((prev) => ({ ...prev, [b]: prev[b] || plainTextToHtml(defaultDisputeIntro(nextTone)) }));
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
                        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
                          <div className="space-y-4">
                            <div className="fc-light-glass-panel fc-light-chrome-panel p-5 space-y-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="text-[10px] uppercase tracking-widest text-white/40">Header & addressing (editable)</div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSenderName(canonicalIdentity.fullName || partner.profile.fullName || '');
                                      setSenderAddressLine1(canonicalIdentity.address1 || canonicalIdentity.addressLine1 || '');
                                      setSenderAddressLine2(canonicalIdentity.address2 || '');
                                      setSenderCityStateZip(canonicalIdentity.cityStateZip || '');
                                    }}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] bg-black/40 hover:bg-black/35 text-[10px] font-black uppercase tracking-widest text-white/60 transition-all"
                                    title="Reset sender fields to the partner’s canonical identity"
                                  >
                                    Reset sender
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const def = bureauDisputeAddress(b);
                                      setSubjectLineByBureau((prev) => ({ ...prev, [b]: SUBJECT_LINE }));
                                      setBureauAddressDraftByBureau((prev) => ({ ...prev, [b]: { name: def.name, linesText: def.lines.join('\n') } }));
                                    }}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] bg-black/40 hover:bg-black/35 text-[10px] font-black uppercase tracking-widest text-white/60 transition-all"
                                    title="Reset bureau recipient address + subject line to defaults"
                                  >
                                    Reset bureau
                                  </button>
                                </div>
                              </div>

                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="rounded-xl border border-white/[0.08] bg-black/40 p-4 space-y-3">
                                  <div className="text-[10px] uppercase tracking-widest text-white/40">Sender (you)</div>
                                  <div>
                                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Name</div>
                                    <input
                                      value={senderName}
                                      onChange={(e) => setSenderName(e.target.value)}
                                      className="mt-2 w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                                      placeholder={canonicalIdentity.fullName || 'Full legal name'}
                                    />
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Address line 1</div>
                                    <input
                                      value={senderAddressLine1}
                                      onChange={(e) => setSenderAddressLine1(e.target.value)}
                                      className="mt-2 w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                                      placeholder={canonicalIdentity.address1 || canonicalIdentity.addressLine1 || 'Street address'}
                                    />
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Address line 2 (optional)</div>
                                    <input
                                      value={senderAddressLine2}
                                      onChange={(e) => setSenderAddressLine2(e.target.value)}
                                      className="mt-2 w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                                      placeholder={canonicalIdentity.address2 || 'Apt / Unit'}
                                    />
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">City, State ZIP</div>
                                    <input
                                      value={senderCityStateZip}
                                      onChange={(e) => setSenderCityStateZip(e.target.value)}
                                      className="mt-2 w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                                      placeholder={canonicalIdentity.cityStateZip || 'City, ST 00000'}
                                    />
                                  </div>
                                </div>

                                <div className="rounded-xl border border-white/[0.08] bg-black/40 p-4 space-y-3">
                                  <div className="text-[10px] uppercase tracking-widest text-white/40">Recipient (bureau)</div>
                                  <div>
                                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Bureau name</div>
                                    <input
                                      value={bureauAddressDraftByBureau[b]?.name ?? ''}
                                      onChange={(e) =>
                                        setBureauAddressDraftByBureau((prev) => ({
                                          ...prev,
                                          [b]: { ...(prev[b] || { name: '', linesText: '' }), name: e.target.value },
                                        }))
                                      }
                                      className="mt-2 w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                                      placeholder={bureauDisputeAddress(b).name}
                                    />
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Bureau address (one line per row)</div>
                                    <textarea
                                      value={bureauAddressDraftByBureau[b]?.linesText ?? ''}
                                      onChange={(e) =>
                                        setBureauAddressDraftByBureau((prev) => ({
                                          ...prev,
                                          [b]: { ...(prev[b] || { name: '', linesText: '' }), linesText: e.target.value },
                                        }))
                                      }
                                      className="mt-2 w-full min-h-[132px] bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                                      placeholder={bureauDisputeAddress(b).lines.join('\n')}
                                    />
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Subject line</div>
                                    <input
                                      value={subjectLineByBureau[b] ?? SUBJECT_LINE}
                                      onChange={(e) => setSubjectLineByBureau((prev) => ({ ...prev, [b]: e.target.value }))}
                                      className="mt-2 w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                                      placeholder={SUBJECT_LINE}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="text-[11px] text-white/40">
                                These fields print on the generated PDF (top-right sender block, bureau address block, and subject line).
                              </div>
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
                                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60"
                                      title="Have AI draft the opening + narratives for this bureau"
                                    >
                                      <Sparkles size={14} /> {!aiGatewayEnabled ? 'AI disabled' : aiBusy ? 'Drafting…' : 'AI draft'}
                                    </button>
                                  ) : null}
                                  <button
                                    type="button"
                                    onClick={() => setIntroByBureau((prev) => ({ ...prev, [b]: plainTextToHtml(defaultDisputeIntro(tone)) }))}
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
                                placeholder="Write the opening paragraphs here…"
                                minHeightPx={640}
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
                                placeholder="Write the closing block here…"
                                minHeightPx={320}
                              />
                              <div className="text-[11px] text-white/40">
                                This is the editable bottom section. Signature is appended automatically.
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="text-[10px] uppercase tracking-widest text-white/40">Selected disputes</div>
                              {(() => {
                                const groups = (() => {
                                  if (!groupOn) return [{ key: 'all', label: 'All items', items }];
                                  const m = new Map<string, typeof items>();
                                  for (const s of items) {
                                    const k = (s.candidate.account || 'Unknown').trim() || 'Unknown';
                                    const arr = m.get(k) ?? [];
                                    arr.push(s);
                                    m.set(k, arr);
                                  }
                                  return Array.from(m.entries())
                                    .sort((a, b) => a[0].localeCompare(b[0]))
                                    .map(([label, items]) => ({ key: label, label, items }));
                                })();

                                const focusedKey = (() => {
                                  const cur = focusedKeyByBureau[b];
                                  if (cur && items.some((x) => x.key === cur)) return cur;
                                  return items[0]?.key ?? null;
                                })();
                                const focused = focusedKey ? items.find((x) => x.key === focusedKey) ?? null : null;

                                return (
                                  <div className="space-y-4">
                                    {groups.map((g) => {
                                      const gid = `${b}:${g.key}`;
                                      const collapsed = collapsedGroups[gid] ?? false;
                                      return (
                                        <div key={gid} className="fc-light-glass-panel fc-light-chrome-panel overflow-hidden">
                                          <button
                                            type="button"
                                            onClick={() => setCollapsedGroups((prev) => ({ ...prev, [gid]: !(prev[gid] ?? false) }))}
                                            className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left hover:bg-white/[0.03] transition-colors"
                                            title={collapsed ? 'Expand group' : 'Collapse group'}
                                          >
                                            <div className="min-w-0">
                                              <div className="text-white font-semibold truncate">{g.label}</div>
                                              <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">
                                                {g.items.length} item{g.items.length === 1 ? '' : 's'}
                                              </div>
                                            </div>
                                            <div className="text-white/50 text-sm">{collapsed ? 'Show' : 'Hide'}</div>
                                          </button>

                                          {!collapsed ? (
                                            <div className="p-5 pt-0">
                                              <div className="grid md:grid-cols-2 gap-4">
                                                {g.items.map((s) => {
                                                  const evId = evidenceByCandidateId[s.key];
                                                  const reasonCount = (reasonsByCandidateId[s.key] ?? []).filter(Boolean).length;
                                                  const ev = evId ? evidence.find((x) => x.id === evId) ?? null : null;
                                                  const isFocused = focusedKey === s.key;
                                                  return (
                                                    <button
                                                      key={s.key}
                                                      type="button"
                                                      onClick={() => setFocusedKeyByBureau((prev) => ({ ...prev, [b]: s.key }))}
                                                      className={
                                                        'rounded-2xl border p-5 text-left space-y-3 transition-all ' +
                                                        (isFocused
                                                          ? 'border-amber-500/35 bg-amber-500/10'
                                                          : 'border-white/[0.08] bg-black/40 hover:bg-white/[0.03]')
                                                      }
                                                      title="Select this item to edit evidence, reasons, and narrative"
                                                    >
                                                      <div className="min-w-0">
                                                        <div className="text-white font-semibold truncate">
                                                          {s.candidate.account} — {s.candidate.type}
                                                        </div>
                                                        <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">
                                                          code: {s.candidate.code} • request: {s.candidate.status}
                                                        </div>
                                                      </div>

                                                      <div className="flex flex-wrap items-center gap-2">
                                                        <span
                                                          className={
                                                            'px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ' +
                                                            (ev ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100/90' : 'border-red-500/25 bg-red-500/10 text-red-100/90')
                                                          }
                                                        >
                                                          {ev ? 'Evidence linked' : 'Evidence missing'}
                                                        </span>
                                                        <span
                                                          className={
                                                            'px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ' +
                                                            (reasonCount > 0
                                                              ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100/90'
                                                              : 'border-white/[0.08] bg-white/[0.02] text-white/60')
                                                          }
                                                        >
                                                          Reasons {reasonCount}
                                                        </span>
                                                      </div>

                                                      {ev?.blobRef && String(ev.mimeType || '').toLowerCase().startsWith('image/') ? (
                                                        <div className="pt-1">
                                                          <InlineEvidenceThumb blobRef={ev.blobRef} mimeType={ev.mimeType} alt={ev.filename || 'Evidence'} />
                                                        </div>
                                                      ) : null}
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          ) : null}
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="rounded-2xl border border-white/[0.08] bg-[#070b09] shadow-2xl p-5 space-y-3 lg:sticky lg:top-24 self-start">
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
                                items={items.map((s) => {
                                  const evId = evidenceByCandidateId[s.key];
                                  const ev = evId ? evidence.find((x) => x.id === evId) : null;
                                  return {
                                    candidate: { ...s.candidate, id: s.key } as any,
                                    evidence: ev ? { filename: ev.filename, blobRef: ev.blobRef, mimeType: ev.mimeType } : null,
                                    reasons: reasonsByCandidateId[s.key] ?? [],
                                    narrative: (aiNarrativeByCandidateKey[s.key] || '').trim() || null,
                                  };
                                })}
                                onOpenFull={() => setPreviewModalBureau(b)}
                              />
                            </div>

                            {(() => {
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
                              const narrative = focused ? (aiNarrativeByCandidateKey[focused.key] ?? '') : '';

                              if (!focused) return null;

                              return (
                                <div className="fc-light-glass-panel fc-light-chrome-panel p-5 space-y-4">
                                  <div className="text-[10px] uppercase tracking-widest text-white/40">Focused item</div>
                                  <div className="text-white font-semibold">
                                    {focused.candidate.account} — {focused.candidate.type}
                                  </div>
                                  <div className="text-[10px] uppercase tracking-widest text-white/40">
                                    code: {focused.candidate.code} • request: {focused.candidate.status}
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const key = focused.key;
                                        // Remove the dispute from this letter (and cleanup linked state).
                                        setSelectedDisputes((prev) => prev.filter((x) => x.key !== key));
                                        setEvidenceByCandidateId((prev) => {
                                          const out = { ...prev };
                                          delete out[key];
                                          return out;
                                        });
                                        setReasonsByCandidateId((prev) => {
                                          const out = { ...prev };
                                          delete out[key];
                                          return out;
                                        });
                                        setAiNarrativeByCandidateKey((prev) => {
                                          const out = { ...prev };
                                          delete out[key];
                                          return out;
                                        });
                                        setFocusedKeyByBureau((prev) => ({ ...prev, [b]: null }));
                                        setLastGeneratedAtByBureau((prev) => ({ ...prev, [b]: null }));
                                      }}
                                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-red-500/25 bg-red-500/10 hover:bg-red-500/15 text-[10px] font-black uppercase tracking-widest text-red-100/80 transition-all"
                                      title="Remove this dispute from the letter (useful to reset)"
                                    >
                                      Remove dispute
                                    </button>
                                  </div>

                                  {(() => {
                                    const nt = classifyCandidateNegativeType(focused.candidate as any);
                                    const pb = NEGATIVE_PLAYBOOKS[nt] ?? NEGATIVE_PLAYBOOKS.unknown;
                                    return (
                                      <div className="fc-light-glass-panel fc-light-chrome-panel rounded-xl p-4 space-y-2">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                          <div className="text-[10px] uppercase tracking-widest text-white/40">Playbook</div>
                                          <div className="px-3 py-1 rounded-full border border-white/[0.08] bg-black/30 text-white/80 text-xs font-semibold">
                                            {pb.label}
                                          </div>
                                        </div>
                                        <div className="text-white/70 text-sm leading-relaxed">{pb.aiHint}</div>
                                        {(pb.clauses?.length ?? 0) > 0 ? (
                                          <div className="pt-2">
                                            <div className="text-[10px] uppercase tracking-widest text-white/40">Clause snippets</div>
                                            <div className="mt-2 space-y-2">
                                              {pb.clauses!.slice(0, 4).map((c) => (
                                                <div key={c} className="rounded-xl border border-white/[0.08] bg-black/30 p-3">
                                                  <div className="text-white/70 text-sm leading-relaxed">{c}</div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ) : null}
                                        {pb.tasks.length ? (
                                          <div className="pt-2">
                                            <div className="text-[10px] uppercase tracking-widest text-white/40">Recommended next actions</div>
                                            <ul className="mt-2 space-y-2">
                                              {pb.tasks.slice(0, 4).map((t) => (
                                                <li key={t.title} className="rounded-xl border border-white/[0.08] bg-black/30 p-3 text-white/75 text-sm">
                                                  {t.title}
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        ) : null}
                                      </div>
                                    );
                                  })()}

                                  <div className="rounded-xl border border-white/[0.08] bg-black/40 p-4 space-y-3">
                                    {ev &&
                                      scoreEvidenceForAccount({
                                        accountName: focused.candidate.account,
                                        candidateType: focused.candidate.type,
                                        evidence: ev,
                                      }) < 0.4 && (
                                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-100/90 text-sm">
                                          <ShieldAlert size={14} className="inline mr-2 align-text-bottom" />
                                          Screenshot may not match this account. Consider replacing with a capture that clearly shows &quot;{focused.candidate.account}&quot; for a stronger dispute.
                                        </div>
                                      )}
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="text-[10px] uppercase tracking-widest text-white/40">Evidence</div>
                                      <div className="flex items-center gap-2">
                                        {ev ? (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEvidenceByCandidateId((prev) => {
                                                const out = { ...prev };
                                                delete out[focused.key];
                                                return out;
                                              });
                                            }}
                                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] bg-black/40 hover:bg-black/35 text-[10px] font-black uppercase tracking-widest text-white/60 transition-all"
                                            title="Unlink evidence from this item"
                                          >
                                            Remove
                                          </button>
                                        ) : null}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (screenshotEvidence.length === 0) return goCapture({ candidate: focused });
                                            setEvidencePicker({ candidateId: focused.key });
                                          }}
                                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                                        >
                                          {ev ? 'Replace' : 'Attach'} <ChevronRight size={14} />
                                        </button>
                                      </div>
                                    </div>
                                    {ev ? (
                                      <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                          {ev.blobRef && String(ev.mimeType || '').toLowerCase().startsWith('image/') ? (
                                            <InlineEvidenceThumb blobRef={ev.blobRef} mimeType={ev.mimeType} alt={ev.filename || 'Evidence'} />
                                          ) : (
                                            <div className="h-14 w-24 fc-light-glass-panel fc-light-chrome-panel rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-white/40">
                                              File
                                            </div>
                                          )}
                                          <div className="min-w-0">
                                            <div className="text-white/85 text-sm font-semibold truncate">{ev.filename}</div>
                                            <div className="mt-0.5 text-[10px] uppercase tracking-widest text-white/35 font-mono truncate">{ev.mimeType}</div>
                                          </div>
                                        </div>
                                        {ev.blobRef ? (
                                          <button
                                            type="button"
                                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                                            onClick={() => {
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
                                          >
                                            Open <ExternalLink size={14} />
                                          </button>
                                        ) : null}
                                      </div>
                                    ) : (
                                      <div className="text-white/60 text-sm">No evidence attached yet.</div>
                                    )}

                                    {(() => {
                                      // Suggested screenshots (ranked) for this focused item.
                                      if (screenshotEvidence.length === 0) return null;
                                      const ranked = rankEvidenceMatches({
                                        accountName: focused.candidate.account,
                                        candidateType: focused.candidate.type,
                                        evidence: screenshotEvidence,
                                      })
                                        .slice(0, 6)
                                        .map((r) => screenshotEvidence.find((x) => x.id === r.evidenceId) ?? null)
                                        .filter(Boolean) as typeof screenshotEvidence;
                                      const suggested = ranked.filter((x) => x.id !== evId).slice(0, 5);
                                      if (!suggested.length) return null;
                                      return (
                                        <div className="pt-2">
                                          <div className="text-[10px] uppercase tracking-widest text-white/40">Suggested screenshots</div>
                                          <div className="mt-2 flex flex-wrap gap-2">
                                            {suggested.map((s) => (
                                              <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => setEvidenceByCandidateId((prev) => ({ ...prev, [focused.key]: s.id }))}
                                                className="fc-light-glass-panel fc-light-chrome-panel rounded-xl hover:bg-white/[0.04] transition-all p-2"
                                                title={`Attach ${s.filename}`}
                                              >
                                                <InlineEvidenceThumb blobRef={s.blobRef} mimeType={s.mimeType} alt={s.filename || 'Evidence'} />
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>

                                  <div className="rounded-xl border border-white/[0.08] bg-black/40 p-4 space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                      <div className="text-[10px] uppercase tracking-widest text-white/40">Reasons</div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const top = suggestions.slice(0, 3).map((x) => x.text);
                                            if (!top.length) return;
                                            setReasonsByCandidateId((prev) => ({ ...prev, [focused.key]: top }));
                                          }}
                                          className="px-3 py-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                                          title="Fill this item with the top suggested reasons"
                                        >
                                          Fill top 3
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setReasonsByCandidateId((prev) => ({ ...prev, [focused.key]: [] }));
                                          }}
                                          className="px-3 py-2 rounded-xl border border-white/[0.08] bg-black/40 hover:bg-black/35 text-[10px] font-black uppercase tracking-widest text-white/60 transition-all"
                                          title="Clear selected reasons for this item"
                                        >
                                          Clear
                                        </button>
                                      </div>
                                    </div>
                                    {suggestions.length === 0 ? (
                                      <div className="text-white/50 text-sm">No reason suggestions available for this item.</div>
                                    ) : (
                                      <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-2 pb-2">
                                          <div className="text-[10px] uppercase tracking-widest text-white/40">
                                            Selected ({selectedReasons.filter(Boolean).length})
                                          </div>
                                          {selectedReasons.filter(Boolean).length ? (
                                            <div className="flex flex-wrap gap-2">
                                              {selectedReasons
                                                .filter(Boolean)
                                                .slice(0, 8)
                                                .map((r) => (
                                                  <div
                                                    key={r}
                                                    className="px-3 py-1 rounded-full fc-light-glass-panel fc-light-chrome-panel border text-[11px] text-white/70"
                                                    title={r}
                                                  >
                                                    {r}
                                                  </div>
                                                ))}
                                              {selectedReasons.filter(Boolean).length > 8 ? (
                                                <div className="px-3 py-1 rounded-full border border-white/[0.08] bg-black/30 text-[11px] text-white/55">
                                                  +{selectedReasons.filter(Boolean).length - 8} more
                                                </div>
                                              ) : null}
                                            </div>
                                          ) : (
                                            <div className="text-[11px] text-white/50">Pick at least one reason below.</div>
                                          )}
                                        </div>
                                        {suggestions.slice(0, 12).map((r) => {
                                          const selected = selectedReasons.includes(r.text);
                                          return (
                                            <label key={r.id} className="flex items-start gap-2 text-white/75 text-sm cursor-pointer">
                                              <input
                                                type="checkbox"
                                                className="mt-1"
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
                                    )}
                                  </div>

                                  <div className="rounded-xl border border-white/[0.08] bg-black/40 p-4 space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                      <div className="text-[10px] uppercase tracking-widest text-white/40">Narrative (optional)</div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setAiNarrativeByCandidateKey((prev) => {
                                              const out = { ...prev };
                                              delete out[focused.key];
                                              return out;
                                            })
                                          }
                                          className="px-3 py-2 rounded-xl border border-white/[0.08] bg-black/40 hover:bg-black/35 text-[10px] font-black uppercase tracking-widest text-white/60 transition-all"
                                          title="Clear narrative for this item"
                                        >
                                          Clear
                                        </button>
                                      </div>
                                    </div>
                                    <div className="text-white/60 text-sm">
                                      Write the dispute in your own words. This is what you use when you don’t want to attach a screenshot.
                                      {narrative.trim() ? ' (AI draft is already filled in — edit as needed.)' : null}
                                    </div>
                                    <textarea
                                      value={narrative}
                                      onChange={(e) =>
                                        setAiNarrativeByCandidateKey((prev) => ({
                                          ...prev,
                                          [focused.key]: e.target.value,
                                        }))
                                      }
                                      rows={5}
                                      placeholder="Example: This account is reporting inaccurately. Please reinvestigate and provide the method of verification. If it cannot be verified, delete or correct it…"
                                      className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-4 py-3 text-white/80 text-sm leading-relaxed placeholder:text-white/30 focus:outline-none focus:border-amber-500/60"
                                    />
                                  </div>
                                </div>
                              );
                            })()}

                          </div>
                        </div>
                      ) : null}

                      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
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
                          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                          title={
                            'Generate PDF and save it to Letters Vault'
                          }
                        >
                          <PenLine size={14} /> {busy ? 'Generating…' : 'Generate PDF + Save'}
                        </button>
                      </div>
                    </div>
                  );
                })}
                </>
              )}

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
            </div>
          </EntitlementGate>
        )}

        {(tab === 'validation' || tab === 'court') && (
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
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/[0.08] bg-black/30 p-6 space-y-4">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Context</div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Debt / summons case</label>
                    <select
                      value={debtId}
                      onChange={(e) => setDebtId(e.target.value)}
                      className="mt-2 w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                    >
                      {debtCases.length === 0 ? <option value="">No cases yet</option> : null}
                      {debtCases.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} • {d.type}
                        </option>
                      ))}
                    </select>
                    <div className="mt-2 text-[11px] text-white/40">
                      Manage cases in{' '}
                      <button type="button" className="text-amber-300 hover:text-amber-200 underline" onClick={() => openDebtCenter()}>
                        Debt & Summons Center
                      </button>
                      .
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Recommended scenario</div>
                    <div className="mt-2 fc-light-glass-panel fc-light-chrome-panel rounded-xl p-4">
                      <div className="text-white font-semibold">{String(recommendedScenario).replaceAll('_', ' ')}</div>
                      <div className="mt-2 text-white/60 text-sm">
                        {SCENARIO_RECOMMENDATIONS.find((r) => r.scenario === (recommendedScenario as DebtScenario))?.description ??
                          'Pick the best-fit letter for your situation.'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-black/30 p-6 space-y-4">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Build draft</div>
                <div className="grid md:grid-cols-2 gap-4">
                  {DEBT_LETTER_SPECS.filter((s) => {
                    const isCourt = s.id.includes('summons') || s.id.includes('answer') || s.id.includes('affidavit');
                    return tab === 'court' ? isCourt : !isCourt;
                  }).map((spec) => (
                    <div key={spec.id} className="fc-light-glass-panel fc-light-chrome-panel p-5 space-y-3">
                      <div className="text-white font-semibold">{spec.title}</div>
                      <div className="text-white/60 text-sm">{spec.shortDescription}</div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                          onClick={() => {
                            const isCourt = tab === 'court';
                            const baseText = canSeeTemplates
                              ? getLetterBody(spec.id, {
                                  creditorName: debt?.name || 'Creditor',
                                  debtorName: canonicalIdentity.fullName,
                                  date: today,
                                  debtorAddress1: canonicalIdentity.address1 ?? canonicalIdentity.addressLine1,
                                  debtorAddress2: canonicalIdentity.address2,
                                  debtorCity: canonicalIdentity.city,
                                  debtorState: canonicalIdentity.state,
                                  debtorPostalCode: canonicalIdentity.postalCode,
                                  debtorPhone: canonicalIdentity.phone,
                                  debtorEmail: partner.profile.email,
                                  recipientName: debt?.name || undefined,
                                  recipientAddress: matchedCreditorContact?.address,
                                  caseNumber: (debt as any)?.courtCaseNumber,
                                  stateNote: (debt as any)?.stateJurisdiction
                                    ? ` In ${(debt as any).stateJurisdiction}, the applicable SOL may apply.`
                                    : undefined,
                                })
                              : `DATE: ${today}\n\nTO WHOM IT MAY CONCERN,\n\nI am writing regarding ${debt?.name || 'this matter'}.\n\n[Write your request here.]\n\nSincerely,\n${canonicalIdentity.fullName}\n`;
                            setDraft({ specId: spec.id, type: isCourt ? 'court' : 'validation', html: plainTextToHtml(baseText) });
                          }}
                          title="Build an editable draft and save it to your Letters Vault"
                        >
                          Build draft
                        </button>
                        {!canSeeTemplates ? (
                          <div className="text-[11px] text-white/40">Template text hidden for privacy. (Paid DIY/course tiers unlock template browsing.)</div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
                      setTplSaveErr('To attach a file template as an enclosure, open Validation/Court and click “Templates”.');
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
                    placeholder="Pick a template to load text…"
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
                          title: `${tplRendered.title} • template`,
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
                    {tplSaveBusy ? 'Saving…' : 'Save to Letters Vault'} <ChevronRight size={16} />
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
    </>
  );

      {reasonsLibraryOpen && partner ? (
        <DisputeReasonsLibraryPanel
          commandHub
          open={reasonsLibraryOpen}
          partnerId={partner.id}
          onClose={() => setReasonsLibraryOpen(false)}
          onApplyReason={(text) => {
            void navigator.clipboard?.writeText(text);
            setReasonsLibraryOpen(false);
            setReturnNotice('Reason copied from Reasons OS — paste into the active dispute item.');
          }}
        />
      ) : null}

  if (layout === 'embedded' || unifiedShell) return main;

  return (
    <PageShell
      badge="Partner Portal"
      title="Letter Studio"
      subtitle="Pick context → build a draft → edit → paper preview → save to Letters Vault."
    >
      {main}
    </PageShell>
  );
}

