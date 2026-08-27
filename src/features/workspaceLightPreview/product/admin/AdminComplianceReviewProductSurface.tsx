import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Clock, Plus, Search, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
} from '../../../../data/complianceReviewRepo';
import {
  CONTENT_TYPE_LABELS,
  RE_VERIFICATION_CADENCE_MONTHS,
  type ComplianceContentType,
  type ComplianceReviewRecord,
} from '../../../../domain/complianceReview';
import { FinelyOsAlertBanner } from '../../../os/FinelyOsAlertBanner';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_EMPTY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';

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
  if (overdue) reasons.push('Re-verification window has lapsed — treat as unpublishable until re-approved.');
  return reasons;
}

const CONTENT_TYPE_OPTIONS: ComplianceContentType[] = ['public_article', 'state_landing_page', 'outcome_wizard'];

const TYPE_ACCENTS: Record<ComplianceContentType, 'emerald' | 'violet' | 'sky'> = {
  public_article: 'emerald',
  state_landing_page: 'violet',
  outcome_wizard: 'sky',
};

export default function AdminComplianceReviewProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'rose';

  const [version, setVersion] = useState(0);
  const [reviewerName, setReviewerName] = useState('');
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [queueFilter, setQueueFilter] = useState<'all' | 'pending' | 'overdue' | 'blocked'>('all');
  const [typeFocus, setTypeFocus] = useState<ComplianceContentType | null>(null);
  const [q, setQ] = useState('');
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

  const filteredRecords = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return records.filter((r) => {
      if (typeFocus && r.contentType !== typeFocus) return false;
      if (queueFilter === 'pending' && r.status === 'approved') return false;
      if (queueFilter === 'overdue' && !isRecordOverdueForVerification(r)) return false;
      if (queueFilter === 'blocked' && r.status !== 'blocked') return false;
      if (needle && !r.contentRef.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [records, queueFilter, typeFocus, q]);

  const selected = useMemo(
    () => records.find((r) => r.contentRef === selectedRef) ?? filteredRecords[0] ?? records[0] ?? null,
    [records, filteredRecords, selectedRef],
  );

  useEffect(() => {
    if (!selectedRef && filteredRecords[0]) setSelectedRef(filteredRecords[0].contentRef);
  }, [filteredRecords, selectedRef]);

  const pendingCount = records.filter((r) => r.status !== 'approved').length;
  const overdueCount = records.filter(isRecordOverdueForVerification).length;
  const blockedCount = records.filter((r) => r.status === 'blocked').length;
  const scrutinyCount = records.filter((r) => r.highestScrutiny).length;

  const typeStats = useMemo(() => {
    return CONTENT_TYPE_OPTIONS.map((type) => {
      const typeRecords = records.filter((r) => r.contentType === type);
      return {
        type,
        total: typeRecords.length,
        pending: typeRecords.filter((r) => r.status !== 'approved').length,
        overdue: typeRecords.filter(isRecordOverdueForVerification).length,
        blocked: typeRecords.filter((r) => r.status === 'blocked').length,
        accent: TYPE_ACCENTS[type],
        cadence: RE_VERIFICATION_CADENCE_MONTHS[type],
      };
    });
  }, [records]);

  const overdueRecords = useMemo(
    () => records.filter(isRecordOverdueForVerification).slice(0, 5),
    [records],
  );

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
    setSelectedRef(contentRef);
    setTypeFocus(newContentType);
    setVersion((v) => v + 1);
  };

  const selectedOverdue = selected ? isRecordOverdueForVerification(selected) : false;
  const selectedReasons = selected ? buildRecordReasons(selected, selectedOverdue) : [];

  const QUEUE_FILTERS: Array<{ id: typeof queueFilter; label: string; accent: 'emerald' | 'violet' | 'sky' | 'rose' }> = [
    { id: 'all', label: 'All', accent: 'emerald' },
    { id: 'pending', label: 'Pending', accent: 'rose' },
    { id: 'overdue', label: 'Overdue', accent: 'violet' },
    { id: 'blocked', label: 'Blocked', accent: 'sky' },
  ];

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Delivery"
      title="Compliance review"
      description="Approve doctrine-derived public content before its routes ship."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'light'}
      archetype={archetype}
      icon={navItem?.icon}
      primaryAction={
        <ProductPagePrimaryAction label="Content resources" onClick={() => navigate('/admin/resources')} />
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => setAddOpen((v) => !v)}>
          Add content
        </button>
      }
      metrics={[
        {
          label: 'Pending',
          value: String(pendingCount),
          hint: 'Awaiting approval',
          accent: 'rose',
          onClick: () => {
            setQueueFilter('pending');
            setTypeFocus(null);
          },
        },
        {
          label: 'Overdue',
          value: String(overdueCount),
          hint: 'Needs re-verification',
          accent: 'violet',
          onClick: () => {
            setQueueFilter('overdue');
            setTypeFocus(null);
          },
        },
        {
          label: 'Blocked',
          value: String(blockedCount),
          hint: 'Do not publish',
          accent: 'sky',
          onClick: () => {
            setQueueFilter('blocked');
            setTypeFocus(null);
          },
        },
        {
          label: 'Total',
          value: String(records.length),
          hint: 'In review queue',
          accent: 'emerald',
          onClick: () => {
            setQueueFilter('all');
            setTypeFocus(null);
          },
        },
      ]}
      metricTitle="Review gate"
      metricDescription="Control room grid filters the queue — pick a record to approve or block."
    >
      <div className={FINELY_OS_PAGE} data-surface-layout="control-room">
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          <div className="lg:col-span-9 space-y-6">
            <section className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-5`} data-fc-accent="sky">
              <div>
                <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                  <ShieldCheck size={18} />
                  <span>Doctrine coverage grid</span>
                </div>
                <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                  General articles re-verify every {RE_VERIFICATION_CADENCE_MONTHS.public_article} months; state pages every{' '}
                  {RE_VERIFICATION_CADENCE_MONTHS.state_landing_page} months.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {typeStats.map((stat) => {
                  const active = typeFocus === stat.type;
                  return (
                    <button
                      key={stat.type}
                      type="button"
                      onClick={() => {
                        setTypeFocus(active ? null : stat.type);
                        setQueueFilter('all');
                      }}
                      className={`${finelyOsCatalogCard(stat.accent)} p-5 lg:p-6 text-left transition hover:brightness-[1.02] ${
                        active ? 'ring-2 ring-white/25' : ''
                      }`}
                      data-fc-accent={stat.accent}
                    >
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>{CONTENT_TYPE_LABELS[stat.type]}</div>
                      <div className={`mt-2 text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{stat.total}</div>
                      <div className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                        {stat.pending} pending · {stat.overdue} overdue
                      </div>
                      {stat.blocked > 0 ? (
                        <div className={`mt-2 text-sm font-extrabold text-rose-300`}>{stat.blocked} blocked</div>
                      ) : null}
                      <div className={`mt-2 text-xs font-bold ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
                        Re-verify every {stat.cadence} months
                      </div>
                    </button>
                  );
                })}
              </div>

              {typeFocus ? (
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setTypeFocus(null)}>
                  Clear type filter — show all content types
                </button>
              ) : null}
            </section>

            <div className="grid gap-6 lg:grid-cols-12 items-start min-h-[440px]">
              <aside
                className={`lg:col-span-4 flex flex-col gap-4 ${finelyOsCatalogCard('rose')} p-5 lg:p-6`}
                data-fc-accent="rose"
              >
                <div>
                  <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                    <ShieldCheck size={16} />
                    <span>Review queue</span>
                  </div>
                  <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                    {filteredRecords.length} record{filteredRecords.length === 1 ? '' : 's'}
                    {overdueCount ? ` · ${overdueCount} overdue` : ''}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2" role="group" aria-label="Queue filters">
                  {QUEUE_FILTERS.map((filter) => {
                    const active = queueFilter === filter.id;
                    return (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setQueueFilter(filter.id)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-extrabold transition ${
                          active ? 'border-rose-400 bg-rose-500/15 text-rose-900' : 'border-black/10 bg-white/60 hover:border-rose-300'
                        }`}
                        data-fc-accent={filter.accent}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3">
                  <Search size={16} className="text-rose-400 shrink-0" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search route or article id…"
                    className={`bg-transparent outline-none text-base w-full ${FINELY_OS_ENTITY_VALUE} placeholder:text-white/35`}
                  />
                </div>

                <label className="block">
                  <div className={FINELY_OS_ENTITY_LABEL}>Reviewer name</div>
                  <input
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="Recorded on approve/block"
                    className={`${FINELY_OS_ENTITY_INPUT} mt-1`}
                  />
                </label>

                <button type="button" className={`${FINELY_OS_SECONDARY_BTN} w-full`} onClick={() => setAddOpen((v) => !v)}>
                  <Plus size={14} /> Add content for review
                </button>

                {addOpen ? (
                  <div className={`${finelyOsCatalogCard('sky')} p-4 space-y-3`} data-fc-accent="sky">
                    <select
                      value={newContentType}
                      onChange={(e) => setNewContentType(e.target.value as ComplianceContentType)}
                      className={FINELY_OS_ENTITY_INPUT}
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
                      placeholder="Route or article id"
                      className={FINELY_OS_ENTITY_INPUT}
                    />
                    <input
                      value={newSourceRefs}
                      onChange={(e) => setNewSourceRefs(e.target.value)}
                      placeholder="Source doctrine repo(s), comma separated"
                      className={FINELY_OS_ENTITY_INPUT}
                    />
                    <div className="flex gap-2">
                      <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={addRecord}>
                        Create draft
                      </button>
                      <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setAddOpen(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="flex-1 space-y-2 overflow-y-auto max-h-[24rem] min-h-[10rem]">
                  {filteredRecords.length === 0 ? (
                    <div className={FINELY_OS_ENTITY_EMPTY}>
                      <p className={FINELY_OS_ENTITY_BODY}>No records match this filter.</p>
                    </div>
                  ) : (
                    filteredRecords.map((r) => {
                      const overdue = isRecordOverdueForVerification(r);
                      const active = selected?.contentRef === r.contentRef;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setSelectedRef(r.contentRef)}
                          className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                            active
                              ? 'border-violet-400/50 bg-violet-500/15'
                              : 'border-white/10 bg-black/15 hover:border-white/25'
                          }`}
                        >
                          <div className={`text-base font-extrabold truncate ${FINELY_OS_ENTITY_VALUE}`}>{r.contentRef}</div>
                          <div className={`mt-1 flex flex-wrap gap-1 ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
                            <span className={finelyOsStatusChip(statusTone(r.status))}>{r.status.replace('_', ' ')}</span>
                            {r.highestScrutiny ? <span className={finelyOsStatusChip('blocked')}>High scrutiny</span> : null}
                            {overdue ? <span className={finelyOsStatusChip('warn')}>Overdue</span> : null}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </aside>

              <main className={`lg:col-span-8 ${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-5`} data-fc-accent="emerald">
                {!selected ? (
                  <div className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Select a record from the queue to inspect.</div>
                ) : (
                  <>
                    <div>
                      <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                        <AlertTriangle size={16} />
                        <span>Record inspector</span>
                      </div>
                      <h2 className={`mt-2 text-3xl font-extrabold break-all ${FINELY_OS_ENTITY_VALUE}`}>{selected.contentRef}</h2>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className={finelyOsStatusChip(statusTone(selected.status))}>{selected.status.replace('_', ' ')}</span>
                        {selected.highestScrutiny ? (
                          <span className={finelyOsStatusChip('blocked')}>
                            <AlertTriangle size={10} className="inline -mt-0.5 mr-1" />
                            Highest scrutiny
                          </span>
                        ) : null}
                        {selectedOverdue ? (
                          <span className={finelyOsStatusChip('warn')}>
                            <Clock size={10} className="inline -mt-0.5 mr-1" />
                            Needs re-verification
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div
                      className={`rounded-xl border border-sky-500/25 bg-sky-500/10 p-4 ${FINELY_OS_ENTITY_BODY} text-base font-semibold`}
                    >
                      {CONTENT_TYPE_LABELS[selected.contentType]} · sources:{' '}
                      {selected.sourceRepoRefs.join(', ') || 'none recorded'}
                      {selected.nextVerificationDueAt
                        ? ` · next verification due ${new Date(selected.nextVerificationDueAt).toLocaleDateString()}`
                        : ''}
                      {selected.reviewedBy ? ` · last reviewed by ${selected.reviewedBy}` : ''}
                    </div>

                    {selectedReasons.length ? (
                      <div className={`${finelyOsCatalogCard('violet')} p-5 space-y-2`} data-fc-accent="violet">
                        <div className={FINELY_OS_ENTITY_SUBLABEL}>Findings</div>
                        <ul className={`${FINELY_OS_ENTITY_BODY} text-base font-semibold list-disc pl-5 space-y-1`}>
                          {selectedReasons.map((reason) => (
                            <li key={reason}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-base font-bold text-emerald-100">
                        No blockers recorded — ready for approval.
                      </div>
                    )}

                    {selected.reviewNotes ? (
                      <p className={`${FINELY_OS_ENTITY_BODY} italic text-base`}>&ldquo;{selected.reviewNotes}&rdquo;</p>
                    ) : null}

                    <div className="flex flex-wrap gap-3 pt-2 border-t border-white/10">
                      {selected.status !== 'approved' ? (
                        <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => approve(selected.contentRef)}>
                          Approve
                        </button>
                      ) : null}
                      {selected.status !== 'blocked' ? (
                        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => block(selected.contentRef)}>
                          Block
                        </button>
                      ) : null}
                      {selectedOverdue ? (
                        <button
                          type="button"
                          className={FINELY_OS_SECONDARY_BTN}
                          onClick={() => markNeedsReview(selected.contentRef)}
                        >
                          Flag for re-review
                        </button>
                      ) : null}
                    </div>
                  </>
                )}
              </main>
            </div>
          </div>

          <aside className="lg:col-span-3 space-y-4">
            <div className={`${finelyOsCatalogCard('rose')} p-5 lg:p-6 space-y-4`} data-fc-accent="rose">
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <ShieldAlert size={16} />
                <span>Alert rail</span>
              </div>

              {pendingCount > 0 ? (
                <FinelyOsAlertBanner
                  tone="warning"
                  message={`${pendingCount} record${pendingCount === 1 ? '' : 's'} still need approval before routes merge.`}
                />
              ) : (
                <FinelyOsAlertBanner tone="success" message="All doctrine-derived routes are approved." />
              )}

              {overdueCount > 0 ? (
                <FinelyOsAlertBanner
                  tone="warning"
                  message={`${overdueCount} overdue for re-verification — treat as unpublishable until re-approved.`}
                />
              ) : null}

              {blockedCount > 0 ? (
                <FinelyOsAlertBanner tone="blocking" message={`${blockedCount} blocked — do not publish until cleared.`} />
              ) : null}

              {scrutinyCount > 0 ? (
                <FinelyOsAlertBanner
                  tone="info"
                  message={`${scrutinyCount} under highest scrutiny — extra review required.`}
                />
              ) : null}
            </div>

            {overdueRecords.length > 0 ? (
              <div className={`${finelyOsCatalogCard('violet')} p-5 lg:p-6 space-y-3`} data-fc-accent="violet">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Overdue runway</div>
                <ul className="space-y-2">
                  {overdueRecords.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setSelectedRef(r.contentRef);
                        setQueueFilter('overdue');
                      }}
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-left hover:border-violet-400/40 transition"
                    >
                      <div className={`text-sm font-extrabold truncate ${FINELY_OS_ENTITY_VALUE}`}>{r.contentRef}</div>
                      <div className={`text-xs font-bold ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
                        {CONTENT_TYPE_LABELS[r.contentType]}
                      </div>
                    </button>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className={`${finelyOsCatalogCard('emerald')} p-5 lg:p-6 space-y-3`} data-fc-accent="emerald">
              <div className={FINELY_OS_ENTITY_VALUE}>Quick jumps</div>
              <button type="button" className={`${FINELY_OS_SECONDARY_BTN} w-full`} onClick={() => navigate('/admin/resources')}>
                Content resources
              </button>
              <button type="button" className={`${FINELY_OS_SECONDARY_BTN} w-full`} onClick={() => navigate('/admin/cms')}>
                Site content deck
              </button>
            </div>
          </aside>
        </div>
      </div>

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
