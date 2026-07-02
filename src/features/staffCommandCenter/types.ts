export type StaffKind = 'ai_staff' | 'human_staff' | 'system_team' | 'future_hire';

export type StaffDepartmentId =
  | 'executive_suite'
  | 'marketing_cmo'
  | 'lead_intel'
  | 'geo_growth'
  | 'appointment_setting'
  | 'sales'
  | 'recruiting'
  | 'pr_authority'
  | 'nurture_comms'
  | 'content_media'
  | 'automation_ops'
  | 'compliance'
  | 'analytics'
  | 'partner_growth';

export type StaffSeniority = 'chief' | 'director' | 'manager' | 'operator' | 'assistant' | 'specialist';

export type StaffStatus = 'working' | 'idle' | 'blocked' | 'needs_approval' | 'offline';

export type StaffWorkMode = 'advises' | 'drafts' | 'queues' | 'executes_internal' | 'executes_external_when_approved';

export type StaffMissionType =
  | 'deep_swarm'
  | 'city_growth_sprint'
  | 'lead_action_review'
  | 'appointment_blitz'
  | 'sales_follow_up'
  | 'recruiting_drive'
  | 'partner_outreach'
  | 'content_pack'
  | 'pr_pitch'
  | 'nurture_fix'
  | 'geo_page_push'
  | 'compliance_review'
  | 'analytics_diagnosis'
  | 'overnight_run';

export type StaffRiskLevel = 'low' | 'medium' | 'high' | 'blocked';

export type StaffShiftWindow = {
  label: string;
  days: string;
  startLocal: string;
  endLocal: string;
  timezone: string;
};

export type StaffPortrait = {
  initials: string;
  emoji: string;
  gradient: string;
  glow: string;
  titleTag: string;
  visualHint: string;
};

export type StaffKpi = {
  label: string;
  target: string;
  unit: string;
};

export type StaffMember = {
  id: string;
  name: string;
  title: string;
  kind: StaffKind;
  departmentId: StaffDepartmentId;
  seniority: StaffSeniority;
  status: StaffStatus;
  workMode: StaffWorkMode;
  portrait: StaffPortrait;
  shift: StaffShiftWindow;
  missionTypes: StaffMissionType[];
  canBeSelected: boolean;
  defaultPairings: string[];
  reportsTo?: string;
  tagline: string;
  responsibilities: string[];
  runbook: string[];
  tools: string[];
  kpis: StaffKpi[];
  blockers: string[];
  complianceBoundaries: string[];
  preferredCities?: string[];
  lastActivity: string;
};

export type StaffDepartment = {
  id: StaffDepartmentId;
  name: string;
  shortName: string;
  description: string;
  primaryOwnerId: string;
  colorHint: string;
  missionTypes: StaffMissionType[];
  defaultRoute: string;
  workProducts: string[];
};

export type StaffMissionIntensity = 'light' | 'standard' | 'aggressive' | 'overnight';

export type StaffMissionRequest = {
  id: string;
  createdAt: string;
  title: string;
  missionType: StaffMissionType;
  cityIds: string[];
  selectedStaffIds: string[];
  intensity: StaffMissionIntensity;
  riskLevel: StaffRiskLevel;
  objective: string;
  expectedOutput: string[];
  approvalRequired: boolean;
  notes?: string;
};

export type StaffMissionPlan = {
  request: StaffMissionRequest;
  commandSummary: string;
  leadOwner: StaffMember;
  supportStaff: StaffMember[];
  systemOwnerLabel: string;
  executionLane: 'lead_engine' | 'geo_engine' | 'comms' | 'crm' | 'content' | 'analytics' | 'compliance';
  firstThreeSteps: string[];
  handoffChecklist: string[];
  blockedUntil?: string;
  suggestedNextButton: string;
};

export type GeoClusterStatus = 'active' | 'warmup' | 'needs_content' | 'needs_budget' | 'paused';

export type GeoCluster = {
  id: string;
  city: string;
  state: string;
  timezone: string;
  priority: number;
  status: GeoClusterStatus;
  zipFocus: string[];
  activeFunnels: string[];
  assignedStaffIds: string[];
  overnightTarget: number;
  dailyTarget: number;
  sourceMix: Array<{ source: string; targetPct: number; currentPct: number; health: 'good' | 'thin' | 'blocked' }>;
  nextMoves: string[];
};

export type StaffCommandSettings = {
  defaultView: 'floor' | 'departments' | 'missions' | 'geo';
  maxSelectableStaff: number;
  showFutureHumanStaff: boolean;
  activeDepartmentIds: StaffDepartmentId[];
  activeGeoClusterIds: string[];
  autonomyLabel: 'draft_only' | 'approval_required_external' | 'safe_internal_auto' | 'safe_auto_execute';
};

export type StaffCommandEvent = {
  id: string;
  createdAt: string;
  staffId?: string;
  departmentId?: StaffDepartmentId;
  missionType?: StaffMissionType;
  cityId?: string;
  summary: string;
  severity: 'info' | 'success' | 'warning' | 'blocked';
};

export type StaffCommandStore = {
  settings: StaffCommandSettings;
  selectedStaffIds: string[];
  missions: StaffMissionPlan[];
  events: StaffCommandEvent[];
};
