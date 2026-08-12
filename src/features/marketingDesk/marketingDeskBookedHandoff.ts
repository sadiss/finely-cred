/**
 * Board → Booked: pause cold/nurture, confirm mail, meeting invite, handoff + partner seed.
 * Dedupe-safe — moving to Booked twice does not spam handoff tasks.
 */
import {
  convertCrmRecordToPartner,
  getCrmRecord,
  getCrmRecordPackageRecommendations,
  setCrmRecordStage,
} from '../../data/crmRecordsRepo';
import { linkLeadToPartner } from '../../data/leadOpsRepo';
import { findPartnerByEmail } from '../../data/partnersRepo';
import { patchProspect, setProspectStage } from '../../data/crmProspectsRepo';
import type { CrmRecordStage } from '../../domain/crmRecords';
import { crmRecordDisplayName } from '../../domain/crmRecords';
import { createNotification } from '../../data/notificationsRepo';
import { upsertTask } from '../../data/tasksRepo';
import { sendMeetingInviteEmail } from '../../lib/meetingInviteEmailSend';
import { getPublicSiteOrigin } from '../../lib/funnelPublicLinks';
import { createMarketingTask, findOpenMarketingTask } from './marketingDeskTasks';
import {
  enrollBookedConfirmMail,
  pauseMarketingSequencesForLead,
  resolveEmailForRecord,
} from './marketingDeskMail';
import { getMarketingMailStatus } from './marketingDeskMailStatus';
import { ensureMarketingPipelineProject } from './marketingDeskProjects';

export type BookedHandoffResult = {
  ok: boolean;
  name: string;
  sequencesPaused: number;
  confirmEnrolled: boolean;
  inviteOk?: boolean;
  inviteError?: string;
  handoffTaskId?: string;
  convertTaskId?: string;
  partnerId?: string;
  projectId?: string;
  reused?: boolean;
};

function completeOpenConvertTask(recordId: string) {
  const existing = findOpenMarketingTask({
    kind: 'handoff',
    recordId,
    handoffRole: 'convert',
  });
  if (!existing) return;
  try {
    upsertTask({
      ...existing,
      status: 'completed',
      completedAt: new Date().toISOString(),
      notes: `${existing.notes || ''}\n[Auto] Partner seeded from Booked handoff.`.trim(),
    });
  } catch {
    /* non-blocking */
  }
}

/** One Convert in CRM My work task — create or refresh notes; never duplicate. */
function ensureConvertInCrmTask(recordId: string, name: string, reason: string): string {
  const existing = findOpenMarketingTask({
    kind: 'handoff',
    recordId,
    handoffRole: 'convert',
  });
  const notes = [
    reason,
    `Open CRM and convert when ready.`,
    `/admin/crm?record=${recordId}`,
  ].join('\n');
  if (existing) {
    try {
      upsertTask({
        ...existing,
        title: `Convert in CRM — ${name}`,
        notes,
        status: 'pending',
        dueAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        tags: Array.from(new Set([...(existing.tags ?? []), 'marketing-convert', 'marketing-desk'])),
        meta: {
          ...(existing.meta ?? {}),
          convertHandoff: true,
          source: 'marketing_desk',
          marketingKind: 'handoff',
          recordId,
          href: `/admin/crm?record=${recordId}`,
        },
        priority: 'high',
      });
    } catch {
      /* non-blocking */
    }
    return existing.id;
  }
  return createMarketingTask({
    kind: 'handoff',
    title: `Convert in CRM — ${name}`,
    notes,
    recordId,
    href: `/admin/crm?record=${recordId}`,
    tags: ['marketing-convert'],
    dueAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    priority: 'high',
    meta: { convertHandoff: true, recordId, href: `/admin/crm?record=${recordId}` },
    dedupe: false,
  }).id;
}

/**
 * Fuller convert when helpers exist: create/link partner + optional package project seed.
 * Falls back to one Convert in CRM task when email missing or convert fails — no duplicates.
 */
async function seedPartnerFromBooked(args: {
  recordId: string;
  name: string;
  email?: string;
  alreadyPartnerId?: string;
}): Promise<{ partnerId?: string; projectId?: string; convertTaskId?: string }> {
  if (args.alreadyPartnerId) {
    completeOpenConvertTask(args.recordId);
    return { partnerId: args.alreadyPartnerId };
  }

  const record = getCrmRecord(args.recordId);
  if (!record) return {};

  if (!args.email && !record.contact?.email) {
    return {
      convertTaskId: ensureConvertInCrmTask(
        args.recordId,
        args.name,
        'No email on file — cannot auto-seed partner.',
      ),
    };
  }

  try {
    // convertCrmRecordToPartner links existing partners and seeds package project when recommended.
    const packageId = getCrmRecordPackageRecommendations(record)[0];
    const converted = await convertCrmRecordToPartner({
      recordId: args.recordId,
      packageId,
    });
    if (converted?.partnerId) {
      completeOpenConvertTask(args.recordId);
      return { partnerId: converted.partnerId, projectId: converted.projectId };
    }
  } catch {
    /* fall through to convert task */
  }

  // Fallback: if convert returned null, try existing partner link without inventing CRM rows
  try {
    const email = (args.email || record.contact?.email || '').trim().toLowerCase();
    const existingPartner = email ? await findPartnerByEmail(email) : null;
    if (existingPartner) {
      if (record.sourceRef?.type === 'lead') {
        linkLeadToPartner(record.sourceRef.id, existingPartner.id);
      } else if (record.sourceRef?.type === 'prospect') {
        setProspectStage(record.sourceRef.id, 'converted');
        patchProspect(record.sourceRef.id, {
          tags: Array.from(new Set([...(record.tags ?? []), `partner:${existingPartner.id}`])),
        });
      }
      completeOpenConvertTask(args.recordId);
      return { partnerId: existingPartner.id };
    }
  } catch {
    /* fall through */
  }

  return {
    convertTaskId: ensureConvertInCrmTask(
      args.recordId,
      args.name,
      'Auto-seed did not finish.',
    ),
  };
}

