import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  CircleHelp,
  Clock3,
  ExternalLink,
  FileSearch,
  Megaphone,
  Paperclip,
  PlayCircle,
  Scale,
  Send,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { EntitlementGate } from '../../../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../../../billing/entitlements';
import { LegalResourceStrip } from '../../../../components/debt/DebtCoachMessage';
import { getCase, listCasesByPartner } from '../../../../data/casesRepo';
import { listCourtOutcomesByPartner } from '../../../../data/courtOutcomeRepo';
import {
  createEscalation,
  listEscalationsByPartner,
} from '../../../../data/escalationsRepo';
import { listEvidenceByPartner } from '../../../../data/evidenceRepo';
import {
  createRegulatoryComplaint,
  listRegulatoryComplaintsByPartner,
  markRegulatoryComplaintSubmitted,
} from '../../../../data/regulatoryComplaintsRepo';
import { courtOutcomeHeadline } from '../../../../domain/courtOutcomes';
import type { EscalationTopic, EscalationPriority } from '../../../../domain/escalations';
import type { PartnerEscalation } from '../../../../domain/escalations';
import type { RegulatoryBody, RegulatoryComplaint, RegulatoryTargetType } from '../../../../domain/regulatoryComplaints';
import type { DisputeRoundLabel } from '../../../../domain/disputeWorkflow';
import { openBlobRefInNewTab } from '../../../../lib/openBlobRef';
import {
  POST_COURT_ESCALATION_TRIGGER_LABELS,
  POST_COURT_PLAN_ESCALATION,
  postCourtPlanRiskFlags,
} from '../../../../lib/postCourtPaymentPlanPath';
import { REGULATORY_PORTALS, resourcesForEscalations } from '../../../../lib/legalResources';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsInlineListItem,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import type { WorkspaceProductStatus } from '../workspaceProductTokens';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductDashboardSkeleton, ProductEmptyState, ProductStatusPill, type ProductMetric } from '../components/ProductUi';
import './partnerWorkstationSurfaceTabs.css';

const METRICS_VARIANT = 'grid' as const;

const TOPICS: { value: EscalationTopic; label: string }[] = [
  { value: 'billing', label: 'Billing' },
  { value: 'service', label: 'Service quality' },
  { value: 'dispute_process', label: 'Dispute process' },
  { value: 'documents_access', label: 'Documents & access' },
  { value: 'legal_letters', label: 'Legal letters / debt' },
  { value: 'other', label: 'Other' },
];

