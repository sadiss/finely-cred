/** Client caller for the automation-blueprint-apply Edge Function (Phase 2). */
import { getAutomationBlueprint } from '../studioCommandOs/automationBlueprints';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { mergeAutomationRulesFromRemote } from '../../data/automationStudioRepo';
import type { AutomationRule } from '../../domain/automationStudio';

export type ApplyBlueprintServerSideResult = { ok: boolean; ruleId?: string; message: string };

/**
 * Sends a blueprint's node library to the server, which builds a real
 * trigger→wait→action flow graph and persists it (disabled, pending review)
 * to public.automation_rules. Pulls the created rule back into the local
 * automationStudioRepo store so it shows up in Automation Studio immediately.
 */
export async function applyAutomationBlueprintServerSide(blueprintId: string): Promise<ApplyBlueprintServerSideResult> {
  const blueprint = getAutomationBlueprint(blueprintId);
  if (!blueprint) return { ok: false, message: 'Unknown blueprint id' };
  if (!isSupabaseConfigured) return { ok: false, message: 'Supabase is not configured' };

  try {
    const { data, error } = await supabase.functions.invoke('automation-blueprint-apply', {
      body: { blueprintId: blueprint.id, title: blueprint.title, category: blueprint.category, nodes: blueprint.nodes },
    });
    if (error) return { ok: false, message: error.message };
    if (!data?.ok) return { ok: false, message: data?.error ?? 'Blueprint apply failed' };

    if (data.rule) mergeAutomationRulesFromRemote([data.rule as AutomationRule]);
    return { ok: true, ruleId: data.ruleId, message: data.message ?? 'Draft automation created — review before enabling.' };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Blueprint apply failed' };
  }
}
