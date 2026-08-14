import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, AlertTriangle, Clock, Plus } from 'lucide-react';
import {
  listComplianceReviews,
  approveComplianceReview,
  blockComplianceReview,
  upsertComplianceReview,
  isRecordOverdueForVerification,
  ensureC1ArticleComplianceRecordsSeeded,
  ensureC5OutcomeWizardComplianceRecordsSeeded,
  ensureC4StateDebtDefenseComplianceRecordsSeeded,
  ensureC3ComparisonPageComplianceRecordSeeded,
  ensureC2BeforeAfterGalleryComplianceRecordSeeded,
} from '../../data/complianceReviewRepo';
import {
  CONTENT_TYPE_LABELS,
  RE_VERIFICATION_CADENCE_MONTHS,
  type ComplianceContentType,
  type ComplianceReviewRecord,
} from '../../domain/complianceReview';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_EMPTY,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

function statusTone(status: ComplianceReviewRecord['status']): 'ok' | 'warn' | 'blocked' {
  if (status === 'approved') return 'ok';
  if (status === 'blocked') return 'blocked';
  return 'warn';
}

function buildRecordReasons(record: ComplianceReviewRecord, overdue: boolean): string[] {
  const reasons: string[] = [];
  if (record.status === 'draft') reasons.push('Draft — review has not started yet.');
  if (record.status === 'needs_review') reasons.push('Flagged for review — resolve before this route merges.');
  if (record.status === 'blocked') reasons.push('Blocked — do not publish until re-reviewed and approved.');
  if (!record.sourceRepoRefs.length) reasons.push('No source doctrine repo reference recorded.');
  if (overdue) reasons.push('Re-verification window has lapsed since last approval — treat as unpublishable until re-approved.');
  return reasons;
}

const CONTENT_TYPE_OPTIONS: ComplianceContentType[] = ['public_article', 'state_landing_page', 'outcome_wizard'];