const PRIORITIES: { value: EscalationPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const RESPONSE_WINDOW_DAYS: Record<RegulatoryBody, number> = { CFPB: 30, FTC: 30, AG: 30, BBB: 14 };

type ComposeTab = 'track' | 'submit' | 'regulatory';

function formatFreshness(iso?: string): string {
  if (!iso) return 'no escalations yet';
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'just now';
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months <= 1 ? '1 month ago' : `${months} months ago`;
}

function formatShortDate(iso?: string): string {
  if (!iso) return 'soon';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return 'soon';
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function diffDays(iso: string): number {
  return Math.ceil((Date.parse(iso) - Date.now()) / 86_400_000);
}

type ComplaintDeadline = { dueIso: string; daysRemaining: number; tone: 'ok' | 'warning' | 'blocking' };

function complaintDeadline(complaint: RegulatoryComplaint): ComplaintDeadline | null {
  if (!complaint.submittedAt) return null;
  if (complaint.status === 'resolved' || complaint.status === 'closed') return null;
  const windowDays = RESPONSE_WINDOW_DAYS[complaint.body] ?? 30;
  const dueDate = new Date(complaint.submittedAt);
  dueDate.setDate(dueDate.getDate() + windowDays);
  const dueIso = dueDate.toISOString();
  const daysRemaining = diffDays(dueIso);
  return { dueIso, daysRemaining, tone: daysRemaining <= 0 ? 'blocking' : daysRemaining <= 7 ? 'warning' : 'ok' };
}

function escalationStatusFor(escalation: PartnerEscalation): WorkspaceProductStatus {
  if (escalation.status === 'resolved' || escalation.status === 'closed') return 'complete';
  if (escalation.status === 'pending_partner') return 'waiting';
  if (escalation.priority === 'urgent' || escalation.priority === 'high') return 'needs_action';
  return 'in_progress';
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; escalations: PartnerEscalation[]; complaints: RegulatoryComplaint[] };

const COMPOSE_RAIL_TABS: Array<{ id: ComposeTab; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { id: 'track', label: 'My escalations', icon: FileSearch },
  { id: 'submit', label: 'Submit escalation', icon: Send },
  { id: 'regulatory', label: 'Regulatory complaints', icon: Scale },
];

function EscalationRunway({
  composeTab,
  onComposeTabChange,
  alertHeadline,
  alertDetail,
  openEscalationCount,
  openComplaintCount,
  children,
}: {
  composeTab: ComposeTab;
  onComposeTabChange: (tab: ComposeTab) => void;
  alertHeadline?: string;
  alertDetail?: string;
  openEscalationCount: number;
  openComplaintCount: number;
  children: React.ReactNode;
}) {
  const badgeFor = (tab: ComposeTab) => {
    if (tab === 'track') return openEscalationCount || undefined;
    if (tab === 'regulatory') return openComplaintCount || undefined;
    return undefined;
  };

  return (
    <div className="fc-wlp-escalation-runway" data-surface-layout="compose-runway">
      <div className="space-y-5">
        {alertHeadline ? (
          <div className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8 fc-wlp-escalation-alert-rail`} data-fc-accent="rose">
            <div className="min-w-0">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Response window</div>
              <h2 className={`mt-1 text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{alertHeadline}</h2>
              {alertDetail ? <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{alertDetail}</p> : null}
            </div>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => onComposeTabChange('regulatory')}>
              View complaints <ArrowUpRight size={14} />
            </button>
          </div>
        ) : null}

        <div className="fc-wlp-escalation-compose-panel">{children}</div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-4">
        <nav className="fc-wlp-escalation-compose-rail" aria-label="Escalation workspaces">
          {COMPOSE_RAIL_TABS.map((tab) => {
            const badge = badgeFor(tab.id);
            return (
              <button
                key={tab.id}
                type="button"
                className="fc-wlp-escalation-compose-tab"
                data-active={composeTab === tab.id ? 'true' : undefined}
                aria-current={composeTab === tab.id ? 'page' : undefined}
                onClick={() => onComposeTabChange(tab.id)}
              >
                <tab.icon size={16} />
                <span className="flex-1">{tab.label}</span>
                {badge ? <span className="fc-wlp-escalation-stage-chip-badge">{badge}</span> : null}
              </button>
            );
          })}
        </nav>

        <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-4`} data-fc-accent="sky">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Filing portals</div>
          <LegalResourceStrip links={resourcesForEscalations()} accentClass="text-sky-600" />
          <div className="fc-wlp-escalation-venues">
            {REGULATORY_PORTALS.map((portal) => (
              <button
                key={portal.id}
                type="button"
                className="fc-wlp-escalation-venue-chip"
                title={portal.hint}
                onClick={() => window.open(portal.href, '_blank', 'noopener')}
              >
                {portal.label} <ExternalLink size={12} />
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function PartnerEscalationsProductSurface({ role, pageId, partnerId, dataMode }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mapPortalHref = usePartnerProductPathResolver();
  const { partner: sessionPartner } = usePartnerSession();
  const partner = partnerId ? sessionPartner : sessionPartner;
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? Megaphone;
  const livePath = mapPortalHref(navItem?.legacyPath ?? '/portal/escalations');
  const scaffoldAccent = navItem?.accent ?? 'rose';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const isDemo = dataMode === 'demo' || !partnerId;

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [retryToken, setRetryToken] = useState(0);
  const [composeTab, setComposeTab] = useState<ComposeTab>('track');
  const [version, setVersion] = useState(0);

  const [formTopic, setFormTopic] = useState<EscalationTopic>('billing');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<EscalationPriority>('medium');
  const [formCaseId, setFormCaseId] = useState('');
  const [formDisputeRound, setFormDisputeRound] = useState<DisputeRoundLabel | ''>('');
  const [submitted, setSubmitted] = useState(false);

  const [complaintBody, setComplaintBody] = useState<RegulatoryBody>('CFPB');
  const [complaintTargetType, setComplaintTargetType] = useState<RegulatoryTargetType>('bureau');
  const [complaintTargetName, setComplaintTargetName] = useState('');
  const [complaintCaseId, setComplaintCaseId] = useState('');
  const [complaintNarrative, setComplaintNarrative] = useState('');
  const [complaintEvidenceIds, setComplaintEvidenceIds] = useState<string[]>([]);
  const [complaintDisputeRound, setComplaintDisputeRound] = useState<DisputeRoundLabel | ''>('');
  const [complaintRefNo, setComplaintRefNo] = useState('');
  const [complaintJustSubmittedId, setComplaintJustSubmittedId] = useState<string | null>(null);

  const linkedCaseId = searchParams.get('caseId') || '';
  const linkedRound = (searchParams.get('round') || '') as DisputeRoundLabel | '';
  const linkedCase = useMemo(() => (linkedCaseId ? getCase(linkedCaseId) : null), [linkedCaseId]);

  useEffect(() => {
    if (linkedCaseId) {
      setComplaintCaseId(linkedCaseId);
      setFormCaseId(linkedCaseId);
      setFormTopic('dispute_process');
    }
    if (linkedRound === 'Round 1' || linkedRound === 'Round 2' || linkedRound === 'Round 3') {
      setComplaintDisputeRound(linkedRound);
      setFormDisputeRound(linkedRound);
    }
  }, [linkedCaseId, linkedRound]);

  useEffect(() => {
    const onStore = () => {
      setVersion((v) => v + 1);
      setRetryToken((t) => t + 1);
    };
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    setState({ status: 'loading' });
    try {
      const escalations = listEscalationsByPartner(partnerId!);
      const complaints = listRegulatoryComplaintsByPartner(partnerId!);
      if (!cancelled) setState({ status: 'ready', escalations, complaints });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load your escalations right now.';
      if (!cancelled) setState({ status: 'error', message });
    }
    return () => {
      cancelled = true;
    };
  }, [isDemo, partnerId, retryToken, version]);

  const cases = useMemo(() => (partner && !isDemo ? listCasesByPartner(partner.id) : []), [partner, isDemo, version]);
  const evidence = useMemo(() => (partner && !isDemo ? listEvidenceByPartner(partner.id) : []), [partner, isDemo, version]);
  const planOutcome = useMemo(
    () => (partner && !isDemo ? listCourtOutcomesByPartner(partner.id).find((o) => o.kind === 'payment_plan' && o.plan) : null),
    [partner, isDemo, version],
  );
  const planRiskFlags = useMemo(() => (planOutcome ? postCourtPlanRiskFlags(planOutcome) : []), [planOutcome]);

  const demoSpec = useMemo(() => getWorkspaceProductPageSpec('partner', pageId), [pageId]);

  const askFinelyPrompt = 'What escalations are open, and what is the response deadline?';
  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button type="button" onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: navItem?.label ?? 'Escalations' })}>
        <CircleHelp size={15} /> Ask Finely
      </button>
      <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
        <PlayCircle size={15} /> Watch how
      </button>
    </div>
  );

  const handleSubmitEscalation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner || !formTitle.trim() || !formDescription.trim()) return;
    createEscalation({
      partnerId: partner.id,
      topic: formTopic,
      title: formTitle.trim(),
      description: formDescription.trim(),
      priority: formPriority,
      caseId: formCaseId || linkedCaseId || undefined,
      disputeRound: formDisputeRound || linkedRound || undefined,
    });
    setFormTitle('');
    setFormDescription('');
    setSubmitted(true);
    setVersion((v) => v + 1);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const formLabel = `block ${FINELY_OS_ENTITY_LABEL} mb-1`;

  const renderSubmitPanel = () => (
    <div className="space-y-4">
      {planOutcome ? (
        <details className={`${finelyOsCatalogCard('rose')} group`} data-fc-accent="rose">
          <summary className="cursor-pointer select-none list-none">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Court plan escalation path</div>
                <div className={`mt-0.5 text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>
                  {courtOutcomeHeadline(planOutcome)} · {POST_COURT_PLAN_ESCALATION.length} levels ready
                </div>
                <p className={`mt-0.5 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                  {planRiskFlags.length
                    ? planRiskFlags.join(' · ')
                    : 'Plan on track — open this only if a payment slips, contact turns improper, or the numbers stop matching.'}
                </p>
              </div>
            </div>
          </summary>
          <div className="mt-3 space-y-2 border-t border-slate-200/60 pt-3">
            {POST_COURT_PLAN_ESCALATION.map((s) => (
              <div key={s.level} className={`${finelyOsInlineListItem()} !items-start`}>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold uppercase tracking-wide text-rose-600/90">
                    Level {s.level} · {POST_COURT_ESCALATION_TRIGGER_LABELS[s.trigger]}
                  </div>
                  <div className={`mt-1 text-base font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{s.title}</div>
                  <p className={`mt-1 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{s.when}</p>
                  <p className={`mt-1 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                    Goes to: {s.escalateTo}{s.timing ? ` · ${s.timing}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className={FINELY_OS_SECONDARY_BTN}
                    onClick={() => {
                      setFormTopic('legal_letters');
                      setFormPriority(s.level >= 5 ? 'urgent' : 'high');
                      setFormTitle(`Court plan · Level ${s.level} — ${s.title}`);
                      setFormDescription(
                        [
                          `Outcome on file: ${courtOutcomeHeadline(planOutcome)} (${planOutcome.decidedIso}).`,
                          `Trigger: ${POST_COURT_ESCALATION_TRIGGER_LABELS[s.trigger]}.`,
                          `Use when: ${s.when}`,
                          '',
                          'Steps to run:',
                          ...s.actions.map((a, i) => `${i + 1}. ${a}`),
                          '',
                          `Bring: ${s.evidenceChecklist.join(', ')}.`,
                        ].join('\n'),
                      );
                      document.getElementById('escalation-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  >
                    Use this level
                  </button>
                  {s.externalUrl ? (
                    <a href={s.externalUrl} target="_blank" rel="noopener noreferrer" className={FINELY_OS_SECONDARY_BTN}>
                      File it <ExternalLink size={11} />
                    </a>
                  ) : null}
                  {s.href ? (
                    <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(mapPortalHref(s.href!))}>
                      {s.hrefLabel || 'Open'}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </details>
      ) : null}

      <form id="escalation-form" onSubmit={handleSubmitEscalation} className="space-y-4">
        <h3 className={`text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Submit an escalation</h3>
        <p className={FINELY_OS_ENTITY_BODY}>Billing, service quality, dispute process, or documents — formal tracking with a response.</p>
        {linkedCase ? (
          <div className={FINELY_OS_NOTICE_WARN}>
            Linked to case: <span className="font-extrabold">{linkedCase.title}</span>
            {linkedRound ? ` · ${linkedRound}` : ''}
          </div>
        ) : null}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={formLabel}>Topic</label>
            <select value={formTopic} onChange={(e) => setFormTopic(e.target.value as EscalationTopic)} className={FINELY_OS_ENTITY_SELECT}>
              {TOPICS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={formLabel}>Priority</label>
            <select value={formPriority} onChange={(e) => setFormPriority(e.target.value as EscalationPriority)} className={FINELY_OS_ENTITY_SELECT}>
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={formLabel}>Link to case (optional)</label>
            <select value={formCaseId || linkedCaseId} onChange={(e) => setFormCaseId(e.target.value)} className={FINELY_OS_ENTITY_SELECT}>
              <option value="">No case linked</option>
              {cases.slice(0, 12).map((c) => (
                <option key={c.id} value={c.id}>{c.title || c.id} ({c.status})</option>
              ))}
            </select>
          </div>
          <div>
            <label className={formLabel}>Dispute round</label>
            <select value={formDisputeRound || linkedRound} onChange={(e) => setFormDisputeRound(e.target.value as DisputeRoundLabel | '')} className={FINELY_OS_ENTITY_SELECT}>
              <option value="">Not round-specific</option>
              <option value="Round 1">Round 1</option>
              <option value="Round 2">Round 2</option>
              <option value="Round 3">Round 3</option>
            </select>
          </div>
        </div>
        <div>
          <label className={formLabel}>Title</label>
          <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Short summary" className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} required />
        </div>
        <div>
          <label className={formLabel}>Description</label>
          <textarea
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder="Describe the issue and what resolution you need..."
            rows={4}
            className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} resize-y min-h-[6rem]`}
            required
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {formTopic === 'legal_letters' ? (
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(mapPortalHref('/portal/debt'))}>
              Open debt center
            </button>
          ) : null}
          <button type="submit" className={FINELY_OS_SUCCESS_BTN} disabled={isDemo}>
            <Send size={14} /> Submit escalation
          </button>
          {submitted ? <span className="text-emerald-600 text-sm font-bold">Escalation submitted.</span> : null}
        </div>
      </form>
    </div>
  );

  const renderRegulatoryPanel = (complaints: RegulatoryComplaint[]) => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className={`text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Regulatory complaints</h3>
          <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>Draft here → file at the official portal → track reference # in Finely.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => navigate(mapPortalHref('/portal/letters/vault'))} className={FINELY_OS_SECONDARY_BTN}>
            Letters vault
          </button>
          <button type="button" onClick={() => navigate(mapPortalHref('/portal/documents'))} className={FINELY_OS_SECONDARY_BTN}>
            Documents
          </button>
        </div>
      </div>

      <LegalResourceStrip
        links={[
          { id: 'cfpb', label: 'CFPB — file complaint', href: 'https://www.consumerfinance.gov/complaint/', external: true },
          { id: 'ftc', label: 'FTC — report fraud', href: 'https://reportfraud.ftc.gov/', external: true },
          { id: 'naag', label: 'Find your AG', href: 'https://www.naag.org/find-my-ag/', external: true },
          { id: 'bbb', label: 'BBB complaint', href: 'https://www.bbb.org/file-a-complaint', external: true },
        ]}
        accentClass="text-violet-600"
      />

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className={formLabel}>Body</label>
          <select value={complaintBody} onChange={(e) => setComplaintBody(e.target.value as RegulatoryBody)} className={FINELY_OS_ENTITY_SELECT}>
            <option value="CFPB">CFPB</option>
            <option value="AG">Attorney General</option>
            <option value="FTC">FTC</option>
            <option value="BBB">BBB</option>
          </select>
        </div>
        <div>
          <label className={formLabel}>Target type</label>
          <select value={complaintTargetType} onChange={(e) => setComplaintTargetType(e.target.value as RegulatoryTargetType)} className={FINELY_OS_ENTITY_SELECT}>
            <option value="bureau">Credit bureau</option>
            <option value="furnisher">Furnisher / creditor</option>
            <option value="collector">Collector</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className={formLabel}>Target name</label>
          <input value={complaintTargetName} onChange={(e) => setComplaintTargetName(e.target.value)} placeholder="Experian / Equifax / Midland Credit" className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} />
        </div>
        <div>
          <label className={formLabel}>Link to a case (optional)</label>
          <select value={complaintCaseId || linkedCaseId} onChange={(e) => setComplaintCaseId(e.target.value)} className={FINELY_OS_ENTITY_SELECT}>
            <option value="">No case linked</option>
            {cases.slice(0, 12).map((c) => (
              <option key={c.id} value={c.id}>{c.title || c.id} ({c.status})</option>
            ))}
          </select>
        </div>
        <div>
          <label className={formLabel}>Dispute round</label>
          <select
            value={complaintDisputeRound || linkedRound}
            onChange={(e) => setComplaintDisputeRound(e.target.value as DisputeRoundLabel | '')}
            className={FINELY_OS_ENTITY_SELECT}
          >
            <option value="">Not round-specific</option>
            <option value="Round 1">Round 1</option>
            <option value="Round 2">Round 2</option>
            <option value="Round 3">Round 3</option>
          </select>
        </div>
      </div>

      <div>
        <label className={formLabel}>Narrative</label>
        <textarea
          value={complaintNarrative}
          onChange={(e) => setComplaintNarrative(e.target.value)}
          rows={5}
          placeholder="What happened, what you tried, what you want corrected, and what evidence you attached."
          className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} resize-y min-h-[8rem]`}
        />
      </div>

      <details className={`${finelyOsCatalogCard('sky')} fc-surface-harmony`} data-fc-accent="sky">
        <summary className="cursor-pointer select-none flex items-center justify-between gap-3">
          <div className={`${FINELY_OS_ENTITY_LABEL} flex items-center gap-2`}>
            <Paperclip size={14} /> Attach evidence ({complaintEvidenceIds.length})
          </div>
        </summary>
        <div className="mt-3 grid sm:grid-cols-2 gap-2 max-h-[min(280px,40vh)] overflow-y-auto">
          {evidence.map((ev) => (
            <label key={ev.id} className={`flex items-start gap-2 rounded-xl border border-slate-200/80 p-3 cursor-pointer ${complaintEvidenceIds.includes(ev.id) ? 'ring-2 ring-violet-400/40 bg-violet-500/5' : ''}`}>
              <input
                type="checkbox"
                checked={complaintEvidenceIds.includes(ev.id)}
                onChange={() =>
                  setComplaintEvidenceIds((prev) => (prev.includes(ev.id) ? prev.filter((x) => x !== ev.id) : [...prev, ev.id]))
                }
                className="mt-1 accent-violet-500"
              />
              <div className="min-w-0">
                <div className={`${FINELY_OS_ENTITY_VALUE} text-sm truncate`}>{ev.filename || ev.caption || ev.id}</div>
                <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} truncate`}>{ev.mimeType}</div>
              </div>
            </label>
          ))}
        </div>
      </details>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={isDemo || !partner}
          onClick={() => {
            if (!partner || !complaintTargetName.trim() || !complaintNarrative.trim()) return;
            createRegulatoryComplaint({
              partnerId: partner.id,
              body: complaintBody,
              targetType: complaintTargetType,
              targetName: complaintTargetName.trim(),
              narrative: complaintNarrative.trim(),
              evidenceIds: complaintEvidenceIds,
              caseId: complaintCaseId || linkedCaseId || undefined,
              disputeRound: complaintDisputeRound || linkedRound || undefined,
            });
            setComplaintTargetName('');
            setComplaintNarrative('');
            setComplaintEvidenceIds([]);
            setComplaintCaseId('');
            setVersion((v) => v + 1);
          }}
          className={FINELY_OS_SUCCESS_BTN}
        >
          <Send size={14} /> Save draft
        </button>
        <button type="button" onClick={() => navigate(mapPortalHref('/portal/documents'))} className={FINELY_OS_SECONDARY_BTN}>
          Open documents <ExternalLink size={14} />
        </button>
      </div>

      {complaints.length > 0 ? (
        <FinelyOsPaginatedStack
          items={complaints}
          pageSize={4}
          itemSpacingClassName="space-y-3"
          emptyMessage="No complaints yet."
          renderItem={(c, idx) => {
            const cardAccent = (['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4];
            return (
              <div key={c.id} className={`${finelyOsCatalogCard(cardAccent)} space-y-3`} data-fc-accent={cardAccent}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{c.body} · {c.targetName}</div>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>{c.status} · {c.targetType}</div>
                  </div>
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>{formatShortDate(c.createdAt)}</div>
                </div>
                <p className={`${FINELY_OS_ENTITY_BODY} line-clamp-3 whitespace-pre-wrap`}>{c.narrative}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">
                    <Paperclip size={12} className="inline mr-1" /> {c.evidenceIds.length} exhibit{c.evidenceIds.length === 1 ? '' : 's'}
                  </span>
                  {c.status === 'draft' ? (
                    <>
                      <input
                        value={complaintJustSubmittedId === c.id ? complaintRefNo : ''}
                        onChange={(e) => {
                          setComplaintJustSubmittedId(c.id);
                          setComplaintRefNo(e.target.value);
                        }}
                        placeholder="Reference #"
                        className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} !py-2 text-sm max-w-[200px]`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          markRegulatoryComplaintSubmitted({
                            id: c.id,
                            referenceNumber: complaintJustSubmittedId === c.id ? complaintRefNo.trim() : undefined,
                            submissionMethod: 'online',
                          });
                          setComplaintRefNo('');
                          setComplaintJustSubmittedId(null);
                          setVersion((v) => v + 1);
                        }}
                        className={FINELY_OS_SECONDARY_BTN}
                      >
                        Mark submitted
                      </button>
                    </>
                  ) : null}
                  {c.referenceNumber ? (
                    <span className={FINELY_OS_ENTITY_SUBLABEL}>ref: <span className={FINELY_OS_ENTITY_VALUE}>{c.referenceNumber}</span></span>
                  ) : null}
                </div>
                {c.evidenceIds.length ? (
                  <div className="space-y-2">
                    {c.evidenceIds.slice(0, 4).map((id) => {
                      const ev = evidence.find((x) => x.id === id);
                      if (!ev?.blobRef) return <div key={id} className={`${FINELY_OS_ENTITY_BODY} font-mono text-xs`}>{id}</div>;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={async () => {
                            try {
                              await openBlobRefInNewTab({ blobRef: ev.blobRef!, mimeType: ev.mimeType, preferSigned: true });
                            } catch {
                              // ignore
                            }
                          }}
                          className={`w-full text-left ${finelyOsInlineListItem()} !p-3`}
                        >
                          <div className={`${FINELY_OS_ENTITY_VALUE} text-sm truncate`}>{ev.filename || ev.caption || ev.id}</div>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          }}
        />
      ) : (
        <p className={FINELY_OS_ENTITY_BODY}>No regulatory complaints yet.</p>
      )}
    </div>
  );

  const renderTrackPanel = (escalations: PartnerEscalation[]) => (
    <div className="space-y-5">
      <div>
        <h3 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>My escalations</h3>
        <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
          Formal tracking for billing, service, dispute process, and documents.
        </p>
      </div>
      {escalations.length === 0 ? (
        <ProductEmptyState
          title="No escalations filed yet"
          description="When billing, service, or a dispute process needs formal tracking, submit an escalation here."
          action={
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => setComposeTab('submit')}>
              Submit escalation <ArrowUpRight size={15} />
            </button>
          }
        />
      ) : (
        <div className="fc-wlp-escalation-timeline" aria-label="Escalation history">
          {escalations.map((e, idx) => {
            const accents: Array<'rose' | 'violet' | 'sky' | 'emerald'> = ['rose', 'violet', 'sky', 'emerald'];
            const cardAccent = accents[idx % accents.length];
            return (
              <div key={e.id} className="fc-wlp-escalation-timeline-row">
                <div className="fc-wlp-escalation-timeline-rail" aria-hidden>
                  <span className="fc-wlp-escalation-timeline-dot" style={{ '--fcm-accent-rgb': cardAccent === 'rose' ? '244 63 94' : cardAccent === 'violet' ? '139 92 246' : cardAccent === 'sky' ? '14 165 233' : '16 185 129' } as React.CSSProperties} />
                  <span className="fc-wlp-escalation-timeline-line" />
                </div>
                <article className={`fc-wlp-escalation-timeline-card ${finelyOsCatalogCard(cardAccent)}`} data-fc-accent={cardAccent}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <strong>{e.title}</strong>
                    <ProductStatusPill status={escalationStatusFor(e)} />
                  </div>
                  <p>{e.description}</p>
                  <em>
                    {TOPICS.find((t) => t.value === e.topic)?.label ?? e.topic} · {e.priority} · {formatShortDate(e.createdAt)}
                  </em>
                  {(e.status === 'resolved' || e.status === 'closed') && e.resolutionNote ? (
                    <div className={`mt-3 ${FINELY_OS_NOTICE_SUCCESS}`}>{e.resolutionNote}</div>
                  ) : null}
                </article>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const composePanel =
    composeTab === 'submit'
      ? renderSubmitPanel()
      : composeTab === 'regulatory'
        ? renderRegulatoryPanel(state.status === 'ready' ? state.complaints : [])
        : renderTrackPanel(state.status === 'ready' ? state.escalations : []);

  if (isDemo) {
    return (
      <ProductHubScaffold
        role={role}
        eyebrow={demoSpec?.eyebrow ?? 'Escalations'}
        title={demoSpec?.title ?? 'When a bureau or furnisher will not correct the record.'}
        description={demoSpec?.description ?? 'Escalation is the step after a dispute fails — it goes to regulators, with your evidence attached.'}
        status={`${demoSpec?.status ?? '1 open complaint'} · demo data`}
        freshness="demo snapshot"
        accent={scaffoldAccent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        metricsVariant={METRICS_VARIANT}
        primaryAction={<ProductPagePrimaryAction label={demoSpec?.primaryLabel ?? 'Start an escalation'} onClick={() => navigate(livePath)} />}
        metrics={demoSpec?.metrics.map((metric) => ({ ...metric, onClick: () => navigate(livePath) }))}
        metricTitle={demoSpec?.metricTitle}
        metricDescription={demoSpec?.metricDescription}
      >
        <section className="fc-wlp-section">
          <EscalationRunway
            composeTab={composeTab}
            onComposeTabChange={setComposeTab}
            openEscalationCount={0}
            openComplaintCount={1}
          >
            {composePanel}
          </EscalationRunway>
          <aside className="fc-wlp-page-guide mt-6">
            <div className="fc-wlp-page-guide-icon"><PageIcon size={22} strokeWidth={2.05} /></div>
            <div className="fc-wlp-eyebrow">What to do next</div>
            <h2>{demoSpec?.guideTitle ?? 'Escalate with evidence'}</h2>
            <p>{demoSpec?.guideDescription ?? 'Complaints succeed when they show what you sent, when, and what came back.'}</p>
            {guideActions}
          </aside>
        </section>
        <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
      </ProductHubScaffold>
    );
  }

  if (state.status === 'loading') return <ProductDashboardSkeleton label="Loading your escalations" />;

  if (state.status === 'error') {
    return (
      <ProductHubScaffold
        role={role}
        eyebrow="Escalations"
        title="When a bureau or furnisher will not correct the record."
        description="Escalation is the step after a dispute fails — it goes to regulators, with your evidence attached."
        status="Could not load your escalations"
        freshness="just now"
        accent={scaffoldAccent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        metricsVariant={METRICS_VARIANT}
        primaryAction={<ProductPagePrimaryAction label="Try again" onClick={() => setRetryToken((value) => value + 1)} />}
      >
        <section className="fc-wlp-section">
          <ProductEmptyState
            title="We couldn't load your escalations"
            description={state.message}
            action={<button type="button" className="fc-wlp-btn-primary" onClick={() => setRetryToken((value) => value + 1)}>Try again</button>}
          />
        </section>
      </ProductHubScaffold>
    );
  }

  const { escalations, complaints } = state;
  const perComplaint = complaints.map((complaint) => ({ complaint, deadline: complaintDeadline(complaint) }));

  const openComplaints = complaints.filter((c) => c.status === 'submitted' || c.status === 'in_review');
  const draftComplaints = complaints.filter((c) => c.status === 'draft');
  const openEscalations = escalations.filter((e) => e.status === 'open' || e.status === 'in_review' || e.status === 'pending_partner');
  const resolvedTotal =
    complaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length +
    escalations.filter((e) => e.status === 'resolved' || e.status === 'closed').length;

  const withDeadline = perComplaint.filter((row) => row.deadline);
  const soonestComplaint = withDeadline.length
    ? withDeadline.reduce((closest, row) => (row.deadline!.daysRemaining < closest.deadline!.daysRemaining ? row : closest))
    : null;

  const isEmpty = escalations.length === 0 && complaints.length === 0;
  const latestActivity = [...escalations, ...complaints].reduce<string | undefined>((latest, entry) => {
    if (!latest || entry.updatedAt > latest) return entry.updatedAt;
    return latest;
  }, undefined);

  const alertHeadline =
    soonestComplaint && soonestComplaint.deadline!.daysRemaining <= 7
      ? soonestComplaint.deadline!.daysRemaining <= 0
        ? 'A response window has passed'
        : `Response due in ${soonestComplaint.deadline!.daysRemaining} days`
      : undefined;
  const alertDetail = soonestComplaint
    ? `${soonestComplaint.complaint.body} complaint · typical response by ${formatShortDate(soonestComplaint.deadline!.dueIso)}`
    : undefined;

  const metrics: ProductMetric[] = [
    { label: 'Open complaints', value: openComplaints.length, hint: draftComplaints.length ? `${draftComplaints.length} draft` : 'Regulatory filings', accent: 'rose', icon: Megaphone, onClick: () => setComposeTab('regulatory') },
    { label: 'Response due', value: soonestComplaint ? (soonestComplaint.deadline!.daysRemaining <= 0 ? 'Now' : `${soonestComplaint.deadline!.daysRemaining}d`) : '—', hint: soonestComplaint ? `${soonestComplaint.complaint.body} typical window` : 'No window ticking', accent: 'violet', icon: Clock3, onClick: () => setComposeTab('track') },
    { label: 'Resolved', value: resolvedTotal, hint: resolvedTotal ? 'Corrections on file' : 'Nothing resolved yet', accent: 'emerald', icon: CheckCircle2, onClick: () => setComposeTab('track') },
    { label: 'Internal escalations', value: openEscalations.length, hint: openEscalations.length ? 'Open with specialist' : 'None open', accent: 'sky', icon: FileSearch, onClick: () => setComposeTab('track') },
  ];

  const statusHeadline = isEmpty
    ? 'No escalations filed yet'
    : soonestComplaint && soonestComplaint.deadline!.daysRemaining <= 7
      ? soonestComplaint.deadline!.daysRemaining <= 0
        ? 'A response window has passed'
        : `Response due in ${soonestComplaint.deadline!.daysRemaining}d`
      : draftComplaints.length
        ? `${draftComplaints.length} draft complaint${draftComplaints.length === 1 ? '' : 's'} ready`
        : openEscalations.length
          ? `${openEscalations.length} internal escalation${openEscalations.length === 1 ? '' : 's'} open`
          : 'Nothing needs escalation right now';

  const guideTitle = isEmpty ? 'Escalate after a dispute fails' : 'Track response deadlines';
  const guideDescription = isEmpty
    ? 'When a bureau or furnisher fails to correct a dispute after a full round, escalate with evidence attached.'
    : 'Show what you sent, when, and what came back — with exhibits linked.';

  const runway = (
    <EscalationRunway
      composeTab={composeTab}
      onComposeTabChange={setComposeTab}
      alertHeadline={alertHeadline}
      alertDetail={alertDetail}
      openEscalationCount={openEscalations.length}
      openComplaintCount={openComplaints.length + draftComplaints.length}
    >
      {composePanel}
    </EscalationRunway>
  );

  const content = partner ? (
    <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.escalations]}>
      {runway}
    </EntitlementGate>
  ) : (
    runway
  );

  return (
    <ProductHubScaffold
      role={role}
      eyebrow="Escalations"
      title="When a bureau or furnisher will not correct the record."
      description="Escalation is the step after a dispute fails — it goes to regulators, with your evidence attached."
      status={`${statusHeadline} · live data`}
      freshness={formatFreshness(latestActivity)}
      accent={scaffoldAccent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      metricsVariant={METRICS_VARIANT}
      primaryAction={<ProductPagePrimaryAction label="Start an escalation" onClick={() => setComposeTab('submit')} />}
      metrics={metrics}
      metricTitle="Escalation status"
      metricDescription="Regulator complaints carry a typical response window — guidance, not a legal guarantee."
    >
      <section className="fc-wlp-section">
        {content}
        <aside className="fc-wlp-page-guide mt-6">
          <div className="fc-wlp-page-guide-icon"><PageIcon size={22} strokeWidth={2.05} /></div>
          <div className="fc-wlp-eyebrow">What to do next</div>
          <h2>{guideTitle}</h2>
          <p>{guideDescription}</p>
          {guideActions}
        </aside>
      </section>
      <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
    </ProductHubScaffold>
  );
}
