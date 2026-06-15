import React, { useMemo, useState } from 'react';
import { CheckCircle2, Circle, Copy, ExternalLink } from 'lucide-react';
import {
  buildTwilioWebhookUrl,
  getPhoneProductionChecks,
  isPhoneProductionReady,
} from '../../lib/phoneProductionOps';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

export function PhoneProductionSetupPanel() {
  const checks = useMemo(() => getPhoneProductionChecks(), []);
  const webhookUrl = useMemo(() => buildTwilioWebhookUrl(), []);
  const ready = useMemo(() => isPhoneProductionReady(), [checks]);
  const [copied, setCopied] = useState(false);

  const copyWebhook = async () => {
    if (!webhookUrl) return;
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className={`${finelyOsCatalogCard(ready ? 'emerald' : 'amber')} !p-5 space-y-4`}>
      <div>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Production go-live</div>
        <p className={`${FINELY_OS_ENTITY_BODY} text-sm mt-1`}>
          {ready
            ? 'Phone Hub is configured for live Twilio inbound + outbound.'
            : 'Complete these steps before pointing your Twilio number at Finely Cred.'}
        </p>
      </div>

      {webhookUrl ? (
        <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-xs`}>Twilio webhook URL (SMS + Voice, POST)</div>
          <code className="block text-xs break-all font-mono opacity-90">{webhookUrl}</code>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => void copyWebhook()}>
              <Copy size={14} /> {copied ? 'Copied' : 'Copy URL'}
            </button>
            <a
              href="https://console.twilio.com/us1/develop/phone-numbers/manage/incoming"
              target="_blank"
              rel="noopener noreferrer"
              className={FINELY_OS_SUCCESS_BTN}
            >
              <ExternalLink size={14} /> Twilio Console
            </a>
          </div>
        </div>
      ) : (
        <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
          Configure Supabase keys in <code>.env.local</code> to generate your webhook URL.
        </p>
      )}

      <ul className="space-y-2">
        {checks.map((c) => (
          <li key={c.id} className="flex items-start gap-2 text-sm">
            {c.ok ? (
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <Circle size={16} className="shrink-0 text-amber-400 mt-0.5" />
            )}
            <div>
              <div className="font-medium">{c.label}</div>
              <div className={`${FINELY_OS_ENTITY_BODY} text-xs opacity-80`}>{c.hint}</div>
            </div>
          </li>
        ))}
      </ul>

      <p className={`${FINELY_OS_ENTITY_BODY} text-xs opacity-70`}>
        Deploy: <code>npm run deploy:functions</code> · Secrets:{' '}
        <code>supabase secrets set TWILIO_AUTH_TOKEN=…</code> · Sync inbound from Phone Hub after first test SMS.
      </p>
    </div>
  );
}
