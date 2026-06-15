import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Target, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { BUNDLES, activateBundle } from '../../automation/bundleScheduler';
import { createBundleActivation, getActiveBundleActivation, listBundleActivationsByPartner } from '../../data/productsRepo';
import { listTasksByPartner } from '../../data/tasksRepo';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout, FinelyUnifiedSection } from '../../features/unified/FinelyUnifiedHubLayout';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

export default function PartnerBuildPage() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const [version, setVersion] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const activations = useMemo(() => (partner ? listBundleActivationsByPartner(partner.id) : []), [partner, version]);
  const tasks = useMemo(() => (partner ? listTasksByPartner(partner.id) : []), [partner, version]);
  const upcoming = useMemo(() => {
    return tasks
      .filter((t) => t.status !== 'completed' && t.status !== 'cancelled')
      .slice()
      .sort((a, b) => (a.dueAt || '9999').localeCompare(b.dueAt || '9999'))
      .slice(0, 8);
  }, [tasks]);

  type BuildTab = 'bundles' | 'timeline' | 'history';
  const [tab, setTab] = useState<BuildTab>('bundles');

  const buildKpis = useMemo(
    () => [
      { label: 'Bundles', value: String(BUNDLES.length), hint: 'Available', accent: 'violet' as const },
      { label: 'Active', value: String(activations.filter((a) => a.status === 'active').length), hint: 'Running now', accent: 'emerald' as const },
      { label: 'Upcoming', value: String(upcoming.length), hint: 'Open tasks', accent: 'amber' as const },
      { label: 'Activations', value: String(activations.length), hint: 'All time', accent: 'sky' as const },
    ],
    [activations, upcoming.length],
  );

  return (
    <PageShell
      badge="Partner Portal"
      title="Credit Building Center"
      subtitle="Strategies and next steps to build and optimize your credit profile beyond disputes."
    >
      {!partner ? (
        <div className={FINELY_OS_PAGE}>
          <div className={`${FINELY_OS_LUXURY_EMPTY} text-left`}>
            No partner profile found. If you&apos;re an admin, use Partner Management to pick a partner.
          </div>
          <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_SUCCESS_BTN}>
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      ) : (
        <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.businessBuild]}>
        <div className={FINELY_OS_PAGE}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button type="button" onClick={() => navigate('/portal/dashboard')} className={FINELY_OS_BACK_LINK}>
              <ArrowLeft size={16} /> Partner Dashboard
            </button>
            <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_BACK_LINK}>
              <ArrowLeft size={16} /> Finely Cred
            </button>
          </div>

          {err ? <div className={FINELY_OS_NOTICE_ERROR}>{err}</div> : null}
          {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}

          <FinelyUnifiedHubLayout
            eyebrow="Credit building"
            title="Bundles & timed execution"
            subtitle="Activate application-window-aware bundles — tasks, due dates, and dependencies included."
            accent="violet"
            kpis={buildKpis}
            tabs={[
              { id: 'bundles', label: 'Bundles' },
              { id: 'timeline', label: 'Upcoming tasks', badge: upcoming.length || undefined },
              { id: 'history', label: 'History', badge: activations.length || undefined },
            ]}
            activeTab={tab}
            onTabChange={(id) => setTab(id as BuildTab)}
            primaryAction={{ label: 'Open tasks', onClick: () => navigate('/portal/projects') }}
            secondaryAction={{ label: 'Fundability hub', onClick: () => navigate('/fundability-readiness') }}
          >
            {tab === 'bundles' && (
          <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-5`}>
            <FinelyUnifiedSection title="Credit building bundles" subtitle="Time-sensitive timelines with due dates and dependencies.">
            <div className="grid lg:grid-cols-2 gap-4">
              {BUNDLES.map((b) => {
                const active = getActiveBundleActivation(partner.id, b.id);
                return (
                  <div key={b.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className={FINELY_OS_ENTITY_VALUE}>{b.title}</div>
                        {b.priceHint ? <div className="mt-1 text-amber-300 text-sm font-mono">{b.priceHint}</div> : null}
                        <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>{b.description}</div>
                      </div>
                      {active ? (
                        <span className={`shrink-0 inline-flex items-center gap-2 ${finelyOsStatusChip('ok')}`}>
                          <CheckCircle2 size={14} /> Active
                        </span>
                      ) : null}
                    </div>

                    <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Timeline highlights</div>
                      <ul className={`mt-2 space-y-1 list-disc list-inside ${FINELY_OS_ENTITY_BODY}`}>
                        {b.timeline.slice(0, 4).map((t) => (
                          <li key={t.title}>
                            <span className={FINELY_OS_ENTITY_VALUE}>{t.title}</span>{' '}
                            <span className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono text-xs`}>(due +{t.dueInDays}d)</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{b.id}</div>
                      <button
                        type="button"
                        disabled={Boolean(active)}
                        onClick={() => {
                          setErr(null);
                          setNotice(null);
                          try {
                            const { createdTaskIds } = activateBundle({ partnerId: partner.id, bundleId: b.id });
                            createBundleActivation({ partnerId: partner.id, bundleId: b.id, startAt: new Date().toISOString(), createdTaskIds });
                            setNotice(`Activated bundle. Created ${createdTaskIds.length} timed task(s).`);
                            setVersion((v) => v + 1);
                          } catch (e: any) {
                            setErr(e?.message || 'Activation failed.');
                          }
                        }}
                        className={FINELY_OS_SUCCESS_BTN}
                      >
                        <Sparkles size={14} /> {active ? 'Activated' : 'Activate bundle'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            </FinelyUnifiedSection>
          </div>
            )}

            {tab === 'timeline' && (
              <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
                <div className="inline-flex items-center gap-2 text-violet-300">
                  <Clock size={16} />
                  <span className={FINELY_OS_ENTITY_SUBLABEL}>Upcoming tasks</span>
                </div>
                {upcoming.length === 0 ? (
                  <div className={FINELY_OS_ENTITY_BODY}>No upcoming tasks yet — activate a bundle to generate your timeline.</div>
                ) : (
                  <div className="space-y-2">
                    {upcoming.map((t) => (
                      <div key={t.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                        <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{t.title}</div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                          {t.kind} • {t.status} • due {t.dueAt ? new Date(t.dueAt).toLocaleDateString() : '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'history' && (
              <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
                <div className="inline-flex items-center gap-2 text-violet-300">
                  <Target size={16} />
                  <span className={FINELY_OS_ENTITY_SUBLABEL}>Bundle activation history</span>
                </div>
                {activations.length === 0 ? (
                  <div className={FINELY_OS_ENTITY_BODY}>No bundles activated yet.</div>
                ) : (
                  <div className="space-y-2">
                    {activations.slice(0, 12).map((a) => (
                      <div key={a.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                        <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{a.bundleId}</div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                          {a.status} • tasks:{a.createdTaskIds.length} • {new Date(a.activatedAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </FinelyUnifiedHubLayout>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => navigate('/portal/reports')} className={FINELY_OS_SECONDARY_BTN}>
              Credit reports <ArrowRight size={14} />
            </button>
            <button type="button" onClick={() => navigate('/portal/disputes')} className={FINELY_OS_SECONDARY_BTN}>
              Dispute center <ArrowRight size={14} />
            </button>
          </div>

          <FinelyOsPageFooter />
        </div>
        </EntitlementGate>
      )}
    </PageShell>
  );
}
