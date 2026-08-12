/**
 * Ruth co-owner weekly focus for Marketing Desk command strip —
 * lane, city, offer from growth week focus + lane pace tip.
 */
import { CO_OWNER_IDENTITY } from '../../domain/coOwnerIdentity';
import { STAFF_ROSTER_PROFILES } from '../staffCommandCenter/staffRosterProfiles';
import { getGrowthWeekFocus } from '../growthAgents/growthWeekFocus';
import { calebTodaysMissionPreview } from '../growthAgents/calebQuotaMission';
import { getLaneCta, offerPackForLane, type LeadEngineLane } from '../leadIntel/leadEngineAutonomy';
import { getRuthWeeklyLaneTip } from './marketingDeskRuthLaneTip';

export type RuthCommandFocus = {
  fullName: string;
  roleLabel: string;
  lane: LeadEngineLane;
  laneLabel: string;
  city: string;
  offerPath: string;
  offerLabel: string;
  weeklyTip: string | null;
  calebPreview: string;
};

/** Ruth Steward branding + co-owner weekly focus chips (lane · city · offer). */
export function getRuthCommandFocus(): RuthCommandFocus {
  const focus = getGrowthWeekFocus();
  const tip = getRuthWeeklyLaneTip();
  const lane = focus.lane;
  const cta = getLaneCta(lane);
  const offerItem = offerPackForLane(lane).find((o) => o.id !== 'book') ?? offerPackForLane(lane)[0];
  const profile = STAFF_ROSTER_PROFILES.ruth_steward;

  return {
    fullName: profile ? `${profile.firstName} ${profile.lastName}` : CO_OWNER_IDENTITY.name,
    roleLabel: CO_OWNER_IDENTITY.recognitionLabel,
    lane,
    laneLabel: focus.laneLabel || cta.label,
    city: focus.city,
    offerPath: offerItem?.href || cta.offer,
    offerLabel: offerItem?.label || 'Partner offer',
    weeklyTip: tip?.tip ?? null,
    calebPreview: calebTodaysMissionPreview(focus.city),
  };
}
