import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  FileText,
  Gavel,
  LayoutDashboard,
  MessageSquare,
  Scale,
  Sparkles,
  Users,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { getUserDisplayName, getUserEmail } from '../../auth/userProfile';
import { CASE_HELP } from '../../config/caseHelpProgram';
import { ROLE_WORK_SPLIT } from '../../config/rolePartnerPrograms';
import { RoleWorkflowPanel } from '../../components/workflow/RoleWorkflowPanel';
import { UnifiedTrainingPanel } from '../../components/training/UnifiedTrainingPanel';
import { BackToSiteButton } from '../../components/navigation/BackToSiteButton';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyOsRoleCommandCenter } from '../../features/os/FinelyOsRoleCommandCenter';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { RoleHubToolDeck, type RoleHubTool } from '../../components/hubs/RoleHubToolDeck';
import { resolveCaseHelpHubAccess } from '../../lib/roleHubAccess';
import { buildCaseHelpHubNoticedItems } from '../../lib/finelyProactiveSignals';
import {
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
} from '../../features/os/finelyOsLightUi';

type HubTab = 'overview' | 'matters' | 'letters' | 'training' | 'operate';

const TABS: { id: HubTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'matters', label: 'Matters' },
  { id: 'letters', label: 'Letters' },
  { id: 'training', label: 'Training' },
  { id: 'operate', label: 'Operate' },
];

const CASE_HELP_TOOL_DECK: RoleHubTool[] = [
  { id: 'matters', label: 'Matters', detail: 'Assigned partners only', path: `${CASE_HELP.hubPath}?tab=matters`, icon: Users, accent: 'fuchsia', badge: 'Primary' },
  { id: 'debt', label: 'Debt desk', detail: 'Summons & timelines', path: '/portal/debt', icon: Gavel, accent: 'amber' },
  { id: 'letters', label: 'Letters', detail: 'Packets & studio', path: '/portal/letters', icon: FileText, accent: 'violet' },
  { id: 'cases', label: 'Cases', detail: 'Scoped case board', path: '/admin/cases', icon: Scale, accent: 'sky' },
  { id: 'guide', label: 'Guide', detail: 'Case desk handbook', path: CASE_HELP.guideReadPath, icon: BookOpen, accent: 'emerald' },
  { id: 'line', label: 'Case desk line', detail: 'Message Finely', path: CASE_HELP.messagesDeepLink, icon: MessageSquare, accent: 'sky' },
];

