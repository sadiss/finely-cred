import React from 'react';
import type { Partner } from '../../domain/partners';
import type { RoleWorkflowId } from '../../config/roleWorkflows';
import { AdminPartnerAccessPanel } from './AdminPartnerAccessPanel';
import { PartnerIntakeLinkPanel } from './PartnerIntakeLinkPanel';
import { PartnerBureauResourcesPanel } from './PartnerBureauResourcesPanel';
import { JourneyStageAdminControl } from '../journey/JourneyStageAdminControl';
import { PartnerCreditRestoreHud } from '../../features/partner/PartnerCreditRestoreHud';
import { PartnerCreditRestoreMiniRail } from '../../features/partner/PartnerCreditRestoreMiniRail';
import { RoleWorkflowPanel } from '../workflow/RoleWorkflowPanel';
import { LegacyApplicationStatusBanner } from './LegacyApplicationStatusBanner';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

type TabKey = 'overview' | 'profile' | 'reports' | 'analysis' | 'evidence' | 'letters' | 'tasks' | 'notes' | 'debt';

export function PartnerDetailAdminFooter({
  tab,
  partner,
  actorEmail,
  reportsCount,
  evidenceCount,
  lettersCount,
  negativesCount,
  openCasesCount,
  readinessScore,
  adminWorkflowId,
  adminWorkflowProgress,
  onUpdated,
  onOpenTab,
}: {
  tab: TabKey;
  partner: Partner;
  actorEmail?: string;
  reportsCount: number;
  evidenceCount: number;
  lettersCount: number;
  negativesCount: number;
  openCasesCount: number;
  readinessScore: number | null;
  adminWorkflowId: RoleWorkflowId;
  adminWorkflowProgress: Set<number>;
  onUpdated: () => void;
  onOpenTab: (tab: TabKey) => void;
}) {
  const showAccess = tab === 'overview' || tab === 'profile';
  const showBureauResources = tab === 'reports' || tab === 'debt';
  const showFullJourney = tab === 'overview' || tab === 'profile';

  return (
    <>
      {showBureauResources ? <PartnerBureauResourcesPanel /> : null}

      {showAccess ? <AdminPartnerAccessPanel partner={partner} onUpdated={onUpdated} /> : null}

      <section id="partner-client-journey" className={`${finelyOsCatalogCard('emerald')} !p-5 border-t-4 border-emerald-400/40 scroll-mt-8`}>
        <div>
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Customer journey</p>
          <p className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-sm`}>
            {showFullJourney
              ? 'Stage control and restore progress for this partner.'
              : 'Quick restore progress — open Overview or Profile for access, invites, and full journey controls.'}
          </p>
        </div>

        {showFullJourney ? (
          <div className="mt-5 space-y-5">
            <JourneyStageAdminControl partner={partner} actorEmail={actorEmail} onUpdated={onUpdated} />
            <PartnerCreditRestoreHud
              reportsCount={reportsCount}
              negativesCount={negativesCount}
              evidenceCount={evidenceCount}
              lettersCount={lettersCount}
              openCasesCount={openCasesCount}
              readinessScore={readinessScore}
              onOpenTab={(t) => onOpenTab(t as TabKey)}
              primaryAction={
                !reportsCount
                  ? { label: 'Upload report', tab: 'reports' }
                  : !lettersCount
                    ? { label: 'Open letters', tab: 'letters' }
                    : { label: 'Letter studio', tab: 'letters' }
              }
            />
            <details className={`${finelyOsCatalogCard('violet')} !p-4 group`}>
              <summary className="cursor-pointer select-none font-semibold text-white/90">Intake links & workflow tools</summary>
              <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
                <PartnerIntakeLinkPanel partner={partner} />
                <RoleWorkflowPanel roleId={adminWorkflowId} compact completedSteps={adminWorkflowProgress} />
                <LegacyApplicationStatusBanner partner={partner} />
              </div>
            </details>
          </div>
        ) : (
          <div className="mt-4">
            <PartnerCreditRestoreMiniRail
              reportsCount={reportsCount}
              evidenceCount={evidenceCount}
              lettersCount={lettersCount}
              onOpenTab={(t) => onOpenTab(t as TabKey)}
            />
          </div>
        )}
      </section>
    </>
  );
}
