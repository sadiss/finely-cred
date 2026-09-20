/**
 * CLI: run a local Partner Prospector batch (seed only; no invented contacts).
 *
 *   node --experimental-strip-types src/domain/partnerProspector/cli.ts --limit 12
 */
import { prospectReferralPartners } from './engine.ts';
import { prospectsToCsv } from './exportCsv.ts';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return fallback;
  return process.argv[i + 1] || fallback;
}

function argList(name: string): string[] | undefined {
  const raw = arg(name, '');
  if (!raw) return undefined;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

const limit = Number(arg('limit', '12'));
const metros = argList('metros');
const verticals = argList('verticals') as any;

const run = await prospectReferralPartners({
  limit,
  metros,
  verticals,
  dedupe: true,
  enrich: false,
});

const csv = prospectsToCsv(run.prospects);
const preview = run.prospects.slice(0, 8).map((p) => ({
  business_name: p.businessName,
  city: p.city,
  category: p.category,
  website: p.website,
  phone: p.phone || '',
  email: p.email || '',
  icp_fit: p.icpFit,
  why_fit: p.whyFit.slice(0, 90) + (p.whyFit.length > 90 ? '…' : ''),
}));

console.log(JSON.stringify({
  batchId: run.batchId,
  source: run.source,
  outreach: run.outreach,
  params: run.params,
  stats: run.stats,
  preview,
}, null, 2));
console.log('\n--- CSV (Batch schema) ---\n');
console.log(csv);
