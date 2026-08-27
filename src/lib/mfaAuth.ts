import type { AuthenticatorAssuranceLevels, Factor } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './supabaseClient';

export type MfaAssuranceSnapshot = {
  currentLevel: AuthenticatorAssuranceLevels | null;
  nextLevel: AuthenticatorAssuranceLevels | null;
};

export type MfaFactorSummary = {
  id: string;
  friendlyName: string;
  status: Factor['status'];
  createdAt: string;
};

export type MfaEnrollStart = {
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
};

export async function listVerifiedTotpFactors(): Promise<MfaFactorSummary[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw new Error(error.message);
  return (data?.totp ?? [])
    .filter((f) => f.status === 'verified')
    .map((f) => ({
      id: f.id,
      friendlyName: f.friendly_name || 'Authenticator app',
      status: f.status,
      createdAt: f.created_at,
    }));
}

export async function getMfaAssuranceLevel(): Promise<MfaAssuranceSnapshot | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    currentLevel: data.currentLevel ?? null,
    nextLevel: data.nextLevel ?? null,
  };
}

/** True when partner has TOTP enrolled but session is still AAL1 (needs code). */
export async function mfaVerificationRequired(): Promise<boolean> {
  const aal = await getMfaAssuranceLevel();
  if (!aal) return false;
  return aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2';
}

export async function hasVerifiedTotpFactor(): Promise<boolean> {
  const factors = await listVerifiedTotpFactors();
  return factors.length > 0;
}

export async function startTotpEnrollment(friendlyName = 'Finely Cred Authenticator'): Promise<MfaEnrollStart> {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName,
  });
  if (error) throw new Error(error.message);
  if (!data?.id || !data.totp) throw new Error('Could not start authenticator enrollment.');
  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
  };
}

/** Activate a newly enrolled TOTP factor with the first 6-digit code. */
export async function verifyTotpEnrollment(factorId: string, code: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
  const trimmed = code.replace(/\s/g, '');
  const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId });
  if (challengeErr) throw new Error(challengeErr.message);
  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code: trimmed,
  });
  if (error) throw new Error(error.message);
}

/** Complete sign-in MFA step — upgrades session to AAL2. */
export async function verifyTotpSignIn(code: string, factorId?: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
  const trimmed = code.replace(/\s/g, '');
  let targetFactorId = factorId;
  if (!targetFactorId) {
    const factors = await listVerifiedTotpFactors();
    if (!factors.length) throw new Error('No authenticator enrolled on this account.');
    targetFactorId = factors[0].id;
  }
  const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: targetFactorId });
  if (challengeErr) throw new Error(challengeErr.message);
  const { error } = await supabase.auth.mfa.verify({
    factorId: targetFactorId,
    challengeId: challenge.id,
    code: trimmed,
  });
  if (error) throw new Error(error.message);
}

export async function unenrollTotpFactor(factorId: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw new Error(error.message);
}

/** Portal paths that expose credit reports, disputes, letters, or identity data. */
const SENSITIVE_PORTAL_PREFIXES = [
  '/portal/disputes',
  '/portal/letters',
  '/portal/documents',
  '/portal/reports',
  '/portal/evidence',
  '/portal/analysis',
  '/portal/debt',
  '/portal/identity-theft',
  '/portal/checklist',
  '/portal/build',
];

export function isSensitivePortalPath(pathname: string): boolean {
  return SENSITIVE_PORTAL_PREFIXES.some((p) => pathname.startsWith(p));
}

/** Admin console and sensitive portal routes require MFA verification or enrollment. */
export function isMfaProtectedPath(pathname: string): boolean {
  return pathname.startsWith('/admin') || isSensitivePortalPath(pathname);
}
