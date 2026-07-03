export type MetaConnectedPage = {
  pageId: string;
  pageName: string;
  igBusinessId?: string;
  igUsername?: string;
};

export type MetaIntegrationStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export type MetaIntegrationConfig = {
  status: MetaIntegrationStatus;
  appId?: string;
  connectedPages: MetaConnectedPage[];
  webhookVerified?: boolean;
  lastWebhookAt?: string;
  tokenExpiresAt?: string;
  errorMessage?: string;
  /** Default image for Instagram media-container posts when no creative attached */
  defaultIgImageUrl?: string;
  /** staffId → Meta pageId for agent posting */
  staffPageAssignments?: Record<string, string>;
  /** Production site URL for OAuth redirect registration (e.g. https://finelycred.com) */
  productionSiteUrl?: string;
  /** Extra OAuth redirect URIs registered in Meta App */
  allowedRedirectUris?: string[];
};

export type MetaLeadPayload = {
  leadId: string;
  formId: string;
  pageId: string;
  createdAt: string;
  fields: Record<string, string>;
};

export type MetaThreadChannel = 'messenger' | 'instagram';

export type MetaThreadMessage = {
  id: string;
  threadId: string;
  channel: MetaThreadChannel;
  direction: 'inbound' | 'outbound';
  text: string;
  createdAt: string;
  pageId: string;
};

export const DEFAULT_META_INTEGRATION: MetaIntegrationConfig = {
  status: 'disconnected',
  connectedPages: [],
  webhookVerified: false,
};
