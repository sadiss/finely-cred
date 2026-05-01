import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';

const LAST_UPDATED_ISO = '2026-02-05';

export default function PrivacyPage() {
  const navigate = useNavigate();
  return (
    <PageShell
      badge="Legal"
      title="Privacy Policy"
      subtitle="How we collect, use, and protect your information."
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
            <Shield size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">Privacy Policy</span>
          </div>
          <p className="text-white/50 text-xs uppercase tracking-wider">
            Last updated: {new Date(LAST_UPDATED_ISO).toLocaleDateString()}
          </p>

          <section className="space-y-3">
            <h2 className="text-white font-semibold text-base">1. Information We Collect</h2>
            <p>
              We collect information you provide, such as your name, email, phone number, and address (where applicable). If you
              upload documents (for example: credit reports, IDs, bureau letters, or supporting evidence), we store those documents
              in a secure account context so you can access them later. We also collect basic usage and device data (e.g., browser type,
              timestamps, and approximate network information) to maintain security and improve performance.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white font-semibold text-base">2. How We Use It</h2>
            <p>
              We use your information to provide and improve our services, to communicate with you, to comply with law, and to
              protect our rights. We do not sell your personal information to third parties for marketing.
            </p>
            <p>
              If you are an agency user, you are responsible for obtaining any client consents required to input, store, or process
              client information within the platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white font-semibold text-base">3. Data Security</h2>
            <p>
              We use industry-standard measures to protect your data, including access controls and secure transport (HTTPS). We
              restrict access to partner/client files based on account permissions. Sensitive information may be stored or transmitted
              using encryption and short-lived access links where appropriate.
            </p>
            <p>
              You are responsible for keeping your login credentials secure and for protecting the devices you use to access the platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white font-semibold text-base">4. Data Retention</h2>
            <p>
              We retain your information for as long as necessary to provide the services, comply with legal obligations, resolve disputes,
              and enforce our agreements. You may request deletion of your account and associated data subject to applicable law and recordkeeping
              requirements.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white font-semibold text-base">5. Cookies and Tracking</h2>
            <p>
              We may use cookies and similar technologies for session management, preferences, and analytics. You can adjust
              browser settings to limit cookies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white font-semibold text-base">6. Your Rights (e.g. CCPA)</h2>
            <p>
              Depending on your location, you may have rights to access, correct, delete, or port your data, or to opt out of
              certain uses. Contact us to exercise these rights.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white font-semibold text-base">7. Contact</h2>
            <p>
              Privacy-related requests or questions may be sent to the contact information on our Contact page or in the
              platform footer.
            </p>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
