import React, { useEffect, useMemo } from 'react';
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
import { useSearchParams } from 'react-router-dom';
import { PartnerWorkstationFrame, type PartnerEmbeddablePageProps } from '../../features/workspaceLightPreview/product/partner/PartnerWorkstationFrame';
import { useMappedPartnerNavigate } from '../../features/workspaceLightPreview/product/partner/usePartnerProductNavigation';
import { useAuth } from '../../auth/AuthProvider';
import { getUserDisplayName, getUserEmail } from '../../auth/userProfile';
import { CASE_HELP } from '../../config/caseHelpProgram';
import { ROLE_WORK_SPLIT } from '../../config/rolePartnerPrograms';
import { RoleWorkflowPanel } from '../../components/workflow/RoleWorkflowPanel';
import { UnifiedTrainingPanel } from '../../components/training/UnifiedTrainingPanel';
import { BackToSiteButton } from '../../components/navigation/BackToSiteButton';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';
import {
  FinelyUnifiedHubLayout,
  PartnerHubLauncherGrid,
  PartnerHubWorkModal,
  usePartnerHubLauncher,
} from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyOsRoleCommandCenter } from '../../features/os/FinelyOsRoleCommandCenter';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { RoleHubToolDeck } from '../../components/hubs/RoleHubToolDeck';
import { resolveCaseHelpHubAccess } from '../../lib/roleHubAccess';
import { buildCaseHelpHubNoticedItems } from '../../lib/finelyProactiveSignals';
import {
  buildCaseHelpHubLauncherTiles,
  CASE_HELP_TAB_TO_LAUNCHER,
  CASE_HELP_TOOL_DECK,
  ROLE_HUB_MODAL_ACCENT,
  type CaseHelpHubLauncherId,
} from '../../components/partner/roleHubLauncherPresets';
import {
  FINELY_OS_PAGE,
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

export default function CaseHelpHubPage({ embedded = false }: PartnerEmbeddablePageProps = {}) {
  const auth = useAuth();
  const navigate = useMappedPartnerNavigate();
  const [searchParams] = useSearchParams();
  const hubLauncher = usePartnerHubLauncher<CaseHelpHubLauncherId>();
  const gate = useMemo(() => resolveCaseHelpHubAccess(auth.user), [auth.user]);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && t in CASE_HELP_TAB_TO_LAUNCHER) {
      hubLauncher.open(CASE_HELP_TAB_TO_LAUNCHER[t]);
    }
  }, [searchParams, hubLauncher.open]);

  const assignedCount = useMemo(() => {
    const ids = gate.membership?.permissions?.assignedPartnerIds;
    return Array.isArray(ids) ? ids.length : 0;
  }, [gate.membership]);

  const split = ROLE_WORK_SPLIT.case_help;
  const roleLabel = gate.membership?.role
    ? String(gate.membership.role).replace(/_/g, ' ')
    : gate.application?.roleTitle || 'Case desk';
  const noticedItems = useMemo(
    () => buildCaseHelpHubNoticedItems({ assignedCount, tab: hubLauncher.openId ?? 'overview' }),
    [assignedCount, hubLauncher.openId],
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

  const hubLauncherTiles = useMemo(
    () => buildCaseHelpHubLauncherTiles({ assignedCount, roleLabel }),
    [assignedCount, roleLabel],
  );

  if (!gate.allowed) {
    const tone =
      gate.reason === 'pending_case_help_application' || gate.reason === 'needs_case_help_approval'
        ? 'info'
        : gate.reason === 'needs_case_help_claim'
          ? 'warning'
          : 'blocking';
    return (
      <PartnerWorkstationFrame embedded={embedded} kind="case-help-hub-workstation"
        badge={CASE_HELP.programName}
        title={CASE_HELP.hubName}
        subtitle={CASE_HELP.accessNote}
        back={{ to: CASE_HELP.publicPath, label: 'Case desk careers' }}
      >
        <div className={`${FINELY_OS_PAGE} max-w-3xl space-y-3`}>
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
          {!embedded ? <FinelyOsPageFooter /> : null}
        </div>
      </PartnerWorkstationFrame>
    );
  }

  return (
    <PartnerWorkstationFrame embedded={embedded} kind="case-help-hub-workstation"
      badge={CASE_HELP.programName}
      title={CASE_HELP.hubName}
      subtitle={`Assigned matters desk${getUserDisplayName(auth.user) ? ` — ${getUserDisplayName(auth.user)}` : ''}`}
      back={{ to: '/dashboard', label: 'Dashboard' }}
    >
      <div className={`${FINELY_OS_PAGE} max-w-5xl`}>
        <FinelyNoticedStrip items={noticedItems} />
        <FinelyNowDoThisStrip items={nowDoItems} currentIndex={0} />
        <FinelyUnifiedHubLayout
          eyebrow={CASE_HELP.programName}
          title={CASE_HELP.hubName}
          subtitle="Scoped partner matters — packets, letters, and logged sessions. Not platform-wide access."
          accent="rose"
          kpis={[
            { label: 'Role', value: roleLabel, accent: 'emerald' },
            { label: 'Matters', value: String(assignedCount), accent: 'violet' },
            { label: 'Scope', value: 'Assigned', accent: 'sky' },
            { label: 'Status', value: gate.membership?.status || 'active', accent: 'rose' },
          ]}
          primaryAction={{ label: 'Open matters', onClick: () => hubLauncher.open('matters') }}
          secondaryAction={{ label: 'Case desk line', onClick: () => navigate(CASE_HELP.messagesDeepLink) }}
          launcherSlot={<PartnerHubLauncherGrid tiles={hubLauncherTiles} onOpen={hubLauncher.open} />}
        >
          {null}
        </FinelyUnifiedHubLayout>

        <PartnerHubWorkModal
          open={hubLauncher.isOpen('overview')}
          onClose={hubLauncher.close}
          title="Case desk overview"
          subtitle="Role command center, tools, and workflow split."
          accent={ROLE_HUB_MODAL_ACCENT.overview}
        >
          <FinelyOsRoleCommandCenter
            roleLabel="Case Help · Role OS 2.0"
            headline="What matters now"
            subline="Work only assigned partner files. Finely runs intake and the platform."
            tiles={[
              { id: 'matters', label: 'Assigned', value: String(assignedCount), accent: 'emerald', onClick: () => hubLauncher.open('matters') },
              { id: 'debt', label: 'Debt desk', value: 'Open', accent: 'rose', onClick: () => navigate('/portal/debt') },
              { id: 'letters', label: 'Letters', value: 'Studio', accent: 'violet', onClick: () => hubLauncher.open('letters') },
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
          <div className={`${finelyOsCatalogCard('rose')} space-y-2`} data-fc-accent="rose">
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
        </PartnerHubWorkModal>

        <PartnerHubWorkModal
          open={hubLauncher.isOpen('matters')}
          onClose={hubLauncher.close}
          title="Assigned matters"
          subtitle="Partner files in your scope only."
          accent={ROLE_HUB_MODAL_ACCENT.matters}
        >
          <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
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
        </PartnerHubWorkModal>

        <PartnerHubWorkModal
          open={hubLauncher.isOpen('letters')}
          onClose={hubLauncher.close}
          title="Packets & letters"
          subtitle="Letter studio and evidence for assigned partners."
          accent={ROLE_HUB_MODAL_ACCENT.letters}
        >
          <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
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
        </PartnerHubWorkModal>

        <PartnerHubWorkModal
          open={hubLauncher.isOpen('training')}
          onClose={hubLauncher.close}
          title="Case desk training"
          subtitle="Handbook tracks for debt, validation, and packets."
          accent={ROLE_HUB_MODAL_ACCENT.training}
        >
          <UnifiedTrainingPanel audience="credit_specialist" specialties={['debt_legal']} />
        </PartnerHubWorkModal>

        <PartnerHubWorkModal
          open={hubLauncher.isOpen('operate')}
          onClose={hubLauncher.close}
          title="Operate"
          subtitle="Quick links for case desk operations."
          accent={ROLE_HUB_MODAL_ACCENT.operate}
        >
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
        </PartnerHubWorkModal>

        <p className={`mt-3 ${FINELY_OS_COMPLIANCE_FOOTNOTE}`}>
          Educational platform roles · attorney applicants must be licensed where they practice · results vary · not legal advice
        </p>
        {!embedded ? <FinelyOsPageFooter /> : null}
      </div>
    </PartnerWorkstationFrame>
  );
}
