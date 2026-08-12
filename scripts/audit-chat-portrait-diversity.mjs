#!/usr/bin/env node
/**
 * Audit public chat portrait diversity — curated marketing pools per coach role.
 * Usage: node scripts/audit-chat-portrait-diversity.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rosterPath = path.join(root, 'src/data/staffRoster.ts');
const src = fs.readFileSync(rosterPath, 'utf8');

const blackMatch = src.match(/MARKETING_BLACK_STAFF_IDS = new Set\(\[([\s\S]*?)\]\)/);
const asianMatch = src.match(/MARKETING_ASIAN_STAFF_IDS = new Set\(\[([\s\S]*?)\]\)/);
const displayStart = src.indexOf('MARKETING_DISPLAY_BY_ROLE');
const displayBlock =
  displayStart >= 0 ? src.slice(displayStart, displayStart + 4000) : '';

if (!blackMatch || !asianMatch || !displayBlock.includes('finely_advisor')) {
  console.error('Could not parse staffRoster marketing constants');
  process.exit(1);
}

const parseIds = (block) =>
  [...block.matchAll(/'([^']+)'/g)].map((m) => m[1]).filter((id) => id.startsWith('staff-'));

const blackIds = new Set(parseIds(blackMatch[1]));
const asianIds = new Set(parseIds(asianMatch[1]));
const roleBlocks = [...displayBlock.matchAll(/(\w+):\s*\[([^\]]+)\]/g)];

const coachRoles = [
  'finely_advisor',
  'dispute_coach',
  'funding_strategist',
  'debt_strategist',
  'education_coach',
  'support_specialist',
  'nurture_concierge',
];

console.log('Finely Cred — public chat portrait diversity audit\n');

let failed = 0;
let totalBlack = 0;
let totalAsian = 0;

for (const role of coachRoles) {
  const block = roleBlocks.find((m) => m[1] === role);
  if (!block) {
    console.log(`✗ ${role}: missing MARKETING_DISPLAY_BY_ROLE entry`);
    failed += 1;
    continue;
  }
  const ids = parseIds(block[2]);
  const black = ids.filter((id) => blackIds.has(id)).length;
  const asian = ids.filter((id) => asianIds.has(id)).length;
  totalBlack += black;
  totalAsian += asian;
  const ok = black >= 2 && asian >= 1;
  console.log(`${ok ? '✓' : '✗'} ${role}: ${ids.length} faces · ${black} Black · ${asian} Asian`);
  if (!ok) failed += 1;
}

const usesCurated = src.includes('listMarketingDisplayStaff(roleId, 6)');
console.log(`\nresolveStaffOnDuty uses curated pool: ${usesCurated ? '✓' : '✗'}`);
if (!usesCurated) failed += 1;

console.log(`\nCoach roles aggregate: ${totalBlack} Black slots · ${totalAsian} Asian slots`);
console.log(failed ? `\n${failed} check(s) failed` : '\nAll diversity checks passed');
process.exit(failed ? 1 : 0);
