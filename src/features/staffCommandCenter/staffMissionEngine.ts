import type { StaffMember, StaffMissionIntensity, StaffMissionPlan, StaffMissionRequest, StaffMissionType, StaffRiskLevel } from './types';
import { departmentForMission, findStaff, staffForMission, STAFF_MEMBERS } from './staffDirectory';

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const missionLabels: Record<StaffMissionType, string> = {
  deep_swarm: 'Deep Swarm Intelligence Mission',
  city_growth_sprint: 'City Growth Sprint',
  lead_action_review: 'Lead Action Center Review',
  appointment_blitz: 'Appointment Setting Blitz',
  sales_follow_up: 'Sales Follow-Up Mission',
  recruiting_drive: 'Recruiting Drive',
  partner_outreach: 'Partner Outreach Mission',
  content_pack: 'Content Pack Buildout',
  pr_pitch: 'PR Pitch Mission',
  nurture_fix: 'Nurture Repair Mission',
  geo_page_push: 'Geo Page Push',
  compliance_review: 'Compliance Review',
  analytics_diagnosis: 'Analytics Diagnosis',
  overnight_run: 'Overnight Run Command',
};

const laneByMission: Record<StaffMissionType, StaffMissionPlan['executionLane']> = {
  deep_swarm: 'lead_engine',
  lead_action_review: 'lead_engine',
  city_growth_sprint: 'geo_engine',
  geo_page_push: 'geo_engine',
  appointment_blitz: 'crm',
  sales_follow_up: 'crm',
  recruiting_drive: 'crm',
  partner_outreach: 'crm',
  content_pack: 'content',
  pr_pitch: 'content',
  nurture_fix: 'comms',
  compliance_review: 'compliance',
  analytics_diagnosis: 'analytics',
  overnight_run: 'lead_engine',
};

const outputByMission: Record<StaffMissionType, string[]> = {
  deep_swarm: ['queued jobs', 'candidate list', 'source blockers', 'Action Center recommendations'],
  city_growth_sprint: ['city focus', 'source mix plan', 'geo funnel route', 'next city asset'],
  lead_action_review: ['best offer', 'best message draft', 'short link', 'assigned owner'],
  appointment_blitz: ['booking priority list', 'appointment message draft', 'reminder path'],
  sales_follow_up: ['sales task list', 'objection plan', 'consultation prep path'],
  recruiting_drive: ['role-specific recruiting angle', 'application CTA', 'interview routing'],
  partner_outreach: ['partner list', 'referral pitch', 'activation follow-up'],
  content_pack: ['hooks', 'captions', 'short scripts', 'media briefs'],
  pr_pitch: ['press angle', 'pitch draft', 'authority asset plan'],
  nurture_fix: ['sequence gap report', 'first message rewrite', 'reply routing'],
  geo_page_push: ['city page brief', 'local CTA', 'approval checklist'],
  compliance_review: ['risk verdict', 'rewrite notes', 'block/approve decision'],
  analytics_diagnosis: ['bottleneck report', 'source health', 'next best action'],
  overnight_run: ['overnight owners', 'swarm/revival/content plan', 'morning brief outline'],
};

export function recommendedStaffForMission(missionType: StaffMissionType, selectedIds: string[] = []): StaffMember[] {
  const available = staffForMission(missionType);
  const selected = selectedIds.map(findStaff).filter(Boolean) as StaffMember[];
  const selectedValid = selected.filter((s) => s.missionTypes.includes(missionType));
  const department = departmentForMission(missionType);
  const departmentOwner = findStaff(department.primaryOwnerId);
  const compliance = findStaff('velvet_hammer');
  const professor = findStaff('professor_apex');

  const picks: StaffMember[] = [];
  const push = (s: StaffMember | null | undefined) => {
    if (s && !picks.some((x) => x.id === s.id)) picks.push(s);
  };

  selectedValid.forEach(push);
  push(departmentOwner);
  if (missionType === 'deep_swarm') {
    push(findStaff('scout_supreme'));
    push(findStaff('night_owl_intel'));
    push(findStaff('pipeline_titan'));
  }
  if (missionType === 'city_growth_sprint' || missionType === 'geo_page_push') {
    push(findStaff('geo_commander'));
    push(findStaff('cmo_prime'));
    push(findStaff('seo_sentinel'));
  }
  if (missionType === 'appointment_blitz') {
    push(findStaff('appointment_architect'));
    push(findStaff('liora_lifecycle'));
    push(findStaff('revenue_captain'));
  }
  if (missionType === 'sales_follow_up') {
    push(findStaff('revenue_captain'));
    push(findStaff('appointment_architect'));
    push(findStaff('liora_lifecycle'));
  }
  if (missionType === 'recruiting_drive' || missionType === 'partner_outreach') {
    push(findStaff('partner_recruiter'));
    push(findStaff('affiliate_wrangler'));
    push(findStaff('cmo_prime'));
  }
  if (missionType === 'content_pack' || missionType === 'pr_pitch') {
    push(findStaff('content_director'));
    push(findStaff('hook_mutator'));
    push(findStaff('pr_sentinel'));
  }
  if (missionType === 'nurture_fix' || missionType === 'lead_action_review') {
    push(findStaff('liora_lifecycle'));
    push(findStaff('appointment_architect'));
    push(findStaff('pipeline_titan'));
  }
  if (missionType === 'analytics_diagnosis') {
    push(findStaff('analytics_beast'));
    push(findStaff('morning_hawk'));
    push(findStaff('professor_apex'));
  }
  if (missionType === 'overnight_run') {
    push(findStaff('night_owl_intel'));
    push(findStaff('switchboard'));
    push(findStaff('morning_hawk'));
  }
  if (missionType === 'compliance_review') {
    push(compliance);
    push(findStaff('liora_lifecycle'));
    push(professor);
  }
  if (['sales_follow_up', 'appointment_blitz', 'nurture_fix', 'lead_action_review', 'content_pack', 'pr_pitch'].includes(missionType)) push(compliance);

  available.forEach(push);
  return picks.slice(0, 5);
}

