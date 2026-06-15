import React, { useState } from 'react';
import { Facebook, Instagram, Link2, RefreshCw } from 'lucide-react';
import { FinelyOsGlassPanel } from '../os/FinelyOsGlassPanel';
import { loadMetaIntegrationConfig, saveMetaIntegrationConfig } from '../../data/metaIntegrationRepo';
import { DEFAULT_META_INTEGRATION, type MetaIntegrationConfig } from '../../domain/metaIntegration';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsInlineListItem,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

export function MetaIntegrationSettingsPanel() {
  const [cfg, setCfg] = useState<MetaIntegrationConfig>(() => loadMetaIntegrationConfig());
  const [appId, setAppId] = useState(cfg.appId ?? '');

  const persist = (next: MetaIntegrationConfig) => {
    setCfg(next);
    saveMetaIntegrationConfig(next);
  };

  const connect = () => {
    const next = { ...cfg, status: 'connecting' as const, appId: appId.trim() || undefined };
    persist(next);
    setTimeout(() => {
      persist({
        ...next,
        status: 'connected' as const,
        connectedPages: [{ pageId: 'demo_page', pageName: 'Finely Cred (demo)', igUsername: 'finelycred' }],
        webhookVerified: false,
      });
    }, 800);
  };

  return (
    <FinelyOsGlassPanel icon={Facebook} title="Meta Business" subtitle="Facebook Page, Instagram DMs, Messenger, and Lead Ads." accent="sky" iconAccent="sky">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={finelyOsStatusChip(cfg.status === 'connected' ? 'ok' : cfg.status === 'error' ? 'blocked' : 'warn')}>
          {cfg.status}
        </span>
        {cfg.webhookVerified ? (
          <span className={finelyOsStatusChip('ok')}>Webhook verified</span>
        ) : (
          <span className={finelyOsStatusChip('warn')}>Webhook pending</span>
        )}
      </div>

      <p className={`${FINELY_OS_ENTITY_BODY} mb-4`}>
        Demo mode until OAuth is deployed. Configure App ID here; live OAuth uses the `meta-oauth` edge function and `meta-webhook` for Lead Ads.
      </p>

      <label className={`block ${FINELY_OS_ENTITY_LABEL}`}>Meta App ID</label>
      <input
        value={appId}
        onChange={(e) => setAppId(e.target.value)}
        placeholder="Your Meta Developer app ID"
        className={`mt-1 mb-4 w-full max-w-md ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} placeholder:text-white/35`}
      />

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={connect} className={FINELY_OS_PRIMARY_BTN}>
          <Link2 size={14} /> Connect Page + IG (demo)
        </button>
        <button
          type="button"
          onClick={() => {
            persist(DEFAULT_META_INTEGRATION);
            setAppId('');
          }}
          className={FINELY_OS_SECONDARY_BTN}
        >
          <RefreshCw size={14} /> Disconnect
        </button>
      </div>

      {cfg.connectedPages.length ? (
        <ul className="mt-4 space-y-2 text-sm">
          {cfg.connectedPages.map((p) => (
            <li key={p.pageId} className={`${finelyOsInlineListItem()} flex items-center gap-3`}>
              <Facebook size={16} className="text-sky-400" />
              <span className={`font-medium ${FINELY_OS_ENTITY_VALUE}`}>{p.pageName}</span>
              {p.igUsername ? (
                <span className={`inline-flex items-center gap-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                  <Instagram size={12} /> @{p.igUsername}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </FinelyOsGlassPanel>
  );
}
