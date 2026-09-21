/**
 * Specialist Academy navigation catalog.
 * Content files live under docs/specialist-academy/ (loaded at build time).
 */

export type AcademyTrackId = 'hub' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

export type AcademyItem = {
  id: string;
  track: AcademyTrackId;
  title: string;
  titleHt?: string;
  subtitle?: string;
  /** Path suffix after docs/specialist-academy/ */
  pathEn: string;
  pathHt?: string;
  minutes?: number;
};

export type AcademyGroup = {
  id: string;
  track: AcademyTrackId;
  label: string;
  labelHt?: string;
  items: AcademyItem[];
};

const p = (suffix: string) => suffix;

export const ACADEMY_GROUPS: AcademyGroup[] = [
  {
    id: 'hub',
    track: 'hub',
    label: 'Academy hub',
    labelHt: 'Sant akademi',
    items: [
      { id: 'readme', track: 'hub', title: 'Pack map & progression', pathEn: p('README.md'), minutes: 8 },
      { id: 'workflow', track: 'hub', title: 'Workflow map', pathEn: p('WORKFLOW-MAP.md'), minutes: 10 },
      { id: 'coach', track: 'hub', title: 'Meeting coach (video quiz)', pathEn: p('MEETING-COACH.md'), minutes: 12 },
      { id: 'overseer', track: 'hub', title: 'Overseer QA', pathEn: p('OVERSEER-QA.md'), minutes: 5 },
    ],
  },
  {
    id: 'tracks-abe',
    track: 'A',
    label: 'Tracks A–E (operations layers)',
    labelHt: 'Trac A–E',
    items: [
      {
        id: 'tracks-ae',
        track: 'A',
        title: 'Tracks A–E overview',
        titleHt: 'Trac A–E — apèsi',
        pathEn: p('TRACKS-A-E-OVERVIEW.md'),
        pathHt: p('lessons/ht/tracks-a-e-overview.md'),
        minutes: 15,
      },
    ],
  },
  {
    id: 'track-h-compliance',
    track: 'H',
    label: 'Track H — Compliance & consumer law',
    labelHt: 'Trac H — Konfòmite & lwa konsomatè',
    items: [
      {
        id: 'h-curriculum',
        track: 'H',
        title: 'Curriculum map (interleave with F)',
        titleHt: 'Plan etid (melanje ak F)',
        pathEn: p('TRACK-H-COMPLIANCE-CURRICULUM.md'),
        minutes: 8,
      },
      {
        id: 'h-metro2',
        track: 'H',
        title: '1. Metro 2 furnisher reporting',
        titleHt: '1. Metro 2',
        pathEn: p('lessons/compliance/en/01-metro2.md'),
        pathHt: p('lessons/compliance/ht/01-metro2.md'),
        minutes: 18,
      },
      {
        id: 'h-fcra',
        track: 'H',
        title: '2. FCRA accuracy & disputes',
        titleHt: '2. FCRA',
        pathEn: p('lessons/compliance/en/02-fcra.md'),
        pathHt: p('lessons/compliance/ht/02-fcra.md'),
        minutes: 20,
      },
      {
        id: 'h-fdcpa',
        track: 'H',
        title: '3. FDCPA collection literacy',
        titleHt: '3. FDCPA',
        pathEn: p('lessons/compliance/en/03-fdcpa.md'),
        pathHt: p('lessons/compliance/ht/03-fdcpa.md'),
        minutes: 22,
      },
      {
        id: 'h-cfpb',
        track: 'H',
        title: '4. CFPB factual complaints',
        titleHt: '4. CFPB',
        pathEn: p('lessons/compliance/en/04-cfpb.md'),
        pathHt: p('lessons/compliance/ht/04-cfpb.md'),
        minutes: 16,
      },
      {
        id: 'h-tila',
        track: 'H',
        title: '5. TILA funding literacy',
        titleHt: '5. TILA',
        pathEn: p('lessons/compliance/en/05-tila.md'),
        pathHt: p('lessons/compliance/ht/05-tila.md'),
        minutes: 14,
      },
      {
        id: 'h-respa',
        track: 'H',
        title: '6. RESPA mortgage servicing',
        titleHt: '6. RESPA',
        pathEn: p('lessons/compliance/en/06-respa.md'),
        pathHt: p('lessons/compliance/ht/06-respa.md'),
        minutes: 16,
      },
      {
        id: 'h-ucc',
        track: 'H',
        title: '7. UCC secured transactions',
        titleHt: '7. UCC',
        pathEn: p('lessons/compliance/en/07-ucc.md'),
        pathHt: p('lessons/compliance/ht/07-ucc.md'),
        minutes: 14,
      },
      {
        id: 'h-repo',
        track: 'H',
        title: '8. Repossession education',
        titleHt: '8. Repossession',
        pathEn: p('lessons/compliance/en/08-repossession.md'),
        pathHt: p('lessons/compliance/ht/08-repossession.md'),
        minutes: 18,
      },
      {
        id: 'h-foreclosure',
        track: 'H',
        title: '9. Foreclosure literacy',
        titleHt: '9. Foreclosure',
        pathEn: p('lessons/compliance/en/09-foreclosure.md'),
        pathHt: p('lessons/compliance/ht/09-foreclosure.md'),
        minutes: 18,
      },
    ],
  },
  {
    id: 'compliance-sops',
    track: 'H',
    label: 'Compliance SOPs 16–20',
    labelHt: 'SOP konfòmite 16–20',
    items: [
      { id: 'sop-16', track: 'H', title: 'SOP-16: Metro 2 factual disputes', pathEn: p('sops/SOP-16-metro2-factual-dispute.md'), minutes: 10 },
      { id: 'sop-17', track: 'H', title: 'SOP-17: FCRA investigation package', pathEn: p('sops/SOP-17-fcra-investigation-package.md'), minutes: 10 },
      { id: 'sop-18', track: 'H', title: 'SOP-18: FDCPA contact log', pathEn: p('sops/SOP-18-fdcpa-contact-documentation.md'), minutes: 10 },
      { id: 'sop-19', track: 'H', title: 'SOP-19: CFPB factual complaint', pathEn: p('sops/SOP-19-cfpb-factual-complaint.md'), minutes: 12 },
      { id: 'sop-20', track: 'H', title: 'SOP-20: Housing & auto specialty docs', pathEn: p('sops/SOP-20-housing-auto-specialty-docs.md'), minutes: 12 },
    ],
  },
  {
    id: 'compliance-cards',
    track: 'H',
    label: 'Compliance flash cards',
    labelHt: 'Kat konfòmite',
    items: [
      { id: 'c-metro2', track: 'H', title: 'Card C-METRO2-01', pathEn: p('cards/C-METRO2-01.md'), minutes: 3 },
      { id: 'c-fcra', track: 'H', title: 'Card C-FCRA-01', pathEn: p('cards/C-FCRA-01.md'), minutes: 3 },
      { id: 'c-fdcpa', track: 'H', title: 'Card C-FDCPA-01', pathEn: p('cards/C-FDCPA-01.md'), minutes: 3 },
      { id: 'c-cfpb', track: 'H', title: 'Card C-CFPB-01', pathEn: p('cards/C-CFPB-01.md'), minutes: 3 },
      { id: 'c-repo', track: 'H', title: 'Card C-REPO-01', pathEn: p('cards/C-REPO-01.md'), minutes: 3 },
      { id: 'c-foreclosure', track: 'H', title: 'Card C-FORECLOSURE-01', pathEn: p('cards/C-FORECLOSURE-01.md'), minutes: 3 },
    ],
  },
  {
    id: 'track-f-lessons',
    track: 'F',
    label: 'Track F — methodology lessons',
    labelHt: 'Trac F — metodoloji',
    items: [
      {
        id: 'f-consumer-power',
        track: 'F',
        title: 'Consumer power — how the system works',
        titleHt: 'Pouvwa konsomatè — sistèm nan',
        pathEn: p('lessons/en/00-consumer-power-system.md'),
        pathHt: p('lessons/ht/00-consumer-power-system.md'),
        minutes: 22,
      },
      {
        id: 'f-visual-walkthrough',
        track: 'F',
        title: 'Visual walkthrough — restore → mail',
        titleHt: 'Chemen vizyèl — restore → mail',
        pathEn: p('lessons/en/08-visual-product-walkthrough.md'),
        pathHt: p('lessons/ht/08-visual-product-walkthrough.md'),
        minutes: 28,
      },
      {
        id: 'f-doctrine',
        track: 'F',
        title: 'Sanz doctrine (full sequence)',
        titleHt: 'Doktrin Sanz',
        pathEn: p('lessons/en/01-sanz-doctrine.md'),
        pathHt: p('lessons/ht/01-sanz-doctrine.md'),
        minutes: 20,
      },
      {
        id: 'f-debt-validation',
        track: 'F',
        title: 'Debt-first & validation',
        titleHt: 'Dèt an premye ak validasyon',
        pathEn: p('lessons/en/02-debt-first-validation.md'),
        pathHt: p('lessons/ht/02-debt-first-validation.md'),
        minutes: 25,
      },
      {
        id: 'f-summons',
        track: 'F',
        title: 'Summons literacy',
        titleHt: 'Somasyon ak tribinal',
        pathEn: p('lessons/en/03-summons-literacy.md'),
        pathHt: p('lessons/ht/03-summons-literacy.md'),
        minutes: 20,
      },
      {
        id: 'f-rounds',
        track: 'F',
        title: 'Restore rounds (R1 vs R2)',
        titleHt: 'Round restore',
        pathEn: p('lessons/en/04-restore-rounds.md'),
        pathHt: p('lessons/ht/04-restore-rounds.md'),
        minutes: 25,
      },
      {
        id: 'f-evidence-ocr',
        track: 'F',
        title: 'Evidence, OCR & complaints',
        titleHt: 'Prèv, OCR, plent',
        pathEn: p('lessons/en/05-evidence-ocr-complaints.md'),
        pathHt: p('lessons/ht/05-evidence-ocr-complaints.md'),
        minutes: 22,
      },
      {
        id: 'f-prior-company',
        track: 'F',
        title: 'Prior company & round stage',
        titleHt: 'Lòt konpayi ak round',
        pathEn: p('lessons/en/06-prior-company-intake.md'),
        pathHt: p('lessons/ht/06-prior-company-intake.md'),
        minutes: 18,
      },
      {
        id: 'f-build',
        track: 'F',
        title: 'BUILD & funding-readiness',
        titleHt: 'BUILD ak pare pou finansman',
        pathEn: p('lessons/en/07-build-funding-readiness.md'),
        pathHt: p('lessons/ht/07-build-funding-readiness.md'),
        minutes: 22,
      },
      {
        id: 'f-debt-legal',
        track: 'F',
        title: 'Debt & Legal — Litigation Command',
        titleHt: 'Dèt ak legal — Litigation Command',
        pathEn: p('lessons/en/09-debt-legal-litigation-command.md'),
        pathHt: p('lessons/ht/09-debt-legal-litigation-command.md'),
        minutes: 24,
      },
      {
        id: 'f-track-en',
        track: 'F',
        title: 'Track F reference (English)',
        pathEn: p('TRACK-F-credit-methodology-EN.md'),
        minutes: 35,
      },
      {
        id: 'f-track-ht',
        track: 'C',
        title: 'Track F reference (Kreyòl)',
        pathEn: p('TRACK-F-credit-methodology-HT.md'),
        minutes: 35,
      },
    ],
  },
  {
    id: 'sops',
    track: 'F',
    label: 'SOPs 08–15',
    labelHt: 'SOP 08–15',
    items: [8, 9, 10, 11, 12, 13, 14, 15].map((n) => {
      const names: Record<number, string> = {
        8: 'Debt triage',
        9: 'Validation send',
        10: 'Summons awareness',
        11: 'Restore rounds',
        12: 'Complaints ladder',
        13: 'OCR & evidence',
        14: 'Prior-company intake',
        15: 'Funding-readiness',
      };
      const slug: Record<number, string> = {
        8: 'debt-triage',
        9: 'validation-send',
        10: 'summons-awareness',
        11: 'restore-rounds',
        12: 'complaints-ladder',
        13: 'ocr-evidence-checklist',
        14: 'prior-company-intake',
        15: 'funding-readiness-checklist',
      };
      return {
        id: `sop-${n}`,
        track: 'F' as AcademyTrackId,
        title: `SOP-${String(n).padStart(2, '0')}: ${names[n]}`,
        pathEn: p(`sops/SOP-${String(n).padStart(2, '0')}-${slug[n]}.md`),
        minutes: 12,
      };
    }),
  },
  {
    id: 'track-g',
    track: 'G',
    label: 'Track G — Nora handoff',
    labelHt: 'Trac G — Nora',
    items: [
      {
        id: 'nora-sop15',
        track: 'G',
        title: 'Nora soft handoff (SOP-15 § D)',
        pathEn: p('sops/SOP-15-funding-readiness-checklist.md'),
        minutes: 10,
      },
    ],
  },
];

export const ACADEMY_ITEMS: AcademyItem[] = ACADEMY_GROUPS.flatMap((g) => g.items);

export function findAcademyItem(id: string | null | undefined): AcademyItem | null {
  if (!id) return null;
  return ACADEMY_ITEMS.find((x) => x.id === id) ?? null;
}

export const TRACK_LABELS: Record<AcademyTrackId, string> = {
  hub: 'Hub',
  A: 'Track A — Onboarding',
  B: 'Track B — Comms',
  C: 'Track C — Haitian desk',
  D: 'Track D — Evidence',
  E: 'Track E — Letters & OCR',
  F: 'Track F — Methodology',
  G: 'Track G — Nora',
  H: 'Track H — Compliance & consumer law',
};
