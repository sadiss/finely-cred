/** Reusable partner coaching playbooks (admin + Nora handoff). */

export type PlaybookStageId =
  | 'restore_track'
  | 'fundability_nora'
  | 'business_build';

export type PlaybookTemplateId = 'anna_apparel_design_tech' | 'generic_business_build' | 'restore_only';

export type PlaybookStage = {
  id: PlaybookStageId;
  title: string;
  summary: string;
  checklist: string[];
  verticalNotes?: Record<string, string>;
};

export type PartnerPlaybookTemplate = {
  id: PlaybookTemplateId;
  label: string;
  vertical: string;
  stages: PlaybookStage[];
  readingList: string[];
};

const RESTORE_STAGE: PlaybookStage = {
  id: 'restore_track',
  title: 'A) Credit restore track',
  summary: 'Personal file discipline — log AUs, disputes, education. No fake scores.',
  checklist: [
    'Log each AU add (creditor, date, limit) in partner notes',
    'Track dispute rounds + evidence IDs',
    'Record score snapshots as reported only',
    'Education: utilization, inquiries, payment history',
  ],
};

const NORA_STAGE: PlaybookStage = {
  id: 'fundability_nora',
  title: 'B) Fundability readiness (Nora handoff)',
  summary: 'Package signals before lender/Nora conversations.',
  checklist: [
    'Personal restore stability checkpoint',
    'Entity docs if business lane active',
    'Banking narrative documented',
    'Nora handoff consent in notes',
  ],
};

const BUSINESS_STAGE_ANNA: PlaybookStage = {
  id: 'business_build',
  title: 'C) Business build — concept studio',
  summary: 'Apparel/design-tech: concepts, mockups, platform vision, production path.',
  checklist: [
    'Brand board: colors, logos, mockups',
    'Platform story: customers design → owner provides tech/visual insight',
    'Research high-end uniform / apparel production (no vendor promises)',
    'Owner mindset sessions + reading list',
    'Vendor / net-30 when entity + file ready',
  ],
  verticalNotes: {
    apparel: 'Uniform lines, MOQ research, sample calendar',
    design_tech: 'Customer concept flow wireframes — no fake funding claims',
  },
};

const BUSINESS_STAGE_GENERIC: PlaybookStage = {
  id: 'business_build',
  title: 'C) Business build',
  summary: 'Entity, vendors, vertical-specific notes.',
  checklist: ['NAICS + entity', 'Business portal 7-step journey', 'Tier-1 vendors when ready'],
};

export const PARTNER_PLAYBOOK_TEMPLATES: PartnerPlaybookTemplate[] = [
  {
    id: 'anna_apparel_design_tech',
    label: 'Anna Charlotin — apparel / design-tech',
    vertical: 'Apparel, uniform design, customer concept studio',
    stages: [RESTORE_STAGE, NORA_STAGE, BUSINESS_STAGE_ANNA],
    readingList: [
      'The E-Myth Revisited',
      'Profit First',
      'Never Split the Difference',
      'Company of One',
    ],
  },
  {
    id: 'generic_business_build',
    label: 'Generic — business build lane',
    vertical: 'Any partner with entity + vendor path',
    stages: [RESTORE_STAGE, NORA_STAGE, BUSINESS_STAGE_GENERIC],
    readingList: ['Profit First', 'The Lean Startup'],
  },
  {
    id: 'restore_only',
    label: 'Restore only',
    vertical: 'Personal restore without business lane',
    stages: [RESTORE_STAGE],
    readingList: ['Finely Score Intelligence modules', 'FICO honesty (Track F)'],
  },
];

export function getPlaybookTemplate(id: PlaybookTemplateId): PartnerPlaybookTemplate {
  return PARTNER_PLAYBOOK_TEMPLATES.find((t) => t.id === id) ?? PARTNER_PLAYBOOK_TEMPLATES[0];
}
