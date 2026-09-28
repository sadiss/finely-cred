#!/usr/bin/env node
/**
 * Shared git/release identity for deploy handoff, dist verify, and parity checks.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export function gitText(root, args) {
  const res = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (res.status !== 0) return null;
  return (res.stdout || '').trim();
}

export function listMigrationFiles(root) {
  const migrationsDir = path.join(root, 'supabase/migrations');
  if (!fs.existsSync(migrationsDir)) return [];
  return fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
}

export function readReleaseIdentity(root) {
  const sha = gitText(root, ['rev-parse', 'HEAD']);
  const shortSha = gitText(root, ['rev-parse', '--short=12', 'HEAD']);
  const branch = gitText(root, ['rev-parse', '--abbrev-ref', 'HEAD']);
  const status = gitText(root, ['status', '--porcelain']);
  const upstream = gitText(root, ['rev-parse', '--abbrev-ref', '@{upstream}']);
  let ahead = null;
  let behind = null;
  if (upstream) {
    const counts = gitText(root, ['rev-list', '--left-right', '--count', `${upstream}...HEAD`]);
    if (counts) {
      const [left, right] = counts.split(/\s+/);
      behind = Number(left);
      ahead = Number(right);
    }
  }
  const migrationFiles = listMigrationFiles(root);
  return {
    sha: sha || 'UNKNOWN',
    shortSha: shortSha || 'UNKNOWN',
    branch: branch || 'UNKNOWN',
    dirty: Boolean(status && status.length),
    upstream: upstream || null,
    ahead,
    behind,
    generatedAt: new Date().toISOString(),
    migrationCount: migrationFiles.length,
    migrationFiles,
  };
}

export function parseLeftRight(root, ref) {
  const counts = gitText(root, ['rev-list', '--left-right', '--count', `${ref}...HEAD`]);
  if (!counts) return null;
  const [left, right] = counts.split(/\s+/);
  return { behind: Number(left), ahead: Number(right), ref };
}
