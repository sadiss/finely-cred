import type { CmoBrief } from '../../domain/cmoPhase3';
import { listCmoChannelModels, listCmoExperiments, listCmoPlaybooks, listCmoRuns, saveCmoBrief } from '../../data/cmoPhase3Repo';
import { buildTwoHundredLeadQuotaPlan, summarizeLeadQuota } from './cmoLeadQuotaEngine';

export function generateDailyCmoBrief(): CmoBrief {
  const playbooks = listCmoPlaybooks();
  const experiments = listCmoExperiments();
  const runs = listCmoRuns();
  const model = listCmoChannelModels().sort((a, b) => b.confidence - a.confidence);
  const leadMath = buildTwoHundredLeadQuotaPlan(200);
  const summary = summarizeLeadQuota(leadMath);
  return saveCmoBrief({
    cadence: 'daily',
    title: 'CMO Daily Growth Brief',
    summary: `Target: ${summary.totalLeads} leads, ${summary.projectedQualifiedLeads} qualified, ${summary.projectedBookedCalls} booked calls. The machine should focus on ${summary.topChannels.map((item) => item.channel).join(', ')} today.`,
    wins: [
      experiments.find((item) => item.status === 'winner_found')?.recommendation || 'No confirmed winner yet; testing must continue.',
      runs[0]?.executiveSummary || 'No autopilot run has been staged yet.',
    ],
    problems: [
      playbooks.length ? 'Playbooks exist; now they need approvals, assets, and distribution.' : 'No playbooks saved. Load the default playbooks first.',
      'External publishing must remain approval-first until provider credentials and policies are confirmed.',
    ],
    opportunities: [
      `Highest confidence channel: ${model[0]?.channel || 'not enough data yet'}.`,
      'Turn every hot comment into CRM stage movement and a Comms follow-up task.',
      'Create more proof assets, but keep claims safe and specific.',
    ],
    killList: ['Generic posts with no CTA', 'Hooks with no pain point', 'Claims that sound like guarantees'],
    scaleList: ['Short-form videos that create comments', 'Affiliate/partner outreach that gets replies', 'Business funding readiness angles'],
    todayOrders: [
      'Approve the highest-priority playbook.',
      'Create 3 short-form assets and 1 authority post.',
      'Run inbox triage and route hot leads to CRM.',
      'Build one Comms sequence from the best campaign.',
      'Review Site Watch changes before publishing new pages.',
    ],
    leadMath,
  });
}
