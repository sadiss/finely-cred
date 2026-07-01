import { CmoManagedAccount, CmoPublishAsset, CmoPublishJob } from '../../domain/cmoPhase4';
import { evaluateCmoPublishGate } from './cmoCompliancePublishGate';

function id(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export interface CmoDispatchResult {
  ok: boolean;
  mode: 'manual' | 'api_stub' | 'blocked';
  providerPostId?: string;
  providerUrl?: string;
  message: string;
  job: CmoPublishJob;
}

export function createCmoPublishJob(input: {
  asset: CmoPublishAsset;
  account: CmoManagedAccount;
  scheduledFor?: string;
  approved?: boolean;
}): CmoPublishJob {
  const now = new Date().toISOString();
  return {
    id: id('job'),
    assetId: input.asset.id,
    campaignId: input.asset.campaignId,
    accountId: input.account.id,
    platform: input.account.platform,
    scheduledFor: input.scheduledFor,
    status: input.approved ? 'approved' : 'needs_review',
    approvalRequired: true,
    retryCount: 0,
    auditTrail: [
      {
        id: id('audit'),
        at: now,
        actor: 'cmo',
        action: 'publish_job_created',
        detail: `Prepared ${input.asset.assetType} for ${input.account.label}.`,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

export function dispatchManualPublish(params: {
  job: CmoPublishJob;
  asset: CmoPublishAsset;
  account: CmoManagedAccount;
  adminApproved?: boolean;
}): CmoDispatchResult {
  const gate = evaluateCmoPublishGate({
    asset: params.asset,
    account: params.account,
    action: 'external_publish',
    adminApproved: params.adminApproved,
  });
  const now = new Date().toISOString();

  if (!gate.allowed && params.account.publishMode !== 'manual_copy_paste') {
    return {
      ok: false,
      mode: 'blocked',
      message: `Blocked: ${gate.requiredActions.concat(gate.reasons).join(' ')}`,
      job: {
        ...params.job,
        status: 'blocked',
        failureReason: gate.requiredActions.concat(gate.reasons).join(' '),
        updatedAt: now,
        auditTrail: [
          ...params.job.auditTrail,
          { id: id('audit'), at: now, actor: 'system', action: 'publish_blocked', detail: gate.requiredActions.concat(gate.reasons).join(' ') },
        ],
      },
    };
  }

  return {
    ok: true,
    mode: 'manual',
    message: 'Manual publish card is ready. Copy caption, attach media, publish from the official platform account, then mark as published.',
    job: {
      ...params.job,
      status: 'scheduled',
      updatedAt: now,
      auditTrail: [
        ...params.job.auditTrail,
        { id: id('audit'), at: now, actor: 'system', action: 'manual_publish_ready', detail: 'Prepared safe copy/paste publishing card.' },
      ],
    },
  };
}

export function dispatchOfficialApiStub(params: {
  job: CmoPublishJob;
  asset: CmoPublishAsset;
  account: CmoManagedAccount;
  adminApproved?: boolean;
}): CmoDispatchResult {
  const gate = evaluateCmoPublishGate({
    asset: params.asset,
    account: params.account,
    action: 'external_publish',
    adminApproved: params.adminApproved,
  });
  const now = new Date().toISOString();

  if (!gate.allowed) {
    return {
      ok: false,
      mode: 'blocked',
      message: `Blocked: ${gate.requiredActions.concat(gate.reasons).join(' ')}`,
      job: {
        ...params.job,
        status: 'blocked',
        failureReason: gate.requiredActions.concat(gate.reasons).join(' '),
        updatedAt: now,
        auditTrail: [
          ...params.job.auditTrail,
          { id: id('audit'), at: now, actor: 'system', action: 'api_dispatch_blocked', detail: gate.requiredActions.concat(gate.reasons).join(' ') },
        ],
      },
    };
  }

  return {
    ok: false,
    mode: 'api_stub',
    message: 'Official API dispatch is intentionally a stub until OAuth, provider approval, credentials, and per-platform tests are complete.',
    job: {
      ...params.job,
      status: 'approved',
      updatedAt: now,
      auditTrail: [
        ...params.job.auditTrail,
        { id: id('audit'), at: now, actor: 'system', action: 'api_dispatch_stub', detail: 'Ready for provider-specific implementation.' },
      ],
    },
  };
}
