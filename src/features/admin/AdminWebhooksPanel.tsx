import React, { useMemo, useState } from 'react';
import { Webhook, Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  createWebhookEndpoint,
  listAllWebhookEndpoints,
  upsertWebhookEndpoint,
  type WebhookEndpoint,
} from '../../data/webhooksRepo';
import { recordSecurityAudit } from '../../lib/securityAuditBridge';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_GLASS_CATALOG,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../os/finelyOsLightUi';

export function AdminWebhooksPanel() {
  const [version, setVersion] = useState(0);
  const endpoints = useMemo(() => listAllWebhookEndpoints(), [version]);

  const toggle = (ep: WebhookEndpoint) => {
    upsertWebhookEndpoint({ ...ep, enabled: !ep.enabled });
    recordSecurityAudit({
      action: ep.enabled ? 'webhook.disabled' : 'webhook.enabled',
      actorType: 'admin',
      entityType: 'webhook',
      entityId: ep.id,
      meta: { label: ep.label, url: ep.url },
    });
    setVersion((v) => v + 1);
  };

  const addDevEndpoint = () => {
    createWebhookEndpoint({
      label: 'Dev console sink',
      url: 'https://localhost/dev-webhook-sink',
      events: ['lead.created', 'purchase.completed'],
      enabled: true,
    });
    recordSecurityAudit({
      action: 'webhook.created',
      actorType: 'admin',
      entityType: 'webhook',
      meta: { label: 'Dev console sink' },
    });
    setVersion((v) => v + 1);
  };

  return (
    <div className={`${FINELY_OS_GLASS_CATALOG} space-y-4`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>
            <Webhook size={16} />
            <span>Integration Hub</span>
          </div>
          <h3 className={FINELY_OS_ENTITY_TITLE}>Outbound Webhooks</h3>
          <p className={FINELY_OS_ENTITY_BODY}>
            Platform events dispatch to registered endpoints. Production POST runs via edge function.
          </p>
        </div>
        <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={addDevEndpoint}>
          <Plus size={14} /> Add endpoint
        </button>
      </div>

      {endpoints.length === 0 ? (
        <p className={FINELY_OS_ENTITY_BODY}>No webhook endpoints configured.</p>
      ) : (
        <ul className="space-y-3">
          {endpoints.map((ep) => (
            <li key={ep.id} className="flex flex-wrap items-center justify-between gap-3 fc-light-glass-panel fc-light-chrome-panel rounded-xl px-4 py-3">
              <div className="min-w-0">
                <div className="font-semibold text-white/90">{ep.label}</div>
                <div className={`truncate font-mono text-xs ${FINELY_OS_ENTITY_BODY}`}>{ep.url}</div>
                <div className={`mt-1 text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>{ep.events.join(', ')}</div>
              </div>
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => toggle(ep)} title={ep.enabled ? 'Disable' : 'Enable'}>
                {ep.enabled ? <ToggleRight size={18} className="text-emerald-400" /> : <ToggleLeft size={18} className="text-white/40" />}
                {ep.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </li>
          ))}
        </ul>
      )}

      <label className={FINELY_OS_ENTITY_SUBLABEL}>Quick test URL (local only)</label>
      <input className={FINELY_OS_ENTITY_INPUT} readOnly value="Events logged to console in DEV mode" />
    </div>
  );
}
