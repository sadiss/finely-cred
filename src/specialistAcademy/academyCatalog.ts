/**
 * Specialist Academy navigation catalog.
 * Content files live under docs/specialist-academy/ (loaded at build time).
 */

export type AcademyTrackId = 'hub' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

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
    id: 'track-f-lessons',
    track: 'F',
    label: 'Track F — methodology lessons',
    labelHt: 'Trac F — metodoloji',
    items: [
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
};
