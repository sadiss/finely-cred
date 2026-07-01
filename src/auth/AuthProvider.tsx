import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { isAdminEmail } from './admin';
import { sendPasswordResetEmail } from '../lib/passwordResetEmail';
import { claimInvitedMembershipForUser, ensureFinelyPlatformAdminMembership } from '../data/tenantsRepo';

export type UserProfileUpdate = {
  name?: string;
  phone?: string;
  avatar_url?: string | null;
  bio?: string;
  title?: string;
  timezone?: string;
  notify_email?: boolean;
  notify_sms?: boolean;
  notify_portal?: boolean;
  preferred_contact?: 'email' | 'phone' | 'portal';
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  agentTierId?: string;
  agentSpecialties?: string[];
  agentTrainingPhase?: string;
  agentOperatingModel?: Record<string, unknown>;
  company_name?: string;
  website?: string;
  linkedin?: string;
  funding_target?: number;
  funding_timeline?: string;
};

type AuthContextValue = {
  isConfigured: boolean;
  isDevAuthEnabled: boolean;
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  signUpWithEmail: (args: { email: string; password: string; metadata?: Record<string, any> }) => Promise<{ error?: string; user?: User | null }>;
  signInWithEmail: (args: { email: string; password: string }) => Promise<{ error?: string; user?: User | null }>;
  signOut: () => Promise<void>;
  updateUserProfile: (patch: UserProfileUpdate) => Promise<{ error?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
  requestPasswordReset: (args: { email: string; redirectTo?: string; userId?: string }) => Promise<{ error?: string }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const DEV_USER_STORAGE_KEY = 'finely.devAuth.user.v1';

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [mockUser, setMockUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isDevAuthEnabled = import.meta.env.DEV && !isSupabaseConfigured;

  const activeUser = session?.user ?? mockUser ?? null;

  useEffect(() => {
    // Demo-mode: reconcile “invited” memberships and ensure platform admins get a membership record.
    const u = activeUser;
    const email =
      (u as any)?.email ||
      (u as any)?.user_metadata?.email ||
      (u as any)?.identities?.[0]?.identity_data?.email ||
      '';
    if (!u?.id || !email) return;
    try {
      claimInvitedMembershipForUser({ userId: u.id, email });
    } catch {
      // ignore
    }
    try {
      if (isAdminEmail(email)) ensureFinelyPlatformAdminMembership({ userId: u.id, email });
    } catch {
      // ignore
    }
  }, [activeUser?.id, (activeUser as any)?.email, (activeUser as any)?.user_metadata?.email]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (isDevAuthEnabled) {
          const saved = safeParseJson<User>(localStorage.getItem(DEV_USER_STORAGE_KEY));
          if (!mounted) return;
          setMockUser(saved);
          setSession(null);
        } else {
          const { data } = await supabase.auth.getSession();
          if (!mounted) return;
          setSession(data.session ?? null);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    if (isDevAuthEnabled) {
      return () => {
        mounted = false;
      };
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [isDevAuthEnabled]);

  const value = useMemo<AuthContextValue>(() => {
    const user = activeUser;
    return {
      isConfigured: isSupabaseConfigured,
      isDevAuthEnabled,
      isLoading,
      session,
      user,
      signUpWithEmail: async ({ email, password, metadata }) => {
        if (!isSupabaseConfigured) {
          if (!isDevAuthEnabled) return { error: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
          // Dev-mode mock auth (local only)
          const now = new Date().toISOString();
          const devUser = {
            id: crypto?.randomUUID ? crypto.randomUUID() : `dev_${Math.random().toString(16).slice(2)}`,
            aud: 'authenticated',
            role: 'authenticated',
            email,
            email_confirmed_at: now,
            phone: '',
            confirmed_at: now,
            last_sign_in_at: now,
            app_metadata: { provider: 'email', providers: ['email'] },
            user_metadata: metadata ?? {},
            identities: [],
            created_at: now,
            updated_at: now,
            is_anonymous: false,
          } as unknown as User;
          setMockUser(devUser);
          try {
            localStorage.setItem(DEV_USER_STORAGE_KEY, JSON.stringify(devUser));
          } catch {
            // ignore
          }
          return { user: devUser };
        }
        const siteUrl = import.meta.env.VITE_SITE_URL || 'https://finelycred.com';
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            ...(metadata ? { data: metadata } : {}),
            emailRedirectTo: `${siteUrl}/onboarding?confirmed=1`,
          },
        });
        if (error) return { error: error.message };
        if (data.session) setSession(data.session);
        return { user: data.user ?? data.session?.user ?? null };
      },
      signInWithEmail: async ({ email, password }) => {
        if (!isSupabaseConfigured) {
          if (!isDevAuthEnabled) return { error: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
          // Dev-mode mock auth (accepts any non-empty credentials)
          if (!email || !password) return { error: 'Email and password are required.' };

          const existing = safeParseJson<User>(localStorage.getItem(DEV_USER_STORAGE_KEY));
          const now = new Date().toISOString();
          const devUser = (existing
            ? {
                ...existing,
                email,
                last_sign_in_at: now,
                updated_at: now,
              }
            : ({
                id: crypto?.randomUUID ? crypto.randomUUID() : `dev_${Math.random().toString(16).slice(2)}`,
                aud: 'authenticated',
                role: 'authenticated',
                email,
                email_confirmed_at: now,
                phone: '',
                confirmed_at: now,
                last_sign_in_at: now,
                app_metadata: { provider: 'email', providers: ['email'] },
                user_metadata: {},
                identities: [],
                created_at: now,
                updated_at: now,
                is_anonymous: false,
              } as unknown as User));

          setMockUser(devUser);
          try {
            localStorage.setItem(DEV_USER_STORAGE_KEY, JSON.stringify(devUser));
          } catch {
            // ignore
          }
          return { user: devUser };
        }
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };
        if (data.session) setSession(data.session);
        return { user: data.user ?? data.session?.user ?? null };
      },
      signOut: async () => {
        try {
          if (isDevAuthEnabled) {
            setMockUser(null);
            try {
              localStorage.removeItem(DEV_USER_STORAGE_KEY);
            } catch {
              // ignore
            }
            return;
          }
          await supabase.auth.signOut();
        } catch {
          // no-op
        }
      },
      updateUserProfile: async (patch) => {
        const user = activeUser;
        if (!user) return { error: 'Not signed in.' };

        const nextMeta = {
          ...((user as any).user_metadata ?? {}),
          ...Object.fromEntries(
            Object.entries(patch).filter(([, v]) => v !== undefined),
          ),
        };

        if (isDevAuthEnabled) {
          const updated = { ...user, user_metadata: nextMeta, updated_at: new Date().toISOString() } as User;
          setMockUser(updated);
          try {
            localStorage.setItem(DEV_USER_STORAGE_KEY, JSON.stringify(updated));
          } catch {
            // ignore
          }
          return {};
        }

        if (!isSupabaseConfigured) return { error: 'Supabase is not configured.' };

        const { data, error } = await supabase.auth.updateUser({ data: nextMeta });
        if (error) return { error: error.message };
        if (data.user) setSession((prev) => (prev ? { ...prev, user: data.user! } : prev));
        return {};
      },
      updatePassword: async (password) => {
        if (!password || password.length < 8) return { error: 'Password must be at least 8 characters.' };
        if (isDevAuthEnabled) return { error: 'Password changes are not available in local demo mode.' };
        if (!isSupabaseConfigured) return { error: 'Supabase is not configured.' };
        const { error } = await supabase.auth.updateUser({ password });
        return error ? { error: error.message } : {};
      },
      requestPasswordReset: async ({ email, redirectTo, userId }) => {
        const trimmed = (email || '').trim();
        if (!trimmed) return { error: 'Email is required.' };
        if (isDevAuthEnabled) return { error: 'Password reset is not available in local demo mode.' };
        if (!isSupabaseConfigured) return { error: 'Supabase is not configured.' };
        const redirect = redirectTo || `${window.location.origin}/reset-password`;

        const viaComms = await sendPasswordResetEmail({ email: trimmed, redirectTo: redirect, userId });
        // ok:true covers both sent:true (email dispatched) and sent:false (no matching account —
        // we never reveal whether the address is registered). Only ok:false is a real server error.
        if (viaComms.ok) return {};
        return {
          error: viaComms.error || 'Could not send password reset email. Check SMTP secrets and edge function deployment.',
        };
      },
    };
  }, [activeUser, isDevAuthEnabled, isLoading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

