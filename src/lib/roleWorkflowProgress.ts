import type { Partner } from '../domain/partners';
import { BUSINESS_ROADMAP_STEPS } from '../domain/businessCredit';
import { getBusinessCreditProfile } from '../data/businessCreditRepo';
import type { RoleWorkflowId } from '../config/roleWorkflows';
import { ROLE_WORKFLOWS } from '../config/roleWorkflows';

export type RoleWorkflowProgressInput = {
  partner?: Partner | null;
  reportsCount?: number;
  evidenceCount?: number;
  lettersCount?: number;
  casesCount?: number;
  tasksCount?: number;
  projectsCount?: number;
  auOrdersCount?: number;
  /** Credit specialist saved operating model. */
  hasOperatingModel?: boolean;
  /** Customers assigned to this agent (assignedAgentId). */
  managedClientsCount?: number;
  affiliateHasReferralCode?: boolean;
  affiliateActive?: boolean;
  affiliateCampaignCount?: number;
  hasSellerProfile?: boolean;
  listingsCount?: number;
  sellerContractAccepted?: boolean;
  sellerVerified?: boolean;
};

/** Returns zero-based step indices that are complete for the given role workflow. */
export function computeRoleWorkflowProgress(
  roleId: RoleWorkflowId,
  input: RoleWorkflowProgressInput,
): Set<number> {
  const done = new Set<number>();
  const steps = ROLE_WORKFLOWS[roleId]?.steps ?? [];
  if (!steps.length) return done;

  const partner = input.partner;
  const reports = input.reportsCount ?? 0;
  const evidence = input.evidenceCount ?? 0;
  const letters = input.lettersCount ?? 0;
  const cases = input.casesCount ?? 0;
  const tasks = input.tasksCount ?? 0;
  const projects = input.projectsCount ?? 0;
  const auOrders = input.auOrdersCount ?? 0;

  if (roleId === 'client') {
    if (partner && (partner.journeyStage ?? 'intake') !== 'intake') done.add(0);
    if (reports > 0) done.add(1);
    if (cases > 0) done.add(2);
    if (letters > 0 || cases > 0) done.add(3);
    if (letters > 0) done.add(4);
    if (evidence > 0 || tasks > 0 || projects > 0) done.add(5);
    return done;
  }

  if (roleId === 'business' && partner) {
    const profile = getBusinessCreditProfile(partner.id);
    const roadmap = profile.roadmap ?? {};
    const doneCount = BUSINESS_ROADMAP_STEPS.filter((s) => roadmap[s.id]?.done).length;
    if (doneCount > 0) done.add(0);
    if (roadmap.vendor_tier1?.done) done.add(1);
    if (roadmap.funding_package?.done) done.add(2);
    if (doneCount >= 4) done.add(3);
    if (roadmap.funding_package?.done) done.add(4);
    if (roadmap.bureau_checks?.done) done.add(5);
    return done;
  }

  if (roleId === 'au_buyer') {
    if (partner) done.add(0);
    done.add(1);
    if (auOrders > 0) {
      done.add(2);
      done.add(3);
    }
    return done;
  }

  if (roleId === 'agent') {
    const managed = input.managedClientsCount ?? 0;
    const hasModel = Boolean(input.hasOperatingModel);
    if (partner && (partner.lane === 'agent' || (partner.journeyStage ?? 'intake') !== 'intake')) done.add(0);
    if (hasModel || partner) done.add(1);
    if (partner?.id) done.add(2);
    if (managed > 0) {
      done.add(3);
      done.add(4);
    }
    if (letters > 0 || cases > 0) done.add(5);
    return done;
  }

  if (roleId === 'affiliate') {
    const campaigns = input.affiliateCampaignCount ?? 0;
    if (partner || input.affiliateHasReferralCode || input.affiliateActive) done.add(0);
    if (input.affiliateHasReferralCode) done.add(1);
    if (input.affiliateActive || campaigns > 0) done.add(2);
    if (input.affiliateActive) done.add(3);
    if (partner?.id) done.add(4);
    return done;
  }

  if (roleId === 'au_seller') {
    const listings = input.listingsCount ?? 0;
    if (partner || input.hasSellerProfile) done.add(0);
    if (input.hasSellerProfile) done.add(1);
    if (listings > 0) done.add(2);
    if (input.sellerContractAccepted || listings > 0) done.add(3);
    if (partner?.denefits?.contractUrl) done.add(4);
    return done;
  }

  return done;
}

export function roleWorkflowProgressLabel(completed: number, total: number): string {
  if (total <= 0) return '';
  if (completed >= total) return 'Complete';
  return `${completed}/${total} steps`;
}

/** Sample progress for admin role preview — first half of steps marked complete. */
export function demoRoleWorkflowProgress(roleId: RoleWorkflowId): Set<number> {
  const steps = ROLE_WORKFLOWS[roleId]?.steps ?? [];
  const done = new Set<number>();
  const completeThrough = Math.max(0, Math.ceil(steps.length / 2) - 1);
  for (let i = 0; i <= completeThrough; i += 1) done.add(i);
  return done;
}
