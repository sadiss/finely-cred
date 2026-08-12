import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Circle } from 'lucide-react';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsDeckTile,
  finelyOsMicroStat,
  finelyOsStatusChip,
} from '../../os/finelyOsLightUi';
import { FinelyOsAlertBanner } from '../../os/FinelyOsAlertBanner';
import {
  getMarketingMailStatus,
  isMarketingMailPaused,
  setMarketingMailPaused,
} from '../marketingDeskMailStatus';
import { listMarketingMailSequenceChips } from '../marketingDeskMail';
import { isColdOutboundAutopilotEnabled } from '../../growthAgents/calebAutoFind';

export function MailAutopilotRoom() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const mail = useMemo(() => {
    void tick;
    return getMarketingMailStatus();
  }, [tick]);
  const paused = useMemo(() => {
    void tick;
    return isMarketingMailPaused();
  }, [tick]);
  const coldAutopilot = useMemo(() => {
    void tick;
    return isColdOutboundAutopilotEnabled();
  }, [tick]);
  const sequenceChips = useMemo(() => {
    void tick;
    return listMarketingMailSequenceChips();
  }, [tick]);

  const chip = mail.status === 'ready' ? 'ok' : mail.status === 'paused' ? 'warn' : 'blocked';

  return (
    <div className="space-y-3">
      <div className="sticky top-0 z-10 rounded-2xl border border-sky-400/25 bg-black/70 backdrop-blur-md !p-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Mail on autopilot</div>
          <span className={finelyOsStatusChip(chip)}>{mail.label}</span>
          <span
            className={finelyOsMicroStat(mail.lastStopHint ? 'emerald' : 'amber')}
            title={
              mail.lastStopHint
                ? mail.lastStopHint
                : 'Pauses when provider webhook events arrive — owner wires email-webhook (SendGrid/Resend/SES). Not claimed live until events show.'
            }
          >
            {mail.lastStopHint ? 'Auto-pause active' : 'Auto-pause when webhook events arrive'}
          </span>
        </div>
        <h2 className="text-xl font-bold text-white">Sequences · not a template wall</h2>
        <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>{mail.detail}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={FINELY_OS_PRIMARY_BTN}
            onClick={() => {
              setMarketingMailPaused(!paused);
              setTick((t) => t + 1);
            }}
          >
            {paused ? 'Resume all' : 'Pause all'}
          </button>
          <button
            type="button"
            className={FINELY_OS_SECONDARY_BTN}
            onClick={() => navigate('/admin/settings?tab=features')}
          >
            Open Features
          </button>
        </div>
      </div>

      {mail.status === 'needs_setup' ? (
        <FinelyOsAlertBanner
          tone="warning"
          message="Needs setup: Comms Delivery + Supabase required for live mail. To-dos still queue so you can work."
        />
      ) : null}

      <section className={`${finelyOsDeckTile('sky')} !p-4 space-y-2`}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Ready checklist</div>
        <ul className="space-y-2">
          {mail.checklist.map((item) => {
            const ok = item.ok === true;
            const owner = item.ok === 'owner';
            return (
              <li key={item.id} className="flex items-start gap-2 text-sm">
                {ok ? (
                  <Check size={14} className="mt-0.5 shrink-0 text-emerald-300" />
                ) : (
                  <Circle
                    size={14}
                    className={`mt-0.5 shrink-0 ${owner ? 'text-amber-200/80' : 'text-rose-300/80'}`}
                  />
                )}
                <div className="min-w-0">
                  <div className="font-semibold text-white">
                    {item.label}
                    {owner ? (
                      <span className={`ml-2 text-[10px] font-normal ${FINELY_OS_ENTITY_BODY}`}>Owner</span>
                    ) : null}
                  </div>
                  <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>{item.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex flex-wrap gap-2">
        {sequenceChips.map((chip) => (
          <span key={chip.id} className={finelyOsMicroStat('sky')} title={`Sequence ${chip.sequenceId}`}>
            {chip.label} · {chip.active} active
          </span>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {mail.sequenceTiles.map((tile) => (
          <div key={tile.id} className={`${finelyOsDeckTile('sky')} !p-4`}>
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold text-white text-sm">{tile.name}</div>
              <span className={finelyOsMicroStat('sky')}>{tile.active} active</span>
            </div>
            <p className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>Autopilot sequence · enrollments only</p>
          </div>
        ))}
      </div>

      {mail.lastStopHint ? (
        <FinelyOsAlertBanner tone="info" message={mail.lastStopHint} />
      ) : null}

      <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
        Active enrollments: {mail.activeEnrollments}. Approve in Find, inbound capture, offer, and Booked enroll
        here. Unsubscribe, Clean out junk, Booked/Won, and Pause all stop mail now. Reply/bounce/complaint pause
        when the email webhook is wired (owner ops) — Hot reply to-dos then appear in My work.{' '}
        {coldAutopilot
          ? 'coldOutboundAutopilot is on — seq_cold_prospect can enroll when consent allows.'
          : 'coldOutboundAutopilot is off by default — link-first invite only until you enable it on Caleb.'}
      </p>
    </div>
  );
}
