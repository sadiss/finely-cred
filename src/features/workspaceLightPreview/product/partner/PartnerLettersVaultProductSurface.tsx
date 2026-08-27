import React, { useMemo } from 'react';
import { CircleHelp, Clock, FileCheck, Mail, PlayCircle, ScrollText, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../auth/AuthProvider';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { ENTITLEMENT_KEYS } from '../../../../billing/entitlements';
import { EntitlementGate } from '../../../../components/billing/EntitlementGate';
import { getPartnerSync } from '../../../../data/partnersRepo';
import { listLettersByPartner } from '../../../../data/lettersRepo';
import {
  PartnerLettersVaultWorkspace,
  type PartnerLettersVaultNavigation,
} from '../../../../components/letters/PartnerLettersVaultWorkspace';
import { isLetterDraft } from '../../../../lib/letterDraftLifecycle';
import { isLetterPhysicallyMailed } from '../../../../lib/letterMailState';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  finelyOsCatalogCard,
} from '../../../../features/os/finelyOsLightUi';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import './partnerLettersVaultSurface.css';

function vaultNavigation(map: (href: string) => string): PartnerLettersVaultNavigation {
  return {
    studioPath: map('/portal/letters'),
    documentsPath: map('/portal/documents'),
    vaultPath: map('/portal/letters/vault'),
  };
}

const MAIL_STAGES = [
  { id: 'draft', label: 'Drafts', hint: 'Edit before final', accent: 'emerald' as const },
  { id: 'ready', label: 'Ready to mail', hint: 'PDF attached', accent: 'violet' as const },
  { id: 'mailed', label: 'Mailed', hint: 'With provider proof', accent: 'sky' as const },
  { id: 'waiting', label: 'Awaiting reply', hint: 'Response window', accent: 'rose' as const },
];

