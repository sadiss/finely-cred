import React, { useMemo, useState } from 'react';
import { ArrowLeft, Key, Webhook, ArrowDownToLine, Copy, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { AdminWebhooksPanel } from '../../features/admin/AdminWebhooksPanel';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { INBOUND_INTEGRATION_EVENTS } from '../../lib/integrationInboundMap';
import { getWebhookDeliveryLog } from '../../data/webhooksRepo';
import {
  createPartnerApiKey,
  listPartnerApiKeys,
  revokePartnerApiKey,
  togglePartnerApiKey,
} from '../../data/partnerApiKeysRepo';
import { recordSecurityAudit } from '../../lib/securityAuditBridge';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_BACK_LINK,
  finelyOsCatalogCard,
  finelyOsInlineListItem,
} from '../../features/os/finelyOsLightUi';

export default function AdminIntegrationHubPage() {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);

  const apiKeys = useMemo(() => listPartnerApiKeys(), [version]);
  const deliveryLog = useMemo(() => getWebhookDeliveryLog(20), [version]);

  const issueKey = () => {
    const { record, secret } = createPartnerApiKey({ label: newKeyLabel || 'Integration key' });
    recordSecurityAudit({
      action: 'api_key.created',
      actorType: 'admin',
      entityType: 'partner_api_key',
      entityId: record.id,
      meta: { label: record.label, prefix: record.keyPrefix },
    });
    setRevealedSecret(secret);
    setNewKeyLabel('');
    setVersion((v) => v + 1);
  };

  const copySecret = async () => {
    if (!revealedSecret) return;
    try {
      await navigator.clipboard.writeText(revealedSecret);
    } catch {
      // ignore
    }
  };

  return (
    <PageShell
      badge="Platform"
      title="Integration Hub"
      subtitle="Outbound webhooks, inbound Zapier/Make routes, and partner API keys."
      back={{ to: '/admin', label: 'Back to admin' }}
    >
      <div className={`${finelyOsCatalogCard('violet')} !p-6 space-y-8 max-w-6xl`} data-fc-accent="violet">
        <button type="button" onClick={() => navigate('/admin')} className={`${FINELY_OS_BACK_LINK} md:hidden`}>
          <ArrowLeft size={16} /> Admin
        </button>

        <AdminWebhooksPanel />

        <section className={`${finelyOsCatalogCard('sky')} !p-5 fc-surface-harmony space-y-4`} data-fc-accent="sky">
          <div>
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-cyan-700`}>
              <ArrowDownToLine size={16} />
              <span>Inbound map</span>
            </div>
            <h2 className={`text-xl ${FINELY_OS_ENTITY_VALUE}`}>Zapier / Make endpoints</h2>
            <p className={FINELY_OS_ENTITY_BODY}>POST to Supabase edge functions — configure secrets in Control Center.</p>
          </div>
          <FinelyOsPaginatedStack
            items={INBOUND_INTEGRATION_EVENTS}
            pageSize={5}
            emptyMessage="No inbound routes configured."
            renderItem={(ev) => (
              <div key={ev.id} className={`${finelyOsInlineListItem()} px-4 py-3`}>
                <div className={FINELY_OS_ENTITY_VALUE}>{ev.label}</div>
                <div className={`font-mono text-xs ${FINELY_OS_ENTITY_BODY}`}>{ev.method} {ev.path}</div>
                <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>{ev.description}</p>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-black/[0.04] p-2 text-xs text-black/70">{JSON.stringify(ev.samplePayload, null, 2)}</pre>
              </div>
            )}
          />
        </section>

        <section className={`${finelyOsCatalogCard('amber')} !p-5 fc-surface-harmony space-y-4`} data-fc-accent="amber">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-amber-700`}>
                <Key size={16} />
                <span>Partner API keys</span>
              </div>
              <h2 className={`text-xl ${FINELY_OS_ENTITY_VALUE}`}>Outbound credentials</h2>
              <p className={FINELY_OS_ENTITY_BODY}>Issue keys for Nora, lead capture, and webhook receivers. Shown once at creation.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              className={FINELY_OS_ENTITY_INPUT}
              placeholder="Key label (e.g. Zapier prod)"
              value={newKeyLabel}
              onChange={(e) => setNewKeyLabel(e.target.value)}
            />
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={issueKey}>
              <Plus size={14} /> Issue key
            </button>
          </div>

          {revealedSecret ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
              <div className={`text-sm ${FINELY_OS_ENTITY_SUBLABEL} text-emerald-700`}>Copy now — secret won&apos;t be shown again</div>
              <code className={`block break-all font-mono text-sm ${FINELY_OS_ENTITY_VALUE}`}>{revealedSecret}</code>
              <button type="button" className={FINELY_OS_SUCCESS_BTN} onClick={() => void copySecret()}>
                <Copy size={14} /> Copy secret
              </button>
            </div>
          ) : null}

          {apiKeys.length === 0 ? (
            <p className={FINELY_OS_ENTITY_BODY}>No API keys issued yet.</p>
          ) : (
            <FinelyOsPaginatedStack
              items={apiKeys}
              pageSize={8}
              emptyMessage="No API keys."
              renderItem={(k) => (
                <div key={k.id} className={`${finelyOsInlineListItem()} flex flex-wrap items-center justify-between gap-3 px-4 py-3`}>
                  <div>
                    <div className={FINELY_OS_ENTITY_VALUE}>{k.label}</div>
                    <div className={`font-mono text-xs ${FINELY_OS_ENTITY_BODY}`}>{k.keyPrefix}… · {k.scopes.join(', ')}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={FINELY_OS_SECONDARY_BTN}
                      onClick={() => {
                        togglePartnerApiKey(k.id, !k.enabled);
                        recordSecurityAudit({
                          action: k.enabled ? 'api_key.disabled' : 'api_key.enabled',
                          actorType: 'admin',
                          entityType: 'partner_api_key',
                          entityId: k.id,
                        });
                        setVersion((v) => v + 1);
                      }}
                    >
                      {k.enabled ? <ToggleRight size={16} className="text-emerald-700" /> : <ToggleLeft size={16} />}
                      {k.enabled ? 'Active' : 'Disabled'}
                    </button>
                    <button
                      type="button"
                      className={FINELY_OS_SECONDARY_BTN}
                      onClick={() => {
                        revokePartnerApiKey(k.id);
                        recordSecurityAudit({
                          action: 'api_key.revoked',
                          actorType: 'admin',
                          entityType: 'partner_api_key',
                          entityId: k.id,
                        });
                        setVersion((v) => v + 1);
                      }}
                    >
                      <Trash2 size={14} /> Revoke
                    </button>
                  </div>
                </div>
              )}
            />
          )}
        </section>

        <section className={`${finelyOsCatalogCard('emerald')} !p-5 fc-surface-harmony space-y-3`} data-fc-accent="emerald">
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-700`}>
            <Webhook size={16} />
            <span>Recent deliveries</span>
          </div>
          {deliveryLog.length === 0 ? (
            <p className={FINELY_OS_ENTITY_BODY}>No webhook deliveries logged yet.</p>
          ) : (
            <FinelyOsPaginatedStack
              items={deliveryLog}
              pageSize={10}
              emptyMessage="No deliveries."
              renderItem={(d) => (
                <div key={d.id} className={`${finelyOsInlineListItem()} font-mono text-xs px-3 py-2 ${FINELY_OS_ENTITY_BODY}`}>
                  {d.at} · {d.eventType} · {d.ok ? 'ok' : 'fail'}
                </div>
              )}
            />
          )}
        </section>
      </div>
    </PageShell>
  );
}
