import type { NoraFundingDossierV6 } from './noraFundingDossierV6.ts';

export type NoraDossierPushResult = {
  ok: boolean;
  status?: number;
  eventId?: string;
  error?: string;
  errorCode?: string;
  hint?: string;
  attempts?: number;
  durationMs?: number;
  responseBody?: string;
};

function dossierSummary(dossier: NoraFundingDossierV6) {
  return {
    exportId: dossier.exportId,
    partnerId: dossier.partnerId,
    externalId: dossier.externalId,
    exportedAt: dossier.exportedAt,
    version: dossier.version,
    readinessScore: dossier.readiness.score,
    fundingVerdict: dossier.resultsSummary.fundingReadinessVerdict,
    lenderVerdict: dossier.lenderReadiness.verdict,
    creditPhase: dossier.creditProgram.phase,
    headline: dossier.executiveBrief.headline,
    doThisNext: dossier.executiveBrief.doThisNext,
    scorecard: dossier.executiveBrief.scorecard,
    keyMetrics: dossier.resultsSummary.keyMetrics,
    complianceScore: dossier.compliance.score,
    exportReady: dossier.compliance.exportReady,
    nextStepCount: dossier.nextSteps.length,
    topNextSteps: dossier.nextSteps.slice(0, 5).map((s) => s.action),
    blockers: dossier.readiness.blockers,
    estimatedWeeksToFundable: dossier.lenderReadiness.estimatedWeeksToFundable,
  };
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

export async function pushNoraFundingDossier(args: {
  dossier: NoraFundingDossierV6;
  clientId?: string;
  idempotencyKey?: string;
  maxAttempts?: number;
}): Promise<NoraDossierPushResult> {
  const started = Date.now();
  const baseUrl = (Deno.env.get('NORA_CAPITAL_BASE_URL') || '').trim().replace(/\/$/, '');
  if (!baseUrl) {
    return {
      ok: false,
      error: 'Nora Capital is not configured on the server.',
      errorCode: 'nora_not_configured',
      hint: 'Set NORA_CAPITAL_BASE_URL in Supabase Edge Function secrets.',
    };
  }

  const secret =
    (Deno.env.get('FINELY_CRED_WEBHOOK_SECRET') || '').trim() ||
    (Deno.env.get('NORA_CAPITAL_WEBHOOK_SECRET') || '').trim();

  const clientId = String(
    args.clientId || args.dossier.externalId || args.dossier.partnerId || '',
  ).trim();

  const payload = {
    event: 'finelycred.dossier_exported',
    type: 'finelycred.dossier_exported',
    clientId,
    client_id: clientId,
    externalId: clientId,
    partnerId: args.dossier.partnerId,
    phase: args.dossier.creditProgram.phase,
    data: {
      summary: dossierSummary(args.dossier),
      dossier: args.dossier,
      brief: args.dossier.executiveBrief,
    },
    exportedAt: args.dossier.exportedAt,
    version: args.dossier.version,
  };

  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-FinelyCred-Version': String(args.dossier.version),
  };
  if (secret) {
    headers['X-FinelyCred-Signature'] = secret;
    headers['X-Webhook-Secret'] = secret;
  }
  const idem = args.idempotencyKey || args.dossier.exportId;
  if (idem) headers['X-Idempotency-Key'] = idem;

  const url = `${baseUrl}/v1/partners/finelycred/webhook`;
  const maxAttempts = Math.min(4, Math.max(1, args.maxAttempts ?? 3));
  let lastError = 'Push failed';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, { method: 'POST', headers, body });
      const text = await res.text();
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(text);
      } catch {
        /* raw */
      }

      if (res.ok) {
        return {
          ok: true,
          status: res.status,
          eventId: parsed.eventId ? String(parsed.eventId) : undefined,
          attempts: attempt,
          durationMs: Date.now() - started,
          responseBody: text.slice(0, 4000),
        };
      }

      lastError = String(parsed.error || parsed.message || `HTTP ${res.status}`);
      const retryable = res.status >= 500 || res.status === 429;
      if (!retryable || attempt === maxAttempts) {
        return {
          ok: false,
          status: res.status,
          error: lastError,
          errorCode: String(parsed.error || 'nora_push_failed'),
          hint: res.status === 401
            ? 'Check FINELY_CRED_WEBHOOK_SECRET matches Nora gateway FINELY_CRED_WEBHOOK_SECRET.'
            : res.status === 404
              ? 'Verify NORA_CAPITAL_BASE_URL points to the Nora gateway host.'
              : 'Retry with the same exportId/idempotency key.',
          attempts: attempt,
          durationMs: Date.now() - started,
          responseBody: text.slice(0, 4000),
        };
      }
    } catch (e) {
      lastError = (e as Error).message || 'Network error';
      if (attempt === maxAttempts) {
        return {
          ok: false,
          error: lastError,
          errorCode: 'network_error',
          hint: 'Nora gateway unreachable — verify NORA_CAPITAL_BASE_URL and network egress.',
          attempts: attempt,
          durationMs: Date.now() - started,
        };
      }
    }
    await sleep(400 * attempt);
  }

  return { ok: false, error: lastError, attempts: maxAttempts, durationMs: Date.now() - started };
}
