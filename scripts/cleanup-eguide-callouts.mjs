import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const GENERIC_WARN =
  'WARNING: Do not invent facts, fabricate exhibits, or mail myth language — inaccurate or false claims create legal and credibility risk.';
const GENERIC_KEY =
  'KEY: Partners who skip this playbook usually waste weeks on the wrong sequence, the wrong letter, or a funding app that underwriters will reject on optics alone.';
const GENERIC_TIP =
  'TIP: Re-pull or re-screenshot after every material response before you draft the next letter or application.';
const GENERIC_PARTNER = 'Partner rule: one claim, one bureau branch, one clear ask — then wait for the clock.';
const GENERIC_LOG =
  'TIP: Log the action and exhibit filenames in portal case notes before you move to the next branch.';

const WORTH_KEYS = {
  'primary-tradeline-insider':
    'KEY: Primary vs AU mistakes waste money and delay funding — know which signal your next underwriter actually counts.',
  'metro2-consistency-trap':
    'KEY: One internal contradiction + dated screenshots beats five emotional paragraphs every round.',
  'bureau-response-decoder':
    'KEY: Bureau letters are branch labels — match each outcome to one next action, not a shotgun follow-up.',
  'collections-proof-pack':
    'KEY: Collectors and bureaus respond to labeled exhibits — not memory. Build the pack once; reuse for months.',
  'permissible-purpose-scriptbook':
    'KEY: Hard inquiries you do not recognize need narrow authorization claims — soft promo pulls usually waste dispute energy.',
  'utilization-sniper-rules':
    'KEY: Statement-close balances move scores and underwriting optics — due-date payments alone are not enough.',
  'business-sequence-ladder':
    'KEY: Entity truth before vendor volume — most early denials are match failures, not "bad credit."',
  'ucc-article-3-primer':
    'KEY: Article 3 is about negotiable instruments — not a consumer bureau delete button or debt-discharge spell.',
  'strawman-myths-reality':
    'KEY: Courts and creditors respond to facts and deadlines — strawman catchphrases burn credibility and time.',
  'business-credit-jumpstart':
    'KEY: Fundable business files are sequenced: entity truth → bureau match → vendors → revolving → capital asks.',
  'loan-funding-sequence':
    'KEY: Personal and business funding share one inquiry and optics budget — stage the stack or underwriters see chaos.',
  'ai-dispute-workflows':
    'KEY: AI drafts; partners decide. Never mail invented dates, balances, or multi-claim mashups.',
  'combo-tradeline-ladder':
    'KEY: Age buckets target AAoA/oldest trade — they do not erase negatives or replace clean utilization.',
  'ucc1-business-filing-primer':
    'KEY: UCC-1 notices secure collateral interests — they are not FCRA dispute tools or personal debt erasers.',
  'smart-application-timing':
    'KEY: Apps are scarce — sequence them against reporting dates, inquiry budgets, and dispute freezes.',
  'funding-ready-underwriting-optics':
    'KEY: The first 90 seconds of manual review assign your risk bucket — make that glance boringly clean.',
  'inquiry-removal-advanced':
    'KEY: Permissible-purpose fights need authorization facts — fake "not mine" on pulls you caused creates legal risk.',
  'collections-validation-deep-dive':
    'KEY: Validation-first — challenge unvalidated or inaccurate debts before paying as the default path.',
  'metro2-k-segment-field-guide':
    'KEY: Remarks and K-segment comments are fields — quote them verbatim against conflicting status/balance data.',
  'eoscar-acdv-decoder':
    'KEY: Fast "verified" often means automated e-OSCAR confirm — Round 2 MOFV needs the same contradiction, sharpened.',
  'dofd-reaging-audit':
    'KEY: DOFD anchors most 7-year negative windows — date refresh after small payments is a high-ROI audit target.',
  'fraud-alert-funding-timing':
    'KEY: Freezes block pulls; alerts slow them — security settings silently kill funding when calendars ignore thaw windows.',
  'student-loan-metro2-playbook':
    'KEY: Student loans break generic templates — status, deferment remarks, and servicer transfers need field-level claims.',
  'bankruptcy-rebuild-sequencer':
    'KEY: Post-discharge accuracy first — fix wrong balances/status before myth-based "remove the bankruptcy" campaigns.',
  'certified-mail-evidence-system':
    'KEY: Third-party mail timestamps and labeled exhibits survive CFPB and counsel review — portal fog does not.',
  'round-2-method-verification':
    'KEY: "Verified" means the furnisher stood by existing data — unchanged contradictions earn a method-of-verification ask.',
  'vendor-tier-matrix-free':
    'KEY: Tier-1 reporters + early pay + spacing beat five same-week vendor apps that never post.',
  'debt-settlement-tax-traps':
    'KEY: Settlement is a later tool — validate, get written reporting terms, and budget for 1099-C risk before you pay.',
  'mortgage-overlay-dispute-prep':
    'KEY: Finish dispute flags and stage util before rate shopping — mid-process updates trigger re-underwriting delays.',
  'identity-theft-block-unblock':
    'KEY: Real FTC identity-theft blocks protect partners — false theft claims to erase accurate debts are fraud.',
};

