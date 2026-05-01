import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';

const LAST_UPDATED_ISO = '2026-02-05';

export default function TermsPage() {
  const navigate = useNavigate();
  return (
    <PageShell
      badge="Legal"
      title="Terms of Service"
      subtitle="Please read these terms carefully before using Finely Cred services."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Home
          </a>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 md:p-8 space-y-6 text-white/80 text-sm leading-relaxed">
          <div className="flex items-center gap-2 text-amber-400">
            <FileText size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">Terms of Service</span>
          </div>
          <p className="text-white/50 text-xs uppercase tracking-wider">
            Last updated: {new Date(LAST_UPDATED_ISO).toLocaleDateString()}
          </p>

          <section className="space-y-3">
            <h2 className="text-white font-semibold text-base">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Finely Cred platform, you agree to be bound by these Terms of Service and our Privacy Policy.
              If you do not agree, do not use our services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white font-semibold text-base">2. Description of Services</h2>
            <p>
              Finely Cred provides educational content and software tools for credit awareness and workflow organization (for example:
              case tracking, document/evidence storage, templates, reminders, and reporting insights). Finely Cred is not a law firm
              and does not provide legal advice or financial advice. Use of the platform does not create an attorney-client relationship.
              Results vary and are influenced by many factors; we do not guarantee specific outcomes, deletions, score changes, approvals,
              funding, or timelines.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white font-semibold text-base">3. User Responsibilities</h2>
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

          <section className="space-y-3">
            <h2 className="text-white font-semibold text-base">4. Payments, Financing & Third-Party Providers</h2>
            <p>
              Finely Cred may offer multiple payment rails, including standard card/bank checkout and third-party financing options.
              Financing terms, approvals, and repayment schedules are determined by the financing provider and/or your selected financing
              contract. Third-party providers (including payment processors and financing providers) may have separate terms and privacy
              policies that apply to your use of their services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white font-semibold text-base">5. Intellectual Property</h2>
            <p>
              Content, branding, and technology on the platform are owned by Finely Cred or its licensors. You may not copy,
              modify, or distribute our materials without permission.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white font-semibold text-base">6. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Finely Cred is not liable for indirect, incidental, or consequential
              damages arising from your use of the platform. Our total liability is limited to the amount you paid for services
              in the twelve months preceding the claim.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white font-semibold text-base">7. Dispute Resolution</h2>
            <p>
              If you have a concern or dispute, please contact us first so we can attempt to resolve it. Any legal claims must be
              brought in a manner permitted by applicable law and subject to any additional dispute resolution terms you accept during
              checkout or financing.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white font-semibold text-base">8. Changes</h2>
            <p>
              We may update these terms from time to time. Continued use after changes constitutes acceptance. Material changes
              may be communicated via email or in-app notice.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white font-semibold text-base">9. Contact</h2>
            <p>
              Questions about these terms may be sent to the contact information provided on our Contact page or in the
              platform footer.
            </p>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
