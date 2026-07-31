import { EXTENDED_FREE_GUIDES } from './extendedFreeGuides';
import { CORE_PARTNER_GUIDES } from './corePartnerGuides';

export type FreeGuideId =
  | 'credit-dispute-letter-guide'
  | 'metro2-consistency-trap'
  | 'bureau-response-decoder'
  | 'collections-proof-pack'
  | 'permissible-purpose-scriptbook'
  | 'utilization-sniper-rules'
  | 'business-sequence-ladder'
  | 'ucc-article-3-primer'
  | 'strawman-myths-reality'
  | 'primary-tradeline-insider'
  | 'business-credit-jumpstart'
  | 'loan-funding-sequence'
  | 'ai-dispute-workflows'
  | 'combo-tradeline-ladder'
  | 'ucc1-business-filing-primer'
  | 'smart-application-timing'
  | 'funding-ready-underwriting-optics'
  | 'inquiry-removal-advanced'
  | 'collections-validation-deep-dive'
  | 'metro2-k-segment-field-guide'
  | 'eoscar-acdv-decoder'
  | 'dofd-reaging-audit'
  | 'fraud-alert-funding-timing'
  | 'student-loan-metro2-playbook'
  | 'bankruptcy-rebuild-sequencer'
  | 'certified-mail-evidence-system'
  | 'round-2-method-verification'
  | 'vendor-tier-matrix-free'
  | 'debt-settlement-tax-traps'
  | 'mortgage-overlay-dispute-prep'
  | 'identity-theft-block-unblock';

export type FreeGuide = {
  id: FreeGuideId;
  title: string;
  desc: string;
  /** Printable content body for PDF generation. */
  sections: {
    heading: string;
    bullets: string[];
    attachmentBlobRef?: string;
    attachmentFilename?: string;
    attachmentMimeType?: string;
  }[];
};

import { DISPUTE_GUIDE_FIVE_STEPS } from '../letters/consumerDisputeVoice';

export const FREE_GUIDES: FreeGuide[] = [
  {
    id: 'credit-dispute-letter-guide',
    title: 'Free Credit Dispute Letter Guide',
    desc: 'The complete Finely Cred edition — expanded 5-step framework, first-person letter style, FCRA rights, OCR/Metro2 survival, certified mail, validation-first doctrine, law-per-negative, affidavits, and escalation.',
    sections: [
      ...DISPUTE_GUIDE_FIVE_STEPS.map((step) => ({
        heading: step.heading,
        bullets: [step.lead, ...step.paragraphs, ...step.bullets, step.powerMove],
      })),
      {
        heading: 'Also in your PDF download',
        bullets: [
          'FCRA rights — after you pull your report and research',
          'OCR & Metro2 survival — format letters the machines can read',
          'Online dispute traps vs certified mail',
          'Letter stream workflow & round discipline',
          'CFPB / FTC / state AG escalation',
          'Validation first — challenge before you pay',
          'Law per negative type + affidavit & court response system',
          'Full example letter written in your own words',
        ],
      },
      {
        heading: 'Disclaimer',
        bullets: ['Educational only; not legal advice. Consult a licensed attorney for legal matters.'],
      },
    ],
  },
  ...CORE_PARTNER_GUIDES,
];

/** Core FREE_GUIDES wins on ID collision so enhanced partner guides ship. */
export const ALL_FREE_GUIDES: FreeGuide[] = (() => {
  const byId = new Map<string, FreeGuide>();
  for (const g of EXTENDED_FREE_GUIDES) byId.set(g.id, g);
  for (const g of FREE_GUIDES) byId.set(g.id, g);
  return [...byId.values()];
})();

export function findFreeGuideByTitle(title: string | null | undefined): FreeGuide | null {
  const t = (title || '').trim();
  if (!t) return null;
  return FREE_GUIDES.find((g) => g.title === t) ?? EXTENDED_FREE_GUIDES.find((g) => g.title === t) ?? null;
}

export function findFreeGuideById(id: string | null | undefined): FreeGuide | null {
  const key = (id || '').trim();
  if (!key) return null;
  return FREE_GUIDES.find((g) => g.id === key) ?? EXTENDED_FREE_GUIDES.find((g) => g.id === key) ?? null;
}

