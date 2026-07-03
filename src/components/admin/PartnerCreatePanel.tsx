import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Mail, UserPlus, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Partner } from '../../domain/partners';
import { createPartner } from '../../data/partnersRepo';
import { upsertCustomFieldValues } from '../../data/customFieldValuesRepo';
import { ensureEnterpriseDefaultsOnce } from '../../data/seedEnterpriseDefaults';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { sendPartnerInviteEmail } from '../../lib/partnerInviteEmail';
import { sendPartnerOutreachMessage, defaultPartnerWelcomeMessage } from '../../lib/partnerMessaging';
import {
  CLIENT_SERVICE_OPTIONS,
  type ClientServiceId,
  type PartnerCareerRole,
  partnerLaneForCreate,
  partnerRouteForCreate,
  serviceLabelForPartner,
} from '../../lib/partnerInviteRouting';
import {
  EMPTY_PARTNER_CREATE_PROFILE,
  PARTNER_CREATE_FIELD_LABELS,
  partnerCreateProfileToCustomValues,
  profileFieldGroupsForService,
  type PartnerCreateProfileDraft,
} from '../../lib/partnerCreateProfileFields';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { canSimulateInviteDeliveryLocally, formatLocalInviteNotice } from '../../lib/inviteLocalDev';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_EMPTY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_ENTITY_SELECT,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
} from '../../features/os/finelyOsLightUi';

type CreateMode = 'quick' | 'full';

type Props = {
  canCreate: boolean;
  initialAffiliate?: boolean;
  onCreated?: () => void;
};

const CAREER_ROLES: Array<{ id: PartnerCareerRole; title: string; desc: string }> = [
  { id: 'client', title: 'Customer / Partner', desc: 'Credit restore, build, business credit, debt, funding, or tradelines.' },
  { id: 'agent', title: 'Credit Specialist', desc: 'Run customer files as a Finely partner.' },
  { id: 'au_seller', title: 'AU Seller', desc: 'Supply authorized-user tradeline inventory.' },
  { id: 'affiliate', title: 'Affiliate', desc: 'Refer partners and earn commissions.' },
];

function fullNameFromParts(first: string, last: string) {
  return [first.trim(), last.trim()].filter(Boolean).join(' ');
}

