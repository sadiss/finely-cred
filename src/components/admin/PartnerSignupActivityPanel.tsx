import React, { useMemo } from 'react';
import { CheckCircle2, Clock3, Mail, ShieldCheck, UserCheck, UserPlus } from 'lucide-react';
import type { Partner } from '../../domain/partners';
import {
  buildAuthActivityTimeline,
  derivePartnerSignupStatus,
  formatAuthWhen,
  readPartnerAuthActivity,
} from '../../lib/partnerAuthActivity';
import { fcAdminCard, fcAdminOnSolidBody, fcAdminOnSolidSublabel, fcAdminOnSolidValue } from '../../features/os/finelyOsAdminSurface';

const FINELY_OS_ENTITY_SUBLABEL = fcAdminOnSolidSublabel('emerald');
const FINELY_OS_ENTITY_BODY = fcAdminOnSolidBody('emerald');
const FINELY_OS_ENTITY_VALUE = fcAdminOnSolidValue('emerald');

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

export function PartnerSignupActivityPanel({ partner }: Props) {
  const status = useMemo(() => derivePartnerSignupStatus(partner), [partner]);
  const activity = useMemo(() => readPartnerAuthActivity(partner), [partner]);
  const timeline = useMemo(() => buildAuthActivityTimeline(partner), [partner]);
  const StageIcon = stageIcon(status.stage);

  const checkpoints = [
    { label: 'Invite sent', done: Boolean(activity.inviteSentAt), at: activity.inviteSentAt },
    { label: 'Signed up', done: Boolean(activity.signupCompletedAt), at: activity.signupCompletedAt },
    { label: 'Email confirmed', done: Boolean(activity.emailConfirmedAt), at: activity.emailConfirmedAt },
    { label: 'Password set', done: Boolean(activity.passwordSetAt), at: activity.passwordSetAt },
    { label: 'Profile linked', done: Boolean(partner.claimedUserId), at: partner.claimedAt || activity.accountClaimedAt },
    { label: 'Signed in', done: Boolean(activity.lastLoginAt), at: activity.lastLoginAt },
  ];

  return (
    <div className={`${fcAdminCard('p-5', 'emerald', 'solid')} space-y-5`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Signup & access activity</p>
          <div className="flex flex-wrap items-center gap-3">
            <div
              className={
                status.stage === 'active' || status.stage === 'signup_complete'
                  ? 'inline-flex items-center gap-2.5 rounded-2xl border border-white/40 bg-white px-5 py-2.5 text-[var(--fc-admin-tone-emerald-ink)] shadow-sm'
                  : 'inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/15 px-4 py-2 text-white'
              }
            >
              <StageIcon size={status.stage === 'active' || status.stage === 'signup_complete' ? 18 : 14} />
              <span className="text-base font-black uppercase tracking-wide">{status.label}</span>
            </div>
            <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>{status.detail}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/25 bg-white/10 px-4 py-3 min-w-[220px]">
          <div className={`flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
            <ShieldCheck size={14} />
            Quick read
          </div>
          <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            Last sign-in: <span className={FINELY_OS_ENTITY_VALUE}>{formatAuthWhen(activity.lastLoginAt)}</span>
          </p>
          <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            Password set: <span className={FINELY_OS_ENTITY_VALUE}>{formatAuthWhen(activity.passwordSetAt)}</span>
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {checkpoints.map((step) => (
          <div
            key={step.label}
            className={
              'rounded-2xl border px-4 py-3 ' +
              (step.done
                ? 'border-white/40 bg-white/20'
                : 'border-white/15 bg-black/15')
            }
          >
            <div className={`text-[11px] uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>{step.label}</div>
            <div className={`mt-1 text-sm font-semibold ${step.done ? 'text-white' : FINELY_OS_ENTITY_BODY}`}>
              {step.done ? 'Complete' : 'Pending'}
            </div>
            {step.at ? <div className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>{formatAuthWhen(step.at)}</div> : null}
          </div>
        ))}
      </div>

      {timeline.length ? (
        <div className="rounded-2xl border border-white/20 bg-black/15 px-4 py-3 space-y-2">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Recent signup activity</div>
          {timeline.slice(0, 8).map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
              <span className={FINELY_OS_ENTITY_VALUE}>{item.label}</span>
              <span className={`shrink-0 ${FINELY_OS_ENTITY_BODY}`}>{formatAuthWhen(item.at)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className={`rounded-2xl border border-white/20 bg-black/15 px-4 py-3 text-sm ${FINELY_OS_ENTITY_BODY}`}>
          No signup activity recorded yet. Send an invite to start tracking their setup progress here.
        </div>
      )}
    </div>
  );
}
