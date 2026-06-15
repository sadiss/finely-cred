import { emitPlatformEvent, onPlatformEvent, type PlatformEvent } from '../domain/platformEvents';
import { getAgentPersona } from '../domain/agentPersonas';
import {
  getNurtureSequence,
  type NurtureSequenceDef,
  type NurtureStepDef,
} from '../domain/nurtureSequences';
import { loadJson, saveJson } from '../data/localJsonStore';
import { sendEmail } from './commsDeliveryClient';
import { isFeatureEnabled } from '../data/settingsRepo';
import { isSupabaseConfigured } from './supabaseClient';
import { buildNurtureStepEmail } from './nurtureStepCopy';

export type NurtureEnrollment = {
  id: string;
  sequenceId: string;
  leadId: string;
  tenantId: string;
  startedAt: string;
  nextStepIndex: number;
  nextRunAt: string;
  status: 'active' | 'completed' | 'cancelled';
  context: Record<string, unknown>;
  updatedAt?: string;
};

const STORE_KEY = 'finely.nurtureEnrollments.v1';

type NurtureStore = { enrollments: NurtureEnrollment[] };

function loadStore(): NurtureStore {
  return loadJson<NurtureStore>(STORE_KEY, { enrollments: [] }, 1);
}

function saveStore(store: NurtureStore, opts?: { skipSync?: boolean }) {
  saveJson(STORE_KEY, store, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
  if (!opts?.skipSync) {
    void import('../data/nurtureSupabaseSync').then((m) => m.syncAllNurtureEnrollmentsToSupabase(store.enrollments));
  }
}

export function mergeNurtureEnrollmentsFromRemote(remote: NurtureEnrollment[]) {
  const store = loadStore();
  const byId = new Map(store.enrollments.map((e) => [e.id, e]));
  for (const row of remote) {
    const local = byId.get(row.id);
    const remoteTs = Date.parse(row.updatedAt ?? row.startedAt);
    const localTs = local ? Date.parse(local.updatedAt ?? local.startedAt) : 0;
    if (!local || remoteTs >= localTs) byId.set(row.id, row);
  }
  store.enrollments = Array.from(byId.values());
  saveStore(store, { skipSync: true });
}

function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function listNurtureEnrollments(limit = 100): NurtureEnrollment[] {
  return loadStore()
    .enrollments.slice()
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, limit);
}

export function enrollLeadInNurtureSequence(args: {
  leadId: string;
  sequenceId: string;
  tenantId: string;
  context?: Record<string, unknown>;
}): NurtureEnrollment | null {
  const sequence = getNurtureSequence(args.sequenceId);
  if (!sequence?.enabled) return null;

  const store = loadStore();
  const existing = store.enrollments.find(
    (e) => e.sequenceId === args.sequenceId && e.leadId === args.leadId && e.status === 'active',
  );
  if (existing) return existing;

  const firstStep = sequence.steps[0];
  const delayMs = (firstStep?.delayHours ?? 0) * 60 * 60 * 1000;
  const nowIso = new Date().toISOString();
  const enrollment: NurtureEnrollment = {
    id: newId('nur'),
    sequenceId: args.sequenceId,
    leadId: args.leadId,
    tenantId: args.tenantId,
    startedAt: nowIso,
    nextStepIndex: 0,
    nextRunAt: new Date(Date.now() + delayMs).toISOString(),
    status: 'active',
    context: args.context ?? {},
    updatedAt: nowIso,
  };
  store.enrollments.unshift(enrollment);
  saveStore(store);
  return enrollment;
}

/** Re-enroll or refresh Meta/social leads into seq_meta_lead without duplicate welcome spam. */
export function syncLeadNurtureSequence(args: {
  leadId: string;
  sequenceId: string;
  tenantId: string;
  context?: Record<string, unknown>;
}): NurtureEnrollment | null {
  return enrollLeadInNurtureSequence(args);
}

