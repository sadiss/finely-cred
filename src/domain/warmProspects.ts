/** Stacked/scraped partner lists — NOT site form captures or inbound leads. */

export type WarmProspectHeat = 'warm' | 'nurture' | 'hot';

export type WarmProspectSource = 'library' | 'scrape' | 'import';

export type WarmProspect = {
  id: string;
  createdAt: string;
  updatedAt: string;
  heat: WarmProspectHeat;
  source: WarmProspectSource;
  /** e.g. filename or partner vertical */
  libraryTag?: string;
  fullName: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  notes: string[];
  /** Draft outreach — manual send only */
  sequenceDraftId?: string;
  nextAction?: { label: string; dueAt?: string };
};

export function nowWarmIso() {
  return new Date().toISOString();
}
