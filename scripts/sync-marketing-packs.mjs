#!/usr/bin/env node
/**
 * Copy docs/sales-packs/finely → public/marketing-packs/finely for Preview/Download URLs.
 * Patches broken logo paths in HTML one-sheets to /brand/*.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'docs/sales-packs/finely');
const dest = join(root, 'public/marketing-packs/finely');

function copyRecursive(from, to) {
  mkdirSync(to, { recursive: true });
  for (const name of readdirSync(from, { withFileTypes: true })) {
    const f = join(from, name.name);
    const t = join(to, name.name);
    if (name.isDirectory()) copyRecursive(f, t);
    else cpSync(f, t);
  }
}

if (!existsSync(src)) {
  console.warn('[sync-marketing-packs] source missing:', src);
  process.exit(0);
}

copyRecursive(src, dest);

const htmlDir = join(dest, 'html-one-sheets');
if (existsSync(htmlDir)) {
  for (const file of readdirSync(htmlDir)) {
    if (!file.endsWith('.html')) continue;
    const path = join(htmlDir, file);
    let html = readFileSync(path, 'utf8');
    html = html
      .replace(/\.\.\/\.\.\/\.\.\/\.\.\/public\/brand\//g, '/brand/')
      .replace(/\.\.\/\.\.\/public\/brand\//g, '/brand/')
      .replace(/finely-cred-logo-dark\.png/g, 'finely-cred-mark.png');
    if (!html.includes('fc-cred-bar') && html.includes('class="fc-sheet"')) {
      html = html.replace(
        /<article class="fc-sheet">/,
        `<article class="fc-sheet">
    <div class="fc-cred-bar"><span><strong>Finely Cred</strong> · restore &amp; file accuracy</span><span>Educational · not legal advice</span></div>`,
      );
    }
    if (!html.includes('fc-medallion') && html.includes('class="fc-logo"')) {
      html = html.replace(
        /<header class="fc-logo">/,
        `<header class="fc-logo"><img class="fc-medallion" src="/brand/finely-cred-mark.png" alt="" width="52" height="52" />`,
      );
    }
    writeFileSync(path, html);
  }
}

console.log('[sync-marketing-packs] synced → public/marketing-packs/finely');
