/** Client-side provider routing — server ai-gateway picks model tier from taskType. */

export type AiProviderHint = 'openai' | 'gemini' | 'anthropic';

export function resolveAiProviderHint(taskType: string, explicit?: AiProviderHint): AiProviderHint {
  if (explicit) return explicit;
  const t = (taskType || '').toLowerCase();
  if (t.includes('coowner') || t.includes('ops.coowner') || t.includes('ops.agent')) return 'anthropic';
  if (
    t.includes('lead_intel') ||
    t.includes('doc') ||
    t.includes('extract') ||
    t.includes('classify') ||
    t.includes('vision') ||
    t.includes('ocr')
  ) {
    return 'gemini';
  }
  if (t.includes('legal') || t.includes('compliance') || t.includes('policy') || t.includes('admin_ops')) {
    return 'anthropic';
  }
  return 'openai';
}
