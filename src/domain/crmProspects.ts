export type ProspectTarget = 'clients' | 'affiliates' | 'agents' | 'teams' | 'au_sellers' | 'b2b_partners';

export type ProspectStage =
  | 'new'
  | 'researching'
  | 'contact_ready'
  | 'outreach_sent'
  | 'replied'
  | 'booked'
  | 'converted'
  | 'disqualified';

export type ProspectSource =
  | 'lead_intel_search'
  | 'manual'
  | 'import'
  | 'referral';

export type ProspectTouchKind = 'note' | 'enriched' | 'assigned' | 'stage_change' | 'email_sent' | 'sms_sent';

export type ProspectTouch = {
  id: string;
  kind: ProspectTouchKind;
  createdAt: string; // ISO
  meta?: Record<string, any>;
};

export type ProspectNote = {
  id: string;
  createdAt: string; // ISO
  text: string;
};

export type ProspectContact = {
  name?: string;
  title?: string;
  emails: string[];
  phones: string[];
};

export type ProspectCompany = {
  name?: string;
  website?: string;
  domain?: string;
  location?: string;
  industry?: string;
  description?: string;
};

export type Prospect = {
  id: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO

  target: ProspectTarget;
  stage: ProspectStage;
  source: ProspectSource;

  score: number; // 0-100
  tags: string[];

  company: ProspectCompany;
  contact: ProspectContact;

  // Lead intel metadata
  intel?: {
    query?: string;
    position?: number | null;
    snippet?: string;
    robotsOk?: boolean;
    lastEnrichedAt?: string;
  };

  assignedTo?: { userId?: string; email?: string };
  nextAction?: { label: string; dueAt?: string };

  notes: ProspectNote[];
  touches: ProspectTouch[];
};

export function nowIso() {
  return new Date().toISOString();
}

