import React, { useMemo } from 'react';
import { listPortalStaffForLane } from '../../../../data/staffRoster';
import { staffMemberFullName, type StaffMember } from '../../../../domain/staffMember';
import { getAgentPersona } from '../../../../domain/agentPersonas';
import { StaffPortraitImg } from '../../../../components/staff/StaffPortraitImg';
import './productCareTeamStrip.css';

/**
 * The people assigned to a partner, with their real headshots.
 *
 * Uses the same roster and the same portrait resolver as the live dashboard rather than a
 * preview-local list, so a roster change shows up here without anyone remembering to update the
 * preview. The roster is app data, not partner data, so it is safe to show in demo mode — which
 * matters, because demo is the mode this workspace is reviewed in, and a care team that only
 * appears with live data reads as a missing feature.
 */
export function ProductCareTeamStrip({
  lane,
  members,
  label = 'Your care team',
  limit = 3,
  accent = 'violet',
  onMessage,
}: {
  lane?: string;
  /** Explicit roster. Omit to look up the partner's assigned staff for `lane`. */
  members?: StaffMember[];
  label?: string;
  limit?: number;
  accent?: string;
  onMessage?: (staffId: string, staffName: string) => void;
}) {
  const roster = useMemo(
    () => (members ?? listPortalStaffForLane(lane)).slice(0, limit),
    [lane, limit, members],
  );
  if (!roster.length) return null;

  const message = (staffId: string, staffName: string) => {
    if (onMessage) {
      onMessage(staffId, staffName);
      return;
    }
    window.dispatchEvent(
      new CustomEvent('finely:staff-direct-message', { detail: { staffId, staffName } }),
    );
  };

  return (
    <>
      <div className="fc-wlp-eyebrow">{label}</div>
      <div className="fc-wlp-comms-team-strip">
        {roster.map((member) => {
          const persona = getAgentPersona(member.primaryRoleId);
          const name = staffMemberFullName(member);
          return (
            <div key={member.id} className="fc-wlp-comms-team-card fcm-glow-ring" data-fcm-accent={accent}>
              <StaffPortraitImg staff={member} className="fc-wlp-comms-team-avatar" alt={name} />
              <span className="fc-wlp-comms-team-copy">
                <span className="fc-wlp-comms-team-name">{name}</span>
                <span className="fc-wlp-comms-team-role">{persona?.displayTitle ?? 'Credit Specialist'}</span>
              </span>
              <button
                type="button"
                className="fc-wlp-comms-team-msg-btn"
                onClick={() => message(member.id, name)}
              >
                Message
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
