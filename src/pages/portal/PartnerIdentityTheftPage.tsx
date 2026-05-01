import React, { useMemo } from 'react';
import { ArrowLeft, ShieldAlert, FileCheck, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { getOrCreatePartnerForSession } from '../../portal/getOrCreatePartnerForSession';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';

export default function PartnerIdentityTheftPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const partner = useMemo(() => getOrCreatePartnerForSession({ user: auth.user }), [auth.user]);

  return (
    <PageShell
      badge="Partner Portal"
      title="Identity Theft Center"
      subtitle="Report identity theft, freeze your credit, and track recovery steps in one place."
    >
      {!partner ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 text-white/60">
            No partner profile found. If you're an admin, use Partner Management to pick a partner.
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      ) : (
        <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.identityTheft]}>
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={() => navigate('/portal/dashboard')}
                className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
              >
                <ArrowLeft size={16} /> Partner Dashboard
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
              >
                <ArrowLeft size={16} /> Finely Cred
              </button>
            </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-xl p-6 flex items-start gap-4">
            <ShieldAlert size={24} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-white font-semibold">Identity theft support</h2>
              <p className="mt-2 text-white/70 text-sm">
                File your official FTC Identity Theft Report, freeze your bureau files, and keep your proof pack organized. Store
                documents in the Documents Vault and keep communications inside Messages.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-start gap-3">
              <FileCheck size={20} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-white font-medium text-sm">FTC Identity Theft Report</div>
                <a
                  href="https://www.identitytheft.gov/"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-amber-300 underline text-xs"
                >
                  Open identitytheft.gov
                </a>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-white font-medium text-sm">Fraud alert & freeze</div>
                <div className="mt-1 space-y-1 text-xs">
                  <a
                    href="https://www.equifax.com/personal/credit-report-services/credit-freeze/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-300 underline"
                  >
                    Equifax freeze
                  </a>
                  <a
                    href="https://www.experian.com/freeze/center.html"
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-300 underline"
                  >
                    Experian freeze
                  </a>
                  <a
                    href="https://www.transunion.com/credit-freeze"
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-300 underline"
                  >
                    TransUnion freeze
                  </a>
                </div>
              </div>
            </div>
          </div>

          <p className="text-white/40 text-xs">
            For now, use Dispute Center for any inaccurate accounts and Documents Vault to store identity-theft-related paperwork.
          </p>
          </div>
        </EntitlementGate>
      )}
    </PageShell>
  );
}
