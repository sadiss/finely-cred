export type SitewideUxPatternId =
  | 'command_deck_kpi_cards_action_drawer'
  | 'premium_public_funnel_sections'
  | 'compact_portal_workspace_deck'
  | 'horizontal_template_gallery'
  | 'automation_blueprint_canvas'
  | 'wide_media_prompt_first'
  | 'lead_action_center'
  | 'geo_intelligence_deck'
  | 'trash_restore_panel'
  | 'protected_credit_intel_no_touch';

export type SitewideUxRule = {
  id: string;
  title: string;
  problem: string;
  replacement: string;
  appliesTo: string[];
  cursorAction: string;
  severity: 'critical' | 'high' | 'medium' | 'protected';
};

export type SitewideUxMission = {
  id: string;
  title: string;
  owner: string;
  pages: string[];
  expectedOutcome: string;
  acceptanceChecks: string[];
};

export type SitewideUxSummary = {
  totalPages: number;
  publicPages: number;
  adminPages: number;
  portalPages: number;
  businessPages: number;
  criticalPages: number;
  protectedPages: number;
  longListRiskPages: number;
};