export default function PartnerLettersVaultProductSurface({
  role,
  pageId,
  partnerId,
  dataMode,
}: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const auth = useAuth();
  const email = auth.user?.email || '';
  const { partner: sessionPartner } = usePartnerSession();
  const isDemo = dataMode === 'demo' || !partnerId;
  const mapPortalHref = usePartnerProductPathResolver();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? ScrollText;
  const accent = navItem?.accent ?? 'sky';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const archetype = getWorkspaceProductArchetype(role, pageId);

  const partner = useMemo(() => {
    if (partnerId) return getPartnerSync(partnerId) ?? sessionPartner;
    return sessionPartner;
  }, [partnerId, sessionPartner]);

  const navigation = useMemo(() => vaultNavigation(mapPortalHref), [mapPortalHref]);

  const letterStats = useMemo(() => {
    if (!partner || isDemo) {
      return { active: 3, drafts: 1, ready: 1, mailed: 1, waiting: 0, archived: 0 };
    }
    const letters = listLettersByPartner(partner.id);
    const active = letters.filter((l) => !l.archivedAt);
    const archived = letters.filter((l) => Boolean(l.archivedAt));
    const drafts = active.filter((l) => isLetterDraft(l));
    const ready = active.filter((l) => !isLetterDraft(l) && Boolean(l.pdfBlobRef) && !isLetterPhysicallyMailed(l));
    const mailed = active.filter((l) => isLetterPhysicallyMailed(l));
    const waiting = active.filter((l) => l.status === 'waiting_response');
    return {
      active: active.length,
      drafts: drafts.length,
      ready: ready.length,
      mailed: mailed.length,
      waiting: waiting.length,
      archived: archived.length,
    };
  }, [partner, isDemo]);

  const stageCounts: Record<string, number> = {
    draft: letterStats.drafts,
    ready: letterStats.ready,
    mailed: letterStats.mailed,
    waiting: letterStats.waiting,
  };

  const metrics: ProductMetric[] = [
    {
      label: 'Active letters',
      value: letterStats.active,
      hint: 'In your vault',
      accent: 'emerald',
      icon: ScrollText,
    },
    {
      label: 'Ready to mail',
      value: letterStats.ready,
      hint: letterStats.ready ? 'PDF attached' : 'Mark drafts final first',
      accent: 'violet',
      icon: Mail,
    },
    {
      label: 'Mailed',
      value: letterStats.mailed,
      hint: 'Provider tracking on file',
      accent: 'sky',
      icon: Send,
    },
    {
      label: 'Awaiting reply',
      value: letterStats.waiting,
      hint: letterStats.waiting ? 'Watch response windows' : 'No open windows',
      accent: 'rose',
      icon: Clock,
    },
  ];

  const statusHeadline = letterStats.ready
    ? `${letterStats.ready} letter${letterStats.ready === 1 ? '' : 's'} ready to mail`
    : letterStats.drafts
      ? `${letterStats.drafts} draft${letterStats.drafts === 1 ? '' : 's'} in progress`
      : letterStats.active
        ? `${letterStats.active} saved letter${letterStats.active === 1 ? '' : 's'}`
        : 'Vault empty — start in Letter Studio';

  const mailRunwayBody = partner ? (
    <section className={`fc-wlp-section ${FINELY_OS_PAGE} fc-wlp-letters-mail-runway`} data-surface-layout="timeline-runway">
      {letterStats.ready > 0 ? (
        <div className={`fc-wlp-letters-mail-alert ${finelyOsCatalogCard('violet')} p-6 lg:p-8`} data-fc-accent="violet">
          <div className="flex items-start gap-4 min-w-0">
            <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-500/20">
              <Mail size={26} className="text-violet-300" />
            </div>
            <div>
              <p className={FINELY_OS_ENTITY_SUBLABEL}>Mail queue</p>
              <h2 className={`mt-1 text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                {letterStats.ready} letter{letterStats.ready === 1 ? '' : 's'} ready to send
              </h2>
              <p className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                Confirm addresses, batch mail when ready, and track bureau responses here.
              </p>
            </div>
          </div>
          <button type="button" onClick={() => navigate(navigation.studioPath)} className={FINELY_OS_PRIMARY_BTN}>
            <ScrollText size={14} /> Open Letter Studio
          </button>
        </div>
      ) : (
        <div className={`fc-wlp-letters-mail-alert ${finelyOsCatalogCard('sky')} p-6 lg:p-8`} data-fc-accent="sky">
          <div>
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Mail runway</p>
            <h2 className={`mt-1 text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
              Build letters, then track every round here
            </h2>
            <p className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
              Saved PDFs, mail proof, and response windows stay in one vault beside Letter Studio.
            </p>
          </div>
          <button type="button" onClick={() => navigate(navigation.studioPath)} className={FINELY_OS_PRIMARY_BTN}>
            <ScrollText size={14} /> Letter Studio
          </button>
        </div>
      )}

      <div className="fc-wlp-letters-mail-pipeline" aria-label="Mail pipeline">
        {MAIL_STAGES.map((stage) => (
          <div
            key={stage.id}
            className={`fc-wlp-letters-mail-stage ${finelyOsCatalogCard(stage.accent)}`}
            data-fc-accent={stage.accent}
          >
            <div className={`fc-wlp-letters-mail-stage-value ${FINELY_OS_ENTITY_VALUE}`}>{stageCounts[stage.id]}</div>
            <div className={`fc-wlp-letters-mail-stage-label ${FINELY_OS_ENTITY_VALUE}`}>{stage.label}</div>
            <div className={`fc-wlp-letters-mail-stage-hint ${FINELY_OS_ENTITY_BODY}`}>{stage.hint}</div>
          </div>
        ))}
      </div>

      <div className="fc-wlp-letters-vault-deck">
        <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8`} data-fc-accent="emerald">
          <PartnerLettersVaultWorkspace
            partner={partner}
            actorEmail={email}
            navigation={navigation}
            surface="light"
            embedded
          />
        </div>
      </div>
    </section>
  ) : null;

  if (isDemo && !partner) {
    return (
      <ProductHubScaffold
        role={role}
        pageId="letters-vault"
        eyebrow="Letters vault"
        title="Saved PDFs, mail tracking, and response windows"
        description="Every mailed dispute round lives here — pick a letter, confirm the address, and watch bureau replies."
        status="Demo vault · sample mail pipeline"
        freshness="demo snapshot"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        archetype={archetype}
        metricsVariant="grid"
        metrics={metrics}
        metricTitle="Mail runway"
        metricDescription="Drafts, ready-to-mail PDFs, mailed proof, and open response windows."
        primaryAction={<ProductPagePrimaryAction label="Sign in to open vault" onClick={() => navigate('/login')} />}
      >
        <section className={`fc-wlp-section ${FINELY_OS_PAGE} fc-wlp-letters-mail-runway`} data-surface-layout="timeline-runway">
          <div className="fc-wlp-letters-mail-pipeline" aria-label="Mail pipeline">
            {MAIL_STAGES.map((stage) => (
              <div
                key={stage.id}
                className={`fc-wlp-letters-mail-stage ${finelyOsCatalogCard(stage.accent)}`}
                data-fc-accent={stage.accent}
              >
                <div className={`fc-wlp-letters-mail-stage-value ${FINELY_OS_ENTITY_VALUE}`}>{stageCounts[stage.id]}</div>
                <div className={`fc-wlp-letters-mail-stage-label ${FINELY_OS_ENTITY_VALUE}`}>{stage.label}</div>
                <div className={`fc-wlp-letters-mail-stage-hint ${FINELY_OS_ENTITY_BODY}`}>{stage.hint}</div>
              </div>
            ))}
          </div>
          <ProductEmptyState
            title="Sign in to open Letters Vault"
            description="Your saved PDFs, mail tracking, and letter history live here — sign in to view mailed packages and response windows."
            action={
              <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate('/login')}>
                Sign in
              </button>
            }
          />
        </section>
        <p className="fc-wlp-section-description fc-wlp-compliance-line mt-4">
          Results vary · not legal advice · funding subject to underwriting
        </p>
      </ProductHubScaffold>
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

  return (
    <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.letters]}>
      <ProductHubScaffold
        role={role}
        pageId="letters-vault"
        eyebrow="Letters vault"
        title="Saved PDFs, mail tracking, and response windows"
        description="Every mailed dispute round lives here — pick a letter, confirm the address, and watch bureau replies."
        status={`${statusHeadline} · ${isDemo ? 'demo data' : 'live data'}`}
        freshness={isDemo ? 'demo snapshot' : 'just now'}
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        archetype={archetype}
        metricsVariant="grid"
        metrics={metrics}
        metricTitle="Mail runway"
        metricDescription="Drafts, ready-to-mail PDFs, mailed proof, and open response windows."
        primaryAction={<ProductPagePrimaryAction label="Letter Studio" onClick={() => navigate(navigation.studioPath)} />}
        secondaryAction={
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(navigation.documentsPath)}>
            <FileCheck size={15} /> Upload responses
          </button>
        }
      >
        {mailRunwayBody}
        <aside className="fc-wlp-page-guide mt-6">
          <div className="fc-wlp-page-guide-icon">
            <PageIcon size={22} strokeWidth={2.05} />
          </div>
          <div className="fc-wlp-eyebrow">What to do next</div>
          <h2>{letterStats.ready ? 'Mail your ready letters' : letterStats.drafts ? 'Finish drafts in Letter Studio' : 'Generate your first letter'}</h2>
          <p>
            {letterStats.ready
              ? 'Select PDF-ready letters, confirm addresses, and mail — tracking stays on each card.'
              : letterStats.drafts
                ? 'Mark drafts final when the text is right, then return here to mail.'
                : 'Build dispute letters in Letter Studio — approved PDFs land in this vault automatically.'}
          </p>
          <ol>
            <li>Draft and finalize letters in Letter Studio.</li>
            <li>Mail from the vault with address confirmation.</li>
            <li>Upload bureau responses in Documents when they arrive.</li>
          </ol>
          <div className="fc-wlp-page-guide-actions">
            <button
              type="button"
              onClick={() =>
                openProductCopilot({
                  prompt: 'How do I mail dispute letters and track bureau responses?',
                  contextLabel: 'Letters vault',
                })
              }
            >
              <CircleHelp size={15} /> Ask Finely
            </button>
            <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
              <PlayCircle size={15} /> Watch how
            </button>
          </div>
        </aside>
        <p className="fc-wlp-section-description fc-wlp-compliance-line mt-4">
          Results vary · not legal advice · funding subject to underwriting
        </p>
      </ProductHubScaffold>
    </EntitlementGate>
  );
}
