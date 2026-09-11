#!/usr/bin/env node
/**
 * Copies locked Haitian desk portraits into public/staff-portraits.
 * Never pull these from RandomUser.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const from = path.join(root, 'scripts', 'haitian-portraits-locked');
const to = path.join(root, 'public', 'staff-portraits');

const IDS = [
  'staff-marie-claire-baptiste',
  'staff-nadege-pierre',
  'staff-farah-jean-louis',
  'staff-jean-marc-toussaint',
  'staff-samuel-augustin',
  'staff-patrick-saint-louis',
];

fs.mkdirSync(to, { recursive: true });
for (const id of IDS) {
  const src = path.join(from, `${id}.jpg`);
  const dest = path.join(to, `${id}.jpg`);
  if (!fs.existsSync(src)) {
    console.error(`Missing locked portrait: ${src}`);
    process.exit(1);
  }
  fs.copyFileSync(src, dest);
  console.log(`restored ${id}.jpg`);
}
