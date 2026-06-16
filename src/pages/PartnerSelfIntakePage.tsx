import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, FileUp, ShieldAlert, UserRound } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { useAuth } from '../auth/AuthProvider';
import { findInviteByToken } from '../data/invitesRepo';
import { getPartner, upsertPartner } from '../data/partnersRepo';
import type { Partner } from '../domain/partners';
import { ReportUploader } from '../components/reports/ReportUploader';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
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

type Draft = {
  fullName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
};

function draftFromPartner(partner: Partner | null): Draft {
  const routeKey = partner?.primaryRoute || 'personal_restore';
  const personal = (partner?.routes?.[routeKey] as { personal?: Record<string, string> } | undefined)?.personal ?? {};
  return {
    fullName: partner?.profile.fullName || '',
    email: partner?.profile.email || '',
    phone: partner?.profile.phone || '',
    address1: personal.address1 || '',
    address2: personal.address2 || '',
    city: personal.city || '',
    state: personal.state || '',
    postalCode: personal.postalCode || '',
  };
}

export default function PartnerSelfIntakePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const token = useToken();
  usePublicSeoMeta({
    title: 'Complete your partner profile',
    description: 'Enter your contact and mailing details so Finely Cred can prepare dispute letters and updates for you.',
    path: '/partner-setup',
  });

  const invite = useMemo(() => (token ? findInviteByToken(token) : null), [token]);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [draft, setDraft] = useState<Draft>(() => draftFromPartner(null));
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!invite) {
      setPartner(null);
      return;
    }
    getPartner(invite.partnerId).then((p) => {
      setPartner(p);
      setDraft(draftFromPartner(p));
    });
  }, [invite?.partnerId]);

  const loginRedirect = `/onboarding?next=${encodeURIComponent(`/partner-setup${location.search}`)}`;
  const claimRedirect = `/claim${location.search}`;

  const save = async () => {
    setErr(null);
    if (!invite || !partner) {
      setErr('This intake link is not valid.');
      return;
    }
    const fullName = draft.fullName.trim();
    const email = draft.email.trim();
    if (!fullName) {
      setErr('Full legal name is required.');
      return;
    }
    if (!email) {
      setErr('Email is required so we can link your account.');
      return;
    }

    setSaving(true);
    try {
      const routeKey = partner.primaryRoute || 'personal_restore';
      const route = partner.routes?.[routeKey] ?? {};
      const personal = {
        ...((route as { personal?: Record<string, string> }).personal ?? {}),
        address1: draft.address1.trim() || undefined,
        address2: draft.address2.trim() || undefined,
        city: draft.city.trim() || undefined,
        state: draft.state.trim() || undefined,
        postalCode: draft.postalCode.trim() || undefined,
      };
      await upsertPartner({
        ...partner,
        profile: {
          ...partner.profile,
          fullName,
          email,
          phone: draft.phone.trim() || undefined,
        },
        routes: {
          ...(partner.routes ?? {}),
          [routeKey]: { ...route, personal },
        },
        journeyStage: partner.journeyStage === 'intake' ? 'report_upload' : partner.journeyStage,
        journeySignals: {
          ...(partner.journeySignals ?? {}),
          intakeSelfCompletedAt: new Date().toISOString(),
        },
      });
      setDone(true);
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Could not save your information.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      badge="Partner intake"
      title="Complete your profile"
      subtitle="Enter your own contact and mailing details — used on dispute letters and bureau correspondence. You can upload a credit report now or after you sign in."
    >
      <div className={FINELY_OS_PAGE}>
        {!token || !invite ? (
          <div className={`${FINELY_OS_NOTICE_ERROR} flex items-start gap-3`}>
            <ShieldAlert size={18} className="mt-0.5 shrink-0" />
            <div>This intake link is missing or expired. Ask your Finely Cred specialist for a new link.</div>
          </div>
        ) : null}

        {err ? (
          <div className={`${FINELY_OS_NOTICE_ERROR} flex items-start gap-3`}>
            <ShieldAlert size={18} className="mt-0.5 shrink-0" />
            <div>{err}</div>
          </div>
        ) : null}

        {done ? (
          <div className={`space-y-4 ${FINELY_OS_NOTICE_SUCCESS}`}>
            <div className="inline-flex items-center gap-2">
              <CheckCircle2 size={18} />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Profile saved</span>
            </div>
            <p className={FINELY_OS_ENTITY_BODY}>
              Thank you — your details are on file. Sign in (or create an account) with <strong>{draft.email}</strong> to claim your
              profile and open your partner dashboard.
            </p>
            <div className="flex flex-wrap gap-3">
              {auth.user ? (
                <button type="button" onClick={() => navigate(claimRedirect)} className={FINELY_OS_PRIMARY_BTN}>
                  Claim profile <ArrowRight size={14} />
                </button>
              ) : (
                <button type="button" onClick={() => navigate(loginRedirect)} className={FINELY_OS_PRIMARY_BTN}>
                  Sign in / create account <ArrowRight size={14} />
                </button>
              )}
              <button type="button" onClick={() => navigate('/')} className={FINELY_OS_SECONDARY_BTN}>
                Back to site
              </button>
            </div>
          </div>
        ) : invite && partner ? (
          <div className="space-y-6">
            <div className={`${finelyOsCatalogCard('emerald')} !p-5 space-y-2`}>
              <div className="inline-flex items-center gap-2 text-emerald-300">
                <UserRound size={18} />
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Your file</span>
              </div>
              <p className={FINELY_OS_ENTITY_BODY}>
                Profile for <span className={FINELY_OS_ENTITY_VALUE}>{partner.profile.fullName || 'Partner'}</span> — update anything
                below and save. Only you (or your Finely team) should use this link.
              </p>
            </div>

            <div className={`${finelyOsCatalogCard('violet')} !p-5 grid sm:grid-cols-2 gap-4`}>
              <div className="sm:col-span-2">
                <label className={FINELY_OS_ENTITY_LABEL}>Full legal name</label>
                <input
                  value={draft.fullName}
                  onChange={(e) => setDraft((d) => ({ ...d, fullName: e.target.value }))}
                  className={FINELY_OS_ENTITY_INPUT}
                  autoComplete="name"
                />
              </div>
              <div>
                <label className={FINELY_OS_ENTITY_LABEL}>Email</label>
                <input
                  value={draft.email}
                  onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                  className={FINELY_OS_ENTITY_INPUT}
                  type="email"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className={FINELY_OS_ENTITY_LABEL}>Mobile phone</label>
                <input
                  value={draft.phone}
                  onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                  className={FINELY_OS_ENTITY_INPUT}
                  type="tel"
                  autoComplete="tel"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={FINELY_OS_ENTITY_LABEL}>Mailing address line 1</label>
                <input
                  value={draft.address1}
                  onChange={(e) => setDraft((d) => ({ ...d, address1: e.target.value }))}
                  className={FINELY_OS_ENTITY_INPUT}
                  autoComplete="address-line1"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={FINELY_OS_ENTITY_LABEL}>Address line 2 (optional)</label>
                <input
                  value={draft.address2}
                  onChange={(e) => setDraft((d) => ({ ...d, address2: e.target.value }))}
                  className={FINELY_OS_ENTITY_INPUT}
                  autoComplete="address-line2"
                />
              </div>
              <div>
                <label className={FINELY_OS_ENTITY_LABEL}>City</label>
                <input
                  value={draft.city}
                  onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
                  className={FINELY_OS_ENTITY_INPUT}
                  autoComplete="address-level2"
                />
              </div>
              <div>
                <label className={FINELY_OS_ENTITY_LABEL}>State</label>
                <input
                  value={draft.state}
                  onChange={(e) => setDraft((d) => ({ ...d, state: e.target.value }))}
                  className={FINELY_OS_ENTITY_INPUT}
                  autoComplete="address-level1"
                />
              </div>
              <div>
                <label className={FINELY_OS_ENTITY_LABEL}>ZIP / postal code</label>
                <input
                  value={draft.postalCode}
                  onChange={(e) => setDraft((d) => ({ ...d, postalCode: e.target.value }))}
                  className={FINELY_OS_ENTITY_INPUT}
                  autoComplete="postal-code"
                />
              </div>
            </div>

            <div className={`${finelyOsCatalogCard('sky')} !p-5 space-y-3`}>
              <div className="inline-flex items-center gap-2 text-sky-300">
                <FileUp size={18} />
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Credit report (optional)</span>
              </div>
              <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                Upload a recent bureau report (HTML or PDF) now if you have one — or skip and upload later in your portal.
              </p>
              <ReportUploader partnerId={partner.id} uploadedBy="partner" onCreated={() => undefined} />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button type="button" disabled={saving} onClick={save} className={FINELY_OS_SUCCESS_BTN}>
                {saving ? 'Saving…' : 'Save my information'} <ArrowRight size={14} />
              </button>
              <button type="button" onClick={() => navigate('/')} className={FINELY_OS_BACK_LINK}>
                <ArrowLeft size={16} /> Back to site
              </button>
            </div>
          </div>
        ) : invite ? (
          <div className={FINELY_OS_ENTITY_BODY}>Loading your profile…</div>
        ) : null}

        <MarketingStaffChatStrip
          roleId="support_specialist"
          goal="personal"
          roleLabel="partner success specialist"
          subline="Questions about this intake form or what to upload?"
          buttonTone="secondary"
        />

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