export default function CaseHelpHubPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<HubTab>('overview');
  const gate = useMemo(() => resolveCaseHelpHubAccess(auth.user), [auth.user]);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && TABS.some((x) => x.id === t)) setTab(t as HubTab);
  }, [searchParams]);

  const assignedCount = useMemo(() => {
    const ids = gate.membership?.permissions?.assignedPartnerIds;
    return Array.isArray(ids) ? ids.length : 0;
  }, [gate.membership]);

  const split = ROLE_WORK_SPLIT.case_help;
  const roleLabel = gate.membership?.role
    ? String(gate.membership.role).replace(/_/g, ' ')
    : gate.application?.roleTitle || 'Case desk';
  const noticedItems = useMemo(
    () => buildCaseHelpHubNoticedItems({ assignedCount, tab }),
    [assignedCount, tab],
  );
  const nowDoItems = useMemo(
    () => [
      {
        label: assignedCount > 0 ? 'Work assigned matters' : 'Wait for scoped assignment',
        detail:
          assignedCount > 0
            ? 'Open partner files in your scope — packets, letters, debt timelines.'
            : 'Hub is open after approval. Finely ops assigns partner files to your seat.',
        to: assignedCount > 0 ? `${CASE_HELP.hubPath}?tab=matters` : CASE_HELP.guideReadPath,
      },
      {
        label: 'Build a packet',
        detail: 'Letter studio + evidence vault for assigned partners only.',
        to: '/portal/letters',
      },
      {
        label: 'Message case desk line',
        detail: 'Ask Finely ops about scope, validation, or matter handoff.',
        to: CASE_HELP.messagesDeepLink,
      },
    ],
    [assignedCount],
  );

  if (!gate.allowed) {
    const tone =
      gate.reason === 'pending_case_help_application' || gate.reason === 'needs_case_help_approval'
        ? 'info'
        : gate.reason === 'needs_case_help_claim'
          ? 'warning'
          : 'blocking';
    return (
      <PageShell
        badge={CASE_HELP.programName}
        title={CASE_HELP.hubName}
        subtitle={CASE_HELP.accessNote}
        back={{ to: CASE_HELP.publicPath, label: 'Case desk careers' }}
      >
        <div className={`${FINELY_OS_COMPACT_PAGE} max-w-3xl space-y-3`}>
          <FinelyOsAlertBanner tone={tone} message={gate.message} />
          <div className="flex flex-wrap gap-2">
            {gate.cta ? (
              <button type="button" onClick={() => navigate(gate.cta!.path)} className={FINELY_OS_PRIMARY_BTN}>
                {gate.cta.label}
              </button>
            ) : null}
            <button type="button" onClick={() => navigate(CASE_HELP.guidePath)} className={FINELY_OS_SECONDARY_BTN}>
              <BookOpen size={14} /> Case desk guide
            </button>
            {!auth.user ? <BackToSiteButton /> : null}
          </div>
          <p className={FINELY_OS_COMPLIANCE_FOOTNOTE}>
            Educational platform roles · not an offer of employment · results vary · not legal advice
          </p>
          <FinelyOsPageFooter />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      badge={CASE_HELP.programName}
      title={CASE_HELP.hubName}
      subtitle={`Assigned matters desk${getUserDisplayName(auth.user) ? ` — ${getUserDisplayName(auth.user)}` : ''}`}
      back={{ to: '/dashboard', label: 'Dashboard' }}
    >
      <div className={`${FINELY_OS_COMPACT_PAGE} max-w-5xl`}>
        <FinelyNoticedStrip items={noticedItems} />
        <FinelyNowDoThisStrip
          items={nowDoItems}
          currentIndex={assignedCount === 0 ? 0 : 0}
          className="!p-4"
        />
        <FinelyUnifiedHubLayout
          eyebrow={CASE_HELP.programName}
          title={CASE_HELP.hubName}
          subtitle="Scoped partner matters — packets, letters, and logged sessions. Not platform-wide access."
          accent="fuchsia"
          kpis={[
            { label: 'Role', value: roleLabel, accent: 'fuchsia' },
            { label: 'Matters', value: String(assignedCount), accent: 'amber' },
            { label: 'Scope', value: 'Assigned', accent: 'sky' },
            { label: 'Status', value: gate.membership?.status || 'active', accent: 'emerald' },
          ]}
          tabs={TABS}
          activeTab={tab}
          onTabChange={(id) => setTab(id as HubTab)}
          primaryAction={{ label: 'Open matters', onClick: () => setTab('matters') }}
          secondaryAction={{ label: 'Case desk line', onClick: () => navigate(CASE_HELP.messagesDeepLink) }}
        >
          {tab === 'overview' && (
            <div className="space-y-3">
              <FinelyOsRoleCommandCenter
                roleLabel="Case Help · Role OS 2.0"
                headline="What matters now"
                subline="Work only assigned partner files. Finely runs intake and the platform."
                tiles={[
                  { id: 'matters', label: 'Assigned', value: String(assignedCount), accent: 'fuchsia', onClick: () => setTab('matters') },
                  { id: 'debt', label: 'Debt desk', value: 'Open', accent: 'amber', onClick: () => navigate('/portal/debt') },
                  { id: 'letters', label: 'Letters', value: 'Studio', accent: 'violet', onClick: () => navigate('/portal/letters') },
                  { id: 'guide', label: 'Guide', value: 'Read', accent: 'sky', onClick: () => navigate(CASE_HELP.guideReadPath) },
                ]}
                primaryAction={{ label: 'Assigned partners', onClick: () => navigate('/admin/partners') }}
                secondaryAction={{ label: 'Messages', onClick: () => navigate(CASE_HELP.messagesDeepLink) }}
                alert={
                  assignedCount === 0
                    ? { tone: 'info', message: 'No assigned matters yet — Finely ops will scope partner files to your seat.' }
                    : undefined
                }
              />
              <RoleHubToolDeck
                tools={CASE_HELP_TOOL_DECK}
                title="Case desk tools"
                subtitle="Assigned matters → packets → debt desk — never platform-wide."
              />
              <div className={`${finelyOsCatalogCardCompact('fuchsia')} !p-4 space-y-2`}>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>You run / Finely runs</div>
                <p className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{split.headline}</p>
                <div className="grid sm:grid-cols-3 gap-2">
                  {[
                    { t: 'You do', rows: split.youDo },
                    { t: 'Finely runs', rows: split.finelyRuns },
                    { t: 'Not your job', rows: split.notYourJob },
                  ].map((col) => (
                    <div key={col.t}>
                      <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-1`}>{col.t}</div>
                      <ul className={`text-xs ${FINELY_OS_ENTITY_BODY} space-y-1`}>
                        {col.rows.slice(0, 3).map((r) => (
                          <li key={r}>• {r}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
              <RoleWorkflowPanel roleId="case_help" compact />
            </div>
          )}

          {tab === 'matters' && (
            <div className={`${finelyOsCatalogCardCompact('amber')} !p-4 space-y-3`}>
              <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Assigned matters</div>
              <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                {assignedCount > 0
                  ? `${assignedCount} partner file(s) in your scope. Open partner management or debt desk for court timelines.`
                  : 'Waiting for scoped assignment. You never get raw platform-wide access.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => navigate('/admin/partners')} className={FINELY_OS_PRIMARY_BTN}>
                  <Users size={14} /> Partner files
                </button>
                <button type="button" onClick={() => navigate('/portal/debt')} className={FINELY_OS_SECONDARY_BTN}>
                  <Gavel size={14} /> Debt & summons
                </button>
                <button type="button" onClick={() => navigate('/admin/cases')} className={FINELY_OS_SECONDARY_BTN}>
                  <Scale size={14} /> Cases
                </button>
              </div>
            </div>
          )}

          {tab === 'letters' && (
            <div className={`${finelyOsCatalogCardCompact('violet')} !p-4 space-y-3`}>
              <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Packets & letters</div>
              <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                Assemble letter and evidence packets for assigned partners. Non-attorney roles do not give legal advice.
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => navigate('/portal/letters')} className={FINELY_OS_PRIMARY_BTN}>
                  <FileText size={14} /> Letter studio
                </button>
                <button type="button" onClick={() => navigate('/portal/documents')} className={FINELY_OS_SECONDARY_BTN}>
                  Evidence vault
                </button>
                <button type="button" onClick={() => navigate('/portal/templates')} className={FINELY_OS_SECONDARY_BTN}>
                  Templates
                </button>
              </div>
            </div>
          )}

          {tab === 'training' && <UnifiedTrainingPanel audience="credit_specialist" specialties={['debt_legal']} />}

          {tab === 'operate' && (
            <div className={`${finelyOsCatalogCardCompact('sky')} !p-4 space-y-3`}>
              <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>Quick links for case desk operations.</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Messages', path: CASE_HELP.messagesDeepLink, icon: MessageSquare },
                  { label: 'Calendar', path: '/portal/calendar', icon: Sparkles },
                  { label: 'Guide', path: CASE_HELP.guideReadPath, icon: BookOpen },
                  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
                ].map(({ label, path, icon: Icon }) => (
                  <button key={path} type="button" onClick={() => navigate(path)} className={FINELY_OS_SECONDARY_BTN}>
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
              <p className={`text-[11px] ${FINELY_OS_ENTITY_SUBLABEL}`}>Signed in as {getUserEmail(auth.user)}</p>
            </div>
          )}
        </FinelyUnifiedHubLayout>
        <p className={`mt-3 ${FINELY_OS_COMPLIANCE_FOOTNOTE}`}>
          Educational platform roles · attorney applicants must be licensed where they practice · results vary · not legal advice
        </p>
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
