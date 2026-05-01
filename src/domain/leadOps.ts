export type LeadStage = 'new' | 'contacted' | 'booked' | 'converted' | 'disqualified';

export type LeadNote = {
  id: string;
  createdAt: string; // ISO
  text: string;
};

export type LeadOp = {
  leadId: string;
  stage: LeadStage;
  /** Optional tags, used for filtering/triage. */
  tags: string[];
  /** Optional: which partner this lead was converted/attached to. */
  partnerId?: string;
  notes: LeadNote[];
  updatedAt: string; // ISO
};

export function nowIso() {
  return new Date().toISOString();
}

