import React, { useMemo } from 'react';
import { CheckCircle2, Clock3, Mail, ShieldCheck, UserCheck, UserPlus } from 'lucide-react';
import type { Partner } from '../../domain/partners';
import {
  buildAuthActivityTimeline,
  derivePartnerSignupStatus,
  formatAuthWhen,
  readPartnerAuthActivity,
  resolvePartnerAccessState,
} from '../../lib/partnerAuthActivity';
import {
  fcAdminAccentStatusChip,
  fcAdminCard,
  fcAdminOnSolidBody,
  fcAdminOnSolidInnerTile,
  fcAdminOnSolidSublabel,
  fcAdminOnSolidValue,
  fcAdminSignupPanelTone,
  type FcAdminTone,
} from '../../features/os/finelyOsAdminSurface';

type Props = {
  partner: Partner;
};

function stageIcon(stage: ReturnType<typeof derivePartnerSignupStatus>['stage']) {
  if (stage === 'active') return CheckCircle2;
  if (stage === 'signup_complete') return UserCheck;
  if (stage === 'awaiting_confirmation') return Mail;
  if (stage === 'invite_sent') return Clock3;
  return UserPlus;
}

function statusChipTone(
  stage: ReturnType<typeof derivePartnerSignupStatus>['stage'],
  panelTone: FcAdminTone,
): 'emerald' | 'gold' | 'sky' | 'violet' | 'rose' {
  if (panelTone === 'gold') return 'gold';
  if (panelTone === 'rose') return 'rose';
  if (panelTone === 'sky') return 'sky';
  return 'emerald';
}

export function PartnerSignupActivityPanel({ partner }: Props) {
  const access = useMemo(() => resolvePartnerAccessState(partner), [partner]);
  const status = useMemo(() => derivePartnerSignupStatus(partner), [partner]);
  const activity = useMemo(() => readPartnerAuthActivity(partner), [partner]);
  const timeline = useMemo(() => buildAuthActivityTimeline(partner), [partner]);
  const StageIcon = stageIcon(status.stage);
  const panelTone = fcAdminSignupPanelTone(status.stage);

  const SUBLABEL = fcAdminOnSolidSublabel(panelTone);
  const BODY = fcAdminOnSolidBody(panelTone);
  const VALUE = fcAdminOnSolidValue(panelTone);
  const INNER = fcAdminOnSolidInnerTile('p-4', panelTone);
  const chipTone = statusChipTone(status.stage, panelTone);

  const checkpoints = [
    { label: 'Invite sent', done: Boolean(activity.inviteSentAt), at: activity.inviteSentAt },
    { label: 'Signed up', done: Boolean(activity.signupCompletedAt), at: activity.signupCompletedAt },
    { label: 'Email confirmed', done: Boolean(activity.emailConfirmedAt), at: activity.emailConfirmedAt },
    { label: 'Password set', done: Boolean(activity.passwordSetAt), at: activity.passwordSetAt },
    { label: 'Profile linked', done: Boolean(partner.claimedUserId), at: partner.claimedAt || activity.accountClaimedAt },
    { label: 'Signed in', done: Boolean(activity.lastLoginAt), at: activity.lastLoginAt },
  ];

  return (
    <div className={`${fcAdminCard('p-4 sm:p-5', panelTone, 'solid')} space-y-4 sm:space-y-5`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <p className={SUBLABEL}>Signup & access activity</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <div className={fcAdminAccentStatusChip(chipTone)}>
              <StageIcon size={16} aria-hidden="true" />
              <span>{status.label}</span>
            </div>
            <p className={`text-sm ${BODY}`}>{status.detail}</p>
          </div>
        </div>
        <div className={`${INNER} w-full min-w-0 sm:min-w-[220px] lg:max-w-xs shrink-0`}>
          <div className={`flex items-center gap-2 ${SUBLABEL}`}>
            <ShieldCheck size={14} aria-hidden="true" />
            Quick read
          </div>
          <p className={`mt-2 text-sm ${BODY}`}>
            Last sign-in: <span className={VALUE}>{formatAuthWhen(activity.lastLoginAt)}</span>
          </p>
          <p className={`mt-1 text-sm ${BODY}`}>
            Password set: <span className={VALUE}>{formatAuthWhen(activity.passwordSetAt)}</span>
          </p>
          <p className={`mt-1 text-sm ${BODY}`}>
            Live access: <span className={VALUE}>{access.label}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        {checkpoints.map((step) => (
          <div
            key={step.label}
            className={`${INNER} !p-3 ${step.done ? 'opacity-100' : 'opacity-80'}`}
          >
            <div className={SUBLABEL}>{step.label}</div>
            <div className={`mt-1 text-sm font-semibold ${VALUE}`}>{step.done ? 'Complete' : 'Pending'}</div>
            {step.at ? <div className={`mt-1 text-xs ${BODY}`}>{formatAuthWhen(step.at)}</div> : null}
          </div>
        ))}
      </div>

      {timeline.length ? (
        <div className={`${INNER} space-y-2`}>
          <div className={SUBLABEL}>Recent signup activity</div>
          {timeline.slice(0, 8).map((item) => (
            <div key={item.id} className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3 text-sm">
              <span className={VALUE}>{item.label}</span>
              <span className={`shrink-0 ${BODY}`}>{formatAuthWhen(item.at)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className={`${INNER} text-sm ${BODY}`}>
          No signup activity recorded yet. Send an invite to start tracking their setup progress here.
        </div>
      )}
    </div>
  );
}
