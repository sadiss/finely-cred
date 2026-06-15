export type CrmCopilotPackageSuggestion = {
  packageId: string;
  name: string;
  delivery: string;
  reason: string;
};

export type CrmCopilotResult = {
  source: 'rules' | 'ai';
  score: number;
  scoreLabel: 'cold' | 'warm' | 'hot';
  nextAction: string;
  convertPath: string;
  outreachDraft?: string;
  packageSuggestions: CrmCopilotPackageSuggestion[];
  /** Tier 2 — CRMAICopilot Pro */
  churnRisk: 'low' | 'medium' | 'high';
  forecastWeight: number;
  objectionDraft?: string;
};

export type CrmCopilotOutreachDraft = {
  subject: string;
  body: string;
};
