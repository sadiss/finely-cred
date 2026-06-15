/**
 * Role-based training access — thin helpers over trainingAcademy + trainingProgressRepo.
 */

import type { PartnerLane } from '../domain/partners';
import type { AgentSpecialtyId } from '../domain/agentProgram';
import {
  getTrainingPlan,
  partnerLaneToTrainingRole,
  resolveTrainingRoles,
  type TrainingRoleId,
} from '../domain/trainingAcademy';
import { getTrainingProgress, isCoreTrainingComplete } from '../data/trainingProgressRepo';

export type TrainingAccessContext = {
  partnerId: string;
  lane?: PartnerLane;
  isAdmin?: boolean;
  isAgencyTenant?: boolean;
  specialties?: AgentSpecialtyId[];
};

export { partnerLaneToTrainingRole, resolveTrainingRoles, type TrainingRoleId };

export function getPartnerTrainingPlan(ctx: TrainingAccessContext) {
  return getTrainingPlan({
    lane: ctx.lane,
    isAdmin: ctx.isAdmin,
    isAgencyTenant: ctx.isAgencyTenant,
    specialties: ctx.specialties,
  });
}

export function getPartnerTrainingProgress(ctx: TrainingAccessContext) {
  return getTrainingProgress({
    partnerId: ctx.partnerId,
    lane: ctx.lane,
    isAdmin: ctx.isAdmin,
    isAgencyTenant: ctx.isAgencyTenant,
  });
}

/** Soft gate — recommend core before dispute mailing workflows. */
export function canAccessAdvancedDisputeWorkflows(ctx: TrainingAccessContext): boolean {
  return isCoreTrainingComplete(ctx.partnerId);
}

export function trainingAcademyPath() {
  return '/portal/training/academy';
}
