import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, ShieldAlert } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { useAuth } from '../auth/AuthProvider';
import { findInviteByToken, markInviteClaimed } from '../data/invitesRepo';
import { getPartner, upsertPartner } from '../data/partnersRepo';
import { isAdminEmail } from '../auth/admin';

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
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const invite = useMemo(() => (token ? findInviteByToken(token) : null), [token]);
  const [partner, setPartner] = useState<any>(null);
  useEffect(() => {
    if (!invite) { setPartner(null); return; }
    getPartner(invite.partnerId).then(setPartner);
  }, [invite?.partnerId]);

  const loginRedirect = `/onboarding?next=${encodeURIComponent(`/claim${location.search}`)}`;

  const claim = () => {
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
    void upsertPartner({
      ...p,
      claimedUserId: auth.user.id,
      claimedAt: new Date().toISOString(),
      // Best-effort: hydrate email if missing.
      profile: { ...p.profile, email: p.profile.email || email || undefined },
    });
    setDone(true);
  };

  return (
    <PageShell
      badge="Auth"
      title="Claim your profile"
      subtitle="Connect your imported legacy profile to this account so your journey resumes where you left off."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
            title="Back to Home"
          >
            <ArrowLeft size={16} /> Home
          </button>
          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">claim</div>
        </div>

        {err ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-100 text-sm flex items-start gap-3">
            <ShieldAlert size={18} className="mt-0.5" />
            <div>{err}</div>
          </div>
        ) : null}

        {done ? (
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-6 space-y-3">
            <div className="inline-flex items-center gap-2 text-emerald-200">
              <CheckCircle2 size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Claim complete</span>
            </div>
            <div className="text-white/70 text-sm">
              Your profile is now connected. You’ll be taken to your Partner Dashboard.
            </div>
            <button
              type="button"
              onClick={() => navigate('/portal/dashboard')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
            >
              Go to dashboard <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
            <div className="inline-flex items-center gap-2 text-amber-400">
              <KeyRound size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Claim link</span>
            </div>

            {!token ? (
              <div className="text-white/60 text-sm">This link is missing a token.</div>
            ) : !invite ? (
              <div className="text-white/60 text-sm">This claim link is not valid.</div>
            ) : (
              <div className="space-y-2">
                <div className="text-white/60 text-sm">
                  Partner: <span className="text-white/85 font-semibold">{partner?.profile.fullName ?? invite.partnerId}</span>
                </div>
                <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                  invite_id:{invite.id} • created:{new Date(invite.createdAt).toLocaleString()}
                </div>
              </div>
            )}

            {!auth.user ? (
              <div className="space-y-3">
                <div className="text-white/60 text-sm">Sign in or create an account to claim this profile.</div>
                <button
                  type="button"
                  onClick={() => navigate(loginRedirect)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                >
                  Login / Signup <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={claim}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                >
                  Claim profile <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/portal/dashboard')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                >
                  Skip <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}