/**
 * Call when Board stage becomes `booked` (or after Book task completes with record meta).
 */
export async function runBookedHandoff(
  recordId: string,
  opts?: { skipStageSet?: boolean },
): Promise<BookedHandoffResult> {
  ensureMarketingPipelineProject();

  const record = getCrmRecord(recordId);
  if (!record) {
    return {
      ok: false,
      name: 'Unknown',
      sequencesPaused: 0,
      confirmEnrolled: false,
    };
  }

  if (!opts?.skipStageSet && record.stage !== 'booked') {
    setCrmRecordStage(recordId, 'booked' as CrmRecordStage);
  }

  const name = crmRecordDisplayName(record);
  const { email, fullName, leadId } = resolveEmailForRecord(recordId);
  const prospectId = record.sourceRef?.type === 'prospect' ? record.sourceRef.id : undefined;

  let sequencesPaused = pauseMarketingSequencesForLead(leadId, 'booked');
  if (prospectId && prospectId !== leadId) {
    sequencesPaused += pauseMarketingSequencesForLead(prospectId, 'booked');
  }
  if (record.sourceRef?.id && record.sourceRef.id !== leadId && record.sourceRef.id !== prospectId) {
    sequencesPaused += pauseMarketingSequencesForLead(record.sourceRef.id, 'booked');
  }

  const seed = await seedPartnerFromBooked({
    recordId,
    name,
    email,
    alreadyPartnerId: record.partnerId,
  });

  const existingHandoff = findOpenMarketingTask({
    kind: 'handoff',
    recordId,
    leadId,
    prospectId,
    handoffRole: 'booked',
  });

  if (existingHandoff) {
    return {
      ok: true,
      name,
      sequencesPaused,
      confirmEnrolled: false,
      handoffTaskId: existingHandoff.id,
      convertTaskId: seed.convertTaskId,
      partnerId: seed.partnerId,
      projectId: seed.projectId,
      reused: true,
    };
  }

  const confirm = enrollBookedConfirmMail({
    leadId,
    email,
    fullName: fullName || name,
    recordId,
  });

  let inviteOk: boolean | undefined;
  let inviteError: string | undefined;
  const mail = getMarketingMailStatus();
  if (email && mail.status === 'ready') {
    const origin = getPublicSiteOrigin();
    const invite = await sendMeetingInviteEmail({
      partnerId: seed.partnerId || record.partnerId || 'admin_growth',
      toEmail: email,
      toName: fullName || name,
      title: `Finely Cred strategy session — ${name}`,
      joinUrl: `${origin}/enlightenment-session`,
      scheduleUrl: `${origin}/enlightenment-session`,
      hostName: 'Finely Cred',
      hostRoleLabel: 'Credit Specialist',
      agenda: 'Strategy session prep — goals, report, next steps.',
    });
    inviteOk = invite.ok;
    inviteError = invite.error;
  }

  const handoff = createMarketingTask({
    kind: 'handoff',
    title: `New booked session — ${name}`,
    notes: [
      email ? `Email: ${email}` : 'Email missing — confirm contact.',
      `CRM record: /admin/crm?record=${recordId}`,
      seed.partnerId
        ? `Partner seeded: ${seed.partnerId}${seed.projectId ? ` · project ${seed.projectId}` : ''}`
        : 'Partner not seeded — use Convert task or CRM.',
      confirm.enrolled
        ? 'Booked confirm sequence enrolled.'
        : 'Confirm mail not enrolled (Needs setup or no email).',
      inviteOk === false
        ? `Invite: ${inviteError || 'failed'}`
        : inviteOk
          ? 'Meeting invite sent.'
          : 'Meeting invite skipped.',
      'Specialist: prepare session; portal access follows entitlements.',
    ].join('\n'),
    recordId,
    leadId,
    prospectId,
    href: seed.partnerId
      ? `/admin/partners/${seed.partnerId}`
      : `/admin/crm?record=${recordId}`,
    priority: 'high',
    dueAt: new Date().toISOString(),
    meta: {
      bookedHandoff: true,
      partnerId: seed.partnerId,
      projectId: seed.projectId,
    },
    // Do not dedupe against convert handoff (same kind + recordId).
    dedupe: false,
  });

  try {
    createNotification({
      partnerId: seed.partnerId || record.partnerId || 'admin_growth',
      audience: 'admin',
      kind: 'task_created',
      title: `Booked — ${name}`,
      body: seed.partnerId
        ? 'Partner seeded. Open My work or partner file.'
        : 'Marketing Desk handoff ready. Open My work or CRM.',
      href: `/admin/projects/${handoff.projectId}?task=${handoff.id}`,
      meta: { recordId, handoffTaskId: handoff.id, partnerId: seed.partnerId },
    });
  } catch {
    /* non-blocking */
  }

  return {
    ok: true,
    name,
    sequencesPaused,
    confirmEnrolled: confirm.enrolled,
    inviteOk,
    inviteError,
    handoffTaskId: handoff.id,
    convertTaskId: seed.convertTaskId,
    partnerId: seed.partnerId,
    projectId: seed.projectId,
  };
}

/** Sync helper for Board onStageChange when stage === booked. */
export function onBoardStageMaybeBooked(recordId: string, stage: string) {
  if (stage !== 'booked') return;
  void runBookedHandoff(recordId, { skipStageSet: true });
}
