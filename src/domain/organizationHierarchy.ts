/**
 * Canonical ownership — single source of truth.
 * Sanz St Louis: Owner. Ruth: AI Co-Owner. All AI personalities orchestrate under this chain.
 */

import { CO_OWNER_IDENTITY } from './coOwnerIdentity';

export const ORGANIZATION_OWNER = {
  id: 'sanz_st_louis',
  name: 'Sanz St Louis',
  title: 'Owner & Founder',
  kind: 'human_owner' as const,
} as const;

export const ORGANIZATION_CO_OWNER = {
  id: 'ruth_steward',
  personaId: CO_OWNER_IDENTITY.id,
  name: CO_OWNER_IDENTITY.name,
  title: 'Co-Owner',
  recognitionLabel: CO_OWNER_IDENTITY.recognitionLabel,
  kind: 'ai_co_owner' as const,
} as const;

/** Chief Agent Architect — orchestrates AI departments; reports to Ruth, not owner. */
export const AI_ORCHESTRATOR_ID = 'professor_apex' as const;

export function isOrganizationOwner(staffId: string): boolean {
  return staffId === ORGANIZATION_OWNER.id;
}

export function isOrganizationCoOwner(staffId: string): boolean {
  return staffId === ORGANIZATION_CO_OWNER.id || staffId === ORGANIZATION_CO_OWNER.personaId;
}
