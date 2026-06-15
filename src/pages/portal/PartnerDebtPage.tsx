import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Scale, FileWarning, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { listDebtByPartner, createDebtCase } from '../../data/debtRepo';
import { onDebtCaseCreated } from '../../lib/debtWorkflowEngine';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
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
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsInlineListItem,
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
  const { partner } = usePartnerSession();
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addType, setAddType] = useState<'debt' | 'summons'>('debt');
  const [addAmount, setAddAmount] = useState('');
  const [addCaseNumber, setAddCaseNumber] = useState('');
  const cases = useMemo(() => (partner ? listDebtByPartner(partner.id) : []), [partner]);
  const openCount = cases.filter((c) => c.status === 'open' || c.status === 'in_review').length;
  const resolvedCount = cases.filter((c) => c.status === 'resolved').length;
  const disputedCount = cases.filter((c) => c.status === 'disputed').length;
  const totalDollars = useMemo(() => cases.reduce((sum, c) => sum + Number(c.amountCents || 0), 0), [cases]);

  type DebtTab = 'overview' | 'cases' | 'guides';
  const [tab, setTab] = useState<DebtTab>('overview');

  const debtKpis = useMemo(
    () => [
      { label: 'Cases', value: String(cases.length), hint: 'Total', accent: 'amber' as const },
      { label: 'Active', value: String(openCount + disputedCount), hint: 'Open + disputed', accent: 'emerald' as const },
      { label: 'Resolved', value: String(resolvedCount), hint: 'Done', accent: 'sky' as const },
      {
        label: 'Claimed',
        value: (totalDollars / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
        hint: 'All cases',
        accent: 'violet' as const,
      },
    ],
    [cases.length, openCount, disputedCount, resolvedCount, totalDollars],
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
    <div className={`${finelyOsCatalogCard('violet')} !p-5 border-fuchsia-500/25 space-y-4`}>
      <h2 className={`${FINELY_OS_ENTITY_TITLE} text-lg`}>Letters & affidavits you can use</h2>
      <p className={FINELY_OS_ENTITY_BODY}>
        For each debt or summons case you add, you get personalized drafts and legal basis. Available letter types:
      </p>
      <ul className={`grid sm:grid-cols-2 gap-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
        <li className="flex items-center gap-2">
          <span className="text-fuchsia-300">•</span> <strong>Validation request</strong> — FDCPA § 809, demand proof before collection
        </li>
        <li className="flex items-center gap-2">
          <span className="text-fuchsia-300">•</span> <strong>Time-barred response</strong> — Assert statute of limitations
        </li>
        <li className="flex items-center gap-2">
          <span className="text-fuchsia-300">•</span> <strong>Affidavit of dispute</strong> — Sworn statement; put claimant to proof
        </li>
        <li className="flex items-center gap-2">
          <span className="text-fuchsia-300">•</span> <strong>Summons response / 35-day answer</strong> — Answer & affirmative defenses
        </li>
        <li className="flex items-center gap-2">
          <span className="text-fuchsia-300">•</span> <strong>Cease & desist</strong> — FDCPA § 805(c), stop contact
        </li>
        <li className="flex items-center gap-2">
          <span className="text-fuchsia-300">•</span> <strong>Debt dispute letter</strong> — General dispute, FCRA/FDCPA
        </li>
      </ul>
      <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>Contract law, banking law (UCC), and civil procedure (SOL) are explained on each case page.</p>
    </div>
  );

  return (
    <PageShell
      badge="Partner Portal"
      title="Debt & Summons Center"
      subtitle="Validation requests, affidavits, summons answers (e.g. 35-day), and time-barred responses — with legal basis (FDCPA, contract law, banking law). Add a case to get personalized letter drafts."
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
              eyebrow="Debt & summons"
              title="Validation, affidavits & court answers"
              subtitle="FDCPA workflows with personalized letter drafts per case."
              accent="fuchsia"
              kpis={debtKpis}
              tabs={[
                { id: 'overview', label: 'Overview' },
                { id: 'cases', label: 'Cases', badge: cases.length || undefined },
                { id: 'guides', label: 'Letter types' },
              ]}
              activeTab={tab}
              onTabChange={(id) => setTab(id as DebtTab)}
              primaryAction={{ label: 'Add case', onClick: () => setShowAdd(true) }}
              secondaryAction={{ label: 'Documents vault', onClick: () => navigate('/portal/documents') }}
            >
              {tab === 'overview' && (
                <div className="space-y-4">
                  {cases.length === 0 ? (
                    <div className={`${FINELY_OS_LUXURY_EMPTY} text-center space-y-4`}>
                      <Scale className="mx-auto text-violet-400/70" size={48} />
                      <p className={`${FINELY_OS_ENTITY_VALUE} text-base`}>No debt or summons cases yet</p>
                      <p className={`${FINELY_OS_ENTITY_BODY} max-w-md mx-auto`}>
                        Add a case to open the full legal workflow: strategy dates, recommended letter type, and draft language.
                      </p>
                      <button type="button" onClick={() => setShowAdd(true)} className={FINELY_OS_SUCCESS_BTN}>
                        <Plus size={16} /> Add debt or summons case
                      </button>
                    </div>
                  ) : (
                    <div className={FINELY_OS_NOTICE_WARN}>
                      <strong>{openCount + disputedCount} active case(s)</strong> — open the Cases tab to continue validation, affidavits, or summons answers.
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
                </div>
              )}

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
                    <div className={FINELY_OS_ENTITY_BODY}>No cases yet — use Add case from the hub header or Overview tab.</div>
                  ) : (
                    <>
                      <div className={FINELY_OS_NOTICE_WARN}>
                        Open any case for personalized letter drafts and legal basis (FDCPA, contract law, banking law).
                      </div>
                      <div className="grid lg:grid-cols-2 gap-4">
                        {[
                          {
                            key: 'active',
                            title: 'Active (open / in review / disputed)',
                            items: cases.filter((c) => c.status === 'open' || c.status === 'in_review' || c.status === 'disputed'),
                          },
                          { key: 'resolved', title: 'Resolved', items: cases.filter((c) => c.status === 'resolved') },
                        ].map((group) => (
                          <details key={group.key} className={`${finelyOsCatalogCard('violet')} !p-5 !p-5`} open={group.key === 'active'}>
                            <summary className="cursor-pointer select-none flex items-center justify-between gap-3">
                              <div className={FINELY_OS_ENTITY_VALUE}>{group.title}</div>
                              <div className={FINELY_OS_ENTITY_SUBLABEL}>{group.items.length}</div>
                            </summary>
                            <div className="mt-4 grid gap-3">
                              {group.items.length === 0 ? (
                                <div className={FINELY_OS_ENTITY_BODY}>No cases in this group.</div>
                              ) : (
                                group.items.map((c) => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => navigate(`/portal/debt/${c.id}`)}
                                    className={`${finelyOsInlineListItem()} w-full text-left p-5 flex items-center justify-between gap-4`}
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      {c.type === 'summons' ? (
                                        <FileWarning size={20} className="text-violet-300 shrink-0" />
                                      ) : (
                                        <Scale size={20} className="text-violet-300 shrink-0" />
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
                                ))
                              )}
                            </div>
                          </details>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {tab === 'guides' && letterTypesPanel}
            </FinelyUnifiedHubLayout>

            <FinelyOsPageFooter />
          </div>
        </EntitlementGate>
      )}
    </PageShell>
  );
}
