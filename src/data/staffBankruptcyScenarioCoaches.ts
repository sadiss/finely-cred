/** Dedicated bankruptcy liberation path → specialist staff IDs (expansion roster). */

export const BANKRUPTCY_SCENARIO_COACH_IDS: Record<string, string> = {
  save_home_foreclosure: 'staff-alicia-morris',
  fresh_start_ch7: 'staff-kenya-wells',
  ch13_catch_up: 'staff-alicia-morris',
  stop_harassment: 'staff-monique-baker',
  business_reorg: 'staff-andre-coleman',
  fix_credit_after: 'staff-tiffany-nguyen',
};

export function resolveStaffIdForBankruptcyScenario(scenarioId: string): string | null {
  return BANKRUPTCY_SCENARIO_COACH_IDS[scenarioId] ?? null;
}
