import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Camera, ExternalLink, Paperclip, Trash2, X } from 'lucide-react';
import type { Bureau, ParsedTradeline } from '../../domain/creditReports';
import type { EvidenceItem } from '../../domain/evidence';
import { openBlobRefInNewTab } from '../../lib/openBlobRef';
import { captureTradelineEvidenceScreenshot } from '../../lib/captureTradelineEvidenceScreenshot';
import { bureauFullName } from '../../utils/bureaus';
import { EvidenceUploader } from './EvidenceUploader';
import { FinelyOsTypedDeleteDialog } from '../../features/os/FinelyOsTypedDeleteDialog';
import {
  EVIDENCE_MATCH_ATTACH_MIN,
  describeEvidenceMismatch,
  evidenceMatchesAccount,
  scoreEvidenceForAccount,
} from '../../utils/evidenceMatch';
import { filterIdentityPacketEvidence } from '../../lib/identityEvidence';

/** An attachable dispute account offered in the in-popup "choose account + capture" flow. */
export type EvidencePickerAccount = {
  id: string;
  label: string;
  creditorName: string;
  type?: string;
  bureau?: Bureau;
  last4?: string | null;
  /** Resolved parsed tradeline, when available — required to enable in-popup capture. */
  tradeline?: ParsedTradeline | null;
  reportId?: string;
};

const CHIP_CLS =
  'inline-flex items-center px-2.5 py-1 rounded-lg border border-white/20 bg-black/30 text-white/80 text-[10px] font-black uppercase tracking-widest';

type CategoryKey =
  | ''
  | 'collections'
  | 'inquiries'
  | 'public_records'
  | 'bankruptcy'
  | 'id_docs'
  | 'bureau_response'
  | 'contracts'
  | 'other';

const CATEGORY_OPTIONS: { key: CategoryKey; label: string }[] = [
  { key: '', label: 'Uncategorized' },
  { key: 'collections', label: 'Collections' },
  { key: 'inquiries', label: 'Inquiries' },
  { key: 'public_records', label: 'Public records' },
  { key: 'bankruptcy', label: 'Bankruptcy' },
  { key: 'id_docs', label: 'ID / Address docs' },
  { key: 'bureau_response', label: 'Bureau responses' },
  { key: 'contracts', label: 'Contracts' },
  { key: 'other', label: 'Other' },
];

