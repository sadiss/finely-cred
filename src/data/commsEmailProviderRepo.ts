import type { CommsEmailProviderId, CommsEmailProviderStatus } from '../domain/commsEmailProviders';

export type CommsEmailProviderConnection = {
  id: CommsEmailProviderId;
  status: CommsEmailProviderStatus;
  connectedAt?: string;
  fromAddresses: string[];
  sharedMailbox?: string;
  calendarSync?: boolean;
  lastError?: string;
  oauthAccountEmail?: string;
};

export type CommsEmailProvidersConfig = {
  productionSiteUrl?: string;
  providers: Record<CommsEmailProviderId, CommsEmailProviderConnection>;
  disputeRoundCommsAuto: boolean;
  disputeRoundCommsLive: boolean;
  bankruptcyLaneCommsAuto: boolean;
};

const STORAGE_KEY = 'finely.commsEmailProviders.v1';

function defaultConnection(id: CommsEmailProviderId): CommsEmailProviderConnection {
  if (id === 'finely_native') {
    return {
      id,
      status: 'connected',
      fromAddresses: ['noreply@finelycred.com', 'support@finelycred.com'],
    };
  }
  return { id, status: 'disconnected', fromAddresses: [] };
}

export const DEFAULT_COMMS_EMAIL_PROVIDERS: CommsEmailProvidersConfig = {
  disputeRoundCommsAuto: true,
  disputeRoundCommsLive: false,
  bankruptcyLaneCommsAuto: true,
  providers: {
    finely_native: defaultConnection('finely_native'),
    outlook: defaultConnection('outlook'),
    gmail: defaultConnection('gmail'),
    zoho: defaultConnection('zoho'),
  },
};

export function loadCommsEmailProvidersConfig(): CommsEmailProvidersConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_COMMS_EMAIL_PROVIDERS;
    const parsed = JSON.parse(raw) as Partial<CommsEmailProvidersConfig>;
    return {
      ...DEFAULT_COMMS_EMAIL_PROVIDERS,
      ...parsed,
      providers: {
        ...DEFAULT_COMMS_EMAIL_PROVIDERS.providers,
        ...(parsed.providers ?? {}),
      },
    };
  } catch {
    return DEFAULT_COMMS_EMAIL_PROVIDERS;
  }
}

export function saveCommsEmailProvidersConfig(cfg: CommsEmailProvidersConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function updateCommsEmailProvider(
  id: CommsEmailProviderId,
  patch: Partial<CommsEmailProviderConnection>,
): CommsEmailProviderConnection {
  const cfg = loadCommsEmailProvidersConfig();
  const next: CommsEmailProviderConnection = {
    ...cfg.providers[id],
    ...patch,
    id,
  };
  cfg.providers[id] = next;
  saveCommsEmailProvidersConfig(cfg);
  return next;
}

export function connectCommsEmailProvider(id: CommsEmailProviderId, accountEmail?: string): CommsEmailProviderConnection {
  return updateCommsEmailProvider(id, {
    status: 'connected',
    connectedAt: new Date().toISOString(),
    oauthAccountEmail: accountEmail,
    lastError: undefined,
    fromAddresses: accountEmail ? [accountEmail] : [],
  });
}

export function disconnectCommsEmailProvider(id: CommsEmailProviderId): CommsEmailProviderConnection {
  if (id === 'finely_native') return loadCommsEmailProvidersConfig().providers.finely_native;
  return updateCommsEmailProvider(id, {
    status: 'disconnected',
    connectedAt: undefined,
    oauthAccountEmail: undefined,
    fromAddresses: [],
  });
}

export function isDisputeRoundCommsAutoEnabled(): boolean {
  return loadCommsEmailProvidersConfig().disputeRoundCommsAuto;
}

export function isDisputeRoundCommsLive(): boolean {
  return loadCommsEmailProvidersConfig().disputeRoundCommsLive;
}

export function isBankruptcyLaneCommsAutoEnabled(): boolean {
  return loadCommsEmailProvidersConfig().bankruptcyLaneCommsAuto;
}

export function setDisputeRoundCommsFlags(flags: { auto?: boolean; live?: boolean; bankruptcyAuto?: boolean }) {
  const c = loadCommsEmailProvidersConfig();
  saveCommsEmailProvidersConfig({
    ...c,
    disputeRoundCommsAuto: flags.auto ?? c.disputeRoundCommsAuto,
    disputeRoundCommsLive: flags.live ?? c.disputeRoundCommsLive,
    bankruptcyLaneCommsAuto: flags.bankruptcyAuto ?? c.bankruptcyLaneCommsAuto,
  });
}
