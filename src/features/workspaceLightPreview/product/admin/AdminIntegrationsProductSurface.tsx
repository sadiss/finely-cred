import React, { useMemo, useState } from 'react';
import { AlertTriangle, Copy, Key, Plus, Radio, ShieldAlert, ToggleLeft, ToggleRight, Trash2, Webhook, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminWebhooksPanel } from '../../../admin/AdminWebhooksPanel';
import { IntegrationGoLivePanel } from '../../../integrations/IntegrationGoLivePanel';
import { ProductionDeployUrlsPanel } from '../../../integrations/ProductionDeployUrlsPanel';
import { ProductionGoLiveChecklist } from '../../../integrations/ProductionGoLiveChecklist';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsInlineListItem,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import { getWebhookDeliveryLog } from '../../../../data/webhooksRepo';
import {
  createPartnerApiKey,
  listPartnerApiKeys,
  revokePartnerApiKey,
  togglePartnerApiKey,
} from '../../../../data/partnerApiKeysRepo';
import { INBOUND_INTEGRATION_EVENTS } from '../../../../lib/integrationInboundMap';
import { recordSecurityAudit } from '../../../../lib/securityAuditBridge';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import './adminIntegrationsProductSurface.css';

type ConnectorId = 'webhooks' | 'keys' | 'golive' | 'inbound';

const CONNECTORS: Array<{
  id: ConnectorId;
  label: string;
  purpose: string;
  icon: typeof Webhook;
  accent: 'violet' | 'emerald' | 'sky' | 'rose';
}> = [
  { id: 'webhooks', label: 'Webhooks', purpose: 'Outbound event delivery', icon: Webhook, accent: 'violet' },
  { id: 'keys', label: 'API keys', purpose: 'Partner credentials', icon: Key, accent: 'emerald' },
  { id: 'golive', label: 'Go-live', purpose: 'Health, URLs, checklist', icon: Zap, accent: 'sky' },
  { id: 'inbound', label: 'Inbound routes', purpose: 'Zapier and Make endpoints', icon: Radio, accent: 'rose' },
];

