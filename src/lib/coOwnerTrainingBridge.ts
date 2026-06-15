/**
 * Maps Ruth co-owner business roles → Training Academy paths & lesson anchors.
 */

import type { CoOwnerBusinessRole } from '../domain/coOwnerRoleMastery';

export type CoOwnerTrainingRoute = {
  roleId: CoOwnerBusinessRole;
  title: string;
  academyPath: string;
  adminOpsPath: string;
  lessonIds: string[];
  hubPath: string;
};

export const CO_OWNER_TRAINING_ROUTES: CoOwnerTrainingRoute[] = [
  {
    roleId: 'appointment_setter',
    title: 'Appointment setter',
    academyPath: '/portal/training/academy?focus=staff_setter',
    adminOpsPath: '/admin/ops-agent?tab=command',
    lessonIds: ['staff_setter_l1'],
    hubPath: '/admin/crm',
  },
  {
    roleId: 'dispute_coach',
    title: 'Dispute coach',
    academyPath: '/portal/training/academy?focus=staff_dispute',
    adminOpsPath: '/admin/ops-agent',
    lessonIds: ['staff_dispute_l1'],
    hubPath: '/portal/letters',
  },
  {
    roleId: 'credit_specialist',
    title: 'Credit specialist',
    academyPath: '/portal/training/academy?focus=agent_l1_hub',
    adminOpsPath: '/admin/ops-agent',
    lessonIds: ['agent_l1_hub', 'agent_l2_white_label'],
    hubPath: '/credit-specialist/hub',
  },
  {
    roleId: 'partner_success',
    title: 'Partner success',
    academyPath: '/portal/training/academy?focus=staff_success',
    adminOpsPath: '/admin/ops-agent',
    lessonIds: ['staff_success_l1'],
    hubPath: '/admin/partners',
  },
  {
    roleId: 'affiliate_manager',
    title: 'Affiliate manager',
    academyPath: '/portal/training/academy?focus=aff_l1_toolkit',
    adminOpsPath: '/admin/ops-agent',
    lessonIds: ['aff_l1_toolkit', 'aff_l2_denefits'],
    hubPath: '/affiliate/hub',
  },
  {
    roleId: 'agency_director',
    title: 'Agency director',
    academyPath: '/portal/training/academy?focus=agency_l1_tenant',
    adminOpsPath: '/admin/ops-agent',
    lessonIds: ['agency_l1_tenant', 'agency_l2_intake'],
    hubPath: '/admin/access',
  },
  {
    roleId: 'billing_ops',
    title: 'Billing operations',
    academyPath: '/portal/training/academy?focus=staff_billing',
    adminOpsPath: '/admin/billing',
    lessonIds: ['staff_billing_l1'],
    hubPath: '/admin/billing',
  },
  {
    roleId: 'comms_director',
    title: 'Communications director',
    academyPath: '/portal/training/academy?focus=staff_comms',
    adminOpsPath: '/admin/comms-studio',
    lessonIds: ['staff_comms_l1'],
    hubPath: '/admin/comms-studio',
  },
  {
    roleId: 'it_support',
    title: 'IT support',
    academyPath: '/portal/training/academy?focus=staff_it',
    adminOpsPath: '/admin/monitoring',
    lessonIds: ['staff_it_l1'],
    hubPath: '/admin/monitoring',
  },
  {
    roleId: 'developer',
    title: 'Platform developer',
    academyPath: '/portal/training/academy?focus=staff_dev',
    adminOpsPath: '/admin/parsing-lab',
    lessonIds: ['staff_dev_l1'],
    hubPath: '/admin/parsing-lab',
  },
  {
    roleId: 'co_ceo',
    title: 'Co-CEO operator',
    academyPath: '/portal/training/academy?focus=staff_coceo',
    adminOpsPath: '/admin/ops-agent',
    lessonIds: ['staff_coceo_l1'],
    hubPath: '/admin',
  },
  {
    roleId: 'co_owner_delegate',
    title: 'Co-owner delegate (Ruth)',
    academyPath: '/portal/training/academy?focus=admin_l3_coowner',
    adminOpsPath: '/admin/ops-agent',
    lessonIds: ['admin_l3_coowner'],
    hubPath: '/admin/ops-agent',
  },
];

export function trainingRouteForRole(roleId: CoOwnerBusinessRole): CoOwnerTrainingRoute | undefined {
  return CO_OWNER_TRAINING_ROUTES.find((r) => r.roleId === roleId);
}
