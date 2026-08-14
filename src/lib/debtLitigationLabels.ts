/** Display labels for `debtLitigationDoctrineRepo.ts` union fields — shared across all C1 debt-defense articles. */
import type { DebtLitigationPlaybook } from '../data/debtLitigationDoctrineRepo';

export const DEBT_TYPE_LABELS: Record<DebtLitigationPlaybook['debtType'], string> = {
  credit_card: 'Credit card',
  medical: 'Medical debt',
  auto_repossession: 'Auto repossession',
  mortgage_foreclosure: 'Mortgage / foreclosure',
  student_loan: 'Student loan',
  bank_overdraft: 'Bank overdraft',
  personal_loan: 'Personal loan',
  tax_lien: 'Tax lien (IRS / state)',
  merchant_cash_advance: 'Merchant cash advance',
  payday_loan: 'Payday loan',
  timeshare: 'Timeshare',
};

export const PHASE_LABELS: Record<DebtLitigationPlaybook['phase'], string> = {
  pre_suit_validation: 'Pre-suit validation',
  summons_answer: 'Summons & answer',
  discovery_motion: 'Discovery & motion practice',
  post_judgment_emergency: 'Post-judgment emergency',
  counter_suit: 'FDCPA counter-suit',
};

export const ACTION_TYPE_LABELS: Record<DebtLitigationPlaybook['remedyAction']['actionType'], string> = {
  wage_garnishment_exemption: 'Wage garnishment exemption',
  bank_levy_quash: 'Bank levy / quash',
  motion_to_vacate: 'Motion to vacate default judgment',
  fdcpa_counter_suit: 'FDCPA counter-suit',
  cfpb_ag_complaint: 'CFPB / Attorney General complaint',
  answer_and_affirmative_defenses: 'Answer & affirmative defenses',
  discovery_demand: 'Discovery demand',
  statute_of_limitations_defense: 'Statute of limitations defense',
};
