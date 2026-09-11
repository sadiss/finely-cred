import React, { useMemo } from 'react';
import { ArrowRight, Languages, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StaffPortraitImg } from '../../../../components/staff/StaffPortraitImg';
import { getStaffMemberById } from '../../../../data/staffRoster';
import { HAITIAN_HELPER_ARTICLE, HAITIAN_HELPER_COMPLIANCE_EN, HAITIAN_HELPER_COMPLIANCE_HT } from '../../../../lib/haitianHelperPlaybook';
import {
  HAITIAN_LETTER_SAMPLES,
  HAITIAN_STAFF_IDS,
  openHaitianCompanionChat,
} from '../../../../lib/haitianCompanionDesk';
import {
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { HaitianMarketingKitLibrary } from '../components/HaitianMarketingKitLibrary';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import './partnerHaitianDeskProductSurface.css';

export default function PartnerHaitianDeskProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const resolvePath = usePartnerProductPathResolver();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const archetype = getWorkspaceProductArchetype('partner', pageId);
  const faces = useMemo(
    () => HAITIAN_STAFF_IDS.map((id) => getStaffMemberById(id)).filter(Boolean),
    [],
  );

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Community"
      title="Haitian community"
      description="Credit help in Kreyòl and English. Read the letter they received. Photograph the bureau screen. Pick one next step."
      accent={navItem?.accent ?? 'emerald'}
      surfaceMode={navItem?.surfaceMode ?? 'light'}
      archetype={archetype}
      icon={navItem?.icon ?? Languages}
      primaryAction={
        <ProductPagePrimaryAction label="Pale Kreyòl" onClick={() => openHaitianCompanionChat()} />
      }
    >
      <div className="fc-ht-workbench">
        <section className="fc-ht-letter" aria-label="Letter sample">
          <div className="fc-ht-letter__flap" aria-hidden />
          <p className="fc-ht-letter__kicker">Letter sample</p>
          <h2 className={`fc-ht-letter__title ${FINELY_OS_ENTITY_VALUE}`}>Read the letter. Hear what it asks.</h2>
          <p className={`mt-3 text-base ${FINELY_OS_ENTITY_BODY}`}>
            Open the letter they received. Then pick one next step.
          </p>
          <div className="fc-ht-voice">
            {HAITIAN_LETTER_SAMPLES.map((line) => (
              <article key={line.key} className="fc-ht-voice__row">
                <p className="fc-ht-voice__en">{line.english}</p>
                <p className="fc-ht-voice__ht">{line.kreyol}</p>
                <p className="fc-ht-voice__learn">{line.learn}</p>
              </article>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => openHaitianCompanionChat()}>
              Pale Kreyòl <MessageCircle size={18} />
            </button>
            <button
              type="button"
              className={FINELY_OS_SECONDARY_BTN}
              onClick={() => navigate(resolvePath('/portal/checklist'))}
            >
              Open restore <ArrowRight size={18} />
            </button>
            <button
              type="button"
              className={FINELY_OS_SECONDARY_BTN}
              onClick={() =>
                openProductCopilot({
                  prompt: 'Help me explain a credit letter to a Haitian-American partner.',
                  contextLabel: 'Haitian community',
                })
              }
            >
              Ask Finely
            </button>
          </div>
        </section>

        <aside className="fc-ht-tools">
          <section className="fc-ht-playbook" aria-label="Ede yon moun">
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Ede yon moun</p>
            <h3 className={`mt-1 text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{HAITIAN_HELPER_ARTICLE.titleEn}</h3>
            <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>{HAITIAN_HELPER_ARTICLE.p1En}</p>
            <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>{HAITIAN_HELPER_ARTICLE.p1Ht}</p>
            <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>{HAITIAN_HELPER_ARTICLE.p2En}</p>
            <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>{HAITIAN_HELPER_ARTICLE.p2Ht}</p>
          </section>

          <section className="fc-ht-faces" aria-label="Desk faces">
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Haitian community</p>
            <h3 className={`mt-1 text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Who sits with you</h3>
            <div className="fc-ht-faces__row">
              {faces.map((staff) => (
                <div key={staff!.id} className="fc-ht-face">
                  <StaffPortraitImg staff={staff!} />
                  <div>
                    <strong className={FINELY_OS_ENTITY_VALUE}>
                      {staff!.firstName} {staff!.lastName}
                    </strong>
                    <p className={FINELY_OS_ENTITY_BODY}>{staff!.displayTitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
      <section className="mt-8" aria-label="Marketing closet">
        <HaitianMarketingKitLibrary />
      </section>
      <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} mt-6`}>
        {HAITIAN_HELPER_COMPLIANCE_EN} · {HAITIAN_HELPER_COMPLIANCE_HT}
      </p>
    </ProductHubScaffold>
  );
}
