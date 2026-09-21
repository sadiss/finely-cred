import React, { useEffect, useMemo, useState } from 'react';
import { Clipboard, Download, Flame, Import, Snowflake, Sun } from 'lucide-react';
import type { WarmProspectHeat, WarmProspectSource } from '../../domain/warmProspects';
import {
  ensureAnnaCharlotinLibraryCase,
  importWarmProspectsFromRows,
  listWarmProspects,
  patchWarmProspect,
} from '../../data/warmProspectsRepo';
import { WARM_SEQUENCE_DRAFTS, getWarmSequenceDraft } from '../../data/warmProspectSequences';
import { KpiCard } from '../../components/ui';

const LIBRARY_CSV = import.meta.glob('../../../docs/warm-prospects/*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const out: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = cols[j] ?? '';
    });
    out.push(row);
  }
  return out;
}

const HEAT: { value: WarmProspectHeat | 'all'; label: string }[] = [
  { value: 'all', label: 'All heat' },
  { value: 'warm', label: 'Warm' },
  { value: 'nurture', label: 'Nurture' },
  { value: 'hot', label: 'Hot' },
];

export function WarmProspectsPanel() {
  useEffect(() => {
    ensureAnnaCharlotinLibraryCase();
  }, []);
  const [version, setVersion] = useState(0);
  const [q, setQ] = useState('');
  const [heat, setHeat] = useState<WarmProspectHeat | 'all'>('all');
  const [source, setSource] = useState<WarmProspectSource | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  React.useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const list = useMemo(() => listWarmProspects({ q, heat, source }), [q, heat, source, version]);
  const selected = useMemo(() => list.find((p) => p.id === selectedId) ?? null, [list, selectedId]);

  const kpis = useMemo(() => {
    const all = listWarmProspects();
    return {
      total: all.length,
      hot: all.filter((p) => p.heat === 'hot').length,
      nurture: all.filter((p) => p.heat === 'nurture').length,
      library: all.filter((p) => p.source === 'library').length,
    };
  }, [version]);

  const loadRepoCsvs = () => {
    let imported = 0;
    for (const [path, raw] of Object.entries(LIBRARY_CSV)) {
      const name = path.split('/').pop() ?? 'library.csv';
      const tag = name.replace(/\.csv$/i, '');
      const isScrape = /scrape|stack|raw/i.test(name);
      imported += importWarmProspectsFromRows(parseCsv(raw), {
        source: isScrape ? 'scrape' : 'library',
        libraryTag: tag,
      });
    }
    setNotice(
      imported > 0
        ? `Imported ${imported} warm prospects from docs/warm-prospects/*.csv (not inbound leads).`
        : 'No CSV rows found under docs/warm-prospects/. Add library-seed.csv or partner stacks.',
    );
    setVersion((v) => v + 1);
  };

  const onFileImport = async (file: File) => {
    const text = await file.text();
    const n = importWarmProspectsFromRows(parseCsv(text), {
      source: /scrape/i.test(file.name) ? 'scrape' : 'import',
      libraryTag: file.name,
    });
    setNotice(`Imported ${n} rows from ${file.name} into Warm Prospects only.`);
    setVersion((v) => v + 1);
  };

  const sequencePreview = selected?.sequenceDraftId ? getWarmSequenceDraft(selected.sequenceDraftId) : null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        <strong className="text-white">Warm Prospects library</strong> — stacked/scraped partner lists and imports.{' '}
        <span className="text-amber-200/90">Never mixed with Inbound leads or site form captures.</span> Manual outreach only.
      </div>

      {notice && (
        <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/80">{notice}</div>
      )}

      <div className="grid md:grid-cols-4 gap-4">
        <KpiCard label="Warm library" value={kpis.total} hint="Total records" tone="amber" />
        <KpiCard label="Hot" value={kpis.hot} hint="Book now" tone="violet" />
        <KpiCard label="Nurture" value={kpis.nurture} hint="Drip" tone="sky" />
        <KpiCard label="From repo CSV" value={kpis.library} hint="docs/warm-prospects" tone="emerald" />
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={loadRepoCsvs} className="fc-button-brand">
          <Import size={16} /> Load repo CSV library
        </button>
        <label className="fc-button-soft cursor-pointer">
          <Import size={16} /> Upload CSV
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFileImport(f);
              e.target.value = '';
            }}
          />
        </label>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search warm library…"
              className="fc-input flex-1 min-w-[200px]"
            />
            <select value={heat} onChange={(e) => setHeat(e.target.value as any)} className="fc-input w-auto">
              {HEAT.map((h) => (
                <option key={h.value} value={h.value}>{h.label}</option>
              ))}
            </select>
            <select value={source} onChange={(e) => setSource(e.target.value as any)} className="fc-input w-auto">
              <option value="all">All sources</option>
              <option value="library">Library</option>
              <option value="scrape">Scrape stack</option>
              <option value="import">Manual import</option>
            </select>
          </div>
          <ul className="space-y-2 max-h-[480px] overflow-y-auto">
            {list.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full text-left rounded-xl border px-4 py-3 ${
                    selectedId === p.id ? 'border-amber-500/50 bg-amber-500/10' : 'border-white/10 bg-black/30'
                  }`}
                >
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold text-white">{p.fullName}</span>
                    <HeatPill heat={p.heat} />
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    {p.source} · {p.libraryTag ?? '—'}
                  </div>
                </button>
              </li>
            ))}
            {list.length === 0 && <p className="text-white/50 text-sm">No warm prospects yet. Import CSV to start.</p>}
          </ul>
        </div>

        <div className="lg:col-span-7 space-y-4">
          {selected ? (
            <div className="fc-card p-6 space-y-4">
              <h3 className="text-xl font-bold text-white">{selected.fullName}</h3>
              <p className="text-white/60 text-sm">
                Source: <strong className="text-white">{selected.source}</strong> · Tag: {selected.libraryTag ?? '—'}
              </p>
              <div className="flex flex-wrap gap-2">
                {(['warm', 'nurture', 'hot'] as WarmProspectHeat[]).map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => {
                      patchWarmProspect(selected.id, { heat: h });
                      setVersion((v) => v + 1);
                    }}
                    className="fc-button-soft text-xs"
                  >
                    Set {h}
                  </button>
                ))}
              </div>
              <div className="text-sm text-white/70 space-y-1">
                {selected.email && <div>Email: {selected.email}</div>}
                {selected.phone && <div>Phone: {selected.phone}</div>}
                {selected.company && <div>Company: {selected.company}</div>}
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">Draft sequence (no auto-send)</div>
                <div className="flex flex-wrap gap-2">
                  {WARM_SEQUENCE_DRAFTS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        patchWarmProspect(selected.id, { sequenceDraftId: s.id });
                        setVersion((v) => v + 1);
                      }}
                      className={`px-3 py-2 rounded-xl border text-xs ${
                        selected.sequenceDraftId === s.id
                          ? 'border-amber-500/50 bg-amber-500/15 text-amber-100'
                          : 'border-white/10 text-white/70'
                      }`}
                    >
                      {s.title}
                    </button>
                  ))}
                </div>
              </div>

              {sequencePreview && (
                <details className="rounded-xl border border-white/10 bg-black/40 p-4">
                  <summary className="cursor-pointer text-white font-semibold">Preview sequence steps</summary>
                  <div className="mt-3 space-y-3">
                    {sequencePreview.steps.map((step, i) => (
                      <div key={i} className="text-sm text-white/75 whitespace-pre-wrap border-t border-white/10 pt-3">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
                          Day +{step.dayOffset} {step.subject ? `· ${step.subject}` : ''}
                        </div>
                        {step.body.replace(/\{\{name\}\}/g, selected.fullName).replace(/\{\{source\}\}/g, selected.source)}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="fc-button-soft"
                      onClick={() => {
                        const text = sequencePreview.steps
                          .map(
                            (s) =>
                              `Day +${s.dayOffset}${s.subject ? `\nSubject: ${s.subject}` : ''}\n\n${s.body
                                .replace(/\{\{name\}\}/g, selected.fullName)
                                .replace(/\{\{source\}\}/g, selected.source)}`,
                          )
                          .join('\n\n---\n\n');
                        void navigator.clipboard.writeText(text);
                        setNotice('Sequence copied — paste into Comms Studio and send manually.');
                      }}
                    >
                      <Clipboard size={14} /> Copy full sequence
                    </button>
                  </div>
                </details>
              )}
            </div>
          ) : (
            <p className="text-white/50">Select a warm prospect to set heat and attach a draft sequence.</p>
          )}

          <details className="rounded-xl border border-white/10 bg-black/30 p-4">
            <summary className="cursor-pointer text-white font-semibold flex items-center gap-2">
              <Download size={16} /> CSV format for docs/warm-prospects/
            </summary>
            <pre className="mt-3 text-xs text-white/60 overflow-x-auto">
name,email,phone,company,heat,notes{'\n'}
Partner Name,partner@example.com,555-0100,Acme Realty,hot,Met at event
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}

function HeatPill({ heat }: { heat: WarmProspectHeat }) {
  const map = {
    warm: { icon: Sun, cls: 'text-amber-300' },
    nurture: { icon: Snowflake, cls: 'text-sky-300' },
    hot: { icon: Flame, cls: 'text-rose-300' },
  }[heat];
  const Icon = map.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-widest ${map.cls}`}>
      <Icon size={12} /> {heat}
    </span>
  );
}
