import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Scale, FileWarning, Plus } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { listDebtByPartner, createDebtCase } from '../../data/debtRepo';
import { getDebtLaneFocus, saveDebtLaneFocus } from '../../data/debtLaneStateRepo';
import { onDebtCaseCreated } from '../../lib/debtWorkflowEngine';
import { computePartnerDebtSnapshot } from '../../lib/debtCreditorIntel';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { PartnerLaneCoachPanel } from '../../components/chat/PartnerLaneCoachPanel';
import { DebtLaneHandoffStrip } from '../../components/debt/DebtLaneHandoffStrip';
import { PartnerLaneCoachDock } from '../../components/chat/PartnerLaneCoachDock';
import { PartnerSuccessExperiencePanel } from '../../components/partner/PartnerSuccessExperiencePanel';
import { SmartProofUploader } from '../../components/evidence/SmartProofUploader';
import { LettersCommandCenter, type LettersStudioTab } from '../../components/letters/LettersCommandCenter';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
} from '../../features/os/finelyOsLightUi';

function AddCaseForm({
  addType,
  setAddType,
  addName,
  setAddName,
  addAmount,
  setAddAmount,
  addCaseNumber,
  setAddCaseNumber,
  onSubmit,
  onCancel,
  compact,
}: {
  addType: 'debt' | 'summons';
  setAddType: (v: 'debt' | 'summons') => void;
  addName: string;
  setAddName: (v: string) => void;
  addAmount: string;
  setAddAmount: (v: string) => void;
  addCaseNumber: string;
  setAddCaseNumber: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  compact?: boolean;
}) {
  const formLabel = `block ${FINELY_OS_ENTITY_LABEL} mb-1`;

  return (
    <form onSubmit={onSubmit} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony border-fuchsia-500/25 space-y-4`}>
      <h3 className={FINELY_OS_ENTITY_TITLE}>{compact ? 'Add debt or summons case' : 'Add case'}</h3>
      <div className={compact ? 'grid sm:grid-cols-2 gap-4' : 'space-y-4'}>
        <div>
          <label className={formLabel}>Type</label>
          <select value={addType} onChange={(e) => setAddType(e.target.value as 'debt' | 'summons')} className={FINELY_OS_ENTITY_SELECT}>
            <option value="debt">Debt / collection</option>
            <option value="summons">Summons / court</option>
          </select>
        </div>
        {compact ? (
          <div>
            <label className={formLabel}>Amount ($)</label>
            <input type="number" step="0.01" min="0" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} placeholder="0" className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} />
          </div>
        ) : null}
      </div>
      {!compact ? (
        <div>
          <label className={formLabel}>Creditor or plaintiff name</label>
          <input type="text" value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="e.g. ABC Collections" className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} required />
        </div>
      ) : null}
      {compact ? (
        <div>
          <label className={formLabel}>Creditor or plaintiff name</label>
          <input type="text" value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="e.g. ABC Collections" className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} required />
        </div>
      ) : null}
      {!compact ? (
        <div>
          <label className={formLabel}>Amount claimed ($)</label>
          <input type="number" step="0.01" min="0" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} placeholder="0" className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} />
        </div>
      ) : null}
      {addType === 'summons' && (
        <div>
          <label className={formLabel}>Court case number (optional)</label>
          <input type="text" value={addCaseNumber} onChange={(e) => setAddCaseNumber(e.target.value)} placeholder="e.g. 12345" className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} />
        </div>
      )}
      <div className="flex gap-3 flex-wrap">
        <button type="submit" className={FINELY_OS_SUCCESS_BTN}>
          Add & open
        </button>
        <button type="button" onClick={onCancel} className={FINELY_OS_SECONDARY_BTN}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function PartnerDebtPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [caseRefresh, setCaseRefresh] = useState(0);
  const { partner } = usePartnerSession();
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addType, setAddType] = useState<'debt' | 'summons'>('debt');
  const [addAmount, setAddAmount] = useState('');
  const [addCaseNumber, setAddCaseNumber] = useState('');
  const cases = useMemo(() => (partner ? listDebtByPartner(partner.id) : []), [partner, caseRefresh]);
  const openCount = cases.filter((c) => c.status === 'open' || c.status === 'in_review').length;
  const resolvedCount = cases.filter((c) => c.status === 'resolved').length;
  const disputedCount = cases.filter((c) => c.status === 'disputed').length;
  const totalDollars = useMemo(() => cases.reduce((sum, c) => sum + Number(c.amountCents || 0), 0), [cases]);
  const debtSnapshot = useMemo(() => (partner ? computePartnerDebtSnapshot(partner.id) : null), [partner]);

  /** `litigation` is a public alias for the elevated Court / Litigation Command workstation. */
  type DebtTab = 'overview' | 'validation' | 'court' | 'litigation' | 'foreclosure' | 'repossession' | 'bankruptcy' | 'cases' | 'guides';
  const normalizeTab = (raw: string | null | undefined): DebtTab => {
    if (raw === 'litigation' || raw === 'court') return 'litigation';
    if (
      raw === 'overview' ||
      raw === 'validation' ||
      raw === 'foreclosure' ||
      raw === 'repossession' ||
      raw === 'bankruptcy' ||
      raw === 'cases' ||
      raw === 'guides'
    ) {
      return raw;
    }
    return 'overview';
  };
  const [tab, setTab] = useState<DebtTab>(() => normalizeTab(searchParams.get('tab')));

  useEffect(() => {
    const fromUrl = normalizeTab(searchParams.get('tab'));
    setTab((prev) => (prev === fromUrl ? prev : fromUrl));
  }, [searchParams]);

  const handleTabChange = (id: DebtTab) => {
    const next = normalizeTab(id);
    setTab(next);
    const params = new URLSearchParams(searchParams);
    if (next === 'overview') params.delete('tab');
    else params.set('tab', next === 'litigation' ? 'litigation' : next);
    setSearchParams(params, { replace: true });
    if (partner && next !== 'overview' && next !== 'cases' && next !== 'guides') {
      saveDebtLaneFocus(partner.id, next === 'litigation' ? 'court' : next);
    }
  };

  const workstationTab =
    tab === 'validation' || tab === 'litigation' || tab === 'court' || tab === 'foreclosure' || tab === 'repossession' || tab === 'bankruptcy'
      ? tab === 'litigation' || tab === 'court'
        ? 'court'
        : tab
      : null;

  const coachLaneForTab = (t: DebtTab): string => {
    if (t === 'validation') return 'validation';
    if (t === 'court' || t === 'litigation') return 'court';
    if (t === 'foreclosure') return 'foreclosure';
    if (t === 'repossession') return 'repossession';
    if (t === 'bankruptcy') return 'bankruptcy';
    return 'debt';
  };

  const debtCoachFocusId = useMemo(() => {
    if (tab !== 'overview' && tab !== 'cases' && tab !== 'guides') return coachLaneForTab(tab);
    if (!partner) return 'debt';
    return getDebtLaneFocus(partner.id)?.workstation ?? 'debt';
  }, [tab, partner]);

  const hubMeta = useMemo(() => {
    switch (workstationTab) {
      case 'foreclosure':
        return {
          title: 'Foreclosure command center',
          subtitle: 'RESPA, loss mitigation, dual-track stops, note/assignment demands — with live coach.',
          accent: 'amber' as const,
        };
      case 'repossession':
        return {
          title: 'Repossession command center',
          subtitle: 'UCC Article 9 reinstatement, wrongful repo, deficiency fights — with live coach.',
          accent: 'rose' as const,
        };
      case 'court':
        return {
          title: 'Litigation Command',
          subtitle: 'Hearing countdown, docket/summons scrape, affidavits, answers, and day-of defense — one home for court work.',
          accent: 'fuchsia' as const,
        };
      case 'bankruptcy':
        return {
          title: 'Bankruptcy workstation',
          subtitle: 'Chapter 7/13 prep, stay notices, creditor matrix, post-discharge bureau disputes.',
          accent: 'sky' as const,
        };
      case 'validation':
        return {
          title: 'Validation workstation',
          subtitle: 'FDCPA § 1692g proof demands — licensing, chain of title, accounting.',
          accent: 'emerald' as const,
        };
      default:
        return {
          title: 'Debt Letters',
          subtitle: 'Validation, affidavits & court, and debt tracks — pick a workstation below. Bureau credit disputes are under Credit Letters.',
          accent: 'fuchsia' as const,
        };
    }
  }, [workstationTab]);

  const debtKpis = useMemo(
    () =>
      workstationTab
        ? undefined
        : [
            { label: 'Cases', value: String(cases.length), hint: 'Total', accent: 'amber' as const },
            { label: 'Active', value: String(openCount + disputedCount), hint: 'Open + disputed', accent: 'emerald' as const },
            {
              label: 'On report',
              value: debtSnapshot?.reportedCents
                ? (debtSnapshot.reportedCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
                : '—',
              hint: debtSnapshot?.reportedCount ? `${debtSnapshot.reportedCount} tradelines` : 'Upload report',
              accent: 'sky' as const,
            },
            {
              label: 'In cases',
              value: (totalDollars / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
              hint: 'Claimed total',
              accent: 'violet' as const,
            },
            {
              label: 'Summons',
              value: debtSnapshot?.summonsCount ? String(debtSnapshot.summonsCount) : '0',
              hint: debtSnapshot?.summonsClaimedCents
                ? (debtSnapshot.summonsClaimedCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
                : 'None yet',
              accent: 'fuchsia' as const,
            },
          ],
    [cases.length, openCount, disputedCount, totalDollars, workstationTab, debtSnapshot],
  );

  const handleAddCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner) return;
    const amountCents = Math.round(parseFloat(addAmount || '0') * 100);
    if (!addName.trim() || amountCents < 0) return;
    const created = createDebtCase({
      partnerId: partner.id,
      type: addType,
      name: addName.trim(),
      amountCents,
      courtCaseNumber: addCaseNumber.trim() || undefined,
    });
    onDebtCaseCreated(created);
    setShowAdd(false);
    setAddName('');
    setAddAmount('');
    setAddCaseNumber('');
    navigate(`/portal/debt/${created.id}`);
  };

  const navLinks = (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => navigate('/portal/dashboard')} className={FINELY_OS_BACK_LINK}>
          <ArrowLeft size={16} /> Partner Dashboard
        </button>
        <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_BACK_LINK}>
          <ArrowLeft size={16} /> Finely Cred
        </button>
      </div>
      {cases.length > 0 ? (
        <button type="button" onClick={() => setShowAdd(true)} className={FINELY_OS_SECONDARY_BTN}>
          <Plus size={14} /> Add case
        </button>
      ) : null}
    </div>
  );

  const letterTypesPanel = (
    <div className="space-y-3 text-sm text-white/65">
      <p>Each case unlocks personalized drafts with legal basis (FDCPA, UCC, RESPA, civil procedure).</p>
      <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
        <li>Validation request — FDCPA § 809</li>
        <li>Affidavit of dispute — sworn denial</li>
        <li>Summons answer — affirmative defenses</li>
        <li>Foreclosure / repossession — collateral tracks</li>
        <li>Cease & desist — § 805(c)</li>
        <li>Credit reporting follow-up — FCRA</li>
      </ul>
    </div>
  );

  return (
    <PageShell
      badge="Partner Portal"
      title="Debt Letters"
      subtitle="Validation, Litigation Command (court defense), foreclosure, repossession, and bankruptcy — FDCPA/contract focus. Credit bureau disputes live under Credit Letters."
    >
      {!partner ? (
        <div className={FINELY_OS_PAGE}>
          <div className={`${FINELY_OS_LUXURY_EMPTY} text-left`}>
            No partner profile found for this account. If you're an admin, use Partner Management to pick a partner.
          </div>
          <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_PRIMARY_BTN}>
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      ) : (
        <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.debt]}>
          <div className={FINELY_OS_PAGE}>
            {navLinks}

            <FinelyUnifiedHubLayout
              eyebrow="Debt Letters"
              title={hubMeta.title}
              subtitle={hubMeta.subtitle}
              accent={hubMeta.accent}
              kpis={debtKpis}
              contentVariant={workstationTab === 'foreclosure' || workstationTab === 'repossession' ? 'flush' : 'card'}
              tabDensity="comfortable"
              tabs={[
                { id: 'overview', label: 'Overview' },
                { id: 'validation', label: 'Validation' },
                { id: 'litigation', label: 'Litigation' },
                { id: 'foreclosure', label: 'Foreclosure' },
                { id: 'repossession', label: 'Repossession' },
                { id: 'bankruptcy', label: 'Bankruptcy' },
                { id: 'cases', label: 'Cases', badge: cases.length || undefined },
              ]}
              activeTab={tab === 'court' ? 'litigation' : tab}
              onTabChange={(id) => handleTabChange(id as DebtTab)}
              primaryAction={{ label: 'Add case', onClick: () => setShowAdd(true) }}
              secondaryAction={{ label: 'Credit Letters', onClick: () => navigate('/portal/letters') }}
              detailSlot={tab === 'overview' ? letterTypesPanel : undefined}
              detailLabel="Letter types available"
            >
              {tab !== 'overview' && partner ? (
                <div className="mb-4">
                  <PartnerLaneCoachDock
                    partnerId={partner.id}
                    partnerName={partner.profile.fullName}
                    lane={coachLaneForTab(tab)}
                    focusId={debtCoachFocusId}
                    coachSubtitle={`Specialist for ${tab} — expand to chat`}
                  />
                </div>
              ) : null}

              {tab === 'overview' && (
                <div className="space-y-4">
                  {partner ? (
                    <SmartProofUploader
                      partner={partner}
                      email={partner.profile.email}
                      uploadContext="debt"
                      compact
                      onUploaded={() => setCaseRefresh((v) => v + 1)}
                    />
                  ) : null}
                  {cases.length === 0 ? (
                    <div className={`${FINELY_OS_LUXURY_EMPTY} text-center space-y-4`}>
                      <Scale className="mx-auto text-violet-400/70" size={48} />
                      <p className={`${FINELY_OS_ENTITY_VALUE} text-base`}>No debt or summons cases yet</p>
                      <p className={`${FINELY_OS_ENTITY_BODY} max-w-md mx-auto`}>
                        Add a case, then open Validation, Litigation, Foreclosure, or Repossession from the tabs above.
                      </p>
                      <button type="button" onClick={() => setShowAdd(true)} className={FINELY_OS_SUCCESS_BTN}>
                        <Plus size={16} /> Add debt or summons case
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className={FINELY_OS_ENTITY_BODY}>
                        <strong className="text-white/90">{openCount + disputedCount} active case(s).</strong> Use the tabs above — each workstation has its own letter library and coach.
                      </p>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(
                          [
                            { id: 'validation' as const, label: 'Validation', hint: 'FDCPA proof' },
                            { id: 'litigation' as const, label: 'Litigation', hint: 'Hearing defense command' },
                            { id: 'foreclosure' as const, label: 'Foreclosure', hint: 'RESPA & mortgage' },
                            { id: 'repossession' as const, label: 'Repossession', hint: 'UCC Art. 9' },
                            { id: 'bankruptcy' as const, label: 'Bankruptcy', hint: 'Filing prep' },
                            { id: 'cases' as const, label: 'All cases', hint: `${cases.length} total` },
                          ] as const
                        ).map((w) => (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => handleTabChange(w.id)}
                            className="rounded-xl border border-white/10 bg-black/25 px-5 py-4 text-left hover:border-white/25 transition min-h-[4.5rem]"
                          >
                            <div className="text-sm font-semibold text-white/90 leading-snug">{w.label}</div>
                            <div className="text-[11px] text-white/45 mt-1 leading-relaxed">{w.hint}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {showAdd ? (
                    <AddCaseForm
                      addType={addType}
                      setAddType={setAddType}
                      addName={addName}
                      setAddName={setAddName}
                      addAmount={addAmount}
                      setAddAmount={setAddAmount}
                      addCaseNumber={addCaseNumber}
                      setAddCaseNumber={setAddCaseNumber}
                      onSubmit={handleAddCase}
                      onCancel={() => setShowAdd(false)}
                    />
                  ) : null}

                  <DebtLaneHandoffStrip partnerId={partner.id} />

                  {/* Defense Book lives on Litigation Command — thin cross-link only (no duplicate panel). */}
                  <div className={`${finelyOsCatalogCard('violet')} !p-4 flex flex-wrap items-center justify-between gap-3`}>
                    <div>
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Court defense</div>
                      <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                        Hearing countdown, docket scrape, affidavit & answer builds, and Defense Book — all in Litigation Command.
                      </p>
                    </div>
                    <Link to="/portal/debt?tab=litigation" className={FINELY_OS_PRIMARY_BTN} onClick={() => handleTabChange('litigation')}>
                      Open Litigation <ArrowRight size={14} />
                    </Link>
                  </div>

                  <div className="grid lg:grid-cols-5 gap-4">
                    <div className="lg:col-span-3">
                      <PartnerLaneCoachPanel
                        partnerId={partner.id}
                        partnerName={partner.profile.fullName}
                        lane="debt"
                        focusId={debtCoachFocusId}
                        compact
                        coachSubtitle="Debt & validation coach — dedicated specialist per workstation"
                      />
                    </div>
                    <div className="lg:col-span-2">
                      <PartnerSuccessExperiencePanel partnerId={partner.id} lane="debt" compact />
                    </div>
                  </div>
                </div>
              )}

              {workstationTab && partner ? (
                <LettersCommandCenter
                  partner={partner}
                  layout="embedded"
                  unifiedShell
                  activeTab={workstationTab as LettersStudioTab}
                  debtCenterMode
                  onTabChange={(next) => {
                    if (
                      next === 'validation' ||
                      next === 'court' ||
                      next === 'foreclosure' ||
                      next === 'repossession' ||
                      next === 'bankruptcy'
                    ) {
                      handleTabChange(next === 'court' ? 'litigation' : next);
                    }
                  }}
                />
              ) : null}

              {tab === 'cases' && (
                <div className="space-y-4">
                  {showAdd ? (
                    <AddCaseForm
                      compact
                      addType={addType}
                      setAddType={setAddType}
                      addName={addName}
                      setAddName={setAddName}
                      addAmount={addAmount}
                      setAddAmount={setAddAmount}
                      addCaseNumber={addCaseNumber}
                      setAddCaseNumber={setAddCaseNumber}
                      onSubmit={handleAddCase}
                      onCancel={() => setShowAdd(false)}
                    />
                  ) : null}
                  {cases.length === 0 ? (
                    <div className={FINELY_OS_ENTITY_BODY}>No cases yet — use Add case from the hub header.</div>
                  ) : (
                    <div className="divide-y divide-white/10 rounded-xl border border-white/10 overflow-hidden">
                      {cases.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => navigate(`/portal/debt/${c.id}`)}
                          className="w-full text-left px-4 py-3 flex items-center justify-between gap-4 hover:bg-white/5 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {c.type === 'summons' ? (
                              <FileWarning size={18} className="text-violet-300 shrink-0" />
                            ) : (
                              <Scale size={18} className="text-violet-300 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{c.name}</div>
                              <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-0.5`}>
                                {(c.amountCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} · {c.type} · {c.status}
                              </div>
                            </div>
                          </div>
                          <ArrowRight size={16} className="text-white/40 shrink-0" />
                        </button>
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
