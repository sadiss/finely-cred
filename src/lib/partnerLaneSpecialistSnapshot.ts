import type { StaffMember } from '../domain/staffMember';
import { staffMemberFullName } from '../domain/staffMember';
import { getBankruptcyScenarioSelection } from '../data/bankruptcyLaneStateRepo';
import { getDisputeLaneFocus } from '../data/disputeLaneStateRepo';
import { getDebtLaneFocus } from '../data/debtLaneStateRepo';
import { getFundingLaneFocus } from '../data/fundingLaneStateRepo';
import { BANKRUPTCY_LIBERATION_SCENARIOS } from '../legal/bankruptcyLiberationPaths';
import { bureauFullName } from '../utils/bureaus';
import type { Bureau } from '../domain/creditReports';
import {
  resolveStaffForBankruptcyScenario,
  resolveStaffForLaneFocus,
} from '../data/staffRoster';

export type PartnerLaneSpecialistCard = {
  id: string;
  laneLabel: string;
  detail: string;
  href: string;
  staff: StaffMember;
};

function card(
  id: string,
  laneLabel: string,
  detail: string,
  href: string,
  staff: StaffMember | null,
  focusId: string,
  lane: string,
): PartnerLaneSpecialistCard | null {
  const resolved = staff ?? resolveStaffForLaneFocus(focusId, lane);
  if (!resolved) return null;
  return { id, laneLabel, detail, href, staff: resolved };
}

export function buildPartnerLaneSpecialistCards(partnerId: string): PartnerLaneSpecialistCard[] {
  const cards: PartnerLaneSpecialistCard[] = [];

  const bk = getBankruptcyScenarioSelection(partnerId);
  if (bk?.scenarioId) {
    const scenario = BANKRUPTCY_LIBERATION_SCENARIOS.find((s) => s.id === bk.scenarioId);
    const c = card(
      'bankruptcy',
      'Bankruptcy',
      scenario?.title ?? bk.scenarioTitle ?? 'Liberation path',
      '/portal/bankruptcy',
      resolveStaffForBankruptcyScenario(bk.scenarioId),
      bk.scenarioId,
      'bankruptcy',
    );
    if (c) cards.push(c);
  }

  const dispute = getDisputeLaneFocus(partnerId);
  if (dispute?.bureau) {
    const c = card(
      'dispute',
      'Disputes',
      `${bureauFullName(dispute.bureau as Bureau)} bureau`,
      '/portal/disputes',
      null,
      dispute.bureau,
      'dispute',
    );
    if (c) cards.push(c);
  }

  const debt = getDebtLaneFocus(partnerId);
  if (debt?.workstation) {
    const labels: Record<string, string> = {
      validation: 'Validation & FDCPA',
      court: 'Court & summons',
      foreclosure: 'Foreclosure',
      repossession: 'Repossession',
      bankruptcy: 'Bankruptcy prep',
    };
    const c = card(
      'debt',
      'Debt & summons',
      labels[debt.workstation] ?? debt.workstation,
      `/portal/debt`,
      null,
      debt.workstation,
      debt.workstation,
    );
    if (c) cards.push(c);
  }

  const funding = getFundingLaneFocus(partnerId);
  if (funding?.laneId) {
    const c = card(
      'funding',
      'Wealth paths',
      funding.laneTitle ?? funding.laneId.replace(/^lane_/, '').replace(/_/g, ' '),
      '/portal/wealth-paths',
      null,
      funding.laneId,
      'funding',
    );
    if (c) cards.push(c);
  }

  return cards;
}

export function primaryPartnerSpecialistLabel(partnerId: string): string | null {
  const cards = buildPartnerLaneSpecialistCards(partnerId);
  if (!cards.length) return null;
  const first = cards[0];
  return `${staffMemberFullName(first.staff)} · ${first.laneLabel}`;
}
