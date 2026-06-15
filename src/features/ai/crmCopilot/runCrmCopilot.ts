import type { CrmRecord } from '../../../domain/crmRecords';
import { getRecommendedPackageForRecord } from '../../../data/crmRecordsRepo';
import type { CrmCopilotResult } from '../schemas/crmCopilot';
import { callAiGateway } from '../../../lib/aiClient';
import { isFeatureEnabled } from '../../../data/settingsRepo';

function scoreLabel(score: number): CrmCopilotResult['scoreLabel'] {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}

function ruleBasedCrmCopilot(record: CrmRecord): CrmCopilotResult {
  let score = record.score ?? 30;
  if (record.stage === 'new') score += 10;
  if (record.stage === 'booked' || record.stage === 'replied') score += 20;
  if (record.attribution?.consentToContact === false) score -= 30;
  if (record.contact.email) score += 10;
  if (record.contact.phone) score += 5;
  score = Math.max(0, Math.min(100, score));

  const packages = getRecommendedPackageForRecord(record);
  const packageSuggestions = packages.slice(0, 3).map((p) => ({
    packageId: p!.id,
    name: p!.name,
    delivery: p!.delivery,
    reason: record.packageInterest ? `Interest: ${record.packageInterest}` : 'Default lane fit',
  }));

  const work = record.workSignals;

  let nextAction = 'Send intro + schedule strategy call';
  if (record.stage === 'contacted' || record.stage === 'outreach_sent') nextAction = 'Follow up within 48 hours';
  if (record.stage === 'booked') nextAction = 'Prepare pre-call brief + package options';
  if (record.stage === 'converted') nextAction = 'Hand off to Work OS delivery project';
  if (work?.slaBreachCount) nextAction = `Work OS: ${work.slaBreachCount} SLA breach(es) — review project tasks and client outreach`;
  else if (work?.riskLevel === 'high') nextAction = `Work OS idle ${Math.round(work.idleDays)}d — schedule check-in to prevent churn`;

  const convertPath =
    record.kind === 'inbound_lead'
      ? 'Convert → partner + instantiate service bundle from recommended package'
      : 'Convert prospect → partner when qualified';

  const name = record.contact.fullName?.split(' ')[0] || 'there';
  const outreachDraft = `Hi ${name},\n\nThanks for connecting with Finely Cred. Based on your goals, I'd recommend we start with ${packageSuggestions[0]?.name ?? 'a consultation'}.\n\nWould you have 15 minutes this week for a quick call?\n\n— Finely Cred Team`;

  const idleDays = (Date.now() - Date.parse(record.updatedAt)) / 86400000;
  let churnRisk: CrmCopilotResult['churnRisk'] = 'low';
  if (idleDays >= 14 && record.stage !== 'converted') churnRisk = 'high';
  else if (idleDays >= 7) churnRisk = 'medium';

  if (work?.riskLevel === 'high' && churnRisk !== 'high') churnRisk = 'high';
  else if (work?.riskLevel === 'medium' && churnRisk === 'low') churnRisk = 'medium';
  if (work?.slaBreachCount && work.slaBreachCount >= 2) churnRisk = 'high';

  const stageWeights: Record<string, number> = {
    new: 0.05, contacted: 0.25, outreach_sent: 0.2, replied: 0.4, booked: 0.6, converted: 1,
  };
  const forecastWeight = stageWeights[String(record.stage)] ?? 0.1;

  const objectionDraft =
    'I hear you on budget — many clients start with our DIY lane to prove momentum, then upgrade to DFY when they want us to run disputes and mail. Would a starter package at a lower monthly fit better for now?';

  return {
    source: 'rules',
    score,
    scoreLabel: scoreLabel(score),
    nextAction,
    convertPath,
    outreachDraft,
    packageSuggestions,
    churnRisk,
    forecastWeight,
    objectionDraft,
  };
}

export async function runCrmCopilot(record: CrmRecord): Promise<CrmCopilotResult> {
  const baseline = ruleBasedCrmCopilot(record);
  if (!isFeatureEnabled('aiGateway')) return baseline;

  try {
    const res = await callAiGateway({
      taskType: 'crm_copilot_mvp',
      responseFormat: 'json',
      context: { recordId: record.id, kind: record.kind, stage: record.stage },
      messages: [
        {
          role: 'system',
          content:
            'Return JSON: { score: 0-100, nextAction, convertPath, outreachDraft, packageIds: string[] }. packageIds must match provided list only.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            record: {
              kind: record.kind,
              stage: record.stage,
              target: record.target,
              contact: record.contact,
              interest: record.packageInterest,
            },
            packages: baseline.packageSuggestions.map((p) => p.packageId),
          }),
        },
      ],
    });
    const parsed = JSON.parse(res.text || '{}') as {
      score?: number;
      nextAction?: string;
      convertPath?: string;
      outreachDraft?: string;
      packageIds?: string[];
    };
    const allowed = new Set(baseline.packageSuggestions.map((p) => p.packageId));
    const packageSuggestions = baseline.packageSuggestions.filter((p) =>
      parsed.packageIds?.length ? parsed.packageIds.includes(p.packageId) : true,
    );

    return {
      source: 'ai',
      score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : baseline.score,
      scoreLabel: scoreLabel(typeof parsed.score === 'number' ? parsed.score : baseline.score),
      nextAction: parsed.nextAction || baseline.nextAction,
      convertPath: parsed.convertPath || baseline.convertPath,
      outreachDraft: parsed.outreachDraft || baseline.outreachDraft,
      packageSuggestions: packageSuggestions.length ? packageSuggestions : baseline.packageSuggestions,
      churnRisk: baseline.churnRisk,
      forecastWeight: baseline.forecastWeight,
      objectionDraft: baseline.objectionDraft,
    };
  } catch {
    return baseline;
  }
}
