import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CircleHelp,
  Clock,
  FileWarning,
  Gavel,
  Home,
  PlayCircle,
  Plus,
  Scale,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { ENTITLEMENT_KEYS } from '../../../../billing/entitlements';
import { EntitlementGate } from '../../../../components/billing/EntitlementGate';
import { DebtLaneHandoffStrip } from '../../../../components/debt/DebtLaneHandoffStrip';
import { PartnerSuccessExperiencePanel } from '../../../../components/partner/PartnerSuccessExperiencePanel';
import { SmartProofUploader } from '../../../../components/evidence/SmartProofUploader';
import { LettersCommandCenter, type LettersStudioTab } from '../../../../components/letters/LettersCommandCenter';
import { listDebtByPartner, createDebtCase } from '../../../../data/debtRepo';
import { saveDebtLaneFocus } from '../../../../data/debtLaneStateRepo';
import { getPartnerSync } from '../../../../data/partnersRepo';
import { FinelyOsPaginatedStack } from '../../../../features/os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
} from '../../../../features/os/finelyOsLightUi';
import { computePartnerDebtSnapshot } from '../../../../lib/debtCreditorIntel';
import {
  debtCaseHref,
  debtTabHref,
  isDebtProductPreviewPath,
} from '../../../../lib/debtProductPaths';
import { onDebtCaseCreated } from '../../../../lib/debtWorkflowEngine';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import { AddCaseForm, DebtDefensePlaybookExplorer } from '../../../../pages/portal/PartnerDebtPage';
import { useMappedPartnerNavigate, usePartnerProductPathResolver } from './usePartnerProductNavigation';
import './partnerDebtCommandDeck.css';

type DebtTab =
  | 'overview'
  | 'validation'
  | 'court'
  | 'litigation'
  | 'foreclosure'
  | 'repossession'
  | 'bankruptcy'
  | 'cases'
  | 'guides';

type WorkstationId = DebtTab;

const ACCENT_ROTATION = ['emerald', 'violet', 'sky', 'rose'] as const;

const WORKSTATIONS: Array<{
  id: WorkstationId;
  label: string;
  hint: string;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { id: 'overview', label: 'Overview', hint: 'Cases and next step', accent: 'rose', icon: Scale },
  { id: 'validation', label: 'Validation', hint: 'FDCPA proof demands', accent: 'emerald', icon: ShieldCheck },
  { id: 'litigation', label: 'Litigation', hint: 'Court defense command', accent: 'violet', icon: Gavel },
  { id: 'foreclosure', label: 'Foreclosure', hint: 'RESPA & mortgage', accent: 'sky', icon: Home },
  { id: 'repossession', label: 'Repossession', hint: 'UCC Article 9', accent: 'rose', icon: Truck },
  { id: 'bankruptcy', label: 'Bankruptcy', hint: 'Filing prep', accent: 'emerald', icon: BookOpen },
  { id: 'cases', label: 'All cases', hint: 'Open any matter', accent: 'violet', icon: FileWarning },
  { id: 'guides', label: 'Defense playbook', hint: 'Debt type + phase', accent: 'sky', icon: BookOpen },
];

function normalizeTab(raw: string | null | undefined): DebtTab {
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
}

