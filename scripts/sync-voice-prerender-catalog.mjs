#!/usr/bin/env node
/**
 * Merge guide/ebook/course voice catalog entries from source files into
 * data/voice-prerender-catalog.json (preserves existing title/description).
 * Usage: npm run voice:catalog:sync
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const catalogPath = path.join(root, 'data/voice-prerender-catalog.json');

function extractGuideMeta(relPath) {
  const src = fs.readFileSync(path.join(root, relPath), 'utf8');
  const blocks = [...src.matchAll(/\{\s*\n\s*id:\s*'([^']+)'[\s\S]*?title:\s*'([^']+)'[\s\S]*?desc:\s*'([^']+)'/g)];
  return blocks.map((m) => ({ id: m[1], title: m[2], description: m[3] }));
}

function extractBookstoreSlugs() {
  const src = fs.readFileSync(path.join(root, 'src/data/bookstoreRichContent.ts'), 'utf8');
  const items = [...src.matchAll(/slug:\s*'([^']+)'[\s\S]*?title:\s*'([^']+)'[\s\S]*?subtitle:\s*'([^']+)'/g)];
  return items.map((m) => ({ id: m[1], title: m[2], description: m[3] }));
}

function extractCourseLessons() {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'data/course-voice-lessons.json'), 'utf8'));
  return (manifest.lessons ?? []).map((l) => ({
    id: l.contentId,
    title: l.title ?? l.contentId,
    description: l.description ?? '',
  }));
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const byKey = new Map((catalog.items ?? []).map((i) => [`${i.contentType}:${i.contentId}`, i]));

function upsert(contentType, { id, title, description }) {
  const key = `${contentType}:${id}`;
  const existing = byKey.get(key);
  if (existing) {
    if (!existing.title && title) existing.title = title;
    if (!existing.description && description) existing.description = description;
    return;
  }
  const item = { contentType, contentId: id, title, description };
  catalog.items.push(item);
  byKey.set(key, item);
}

for (const rel of ['src/resources/freeGuides.ts', 'src/resources/extendedFreeGuides.ts']) {
  for (const g of extractGuideMeta(rel)) upsert('guide', g);
}
for (const b of extractBookstoreSlugs()) upsert('ebook', b);
for (const l of extractCourseLessons()) upsert('course_lesson', l);

fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
console.log(`Voice catalog synced — ${catalog.items.length} items`);
