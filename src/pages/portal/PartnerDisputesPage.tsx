import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, FileText, Gavel, ShieldAlert } from 'lucide-react';
import { FinelyOsEmptyState } from '../../features/os/FinelyOsEmptyState';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';
import { computeRestoreEvidenceCoverage } from '../../lib/evidenceCoverage';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { listCasesByPartner } from '../../data/casesRepo';
import { listReportsByPartner } from '../../data/reportsRepo';
import { listEvidenceByPartner } from '../../data/evidenceRepo';
import { listLettersByPartner } from '../../data/lettersRepo';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { PartnerCreditRestoreCommandStrip } from '../../components/partner/PartnerCreditRestoreCommandStrip';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { buildDisputesNoticedItems } from '../../lib/finelyProactiveSignals';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { Button, CollapsibleSection } from '../../components/ui';
import { deriveDisputeCandidates } from '../../creditReports/disputeCandidates';
import type { DisputeCandidate } from '../../domain/creditReports';
import { bureauShortCode } from '../../utils/bureaus';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyUnifiedHubLayout, FinelyUnifiedSection } from '../../features/unified/FinelyUnifiedHubLayout';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_ACCENT_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_NOTICE,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsInlineListItem,
  finelyOsStatusChip,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

export default function PartnerDisputesPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'open' | 'closed' | 'all'>('open');
  type DisputeHubTab = 'overview' | 'needs' | 'tracked' | 'cases';
  const [hubTab, setHubTab] = useState<DisputeHubTab>('overview');

  const { partner } = usePartnerSession();

  const cases = useMemo(() => {
    if (!partner) return [];
    const all = listCasesByPartner(partner.id);
    return status === 'all' ? all : all.filter((c) => c.status === status);
  }, [partner, status]);

  const reports = useMemo(() => {
    if (!partner) return [];
    return listReportsByPartner(partner.id);
  }, [partner]);

  const evidence = useMemo(() => (partner ? listEvidenceByPartner(partner.id) : []), [partner]);
  const letters = useMemo(() => (partner ? listLettersByPartner(partner.id) : []), [partner]);
  const openCasesCount = useMemo(() => cases.filter((c) => c.status === 'open').length, [cases]);

  const latestParsedReport = useMemo(() => {
    for (const r of reports) {
      if (r.parsed) return r;
    }
    return null;
  }, [reports]);

  const candidates = useMemo<DisputeCandidate[]>(() => {
    if (!latestParsedReport?.parsed) return [];
    return deriveDisputeCandidates(latestParsedReport.parsed as any, latestParsedReport.id);
  }, [latestParsedReport?.id]);

  const disputedIndex = useMemo(() => {
    const candidateIdToCaseId = new Map<string, { caseId: string; caseTitle: string; caseStatus: string; bureau: string }>();
    for (const c of cases) {
      for (const it of c.items) {
        if (!it.candidateId) continue;
        candidateIdToCaseId.set(it.candidateId, { caseId: c.id, caseTitle: c.title, caseStatus: c.status, bureau: c.bureau });
      }
    }
    return candidateIdToCaseId;
  }, [cases]);

  const needsDisputing = useMemo(() => candidates.filter((c) => !disputedIndex.has(c.id)), [candidates, disputedIndex]);
  const alreadyDisputed = useMemo(() => candidates.filter((c) => disputedIndex.has(c.id)), [candidates, disputedIndex]);

  const evidenceCoverage = useMemo(
    () =>
      computeRestoreEvidenceCoverage({
        candidates,
        evidenceCount: evidence.length,
        letters,
      }),
    [candidates, evidence.length, letters],
  );

  const needsByBureau = useMemo(() => {
    const m = new Map<string, DisputeCandidate[]>();
    for (const c of needsDisputing) {
      const k = (c.bureau || 'Other').toString();
      m.set(k, [...(m.get(k) ?? []), c]);
    }
    return Array.from(m.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [needsDisputing]);

  const alreadyByBureau = useMemo(() => {
    const m = new Map<string, DisputeCandidate[]>();
    for (const c of alreadyDisputed) {
      const k = (c.bureau || 'Other').toString();
      m.set(k, [...(m.get(k) ?? []), c]);
    }
    return Array.from(m.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [alreadyDisputed]);

  const casesByBureau = useMemo(() => {
    const m = new Map<string, typeof cases>();
    for (const c of cases) {
      const k = (c.bureau || 'Other').toString();
      m.set(k, [...(m.get(k) ?? []), c]);
    }
    return Array.from(m.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [cases]);

  const disputeKpis = useMemo(
    () => [
      { label: 'Candidates', value: String(candidates.length), hint: 'From latest report', accent: 'violet' as const },
      { label: 'Needs disputing', value: String(needsDisputing.length), hint: 'Not in a case yet', accent: 'amber' as const },
      { label: 'Already tracked', value: String(alreadyDisputed.length), hint: 'In dispute cases', accent: 'emerald' as const },
      { label: 'Cases', value: String(cases.length), hint: `${status} view`, accent: 'sky' as const },
    ],
    [candidates.length, needsDisputing.length, alreadyDisputed.length, cases.length, status],
  );

  return (
    <PageShell
      badge="Partner Portal"
      title="Dispute Center"
      subtitle="Your cases are organized per bureau and tracked by round. Generate letters and follow-ups with evidence and reasons."
    >
      {!partner ? (
        <FinelyOsEmptyState
          icon={Gavel}
          title="No partner profile"
          description="Sign in with a partner account, or use Partner Management if you're an admin."
          primaryAction={{ label: 'Back to dashboard', onClick: () => navigate('/dashboard') }}
          secondaryAction={{ label: 'Partner management', onClick: () => navigate('/admin/partners') }}
        />
      ) : (
        <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.disputes]}>
          <div className={FINELY_OS_PAGE}>
            <PartnerCreditRestoreCommandStrip
              partner={partner}
              reportsCount={reports.length}
              evidenceCount={evidence.length}
              lettersCount={letters.length}
              openCasesCount={openCasesCount}
              negativesCount={needsDisputing.length}
            />

            <FinelyNoticedStrip
              items={buildDisputesNoticedItems({
                hasReport: Boolean(latestParsedReport),
                needsDisputingCount: needsDisputing.length,
                lettersCount: letters.length,
                evidenceMissingForDisputes:
                  needsDisputing.length > 0 && evidenceCoverage.withProof < evidenceCoverage.totalCandidates,
              })}
            />
            <FinelyNowDoThisStrip
              currentIndex={
                letters.length > 0 && evidence.length === 0
                  ? 2
                  : needsDisputing.length > 0 && letters.length === 0
                    ? 1
                    : 0
              }
            />

            {!latestParsedReport ? (
              <FinelyOsAlertBanner
                tone="blocking"
                message="Upload and parse a credit report first — Dispute Center needs tradelines from your bureau file."
              />
            ) : needsDisputing.length > 0 && evidenceCoverage.withProof < evidenceCoverage.totalCandidates ? (
              <FinelyOsAlertBanner tone="warning" message={evidenceCoverage.summary} />
            ) : needsDisputing.length > 0 ? (
              <FinelyOsAlertBanner
                tone="info"
                message={`${needsDisputing.length} tradeline(s) ready for dispute — open Letter Studio to pick factual reasons and generate your letter.`}
              />
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => navigate('/portal/dashboard')} className={FINELY_OS_BACK_LINK} title="Back to Partner Dashboard">
                  <ArrowLeft size={16} /> Partner Dashboard
                </button>
                <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_BACK_LINK} title="Back to Finely Cred Dashboard">
                  <ArrowLeft size={16} /> Finely Cred
                </button>
              </div>
            </div>

            <FinelyUnifiedHubLayout
              eyebrow="Dispute center"
              title="Bureau disputes — one tab at a time"
              subtitle="Overview, items needing dispute, tracked tradelines, and active cases."
              accent="emerald"
              kpis={disputeKpis}
              tabs={[
                { id: 'overview', label: 'Overview', badge: needsDisputing.length || undefined },
                { id: 'needs', label: 'Needs disputing', badge: needsDisputing.length || undefined },
                { id: 'tracked', label: 'Tracked', badge: alreadyDisputed.length || undefined },
                { id: 'cases', label: 'Cases', badge: cases.length || undefined },
              ]}
              activeTab={hubTab}
              onTabChange={(id) => setHubTab(id as DisputeHubTab)}
              primaryAction={{ label: 'Letter Studio', onClick: () => navigate('/portal/letters?openPicker=1') }}
              secondaryAction={{ label: 'Upload report', onClick: () => navigate('/portal/reports') }}
            >
              {hubTab === 'overview' && (
                <div className="space-y-4">
                  {latestParsedReport ? (
                    <div className={FINELY_OS_NOTICE}>
                      Using report: <span className={FINELY_OS_ENTITY_VALUE}>{latestParsedReport.filename}</span>
                    </div>
                  ) : (
                    <FinelyOsEmptyState
                      icon={FileText}
                      title="Upload a credit report first"
                      description="Dispute candidates and cases appear after you upload and parse a report."
                      primaryAction={{ label: 'Upload report', onClick: () => navigate('/portal/reports') }}
                      secondaryAction={{ label: 'Partner dashboard', onClick: () => navigate('/portal/partner') }}
                    />
                  )}
                  {latestParsedReport && needsDisputing.length > 0 ? (
                    <FinelyUnifiedSection title="Ready to dispute" subtitle="Open Letter Studio to pick factual reasons.">
                      <p className={FINELY_OS_ENTITY_BODY}>
                        {needsDisputing.length} tradeline(s) are not yet in a dispute case. Capture evidence screenshots first, then generate
                        your bureau letter.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button variant="primary" size="sm" onClick={() => setHubTab('needs')}>
                          View needs disputing <ArrowRight size={14} />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate('/portal/letters?openPicker=1')}>
                          Generate letter <ArrowRight size={14} />
                        </Button>
                      </div>
                    </FinelyUnifiedSection>
                  ) : null}
                </div>
              )}

              {hubTab === 'needs' && (
                <>
            {latestParsedReport && needsDisputing.length ? (
              <CollapsibleSection
                variant="dark"
                title="Needs disputing"
                subtitle="Items detected on your report that are not yet part of a dispute case."
                count={`${needsDisputing.length} item${needsDisputing.length === 1 ? '' : 's'}`}
                defaultOpen
                storageKey={`portal.disputes.needs.${status}`}
              >
                <div className="space-y-4">
                  {needsByBureau.map(([bureau, list]) => (
                    <details key={bureau} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony overflow-hidden`} open>
                      <summary className="cursor-pointer select-none px-5 py-4 flex items-center justify-between gap-3 hover:bg-white/[0.04] transition-colors">
                        <div className={FINELY_OS_ENTITY_VALUE}>{bureau}</div>
                        <div className={FINELY_OS_ENTITY_SUBLABEL}>{list.length}</div>
                      </summary>
                      <div className="p-5 pt-0">
                        <FinelyOsPaginatedStack
                          items={list}
                          pageSize={8}
                          itemSpacingClassName="grid md:grid-cols-2 gap-4"
                          emptyMessage="No items for this bureau."
                          renderItem={(c) => (
                          <div key={c.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
                            <div className="min-w-0">
                              <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{c.account}</div>
                              <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                                {bureauShortCode(c.bureau)} • {c.type} • {c.code}
                              </div>
                              <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>{c.status}</div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <button type="button" onClick={() => navigate('/portal/letters?openPicker=1')} className={FINELY_OS_SUCCESS_BTN}>
                                Select in Letters <ArrowRight size={14} />
                              </button>
                              <button type="button" onClick={() => navigate('/portal/reports?intelTab=collections')} className={FINELY_OS_SECONDARY_BTN}>
                                Open report <ArrowRight size={14} />
                              </button>
                            </div>
                          </div>
                          )}
                        />
                      </div>
                    </details>
                  ))}
                </div>
              </CollapsibleSection>
            ) : (
              <FinelyOsEmptyState
                icon={Gavel}
                title="Nothing needs disputing"
                description="All tradelines from your latest report are already tracked in cases, or your report has no disputable items."
                primaryAction={{ label: 'View cases', onClick: () => setHubTab('cases') }}
                secondaryAction={{ label: 'Upload report', onClick: () => navigate('/portal/reports') }}
              />
            )}
                </>
              )}

              {hubTab === 'tracked' && (
                <>
            {latestParsedReport && alreadyDisputed.length ? (
              <CollapsibleSection
                variant="dark"
                title="Already disputed"
                subtitle="Items that are already tracked inside a dispute case (open or closed)."
                count={`${alreadyDisputed.length} item${alreadyDisputed.length === 1 ? '' : 's'}`}
                defaultOpen={false}
                storageKey={`portal.disputes.already.${status}`}
              >
                <div className="space-y-4">
                  {alreadyByBureau.map(([bureau, list]) => (
                    <details key={bureau} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony overflow-hidden`}>
                      <summary className="cursor-pointer select-none px-5 py-4 flex items-center justify-between gap-3 hover:bg-white/[0.04] transition-colors">
                        <div className={FINELY_OS_ENTITY_VALUE}>{bureau}</div>
                        <div className={FINELY_OS_ENTITY_SUBLABEL}>{list.length}</div>
                      </summary>
                      <div className="p-5 pt-0">
                        <FinelyOsPaginatedStack
                          items={list}
                          pageSize={8}
                          itemSpacingClassName="grid md:grid-cols-2 gap-4"
                          emptyMessage="No items for this bureau."
                          renderItem={(c) => {
                          const hit = disputedIndex.get(c.id) ?? null;
                          return (
                            <div key={c.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
                              <div className="min-w-0">
                                <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{c.account}</div>
                                <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                                  {bureauShortCode(c.bureau)} • {c.type} • {c.code}
                                </div>
                                <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>{c.status}</div>
                              </div>
                              {hit ? (
                                <div className={`${FINELY_OS_NOTICE} text-sm`}>
                                  Case:{' '}
                                  <button type="button" onClick={() => navigate(`/portal/disputes/${hit.caseId}`)} className={FINELY_OS_ENTITY_ACCENT_LINK}>
                                    {hit.caseTitle}
                                  </button>{' '}
                                  <span className="text-white/40">•</span> <span>{hit.caseStatus}</span>
                                </div>
                              ) : null}
                            </div>
                          );
                          }}
                        />
                      </div>
                    </details>
                  ))}
                </div>
              </CollapsibleSection>
            ) : (
              <FinelyOsEmptyState
                icon={FileText}
                title="No tracked disputes yet"
                description="Tradelines appear here once they are part of an open or closed dispute case."
                primaryAction={{ label: 'Needs disputing', onClick: () => setHubTab('needs') }}
              />
            )}
                </>
              )}

              {hubTab === 'cases' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className={FINELY_OS_VIEW_TABS}>
                      {(['open', 'closed', 'all'] as const).map((s) => (
                        <button key={s} type="button" onClick={() => setStatus(s)} className={finelyOsViewTab(status === s, 'emerald')}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
            {cases.length === 0 ? (
              <FinelyOsEmptyState
                icon={Gavel}
                title="No dispute cases yet"
                description="Upload a report, capture screenshots, then generate your bureau letter in Letter Studio to create your first case."
                primaryAction={{ label: 'Upload report', onClick: () => navigate('/portal/reports') }}
                secondaryAction={{ label: 'Open Letter Studio', onClick: () => navigate('/portal/letters') }}
              />
            ) : (
              <div className="space-y-4">
                {casesByBureau.map(([bureau, list]) => (
                  <CollapsibleSection
                    key={bureau}
                    variant="dark"
                    title={`${bureau} cases`}
                    subtitle="Grouped to keep the page short. Open a case to see rounds, evidence, and deadlines."
                    count={`${list.length} case${list.length === 1 ? '' : 's'}`}
                    defaultOpen
                    storageKey={`portal.disputes.${status}.${bureau}`}
                  >
                    <FinelyOsPaginatedStack
                      items={list}
                      pageSize={8}
                      itemSpacingClassName="grid md:grid-cols-2 gap-4"
                      emptyMessage="No cases for this bureau."
                      renderItem={(c) => {
                        const lastRound = c.rounds.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => navigate(`/portal/disputes/${c.id}`)}
                            className={`${finelyOsInlineListItem()} w-full text-left p-6 space-y-4`}
                            title="Open case details"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="inline-flex items-center gap-2 text-violet-300">
                                  <Gavel size={16} />
                                  <span className="text-xs font-semibold uppercase tracking-wider">{bureauShortCode(c.bureau)} case</span>
                                </div>
                                <p className={`mt-2 text-lg font-semibold truncate ${FINELY_OS_ENTITY_VALUE}`}>{c.title}</p>
                                <p className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                                  {c.status} • {c.items.length} items • rounds: {c.rounds.length}
                                </p>
                                {lastRound && (
                                  <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
                                    Latest: <span className={`font-mono ${FINELY_OS_ENTITY_VALUE}`}>{lastRound.round}</span> • Due:{' '}
                                    <span className={FINELY_OS_ENTITY_VALUE}>{lastRound.dueAt ? new Date(lastRound.dueAt).toLocaleDateString() : '—'}</span>
                                  </p>
                                )}
                              </div>
                              {c.status === 'open' ? (
                                <span className={finelyOsStatusChip('ok')}>Active</span>
                              ) : (
                                <span className={FINELY_OS_ENTITY_CHIP}>Closed</span>
                              )}
                            </div>

                            {c.status === 'open' && lastRound?.dueAt && (
                              <div className={`${FINELY_OS_NOTICE_WARN} flex items-start gap-3 text-sm`}>
                                <ShieldAlert size={16} className="text-fuchsia-300 mt-0.5 shrink-0" />
                                <div>
                                  <p className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Follow-up window</p>
                                  <p className="mt-1">
                                    Next follow-up due by <span className="font-semibold">{new Date(lastRound.dueAt).toLocaleDateString()}</span>.
                                  </p>
                                </div>
                              </div>
                            )}
                            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                              Open case <ArrowRight size={12} />
                            </div>
                          </button>
                        );
                      }}
                    />
                  </CollapsibleSection>
                ))}
              </div>
            )}
                </div>
              )}
            </FinelyUnifiedHubLayout>

            <FinelyOsPageFooter />
          </div>
        </EntitlementGate>
      )}
    </PageShell>
  );
}
