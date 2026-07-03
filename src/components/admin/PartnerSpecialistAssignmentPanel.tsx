import React, { useEffect, useMemo, useState } from 'react';
import { HandHeart, UserCheck } from 'lucide-react';
import type { Partner } from '../../domain/partners';
import { adminUpsertPartner, listPartnersLocal } from '../../data/partnersRepo';
import { careerRoleForPartner } from '../../lib/partnerInviteRouting';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

function isCreditSpecialistPartner(p: Partner): boolean {
  return careerRoleForPartner(p) === 'agent' || p.lane === 'agent';
}

function isClientPartner(p: Partner): boolean {
  const role = careerRoleForPartner(p);
  return role === 'client' || (!role && p.lane !== 'agent' && p.lane !== 'affiliate' && p.lane !== 'au_tradelines');
}

export function PartnerSpecialistAssignmentPanel({
  partner,
  onUpdated,
}: {
  partner: Partner;
  onUpdated?: () => void;
}) {
  const [agentId, setAgentId] = useState(partner.assignedAgentId || '');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setAgentId(partner.assignedAgentId || '');
  }, [partner.id, partner.assignedAgentId, partner.updatedAt]);

  const specialists = useMemo(() => {
    return listPartnersLocal()
      .filter((p) => p.tenantId === partner.tenantId && isCreditSpecialistPartner(p))
      .sort((a, b) => (a.profile.fullName || '').localeCompare(b.profile.fullName || ''));
  }, [partner.tenantId]);

  const assigned = useMemo(
    () => specialists.find((s) => s.id === partner.assignedAgentId) ?? null,
    [specialists, partner.assignedAgentId],
  );

  if (!isClientPartner(partner)) return null;

  const save = async (overrideId?: string) => {
    setBusy(true);
    setErr(null);
    setNotice(null);
    const nextId = (overrideId ?? agentId).trim();
    try {
      await adminUpsertPartner({
        ...partner,
        assignedAgentId: nextId || undefined,
        journeySignals: {
          ...(partner.journeySignals ?? {}),
          assignedSpecialistAt: nextId ? new Date().toISOString() : undefined,
          supportModel: nextId
            ? partner.journeySignals?.supportModel || 'finely_specialist'
            : partner.journeySignals?.supportModel,
        },
      });
      setAgentId(nextId);
      setNotice(
        nextId
          ? `Assigned to ${specialists.find((s) => s.id === nextId)?.profile.fullName || 'specialist'}.`
          : 'Specialist assignment cleared.',
      );
      onUpdated?.();
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Could not save assignment.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${finelyOsCatalogCard('fuchsia')} !p-5 space-y-4`}>
      <div className="flex items-center gap-2">
        <HandHeart size={16} className="text-fuchsia-300" />
        <div className={FINELY_OS_ENTITY_VALUE}>Credit specialist assignment</div>
      </div>
      <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
        Link this customer to the Finely Cred specialist who owns their file. The partner sees this relationship on their dashboard and can message through the hub.
      </p>

      {assigned ? (
        <div className="rounded-xl border border-fuchsia-400/25 bg-fuchsia-500/10 px-4 py-3 text-sm text-fuchsia-100">
          <div className={`${FINELY_OS_ENTITY_SUBLABEL}`}>Currently assigned</div>
          <div className="mt-1 font-semibold">{assigned.profile.fullName || assigned.profile.email}</div>
        </div>
      ) : (
        <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>No specialist assigned — customer is self-serve until you pick one.</div>
      )}

      <label className="block space-y-2">
        <span className={FINELY_OS_ENTITY_SUBLABEL}>Assign specialist</span>
        <select
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white/85"
        >
          <option value="">— Self-serve / unassigned —</option>
          {specialists.map((s) => (
            <option key={s.id} value={s.id}>
              {s.profile.fullName || s.profile.email || s.id}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => void save()} className={FINELY_OS_PRIMARY_BTN}>
          <UserCheck size={14} /> {busy ? 'Saving…' : 'Save assignment'}
        </button>
        {agentId ? (
          <button type="button" disabled={busy} onClick={() => void save('')} className={FINELY_OS_SECONDARY_BTN}>
            Clear
          </button>
        ) : null}
      </div>

      {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}
      {err ? <div className="text-rose-300 text-sm">{err}</div> : null}
    </div>
  );
}
