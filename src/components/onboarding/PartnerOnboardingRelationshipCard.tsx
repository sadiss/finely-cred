import React, { useMemo, useState } from 'react';
import { HandHeart, MessageCircle, Pencil, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Partner } from '../../domain/partners';
import { listPartnersLocal, upsertPartner } from '../../data/partnersRepo';
import { supportModelLabel, type PartnerSupportModel } from './PartnerSupportRelationshipStep';
import { openCommunicationHub } from '../chat/communicationHubModel';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsGlassShell,
} from '../../features/os/finelyOsLightUi';

const MODELS: PartnerSupportModel[] = [
  'solo',
  'finely_specialist',
  'transferred_company',
  'family_helper',
  'building_as_specialist',
];

export function PartnerOnboardingRelationshipCard({ partner }: { partner: Partner }) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const signals = partner.journeySignals ?? {};
  const assignedSpecialist = useMemo(() => {
    const id = partner.assignedAgentId;
    if (!id) return null;
    return listPartnersLocal().find((p) => p.id === id) ?? null;
  }, [partner.assignedAgentId, partner.id]);

  const model = (signals.supportModel as PartnerSupportModel) || '';
  const helperName = String(signals.helperName || '');
  const priorCompany = String(signals.priorCompany || '');

  const save = async (nextModel: PartnerSupportModel) => {
    await upsertPartner({
      ...partner,
      journeySignals: {
        ...signals,
        supportModel: nextModel,
        supportModelUpdatedAt: new Date().toISOString(),
      },
    });
    setEditing(false);
    window.dispatchEvent(new Event('finely:store'));
  };

  return (
    <div className={`${finelyOsGlassShell('panel', 'fuchsia')} p-4 space-y-3`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
            <Users size={14} className="text-fuchsia-300" /> How we partner with you
          </div>
          <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            {model ? supportModelLabel(model) : 'Tell us who is helping you — solo, Finely specialist, transfer, or family helper.'}
          </p>
          {helperName ? <p className={`text-xs mt-1 ${FINELY_OS_ENTITY_BODY}`}>With: {helperName}</p> : null}
          {assignedSpecialist ? (
            <p className={`text-xs mt-1 ${FINELY_OS_ENTITY_BODY}`}>
              Assigned specialist: <span className={FINELY_OS_ENTITY_VALUE}>{assignedSpecialist.profile.fullName || assignedSpecialist.profile.email}</span>
            </p>
          ) : null}
          {priorCompany ? <p className={`text-xs mt-1 ${FINELY_OS_ENTITY_BODY}`}>Transferred from: {priorCompany}</p> : null}
        </div>
        <button type="button" onClick={() => setEditing((v) => !v)} className={FINELY_OS_SECONDARY_BTN}>
          <Pencil size={12} /> {editing ? 'Close' : model ? 'Update' : 'Set up'}
        </button>
      </div>

      {editing ? (
        <div className="grid sm:grid-cols-2 gap-2">
          {MODELS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => void save(m)}
              className={`text-left rounded-xl border px-3 py-2 text-xs ${
                model === m ? 'border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-100' : 'border-white/10 text-white/55 hover:border-white/20'
              }`}
            >
              {supportModelLabel(m)}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {model === 'finely_specialist' || model === 'solo' ? (
          <button type="button" onClick={() => openCommunicationHub({ tab: 'ai', expanded: true })} className={FINELY_OS_SUCCESS_BTN}>
            <MessageCircle size={12} /> Message your specialist
          </button>
        ) : null}
        {model === 'transferred_company' ? (
          <button type="button" onClick={() => navigate('/portal/letters')} className={FINELY_OS_SECONDARY_BTN}>
            <HandHeart size={12} /> Set dispute round in Letter Studio
          </button>
        ) : null}
        {!model ? (
          <button type="button" onClick={() => setEditing(true)} className={FINELY_OS_SUCCESS_BTN}>
            Choose support model
          </button>
        ) : null}
      </div>
    </div>
  );
}
