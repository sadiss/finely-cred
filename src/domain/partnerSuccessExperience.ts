/** Partner success modules — quizzes, reviews, checklists, milestones that deepen support. */

import { listEffectivePartnerSuccessModules } from '../data/partnerSuccessModuleOverridesRepo';

export type PartnerSuccessLane = 'all' | 'dispute' | 'debt' | 'restore' | 'funding' | 'onboarding' | 'bankruptcy';

export type PartnerSuccessModuleType =
  | 'quiz'
  | 'review'
  | 'checklist'
  | 'survey'
  | 'milestone'
  | 'training'
  | 'certificate';

export type PartnerSuccessModule = {
  id: string;
  title: string;
  description: string;
  type: PartnerSuccessModuleType;
  lanes: PartnerSuccessLane[];
  hubPath: string;
  /** Training Academy lesson with quiz gate */
  trainingLessonId?: string;
  /** Inline micro-quiz when not tied to academy */
  quiz?: Array<{ question: string; options: string[]; correctIndex: number }>;
  /** Prompt after milestone (letter mailed, case opened, etc.) */
  reviewPrompt?: string;
  order: number;
  accent: 'emerald' | 'violet' | 'amber' | 'sky' | 'fuchsia';
};

export const PARTNER_SUCCESS_MODULES: PartnerSuccessModule[] = [
  {
    id: 'ps_restore_checklist',
    title: 'Restore journey checklist',
    description: 'Upload → analyze → evidence → dispute → follow-up — track every step.',
    type: 'checklist',
    lanes: ['restore', 'dispute', 'all'],
    hubPath: '/portal/checklist',
    order: 1,
    accent: 'emerald',
  },
  {
    id: 'ps_compliance_quiz',
    title: 'Compliance before you mail',
    description: 'Short quiz on evidence gates and FTC-safe language — required for confident mailing.',
    type: 'quiz',
    lanes: ['dispute', 'debt', 'all'],
    hubPath: '/portal/training',
    trainingLessonId: 'core_l3_evidence',
    order: 2,
    accent: 'violet',
  },
  {
    id: 'ps_dispute_readiness',
    title: 'Dispute readiness quiz',
    description: 'Confirm you know factual reasons, evidence, and round sequencing before Round 1.',
    type: 'quiz',
    lanes: ['dispute'],
    hubPath: '/portal/disputes',
    quiz: [
      {
        question: 'Best first move for a collection you do not recognize?',
        options: ['Pay to delete', 'Factual dispute + validation path', 'Ignore forever', 'Threaten lawsuit in Round 1'],
        correctIndex: 1,
      },
      {
        question: 'Evidence for a late-payment dispute should:',
        options: ['Be unrelated screenshots', 'Tie one claim to one document', 'Include SSN on every page', 'Skip the vault'],
        correctIndex: 1,
      },
    ],
    order: 3,
    accent: 'amber',
  },
  {
    id: 'ps_debt_validation_quiz',
    title: 'FDCPA validation quiz',
    description: 'Know your 30-day window, proof demands, and what collectors must provide.',
    type: 'quiz',
    lanes: ['debt'],
    hubPath: '/portal/debt',
    quiz: [
      {
        question: 'After initial contact, you generally have how long to request validation?',
        options: ['7 days', '30 days', '90 days', 'No limit'],
        correctIndex: 1,
      },
      {
        question: 'If validation is insufficient, your next disciplined move is often:',
        options: ['Admit the debt', 'Cease contact + dispute in writing', 'Wire payment', 'Post on social media'],
        correctIndex: 1,
      },
    ],
    order: 4,
    accent: 'fuchsia',
  },
  {
    id: 'ps_letter_mailed_review',
    title: 'How was letter prep?',
    description: 'Quick 1–5 rating after you generate or mail — helps us improve Letter Studio.',
    type: 'review',
    lanes: ['dispute', 'debt'],
    hubPath: '/portal/letters',
    reviewPrompt: 'How clear was the letter prep experience?',
    order: 5,
    accent: 'sky',
  },
  {
    id: 'ps_first_case_milestone',
    title: 'First case opened',
    description: 'Celebrate opening your first bureau or debt case — unlocks follow-up reminders.',
    type: 'milestone',
    lanes: ['dispute', 'debt'],
    hubPath: '/portal/disputes',
    order: 6,
    accent: 'emerald',
  },
  {
    id: 'ps_training_academy',
    title: 'Training Academy tracks',
    description: 'Role-based lessons, quizzes, and certifications for your lane.',
    type: 'training',
    lanes: ['all'],
    hubPath: '/portal/training',
    trainingLessonId: 'core_l1_orientation',
    order: 7,
    accent: 'violet',
  },
  {
    id: 'ps_csat_survey',
    title: 'Partner success pulse',
    description: 'Monthly check-in — portal clarity, coach helpfulness, and next feature wishes.',
    type: 'survey',
    lanes: ['all'],
    hubPath: '/portal/messages',
    reviewPrompt: 'How supported do you feel this week?',
    order: 8,
    accent: 'amber',
  },
  {
    id: 'ps_bankruptcy_home_quiz',
    title: 'Save your home quiz',
    description: 'Know automatic stay timing and Chapter 13 cure basics before a sale date.',
    type: 'quiz',
    lanes: ['bankruptcy', 'debt'],
    hubPath: '/portal/bankruptcy',
    quiz: [
      {
        question: 'When does the automatic stay generally attach?',
        options: ['When you mail a letter', 'On bankruptcy petition filing', 'After discharge', 'Only in Chapter 11'],
        correctIndex: 1,
      },
      {
        question: 'Chapter 13 is often used to:',
        options: ['Erase mortgage liens instantly', 'Cure mortgage arrearage over a plan', 'Avoid credit counseling', 'Skip the 341 meeting'],
        correctIndex: 1,
      },
    ],
    order: 9,
    accent: 'sky',
  },
  {
    id: 'ps_bankruptcy_milestone',
    title: 'Liberation path chosen',
    description: 'You picked a bankruptcy scenario — your specialist is aligned to that fight.',
    type: 'milestone',
    lanes: ['bankruptcy'],
    hubPath: '/portal/bankruptcy',
    order: 10,
    accent: 'sky',
  },
  {
    id: 'ps_bankruptcy_review',
    title: 'Bankruptcy coach helpful?',
    description: 'Quick rating — helps Ruth tune bankruptcy specialists.',
    type: 'review',
    lanes: ['bankruptcy'],
    hubPath: '/portal/bankruptcy',
    reviewPrompt: 'How clear was the liberation path guidance?',
    order: 11,
    accent: 'violet',
  },
];

export function modulesForLane(lane: PartnerSuccessLane): PartnerSuccessModule[] {
  const source = typeof window !== 'undefined' ? listEffectivePartnerSuccessModules() : PARTNER_SUCCESS_MODULES;
  return source.filter((m) => m.lanes.includes('all') || m.lanes.includes(lane)).sort((a, b) => a.order - b.order);
}
