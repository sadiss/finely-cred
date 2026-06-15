import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, ShieldAlert } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { useAuth } from '../auth/AuthProvider';
import { findInviteByToken, markInviteClaimed } from '../data/invitesRepo';
import { claimPartnerViaEdge, getPartner, upsertPartner } from '../data/partnersRepo';
import { syncClaimedPartnerRecord } from '../data/partnersSupabaseSync';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { isAdminEmail } from '../auth/admin';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_ENTITY_VALUE,
} from '../features/os/finelyOsLightUi';

function useToken(): string {
  const location = useLocation();
  return useMemo(() => {
    try {
      const sp = new URLSearchParams(location.search);
      return (sp.get('token') || '').trim();
    } catch {
      return '';
    }
  }, [location.search]);
}

export default function ClaimPartnerProfilePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const token = useToken();
  usePublicSeoMeta({
    title: 'Claim your partner profile',
    description: 'Connect your imported Finely Cred profile to your account and resume your journey.',
    path: '/claim',
  });
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const invite = useMemo(() => (token ? findInviteByToken(token) : null), [token]);
  const [partner, setPartner] = useState<any>(null);
  useEffect(() => {
    if (!invite) {
      setPartner(null);
      return;
    }
    getPartner(invite.partnerId).then(setPartner);
  }, [invite?.partnerId]);

  const loginRedirect = `/onboarding?next=${encodeURIComponent(`/claim${location.search}`)}`;

  const claim = async () => {
    setErr(null);
    if (!token) {
      setErr('Missing token.');
      return;
    }
    if (!invite) {
      setErr('Invalid or expired claim link.');
      return;
    }
    if (!auth.user?.id) {
      setErr('Please sign in first.');
      return;
    }
    const email = auth.user.email || '';
    if (email && isAdminEmail(email)) {
      setErr('Admins cannot claim partner profiles.');
      return;
    }
    const p = partner;
    if (!p) {
      setErr('Partner record not found.');
      return;
    }
    if (p.claimedUserId && p.claimedUserId !== auth.user.id) {
      setErr('This partner profile is already claimed by a different account.');
      return;
    }

    markInviteClaimed(token, { userId: auth.user.id });
    if (isSupabaseConfigured) {
      const claimed = await claimPartnerViaEdge({ partnerId: p.id });
      if (!claimed) {
        setErr('Could not claim this profile. Make sure you signed up with the same email address this profile was created for.');
        return;
      }
      await syncClaimedPartnerRecord({ partner: claimed, user: auth.user });
    } else {
      await upsertPartner({
        ...p,
        claimedUserId: auth.user.id,
        claimedAt: new Date().toISOString(),
        profile: { ...p.profile, email: p.profile.email || email || undefined },
      });
    }
    setDone(true);
  };

  return (
    <PageShell
      badge="Auth"
      title="Claim your profile"
      subtitle="Connect your imported legacy profile to this account so your journey resumes where you left off."
    >
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button type="button" onClick={() => navigate('/')} className={FINELY_OS_BACK_LINK} title="Back to Home">
            <ArrowLeft size={16} /> Home
          </button>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>claim</div>
        </div>

        {err ? (
          <div className={`${FINELY_OS_NOTICE_ERROR} flex items-start gap-3`}>
            <ShieldAlert size={18} className="mt-0.5 shrink-0" />
            <div>{err}</div>
          </div>
        ) : null}

        {done ? (
          <div className={`space-y-3 ${FINELY_OS_NOTICE_SUCCESS}`}>
            <div className="inline-flex items-center gap-2">
              <CheckCircle2 size={18} />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Claim complete</span>
            </div>
            <div className={FINELY_OS_ENTITY_BODY}>Your profile is now connected. You’ll be taken to your Partner Dashboard.</div>
            <button type="button" onClick={() => navigate('/portal/dashboard')} className={FINELY_OS_PRIMARY_BTN}>
              Go to dashboard <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div className={`space-y-4 ${finelyOsCatalogCard('violet')} !p-5`}>
            <div className="inline-flex items-center gap-2 text-fuchsia-400">
              <KeyRound size={18} />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Claim link</span>
            </div>

            {!token ? (
              <div className={FINELY_OS_ENTITY_BODY}>This link is missing a token.</div>
            ) : !invite ? (
              <div className={FINELY_OS_ENTITY_BODY}>This claim link is not valid.</div>
            ) : (
              <div className="space-y-2">
                <div className={FINELY_OS_ENTITY_BODY}>
                  Partner: <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{partner?.profile.fullName ?? invite.partnerId}</span>
                </div>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                  invite_id:{invite.id} • created:{new Date(invite.createdAt).toLocaleString()}
                </div>
              </div>
            )}

            {!auth.user ? (
              <div className="space-y-3">
                <div className={FINELY_OS_ENTITY_BODY}>Sign in or create an account to claim this profile.</div>
                <button type="button" onClick={() => navigate(loginRedirect)} className={FINELY_OS_PRIMARY_BTN}>
                  Login / Signup <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={claim} className={FINELY_OS_SUCCESS_BTN}>
                  Claim profile <ArrowRight size={14} />
                </button>
                <button type="button" onClick={() => navigate('/portal/dashboard')} className={FINELY_OS_SECONDARY_BTN}>
                  Skip <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        <MarketingStaffChatStrip
          roleId="support_specialist"
          goal="personal"
          roleLabel="partner success specialist"
          subline="Need help claiming your imported profile or linking the right email?"
          buttonTone="secondary"
        />

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
