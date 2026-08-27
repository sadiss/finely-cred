/**
 * Brand + luxury patch for PartnerDetailPage.tsx.
 *
 * Repo convention forbids string-replacement tooling on this file, so compact
 * padding, colour rotation, and leftover amber fills are applied here instead.
 *
 * Run: node scripts/patch-partner-detail-colors.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, '..', 'src', 'pages', 'admin', 'PartnerDetailPage.tsx');

/** Exact-once replacements. `optional: true` skips already-applied colour patches. */
const replacements = [
  {
    label: 'back-to-partners nav button',
    optional: true,
    from: 'className="px-4 py-2 rounded-xl bg-amber-500 text-black"',
    to: 'className="px-4 py-2 rounded-xl bg-violet-600 text-white"',
  },
  {
    label: 'primary save CTA',
    optional: true,
    from:
      'className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"',
    to:
      'className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"',
  },
  {
    label: 'status badge pill',
    optional: true,
    from:
      'className="shrink-0 inline-flex items-center px-2 py-1 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest"',
    to:
      'className="shrink-0 inline-flex items-center px-2 py-1 rounded-full bg-sky-600 text-white text-[10px] font-black uppercase tracking-widest"',
  },
  {
    label: 'foreclosure centre card — selected state',
    optional: true,
    from: "? 'border-amber-400/40 bg-amber-500/15 ring-1 ring-amber-400/25'",
    to: "? 'border-violet-400/40 bg-violet-500/15 ring-1 ring-violet-400/25'",
  },
  {
    label: 'foreclosure centre card — idle state',
    optional: true,
    from: ": 'border-white/10 bg-black/25 hover:border-amber-400/20'",
    to: ": 'border-white/10 bg-black/25 hover:border-violet-400/20'",
  },
  {
    label: 'foreclosure centre title',
    optional: true,
    from: '<div className="text-amber-100 font-black">Foreclosure Center</div>',
    to: '<div className="text-violet-100 font-black">Foreclosure Center</div>',
  },
  {
    label: 'foreclosure centre kicker',
    optional: true,
    from: '<div className="mt-3 text-[10px] uppercase tracking-widest text-amber-200">UCC · RESPA</div>',
    to: '<div className="mt-3 text-[10px] uppercase tracking-widest text-violet-200">UCC · RESPA</div>',
  },
  {
    label: 'active report file panel',
    optional: true,
    from:
      'className="rounded-2xl border-2 border-amber-400/45 bg-gradient-to-br from-amber-500/15 via-orange-500/5 to-transparent p-4 md:p-6 shadow-[0_0_40px_rgba(251,191,36,0.12)] space-y-3"',
    to:
      'className="rounded-2xl border-2 border-sky-400/45 bg-gradient-to-br from-sky-500/15 via-violet-500/5 to-transparent p-6 lg:p-8 shadow-[0_0_40px_rgba(24,182,239,0.12)] space-y-3"',
  },
  {
    label: 'active report file kicker',
    optional: true,
    from:
      '<div className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-300">2 · Active report file</div>',
    to:
      '<div className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-300">2 · Active report file</div>',
  },
  {
    label: 'open stored report button',
    optional: true,
    from:
      'className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 shadow-[0_0_24px_rgba(251,191,36,0.35)]"',
    to:
      'className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] hover:brightness-110 shadow-[0_0_24px_rgba(15,199,141,0.35)]"',
  },

  // Luxury padding + family rotation. Catalog cards already ship p-6 lg:p-8 —
  // `!p-4` / `!p-5` were forcing them compact. Neighbors rotate emerald → violet → sky → rose.
  {
    label: 'message notice luxury',
    optional: true,
    from: "${finelyOsCatalogCard('sky')} !p-4 text-sm ${FINELY_OS_ENTITY_BODY}",
    to: "${finelyOsCatalogCard('sky')} text-base ${FINELY_OS_ENTITY_BODY}",
  },
  {
    label: 'create-task card emerald',
    optional: true,
    from: "${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3",
    to: "${finelyOsCatalogCard('emerald')} fc-surface-harmony space-y-3",
  },
  {
    label: 'tasks board drop compact',
    optional: true,
    from: "${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>\n                  <WorkBoardShell",
    to: "${finelyOsCatalogCard('violet')} space-y-4`}>\n                  <WorkBoardShell",
  },
  {
    label: 'empty tasks sky',
    optional: true,
    from: "${finelyOsCatalogCard('violet')} !p-5 ${FINELY_OS_ENTITY_BODY}`}>\n                      No tasks yet.",
    to: "${finelyOsCatalogCard('sky')} ${FINELY_OS_ENTITY_BODY}`}>\n                      No tasks yet.",
  },
  {
    label: 'notifications card rose',
    optional: true,
    from: "lg:col-span-5 ${finelyOsCatalogCard('violet')} !p-5 space-y-5",
    to: "lg:col-span-5 ${finelyOsCatalogCard('rose')} space-y-5",
  },
  {
    label: 'debt case context rose',
    optional: true,
    from: "${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>\n              <div>\n                <p className={FINELY_OS_ENTITY_SUBLABEL}>Debt case context</p>",
    to: "${finelyOsCatalogCard('rose')} space-y-4`}>\n              <div>\n                <p className={FINELY_OS_ENTITY_SUBLABEL}>Debt case context</p>",
  },
  {
    label: 'debt draft navy luxury pad',
    optional: true,
    from: 'className="rounded-2xl border border-white/10 bg-black/25 p-4 space-y-3"',
    to: 'className="rounded-2xl border border-white/10 bg-black/25 p-6 lg:p-8 space-y-3"',
  },
  {
    label: 'parsing-missing sky',
    optional: true,
    from: "${finelyOsCatalogCard('violet')} !p-5 space-y-3 w-full",
    to: "${finelyOsCatalogCard('sky')} space-y-3 w-full",
  },
  {
    label: 'upload-empty emerald',
    optional: true,
    from: "${finelyOsCatalogCard('violet')} !p-5 ${FINELY_OS_ENTITY_BODY} w-full",
    to: "${finelyOsCatalogCard('emerald')} ${FINELY_OS_ENTITY_BODY} w-full",
  },
  {
    label: 'analysis empty-report sky luxury',
    optional: true,
    from: "${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony ${FINELY_OS_ENTITY_BODY}",
    to: "${finelyOsCatalogCard('sky')} fc-surface-harmony ${FINELY_OS_ENTITY_BODY}",
  },
  {
    label: 'analysis notice violet',
    optional: true,
    from: "${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony text-sm ${FINELY_OS_ENTITY_BODY}",
    to: "${finelyOsCatalogCard('violet')} fc-surface-harmony text-base ${FINELY_OS_ENTITY_BODY}",
  },
  {
    label: 'analysis generate emerald',
    optional: true,
    from: "${finelyOsCatalogCard('violet')} !p-5 backdrop-blur-xl",
    to: "${finelyOsCatalogCard('emerald')} backdrop-blur-xl",
  },
  {
    label: 'letters vault sky',
    optional: true,
    from: "<details className={`${finelyOsCatalogCard('violet')} !p-5`} open>",
    to: "<details className={`${finelyOsCatalogCard('sky')}`} open>",
  },
  {
    label: 'strategy reports rose',
    optional: true,
    from: "mt-6 ${finelyOsCatalogCard('violet')} !p-5",
    to: "mt-6 ${finelyOsCatalogCard('rose')}",
  },
  {
    label: 'upload reports luxury pad',
    optional: true,
    from: 'border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent p-4 md:p-5 space-y-3',
    to: 'border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent p-6 lg:p-8 space-y-3',
  },
  {
    label: 'active report file luxury pad',
    optional: true,
    from: 'border-sky-400/45 bg-gradient-to-br from-sky-500/15 via-violet-500/5 to-transparent p-4 md:p-6 shadow-[0_0_40px_rgba(24,182,239,0.12)]',
    to: 'border-sky-400/45 bg-gradient-to-br from-sky-500/15 via-violet-500/5 to-transparent p-6 lg:p-8 shadow-[0_0_40px_rgba(24,182,239,0.12)]',
  },
  {
    label: 'credit intel rose luxury pad',
    optional: true,
    from: 'border-fuchsia-400/40 bg-gradient-to-br from-fuchsia-500/12 via-violet-500/5 to-transparent p-4 md:p-6 space-y-6',
    to: 'border-rose-400/40 bg-gradient-to-br from-rose-500/12 via-violet-500/5 to-transparent p-6 lg:p-8 space-y-6',
  },
  {
    label: 'credit intel kicker rose',
    optional: true,
    from: 'text-[11px] font-black uppercase tracking-[0.22em] text-fuchsia-300">3 · Credit Intelligence</div>',
    to: 'text-[11px] font-black uppercase tracking-[0.22em] text-rose-300">3 · Credit Intelligence</div>',
  },
  {
    label: 'notifications icon rose',
    optional: true,
    from: 'inline-flex items-center gap-2 text-violet-700">\n                    <Bell size={16} />',
    to: 'inline-flex items-center gap-2 text-rose-700">\n                    <Bell size={16} />',
  },

  // Path-picker / debt-row compact leftovers + readable pills.
  {
    label: 'path-picker luxury pad',
    times: 5,
    from: 'rounded-2xl border p-5 text-left transition min-h-[7.5rem]',
    to: 'rounded-2xl border p-6 lg:p-8 text-left transition min-h-[7.5rem]',
  },
  {
    label: 'path-picker kicker text',
    times: 5,
    from: 'mt-3 text-[10px] uppercase tracking-widest',
    to: 'mt-3 text-xs uppercase tracking-widest',
  },
  {
    label: 'court path sky (not fuchsia beside violet)',
    from: "? 'border-fuchsia-400/40 bg-fuchsia-500/15 ring-1 ring-fuchsia-400/25'",
    to: "? 'border-sky-400/40 bg-sky-500/15 ring-1 ring-sky-400/25'",
  },
  {
    label: 'court path sky hover',
    from: ": 'border-white/10 bg-black/25 hover:border-fuchsia-400/20'",
    to: ": 'border-white/10 bg-black/25 hover:border-sky-400/20'",
  },
  {
    label: 'court path title sky',
    from: '<div className="text-fuchsia-100 font-black">Affidavit & Court Center</div>',
    to: '<div className="text-sky-100 font-black">Affidavit & Court Center</div>',
  },
  {
    label: 'court path kicker sky',
    from: 'text-fuchsia-200">{courtLetters.length} saved</div>',
    to: 'text-sky-200">{courtLetters.length} saved</div>',
  },
  {
    label: 'debt row drop compact zero-pad',
    from: '${finelyOsInlineListItem()} !p-0 overflow-hidden',
    to: '${finelyOsInlineListItem()} !p-6 overflow-hidden',
  },
  {
    label: 'debt row inner luxury pad',
    from: 'className="p-4 flex items-center justify-between gap-4"',
    to: 'className="flex items-center justify-between gap-4"',
  },
  {
    label: 'debt row court footer pad',
    from: 'className="px-4 pb-4 space-y-2 border-t border-white/10 pt-3"',
    to: 'className="pt-4 space-y-2 border-t border-white/10"',
  },
  {
    label: 'debt court-plan chip',
    from: 'shrink-0 rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-fuchsia-200/90',
    to: 'shrink-0 rounded-xl border border-violet-400/30 bg-violet-500/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-violet-200/90',
  },
  {
    label: 'debt context chip',
    from: 'shrink-0 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/45',
    to: 'shrink-0 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-black uppercase tracking-widest text-white/45',
  },
  {
    label: 'create-task CTA type size',
    from: 'rounded-xl bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all',
    to: 'rounded-xl bg-emerald-600 text-white font-black uppercase tracking-widest text-xs hover:brightness-110 transition-all',
  },
  {
    label: 'notification new pill type size',
    from: 'rounded-full bg-sky-600 text-white text-[10px] font-black uppercase tracking-widest',
    to: 'rounded-full bg-sky-600 text-white text-xs font-black uppercase tracking-widest',
  },
  {
    label: 'open stored report CTA type size',
    from: 'rounded-xl bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] hover:brightness-110 shadow-[0_0_24px_rgba(15,199,141,0.35)]',
    to: 'rounded-xl bg-emerald-600 text-white font-black uppercase tracking-widest text-xs hover:brightness-110 shadow-[0_0_24px_rgba(15,199,141,0.35)]',
  },
];

const raw = readFileSync(target, 'utf8');
const usesCrlf = raw.includes('\r\n');
let source = raw.replace(/\r\n/g, '\n');
const failures = [];
const applied = [];
const skipped = [];

for (const { label, from, to, optional, times } of replacements) {
  const expected = times ?? 1;
  const count = source.split(from).length - 1;
  if (count === 0 && optional) {
    skipped.push(label);
    continue;
  }
  if (count !== expected) {
    failures.push(`${label}: expected exactly ${expected} match${expected === 1 ? '' : 'es'}, found ${count}`);
    continue;
  }
  source = times ? source.split(from).join(to) : source.replace(from, to);
  applied.push(label);
}

if (failures.length > 0) {
  console.error('Aborted — no changes written:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

writeFileSync(target, usesCrlf ? source.replace(/\n/g, '\r\n') : source, 'utf8');
console.log(`Patched PartnerDetailPage.tsx (${applied.length} applied, ${skipped.length} already done)`);
for (const label of applied) console.log(`  + ${label}`);
if (skipped.length) {
  console.log('Already applied:');
  for (const label of skipped) console.log(`  · ${label}`);
}
