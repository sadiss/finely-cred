#!/usr/bin/env node
/**
 * Prove local HEAD can be traced to GitHub before a production build.
 * Usage:
 *   npm run release:parity
 *   node scripts/prove-github-parity.mjs --require-clean
 *   node scripts/prove-github-parity.mjs --require-pushed
 *   node scripts/prove-github-parity.mjs --against origin/launch/ready-sovereign-supreme
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { gitText, parseLeftRight, readReleaseIdentity } from './releaseIdentity.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requireClean = process.argv.includes('--require-clean');
const requirePushed = process.argv.includes('--require-pushed');
const againstIdx = process.argv.indexOf('--against');
const againstRef = againstIdx >= 0 ? process.argv[againstIdx + 1] : 'origin/launch/ready-sovereign-supreme';

console.log('Finely Cred — GitHub release parity\n');

const identity = readReleaseIdentity(root);
if (identity.sha === 'UNKNOWN') {
  console.error('✗ git SHA unavailable — refuse to freeze a release without git');
  process.exit(1);
}

console.log(`SHA:      ${identity.sha}`);
console.log(`Short:    ${identity.shortSha}`);
console.log(`Branch:   ${identity.branch}`);
console.log(`Dirty:    ${identity.dirty ? 'yes' : 'no'}`);
console.log(`Upstream: ${identity.upstream || '(none)'}`);
if (identity.ahead != null && identity.behind != null) {
  console.log(`vs upstream (behind ahead): ${identity.behind} ${identity.ahead}`);
} else {
  console.log('vs upstream (behind ahead): unavailable');
}
console.log(`Migrations: ${identity.migrationCount}`);

let failed = 0;

if (requireClean && identity.dirty) {
  console.error('\n✗ worktree is dirty — commit or restore before freezing a release SHA');
  failed += 1;
} else if (!identity.dirty) {
  console.log('✓ worktree clean');
}

if (requirePushed) {
  if (!identity.upstream) {
    console.error('✗ no upstream tracking branch — push with git push -u before freeze');
    failed += 1;
  } else if (identity.behind !== 0 || identity.ahead !== 0) {
    console.error(`✗ local HEAD does not match ${identity.upstream} (need 0 0, got ${identity.behind} ${identity.ahead})`);
    failed += 1;
  } else {
    console.log(`✓ local HEAD equals ${identity.upstream} (0 0)`);
  }
}

if (againstRef) {
  const exists = gitText(root, ['rev-parse', '--verify', againstRef]);
  if (!exists) {
    console.log(`○ ${againstRef} not present locally — skip comparison`);
  } else {
    const cmp = parseLeftRight(root, againstRef);
    if (!cmp) {
      console.error(`✗ could not compare HEAD to ${againstRef}`);
      failed += 1;
    } else {
      console.log(`vs ${againstRef} (behind ahead): ${cmp.behind} ${cmp.ahead}`);
    }
  }
}

if (failed) {
  console.error(`\n${failed} parity check(s) failed.`);
  process.exit(1);
}

console.log('\nRelease identity recorded.');
