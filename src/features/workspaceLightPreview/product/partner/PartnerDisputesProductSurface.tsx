import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CircleHelp,
  Clock,
  FileText,
  Gavel,
  PlayCircle,
  ShieldAlert,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { ENTITLEMENT_KEYS } from '../../../../billing/entitlements';
import { EntitlementGate } from '../../../../components/billing/EntitlementGate';
import { DisputeCaseWorkflowPanel } from '../../../../components/disputes/DisputeCaseWorkflowPanel';
import { DisputeLaneHandoffStrip } from '../../../../components/disputes/DisputeLaneHandoffStrip';
import { SmartProofUploader } from '../../../../components/evidence/SmartProofUploader';
import { Button } from '../../../../components/ui';
import { deriveDisputeCandidates } from '../../../../creditReports/disputeCandidates';
import { getCase, listCasesByPartner } from '../../../../data/casesRepo';
import { saveDisputeLaneFocus } from '../../../../data/disputeLaneStateRepo';
import { getPartnerSync } from '../../../../data/partnersRepo';
import { listEvidenceByPartner } from '../../../../data/evidenceRepo';
import { listLettersByPartner } from '../../../../data/lettersRepo';
import { listReportsByPartner } from '../../../../data/reportsRepo';
import type { DisputeCandidate } from '../../../../domain/creditReports';
import { FinelyOsAlertBanner } from '../../../../features/os/FinelyOsAlertBanner';
import { FinelyOsPaginatedStack } from '../../../../features/os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PAGE,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsCatalogCard,
  finelyOsStatusChip,
  finelyOsViewTab,
} from '../../../../features/os/finelyOsLightUi';
import { computeRestoreEvidenceCoverage } from '../../../../lib/evidenceCoverage';
import { describeDisputeEffectiveness, summarizeDisputeEffectiveness } from '../../../../lib/disputeEffectiveness';
import { syncDisputeDeadlinePassedTasks } from '../../../../lib/disputeDeadlineEngine';
import {
  disputeCaseHref,
  disputeHubHref,
  resolveDisputeProductPath,
} from '../../../../lib/disputeProductPaths';
import { bureauFullName, bureauShortCode } from '../../../../utils/bureaus';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import {
  useMappedPartnerNavigate,
  usePartnerProductPathResolver,
} from './usePartnerProductNavigation';
import './partnerDisputesSurface.css';

type QueueMode = 'needs' | 'cases' | 'tracked';
type CaseStatusFilter = 'open' | 'closed' | 'all';

const ACCENT_ROTATION = ['emerald', 'violet', 'sky', 'rose'] as const;

const RUNWAY_SIGNALS = [
  { label: 'Outcomes logged', hint: 'Win, loss, and no-reply rates', accent: 'emerald' as const, icon: Target },
  { label: 'Follow-up windows', hint: 'Bureau round deadlines', accent: 'rose' as const, icon: Clock },
  { label: 'Proof gate', hint: 'Evidence before mailing', accent: 'violet' as const, icon: ShieldCheck },
] as const;

function normalizeQueueMode(raw: string | null): QueueMode {
  if (raw === 'needs' || raw === 'tracked' || raw === 'cases') return raw;
  return 'needs';
}

