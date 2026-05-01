import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { LettersCommandCenter } from '../../components/letters/LettersCommandCenter';
import { useAuth } from '../../auth/AuthProvider';
import { getOrCreatePartnerForSession } from '../../portal/getOrCreatePartnerForSession';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { hasEntitlement } from '../../data/billingRepo';

export default function PartnerLettersPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const partner = useMemo(() => getOrCreatePartnerForSession({ user: auth.user }), [auth.user]);
  const [storeVersion, setStoreVersion] = useState(0);

  useEffect(() => {
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  if (!partner) {
    return (
      <PageShell
        badge="Partner Portal"
        title="Letters"
        subtitle="Sign in to generate letters, preview on paper, and save PDFs into your Letters Vault."
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 text-white/60">
            No partner profile found for this account.
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      </PageShell>
    );
  }

  const unlocked = useMemo(() => hasEntitlement(partner.id, ENTITLEMENT_KEYS.letters), [partner.id, storeVersion]);
  if (!unlocked) {
    return (
      <PageShell
        badge="Partner Portal"
        title="Letters"
        subtitle="Letters are locked on your current plan. Upgrade to generate and save dispute letters."
      >
        <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.letters]}>
          <div />
        </EntitlementGate>
      </PageShell>
    );
  }

  // Avoid nesting PageShell (LettersCommandCenter renders its own shell in standalone).
  return <LettersCommandCenter partner={partner} layout="standalone" />;
}

