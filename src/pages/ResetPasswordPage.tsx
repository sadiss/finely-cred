import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Lock } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { isSupabaseConfigured } from '../lib/supabaseClient';

export default function ResetPasswordPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (auth.user) {
      setReady(true);
      return;
    }
    const t = window.setTimeout(() => setReady(true), 1200);
    return () => window.clearTimeout(t);
  }, [auth.user]);

  const passwordOk = password.length >= 8;
  const match = password === confirm;

  const submit = async () => {
    if (!passwordOk) {
      setErr('Password must be at least 8 characters.');
      return;
    }
    if (!match) {
      setErr('Passwords do not match.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await auth.updatePassword(password);
      if (res.error) throw new Error(res.error);
      setDone(true);
      window.setTimeout(() => navigate('/login?auth=login'), 2500);
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Could not update password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-fc-shell flex items-center justify-center p-6">
      <div className="max-w-md w-full fc-light-glass-panel fc-light-chrome-panel rounded-2xl p-8 space-y-6">
        <div className="flex items-center gap-3">
          <KeyRound className="text-fuchsia-300" size={24} />
          <h1 className="text-xl font-bold text-white">Set new password</h1>
        </div>

        {!isSupabaseConfigured ? (
          <p className="text-white/60 text-sm">Supabase is not configured in this environment.</p>
        ) : done ? (
          <p className="text-emerald-300 text-sm">Password updated. Redirecting to login…</p>
        ) : !auth.user && ready ? (
          <p className="text-amber-200/90 text-sm">
            Open this page from the password reset link in your email. If the link expired, request a new one from{' '}
            <button type="button" className="underline" onClick={() => navigate('/forgot-password')}>
              forgot password
            </button>
            .
          </p>
        ) : (
          <>
            <p className="text-white/50 text-sm">Choose a new password for {auth.user?.email ?? 'your account'}.</p>
            <label className="block space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-white/40">New password</span>
              <div className="relative">
                <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-fc-input border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-white text-sm"
                  autoComplete="new-password"
                />
              </div>
            </label>
            <label className="block space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-white/40">Confirm password</span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm"
                autoComplete="new-password"
              />
            </label>
            {err ? <p className="text-rose-300 text-sm">{err}</p> : null}
            <button
              type="button"
              onClick={() => void submit()}
              disabled={busy || !passwordOk || !match}
              className="w-full min-h-[44px] rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-40 text-white font-semibold text-sm"
            >
              {busy ? 'Saving…' : 'Update password'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
