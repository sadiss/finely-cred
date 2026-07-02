export type HumanStaffDepartmentId =
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

export type HumanStaffAgentId =
  | 'professor_apex'
  | 'cmo_prime'
  | 'pipeline_titan'
  | 'scout_supreme'
  | 'night_owl_intel'
  | 'geo_commander'
  | 'appointment_architect'
  | 'revenue_captain'
  | 'partner_recruiter'
  | 'affiliate_wrangler'
  | 'pr_sentinel'
  | 'liora_lifecycle'
  | 'goldframe'
  | 'shorts_factory'
  | 'switchboard'
  | 'velvet_hammer'
  | 'analytics_beast'
  | 'retarget_architect'
  | 'local_news_radar'
  | 'inbox_triage'
  | 'fun_captain'
  | 'future_human_manager';

export type HumanStaffStatus = 'working' | 'idle' | 'blocked' | 'waiting_for_you' | 'offline';
export type HumanStaffThreadStatus = 'open' | 'waiting_for_user' | 'handoff_ready' | 'done' | 'blocked';
export type HumanStaffPriority = 'low' | 'normal' | 'high' | 'urgent';
export type HumanStaffTone = 'precise' | 'warm' | 'direct' | 'energetic' | 'calm' | 'executive' | 'salesy_safe';

export type HumanStaffCapability = {
  id: string;
  label: string;
  description: string;
  inputNeeded: string[];
  output: string;
  risk: 'low' | 'medium' | 'high';
  canAutoRunInternally: boolean;
  needsApprovalForExternal: boolean;
};

export type HumanStaffKnowledgeCard = {
  id: string;
  title: string;
  departmentId: HumanStaffDepartmentId;
  agentIds: HumanStaffAgentId[];
  level: 'foundation' | 'advanced' | 'expert';
  summary: string;
  rules: string[];
  examples: string[];
  handoffTriggers: string[];
};

export type HumanStaffAgent = {
  id: HumanStaffAgentId;
  name: string;
  title: string;
  departmentId: HumanStaffDepartmentId;
  reportsTo?: HumanStaffAgentId;
  status: HumanStaffStatus;
  portrait: {
    initials: string;
    emoji: string;
    gradient: string;
    specialtyColor: string;
    visualPrompt: string;
  };
  shift: {
    label: string;
    localStart: string;
    localEnd: string;
    timezone: string;
  };
  personality: {
    voice: string;
    cadence: string;
    humor: string;
    conflictStyle: string;
    decisionStyle: string;
  };
  mission: string;
  coreKnowledge: string[];
  capabilities: HumanStaffCapability[];
  responseDo: string[];
  responseAvoid: string[];
  defaultPartners: HumanStaffAgentId[];
  escalationPartners: HumanStaffAgentId[];
  metrics: Array<{ label: string; target: string; currentHint: string }>;
};

export type HumanStaffDepartment = {
  id: HumanStaffDepartmentId;
  name: string;
  shortName: string;
  description: string;
  ownerId: HumanStaffAgentId;
  order: number;
  visibleRoute: string;
  workProducts: string[];
  operatingRules: string[];
};

export type HumanStaffMessage = {
  id: string;
  createdAt: string;
  fromAgentId: HumanStaffAgentId | 'user' | 'system';
  toAgentIds: HumanStaffAgentId[];
  body: string;
  tone: HumanStaffTone;
  priority: HumanStaffPriority;
  tags: string[];
  requiresUserDecision?: boolean;
  suggestedActions?: string[];
  relatedLeadId?: string;
  relatedCityId?: string;
};

export type HumanStaffThread = {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  missionType: string;
  status: HumanStaffThreadStatus;
  cityIds: string[];
  assignedAgentIds: HumanStaffAgentId[];
  messages: HumanStaffMessage[];
  summary: string;
  nextAction: string;
  memory: string[];
};

export type HumanStaffNotification = {
  id: string;
  createdAt: string;
  fromAgentId: HumanStaffAgentId;
  toAgentId: HumanStaffAgentId;
  title: string;
  body: string;
  priority: HumanStaffPriority;
  read: boolean;
  actionLabel?: string;
  routeHint?: string;
  threadId?: string;
};

export type HumanStaffMissionRequest = {
  title: string;
  objective: string;
  missionType: string;
  cityIds: string[];
  selectedAgentIds: HumanStaffAgentId[];
  riskLevel: 'low' | 'medium' | 'high';
  autonomy: 'draft_only' | 'safe_internal_auto' | 'approval_required_external' | 'safe_auto_execute';
};

export type HumanStaffMissionPlan = {
  id: string;
  createdAt: string;
  request: HumanStaffMissionRequest;
  leadAgentId: HumanStaffAgentId;
  supportingAgentIds: HumanStaffAgentId[];
  operatingSummary: string;
  agentBriefs: Array<{ agentId: HumanStaffAgentId; brief: string; firstMove: string; deliverable: string }>;
  agentNotifications: HumanStaffNotification[];
  actionSequence: string[];
  approvalGates: string[];
  expectedOutputs: string[];
};

export type HumanStaffMemory = {
  id: string;
  createdAt: string;
  agentId: HumanStaffAgentId;
  topic: string;
  detail: string;
  source: 'mission' | 'user_note' | 'system_event' | 'handoff';
  importance: 1 | 2 | 3 | 4 | 5;
};

export type HumanStaffStore = {
  threads: HumanStaffThread[];
  notifications: HumanStaffNotification[];
  missions: HumanStaffMissionPlan[];
  memories: HumanStaffMemory[];
  lastResponseHashes: Record<string, string[]>;
  selectedAgentIds: HumanStaffAgentId[];
};
