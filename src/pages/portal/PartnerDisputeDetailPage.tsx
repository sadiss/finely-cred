import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Gavel, ShieldAlert } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { disputeHubHref, resolveDisputeProductPath } from '../../lib/disputeProductPaths';
import { PageShell } from '../../components/layout/PageShell';
import { DisputeCaseWorkflowPanel } from '../../components/disputes/DisputeCaseWorkflowPanel';
import { SmartProofUploader } from '../../components/evidence/SmartProofUploader';
import { getCase } from '../../data/casesRepo';
import { summarizeDisputeEffectiveness } from '../../lib/disputeEffectiveness';
import { syncDisputeDeadlinePassedTasks } from '../../lib/disputeDeadlineEngine';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { Button } from '../../components/ui';
import { bureauShortCode } from '../../utils/bureaus';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyOsEmptyState } from '../../features/os/FinelyOsEmptyState';
import { PartnerLaneCoachDock } from '../../components/chat/PartnerLaneCoachDock';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

type DisputeTab = 'overview' | 'workflow' | 'proof' | 'items';

export function PartnerDisputeDetailWorkspace({
  caseId: caseIdProp,
  embedded = false,
}: {
  caseId?: string;
  embedded?: boolean;
}) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const go = (path: string) => navigate(resolveDisputeProductPath(path, pathname));
  const { id: routeCaseId } = useParams<{ id: string }>();
  const caseId = caseIdProp ?? routeCaseId;
  const [tab, setTab] = useState<DisputeTab>('overview');
  const [workflowVersion, setWorkflowVersion] = useState(0);

  const { partner } = usePartnerSession();
  const disputeCase = useMemo(() => (caseId ? getCase(caseId) : null), [caseId, workflowVersion]);
  const caseEffectiveness = useMemo(
    () => (disputeCase ? summarizeDisputeEffectiveness([disputeCase]) : summarizeDisputeEffectiveness([])),
    [disputeCase],
  );

  useEffect(() => {
    if (!partner) return;
    syncDisputeDeadlinePassedTasks(partner.id);
  }, [partner?.id]);

  const backToHub = () => navigate(disputeHubHref(pathname, search));

  if (!partner) {
    const empty = (
      <div className={FINELY_OS_PAGE}>
        <FinelyOsEmptyState
          icon={Gavel}
          title="Partner profile required"
          description="Complete onboarding or ask an admin to link your account to a partner file."
          primaryAction={{ label: 'Partner dashboard', onClick: () => go('/portal/dashboard') }}
        />
      </div>
    );
    if (embedded) {
      return (
        <div className="fc-wlp-dispute-workspace-embed" data-surface-kind="real" data-surface-key="partner:disputes:case">
          {empty}
        </div>
      );
    }
    return (
      <PageShell badge="Partner Portal" title="Dispute Case" subtitle="No partner profile found for this account.">
        {empty}
      </PageShell>
    );
  }

  if (!disputeCase || disputeCase.partnerId !== partner.id) {
    const empty = (
      <div className={FINELY_OS_PAGE}>
        <FinelyOsEmptyState
          icon={ShieldAlert}
          title="Case not found"
          description="The dispute case may have been removed or belongs to another partner file."
          primaryAction={{ label: 'Dispute center', onClick: backToHub }}
          secondaryAction={{ label: 'Partner dashboard', onClick: () => go('/portal/dashboard') }}
        />
      </div>
    );
    if (embedded) {
      return (
        <div className="fc-wlp-dispute-workspace-embed" data-surface-kind="real" data-surface-key="partner:disputes:case">
          {empty}
        </div>
      );
    }
    return (
      <PageShell badge="Partner Portal" title="Dispute Case not found" subtitle="This case does not exist, or you don't have access to it.">
        {empty}
      </PageShell>
    );
  }

  const c = disputeCase;
  const lastRound = c.rounds.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;

  const workspaceBody = (
    <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.disputes]}>
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {!embedded ? (
              <>
                <button type="button" onClick={() => go('/portal/dashboard')} className={FINELY_OS_BACK_LINK} title="Back to Partner Dashboard">
                  <ArrowLeft size={16} /> Partner Dashboard
                </button>
                <div className="h-4 w-px bg-white/10 hidden sm:block" />
              </>
            ) : null}
            <button type="button" onClick={backToHub} className={FINELY_OS_BACK_LINK}>
              <ArrowLeft size={16} /> Back to Dispute Center
            </button>
          </div>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>case_id: {c.id}</div>
        </div>

        <FinelyUnifiedHubLayout
          eyebrow="Dispute case"
          title={`${bureauShortCode(c.bureau)} — ${c.title}`}
          subtitle="Single-bureau tracking: rounds, complaints, team messaging, and follow-up windows."
          accent="fuchsia"
          kpis={[
            { label: 'Status', value: c.status, hint: 'Case', accent: 'rose' },
            { label: 'Rounds', value: String(c.rounds.length), hint: 'Dispute', accent: 'violet' },
            { label: 'Items', value: String(c.items.length), hint: 'Tradelines', accent: 'sky' },
            {
              label: 'Outcomes',
              value: caseEffectiveness.logged ? `${caseEffectiveness.wins}W` : '—',
              hint: caseEffectiveness.logged
                ? `${caseEffectiveness.losses}L · ${caseEffectiveness.noResponse} no reply · Results vary`
                : bureauShortCode(c.bureau),
              accent: 'emerald',
            },
          ]}
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'proof', label: 'Upload proof' },
            { id: 'workflow', label: 'Workflow' },
            { id: 'items', label: 'Items', badge: c.items.length || undefined },
          ]}
          activeTab={tab}
          onTabChange={(id) => setTab(id as DisputeTab)}
          primaryAction={{ label: 'Dispute center', onClick: backToHub }}
          secondaryAction={{ label: 'Letter studio', onClick: () => go(`/portal/letters?caseId=${encodeURIComponent(c.id)}`) }}
        >
          <div className="mb-4">
            <PartnerLaneCoachDock
              partnerId={partner.id}
              partnerName={partner.profile.fullName}
              lane="dispute"
              focusId={c.bureau}
              coachSubtitle={`${bureauShortCode(c.bureau)} bureau specialist for this case`}
              defaultOpen={false}
            />
          </div>

          {tab === 'overview' && (
            <div className="grid lg:grid-cols-12 gap-6">
              <div className={`lg:col-span-7 min-w-0 ${finelyOsCatalogCard('violet')} space-y-4`}>
                <div className="inline-flex items-center gap-2 text-fuchsia-300">
                  <Gavel size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wider">{c.status}</span>
                </div>
                <p className={`text-xl font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{c.title}</p>
                <p className={FINELY_OS_ENTITY_BODY}>
                  Items in this case are the exact set included in your bureau letter(s). Evidence IDs and reasons are snapshotted for auditability.
                </p>

                {lastRound?.letterId ? (
                  <div className={`${FINELY_OS_NOTICE_WARN} flex flex-wrap items-center justify-between gap-3`}>
                    <div className={FINELY_OS_ENTITY_BODY}>
                      Linked letter: <span className={`font-mono ${FINELY_OS_ENTITY_VALUE}`}>{lastRound.letterId}</span>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => go(`/portal/letters/vault?letterId=${encodeURIComponent(lastRound.letterId!)}`)}
                    >
                      Open letter <ArrowRight size={14} />
                    </Button>
                  </div>
                ) : null}

                {c.status === 'open' && lastRound?.dueAt && (
                  <div className={`${FINELY_OS_NOTICE_WARN} flex items-start gap-3`}>
                    <ShieldAlert size={16} className="text-fuchsia-300 mt-0.5 shrink-0" />
                    <div>
                      <p className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Follow-up window</p>
                      <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
                        Next follow-up due by{' '}
                        <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>
                          {new Date(lastRound.dueAt).toLocaleDateString()}
                        </span>
                        .
                      </p>
                      <button type="button" onClick={() => go('/portal/projects')} className={`mt-3 ${FINELY_OS_SECONDARY_BTN}`}>
                        Open tasks <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className={`lg:col-span-5 min-w-0 ${finelyOsCatalogCard('sky')} space-y-4`} data-fc-accent="sky">
                <p className={FINELY_OS_ENTITY_LABEL}>Rounds</p>
                <div className="space-y-3">
                  {c.rounds
                    .slice()
                    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                    .map((r, idx) => (
                      <div key={`${r.round}-${r.createdAt}`} className={`${finelyOsCatalogCard((['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4])} fc-surface-harmony`} data-fc-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4]}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className={FINELY_OS_ENTITY_VALUE}>{r.round}</div>
                            <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                              tone: {r.tone} • created {new Date(r.createdAt).toLocaleDateString()}
                              {r.dueAt ? ` • due ${new Date(r.dueAt).toLocaleDateString()}` : ''}
                            </div>
                            {r.notes && <div className={`mt-2 whitespace-pre-wrap ${FINELY_OS_ENTITY_BODY}`}>{r.notes}</div>}
                            {r.responseOutcome ? (
                              <div className={`mt-2 text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>
                                Outcome: <span className={FINELY_OS_ENTITY_VALUE}>{r.responseOutcome}</span>
                              </div>
                            ) : null}
                          </div>
                          {r.letterId ? (
                            <span className={finelyOsStatusChip('ok')}>letter linked</span>
                          ) : (
                            <span className={FINELY_OS_ENTITY_CHIP}>no letter id</span>
                          )}
                        </div>
                        {r.letterId ? (
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() => go(`/portal/letters/vault?letterId=${encodeURIComponent(r.letterId!)}`)}
                              className={FINELY_OS_SECONDARY_BTN}
                            >
                              <ArrowRight size={14} /> Open linked letter
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'proof' && (
            <SmartProofUploader
              partner={partner}
              email={partner.profile.email}
              disputeCaseId={c.id}
              uploadContext="bureau"
              compact
              onUploaded={() => setTab('workflow')}
            />
          )}

          {tab === 'workflow' && (
            <DisputeCaseWorkflowPanel
              caseId={c.id}
              partnerId={partner.id}
              mode="partner"
              onUpdated={() => setWorkflowVersion((v) => v + 1)}
            />
          )}

          {tab === 'items' && (
            <div className={`${finelyOsCatalogCard('violet')} space-y-4`}>
              <p className={FINELY_OS_ENTITY_LABEL}>Disputed items</p>
              <div className="grid md:grid-cols-2 gap-4">
                {c.items.map((it, idx) => (
                  <div key={it.id} className={`${finelyOsCatalogCard((['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4])} fc-surface-harmony space-y-3`} data-fc-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4]}>
                    <div className={FINELY_OS_ENTITY_VALUE}>{it.account}</div>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>
                      {bureauShortCode(it.bureau)} • {it.type} • {it.status}
                    </div>
                    <div className={`text-sm ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>Code: {it.code}</div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className={`${finelyOsCatalogCard('emerald')} fc-surface-harmony`} data-fc-accent="emerald">
                        <div className={FINELY_OS_ENTITY_SUBLABEL}>Reasons</div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE} font-mono text-sm`}>{it.reasons.length}</div>
                      </div>
                      <div className={`${finelyOsCatalogCard('violet')} fc-surface-harmony`} data-fc-accent="violet">
                        <div className={FINELY_OS_ENTITY_SUBLABEL}>Evidence</div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE} font-mono text-sm`}>{it.evidenceId ? 'linked' : '—'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => go('/portal/reports')} className={FINELY_OS_SECONDARY_BTN}>
                  Upload report / capture screenshots <ArrowRight size={14} />
                </button>
                <button type="button" onClick={() => go('/portal/documents')} className={FINELY_OS_SECONDARY_BTN}>
                  Upload supporting documents <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </FinelyUnifiedHubLayout>

        {!embedded ? <FinelyOsPageFooter /> : null}
      </div>
    </EntitlementGate>
  );

  if (embedded) {
    return (
      <div className="fc-wlp-dispute-workspace-embed" data-surface-kind="real" data-surface-key="partner:disputes:case">
        {workspaceBody}
      </div>
    );
  }

  return (
    <PageShell
      badge="Partner Portal"
      title={`${bureauShortCode(c.bureau)} Case`}
      subtitle="Single-bureau case tracking: rounds, inter-round complaints, team messaging, and follow-up windows."
    >
      {workspaceBody}
    </PageShell>
  );
}

export default function PartnerDisputeDetailPage() {
  return <PartnerDisputeDetailWorkspace />;
}
