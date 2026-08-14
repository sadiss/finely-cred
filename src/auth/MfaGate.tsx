import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { isAdminEmail } from './admin';
import { MfaChallengePanel } from '../components/auth/MfaChallengePanel';
import { MfaEnrollmentPanel } from '../components/auth/MfaEnrollmentPanel';
import {
  hasVerifiedTotpFactor,
  isMfaProtectedPath,
  mfaVerificationRequired,
} from '../lib/mfaAuth';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../features/os/finelyOsLightUi';

type GatePhase = 'loading' | 'verify' | 'enroll' | 'ok';

/**
 * Portal MFA gate:
 * - Enrolled + AAL1 → require TOTP verification before sensitive routes.
 * - Not enrolled + sensitive route → encourage enrollment (soft block with bypass to dashboard).
 * - Admins with MFA enrolled must verify; admins without MFA see enrollment prompt on sensitive routes.
 */
export function MfaGate({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<GatePhase>('loading');

  const email = auth.user?.email ?? '';
  const isAdmin = email ? isAdminEmail(email) : false;
  const sensitive = isMfaProtectedPath(location.pathname);
  const adminRequired = isAdmin && location.pathname.startsWith('/admin');

  const evaluate = async () => {
    if (auth.isDevAuthEnabled || !auth.isConfigured || !auth.user) {
      setPhase('ok');
      return;
    }
    if (!sensitive) {
      setPhase('ok');
      return;
    }
    try {
      const hasTotp = await hasVerifiedTotpFactor();
      if (hasTotp) {
        const needsVerify = await mfaVerificationRequired();
        setPhase(needsVerify ? 'verify' : 'ok');
      } else {
        setPhase('enroll');
      }
    } catch {
      setPhase('ok');
    }
  };

  useEffect(() => {
    void evaluate();
  }, [auth.user?.id, location.pathname, auth.isDevAuthEnabled, auth.isConfigured]);

  if (phase === 'loading') {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (phase === 'verify') {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6">
        <MfaChallengePanel
          title="Verify authenticator"
          subtitle={
            isAdmin
              ? 'Platform admin access to partner credit data requires your authenticator code.'
              : 'Enter your authenticator code to open disputes, letters, and credit files.'
          }
          onVerified={() => setPhase('ok')}
          onCancel={() => navigate('/portal/dashboard')}
        />
      </div>
    );
  }

  if (phase === 'enroll') {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6">
        <div className={`${finelyOsCatalogCard('violet')} !p-6 max-w-lg w-full space-y-5`}>
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-amber-300 shrink-0" size={24} />
            <div>
              <h2 className="text-lg font-semibold text-white">Protect your credit data</h2>
              <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
                This area shows disputes, bureau data, and letters. Connect an authenticator app for a second sign-in step —
                {isAdmin ? ' required for admin portal views.' : ' strongly recommended for partners.'}
              </p>
            </div>
          </div>
          <MfaEnrollmentPanel emphasizeSensitiveData />
          {!adminRequired ? (
            <button type="button" onClick={() => navigate('/portal/dashboard')} className={FINELY_OS_SECONDARY_BTN}>
              Back to dashboard (skip for now)
            </button>
          ) : (
            <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_SECONDARY_BTN}>
              Back to dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
