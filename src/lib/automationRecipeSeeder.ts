/** Auto-install billing + win-back + full human automation catalog on boot. */
import { ALL_AUTOMATION_RECIPES } from '../features/automation/automationRecipeLibrary';
import { HUMAN_AUTOMATION_RECIPES } from '../features/automation/humanAutomationCatalog';
import {
  createAutomationRule,
  ensureAutomationRuleDefaultsOnce,
  listAutomationRules,
} from '../data/automationStudioRepo';

const CORE_EVENT_RECIPE_IDS = [
  'recipe_meta_lead_notify',
  'recipe_funnel_nurture',
  'recipe_funnel_session_closer',
  'recipe_task_overdue_escalation',
  'recipe_billing_dunning',
  'recipe_trial_win_back',
  'recipe_report_upload_auto_draft',
  'recipe_evidence_ready_draft',
  'recipe_complaint_compliance',
] as const;

function recipeInstalled(recipeId: string): boolean {
  return listAutomationRules().some((r) => r.meta?.recipeId === recipeId);
}

let seeded = false;

/** Boot-install core event recipes + entire human automation catalog (Part AW). */
export function ensureCoreAutomationRecipesOnce() {
  if (seeded) return;
  seeded = true;
  ensureAutomationRuleDefaultsOnce();

  const humanIds = HUMAN_AUTOMATION_RECIPES.map((r) => r.id);
  const allIds = [...new Set([...CORE_EVENT_RECIPE_IDS, ...humanIds])];

  for (const recipeId of allIds) {
    if (recipeInstalled(recipeId)) continue;
    const recipe =
      ALL_AUTOMATION_RECIPES.find((r) => r.id === recipeId) ??
      HUMAN_AUTOMATION_RECIPES.find((r) => r.id === recipeId);
    if (!recipe) continue;
    createAutomationRule(recipe.makeRule());
  }
}

/** @deprecated alias — use ensureCoreAutomationRecipesOnce */
export function ensureBillingAutomationRecipesOnce() {
  ensureCoreAutomationRecipesOnce();
}

export const AUTO_SEED_RECIPE_COUNT = CORE_EVENT_RECIPE_IDS.length + HUMAN_AUTOMATION_RECIPES.length;