export default function PartnerDisputesProductSurface({
  role,
  pageId,
  partnerId,
  entityId,
  dataMode,
}: WorkspaceProductSurfaceProps) {
  const navigate = useMappedPartnerNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const { pathname, search } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { partner: sessionPartner } = usePartnerSession();
  const isDemo = dataMode === 'demo' || !partnerId;

  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? Gavel;
  const accent = navItem?.accent ?? 'rose';
  const surfaceMode = navItem?.surfaceMode ?? 'light';

  const [queueMode, setQueueMode] = useState<QueueMode>(() => normalizeQueueMode(searchParams.get('tab')));
  const [caseStatus, setCaseStatus] = useState<CaseStatusFilter>('open');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [bureauFilter, setBureauFilter] = useState<string>('all');
  const [workflowVersion, setWorkflowVersion] = useState(0);

  const selectedCaseId = searchParams.get('caseId')?.trim() || entityId || undefined;

  const partner = useMemo(() => {
    if (partnerId) return getPartnerSync(partnerId) ?? sessionPartner;
    return sessionPartner;
  }, [partnerId, sessionPartner]);

  const go = (path: string) => navigate(resolveDisputeProductPath(path, pathname));

  useEffect(() => {
    if (!partner) return;
    syncDisputeDeadlinePassedTasks(partner.id);
  }, [partner?.id]);

  useEffect(() => {
    const fromUrl = normalizeQueueMode(searchParams.get('tab'));
    setQueueMode((prev) => (prev === fromUrl ? prev : fromUrl));
  }, [searchParams]);

  const allPartnerCases = useMemo(() => (partner ? listCasesByPartner(partner.id) : []), [partner, workflowVersion]);

  const cases = useMemo(() => {
    if (caseStatus === 'all') return allPartnerCases;
    return allPartnerCases.filter((c) => c.status === caseStatus);
  }, [allPartnerCases, caseStatus]);

  const reports = useMemo(() => (partner ? listReportsByPartner(partner.id) : []), [partner]);
  const evidence = useMemo(() => (partner ? listEvidenceByPartner(partner.id) : []), [partner]);
  const letters = useMemo(() => (partner ? listLettersByPartner(partner.id) : []), [partner]);
  const openCasesCount = useMemo(() => allPartnerCases.filter((c) => c.status === 'open').length, [allPartnerCases]);

  const latestParsedReport = useMemo(() => {
    for (const r of reports) {
      if (r.parsed) return r;
    }
    return null;
  }, [reports]);

  const candidates = useMemo<DisputeCandidate[]>(() => {
    if (!latestParsedReport?.parsed) return [];
    return deriveDisputeCandidates(latestParsedReport.parsed as Parameters<typeof deriveDisputeCandidates>[0], latestParsedReport.id);
  }, [latestParsedReport]);

  const disputedIndex = useMemo(() => {
    const candidateIdToCaseId = new Map<string, { caseId: string; caseTitle: string; caseStatus: string; bureau: string }>();
    for (const c of allPartnerCases) {
      for (const it of c.items) {
        if (!it.candidateId) continue;
        candidateIdToCaseId.set(it.candidateId, {
          caseId: c.id,
          caseTitle: c.title,
          caseStatus: c.status,
          bureau: c.bureau,
        });
      }
    }
    return candidateIdToCaseId;
  }, [allPartnerCases]);

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

  const effectiveness = useMemo(() => summarizeDisputeEffectiveness(allPartnerCases), [allPartnerCases]);

  const bureauOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of candidates) set.add((c.bureau || 'Other').toString());
    for (const c of allPartnerCases) set.add((c.bureau || 'Other').toString());
    return Array.from(set).sort();
  }, [candidates, allPartnerCases]);

  const queueNeeds = useMemo(() => {
    if (bureauFilter === 'all') return needsDisputing;
    return needsDisputing.filter((item) => (item.bureau || 'Other').toString() === bureauFilter);
  }, [needsDisputing, bureauFilter]);
  const queueTracked = useMemo(() => {
    if (bureauFilter === 'all') return alreadyDisputed;
    return alreadyDisputed.filter((item) => (item.bureau || 'Other').toString() === bureauFilter);
  }, [alreadyDisputed, bureauFilter]);
  const queueCases = useMemo(() => {
    if (bureauFilter === 'all') return cases;
    return cases.filter((item) => (item.bureau || 'Other').toString() === bureauFilter);
  }, [cases, bureauFilter]);

  const selectedCase = useMemo(() => {
    if (!selectedCaseId) return null;
    return getCase(selectedCaseId);
  }, [selectedCaseId, workflowVersion]);

  const selectedCandidate = useMemo(() => {
    if (!selectedCandidateId) return null;
    return candidates.find((c) => c.id === selectedCandidateId) ?? null;
  }, [candidates, selectedCandidateId]);

  const upcomingDeadline = useMemo(() => {
    let nearest: { caseTitle: string; dueAt: string; caseId: string } | null = null;
    for (const c of allPartnerCases) {
      if (c.status !== 'open') continue;
      const lastRound = c.rounds.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      if (!lastRound?.dueAt) continue;
      if (!nearest || lastRound.dueAt < nearest.dueAt) {
        nearest = { caseTitle: c.title, dueAt: lastRound.dueAt, caseId: c.id };
      }
    }
    return nearest;
  }, [allPartnerCases]);

  const handleQueueModeChange = (mode: QueueMode) => {
    setQueueMode(mode);
    setSelectedCandidateId(null);
    const params = new URLSearchParams(searchParams);
    params.delete('caseId');
    if (mode === 'needs') params.delete('tab');
    else params.set('tab', mode);
    setSearchParams(params, { replace: true });
  };

  const openCase = (caseId: string) => {
    setSelectedCandidateId(null);
    navigate(disputeCaseHref(caseId, pathname, search));
  };

  const closeCase = () => {
    navigate(disputeHubHref(pathname, search));
  };

  const metrics: ProductMetric[] = [
    {
      label: 'Needs dispute',
      value: needsDisputing.length,
      hint: 'Not in a case yet',
      accent: 'rose',
      icon: Gavel,
      onClick: () => handleQueueModeChange('needs'),
    },
    {
      label: 'Active cases',
      value: openCasesCount,
      hint: openCasesCount ? 'Open bureau cases' : 'None open',
      accent: 'violet',
      icon: FileText,
      onClick: () => {
        setCaseStatus('open');
        handleQueueModeChange('cases');
      },
    },
    {
      label: 'Proof linked',
      value: `${evidenceCoverage.withProof}/${evidenceCoverage.totalCandidates || 0}`,
      hint: evidenceCoverage.summary,
      accent: 'emerald',
      icon: ShieldCheck,
      onClick: () => go('/portal/evidence'),
    },
    {
      label: 'Outcomes',
      value: effectiveness.logged ? `${effectiveness.winRatePct ?? 0}% win` : '—',
      hint: effectiveness.logged ? describeDisputeEffectiveness(effectiveness) : 'Log round outcomes',
      accent: 'sky',
      icon: Target,
      onClick: () => handleQueueModeChange('cases'),
    },
  ];

  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button
        type="button"
        onClick={() => openProductCopilot({ prompt: 'What should I dispute on my credit report?', contextLabel: 'Disputes' })}
      >
        <CircleHelp size={15} /> Ask Finely
      </button>
      <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
        <PlayCircle size={15} /> Watch how
      </button>
    </div>
  );

  if (isDemo && !partner) {
    return (
      <ProductEmptyState
        title="Sign in to open Dispute Center"
        description="Track bureau rounds, link proof, and log outcomes — one case per bureau with follow-up deadlines."
        action={
          <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate('/login')}>
            Sign in
          </button>
        }
      />
    );
  }

  if (!partner) {
    return (
      <ProductEmptyState
        title="Partner profile not found"
        description="Return to the dashboard and pick a partner context, or sign in with a partner account."
        action={
          <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(mapPortalHref('/portal/dashboard'))}>
            Return to dashboard
          </button>
        }
      />
    );
  }

  const runwayBody = (
    <header className="fc-wlp-dispute-runway-band" aria-label="Dispute runway">
      <div className="fc-wlp-dispute-runway-main">
        <span className="fc-wlp-dispute-runway-eyebrow">
          <Gavel size={14} /> Bureau disputes
        </span>
        <h2 className="fc-wlp-dispute-runway-title">Your dispute runway</h2>
        <p className="fc-wlp-dispute-runway-purpose">
          Pick tradelines from your report, mail with proof, then track each bureau round and follow-up window.
        </p>
      </div>
      <div className="fc-wlp-dispute-runway-signals">
        {RUNWAY_SIGNALS.map((signal, index) => {
          const Icon = signal.icon;
          const accentKey = ACCENT_ROTATION[index % ACCENT_ROTATION.length];
          let hint: string = signal.hint;
          if (signal.label === 'Outcomes logged') {
            hint = effectiveness.logged ? describeDisputeEffectiveness(effectiveness) : 'Log outcomes on rounds';
          } else if (signal.label === 'Follow-up windows') {
            hint = upcomingDeadline
              ? `${upcomingDeadline.caseTitle} due ${new Date(upcomingDeadline.dueAt).toLocaleDateString()}`
              : 'No deadlines due';
          } else if (signal.label === 'Proof gate') {
            hint = evidenceCoverage.summary;
          }
          return (
            <div key={signal.label} className="fc-wlp-dispute-runway-signal" data-fc-accent={accentKey}>
              <span className="fc-wlp-dispute-runway-signal-icon">
                <Icon size={16} strokeWidth={2.2} />
              </span>
              <span className="fc-wlp-dispute-runway-signal-copy">
                <strong>{signal.label}</strong>
                <span>{hint}</span>
              </span>
            </div>
          );
        })}
      </div>
    </header>
  );

  const alertBanners = (
    <>
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
          message={`${needsDisputing.length} tradeline${needsDisputing.length === 1 ? '' : 's'} ready — open Letter Studio to pick factual reasons and generate your letter.`}
        />
      ) : null}
    </>
  );

  const queueListItems = () => {
    if (queueMode === 'needs') {
      return (
        <FinelyOsPaginatedStack
          items={queueNeeds}
          pageSize={10}
          emptyMessage="Nothing needs disputing in this bureau filter."
          itemSpacingClassName="fc-wlp-dispute-queue-list"
          renderItem={(c) => (
            <button
              key={c.id}
              type="button"
              className="fc-wlp-dispute-queue-item"
              data-selected={selectedCandidateId === c.id && !selectedCaseId ? 'true' : undefined}
              onClick={() => {
                setSelectedCandidateId(c.id);
                closeCase();
              }}
            >
              <div className="fc-wlp-dispute-queue-item-title">{c.account}</div>
              <div className="fc-wlp-dispute-queue-item-meta">
                {bureauShortCode(c.bureau)} · {c.type} · {c.code}
              </div>
            </button>
          )}
        />
      );
    }

    if (queueMode === 'tracked') {
      return (
        <FinelyOsPaginatedStack
          items={queueTracked}
          pageSize={10}
          emptyMessage="No tracked tradelines in this bureau filter."
          itemSpacingClassName="fc-wlp-dispute-queue-list"
          renderItem={(c) => {
            const hit = disputedIndex.get(c.id);
            return (
              <button
                key={c.id}
                type="button"
                className="fc-wlp-dispute-queue-item"
                data-selected={selectedCandidateId === c.id && !selectedCaseId ? 'true' : undefined}
                onClick={() => {
                  setSelectedCandidateId(c.id);
                  if (hit) openCase(hit.caseId);
                  else closeCase();
                }}
              >
                <div className="fc-wlp-dispute-queue-item-title">{c.account}</div>
                <div className="fc-wlp-dispute-queue-item-meta">
                  {bureauShortCode(c.bureau)} · {hit?.caseTitle ?? 'Tracked'}
                </div>
              </button>
            );
          }}
        />
      );
    }

    return (
      <FinelyOsPaginatedStack
        items={queueCases}
        pageSize={10}
        emptyMessage="No cases in this bureau filter."
        itemSpacingClassName="fc-wlp-dispute-queue-list"
        renderItem={(c) => {
          const lastRound = c.rounds.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
          return (
            <button
              key={c.id}
              type="button"
              className="fc-wlp-dispute-queue-item"
              data-selected={selectedCaseId === c.id ? 'true' : undefined}
              onClick={() => openCase(c.id)}
            >
              <div className="fc-wlp-dispute-queue-item-title">{c.title}</div>
              <div className="fc-wlp-dispute-queue-item-meta">
                {bureauShortCode(c.bureau)} · {c.status} · {c.rounds.length} round{c.rounds.length === 1 ? '' : 's'}
                {lastRound?.dueAt ? ` · due ${new Date(lastRound.dueAt).toLocaleDateString()}` : ''}
              </div>
            </button>
          );
        }}
      />
    );
  };

  const candidateDetail = selectedCandidate && !selectedCaseId ? (
    <div className={`${finelyOsCatalogCard('rose')} fc-surface-harmony p-6 lg:p-8 space-y-4`} data-fc-accent="rose">
      <p className={FINELY_OS_ENTITY_LABEL}>Tradeline</p>
      <h3 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{selectedCandidate.account}</h3>
      <p className={FINELY_OS_ENTITY_SUBLABEL}>
        {bureauShortCode(selectedCandidate.bureau)} · {selectedCandidate.type} · {selectedCandidate.code}
      </p>
      <p className={FINELY_OS_ENTITY_BODY}>{selectedCandidate.status}</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => go('/portal/letters?openPicker=1')} className={FINELY_OS_SUCCESS_BTN}>
          Select in Letter Studio <ArrowRight size={14} />
        </button>
        <button type="button" onClick={() => go('/portal/reports?intelTab=collections')} className={FINELY_OS_SECONDARY_BTN}>
          Open report <ArrowRight size={14} />
        </button>
        <button type="button" onClick={() => go('/portal/evidence')} className={FINELY_OS_SECONDARY_BTN}>
          Evidence vault <ArrowRight size={14} />
        </button>
      </div>
    </div>
  ) : null;

  const caseDetail =
    selectedCase && selectedCase.partnerId === partner.id ? (
      <div className="fc-wlp-dispute-detail-panel">
        <div className="fc-wlp-dispute-detail-head">
          <div>
            <p className={FINELY_OS_ENTITY_LABEL}>{bureauShortCode(selectedCase.bureau)} case</p>
            <h3 className="fc-wlp-dispute-detail-title">{selectedCase.title}</h3>
            <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
              {selectedCase.status} · {selectedCase.items.length} item{selectedCase.items.length === 1 ? '' : 's'} ·{' '}
              {selectedCase.rounds.length} round{selectedCase.rounds.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedCase.status === 'open' ? (
              <span className={finelyOsStatusChip('ok')}>Active</span>
            ) : (
              <span className={FINELY_OS_ENTITY_CHIP}>Closed</span>
            )}
            <button type="button" onClick={closeCase} className={FINELY_OS_SECONDARY_BTN}>
              Close case
            </button>
          </div>
        </div>

        {(() => {
          const lastRound = selectedCase.rounds.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
          const caseEff = summarizeDisputeEffectiveness([selectedCase]);
          return (
            <>
              {caseEff.logged ? (
                <div className={`${finelyOsCatalogCard('emerald')} p-5 lg:p-6`} data-fc-accent="emerald">
                  <p className={FINELY_OS_ENTITY_LABEL}>Effectiveness</p>
                  <p className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                    {describeDisputeEffectiveness(caseEff)}
                  </p>
                  <p className={`mt-1 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>Results vary · logged from round outcomes</p>
                </div>
              ) : null}

              {selectedCase.status === 'open' && lastRound?.dueAt ? (
                <div className={`${FINELY_OS_NOTICE_WARN} flex items-start gap-3 p-5 lg:p-6`}>
                  <ShieldAlert size={18} className="text-fuchsia-400 shrink-0 mt-0.5" />
                  <div>
                    <p className={`font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Follow-up window</p>
                    <p className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                      Next follow-up due by{' '}
                      <span className="font-extrabold">{new Date(lastRound.dueAt).toLocaleDateString()}</span>.
                    </p>
                    <button type="button" onClick={() => go('/portal/projects')} className={`mt-3 ${FINELY_OS_SECONDARY_BTN}`}>
                      Open tasks <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          );
        })()}

        <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8`} data-fc-accent="violet">
          <p className={`text-sm font-extrabold uppercase tracking-[0.14em] ${FINELY_OS_ENTITY_SUBLABEL}`}>Bureau rounds</p>
          <div className="fc-wlp-dispute-round-timeline mt-5">
            {selectedCase.rounds
              .slice()
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((r, idx) => (
                <div
                  key={`${r.round}-${r.createdAt}`}
                  className="fc-wlp-dispute-round-node"
                  data-fc-accent={ACCENT_ROTATION[idx % ACCENT_ROTATION.length]}
                >
                  <span className="fc-wlp-dispute-round-dot">{idx + 1}</span>
                  <div className="fc-wlp-dispute-round-card fc-surface-harmony">
                    <div className={`font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{r.round}</div>
                    <div className={`mt-1 text-sm font-bold ${FINELY_OS_ENTITY_SUBLABEL}`}>
                      tone: {r.tone} · created {new Date(r.createdAt).toLocaleDateString()}
                      {r.dueAt ? ` · due ${new Date(r.dueAt).toLocaleDateString()}` : ''}
                    </div>
                    {r.responseOutcome ? (
                      <div className={`mt-2 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                        Outcome: <span className={FINELY_OS_ENTITY_VALUE}>{r.responseOutcome}</span>
                      </div>
                    ) : null}
                    {r.letterId ? (
                      <button
                        type="button"
                        onClick={() => go(`/portal/letters/vault?letterId=${encodeURIComponent(r.letterId!)}`)}
                        className={`mt-3 ${FINELY_OS_SECONDARY_BTN}`}
                      >
                        Open linked letter <ArrowRight size={14} />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="fc-wlp-dispute-detail-tools">
          <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 min-w-0`} data-fc-accent="sky">
            <p className={FINELY_OS_ENTITY_LABEL}>Workflow</p>
            <DisputeCaseWorkflowPanel
              caseId={selectedCase.id}
              partnerId={partner.id}
              mode="partner"
              onUpdated={() => setWorkflowVersion((v) => v + 1)}
            />
          </div>
          <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 min-w-0`} data-fc-accent="emerald">
            <p className={FINELY_OS_ENTITY_LABEL}>Upload proof</p>
            <SmartProofUploader
              partner={partner}
              email={partner.profile.email}
              disputeCaseId={selectedCase.id}
              uploadContext="bureau"
              compact
            />
          </div>
        </div>

        <div className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8`} data-fc-accent="rose">
          <p className={FINELY_OS_ENTITY_LABEL}>Disputed items</p>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            {selectedCase.items.map((it, idx) => (
              <div
                key={it.id}
                className={`${finelyOsCatalogCard(ACCENT_ROTATION[idx % ACCENT_ROTATION.length])} fc-surface-harmony p-5 space-y-2`}
                data-fc-accent={ACCENT_ROTATION[idx % ACCENT_ROTATION.length]}
              >
                <div className={`font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{it.account}</div>
                <div className={`text-sm font-bold ${FINELY_OS_ENTITY_SUBLABEL}`}>
                  {bureauShortCode(it.bureau)} · {it.type}
                </div>
                <div className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                  Reasons: {it.reasons.length} · Evidence: {it.evidenceId ? 'linked' : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ) : selectedCaseId ? (
      <div className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8`} data-fc-accent="rose">
        <p className={`font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Case not found</p>
        <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>This case may belong to another partner file.</p>
        <button type="button" onClick={closeCase} className={`mt-4 ${FINELY_OS_SECONDARY_BTN}`}>
          Back to queue
        </button>
      </div>
    ) : null;

  const defaultDetail = !selectedCaseId && !selectedCandidate ? (
    <div className="fc-wlp-dispute-detail-panel space-y-5">
      {latestParsedReport ? (
        <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8`} data-fc-accent="violet">
          <p className={FINELY_OS_ENTITY_LABEL}>Latest report</p>
          <p className={`text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{latestParsedReport.filename}</p>
          <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
            {needsDisputing.length} tradeline{needsDisputing.length === 1 ? '' : 's'} still need a dispute case.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="primary" size="sm" onClick={() => handleQueueModeChange('needs')}>
              View queue <ArrowRight size={14} />
            </Button>
            <button type="button" onClick={() => go('/portal/letters?openPicker=1')} className={FINELY_OS_SUCCESS_BTN}>
              Letter Studio <ArrowRight size={14} />
            </button>
          </div>
        </div>
      ) : null}

      <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8`} data-fc-accent="sky">
        <p className={FINELY_OS_ENTITY_LABEL}>Add proof</p>
        <SmartProofUploader partner={partner} email={partner.profile.email} uploadContext="bureau" />
        <button type="button" onClick={() => go('/portal/evidence')} className={`mt-4 ${FINELY_OS_SECONDARY_BTN}`}>
          Open Evidence vault <ArrowRight size={14} />
        </button>
      </div>

      <DisputeLaneHandoffStrip partnerId={partner.id} />
    </div>
  ) : null;

  const queueDeskBody = (
    <section className={`fc-wlp-section ${FINELY_OS_PAGE} fc-wlp-dispute-surface-root`} data-surface-layout="queue-detail">
      {runwayBody}
      {alertBanners}

      <div className="fc-wlp-dispute-queue-desk">
        <aside className="fc-wlp-dispute-queue-rail">
          <div className="fc-wlp-dispute-queue-modes" role="tablist" aria-label="Dispute queue">
            <button
              type="button"
              role="tab"
              aria-selected={queueMode === 'needs'}
              data-active={queueMode === 'needs' ? 'true' : undefined}
              className={`fc-wlp-dispute-queue-mode ${finelyOsCatalogCard('rose')}`}
              data-fc-accent="rose"
              onClick={() => handleQueueModeChange('needs')}
            >
              <strong>Needs dispute</strong>
              <span>Tradelines not yet in a bureau case</span>
              {needsDisputing.length > 0 ? <em>{needsDisputing.length}</em> : null}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={queueMode === 'cases'}
              data-active={queueMode === 'cases' ? 'true' : undefined}
              className={`fc-wlp-dispute-queue-mode ${finelyOsCatalogCard('violet')}`}
              data-fc-accent="violet"
              onClick={() => handleQueueModeChange('cases')}
            >
              <strong>Active cases</strong>
              <span>Rounds, deadlines, and outcomes</span>
              {cases.length > 0 ? <em>{cases.length}</em> : null}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={queueMode === 'tracked'}
              data-active={queueMode === 'tracked' ? 'true' : undefined}
              className={`fc-wlp-dispute-queue-mode ${finelyOsCatalogCard('emerald')}`}
              data-fc-accent="emerald"
              onClick={() => handleQueueModeChange('tracked')}
            >
              <strong>Tracked tradelines</strong>
              <span>Already inside open or closed cases</span>
              {alreadyDisputed.length > 0 ? <em>{alreadyDisputed.length}</em> : null}
            </button>
          </div>

          {queueMode === 'cases' ? (
            <div className={FINELY_OS_VIEW_TABS}>
              {(['open', 'closed', 'all'] as const).map((s) => (
                <button key={s} type="button" onClick={() => setCaseStatus(s)} className={finelyOsViewTab(caseStatus === s, 'violet')}>
                  {s}
                </button>
              ))}
            </div>
          ) : null}

          {bureauOptions.length > 0 ? (
            <div className="fc-wlp-dispute-bureau-chips" aria-label="Bureau filter">
              <button
                type="button"
                className="fc-wlp-dispute-bureau-chip"
                data-active={bureauFilter === 'all' ? 'true' : undefined}
                onClick={() => setBureauFilter('all')}
              >
                All bureaus
              </button>
              {bureauOptions.map((b) => (
                <button
                  key={b}
                  type="button"
                  className="fc-wlp-dispute-bureau-chip"
                  data-active={bureauFilter === b ? 'true' : undefined}
                  onClick={() => {
                    setBureauFilter(b);
                    if (partner) saveDisputeLaneFocus(partner.id, b);
                  }}
                >
                  {bureauFullName(b as import('../../../../domain/creditReports').Bureau)}
                </button>
              ))}
            </div>
          ) : null}

          {queueListItems()}
        </aside>

        <div className="fc-wlp-dispute-detail-panel">
          {caseDetail ?? candidateDetail ?? defaultDetail}
        </div>
      </div>
    </section>
  );

  return (
    <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.disputes]}>
      <ProductHubScaffold
        role={role}
        pageId="disputes"
        eyebrow="Dispute center"
        title="Bureau disputes — queue and case detail"
        description="Pick tradelines, mail with proof, and track each bureau round with follow-up deadlines."
        status={`${openCasesCount} open case${openCasesCount === 1 ? '' : 's'} · live data`}
        freshness={latestParsedReport ? 'report on file' : 'needs report'}
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        metricsVariant="grid"
        primaryAction={
          <ProductPagePrimaryAction label="Letter Studio" onClick={() => go('/portal/letters?openPicker=1')} />
        }
        secondaryAction={
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => go('/portal/reports')}>
            Upload report
          </button>
        }
        metrics={metrics}
        metricTitle="Dispute signals"
        metricDescription="Queue depth, proof coverage, outcomes, and open cases."
      >
        {queueDeskBody}
        <aside className="fc-wlp-page-guide mt-6">
          <div className="fc-wlp-page-guide-icon">
            <PageIcon size={22} strokeWidth={2.05} />
          </div>
          <div className="fc-wlp-eyebrow">What to do next</div>
          <h2>{needsDisputing.length ? 'Start with proof, then mail' : 'Track your bureau rounds'}</h2>
          <p>
            {needsDisputing.length
              ? 'Capture report crops in Evidence vault, pick factual reasons in Letter Studio, then watch follow-up windows here.'
              : 'Select a case to log outcomes, upload proof, and advance the next bureau round.'}
          </p>
          <ol>
            <li>Select tradelines from the needs queue.</li>
            <li>Attach proof before mailing.</li>
            <li>Log round outcomes and deadlines on each case.</li>
          </ol>
          {guideActions}
        </aside>
        <p className="fc-wlp-section-description fc-wlp-compliance-line mt-4">
          Results vary · not legal advice · funding subject to underwriting
        </p>
      </ProductHubScaffold>
    </EntitlementGate>
  );
}