export type NurtureDispatchResult = {
  enrollmentId: string;
  stepId: string;
  channel: NurtureStepDef['channel'];
  templateId: string;
  personaName: string;
  status: 'queued' | 'skipped' | 'sent';
  dryRun: boolean;
};

async function dispatchStep(args: {
  enrollment: NurtureEnrollment;
  step: NurtureStepDef;
  sequence: NurtureSequenceDef;
  dryRun: boolean;
}): Promise<NurtureDispatchResult> {
  const persona = args.step.personaId
    ? getAgentPersona(args.step.personaId)
    : getAgentPersona(args.sequence.agentPersonaId);
  const base: NurtureDispatchResult = {
    enrollmentId: args.enrollment.id,
    stepId: args.step.id,
    channel: args.step.channel,
    templateId: args.step.templateId,
    personaName: persona?.name ?? 'Finely Advisor',
    status: args.dryRun ? 'skipped' : 'queued',
    dryRun: args.dryRun,
  };

  if (args.dryRun || args.step.channel !== 'email') return base;

  if (
    args.step.id === 'welcome' &&
    args.enrollment.context.immediateWelcomeSent === true
  ) {
    return { ...base, status: 'skipped' };
  }

  const email = String(args.enrollment.context.email ?? '').trim();
  if (!email || !isFeatureEnabled('commsDelivery') || !isSupabaseConfigured) return base;

  try {
    const copy = buildNurtureStepEmail({
      templateId: args.step.templateId,
      sequence: args.sequence,
      context: args.enrollment.context,
      personaName: persona?.name ?? 'Finely Cred',
      stepSubject: args.step.subject,
    });
    await sendEmail({
      toEmail: email,
      subject: copy.subject,
      text: copy.text,
    });
    return { ...base, status: 'sent' };
  } catch {
    return base;
  }
}

/** Process due nurture steps — call from platform cron or admin autopilot. */
export async function processDueNurtureSteps(opts?: {
  dryRun?: boolean;
  now?: Date;
}): Promise<NurtureDispatchResult[]> {
  const now = opts?.now ?? new Date();
  const dryRun = opts?.dryRun ?? true;
  const results: NurtureDispatchResult[] = [];
  const store = loadStore();

  for (const enrollment of store.enrollments) {
    if (enrollment.status !== 'active') continue;
    if (new Date(enrollment.nextRunAt) > now) continue;

    const sequence = getNurtureSequence(enrollment.sequenceId);
    if (!sequence) {
      enrollment.status = 'cancelled';
      enrollment.updatedAt = now.toISOString();
      continue;
    }

    const step = sequence.steps[enrollment.nextStepIndex];
    if (!step) {
      enrollment.status = 'completed';
      enrollment.updatedAt = now.toISOString();
      continue;
    }

    const result = await dispatchStep({ enrollment, step, sequence, dryRun });
    results.push(result);

    if (!dryRun) {
      emitPlatformEvent({
        type: 'email.sent',
        tenantId: enrollment.tenantId,
        leadId: enrollment.leadId,
        entityType: 'nurture_step',
        entityId: step.id,
        payload: { sequenceId: sequence.id, templateId: step.templateId, channel: step.channel },
      });
    }

    enrollment.nextStepIndex += 1;
    enrollment.updatedAt = now.toISOString();
    const nextStep = sequence.steps[enrollment.nextStepIndex];
    if (!nextStep) {
      enrollment.status = 'completed';
    } else {
      enrollment.nextRunAt = new Date(now.getTime() + nextStep.delayHours * 60 * 60 * 1000).toISOString();
    }
  }

  saveStore(store);
  return results;
}

let wired = false;

export function wireNurtureEngine() {
  if (wired) return;
  wired = true;
  onPlatformEvent((event) => {
    if (event.type !== 'lead.magnet_download' || !event.leadId) return;
    const sequenceId = String(event.payload?.sequenceId ?? '');
    if (sequenceId) {
      enrollLeadInNurtureSequence({
        leadId: event.leadId,
        sequenceId,
        tenantId: event.tenantId,
        context: event.payload ?? {},
      });
    }
  });
}

wireNurtureEngine();