export function PartnerCreatePanel({ canCreate, initialAffiliate = false, onCreated }: Props) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<CreateMode>('full');
  const [step, setStep] = useState(1);
  const [careerRole, setCareerRole] = useState<PartnerCareerRole>(initialAffiliate ? 'affiliate' : 'client');
  const [clientService, setClientService] = useState<ClientServiceId>('personal_restore');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address1, setAddress1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [profileDraft, setProfileDraft] = useState<PartnerCreateProfileDraft>(EMPTY_PARTNER_CREATE_PROFILE);
  const [creating, setCreating] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [created, setCreated] = useState<{ partner: Partner; inviteUrl?: string } | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  const fullSteps = careerRole === 'client' ? 5 : 3;
  const profileGroups = useMemo(
    () => (careerRole === 'client' ? profileFieldGroupsForService(clientService) : []),
    [careerRole, clientService],
  );
  const lane = partnerLaneForCreate({ careerRole, clientService });
  const primaryRoute = partnerRouteForCreate({ careerRole, clientService });
  const servicePreview = useMemo(() => {
    if (careerRole !== 'client') {
      const fake = { lane, primaryRoute } as Partner;
      return serviceLabelForPartner(fake);
    }
    return CLIENT_SERVICE_OPTIONS.find((s) => s.id === clientService)?.label ?? 'Customer';
  }, [careerRole, clientService, lane, primaryRoute]);

  const resetForm = () => {
    setStep(1);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setAddress1('');
    setCity('');
    setState('');
    setPostalCode('');
    setProfileDraft(EMPTY_PARTNER_CREATE_PROFILE);
    setCreateErr(null);
    setNotice(null);
    setCreated(null);
  };

  const handleCreate = async (sendInviteAfter = false) => {
    const name = fullNameFromParts(firstName, lastName);
    if (!name) {
      setCreateErr('First and last name are required.');
      return;
    }
    const emailVal = email.trim();
    if (mode === 'full' && !emailVal) {
      setCreateErr('Email is required for full partner setup and invite delivery.');
      return;
    }

    setCreating(true);
    setCreateErr(null);
    setNotice(null);
    try {
      const partner = await createPartner({
        tenantId: getActiveTenantId(),
        fullName: name,
        email: emailVal || undefined,
        phone: phone.trim() || undefined,
        primaryRoute,
        lane,
        intake:
          address1 || city || state || postalCode || profileDraft.address2
            ? {
                personal: {
                  address1: address1.trim() || undefined,
                  address2: profileDraft.address2.trim() || undefined,
                  city: city.trim() || undefined,
                  state: state.trim() || undefined,
                  postalCode: postalCode.trim() || undefined,
                },
              }
            : {},
        asAdmin: true,
      });

      ensureEnterpriseDefaultsOnce({ tenantId: getActiveTenantId() });
      const customValues = partnerCreateProfileToCustomValues(profileDraft, {
        firstName,
        lastName,
        phone,
        address1,
        city,
        state,
        postalCode,
      });
      if (Object.keys(customValues).length) {
        upsertCustomFieldValues('partners', partner.id, customValues, getActiveTenantId());
      }

      try {
        sendPartnerOutreachMessage({
          partnerId: partner.id,
          partnerName: name,
          body: defaultPartnerWelcomeMessage(name),
        });
      } catch {
        // non-blocking
      }

      let inviteUrl: string | undefined;
      if (sendInviteAfter && emailVal) {
        setSendingInvite(true);
        const res = await sendPartnerInviteEmail({ partner, email: emailVal });
        if (!res.ok) throw new Error(res.error || 'Partner created but invite email failed.');
        inviteUrl = res.inviteUrl;
        if (res.simulated) {
          setNotice(formatLocalInviteNotice({ ok: true, simulated: true, inviteUrl, previewOpened: Boolean(res.previewOpened) }, emailVal));
        } else {
          setNotice(`Partner created and invite sent to ${emailVal}. They will land on ${servicePreview} after setup.`);
        }
        setSendingInvite(false);
      } else {
        setNotice(`Partner “${name}” created with ${servicePreview} lane.`);
      }

      setCreated({ partner, inviteUrl });
      onCreated?.();
    } catch (e: unknown) {
      setCreateErr((e as Error)?.message || 'Failed to create partner.');
    } finally {
      setCreating(false);
      setSendingInvite(false);
    }
  };

  if (!canCreate) {
    return (
      <div className={FINELY_OS_ENTITY_EMPTY}>
        Your role doesn’t allow creating new partners in this tenant. Ask an admin/owner to grant access.
      </div>
    );
  }

  if (created) {
    return (
      <div className={`${FINELY_OS_NOTICE_SUCCESS} space-y-3`}>
        <div className="font-semibold">Partner “{created.partner.profile.fullName}” is ready.</div>
        <div className={FINELY_OS_ENTITY_BODY}>
          Service lane: <strong>{serviceLabelForPartner(created.partner)}</strong>. Send the invite so they can set a password and enter the correct workspace — not generic signup or affiliate.
        </div>
        {created.inviteUrl ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <input readOnly value={created.inviteUrl} className={`flex-1 ${FINELY_OS_ENTITY_INPUT} font-mono text-sm`} onFocus={(e) => e.currentTarget.select()} />
            <button
              type="button"
              className={FINELY_OS_SUCCESS_BTN}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(created.inviteUrl || '');
                  setInviteCopied(true);
                  window.setTimeout(() => setInviteCopied(false), 2000);
                } catch {
                  // ignore
                }
              }}
            >
              {inviteCopied ? 'Copied!' : 'Copy invite link'}
            </button>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate(`/admin/partners/${created.partner.id}`)}>
            Open partner profile <ArrowRight size={14} />
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={resetForm}>
            Create another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { setMode('full'); setStep(1); }}
          className={mode === 'full' ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN}
        >
          <UserPlus size={14} /> Full create
        </button>
        <button
          type="button"
          onClick={() => { setMode('quick'); setStep(1); }}
          className={mode === 'quick' ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN}
        >
          <Zap size={14} /> Quick create
        </button>
      </div>

      <p className={FINELY_OS_ENTITY_BODY}>
        {mode === 'full'
          ? 'Walk through role, service lane, and profile essentials — matches signup + invite routing.'
          : 'Minimum fields to create now; finish profile details and send invite from the partner record later.'}
      </p>

      {createErr ? <div className={FINELY_OS_NOTICE_ERROR}>{createErr}</div> : null}
      {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}

      {mode === 'full' ? (
        <>
          {step === 1 ? (
            <div className="space-y-3">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Step 1 — Role</div>
              <div className="grid sm:grid-cols-2 gap-3">
                {CAREER_ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setCareerRole(r.id)}
                    className={`text-left rounded-2xl border p-4 transition ${careerRole === r.id ? 'border-violet-400/50 bg-violet-500/10' : 'border-white/10 bg-white/[0.03] hover:border-white/20'}`}
                  >
                    <div className="font-semibold text-white">{r.title}</div>
                    <div className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 2 && careerRole === 'client' ? (
            <div className="space-y-3">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Step 2 — Service lane</div>
              <div className="grid sm:grid-cols-2 gap-3">
                {CLIENT_SERVICE_OPTIONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setClientService(s.id)}
                    className={`text-left rounded-2xl border p-4 transition ${clientService === s.id ? 'border-emerald-400/50 bg-emerald-500/10' : 'border-white/10 bg-white/[0.03] hover:border-white/20'}`}
                  >
                    <div className="font-semibold text-white">{s.label}</div>
                    <div className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>Invite routes to {s.landingPath}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {((step === 2 && careerRole !== 'client') || (step === 3 && careerRole === 'client')) ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={FINELY_OS_ENTITY_LABEL}>First name</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
              </div>
              <div>
                <label className={FINELY_OS_ENTITY_LABEL}>Last name</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
              </div>
              <div>
                <label className={FINELY_OS_ENTITY_LABEL}>Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="partner@email.com" />
              </div>
              <div>
                <label className={FINELY_OS_ENTITY_LABEL}>Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="(555) 555-5555" />
              </div>
            </div>
          ) : null}

          {step === 4 && careerRole === 'client' ? (
            <div className="space-y-4">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Step 4 — Credit profile (matches partner profile tab)</div>
              {profileGroups.map((group) => (
                <div key={group.id} className={`${finelyOsCatalogCard('sky')} !p-4 space-y-3`}>
                  <div className="font-semibold text-white">{group.title}</div>
                  <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>{group.hint}</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {group.keys.map((key) => (
                      <div key={key} className={key === 'profileNotes' ? 'md:col-span-2' : ''}>
                        <label className={FINELY_OS_ENTITY_LABEL}>{PARTNER_CREATE_FIELD_LABELS[key]}</label>
                        {key === 'creditMonitorProvider' ? (
                          <select
                            value={profileDraft.creditMonitorProvider}
                            onChange={(e) => setProfileDraft((p) => ({ ...p, creditMonitorProvider: e.target.value }))}
                            className={FINELY_OS_ENTITY_SELECT}
                          >
                            <option value="">—</option>
                            {['IdentityIQ', 'MyScoreIQ', 'SmartCredit', 'Experian', 'Credit Karma', 'Other'].map((o) => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                        ) : key === 'profileNotes' ? (
                          <textarea
                            value={profileDraft.profileNotes}
                            onChange={(e) => setProfileDraft((p) => ({ ...p, profileNotes: e.target.value }))}
                            rows={3}
                            className={FINELY_OS_ENTITY_INPUT}
                          />
                        ) : (
                          <input
                            value={String(profileDraft[key] ?? '')}
                            onChange={(e) => setProfileDraft((p) => ({ ...p, [key]: e.target.value }))}
                            className={FINELY_OS_ENTITY_INPUT}
                            type={key === 'dob' ? 'date' : 'text'}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {((step === 3 && careerRole !== 'client') || (step === 5 && careerRole === 'client')) ? (
            <div className={`${finelyOsCatalogCard('sky')} !p-4 space-y-3`}>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Mailing address (optional now)</div>
              <input value={address1} onChange={(e) => setAddress1(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="Street address" />
              <input value={profileDraft.address2} onChange={(e) => setProfileDraft((p) => ({ ...p, address2: e.target.value }))} className={FINELY_OS_ENTITY_INPUT} placeholder="Apt / suite (optional)" />
              <div className="grid grid-cols-3 gap-3">
                <input value={city} onChange={(e) => setCity(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="City" />
                <input value={state} onChange={(e) => setState(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="State" />
                <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="ZIP" />
              </div>
              <div className={FINELY_OS_ENTITY_BODY}>
                Review: <strong>{servicePreview}</strong> · lane <code className="text-emerald-300">{lane}</code>
                {primaryRoute ? <> · route <code className="text-emerald-300">{primaryRoute}</code></> : null}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {step > 1 ? (
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setStep((s) => Math.max(1, s - 1))}>
                <ArrowLeft size={14} /> Back
              </button>
            ) : null}
            {step < fullSteps ? (
              <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => setStep((s) => s + 1)}>
                Continue <ArrowRight size={14} />
              </button>
            ) : (
              <>
                <button type="button" disabled={creating} className={FINELY_OS_SECONDARY_BTN} onClick={() => void handleCreate(false)}>
                  {creating ? 'Creating…' : 'Create partner'}
                </button>
                <button
                  type="button"
                  disabled={creating || sendingInvite || !email.trim() || !isFeatureEnabled('inviteDelivery')}
                  className={FINELY_OS_PRIMARY_BTN}
                  onClick={() => void handleCreate(true)}
                >
                  <Mail size={14} /> {creating || sendingInvite ? 'Working…' : 'Create & send invite'}
                </button>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            {CAREER_ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setCareerRole(r.id)}
                className={`text-left rounded-2xl border p-3 transition ${careerRole === r.id ? 'border-violet-400/50 bg-violet-500/10' : 'border-white/10 bg-white/[0.03]'}`}
              >
                <div className="font-semibold text-white text-sm">{r.title}</div>
              </button>
            ))}
          </div>
          {careerRole === 'client' ? (
            <div>
              <label className={FINELY_OS_ENTITY_LABEL}>Service lane</label>
              <select value={clientService} onChange={(e) => setClientService(e.target.value as ClientServiceId)} className={FINELY_OS_ENTITY_SELECT}>
                {CLIENT_SERVICE_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={FINELY_OS_ENTITY_LABEL}>First name</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_LABEL}>Last name</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
            </div>
            <div className="md:col-span-2">
              <label className={FINELY_OS_ENTITY_LABEL}>Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="Required to send invite" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={creating} className={FINELY_OS_SECONDARY_BTN} onClick={() => void handleCreate(false)}>
              {creating ? 'Creating…' : 'Quick create'}
            </button>
            <button
              type="button"
              disabled={creating || !email.trim()}
              className={FINELY_OS_PRIMARY_BTN}
              onClick={() => void handleCreate(true)}
            >
              <Mail size={14} /> Quick create & invite
            </button>
          </div>
          {!isFeatureEnabled('inviteDelivery') && canSimulateInviteDeliveryLocally() ? (
            <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>Local dev: invite emails open in a preview tab when Supabase is off.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
