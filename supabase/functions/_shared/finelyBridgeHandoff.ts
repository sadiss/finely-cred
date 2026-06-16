import { buildCreditProgram } from './finelyBridgeCreditProgram.ts';
import { BRIDGE_UNDERWRITING_TASKS, bridgeTaskRow, buildBridgeSuggestion } from './finelyBridgeTasks.ts';

export type FundReadyHandoffResult = {
  bridgeSuggestion: ReturnType<typeof buildBridgeSuggestion>;
  bridgeTasksCreated: number;
  bridgeHandoffSuggestedAt: string;
  creditPhase: string;
};

function buildReadinessScore(partner: any): number {
  const signals = partner.journey_signals && typeof partner.journey_signals === 'object' ? partner.journey_signals : {};
  let score = 20;
  const js = partner.journey_stage;
  if (js === 'letters' || js === 'mailing') score += 25;
  if (js === 'funding' || js === 'complete') score += 35;
  const legacyStatus = Number(signals.legacyApplicationStatus ?? 0);
  if (legacyStatus >= 7) score += 15;
  if (legacyStatus >= 10) score += 10;
  if (Number(signals.legacyReportCount ?? 0) > 0) score += 10;
  if (Number(signals.legacyLetterCount ?? 0) > 0) score += 10;
  return Math.min(100, score);
}

export async function handleFundReadyBridgeHandoff(admin: any, args: {
  partnerId?: string;
  email?: string;
  force?: boolean;
}): Promise<{ ok: false; error: string } | { ok: true; partnerId: string; result: FundReadyHandoffResult }> {
  const partnerId = String(args.partnerId ?? '').trim();
  const email = String(args.email ?? '').trim().toLowerCase();
  if (!partnerId && !email) return { ok: false, error: 'partnerId or email required' };

  let q = admin.from('partners').select('*');
  if (partnerId) q = q.eq('id', partnerId);
  else q = q.filter('profile->>email', 'eq', email);
  const { data: partner, error } = await q.maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!partner) return { ok: false, error: 'Partner not found' };

  const readinessScore = buildReadinessScore(partner);
  const creditProgram = buildCreditProgram({ partner, readinessScore });
  const fundReady = creditProgram.phase === 'fund_ready' || creditProgram.phase === 'bridge_handoff' || args.force;
  if (!fundReady) {
    return {
      ok: false,
      error: creditProgram.exportGateReason ?? 'Partner not fund-ready.',
    };
  }

  const now = new Date().toISOString();
  const signals = partner.journey_signals && typeof partner.journey_signals === 'object' ? { ...partner.journey_signals } : {};
  signals.bridgeHandoffSuggestedAt = now;
  signals.finelyCreditPhase = creditProgram.phase;
  signals.finelyCreditProgram = creditProgram;

  await admin
    .from('partners')
    .update({
      journey_signals: signals,
      funding_stage: partner.funding_stage === 'not_ready' ? 'ready' : partner.funding_stage,
      updated_at: now,
    })
    .eq('id', partner.id);

  let bridgeTasksCreated = 0;
  const batchAt = now;
  for (const template of BRIDGE_UNDERWRITING_TASKS) {
    const row = bridgeTaskRow(partner.id, template, batchAt);
    const { error: taskErr } = await admin.from('work_tasks').upsert(row, { onConflict: 'id', ignoreDuplicates: true });
    if (!taskErr) bridgeTasksCreated += 1;
  }

  const bridgeSuggestion = buildBridgeSuggestion(creditProgram.phase);

  return {
    ok: true,
    partnerId: partner.id,
    result: {
      bridgeSuggestion,
      bridgeTasksCreated,
      bridgeHandoffSuggestedAt: now,
      creditPhase: creditProgram.phase,
    },
  };
}

export async function buildBridgeOpsSnapshot(admin: any) {
  const { data: partners, error } = await admin.from('partners').select('*').order('updated_at', { ascending: false }).limit(200);
  if (error) throw new Error(error.message);

  const phaseDistribution: Record<string, number> = {};
  let fundReady = 0;
  let bridgeReady = 0;
  let handoffsPending = 0;
  const fundReadyQueue: Array<{ partnerId: string; fullName: string | null; score: number; suggestedAt: string | null }> = [];
  const recentHandoffs: Array<{ partnerId: string; fullName: string | null; at: string }> = [];

  for (const p of partners ?? []) {
    const score = buildReadinessScore(p);
    const program = buildCreditProgram({ partner: p, readinessScore: score });
    phaseDistribution[program.phase] = (phaseDistribution[program.phase] ?? 0) + 1;
    if (program.phase === 'fund_ready') {
      fundReady += 1;
      const signals = p.journey_signals ?? {};
      fundReadyQueue.push({
        partnerId: p.id,
        fullName: p.profile?.fullName ?? p.profile?.full_name ?? null,
        score,
        suggestedAt: signals.bridgeHandoffSuggestedAt ?? null,
      });
    }
    if (program.phase === 'bridge_handoff') bridgeReady += 1;
    const signals = p.journey_signals ?? {};
    if (signals.bridgeHandoffSuggestedAt && program.phase !== 'bridge_handoff') handoffsPending += 1;
    if (signals.bridgeHandoffSuggestedAt) {
      recentHandoffs.push({
        partnerId: p.id,
        fullName: p.profile?.fullName ?? p.profile?.full_name ?? null,
        at: signals.bridgeHandoffSuggestedAt,
      });
    }
  }

  recentHandoffs.sort((a, b) => b.at.localeCompare(a.at));

  return {
    kpis: { fundReady, bridgeReady, handoffsPending, phaseDistribution },
    fundReadyQueue: fundReadyQueue.slice(0, 25),
    recentHandoffs: recentHandoffs.slice(0, 15),
    exportedAt: new Date().toISOString(),
  };
}
