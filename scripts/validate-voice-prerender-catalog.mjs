#!/usr/bin/env node
/**
 * Validate voice-prerender-catalog.json covers all free guides + bookstore ebooks + course intro lessons.
 * Usage: npm run voice:catalog:check
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function extractGuideIds(relPath) {
  const src = fs.readFileSync(path.join(root, relPath), 'utf8');
  return [...src.matchAll(/^\s+id:\s*'([^']+)'/gm)].map((m) => m[1]);
}

function extractBookstoreSlugs() {
  const src = fs.readFileSync(path.join(root, 'src/data/bookstoreRichContent.ts'), 'utf8');
  return [...src.matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1]);
}

function extractCourseLessonIds() {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'data/course-voice-lessons.json'), 'utf8'));
  return (manifest.lessons ?? []).map((l) => l.contentId);
}

const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/voice-prerender-catalog.json'), 'utf8'));
const catalogIds = new Set((catalog.items ?? []).map((i) => `${i.contentType}:${i.contentId}`));

const expectedGuides = [...new Set([...extractGuideIds('src/resources/freeGuides.ts'), ...extractGuideIds('src/resources/extendedFreeGuides.ts')])];
const expectedEbooks = extractBookstoreSlugs();
const expectedCourseLessons = extractCourseLessonIds();

let failed = 0;

console.log('Voice prerender catalog validation\n');

for (const id of expectedGuides) {
  const key = `guide:${id}`;
  const ok = catalogIds.has(key);
  console.log(`${ok ? '✓' : '✗'} guide:${id}`);
  if (!ok) failed += 1;
}

for (const slug of expectedEbooks) {
  const key = `ebook:${slug}`;
  const ok = catalogIds.has(key);
  console.log(`${ok ? '✓' : '✗'} ebook:${slug}`);
  if (!ok) failed += 1;
}

for (const contentId of expectedCourseLessons) {
  const key = `course_lesson:${contentId}`;
  const ok = catalogIds.has(key);
  console.log(`${ok ? '✓' : '✗'} course_lesson:${contentId}`);
  if (!ok) failed += 1;
}

const minItems = expectedGuides.length + expectedEbooks.length + expectedCourseLessons.length;
const itemCount = catalog.items?.length ?? 0;
console.log(`\nCatalog items: ${itemCount} (expected ≥ ${minItems})`);
if (itemCount < minItems) failed += 1;

console.log(failed ? `\n${failed} catalog gap(s) — update data/voice-prerender-catalog.json` : '\nVoice catalog complete.');
process.exit(failed ? 1 : 0);
