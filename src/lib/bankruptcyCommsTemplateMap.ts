/** Scenario → comms template IDs for bankruptcy lane automation. */

export type BankruptcyCommsTemplateBundle = { email?: string; sms?: string };

export const BANKRUPTCY_SCENARIO_TEMPLATE_MAP: Record<string, BankruptcyCommsTemplateBundle> = {
  save_home_foreclosure: { email: 'tpl_bk_save_home', sms: 'sms_bk_home_urgent' },
  fresh_start_ch7: { email: 'tpl_bk_fresh_start_ch7', sms: 'sms_bk_nurture' },
  ch13_catch_up: { email: 'tpl_bk_ch13_cure', sms: 'sms_bk_home_urgent' },
  stop_harassment: { email: 'tpl_bk_stop_harassment', sms: 'sms_bk_nurture' },
  business_reorg: { email: 'tpl_bk_business_ch11', sms: 'sms_bk_nurture' },
  fix_credit_after: { email: 'tpl_bk_post_discharge_credit', sms: 'sms_bk_nurture' },
};

export function resolveBankruptcyScenarioTemplates(scenarioId: string): BankruptcyCommsTemplateBundle {
  return BANKRUPTCY_SCENARIO_TEMPLATE_MAP[scenarioId] ?? { email: 'tpl_bk_fresh_start_ch7', sms: 'sms_bk_nurture' };
}
