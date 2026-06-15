import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Gavel, ShieldAlert } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { DisputeCaseWorkflowPanel } from '../../components/disputes/DisputeCaseWorkflowPanel';
import { getCase } from '../../data/casesRepo';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { Button } from '../../components/ui';
import { bureauShortCode } from '../../utils/bureaus';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyOsEmptyState } from '../../features/os/FinelyOsEmptyState';
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

export default function PartnerDisputeDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const { partner } = usePartnerSession();
  const disputeCase = useMemo(() => (id ? getCase(id) : null), [id]);

  if (!partner) {
    return (
      <PageShell badge="Partner Portal" title="Dispute Case" subtitle="No partner profile found for this account.">
        <div className={FINELY_OS_PAGE}>
          <FinelyOsEmptyState
            icon={Gavel}
            title="Partner profile required"
            description="Complete onboarding or ask an admin to link your account to a partner file."
            primaryAction={{ label: 'Start onboarding', onClick: () => navigate('/onboarding') }}
            secondaryAction={{ label: 'Partner dashboard', onClick: () => navigate('/portal/dashboard') }}
          />
        </div>
      </PageShell>
    );
  }

  if (!disputeCase || disputeCase.partnerId !== partner.id) {
    return (
      <PageShell badge="Partner Portal" title="Dispute Case not found" subtitle="This case does not exist, or you don't have access to it.">
        <div className={FINELY_OS_PAGE}>
          <FinelyOsEmptyState
            icon={ShieldAlert}
            title="Case not found"
            description="The dispute case may have been removed or belongs to another partner file."
            primaryAction={{ label: 'Dispute center', onClick: () => navigate('/portal/disputes') }}
            secondaryAction={{ label: 'Partner dashboard', onClick: () => navigate('/portal/dashboard') }}
          />
        </div>
      </PageShell>
    );
  }

  const c = disputeCase;
  const lastRound = c.rounds.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
  type DisputeTab = 'overview' | 'workflow' | 'items';
  const [tab, setTab] = useState<DisputeTab>('overview');

  return (
    <PageShell
      badge="Partner Portal"
      title={`${bureauShortCode(c.bureau)} Case`}
      subtitle="Single-bureau case tracking: rounds, inter-round complaints, team messaging, and follow-up windows."
    >
      <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.disputes]}>
        <div className={FINELY_OS_PAGE}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <button type="button" onClick={() => navigate('/portal/dashboard')} className={FINELY_OS_BACK_LINK} title="Back to Partner Dashboard">
                <ArrowLeft size={16} /> Partner Dashboard
              </button>
              <div className="h-4 w-px bg-white/10 hidden sm:block" />
              <button type="button" onClick={() => navigate('/portal/disputes')} className={FINELY_OS_BACK_LINK}>
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
              { label: 'Status', value: c.status, hint: 'Case', accent: 'fuchsia' },
              { label: 'Rounds', value: String(c.rounds.length), hint: 'Dispute', accent: 'violet' },
              { label: 'Items', value: String(c.items.length), hint: 'Tradelines', accent: 'amber' },
              { label: 'Bureau', value: bureauShortCode(c.bureau), hint: 'File', accent: 'sky' },
            ]}
            tabs={[
              { id: 'overview', label: 'Overview' },
              { id: 'workflow', label: 'Workflow' },
              { id: 'items', label: 'Items', badge: c.items.length || undefined },
            ]}
            activeTab={tab}
            onTabChange={(id) => setTab(id as DisputeTab)}
            primaryAction={{ label: 'Dispute center', onClick: () => navigate('/portal/disputes') }}
            secondaryAction={{ label: 'Letter studio', onClick: () => navigate('/portal/letters') }}
          >
          {tab === 'overview' && (
          <div className="grid lg:grid-cols-12 gap-6">
            <div className={`lg:col-span-7 min-w-0 ${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
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
                  <Button variant="primary" size="sm" onClick={() => navigate(`/portal/letters/vault?letterId=${encodeURIComponent(lastRound.letterId!)}`)}>
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
                      Next follow-up due by <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{new Date(lastRound.dueAt).toLocaleDateString()}</span>.
                    </p>
                    <button type="button" onClick={() => navigate('/portal/projects')} className={`mt-3 ${FINELY_OS_SECONDARY_BTN}`}>
                      Open tasks <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className={`lg:col-span-5 min-w-0 ${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
              <p className={FINELY_OS_ENTITY_LABEL}>Rounds</p>
              <div className="space-y-3">
                {c.rounds
                  .slice()
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .map((r) => (
                    <div key={`${r.round}-${r.createdAt}`} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className={FINELY_OS_ENTITY_VALUE}>{r.round}</div>
                          <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                            tone: {r.tone} • created {new Date(r.createdAt).toLocaleDateString()}
                            {r.dueAt ? ` • due ${new Date(r.dueAt).toLocaleDateString()}` : ''}
                          </div>
                          {r.notes && <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>{r.notes}</div>}
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
                            onClick={() => navigate(`/portal/letters/vault?letterId=${encodeURIComponent(r.letterId!)}`)}
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

          {tab === 'workflow' && (
          <DisputeCaseWorkflowPanel caseId={c.id} partnerId={partner.id} mode="partner" />
          )}

          {tab === 'items' && (
          <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
            <p className={FINELY_OS_ENTITY_LABEL}>Disputed items</p>
            <div className="grid md:grid-cols-2 gap-4">
              {c.items.map((it) => (
                <div key={it.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`}>
                  <div className={FINELY_OS_ENTITY_VALUE}>{it.account}</div>
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>
                    {bureauShortCode(it.bureau)} • {it.type} • {it.status}
                  </div>
                  <div className={`text-[11px] ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>Code: {it.code}</div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony !p-3`}>
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Reasons</div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE} font-mono text-sm`}>{it.reasons.length}</div>
                    </div>
                    <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony !p-3`}>
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Evidence</div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE} font-mono text-sm`}>{it.evidenceId ? 'linked' : '—'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => navigate('/portal/reports')} className={FINELY_OS_SECONDARY_BTN}>
                Upload report / capture screenshots <ArrowRight size={14} />
              </button>
              <button type="button" onClick={() => navigate('/portal/documents')} className={FINELY_OS_SECONDARY_BTN}>
                Upload supporting documents <ArrowRight size={14} />
              </button>
            </div>
          </div>
          )}
          </FinelyUnifiedHubLayout>

          <FinelyOsPageFooter />
        </div>
      </EntitlementGate>
    </PageShell>
  );
}
