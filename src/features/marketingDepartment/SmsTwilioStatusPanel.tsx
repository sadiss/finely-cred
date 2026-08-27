import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { getCommsSettings } from '../../data/settingsRepo';
import { getPhoneProductionChecks, buildTwilioWebhookUrl } from '../../lib/phoneProductionOps';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

/**
 * SMS / Twilio wiring status — clearly labeled so you know what to connect.
 * Default: commsDelivery OFF = dry-run (no carrier cost). Email is $0 via SMTP/SendGrid when configured.
 */
export function SmsTwilioStatusPanel() {
  const navigate = useNavigate();
  const commsOn = isFeatureEnabled('commsDelivery');
  const comms = getCommsSettings();
  const checks = useMemo(() => getPhoneProductionChecks(), []);
  const webhook = buildTwilioWebhookUrl();
  const fromPhone = (comms.twilioFromPhone ?? '').trim();

  return (
    <div className={finelyOsCatalogCardCompact('sky')}>
      <p className={FINELY_OS_ENTITY_SUBLABEL}>SMS &amp; Twilio (optional — costs per text)</p>
      <p className="mt-1 text-sm font-semibold text-white">
        {commsOn ? 'Live SMS enabled' : 'Dry-run mode — no SMS sent ( $0 )'}
      </p>
      <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
        <strong className="text-white/90">Email</strong> is your $0 outreach channel when SMTP/SendGrid is set up.
        <strong className="text-white/90"> SMS</strong> requires Twilio (paid per message). Nothing sends until you flip
        Comms Delivery on and add Twilio secrets.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className={commsOn ? finelyOsStatusChip('ok') : finelyOsStatusChip('warn')}>
          commsDelivery: {commsOn ? 'ON' : 'OFF'}
        </span>
        <span className={fromPhone ? finelyOsStatusChip('ok') : FINELY_OS_ENTITY_CHIP}>
          Twilio from: {fromPhone || 'not set'}
        </span>
        <span className={webhook ? finelyOsStatusChip('ok') : FINELY_OS_ENTITY_CHIP}>
          Webhook: {webhook ? 'ready' : 'needs Supabase URL'}
        </span>
      </div>

      <ul className={`mt-3 space-y-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
        {checks.map((c) => (
          <li key={c.id}>
            {c.ok ? '✓' : '○'} {c.label}
          </li>
        ))}
      </ul>

      {webhook ? (
        <p className={`mt-2 text-[10px] text-white/50 break-all`}>Twilio webhook URL: {webhook}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/settings')}>
          Settings → Comms &amp; Twilio
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/phone-hub')}>
          Phone Hub
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/comms?room=sequences')}>
          Email sequences ($0)
        </button>
      </div>
    </div>
  );
}
