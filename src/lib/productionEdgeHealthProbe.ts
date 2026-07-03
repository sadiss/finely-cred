import { buildEdgeFunctionUrl } from './productionEdgeUrls';

export type EdgeHealthResult = {
  functionName: string;
  reachable: boolean;
  status?: number;
  detail: string;
};

export async function probeEdgeFunction(functionName: string): Promise<EdgeHealthResult> {
  const url = buildEdgeFunctionUrl(functionName);
  if (!url) {
    return { functionName, reachable: false, detail: 'VITE_SUPABASE_URL not set in .env' };
  }

  try {
    const res = await fetch(url, { method: 'OPTIONS' });
    const reachable = res.ok || res.status === 204 || res.status === 405 || res.status === 400;
    return {
      functionName,
      reachable,
      status: res.status,
      detail: reachable
        ? `Edge function responding (${res.status})`
        : `Unexpected status ${res.status} — verify deploy`,
    };
  } catch {
    return {
      functionName,
      reachable: false,
      detail: 'Unreachable — run supabase functions deploy',
    };
  }
}

export async function probeProductionEdgeFunctions(): Promise<EdgeHealthResult[]> {
  return Promise.all([
    probeEdgeFunction('email-webhook'),
    probeEdgeFunction('comms-oauth-callback'),
  ]);
}