export function buildStaffMissionRequest(args: {
  missionType: StaffMissionType;
  cityIds: string[];
  selectedStaffIds: string[];
  intensity: StaffMissionIntensity;
  riskLevel: StaffRiskLevel;
  objective?: string;
  notes?: string;
}): StaffMissionRequest {
  return {
    id: newId('mission'),
    createdAt: nowIso(),
    title: missionLabels[args.missionType],
    missionType: args.missionType,
    cityIds: args.cityIds,
    selectedStaffIds: args.selectedStaffIds,
    intensity: args.intensity,
    riskLevel: args.riskLevel,
    objective: args.objective || defaultObjective(args.missionType, args.cityIds),
    expectedOutput: outputByMission[args.missionType],
    approvalRequired: args.riskLevel === 'high' || args.riskLevel === 'blocked' || ['sales_follow_up', 'nurture_fix', 'pr_pitch'].includes(args.missionType),
    notes: args.notes,
  };
}

function defaultObjective(type: StaffMissionType, cityIds: string[]) {
  const cities = cityIds.length ? cityIds.join(', ') : 'active cities';
  if (type === 'deep_swarm') return `Run continuous discovery for ${cities}, then produce scored candidates and Action Center recommendations.`;
  if (type === 'city_growth_sprint') return `Make ${cities} more usable by aligning source mix, funnel route, staff ownership, and next local asset.`;
  if (type === 'lead_action_review') return `Turn discovered leads into clear actions: best offer, message, short link, owner, and nurture plan.`;
  if (type === 'appointment_blitz') return `Prioritize high-intent leads and prepare booking-first follow-up with reminders.`;
  if (type === 'sales_follow_up') return `Create revenue-owner tasks for consultation and close-stage follow-up.`;
  if (type === 'recruiting_drive') return `Build recruiting momentum for specialists, agents, affiliates, agency partners, or AU sellers.`;
  if (type === 'partner_outreach') return `Create a partner/referral activation plan with a tracked CTA.`;
  if (type === 'content_pack') return `Build a city/funnel-specific content pack that points back to tracked lead magnets.`;
  if (type === 'pr_pitch') return `Create a credibility angle and outreach draft tied to real city/service context.`;
  if (type === 'nurture_fix') return `Find sequence gaps and produce safer, clearer follow-up paths.`;
  if (type === 'geo_page_push') return `Prepare city landing/page assets for approval and tracking.`;
  if (type === 'compliance_review') return `Review copy, claims, consent, and outbound risk before execution.`;
  if (type === 'analytics_diagnosis') return `Explain what is working, what is blocked, and what one move to make next.`;
  return `Coordinate overnight work across swarm, nurture, content, geo, and morning reporting.`;
}