export function ContentComplianceReviewPanel() {
  const [version, setVersion] = useState(0);
  const [reviewerName, setReviewerName] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [newContentType, setNewContentType] = useState<ComplianceContentType>('public_article');
  const [newContentRef, setNewContentRef] = useState('');
  const [newSourceRefs, setNewSourceRefs] = useState('');

  useEffect(() => {
    ensureC1ArticleComplianceRecordsSeeded();
    ensureC5OutcomeWizardComplianceRecordsSeeded();
    ensureC4StateDebtDefenseComplianceRecordsSeeded();
    ensureC3ComparisonPageComplianceRecordSeeded();
    ensureC2BeforeAfterGalleryComplianceRecordSeeded();
    setVersion((v) => v + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const records = useMemo(() => {
    void version;
    return listComplianceReviews().sort((a, b) => {
      const aOverdue = isRecordOverdueForVerification(a);
      const bOverdue = isRecordOverdueForVerification(b);
      if (!!a.highestScrutiny !== !!b.highestScrutiny) return a.highestScrutiny ? -1 : 1;
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
      const aPending = a.status !== 'approved';
      const bPending = b.status !== 'approved';
      if (aPending !== bPending) return aPending ? -1 : 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [version]);

  const pendingCount = records.filter((r) => r.status !== 'approved').length;
  const overdueCount = records.filter(isRecordOverdueForVerification).length;

  const approve = (contentRef: string) => {
    approveComplianceReview(contentRef, reviewerName.trim() || 'admin');
    setVersion((v) => v + 1);
  };
  const block = (contentRef: string) => {
    blockComplianceReview(contentRef, reviewerName.trim() || 'admin');
    setVersion((v) => v + 1);
  };
  const markNeedsReview = (contentRef: string) => {
    const existing = records.find((r) => r.contentRef === contentRef);
    if (!existing) return;
    upsertComplianceReview({ ...existing, status: 'needs_review', reviewedBy: reviewerName.trim() || 'admin' });
    setVersion((v) => v + 1);
  };

  const addRecord = () => {
    const contentRef = newContentRef.trim();
    if (!contentRef) return;
    upsertComplianceReview({
      contentType: newContentType,
      contentRef,
      status: 'draft',
      sourceRepoRefs: newSourceRefs
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    });
    setNewContentRef('');
    setNewSourceRefs('');
    setAddOpen(false);
    setVersion((v) => v + 1);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4">
        <div className="flex items-center gap-2 text-amber-100 font-bold">
          <ShieldCheck size={18} /> Legal/compliance review gate
        </div>
        <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
          Every public article, state landing page, or outcome-wizard result derived from a doctrine repo (debt-litigation,
          business-credit, non-citizen/international) needs an <span className="font-semibold text-white">approved</span> record here
          before its route merges. General articles re-verify every {RE_VERIFICATION_CADENCE_MONTHS.public_article} months; state pages
          every {RE_VERIFICATION_CADENCE_MONTHS.state_landing_page} months (highest scrutiny).
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide">
          <span className={finelyOsStatusChip(pendingCount ? 'warn' : 'ok')}>{pendingCount} pending approval</span>
          <span className={finelyOsStatusChip(overdueCount ? 'blocked' : 'ok')}>{overdueCount} overdue for re-verification</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            placeholder="Your name (recorded as reviewer)"
            className="w-full max-w-xs rounded-lg border border-white/15 bg-black/25 px-3 py-1.5 text-xs text-white placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-amber-400/40"
          />
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setAddOpen((v) => !v)}>
            <Plus size={14} /> Add content for review
          </button>
        </div>
        {addOpen ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 rounded-xl border border-white/10 bg-black/20 p-3">
            <select
              value={newContentType}
              onChange={(e) => setNewContentType(e.target.value as ComplianceContentType)}
              className="rounded-lg border border-white/15 bg-black/25 px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400/40"
            >
              {CONTENT_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {CONTENT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <input
              value={newContentRef}
              onChange={(e) => setNewContentRef(e.target.value)}
              placeholder="Route or article id, e.g. /resources/debt-defense-summons-answer"
              className="rounded-lg border border-white/15 bg-black/25 px-3 py-1.5 text-xs text-white placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-amber-400/40"
            />
            <input
              value={newSourceRefs}
              onChange={(e) => setNewSourceRefs(e.target.value)}
              placeholder="Source doctrine repo(s), comma separated — e.g. debtLitigationDoctrineRepo.ts"
              className="sm:col-span-2 rounded-lg border border-white/15 bg-black/25 px-3 py-1.5 text-xs text-white placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-amber-400/40"
            />
            <div className="sm:col-span-2 flex gap-2">
              <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={addRecord}>
                Create draft record
              </button>
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setAddOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {records.length === 0 ? (
        <div className={FINELY_OS_ENTITY_EMPTY}>
          <p className={FINELY_OS_ENTITY_BODY}>
            No compliance review records yet. Add one per planned article/state-page/wizard before merging its route.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((r) => {
            const overdue = isRecordOverdueForVerification(r);
            const reasons = buildRecordReasons(r, overdue);
            return (
              <div key={r.id} className={finelyOsCatalogCardCompact(r.highestScrutiny ? 'rose' : 'violet')}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white break-all">{r.contentRef}</span>
                      <span className={finelyOsStatusChip(statusTone(r.status))}>{r.status.replace('_', ' ')}</span>
                      {r.highestScrutiny ? (
                        <span className={finelyOsStatusChip('blocked')}>
                          <AlertTriangle size={10} className="inline -mt-0.5 mr-1" />
                          Highest scrutiny
                        </span>
                      ) : null}
                      {overdue ? (
                        <span className={finelyOsStatusChip('warn')}>
                          <Clock size={10} className="inline -mt-0.5 mr-1" />
                          Needs re-verification
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[11px] text-white/50">
                      {CONTENT_TYPE_LABELS[r.contentType]} · sources: {r.sourceRepoRefs.join(', ') || 'none recorded'}
                      {r.nextVerificationDueAt
                        ? ` · next verification due ${new Date(r.nextVerificationDueAt).toLocaleDateString()}`
                        : ''}
                      {r.reviewedBy ? ` · last reviewed by ${r.reviewedBy}` : ''}
                    </p>
                    {reasons.length ? (
                      <ul className="mt-2 text-xs text-amber-200/90 list-disc pl-4">
                        {reasons.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    ) : null}
                    {r.reviewNotes ? <p className="mt-2 text-xs text-white/60 italic">&ldquo;{r.reviewNotes}&rdquo;</p> : null}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.status !== 'approved' ? (
                    <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => approve(r.contentRef)}>
                      Approve
                    </button>
                  ) : null}
                  {r.status !== 'blocked' ? (
                    <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => block(r.contentRef)}>
                      Block
                    </button>
                  ) : null}
                  {overdue ? (
                    <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => markNeedsReview(r.contentRef)}>
                      Flag for re-review
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