export function EvidencePickerModal({
  open,
  title,
  subtitle,
  partnerId,
  reportId,
  items,
  selectedEvidenceId,
  selectedEvidenceIds,
  filter = 'all',
  emptyHint,
  onGoCapture,
  pickLabel = 'Attach',
  onPick,
  onPickMany,
  onUpsert,
  onDelete,
  onOpenFullVault,
  onClose,
  autoPickOnUpload = true,
  matchAccount,
  matchCandidateType,
  strictAccountMatch = true,
  accounts,
  selectedAccountId,
  onSelectAccount,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  partnerId: string;
  reportId?: string;
  items: EvidenceItem[];
  selectedEvidenceId?: string;
  selectedEvidenceIds?: string[];
  filter?: 'all' | 'screenshots' | 'identity'
  emptyHint?: string;
  onGoCapture?: () => void;
  pickLabel?: string;
  onPick?: (evidenceId: string) => void;
  onPickMany?: (evidenceIds: string[]) => void;
  onUpsert: (item: EvidenceItem) => void;
  onDelete: (evidenceId: string) => void;
  onOpenFullVault?: () => void;
  onClose: () => void;
  autoPickOnUpload?: boolean;
  /** When set, only matching screenshots can be attached (unless show-all override). */
  matchAccount?: string;
  matchCandidateType?: string;
  strictAccountMatch?: boolean;
  /** When provided, shows an in-popup "choose account + take screenshot" capture flow. */
  accounts?: EvidencePickerAccount[];
  /** Controlled: which account is currently targeted (drives the banner + capture). */
  selectedAccountId?: string;
  onSelectAccount?: (accountId: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showNonMatching, setShowNonMatching] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [captureErr, setCaptureErr] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<EvidenceItem | null>(null);

  const activeAccount = useMemo(() => {
    if (!accounts?.length) return null;
    return accounts.find((a) => a.id === selectedAccountId) ?? accounts[0] ?? null;
  }, [accounts, selectedAccountId]);

  useEffect(() => {
    if (accounts?.length && !selectedAccountId && onSelectAccount) {
      onSelectAccount(accounts[0]!.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, selectedAccountId]);

  const baseItems = useMemo(() => {
    if (filter === 'screenshots') return items.filter((x) => x.type === 'screenshot');
    if (filter === 'identity') return filterIdentityPacketEvidence(items);
    return items;
  }, [items, filter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = baseItems;
    if (matchAccount && strictAccountMatch && !showNonMatching) {
      list = list.filter((e) =>
        evidenceMatchesAccount({ accountName: matchAccount, candidateType: matchCandidateType, evidence: e }),
      );
    }
    if (!q) return list;
    return list.filter((x) => {
      const hay = `${x.filename || ''} ${x.caption || ''} ${x.sectionKey || ''} ${x.creditorName || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [baseItems, query, matchAccount, matchCandidateType, strictAccountMatch, showNonMatching]);

  const tryPick = (evidenceId: string) => {
    if (!onPick && !onPickMany) return;
    const item = items.find((x) => x.id === evidenceId);
    if (matchAccount && item && strictAccountMatch) {
      const score = scoreEvidenceForAccount({
        accountName: matchAccount,
        candidateType: matchCandidateType,
        evidence: item,
      });
      if (score < EVIDENCE_MATCH_ATTACH_MIN) {
        setErr(describeEvidenceMismatch({ accountName: matchAccount, evidence: item }));
        return;
      }
    }
    setErr(null);
    if (onPickMany) {
      const current = new Set(selectedEvidenceIds ?? []);
      if (current.has(evidenceId)) current.delete(evidenceId);
      else current.add(evidenceId);
      onPickMany(Array.from(current));
      return;
    }
    onPick?.(evidenceId);
  };

  const handleCapture = async () => {
    if (!activeAccount?.tradeline) {
      setCaptureErr('No parsed tradeline found for this account yet — use "Go capture in Credit Intel" or upload a screenshot instead.');
      return;
    }
    setCaptureErr(null);
    setCapturing(true);
    try {
      const item = await captureTradelineEvidenceScreenshot({
        tradeline: activeAccount.tradeline,
        partnerId,
        reportId: activeAccount.reportId ?? reportId,
        creditorName: activeAccount.creditorName,
      });
      onUpsert(item);
      if (onPick || onPickMany) tryPick(item.id);
    } catch (e: any) {
      setCaptureErr(e?.message || 'Screenshot capture failed.');
    } finally {
      setCapturing(false);
    }
  };

  if (!open) return null;

  const bannerName = activeAccount?.label || matchAccount || null;
  const bannerType = activeAccount?.type || matchCandidateType || null;
  const bannerBureau = activeAccount?.bureau ?? null;
  const bannerLast4 = activeAccount?.last4 || null;

  const handleOpen = async (item: EvidenceItem) => {
    setErr(null);
    setBusyId(item.id);
    try {
      const result = await openBlobRefInNewTab({ blobRef: item.blobRef, mimeType: item.mimeType });
      if (!result.ok) setErr(result.message);
    } catch (e: any) {
      setErr(e?.message || 'Failed to open evidence.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-5xl rounded-3xl border border-white/[0.08] bg-fc-shell shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/[0.08] flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Evidence picker</div>
            <div className="mt-2 text-2xl font-light text-white truncate">{title}</div>
            {subtitle ? <div className="mt-1 text-white/60 text-sm">{subtitle}</div> : null}
          </div>
          <div className="flex items-center gap-2">
            {onGoCapture ? (
              <button
                type="button"
                onClick={onGoCapture}
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                title="Fallback: open Credit Intel to capture manually"
              >
                Go capture <ExternalLink size={14} />
              </button>
            ) : null}
            {onOpenFullVault ? (
              <button
                type="button"
                onClick={onOpenFullVault}
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                title="Open full Evidence tab"
              >
                <ExternalLink size={14} /> Full vault
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/10 transition-all"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {bannerName ? (
            <div className="rounded-2xl border-2 border-amber-400/80 bg-amber-500/20 p-4 shadow-[0_0_28px_-6px_rgba(251,191,36,0.5)]">
              <div className="text-[10px] font-black uppercase tracking-widest text-amber-100/90">This screenshot is for</div>
              <div className="mt-1 text-2xl font-bold text-white truncate">{bannerName}</div>
              {bannerType || bannerBureau || bannerLast4 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {bannerType ? <span className={CHIP_CLS}>{bannerType}</span> : null}
                  {bannerBureau ? <span className={CHIP_CLS}>{bureauFullName(bannerBureau)}</span> : null}
                  {bannerLast4 ? <span className={CHIP_CLS}>Acct {bannerLast4}</span> : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {accounts && accounts.length > 0 ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.08] p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-[10px] uppercase tracking-widest text-emerald-200/80 font-black">Capture screenshot here</div>
                {onGoCapture ? (
                  <button
                    type="button"
                    onClick={onGoCapture}
                    className="text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white/80 underline underline-offset-4 transition-colors"
                    title="Fallback: open Credit Intel to capture manually"
                  >
                    Go capture in Credit Intel instead
                  </button>
                ) : null}
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <label className="min-w-[220px] flex-1">
                  <span className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">Account</span>
                  <select
                    value={activeAccount?.id ?? ''}
                    onChange={(e) => onSelectAccount?.(e.target.value)}
                    className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-4 py-2.5 text-white/85 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                        {a.type ? ` — ${a.type}` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => void handleCapture()}
                  disabled={!activeAccount?.tradeline || capturing || !partnerId}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[11px] hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  title={
                    !activeAccount?.tradeline
                      ? 'No parsed tradeline found for this account — use Go capture in Credit Intel instead.'
                      : 'Capture a screenshot for this account'
                  }
                >
                  <Camera size={16} />
                  {capturing ? 'Capturing…' : 'Take screenshot'}
                </button>
              </div>

              {!activeAccount?.tradeline ? (
                <div className="text-xs text-amber-200/80">
                  No parsed tradeline found for this account yet. Use "Go capture in Credit Intel instead" above, or upload a screenshot below.
                </div>
              ) : null}

              {captureErr ? <div className="text-xs text-red-300">{captureErr}</div> : null}
            </div>
          ) : null}

          <EvidenceUploader
            partnerId={partnerId}
            reportId={reportId}
            onCreated={(item) => {
              onUpsert(item);
              if (autoPickOnUpload && onPick) tryPick(item.id);
            }}
          />

          {matchAccount && strictAccountMatch ? (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/15 p-4 text-amber-50 text-sm space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-300" />
                <div>
                  <p className="font-semibold text-amber-100">Account match required</p>
                  <p className="mt-1 leading-relaxed opacity-95">
                    Only attach a screenshot that clearly shows <span className="font-semibold">{matchAccount}</span> on the bureau report.
                    Mismatched exhibits weaken the dispute and can cause bureau rejection.
                  </p>
                </div>
              </div>
              <label className="inline-flex items-center gap-2 text-xs uppercase tracking-wider cursor-pointer opacity-90">
                <input type="checkbox" checked={!showNonMatching} onChange={(e) => setShowNonMatching(!e.target.checked)} />
                Hide non-matching screenshots
              </label>
            </div>
          ) : null}

          {err ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200/90 text-sm">{err}</div>
          ) : null}

          <div className="fc-light-glass-panel fc-light-chrome-panel p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-white font-semibold">Existing evidence</div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search filename/caption/category…"
                className="w-full sm:w-80 bg-fc-input border border-white/[0.08] rounded-xl px-4 py-2 text-white/80 placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-colors text-sm"
              />
            </div>

            {filtered.length === 0 ? (
              <div className="space-y-3">
                <div className="text-white/50 text-sm">{emptyHint || 'No matching evidence.'}</div>
                {onGoCapture ? (
                  <button
                    type="button"
                    onClick={onGoCapture}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                  >
                    Go capture
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((e) => {
                  const busy = busyId === e.id;
                  const selected = selectedEvidenceId === e.id || Boolean(selectedEvidenceIds?.includes(e.id));
                  const matchScore = matchAccount
                    ? scoreEvidenceForAccount({ accountName: matchAccount, candidateType: matchCandidateType, evidence: e })
                    : 1;
                  const canAttach = !matchAccount || !strictAccountMatch || matchScore >= EVIDENCE_MATCH_ATTACH_MIN;
                  return (
                    <div
                      key={e.id}
                      className={`rounded-2xl border p-4 flex flex-wrap items-center justify-between gap-3 ${
                        selected
                          ? 'border-amber-500/40 bg-amber-500/10'
                          : canAttach
                            ? 'border-white/[0.08] bg-white/[0.02]'
                            : 'border-red-500/25 bg-red-500/5 opacity-80'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-white font-semibold truncate">{e.filename}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                          {new Date(e.createdAt).toLocaleString()} • {e.mimeType}
                          {e.creditorName ? ` • ${e.creditorName}` : ''}
                        </div>
                        {e.caption ? <div className="mt-1 text-white/60 text-sm">{e.caption}</div> : null}
                        {matchAccount && !canAttach ? (
                          <div className="mt-2 text-red-200/90 text-xs">{describeEvidenceMismatch({ accountName: matchAccount, evidence: e })}</div>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={(e.sectionKey as CategoryKey | undefined) ?? ''}
                          onChange={(ev) => {
                            const next = ev.target.value as CategoryKey;
                            onUpsert({ ...e, sectionKey: next || undefined });
                          }}
                          className="bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white/80 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                          title="Category"
                        >
                          {CATEGORY_OPTIONS.map((c) => (
                            <option key={c.key} value={c.key}>
                              {c.label}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => void handleOpen(e)}
                          disabled={busy}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/[0.08] text-white/70 hover:text-white hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-60 disabled:cursor-not-allowed"
                          title="Open"
                        >
                          <ExternalLink size={14} />
                          {busy ? 'Loading…' : 'Open'}
                        </button>

                        {onPick ? (
                          <button
                            type="button"
                            onClick={() => tryPick(e.id)}
                            disabled={!canAttach}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            title={canAttach ? 'Attach this evidence' : 'Screenshot does not match this account'}
                          >
                            <Paperclip size={14} />
                            {onPickMany && selected ? 'Remove' : pickLabel}
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => setPendingDelete(e)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <FinelyOsTypedDeleteDialog
        open={Boolean(pendingDelete)}
        title="Delete this file?"
        description="This permanently removes the file from your evidence vault. Attached letters may lose their exhibit link."
        entityLabel={pendingDelete?.filename || pendingDelete?.id}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          const id = pendingDelete.id;
          setPendingDelete(null);
          onDelete(id);
        }}
      />
    </div>
  );
}

