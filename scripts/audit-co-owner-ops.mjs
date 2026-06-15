#!/usr/bin/env node
/**
 * Tier 2146 — Co-owner ops + phone hub + validation clocks audit.
 * Usage: npm run coowner:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  'src/domain/coOwnerPersona.ts',
  'src/domain/coOwnerRoleMastery.ts',
  'src/domain/coOwnerKnowledgeArchive.ts',
  'src/lib/coOwnerOperatorEngine.ts',
  'src/lib/coOwnerAutomationRunner.ts',
  'src/lib/coOwnerTrainingBridge.ts',
  'src/domain/coOwnerExecutiveStructure.ts',
  'src/lib/coOwnerAutonomousHiring.ts',
  'src/lib/coOwnerDeepIntelligence.ts',
  'src/lib/coOwnerSiteKnowledgeMap.ts',
  'src/lib/coOwnerExecutionRegistry.ts',
  'src/lib/coOwnerDevStudio.ts',
  'src/lib/coOwnerDevActions.ts',
  'src/lib/coOwnerRuntimeContext.ts',
  'src/lib/coOwnerStaffActions.ts',
  'src/lib/validationLetterEngine.ts',
  'src/lib/debtWorkflowEngine.ts',
  'src/data/phoneThreadsRepo.ts',
  'src/components/coOwner/CoOwnerCommandCenter.tsx',
  'src/components/coOwner/CoOwnerDevStudioPanel.tsx',
  'src/pages/admin/AdminOpsAgentPage.tsx',
  'src/pages/admin/AdminPhoneHubPage.tsx',
];

console.log('Finely Cred — co-owner ops audit\n');

let failed = 0;
for (const rel of REQUIRED) {
  const ok = fs.existsSync(path.join(root, rel));
  console.log(`${ok ? '✓' : '✗'} ${rel}`);
  if (!ok) failed += 1;
}

const runner = fs.readFileSync(path.join(root, 'src/lib/coOwnerAutomationRunner.ts'), 'utf8');
const runnerOk =
  runner.includes('executeCoOwnerAutomationNow') &&
  runner.includes('validation_clocks') &&
  runner.includes('phone_sla') &&
  runner.includes('social_content_ops') &&
  runner.includes('auto_hire_staff') &&
  runner.includes('executive_org') &&
  runner.includes('site_map_scan') &&
  runner.includes('code_studio') &&
  runner.includes('superhuman_sweep') &&
  runner.includes('navigateTo');
console.log(`${runnerOk ? '✓' : '✗'} coOwnerAutomationRunner — executable automations + navigation`);
if (!runnerOk) failed += 1;

const cmd = fs.readFileSync(path.join(root, 'src/components/coOwner/CoOwnerCommandCenter.tsx'), 'utf8');
const cmdOk = cmd.includes('onNavigate') && cmd.includes('runCoOwnerAutomation');
console.log(`${cmdOk ? '✓' : '✗'} CoOwnerCommandCenter — navigate on automation execute`);
if (!cmdOk) failed += 1;

const phone = fs.readFileSync(path.join(root, 'src/pages/admin/AdminPhoneHubPage.tsx'), 'utf8');
const phoneOk = phone.includes('phoneThreadsRepo') && phone.includes('sendSms');
console.log(`${phoneOk ? '✓' : '✗'} AdminPhoneHubPage — threads repo + live SMS`);
if (!phoneOk) failed += 1;

const academy = fs.readFileSync(path.join(root, 'src/domain/trainingAcademy.ts'), 'utf8');
const academyOk = academy.includes('admin_staff_roles') && academy.includes('staff_setter_l1');
console.log(`${academyOk ? '✓' : '✗'} trainingAcademy — staff role mastery module`);
if (!academyOk) failed += 1;

const deep = fs.readFileSync(path.join(root, 'src/lib/coOwnerDeepIntelligence.ts'), 'utf8');
const deepOk =
  deep.includes('CO_OWNER_INTELLIGENCE_MULTIPLIER = 5') &&
  deep.includes('CO_OWNER_DEEP_LENSES') &&
  deep.includes('CO_OWNER_SYNTHESIS_PROTOCOL');
console.log(`${deepOk ? '✓' : '✗'} coOwnerDeepIntelligence — 5× nine-lens synthesis`);
if (!deepOk) failed += 1;

const runtime = fs.readFileSync(path.join(root, 'src/lib/coOwnerRuntimeContext.ts'), 'utf8');
const runtimeOk =
  runtime.includes('CO_OWNER_TESTING_DOCTRINE') &&
  runtime.includes('isCoOwnerTestingMode') &&
  runtime.includes('buildCoOwnerIntelligenceBrief');
console.log(`${runtimeOk ? '✓' : '✗'} coOwnerRuntimeContext — testing doctrine + deep brief`);
if (!runtimeOk) failed += 1;

const persona = fs.readFileSync(path.join(root, 'src/domain/coOwnerPersona.ts'), 'utf8');
const personaOk = persona.includes('intelligenceMultiplier: 5') && persona.includes('maxOutputTokens: 20_480');
console.log(`${personaOk ? '✓' : '✗'} coOwnerPersona — 5× AI tier config`);
if (!personaOk) failed += 1;

const siteMap = fs.readFileSync(path.join(root, 'src/lib/coOwnerSiteKnowledgeMap.ts'), 'utf8');
const siteOk = siteMap.includes('buildCoOwnerSiteSurfaces') && siteMap.includes('searchFinelyKnowledge');
console.log(`${siteOk ? '✓' : '✗'} coOwnerSiteKnowledgeMap — full site RAG map`);
if (!siteOk) failed += 1;

const devStudio = fs.readFileSync(path.join(root, 'src/lib/coOwnerDevStudio.ts'), 'utf8');
const devOk = devStudio.includes('upsertCoOwnerDevProject') && devStudio.includes('upsertCoOwnerAgentSpec');
console.log(`${devOk ? '✓' : '✗'} coOwnerDevStudio — code + agent workspace`);
if (!devOk) failed += 1;

const devActions = fs.readFileSync(path.join(root, 'src/lib/coOwnerDevActions.ts'), 'utf8');
const devActOk = devActions.includes('coowner-dev') && devActions.includes('save_code_project');
console.log(`${devActOk ? '✓' : '✗'} coOwnerDevActions — executable dev blocks`);
if (!devActOk) failed += 1;

const superOk = persona.includes('sp_code_studio') && persona.includes('sp_superhuman_run');
console.log(`${superOk ? '✓' : '✗'} coOwnerPersona — superhuman superpowers`);
if (!superOk) failed += 1;

const gateway = fs.readFileSync(path.join(root, 'supabase/functions/ai-gateway/index.ts'), 'utf8');
const gatewayOk =
  gateway.includes('return 20_480') &&
  gateway.includes('120_000') &&
  gateway.includes('claude-opus-4-20250514');
console.log(`${gatewayOk ? '✓' : '✗'} ai-gateway — 5× co-owner token/context limits`);
if (!gatewayOk) failed += 1;

if (failed) {
  console.error(`\n${failed} co-owner ops violation(s).`);
  process.exit(1);
}

console.log('\nCo-owner ops audit pass.');