export function PartnerDebtCommandDeck({
  role,
  pageId,
  partnerId,
  dataMode,
}: WorkspaceProductSurfaceProps) {
  const navigate = useMappedPartnerNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const { pathname, search } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { partner: sessionPartner } = usePartnerSession();
  const isDemo = dataMode === 'demo' || !partnerId;
  const previewDebt = isDebtProductPreviewPath(pathname);

  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? Scale;
  const accent = navItem?.accent ?? 'rose';
  const surfaceMode = navItem?.surfaceMode ?? 'light';

  const partner = useMemo(() => {
    if (partnerId) return getPartnerSync(partnerId) ?? sessionPartner;
    return sessionPartner;
  }, [partnerId, sessionPartner]);

  const [caseRefresh, setCaseRefresh] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addType, setAddType] = useState<'debt' | 'summons'>('debt');
  const [addAmount, setAddAmount] = useState('');
  const [addCaseNumber, setAddCaseNumber] = useState('');
  const [tab, setTab] = useState<DebtTab>(() => normalizeTab(searchParams.get('tab')));
  const [letterStudioTab, setLetterStudioTab] = useState<LettersStudioTab>('validation');

  const cases = useMemo(() => (partner ? listDebtByPartner(partner.id) : []), [partner, caseRefresh]);
  const openCount = cases.filter((c) => c.status === 'open' || c.status === 'in_review').length;
  const disputedCount = cases.filter((c) => c.status === 'disputed').length;
  const totalDollars = useMemo(() => cases.reduce((sum, c) => sum + Number(c.amountCents || 0), 0), [cases]);
  const debtSnapshot = useMemo(() => (partner ? computePartnerDebtSnapshot(partner.id) : null), [partner]);

  const nearestHearing = useMemo(() => {
    let nearest: { name: string; date: string; caseId: string } | null = null;
    for (const c of cases) {
      if (!c.hearingDate) continue;
      if (!nearest || c.hearingDate < nearest.date) {
        nearest = { name: c.name, date: c.hearingDate, caseId: c.id };
      }
    }
    return nearest;
  }, [cases]);

  const deadlineRunway = useMemo(
    () =>
      cases
        .filter((c) => c.hearingDate)
        .sort((a, b) => (a.hearingDate! < b.hearingDate! ? -1 : 1))
        .slice(0, 5),
    [cases],
  );

  useEffect(() => {
    const fromUrl = normalizeTab(searchParams.get('tab'));
    setTab((prev) => (prev === fromUrl ? prev : fromUrl));
  }, [searchParams]);

  const workstationTab =
    tab === 'validation' || tab === 'litigation' || tab === 'court' || tab === 'foreclosure' || tab === 'repossession' || tab === 'bankruptcy'
      ? tab === 'litigation' || tab === 'court'
        ? 'court'
        : tab
      : null;

  const deskChrome =
    workstationTab === 'validation'
      ? 'debt-desk'
      : workstationTab === 'court'
        ? 'litigation-desk'
        : workstationTab === 'foreclosure'
          ? 'foreclosure-desk'
          : workstationTab === 'repossession'
            ? 'repo-desk'
            : workstationTab === 'bankruptcy'
              ? 'bankruptcy-desk'
              : 'letter-studio';

  useEffect(() => {
    if (workstationTab) setLetterStudioTab(workstationTab);
  }, [workstationTab]);

  const workstationMeta = useMemo(() => {
    const active = WORKSTATIONS.find((w) => w.id === tab) ?? WORKSTATIONS[0];
    switch (tab) {
      case 'foreclosure':
        return {
          title: 'Foreclosure command center',
          subtitle: 'RESPA, loss mitigation, dual-track stops, and note demands — with live coach.',
          accent: active.accent,
        };
      case 'repossession':
        return {
          title: 'Repossession command center',
          subtitle: 'UCC Article 9 reinstatement, wrongful repo, and deficiency fights.',
          accent: active.accent,
        };
      case 'litigation':
        return {
          title: 'Litigation command',
          subtitle: 'Hearing countdown, docket scrape, affidavits, answers, and day-of defense.',
          accent: active.accent,
        };
      case 'bankruptcy':
        return {
          title: 'Bankruptcy workstation',
          subtitle: 'Chapter 7/13 prep, stay notices, creditor matrix, and post-discharge disputes.',
          accent: active.accent,
        };
      case 'validation':
        return {
          title: 'Validation workstation',
          subtitle: 'FDCPA proof demands — licensing, chain of title, and accounting.',
          accent: active.accent,
        };
      case 'cases':
        return {
          title: 'All debt & court cases',
          subtitle: 'Open a matter to manage deadlines, court workflow, and letter drafts.',
          accent: active.accent,
        };
      case 'guides':
        return {
          title: 'Defense playbook',
          subtitle: 'Pick debt type and litigation phase for remedy steps and eCFR cites.',
          accent: active.accent,
        };
      default:
        return {
          title: 'Debt & court overview',
          subtitle: 'Add cases, upload proof, and open the workstation that matches your matter.',
          accent: active.accent,
        };
    }
  }, [tab]);

  const handleTabChange = (id: WorkstationId) => {
    const next = normalizeTab(id);
    setTab(next);
    const params = new URLSearchParams(searchParams);
    if (next === 'overview') params.delete('tab');
    else params.set('tab', next === 'litigation' ? 'litigation' : next);
    params.delete('caseId');
    setSearchParams(params, { replace: true });
    if (partner && next !== 'overview' && next !== 'cases' && next !== 'guides') {
      saveDebtLaneFocus(partner.id, next === 'litigation' ? 'court' : next);
    }
  };

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
    navigate(debtCaseHref(created.id, pathname, search));
  };

  const lettersPath = previewDebt ? '/preview/workspace-light/portal/letters' : '/portal/letters';
  const go = (path: string) => navigate(mapPortalHref(path));

  const metrics: ProductMetric[] = [
    {
      label: 'Active cases',
      value: openCount + disputedCount,
      hint: `${cases.length} total`,
      accent: 'rose',
      icon: Scale,
      onClick: () => handleTabChange('cases'),
    },
    {
      label: 'Summons',
      value: debtSnapshot?.summonsCount ? String(debtSnapshot.summonsCount) : '0',
      hint: debtSnapshot?.summonsClaimedCents
        ? (debtSnapshot.summonsClaimedCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
        : 'None yet',
      accent: 'violet',
      icon: Gavel,
      onClick: () => handleTabChange('litigation'),
    },
    {
      label: 'On report',
      value: debtSnapshot?.reportedCents
        ? (debtSnapshot.reportedCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
        : '—',
      hint: debtSnapshot?.reportedCount ? `${debtSnapshot.reportedCount} tradelines` : 'Upload report',
      accent: 'sky',
      icon: FileWarning,
      onClick: () => go('/portal/reports'),
    },
    {
      label: 'In cases',
      value: (totalDollars / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
      hint: 'Claimed total',
      accent: 'emerald',
      icon: ShieldCheck,
      onClick: () => handleTabChange('cases'),
    },
  ];

  const runwaySignals = [
    {
      label: 'Court deadlines',
      hint: nearestHearing
        ? `${nearestHearing.name} · ${new Date(nearestHearing.date).toLocaleDateString()}`
        : 'No hearing dates set',
      accent: 'rose' as const,
      icon: Clock,
    },
    {
      label: 'Active matters',
      hint: `${openCount + disputedCount} open or disputed`,
      accent: 'violet' as const,
      icon: Scale,
    },
    {
      label: 'Letter libraries',
      hint: 'Validation through bankruptcy tracks',
      accent: 'sky' as const,
      icon: BookOpen,
    },
  ];

  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button
        type="button"
        onClick={() => openProductCopilot({ prompt: 'What should I do first on my debt case?', contextLabel: 'Debt & court' })}
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
        title="Sign in to open Debt & Court"
        description="Track validation, litigation, foreclosure, repossession, and bankruptcy — with court deadlines on each case."
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
          <button type="button" className="fc-wlp-btn-primary" onClick={() => go('/portal/dashboard')}>
            Return to dashboard
          </button>
        }
      />
    );
  }

  const overviewBody = (
    <div className="space-y-5">
      {deadlineRunway.length > 0 ? (
        <div className="fc-wlp-debt-deadline-runway" aria-label="Court deadline runway">
          <div className="fc-wlp-debt-deadline-runway-head">
            <Clock size={18} />
            <div>
              <p className={`text-sm font-extrabold ${FINELY_OS_ENTITY_SUBLABEL}`}>Court deadline runway</p>
              <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Open a case to manage docket steps and letter drafts.</p>
            </div>
          </div>
          <ol className="fc-wlp-debt-deadline-runway-track">
            {deadlineRunway.map((c, idx) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="fc-wlp-debt-deadline-runway-node"
                  data-fc-accent={ACCENT_ROTATION[idx % ACCENT_ROTATION.length]}
                  onClick={() => navigate(debtCaseHref(c.id, pathname, search))}
                >
                  <span className="fc-wlp-debt-deadline-runway-date">
                    {new Date(c.hearingDate!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="fc-wlp-debt-deadline-runway-name">{c.name}</span>
                  <span className="fc-wlp-debt-deadline-runway-meta">{c.type} · {c.status}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <SmartProofUploader
        partner={partner}
        email={partner.profile.email}
        uploadContext="debt"
        compact
        onUploaded={() => setCaseRefresh((v) => v + 1)}
      />

      {cases.length === 0 ? (
        <div className={`${FINELY_OS_LUXURY_EMPTY} text-center space-y-4`}>
          <Scale className="mx-auto text-violet-400/70" size={48} />
          <p className={`${FINELY_OS_ENTITY_VALUE} text-base`}>No debt or summons cases yet</p>
          <p className={`${FINELY_OS_ENTITY_BODY} max-w-md mx-auto`}>
            Add a case, then open Validation, Litigation, Foreclosure, or Repossession from the rail.
          </p>
          <button type="button" onClick={() => setShowAdd(true)} className={FINELY_OS_SUCCESS_BTN}>
            <Plus size={16} /> Add debt or summons case
          </button>
        </div>
      ) : (
        <p className={FINELY_OS_ENTITY_BODY}>
          <strong className={FINELY_OS_ENTITY_VALUE}>{openCount + disputedCount} active case(s).</strong> Each workstation has its own letter library and coach.
        </p>
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

      <div className={`${finelyOsCatalogCard('violet')} flex flex-wrap items-center justify-between gap-3 p-6 lg:p-8`} data-fc-accent="violet">
        <div>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Court defense</div>
          <p className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
            Hearing countdown, docket scrape, and affidavit builds live in Litigation command.
          </p>
        </div>
        <Link to={debtTabHref('litigation', pathname, search)} className={FINELY_OS_PRIMARY_BTN} onClick={() => handleTabChange('litigation')}>
          Open litigation <ArrowRight size={14} />
        </Link>
      </div>

      <PartnerSuccessExperiencePanel partnerId={partner.id} lane="debt" compact />
    </div>
  );

  const casesBody = (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => setShowAdd(true)} className={FINELY_OS_SUCCESS_BTN}>
          <Plus size={14} /> Add case
        </button>
        <button type="button" onClick={() => go(lettersPath)} className={FINELY_OS_SECONDARY_BTN}>
          Credit letters <ArrowRight size={14} />
        </button>
      </div>
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
        <div className={FINELY_OS_ENTITY_BODY}>No cases yet — add one to track deadlines and court workflow.</div>
      ) : (
        <FinelyOsPaginatedStack
          items={cases}
          pageSize={12}
          emptyMessage="No cases yet."
          renderItem={(c) => (
            <button
              key={c.id}
              type="button"
              className="fc-wlp-debt-case-item"
              onClick={() => navigate(debtCaseHref(c.id, pathname, search))}
            >
              <div className="fc-wlp-debt-case-item-title">{c.name}</div>
              <div className="fc-wlp-debt-case-item-meta">
                {(c.amountCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} · {c.type} · {c.status}
                {c.hearingDate ? ` · hearing ${new Date(c.hearingDate).toLocaleDateString()}` : ''}
              </div>
            </button>
          )}
        />
      )}
    </div>
  );

  const workbenchBody = (
    <section className={`fc-wlp-section ${FINELY_OS_PAGE} fc-wlp-debt-command-root`} data-surface-layout="command-deck">
      {workstationTab ? null : (
      <header className="fc-wlp-debt-runway-band" aria-label="Debt runway">
        <div>
          <span className="fc-wlp-debt-runway-eyebrow">
            <Scale size={14} /> Debt & court
          </span>
          <h2 className="fc-wlp-debt-runway-title">Your debt runway</h2>
          <p className="fc-wlp-debt-runway-purpose">
            Validation, litigation, foreclosure, repossession, and bankruptcy — with court deadlines on open cases.
          </p>
        </div>
        <div className="fc-wlp-debt-runway-signals">
          {runwaySignals.map((signal, index) => {
            const Icon = signal.icon;
            const accentKey = ACCENT_ROTATION[index % ACCENT_ROTATION.length];
            return (
              <div key={signal.label} className="fc-wlp-debt-runway-signal" data-fc-accent={accentKey}>
                <span className="fc-wlp-debt-runway-signal-icon">
                  <Icon size={16} strokeWidth={2.2} />
                </span>
                <span className="fc-wlp-debt-runway-signal-copy">
                  <strong>{signal.label}</strong>
                  <span>{signal.hint}</span>
                </span>
              </div>
            );
          })}
        </div>
      </header>
      )}

      <div className="fc-wlp-debt-workbench">
        <aside className="fc-wlp-debt-workstation-rail" aria-label="Debt workstations">
          {WORKSTATIONS.map((w) => {
            const Icon = w.icon;
            const active = tab === w.id || (w.id === 'litigation' && tab === 'court');
            const badge = w.id === 'cases' && cases.length ? cases.length : undefined;
            return (
              <button
                key={w.id}
                type="button"
                data-active={active ? 'true' : undefined}
                aria-current={active ? 'page' : undefined}
                className={`fc-wlp-debt-workstation-btn ${finelyOsCatalogCard(w.accent)}`}
                data-fc-accent={w.accent}
                onClick={() => handleTabChange(w.id)}
              >
                <div className="flex items-center gap-2">
                  <Icon size={18} className="shrink-0 opacity-90" />
                  <strong>{w.label}</strong>
                </div>
                <span>{w.hint}</span>
                {active ? <em className="fc-wlp-debt-here">You are here</em> : badge ? <em>{badge} cases</em> : null}
              </button>
            );
          })}
        </aside>

        {tab === 'overview' && cases.length > 0 ? (
          <div className="fc-wlp-debt-case-queue">
            <p className={`text-sm font-extrabold ${FINELY_OS_ENTITY_SUBLABEL}`}>Recent cases</p>
            <div className="fc-wlp-debt-case-queue-row">
              {cases.slice(0, 4).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="fc-wlp-debt-case-item"
                  onClick={() => navigate(debtCaseHref(c.id, pathname, search))}
                >
                  <div className="fc-wlp-debt-case-item-title">{c.name}</div>
                  <div className="fc-wlp-debt-case-item-meta">{c.type} · {c.status}</div>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="fc-wlp-debt-workbench-main">
          {!workstationTab && tab !== 'overview' ? (
            <div className={`fc-wlp-debt-workbench-head ${finelyOsCatalogCard(workstationMeta.accent)}`} data-fc-accent={workstationMeta.accent}>
              <p className={FINELY_OS_ENTITY_SUBLABEL}>{WORKSTATIONS.find((w) => w.id === tab)?.label ?? 'Workstation'}</p>
              <h3>{workstationMeta.title}</h3>
              <p>{workstationMeta.subtitle}</p>
            </div>
          ) : null}

          {tab === 'overview' ? overviewBody : null}
          {tab === 'cases' ? casesBody : null}
          {tab === 'guides' ? <DebtDefensePlaybookExplorer /> : null}

          {workstationTab ? (
            <LettersCommandCenter
              partner={partner}
              layout="embedded"
              unifiedShell
              activeTab={letterStudioTab}
              debtCenterMode
              deskChrome={deskChrome}
              onTabChange={(next) => {
                setLetterStudioTab(next);
                if (next === 'overview') return;
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
        </div>
      </div>
    </section>
  );

  return (
    <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.debt]}>
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow="Debt & court"
        title="Debt & court workstations"
        description="Validation, litigation, foreclosure, repossession, and bankruptcy — open cases for deadlines and court workflow."
        status={`${openCount + disputedCount} active · ${cases.length} case${cases.length === 1 ? '' : 's'}`}
        freshness={nearestHearing ? `Hearing ${new Date(nearestHearing.date).toLocaleDateString()}` : 'live data'}
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        metricsVariant="grid"
        primaryAction={<ProductPagePrimaryAction label="Add case" onClick={() => setShowAdd(true)} />}
        secondaryAction={
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => go(lettersPath)}>
            Credit letters
          </button>
        }
        metrics={workstationTab ? undefined : metrics}
        metricTitle="Debt signals"
        metricDescription="Active matters, summons load, report tradelines, and claimed totals."
      >
        {workbenchBody}
        {workstationTab ? null : (
        <aside className="fc-wlp-page-guide mt-6">
          <div className="fc-wlp-page-guide-icon">
            <PageIcon size={22} strokeWidth={2.05} />
          </div>
          <div className="fc-wlp-eyebrow">What to do next</div>
          <h2>{cases.length ? 'Open the workstation that matches your matter' : 'Add your first case'}</h2>
          <p>
            {cases.length
              ? 'Validation for collector proof, Litigation for court deadlines, and foreclosure or repossession tracks for collateral fights.'
              : 'Name the creditor or plaintiff, then pick Validation or Litigation from the rail.'}
          </p>
          <ol>
            <li>Add or open a debt or summons case.</li>
            <li>Upload proof tied to the matter.</li>
            <li>Draft letters and track court dates in the case inspector.</li>
          </ol>
          {guideActions}
        </aside>
        )}
        <p className="fc-wlp-section-description fc-wlp-compliance-line mt-4">
          Results vary · not legal advice · funding subject to underwriting
        </p>
      </ProductHubScaffold>
    </EntitlementGate>
  );
}
