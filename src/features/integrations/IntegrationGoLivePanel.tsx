import React, { useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, CircleOff, Copy, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { buildIntegrationGoLiveHealth } from '../../lib/integrationGoLiveHealth';
import { buildMetaOAuthRedirectUris, primaryMetaOAuthRedirectUri } from '../../lib/metaOAuthUrls';
import { loadMetaIntegrationConfig } from '../../data/metaIntegrationRepo';
import { listEmailWebhookEvents } from '../../data/commsWebhookRepo';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_SECONDARY_BTN } from '../os/finelyOsLightUi';

const STATUS_ICON = {
  ok: CheckCircle2,
  warn: AlertTriangle,
  error: AlertTriangle,
  off: CircleOff,
} as const;

const STATUS_TONE = {
  ok: 'text-emerald-300 border-emerald-500/25 bg-emerald-500/10',
  warn: 'text-amber-300 border-amber-500/25 bg-amber-500/10',
  error: 'text-rose-300 border-rose-500/25 bg-rose-500/10',
  off: 'text-white/45 border-white/10 bg-black/25',
};

type Props = {
  compact?: boolean;
};

export function IntegrationGoLivePanel({ compact = false }: Props) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState<string | null>(null);
  const items = useMemo(() => buildIntegrationGoLiveHealth(), []);
  const meta = loadMetaIntegrationConfig();
  const redirectUris = buildMetaOAuthRedirectUris(meta);
  const webhooks = listEmailWebhookEvents(compact ? 5 : 12);

  const copyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((item) => {
          const Icon = STATUS_ICON[item.status];
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => item.href && navigate(item.href)}
              className={`rounded-2xl border p-4 text-left transition hover:brightness-110 ${STATUS_TONE[item.status]}`}
            >
              <div className="flex items-center gap-2">
                <Icon size={16} />
                <span className="text-sm font-bold text-white">{item.label}</span>
              </div>
              <p className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>{item.detail}</p>
            </button>
          );
        })}
      </div>

      {!compact ? (
        <>
          <div className="rounded-2xl border border-violet-500/25 bg-violet-500/10 p-4 space-y-3">
            <div className="text-sm font-bold text-white">Meta OAuth — production redirect URIs</div>
            <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
              Register every URI below in Meta App → Facebook Login → Valid OAuth Redirect URIs. Primary:{' '}
              <code className="text-violet-200">{primaryMetaOAuthRedirectUri(meta)}</code>
            </p>
            <div className="space-y-2">
              {redirectUris.map((uri) => (
                <div key={uri} className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                  <code className="text-xs text-white/70 break-all flex-1">{uri}</code>
                  <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => void copyText(uri, uri)}>
                    <Copy size={12} /> {copied === uri ? 'Copied' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-bold text-white">Email webhook events</div>
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/integrations')}>
                Integration Hub <ExternalLink size={12} />
              </button>
            </div>
            {webhooks.length === 0 ? (
              <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                Wire Resend/SendGrid/SES to <code className="text-white/60">/functions/v1/email-webhook</code> — events appear here and in Comms Inbox correlation.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {webhooks.map((w) => (
                  <div key={w.id} className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/65">
                    {new Date(w.receivedAt).toLocaleString()} · {w.provider} · {w.eventType}
                    {w.recipient ? ` · ${w.recipient}` : ''}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
