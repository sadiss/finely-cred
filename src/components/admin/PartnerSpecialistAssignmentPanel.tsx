import React, { useEffect, useMemo, useState } from 'react';
import { HandHeart, UserCheck } from 'lucide-react';
import type { Partner } from '../../domain/partners';
import { listPartnersLocal } from '../../data/partnersRepo';
import {
  CARE_TEAM_ROLE_LABEL,
  careMemberForRole,
  isClientPartner,
  listEligibleHelpers,
  resolveHelperPartner,
  saveCareTeamRole,
  type CareTeamRole,
} from '../../lib/partnerCareTeam';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

const ROLES: CareTeamRole[] = ['specialist', 'coach', 'affiliate'];

export function PartnerSpecialistAssignmentPanel({
  partner,
  onUpdated,
}: {
  partner: Partner;
  onUpdated?: () => void;
}) {
  const [draftByRole, setDraftByRole] = useState<Record<CareTeamRole, string>>({
    specialist: '',
    coach: '',
    affiliate: '',
  });
  const [busyRole, setBusyRole] = useState<CareTeamRole | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const tenantPartners = useMemo(
    () => listPartnersLocal().filter((p) => p.tenantId === partner.tenantId),
    [partner.tenantId, partner.updatedAt],
  );

  useEffect(() => {
    setDraftByRole({
      specialist: careMemberForRole(partner, 'specialist')?.partnerId || partner.assignedAgentId || '',
      coach: careMemberForRole(partner, 'coach')?.partnerId || '',
      affiliate: careMemberForRole(partner, 'affiliate')?.partnerId || '',
    });
  }, [partner.id, partner.assignedAgentId, partner.updatedAt, partner.journeySignals]);

  if (!isClientPartner(partner)) return null;

  const saveRole = async (role: CareTeamRole, overrideId?: string) => {
    setBusyRole(role);
    setErr(null);
    setNotice(null);
    const nextId = (overrideId ?? draftByRole[role]).trim();
    try {
      await saveCareTeamRole({
        partner,
        role,
        helperPartnerId: nextId || null,
      });
      setDraftByRole((prev) => ({ ...prev, [role]: nextId }));
      const helper = resolveHelperPartner(nextId, tenantPartners);
      setNotice(
        nextId
          ? `${CARE_TEAM_ROLE_LABEL[role]} → ${helper?.profile.fullName || helper?.profile.email || 'assigned'}.`
          : `${CARE_TEAM_ROLE_LABEL[role]} cleared.`,
      );
      onUpdated?.();
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Could not save assignment.');
    } finally {
      setBusyRole(null);
    }
  };

  return (
    <div className={`${finelyOsCatalogCard('fuchsia')} !p-5 space-y-5`}>
      <div className="flex items-center gap-2">
        <HandHeart size={16} className="text-fuchsia-300" />
        <div className={FINELY_OS_ENTITY_VALUE}>Care team assignment</div>
      </div>
      <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
        Assign the humans who help this customer. Only people with the matching role access appear in each list
        (Credit Specialist, Coach capability, or Business partner / affiliate).
      </p>

      {ROLES.map((role) => {
        const helpers = listEligibleHelpers({ tenantId: partner.tenantId, role, partners: tenantPartners });
        const currentId = careMemberForRole(partner, role)?.partnerId || (role === 'specialist' ? partner.assignedAgentId : undefined);
        const current = resolveHelperPartner(currentId, tenantPartners);
        const draft = draftByRole[role] || '';
        const busy = busyRole === role;

        return (
          <div key={role} className="rounded-xl border border-white/10 bg-black/25 p-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>{CARE_TEAM_ROLE_LABEL[role]}</div>
                {current ? (
                  <div className="mt-1 text-sm font-semibold text-fuchsia-100">
                    {current.profile.fullName || current.profile.email}
                  </div>
                ) : (
                  <div className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>Unassigned</div>
                )}
              </div>
              {helpers.length === 0 ? (
                <div className="text-[11px] text-amber-200/80">No eligible people — grant role access first.</div>
              ) : null}
            </div>

            <label className="block space-y-2">
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Assign {CARE_TEAM_ROLE_LABEL[role].toLowerCase()}</span>
              <select
                value={draft}
                onChange={(e) => setDraftByRole((prev) => ({ ...prev, [role]: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white/85"
              >
                <option value="">— Unassigned —</option>
                {helpers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.profile.fullName || s.profile.email || s.id}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => void saveRole(role)} className={FINELY_OS_PRIMARY_BTN}>
                <UserCheck size={14} /> {busy ? 'Saving…' : 'Save'}
              </button>
              {draft ? (
                <button type="button" disabled={busy} onClick={() => void saveRole(role, '')} className={FINELY_OS_SECONDARY_BTN}>
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        );
      })}

      {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}
      {err ? <div className="text-rose-300 text-sm">{err}</div> : null}
    </div>
  );
}
