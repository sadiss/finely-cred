import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Copy, ExternalLink, Mail, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { COMMS_EMAIL_PROVIDERS, providerBadgeTone, type CommsEmailProviderId } from '../../domain/commsEmailProviders';
import {
  connectCommsEmailProvider,
  disconnectCommsEmailProvider,
  isBankruptcyLaneCommsAutoEnabled,
  isDisputeRoundCommsAutoEnabled,
  isDisputeRoundCommsLive,
  loadCommsEmailProvidersConfig,
  saveCommsEmailProvidersConfig,
  setDisputeRoundCommsFlags,
} from '../../data/commsEmailProviderRepo';
import {
  buildCommsEmailOAuthRedirectUris,
  commsOAuthAuthorizeUrl,
  primaryCommsOAuthRedirectUri,
} from '../../lib/commsEmailOAuthUrls';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_INPUT, FINELY_OS_PRIMARY_BTN, FINELY_OS_SECONDARY_BTN } from '../os/finelyOsLightUi';
import { StudioSection } from './StudioKpiCards';

export function CommsEmailProviderPanel() {
  const [searchParams] = useSearchParams();
  const [version, setVersion] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const cfg = useMemo(() => loadCommsEmailProvidersConfig(), [version]);
  const redirectUris = useMemo(() => buildCommsEmailOAuthRedirectUris(cfg), [cfg]);

  useEffect(() => {
    const oauth = searchParams.get('oauth') as CommsEmailProviderId | null;
    const code = searchParams.get('code');
    const connected = searchParams.get('connected');
    if (oauth && oauth !== 'finely_native' && (code || connected === '1')) {
      connectCommsEmailProvider(oauth, code ? `connected@${oauth}.finelycred.com` : `oauth@${oauth}.finelycred.com`);
      setVersion((v) => v + 1);
    }
  }, [searchParams]);

  const copyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const startOAuth = (id: Exclude<CommsEmailProviderId, 'finely_native'>) => {
    const url = commsOAuthAuthorizeUrl(id);
    if (url.startsWith('http')) window.open(url, '_blank', 'noopener,noreferrer');
    else connectCommsEmailProvider(id, `demo@${id}.finelycred.com`);
    setVersion((v) => v + 1);
  };

  return (
    <StudioSection eyebrow="email providers" title="Outlook · Gmail · Zoho · Finely native">
      <p className={`${FINELY_OS_ENTITY_BODY} text-sm mb-4 max-w-3xl`}>
        Enterprise send-as, shared mailboxes, and calendar bridges. Register redirect URIs in each provider console, then connect OAuth.
        Dispute round + bankruptcy lane comms use these providers when live delivery is enabled.
      </p>

      <div className="rounded-2xl border border-white/10 bg-black/25 p-4 mb-4 space-y-3">
        <div className="text-[10px] uppercase tracking-widest text-white/40">Lane comms automation</div>
        <div className="flex flex-wrap gap-4 items-center">
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={isDisputeRoundCommsAutoEnabled()}
              onChange={(e) => {
                setDisputeRoundCommsFlags({ auto: e.target.checked });
                setVersion((v) => v + 1);
              }}
            />
            Dispute — auto-send on mailed / response
          </label>
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={isBankruptcyLaneCommsAutoEnabled()}
              onChange={(e) => {
                setDisputeRoundCommsFlags({ bankruptcyAuto: e.target.checked });
                setVersion((v) => v + 1);
              }}
            />
            Bankruptcy — auto-send on path selected
          </label>
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={isDisputeRoundCommsLive()}
              onChange={(e) => {
                setDisputeRoundCommsFlags({ live: e.target.checked });
                setVersion((v) => v + 1);
              }}
            />
            Live delivery (off = dry-run log only)
          </label>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {COMMS_EMAIL_PROVIDERS.map((p) => {
          const conn = cfg.providers[p.id];
          const isConnected = conn.status === 'connected';
          return (
            <div key={p.id} className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-black/40 p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-white">{p.label}</div>
                  <div className="text-xs text-white/45 mt-1">{p.connectionMode.toUpperCase()}</div>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${providerBadgeTone(p.id)}`}>
                  {conn.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">{p.description}</p>
              {conn.oauthAccountEmail ? (
                <div className="text-xs text-emerald-300">{conn.oauthAccountEmail}</div>
              ) : null}
              {p.id === 'finely_native' ? (
                <div className="inline-flex items-center gap-2 text-emerald-300 text-sm">
                  <CheckCircle2 size={14} /> Default delivery active
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => startOAuth(p.id as 'outlook' | 'gmail' | 'zoho')}>
                    <Mail size={14} /> {isConnected ? 'Reconnect' : 'Connect OAuth'}
                  </button>
                  {isConnected ? (
                    <button
                      type="button"
                      className={FINELY_OS_SECONDARY_BTN}
                      onClick={() => {
                        disconnectCommsEmailProvider(p.id);
                        setVersion((v) => v + 1);
                      }}
                    >
                      Disconnect
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-3">
        <div className="text-[10px] uppercase tracking-widest text-violet-300">OAuth redirect URIs — register in provider console</div>
        <label className="block">
          <div className="text-[10px] uppercase tracking-widest text-white/40">Production site URL</div>
          <input
            value={cfg.productionSiteUrl ?? ''}
            onChange={(e) => {
              saveCommsEmailProvidersConfig({ ...cfg, productionSiteUrl: e.target.value });
              setVersion((v) => v + 1);
            }}
            className={`${FINELY_OS_ENTITY_INPUT} mt-2 w-full`}
            placeholder="https://finelycred.com"
          />
        </label>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {redirectUris.map((uri) => (
            <div key={uri} className="flex items-center justify-between gap-2 rounded-lg border border-white/8 bg-black/20 px-3 py-2 text-xs text-white/60">
              <span className="truncate">{uri}</span>
              <button type="button" className="shrink-0 text-violet-300" onClick={() => void copyText(uri, uri)}>
                <Copy size={12} /> {copied === uri ? '✓' : ''}
              </button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-white/45">
          {(['outlook', 'gmail', 'zoho'] as const).map((p) => (
            <button
              key={p}
              type="button"
              className="inline-flex items-center gap-1 text-violet-300"
              onClick={() => void copyText(primaryCommsOAuthRedirectUri(p, cfg), p)}
            >
              <ExternalLink size={12} /> {p} primary redirect
            </button>
          ))}
        </div>
      </div>
    </StudioSection>
  );
}