function cleanGuide(g) {
  let warnKept = false;
  const sections = g.sections.map((sec, idx) => {
    let bullets = [...sec.bullets];
    bullets = bullets.filter((b) => {
      if (b === GENERIC_WARN) {
        if (warnKept) return false;
        warnKept = true;
        return true;
      }
      return true;
    });
    if (idx === 0 && WORTH_KEYS[g.id]) {
      const withoutGenericOrFirstKey = bullets.filter(
        (b, i) => b !== GENERIC_KEY && !(i === 0 && /^KEY\s*:/i.test(b)) && b !== WORTH_KEYS[g.id],
      );
      // Drop any remaining duplicate of the new worth KEY, then prepend
      bullets = [WORTH_KEYS[g.id], ...withoutGenericOrFirstKey.filter((b) => b !== WORTH_KEYS[g.id])];
    }
    if (bullets.length > 7) {
      bullets = bullets.filter((b) => b !== GENERIC_TIP && b !== GENERIC_PARTNER && b !== GENERIC_LOG);
    } else {
      let tipOnce = false;
      bullets = bullets.filter((b) => {
        if (b === GENERIC_TIP || b === GENERIC_LOG) {
          if (tipOnce) return false;
          tipOnce = true;
        }
        if (b === GENERIC_PARTNER && bullets.length > 5) return false;
        return true;
      });
    }
    const seen = new Set();
    bullets = bullets.filter((b) => {
      if (seen.has(b)) return false;
      seen.add(b);
      return true;
    });
    return { ...sec, bullets };
  });
  return { ...g, sections };
}

function esc(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, '\\n');
}

function emitGuide(g, indent = 2) {
  const sp = ' '.repeat(indent);
  const sp2 = ' '.repeat(indent + 2);
  const sp3 = ' '.repeat(indent + 4);
  const sp4 = ' '.repeat(indent + 6);
  let out = `${sp}{\n`;
  out += `${sp2}id: '${g.id}',\n`;
  out += `${sp2}title: '${esc(g.title)}',\n`;
  out += `${sp2}desc: '${esc(g.desc)}',\n`;
  out += `${sp2}sections: [\n`;
  for (const sec of g.sections) {
    out += `${sp3}{\n`;
    out += `${sp4}heading: '${esc(sec.heading)}',\n`;
    out += `${sp4}bullets: [\n`;
    for (const b of sec.bullets) {
      out += `${' '.repeat(indent + 8)}'${esc(b)}',\n`;
    }
    out += `${sp4}],\n`;
    out += `${sp3}},\n`;
  }
  out += `${sp2}],\n`;
  out += `${sp}}`;
  return out;
}

const dump = `
import { CORE_PARTNER_GUIDES } from './src/resources/corePartnerGuides.ts';
import { EXTENDED_FREE_GUIDES } from './src/resources/extendedFreeGuides.ts';
import fs from 'node:fs';
fs.writeFileSync('.tmp-guides-dump.json', JSON.stringify({ core: CORE_PARTNER_GUIDES, extended: EXTENDED_FREE_GUIDES }));
`;
fs.writeFileSync(path.join(root, '.tmp-dump-guides.ts'), dump);
const r = spawnSync('npx', ['tsx', '.tmp-dump-guides.ts'], { cwd: root, encoding: 'utf8', shell: true });
if (r.status !== 0) {
  console.error(r.stdout, r.stderr);
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(path.join(root, '.tmp-guides-dump.json'), 'utf8'));
const core = data.core.map(cleanGuide);
const extended = data.extended.map(cleanGuide);

fs.writeFileSync(
  path.join(root, 'src/resources/corePartnerGuides.ts'),
  `import type { FreeGuide } from './freeGuides';\n\n` +
    `/**\n * Core FREE_GUIDES bodies (excludes credit-dispute-letter-guide).\n` +
    ` * Full partner-facing education copy for PDF generation.\n */\n` +
    `export const CORE_PARTNER_GUIDES: FreeGuide[] = [\n` +
    core.map((g) => emitGuide(g)).join(',\n') +
    `\n];\n`,
);
fs.writeFileSync(
  path.join(root, 'src/resources/extendedFreeGuides.ts'),
  `import type { FreeGuide } from './freeGuides';\n\n` +
    `/** Premium education library — insider topics, partner-first voice. Educational only. */\n` +
    `export const EXTENDED_FREE_GUIDES: FreeGuide[] = [\n` +
    extended.map((g) => emitGuide(g)).join(',\n') +
    `\n];\n`,
);

fs.unlinkSync(path.join(root, '.tmp-dump-guides.ts'));
fs.unlinkSync(path.join(root, '.tmp-guides-dump.json'));

let warnCount = 0;
for (const g of [...core, ...extended]) {
  for (const s of g.sections) for (const b of s.bullets) if (b === GENERIC_WARN) warnCount++;
}
console.log('generic warn remaining', warnCount);
console.log('sample first KEY', core[0].sections[0].bullets.find((b) => b.startsWith('KEY:')));
console.log(
  JSON.stringify(
    {
      core: core.map((g) => ({ id: g.id, sections: g.sections.length, bullets: g.sections.reduce((n, s) => n + s.bullets.length, 0) })),
      extended: extended.map((g) => ({ id: g.id, sections: g.sections.length, bullets: g.sections.reduce((n, s) => n + s.bullets.length, 0) })),
    },
    null,
    2,
  ),
);