export default function AdminIntegrationsProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'violet';
  const [connector, setConnector] = useState<ConnectorId>('webhooks');
  const [version, setVersion] = useState(0);
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);

  const apiKeys = useMemo(() => listPartnerApiKeys(), [version]);
  const deliveryLog = useMemo(() => getWebhookDeliveryLog(20), [version]);
  const activeKeys = apiKeys.filter((k) => k.enabled).length;
  const recentFails = deliveryLog.filter((d) => !d.ok).length;

  const issueKey = () => {
    const { record, secret } = createPartnerApiKey({ label: newKeyLabel || 'Integration key' });
    recordSecurityAudit({
      action: 'api_key.created',
      actorType: 'admin',
      entityId: record.id,
      entityType: 'partner_api_key',
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

  const connectorStatus = (id: ConnectorId): { tone: 'ok' | 'warn' | 'blocked'; label: string; count?: number } => {
    switch (id) {
      case 'webhooks':
        return recentFails > 0
          ? { tone: 'warn', label: `${recentFails} failed`, count: deliveryLog.length }
          : { tone: deliveryLog.length > 0 ? 'ok' : 'warn', label: deliveryLog.length > 0 ? 'Delivering' : 'No deliveries', count: deliveryLog.length };
      case 'keys':
        return activeKeys > 0
          ? { tone: 'ok', label: `${activeKeys} active`, count: apiKeys.length }
          : { tone: 'warn', label: 'None issued', count: apiKeys.length };
      case 'golive':
        return { tone: 'ok', label: 'Review checklist', count: 3 };
      case 'inbound':
        return { tone: 'ok', label: 'Routes live', count: INBOUND_INTEGRATION_EVENTS.length };
      default:
        return { tone: 'warn', label: '—' };
    }
  };

  const activeConnector = CONNECTORS.find((c) => c.id === connector) ?? CONNECTORS[0]!;
  const ActiveIcon = activeConnector.icon;

  const alerts = [
    recentFails > 0
      ? { tone: 'warn' as const, title: `${recentFails} webhook failure${recentFails === 1 ? '' : 's'}`, action: () => setConnector('webhooks') }
      : null,
    apiKeys.length === 0
      ? { tone: 'warn' as const, title: 'No API keys issued', action: () => setConnector('keys') }
      : null,
    activeKeys === 0 && apiKeys.length > 0
      ? { tone: 'warn' as const, title: 'All API keys disabled', action: () => setConnector('keys') }
      : null,
  ].filter(Boolean) as Array<{ tone: 'ok' | 'warn'; title: string; action: () => void }>;

  const renderInspector = () => {
    if (connector === 'webhooks') {
      return (
        <div className="space-y-6">
          <AdminWebhooksPanel />
          <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-4`} data-fc-accent="emerald">
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
              <Webhook size={16} /> Recent deliveries
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
          </div>
        </div>
      );
    }

    if (connector === 'keys') {
      return (
        <div className="space-y-6">
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
              <div className={`text-sm ${FINELY_OS_ENTITY_SUBLABEL}`}>Copy now — this secret will not be shown again</div>
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
                    <div className={`font-mono text-xs ${FINELY_OS_ENTITY_BODY}`}>
                      {k.keyPrefix}… · {k.scopes.join(', ')}
                    </div>
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
                      {k.enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
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
        </div>
      );
    }

    if (connector === 'golive') {
      return (
        <div className="space-y-6">
          <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-4`} data-fc-accent="sky">
            <h3 className="text-2xl font-extrabold">Integration health</h3>
            <p className={FINELY_OS_ENTITY_BODY}>Supabase, comms delivery, email webhooks, and staff sync.</p>
            <IntegrationGoLivePanel />
          </div>
          <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-4`} data-fc-accent="violet">
            <h3 className="text-2xl font-extrabold">Production deploy URLs</h3>
            <p className={FINELY_OS_ENTITY_BODY}>Copy live webhook and OAuth callbacks into Resend, SendGrid, Azure, or Google.</p>
            <ProductionDeployUrlsPanel />
          </div>
          <div className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8 space-y-4`} data-fc-accent="rose">
            <h3 className="text-2xl font-extrabold">Production checklist</h3>
            <p className={FINELY_OS_ENTITY_BODY}>Wire webhooks and turn on live comms when you are ready.</p>
            <ProductionGoLiveChecklist />
          </div>
        </div>
      );
    }

    return (
      <FinelyOsPaginatedStack
        items={INBOUND_INTEGRATION_EVENTS}
        pageSize={5}
        emptyMessage="No inbound routes configured."
        renderItem={(ev) => (
          <div key={ev.id} className={`${finelyOsInlineListItem()} px-4 py-3`}>
            <div className={FINELY_OS_ENTITY_VALUE}>{ev.label}</div>
            <div className={`font-mono text-xs ${FINELY_OS_ENTITY_BODY}`}>
              {ev.method} {ev.path}
            </div>
            <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>{ev.description}</p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-black/[0.04] p-2 text-xs">{JSON.stringify(ev.samplePayload, null, 2)}</pre>
          </div>
        )}
      />
    );
  };

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Platform"
      title="Integrations"
      description="Connected services control room — webhooks, API keys, and go-live readiness."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'light'}
      archetype={archetype}
      icon={navItem?.icon}
      primaryAction={<ProductPagePrimaryAction label="Issue API key" onClick={() => setConnector('keys')} />}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/settings')}>
          System settings
        </button>
      }
      metrics={[
        { label: 'API keys', value: String(apiKeys.length), hint: 'Issued credentials', accent: 'emerald', onClick: () => setConnector('keys') },
        { label: 'Active keys', value: String(activeKeys), hint: 'Currently enabled', accent: 'violet', onClick: () => setConnector('keys') },
        { label: 'Deliveries', value: String(deliveryLog.length), hint: 'Recent webhook log', accent: 'sky', onClick: () => setConnector('webhooks') },
        { label: 'Inbound routes', value: String(INBOUND_INTEGRATION_EVENTS.length), hint: 'Zapier and Make', accent: 'rose', onClick: () => setConnector('inbound') },
      ]}
      metricTitle="Connected services"
      metricDescription="Status grid on the left — inspector opens in the center, alerts on the right."
    >
      <section className="fc-admin-integrations-control" data-surface-layout="control-room">
        <div className={`${finelyOsCatalogCard('violet')} p-5 lg:p-6`} data-fc-accent="violet">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className={FINELY_OS_ENTITY_SUBLABEL}>Control room pulse</p>
              <p className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                {recentFails > 0
                  ? `${recentFails} webhook failure${recentFails === 1 ? '' : 's'} — check the alert rail.`
                  : `${activeKeys} active key${activeKeys === 1 ? '' : 's'} · ${INBOUND_INTEGRATION_EVENTS.length} inbound routes live.`}
              </p>
            </div>
            <span className={finelyOsStatusChip(recentFails > 0 ? 'warn' : activeKeys > 0 ? 'ok' : 'warn')}>
              {recentFails > 0 ? 'Delivery issues' : activeKeys > 0 ? 'Connected' : 'Setup needed'}
            </span>
          </div>
        </div>

        <div className="fc-admin-integrations-layout">
          <aside className="fc-admin-integrations-grid">
            <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Service grid</h2>
            <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Pick a connector to open its inspector.</p>
            {CONNECTORS.map((tile) => {
              const Icon = tile.icon;
              const selected = connector === tile.id;
              const status = connectorStatus(tile.id);
              return (
                <button
                  key={tile.id}
                  type="button"
                  data-selected={selected ? 'true' : undefined}
                  className={`fc-admin-integrations-tile fc-wlp-control-room-family ${finelyOsCatalogCard(tile.accent)}`}
                  data-fc-accent={tile.accent}
                  onClick={() => setConnector(tile.id)}
                >
                  <div className="fc-admin-integrations-tile-head">
                    <Icon size={20} className="shrink-0 opacity-90" />
                    <span className={finelyOsStatusChip(status.tone)}>{status.label}</span>
                  </div>
                  <div className={`text-base font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{tile.label}</div>
                  <p className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{tile.purpose}</p>
                  {status.count !== undefined ? (
                    <div className="fc-admin-integrations-tile-value">{status.count}</div>
                  ) : null}
                </button>
              );
            })}
          </aside>

          <div className="fc-admin-integrations-inspector">
            <div className="fc-admin-integrations-inspector-bed">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <ActiveIcon size={22} />
                <div>
                  <p className={FINELY_OS_ENTITY_SUBLABEL}>Inspector</p>
                  <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{activeConnector.label}</h2>
                  <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{activeConnector.purpose}</p>
                </div>
              </div>
              {renderInspector()}
            </div>
          </div>

          <aside className="fc-admin-integrations-alert-rail">
            <div className={`${finelyOsCatalogCard('rose')} p-5 lg:p-6 space-y-4`} data-fc-accent="rose">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} />
                <h3 className="text-lg font-extrabold">Alert rail</h3>
              </div>
              {alerts.length === 0 ? (
                <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>All connectors look healthy.</p>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <button
                      key={alert.title}
                      type="button"
                      onClick={alert.action}
                      className={`fc-admin-integrations-alert-item w-full text-left ${finelyOsCatalogCard('sky')}`}
                      data-fc-accent="sky"
                    >
                      <span className={finelyOsStatusChip(alert.tone)}>{alert.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={`${finelyOsCatalogCard('emerald')} p-5 lg:p-6 space-y-3`} data-fc-accent="emerald">
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <ShieldAlert size={16} /> Recent activity
              </div>
              {deliveryLog.length === 0 ? (
                <p className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>No webhook deliveries yet.</p>
              ) : (
                deliveryLog.slice(0, 4).map((d) => (
                  <div key={d.id} className={`text-xs font-mono ${FINELY_OS_ENTITY_BODY}`}>
                    {d.eventType} · {d.ok ? 'ok' : 'fail'}
                  </div>
                ))
              )}
              {deliveryLog.length > 4 ? (
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setConnector('webhooks')}>
                  View all deliveries
                </button>
              ) : null}
            </div>
          </aside>
        </div>
      </section>

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
