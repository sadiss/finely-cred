import { listCasesByPartner } from '../data/casesRepo';
import { upsertPartnerSuccessRecord } from '../data/partnerSuccessExperienceRepo';

export function recordPartnerSuccessMilestone(partnerId: string, moduleId: string) {
  upsertPartnerSuccessRecord(partnerId, {
    moduleId,
    completedAt: new Date().toISOString(),
  });
}

export function onPartnerLetterMailed(partnerId: string) {
  recordPartnerSuccessMilestone(partnerId, 'ps_letter_mailed_review');
}

export function onPartnerFirstCaseOpened(partnerId: string) {
  const cases = listCasesByPartner(partnerId);
  if (cases.length === 1) {
    recordPartnerSuccessMilestone(partnerId, 'ps_first_case_milestone');
  }
}
