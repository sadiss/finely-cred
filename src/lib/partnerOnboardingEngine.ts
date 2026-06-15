import type { Partner } from '../domain/partners';
import { listReportsByPartner } from '../data/reportsRepo';
import { listEvidenceByPartner } from '../data/evidenceRepo';
import { listLettersByPartner } from '../data/lettersRepo';
import { listTasksByPartner, createTask } from '../data/tasksRepo';
import { listDebtByPartner } from '../data/debtRepo';
import { emitPlatformEvent } from '../domain/platformEvents';
import { checkIdentityDocumentGate } from './documentVaultGates';

export type OnboardingStep = {
  id: string;
  label: string;
  done: boolean;
  path: string;
};

export type OnboardingProgress = {
  percent: number;
  steps: OnboardingStep[];
  lane: string;
};

function baseSteps(partner: Partner): OnboardingStep[] {
  const partnerId = partner.id;
  const reports = listReportsByPartner(partnerId);
  const evidence = listEvidenceByPartner(partnerId);
  const letters = listLettersByPartner(partnerId);
  const tasks = listTasksByPartner(partnerId);
  const openTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');

  return [
    {
      id: 'report',
      label: 'Upload credit report',
      done: reports.length > 0,
      path: '/portal/reports',
    },
    {
      id: 'identity',
      label: 'Add ID + proof of address',
      done: checkIdentityDocumentGate(evidence).ok,
      path: '/portal/documents',
    },
    {
      id: 'checklist',
      label: 'Run restoration checklist',
      done: openTasks.length < tasks.length && tasks.length > 0,
      path: '/portal/checklist',
    },
    {
      id: 'letter',
      label: 'Generate first dispute letter',
      done: letters.length > 0,
      path: '/portal/letters',
    },
    {
      id: 'mail',
      label: 'Mail a letter (track in vault)',
      done: letters.some((l) => l.status === 'mailed' || l.status === 'waiting_response'),
      path: '/portal/letters/vault',
    },
  ];
}

export function computePartnerOnboardingProgress(partner: Partner): OnboardingProgress {
  const lane = partner.lane ?? 'personal_restore';
  const steps = baseSteps(partner);

  if (lane === 'business_credit') {
    steps.push({
      id: 'business_profile',
      label: 'Complete business profile',
      done: Boolean((partner.routes as any)?.business_build?.business?.businessName),
      path: '/business/profile',
    });
  }

  if (lane === 'debt_kill') {
    steps.push({
      id: 'debt_case',
      label: 'Add a debt or summons case',
      done: listDebtByPartner(partner.id).length > 0,
      path: '/portal/debt',
    });
  }

  const doneCount = steps.filter((s) => s.done).length;
  const percent = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;

  return { percent, steps, lane };
}

/** Ensure onboarding checklist tasks exist (idempotent). */
export function ensurePartnerOnboardingTasks(partner: Partner): void {
  const { steps, percent } = computePartnerOnboardingProgress(partner);
  if (percent >= 100) return;

  const tag = 'onboarding:welcome';
  const existing = listTasksByPartner(partner.id).some(
    (t) => (t.tags ?? []).includes(tag) && t.status !== 'completed',
  );
  if (existing) return;

  const next = steps.find((s) => !s.done);
  if (!next) return;

  createTask({
    partnerId: partner.id,
    title: `Onboarding: ${next.label}`,
    kind: 'general',
    stage: 'intake',
    status: 'pending',
    notes: `Complete your partner onboarding — ${percent}% done. Next: ${next.label}.`,
    assignedTo: 'partner',
    tags: [tag, 'onboarding', `step:${next.id}`],
  });
}

/** Full onboarding journey bootstrap on signup / trial (Phase 25). */
export function bootstrapPartnerOnboardingJourney(partner: Partner): { tasksEnsured: boolean; percent: number } {
  ensurePartnerOnboardingTasks(partner);
  const { percent } = computePartnerOnboardingProgress(partner);

  emitPlatformEvent({
    type: 'automation.triggered',
    tenantId: 'finely_cred',
    partnerId: partner.id,
    payload: {
      kind: 'partner_onboarding_started',
      lane: partner.lane ?? 'personal_restore',
      percent,
    },
  });

  return { tasksEnsured: true, percent };
}
