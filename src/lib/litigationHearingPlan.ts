/**
 * Partner litigation stage path — educational self-help, not legal advice.
 * Ties Answer → Affidavit → Discovery → Hearing prep to letter catalog IDs.
 */

export type LitigationStageId = 'intake' | 'answer' | 'affidavit' | 'discovery' | 'hearing';

export type LitigationStage = {
  id: LitigationStageId;
  title: string;
  short: string;
  nextAction: string;
  catalogIds: string[];
  defenseIds: string[];
  laws: string[];
};

export const LITIGATION_STAGES: LitigationStage[] = [
  {
    id: 'intake',
    title: 'Intake & scrape',
    short: 'Upload summons, affidavit, and docket. Confirm parties, case #, counsel, and hearing date.',
    nextAction: 'Upload court docs → review scraper chat → save fields to this case.',
    catalogIds: [],
    defenseIds: ['document_audit', 'docket_strategy', 'debt_buyer_midland_citi_pack'],
    laws: ['Civil procedure', 'Service rules'],
  },
  {
    id: 'answer',
    title: 'Answer',
    short: 'File a contested written answer. Admit only what is true. Preserve standing, amount, and hearsay defenses.',
    nextAction: 'Build Written answer + certificate of service from the Court letter catalog.',
    catalogIds: ['court_courtroom_written_answer', 'court_answer_general', 'court_affirmative_defenses_standing'],
    defenseIds: ['hearing_scripts', 'written_answer_playbook', 'debt_buyer_midland_citi_pack'],
    laws: ['Civil procedure', 'Real party in interest'],
  },
  {
    id: 'affidavit',
    title: 'Affidavit',
    short: 'Put your dispute under oath. Challenge foundation of plaintiff affidavits and amount math.',
    nextAction: 'Build Affidavit of dispute and attach proof from your defense file.',
    catalogIds: ['court_affidavit_dispute', 'court_courtroom_pretrial_proof'],
    defenseIds: ['document_audit', 'amount_audit', 'continuance_if_new_exhibits'],
    laws: ['Evidence / personal knowledge', '28 U.S.C. § 1746'],
  },
  {
    id: 'discovery',
    title: 'Discovery',
    short: 'Force account-level assignment, sale file, ledger, and witness foundation.',
    nextAction: 'Serve defendant discovery; compel if responses are evasive.',
    catalogIds: ['court_discovery_full', 'court_motion_compel', 'validation_chain_of_title'],
    defenseIds: ['cross_exam_sequence', 'discovery_pressure', 'debt_buyer_midland_citi_pack'],
    laws: ['Discovery rules', 'UCC § 9-406', 'FDCPA § 1692g'],
  },
  {
    id: 'hearing',
    title: 'Hearing prep',
    short: 'One-page court card, five-gate questions, and calm scripts. Bring your defense file.',
    nextAction: 'Print Court-day kit + hearing card; practice five-gate questions.',
    catalogIds: ['court_courtroom_day_kit', 'court_counterclaim_fdcpa'],
    defenseIds: ['court_card', 'hearing_scripts', 'prehearing_72h_checklist', 'fdcpa_counterclaim_track'],
    laws: ['Evidence weight', 'FDCPA', 'Standing'],
  },
];

/**
 * Quick-fill hearing date for the Roosevelt Corelus Midland/Citi matter (2026-07-27).
 * Used by the “Use Jul 27” button only — do NOT auto-write onto other partners’ cases.
 * Yolie and other credit-restore partners are not the court hearing owner.
 */
export const ROOSEVELT_COURT_HEARING_ISO = '2026-07-27';

/** @deprecated Prefer ROOSEVELT_COURT_HEARING_ISO — kept for button label compatibility. */
export function defaultUrgentHearingIso(now = new Date()): string {
  const target = new Date(`${ROOSEVELT_COURT_HEARING_ISO}T12:00:00`);
  if (target.getTime() < now.getTime() - 12 * 60 * 60 * 1000) {
    // Past hearing: still return the fixed Roosevelt date for demo merge fields;
    // owners can edit the date field. Do not invent a new year for unrelated partners.
    return ROOSEVELT_COURT_HEARING_ISO;
  }
  return ROOSEVELT_COURT_HEARING_ISO;
}

export function daysUntilHearing(hearingIso: string, now = new Date()): number {
  const target = new Date(`${hearingIso.slice(0, 10)}T12:00:00`);
  const start = new Date(now);
  start.setHours(12, 0, 0, 0);
  return Math.ceil((target.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

export function recommendLitigationStage(args: {
  hasSummonsDoc: boolean;
  hasAnswerDraft?: boolean;
  hasAffidavitDraft?: boolean;
  hasDiscoveryDraft?: boolean;
  daysLeft: number;
}): LitigationStageId {
  if (args.daysLeft <= 3) return 'hearing';
  if (!args.hasSummonsDoc) return 'intake';
  if (!args.hasAnswerDraft) return 'answer';
  if (!args.hasAffidavitDraft) return 'affidavit';
  if (!args.hasDiscoveryDraft && args.daysLeft > 7) return 'discovery';
  return 'hearing';
}

export function formatHearingCountdown(daysLeft: number): string {
  if (daysLeft < 0) return `${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? '' : 's'} past hearing`;
  if (daysLeft === 0) return 'Hearing is today';
  if (daysLeft === 1) return '1 day to hearing';
  return `${daysLeft} days to hearing`;
}
