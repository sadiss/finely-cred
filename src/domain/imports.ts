import type { PartnerJourneyStage, PartnerLane, PartnerRoute } from './partners';
import type { TaskItem } from './tasks';

export type LegacyLetterMeta = {
  externalId: string;
  title?: string;
  bodyHtml?: string;
  bureau?: string;
  createdAt?: string;
};

export type LegacyBusinessMeta = {
  businessName?: string;
  ein?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  naics?: string;
  profileType?: number;
};

export type LegacyPartnerExportV1 = {
  version: 1;
  exportedAt?: string;
  source?: 'laravel';
  partners: Array<{
    externalId: string;
    fullName: string;
    email?: string | null;
    phone?: string | null;
    primaryRoute?: PartnerRoute | null;
    lane?: PartnerLane | null;
    journeyStage?: PartnerJourneyStage | null;
    journeySignals?: Record<string, any> | null;
    notes?: string | null;
    legacyDocuments?: Array<{ fileName: string; uploadedAt?: string }> | null;
    legacyReports?: Array<{ fileName: string; uploadedAt?: string }> | null;
    legacyLetters?: LegacyLetterMeta[] | null;
    legacyBusiness?: LegacyBusinessMeta | null;
    tasks?: Array<
      Pick<
        TaskItem,
        'title' | 'kind' | 'stage' | 'priority' | 'status' | 'dueAt' | 'notes' | 'tags'
      >
    > | null;
  }>;
};

export type ImportBatch = {
  id: string;
  source: 'laravel';
  createdAt: string;
  filename?: string;
  partnerCount: number;
  createdPartnerIds: string[];
  errors: Array<{ externalId?: string; message: string }>;
  artifacts?: {
    evidenceCreated: number;
    reportsCreated: number;
    lettersCreated: number;
    businessProfilesUpdated: number;
  };
};

export type InviteRecord = {
  id: string;
  partnerId: string;
  token: string;
  claimUrl: string;
  createdAt: string;
  sentAt?: string;
  sentBy?: 'admin';
  channels?: {
    email?: { to?: string; status?: 'pending' | 'sent' | 'error'; lastError?: string };
    sms?: { to?: string; status?: 'pending' | 'sent' | 'error'; lastError?: string };
  };
  claimedAt?: string;
  claimedUserId?: string;
};

