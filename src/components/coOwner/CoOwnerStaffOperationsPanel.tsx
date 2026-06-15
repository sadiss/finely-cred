import React, { useMemo, useState } from 'react';
import { Crown, UserPlus, TrendingUp } from 'lucide-react';
import type { AgentPersonaId } from '../../domain/agentPersonas';
import { AGENT_PERSONAS } from '../../domain/agentPersonas';
import { CO_OWNER_IDENTITY } from '../../domain/coOwnerPersona';
import { AGENT_TRAINING_PHASES } from '../../domain/agentProgram';
import { loadStaffRoster } from '../../data/staffRoster';
import {
  executeCoOwnerStaffAction,
  getCoOwnerStaffSnapshot,
  type CoOwnerStaffAction,
} from '../../lib/coOwnerStaffActions';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_ENTITY_INPUT,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

type Props = {
  onActionExecuted?: (message: string) => void;
};

export function CoOwnerStaffOperationsPanel({ onActionExecuted }: Props) {
  const [version, setVersion] = useState(0);
  const snapshot = useMemo(() => getCoOwnerStaffSnapshot(), [version]);
  const roster = useMemo(() => loadStaffRoster(), [version]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [roleId, setRoleId] = useState<AgentPersonaId>('dispute_coach');
  const [promoteStaffId, setPromoteStaffId] = useState('');
  const [promoteRoleId, setPromoteRoleId] = useState<AgentPersonaId>('finely_advisor');
  const [agentUserId, setAgentUserId] = useState('');
  const [agentPhase, setAgentPhase] = useState<(typeof AGENT_TRAINING_PHASES)[number]['id']>('guided');

  const run = (action: CoOwnerStaffAction) => {
    const res = executeCoOwnerStaffAction(action);
    setVersion((v) => v + 1);
    onActionExecuted?.(res.message);
  };

  return (
    <div className={`${finelyOsCatalogCard('amber')} !p-5 space-y-4`}>
      <div className="inline-flex items-center gap-2 text-amber-300">
        <Crown size={18} />
        <span className={FINELY_OS_ENTITY_SUBLABEL}>{CO_OWNER_IDENTITY.name} staff operations</span>
      </div>
      <p className={FINELY_OS_ENTITY_BODY}>
        Hire AI staff, promote roles, and advance credit specialist training phases — executable from co-owner command center.
      </p>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className={finelyOsStatusChip('ok')}>{snapshot.activeStaff} active staff</span>
        <span className={finelyOsStatusChip('warn')}>{snapshot.coverageGaps.length} coverage gaps</span>
      </div>

      <div className={`${finelyOsCatalogCard('violet')} !p-4 space-y-3`}>
        <div className={FINELY_OS_ENTITY_VALUE}>
          <UserPlus size={14} className="inline mr-1" /> Hire staff member
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className={FINELY_OS_ENTITY_INPUT} />
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className={FINELY_OS_ENTITY_INPUT} />
          <select value={roleId} onChange={(e) => setRoleId(e.target.value as AgentPersonaId)} className={`${FINELY_OS_ENTITY_INPUT} sm:col-span-2`}>
            {AGENT_PERSONAS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayTitle ?? p.role}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          disabled={!firstName.trim() || !lastName.trim()}
          onClick={() =>
            run({
              type: 'hire_staff',
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              primaryRoleId: roleId,
              department: 'partner_success',
              bioLine: `Hired by ${CO_OWNER_IDENTITY.name} — ${roleId}`,
            })
          }
          className={FINELY_OS_SUCCESS_BTN}
        >
          Hire via {CO_OWNER_IDENTITY.name}
        </button>
      </div>

      <div className={`${finelyOsCatalogCard('sky')} !p-4 space-y-3`}>
        <div className={FINELY_OS_ENTITY_VALUE}>
          <TrendingUp size={14} className="inline mr-1" /> Promote staff role
        </div>
        <select value={promoteStaffId} onChange={(e) => setPromoteStaffId(e.target.value)} className={FINELY_OS_ENTITY_INPUT}>
          <option value="">Select staff…</option>
          {roster.filter((s) => s.active !== false).map((s) => (
            <option key={s.id} value={s.id}>
              {s.firstName} {s.lastName}
            </option>
          ))}
        </select>
        <select value={promoteRoleId} onChange={(e) => setPromoteRoleId(e.target.value as AgentPersonaId)} className={FINELY_OS_ENTITY_INPUT}>
          {AGENT_PERSONAS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.displayTitle ?? p.role}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!promoteStaffId}
          onClick={() => run({ type: 'promote_staff', staffId: promoteStaffId, newRoleId: promoteRoleId })}
          className={FINELY_OS_PRIMARY_BTN}
        >
          Promote
        </button>
      </div>

      <div className={`${finelyOsCatalogCard('emerald')} !p-4 space-y-3`}>
        <div className={FINELY_OS_ENTITY_VALUE}>Promote credit specialist phase</div>
        <input value={agentUserId} onChange={(e) => setAgentUserId(e.target.value)} placeholder="Agent user ID (Supabase)" className={FINELY_OS_ENTITY_INPUT} />
        <select value={agentPhase} onChange={(e) => setAgentPhase(e.target.value as typeof agentPhase)} className={FINELY_OS_ENTITY_INPUT}>
          {AGENT_TRAINING_PHASES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!agentUserId.trim()}
          onClick={() => run({ type: 'promote_agent', userId: agentUserId.trim(), trainingPhase: agentPhase })}
          className={FINELY_OS_PRIMARY_BTN}
        >
          Advance specialist
        </button>
      </div>
    </div>
  );
}