export function buildStaffMissionPlan(request: StaffMissionRequest): StaffMissionPlan {
  const staff = recommendedStaffForMission(request.missionType, request.selectedStaffIds);
  const leadOwner = staff[0] ?? STAFF_MEMBERS[0];
  const supportStaff = staff.filter((s) => s.id !== leadOwner.id).slice(0, 3);
  const department = departmentForMission(request.missionType);
  const steps = firstStepsForMission(request.missionType, request.cityIds, staff);
  const checklist = checklistForMission(request.missionType, request.riskLevel);
  const blockedUntil = request.riskLevel === 'blocked' ? 'A required integration, approval, or compliance item is resolved.' : undefined;

  return {
    request,
    commandSummary: `${leadOwner.name} owns this. ${supportStaff.map((s) => s.name).join(', ') || 'No support staff'} support the mission. ${department.name} is the owning department.`,
    leadOwner,
    supportStaff,
    systemOwnerLabel: department.name,
    executionLane: laneByMission[request.missionType],
    firstThreeSteps: steps,
    handoffChecklist: checklist,
    blockedUntil,
    suggestedNextButton: buttonForMission(request.missionType),
  };
}

function firstStepsForMission(type: StaffMissionType, cityIds: string[], staff: StaffMember[]) {
  const cityText = cityIds.length ? cityIds.join(', ') : 'active city list';
  const names = staff.slice(0, 3).map((s) => s.name).join(' + ');
  const common = `Confirm owners: ${names || 'Professor Apex + owning department'}.`;
  const map: Record<StaffMissionType, string[]> = {
    deep_swarm: [common, `Queue continuous Lead Intel jobs for ${cityText}; do not stop at one quick batch.`, 'Send hot candidates into the Action Center with a suggested funnel and tracked link.'],
    city_growth_sprint: [common, `Review source mix and active funnels for ${cityText}.`, 'Pick the next city-specific page, short link, source, or recruiting lane.'],
    lead_action_review: [common, 'Open hot candidate backlog and assign best offer/message/owner.', 'Create a short link and draft nurture handoff.'],
    appointment_blitz: [common, 'Filter hot leads with booking intent or reply activity.', 'Prepare booking-first message and reminder plan.'],
    sales_follow_up: [common, 'Identify high-intent CRM records and consultation-ready leads.', 'Create sales tasks with objection notes and next CTA.'],
    recruiting_drive: [common, 'Choose recruiting role: credit specialist, agency, affiliate, AU seller, or partner.', 'Build city-specific recruiting angle and application CTA.'],
    partner_outreach: [common, 'Choose partner segment and city overlap.', 'Create referral pitch, tracked link, and activation follow-up.'],
    content_pack: [common, 'Pick funnel and city angle.', 'Generate hook/caption/script pack tied to lead magnet short links.'],
    pr_pitch: [common, 'Pick credibility angle and local relevance.', 'Draft pitch and repurpose plan with compliance review.'],
    nurture_fix: [common, 'Find funnel with weak/no sequence coverage.', 'Draft safe first-message repair and consent-aware channel plan.'],
    geo_page_push: [common, `Pick approved city/funnel page for ${cityText}.`, 'Generate page brief and tracking plan; hold for approval before publish.'],
    compliance_review: [common, 'Scan claims, consent, CTA, and destination.', 'Return approve/rewrite/block verdict.'],
    analytics_diagnosis: [common, 'Read city/source/funnel performance.', 'Return the single biggest blocker and the next move.'],
    overnight_run: [common, 'Split work into swarm, revival, geo/content, and morning brief lanes.', 'Run only safe/internal automation unless approvals and integrations are healthy.'],
  };
  return map[type];
}

function checklistForMission(type: StaffMissionType, risk: StaffRiskLevel) {
  const base = ['Owner selected', 'Department selected', 'Output defined', 'Reporting destination selected'];
  if (['nurture_fix', 'sales_follow_up', 'appointment_blitz'].includes(type)) base.push('Consent checked', 'Unsubscribe/STOP honored');
  if (['content_pack', 'pr_pitch', 'geo_page_push'].includes(type)) base.push('Claims reviewed', 'No fake local proof');
  if (risk === 'high' || risk === 'blocked') base.push('Human approval required before external action');
  return base;
}

function buttonForMission(type: StaffMissionType) {
  if (type === 'deep_swarm') return 'Start Staff-Owned Swarm';
  if (type === 'city_growth_sprint') return 'Build City Mission';
  if (type === 'lead_action_review') return 'Open Action Center';
  if (type === 'appointment_blitz') return 'Prepare Booking Blitz';
  if (type === 'sales_follow_up') return 'Create Sales Tasks';
  if (type === 'recruiting_drive') return 'Launch Recruiting Mission';
  if (type === 'partner_outreach') return 'Build Partner Outreach';
  if (type === 'content_pack') return 'Generate Content Pack';
  if (type === 'pr_pitch') return 'Draft PR Pitch';
  if (type === 'nurture_fix') return 'Repair Nurture';
  if (type === 'geo_page_push') return 'Queue Geo Page';
  if (type === 'compliance_review') return 'Run Compliance Review';
  if (type === 'analytics_diagnosis') return 'Diagnose Growth';
  return 'Plan Overnight Run';
}
