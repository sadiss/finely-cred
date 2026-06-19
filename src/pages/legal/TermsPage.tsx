import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import {
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
} from '../../features/os/finelyOsLightUi';
import { MarketingStaffChatStrip } from '../../components/marketing/MarketingStaffChatStrip';

const LAST_UPDATED_ISO = '2026-02-05';

export default function TermsPage() {
  const navigate = useNavigate();
  usePublicSeoMeta({
    title: 'Terms of service',
    description: 'Finely Cred terms of service and platform usage agreement.',
    path: '/terms',
  });
  return (
    <PageShell
      badge="Legal"
      title="Terms of Service"
      subtitle="Please read these terms carefully before using Finely Cred services."
    >
      <div className={FINELY_OS_PAGE}>
        <FinelyUnifiedHubLayout
          eyebrow="Legal"
          title="Terms of Service"
          subtitle={`Last updated: ${new Date(LAST_UPDATED_ISO).toLocaleDateString()}`}
          accent="fuchsia"
          tabs={[{ id: 'terms', label: 'Terms' }]}
          activeTab="terms"
          secondaryAction={{ label: 'Privacy policy', onClick: () => navigate('/privacy') }}
        >
        <div className={`${finelyOsCatalogCard('violet')} !p-5 md:p-8 space-y-6`}>
          <section className={`space-y-3 ${FINELY_OS_ENTITY_BODY}`}>
            <h2 className={`${FINELY_OS_ENTITY_VALUE} text-base`}>1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Finely Cred platform, you agree to be bound by these Terms of Service and our Privacy Policy.
              If you do not agree, do not use our services.
            </p>
          </section>

          <section id="services" className={`space-y-3 ${FINELY_OS_ENTITY_BODY}`}>
            <h2 className={`${FINELY_OS_ENTITY_VALUE} text-base`}>2. Description of Services</h2>
            <p>
              Finely Cred provides educational content and software tools for credit awareness and workflow organization (for example:
              case tracking, document/evidence storage, templates, reminders, and reporting insights). Finely Cred is not a law firm
              and does not provide legal advice or financial advice. Use of the platform does not create an attorney-client relationship.
              Results vary and are influenced by many factors; we do not guarantee specific outcomes, deletions, score changes, approvals,
              funding, or timelines.
            </p>
          </section>

          <section className={`space-y-3 ${FINELY_OS_ENTITY_BODY}`}>
            <h2 className={`${FINELY_OS_ENTITY_VALUE} text-base`}>3. User Responsibilities</h2>
            <p>
              You are responsible for the accuracy of information you provide, for keeping your account secure, and for complying
              with applicable laws. You may not use the platform for fraudulent or illegal purposes.
            </p>
            <p>
              If you are an agency user (including white-label use), you represent and warrant that you have all necessary authority,
              consents, and permissions to upload and process your clients’ information and documents. You are responsible for your
              communications with your clients and for complying with all applicable consumer protection and privacy laws.
            </p>
          </section>

          <section className={`space-y-3 ${FINELY_OS_ENTITY_BODY}`}>
            <h2 className={`${FINELY_OS_ENTITY_VALUE} text-base`}>4. Payments, Financing & Third-Party Providers</h2>
            <p>
              Finely Cred may offer multiple payment rails, including standard card/bank checkout and third-party financing options.
              Financing terms, approvals, and repayment schedules are determined by the financing provider and/or your selected financing
              contract. Third-party providers (including payment processors and financing providers) may have separate terms and privacy
              policies that apply to your use of their services.
            </p>
          </section>

          <section id="confidentiality" className={`space-y-3 ${FINELY_OS_ENTITY_BODY}`}>
            <h2 className={`${FINELY_OS_ENTITY_VALUE} text-base`}>5. Confidentiality & NDA</h2>
            <p>
              Partner and client files may include highly sensitive personal and financial information. Both parties agree to use
              confidential information only for authorized workflow purposes and to protect it with reasonable care. Platform
              templates, pricing, workflows, and non-public business methods remain Finely Cred confidential information.
            </p>
          </section>

          <section className={`space-y-3 ${FINELY_OS_ENTITY_BODY}`}>
            <h2 className={`${FINELY_OS_ENTITY_VALUE} text-base`}>6. Intellectual Property</h2>
            <p>
              Content, branding, and technology on the platform are owned by Finely Cred or its licensors. You may not copy,
              modify, or distribute our materials without permission.
            </p>
          </section>

          <section id="esign" className={`space-y-3 ${FINELY_OS_ENTITY_BODY}`}>
            <h2 className={`${FINELY_OS_ENTITY_VALUE} text-base`}>7. Electronic Records & Signatures</h2>
            <p>
              You consent to receive agreements, notices, and workflow documents electronically. Electronic signatures and
              acknowledgements in the portal have the same effect as handwritten signatures where permitted by law.
            </p>
          </section>

          <section className={`space-y-3 ${FINELY_OS_ENTITY_BODY}`}>
            <h2 className={`${FINELY_OS_ENTITY_VALUE} text-base`}>8. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Finely Cred is not liable for indirect, incidental, or consequential
              damages arising from your use of the platform. Our total liability is limited to the amount you paid for services
              in the twelve months preceding the claim.
            </p>
          </section>

          <section className={`space-y-3 ${FINELY_OS_ENTITY_BODY}`}>
            <h2 className={`${FINELY_OS_ENTITY_VALUE} text-base`}>9. Dispute Resolution</h2>
            <p>
              If you have a concern or dispute, please contact us first so we can attempt to resolve it. Any legal claims must be
              brought in a manner permitted by applicable law and subject to any additional dispute resolution terms you accept during
              checkout or financing.
            </p>
          </section>

          <section className={`space-y-3 ${FINELY_OS_ENTITY_BODY}`}>
            <h2 className={`${FINELY_OS_ENTITY_VALUE} text-base`}>10. Changes</h2>
            <p>
              We may update these terms from time to time. Continued use after changes constitutes acceptance. Material changes
              may be communicated via email or in-app notice.
            </p>
          </section>

          <section className={`space-y-3 ${FINELY_OS_ENTITY_BODY}`}>
            <h2 className={`${FINELY_OS_ENTITY_VALUE} text-base`}>11. Contact</h2>
            <p>
              Questions about these terms may be sent to the contact information provided on our Contact page or in the
              platform footer.
            </p>
          </section>
        </div>
        </FinelyUnifiedHubLayout>

        <MarketingStaffChatStrip
          roleId="support_specialist"
          goal="not_sure"
          roleLabel="partner success specialist"
          subline="Questions about these terms? Chat with our on-duty support specialist."
          buttonTone="secondary"
        />

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
