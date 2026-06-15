import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { LessonBlockType, LessonContentBlock } from '../../domain/courses';
import { LESSON_BLOCK_DEFS, createLessonBlock } from '../../courses/blockRegistry';

function move<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it!);
  return next;
}

function text(v: any) {
  return String(v ?? '');
}

export function LessonBlockEditor({
  value,
  onChange,
}: {
  value: LessonContentBlock[];
  onChange: (next: LessonContentBlock[]) => void;
}) {
  const blocks = Array.isArray(value) ? value : [];
  const [activeId, setActiveId] = useState<string | null>(blocks[0]?.id ?? null);

  const byId = useMemo(() => new Map(blocks.map((b) => [b.id, b])), [blocks]);
  const active = activeId ? byId.get(activeId) ?? null : null;
  const activeIndex = active ? blocks.findIndex((b) => b.id === active.id) : -1;

  const defsByType = useMemo(() => new Map(LESSON_BLOCK_DEFS.map((d) => [d.type, d])), []);

  const setActiveBlock = (patch: Partial<LessonContentBlock>) => {
    if (!active) return;
    const next = blocks.map((b) => (b.id === active.id ? ({ ...b, ...patch } as LessonContentBlock) : b));
    onChange(next);
  };

  const setActiveData = (patch: Record<string, any>) => {
    if (!active) return;
    setActiveBlock({ data: { ...(active.data || {}), ...patch } });
  };

  const addBlock = (type: LessonBlockType) => {
    const created = createLessonBlock(type);
    const next = [...blocks, created];
    onChange(next);
    setActiveId(created.id);
  };

  return (
    <div className="grid lg:grid-cols-12 gap-4">
      <div className="lg:col-span-5 fc-light-glass-panel fc-light-chrome-panel p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[10px] uppercase tracking-widest text-white/40">Blocks</div>
          <div className="flex items-center gap-2">
            <select
              defaultValue=""
              onChange={(e) => {
                const t = e.target.value as LessonBlockType;
                if (!t) return;
                e.currentTarget.value = '';
                addBlock(t);
              }}
              className="bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-[11px]"
              title="Add block"
            >
              <option value="">+ Add block…</option>
              {LESSON_BLOCK_DEFS.map((d) => (
                <option key={d.type} value={d.type}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {blocks.length === 0 ? (
          <div className="text-white/60 text-sm">No blocks yet. Add your first block.</div>
        ) : (
          <div className="space-y-2">
            {blocks.map((b, idx) => {
              const def = defsByType.get(b.type);
              const isActive = b.id === activeId;
              const title =
                b.type === 'markdown'
                  ? (text(b.data?.markdown).split('\n')[0] || '').replace(/^#+\s*/, '') || def?.label || b.type
                  : text(b.data?.title || b.data?.text || def?.label || b.type);
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setActiveId(b.id)}
                  className={`w-full text-left rounded-2xl border p-3 transition-all ${
                    isActive ? 'border-amber-500/30 bg-amber-500/10' : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-white/85 font-semibold text-sm truncate">{title || 'Untitled block'}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                        {def?.category ?? 'content'} • {b.type}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (idx <= 0) return;
                          onChange(move(blocks, idx, idx - 1));
                        }}
                        className="p-2 fc-light-glass-panel fc-light-chrome-panel rounded-xl hover:bg-white/[0.03] text-white/70 disabled:opacity-40"
                        disabled={idx <= 0}
                        title="Move up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (idx >= blocks.length - 1) return;
                          onChange(move(blocks, idx, idx + 1));
                        }}
                        className="p-2 fc-light-glass-panel fc-light-chrome-panel rounded-xl hover:bg-white/[0.03] text-white/70 disabled:opacity-40"
                        disabled={idx >= blocks.length - 1}
                        title="Move down"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="lg:col-span-7 fc-light-glass-panel fc-light-chrome-panel p-5 space-y-4">
        {!active ? (
          <div className="text-white/60 text-sm">Select a block to edit.</div>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/40">Edit block</div>
                <div className="mt-1 text-white font-semibold">{defsByType.get(active.type)?.label ?? active.type}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = blocks.filter((b) => b.id !== active.id);
                  onChange(next);
                  setActiveId(next[0]?.id ?? null);
                }}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/15 text-[10px] font-black uppercase tracking-widest text-rose-100 transition-all"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Type</label>
                <select
                  value={active.type}
                  onChange={(e) => setActiveBlock({ type: e.target.value as LessonBlockType })}
                  className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
                >
                  {LESSON_BLOCK_DEFS.map((d) => (
                    <option key={d.type} value={d.type}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Title (optional)</label>
                <input
                  value={text(active.data?.title)}
                  onChange={(e) => setActiveData({ title: e.target.value })}
                  className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                  placeholder="Block title"
                />
              </div>
            </div>

            {/* Lightweight editors for popular block types; others fall back to JSON editor */}
            {active.type === 'markdown' || active.type === 'rich_text' || active.type === 'callout' || active.type === 'accordion' ? (
              <div className="space-y-2">
                {active.type === 'callout' ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Tone</label>
                      <select
                        value={text(active.data?.tone || 'info')}
                        onChange={(e) => setActiveData({ tone: e.target.value })}
                        className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
                      >
                        <option value="info">info</option>
                        <option value="warning">warning</option>
                        <option value="success">success</option>
                        <option value="danger">danger</option>
                      </select>
                    </div>
                    <div />
                  </div>
                ) : null}
                <label className="block text-[10px] uppercase tracking-widest text-white/50">Content (markdown)</label>
                <textarea
                  value={text(active.data?.markdown)}
                  onChange={(e) => setActiveData({ markdown: e.target.value })}
                  rows={10}
                  className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-4 py-3 text-white/85 text-sm placeholder:text-white/25 resize-y"
                  placeholder="Write block content…"
                />
              </div>
            ) : active.type === 'checklist' || active.type === 'steps' ? (
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-widest text-white/50">Items (one per line)</label>
                <textarea
                  value={(Array.isArray(active.data?.items) ? active.data.items : Array.isArray(active.data?.steps) ? active.data.steps : [])
                    .map((x: any) => String(x ?? ''))
                    .join('\n')}
                  onChange={(e) => {
                    const lines = e.target.value.split('\n').map((s) => s.trimEnd());
                    if (active.type === 'checklist') setActiveData({ items: lines });
                    else setActiveData({ steps: lines });
                  }}
                  rows={8}
                  className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-4 py-3 text-white/85 text-sm placeholder:text-white/25 resize-y"
                />
              </div>
            ) : active.type === 'image' ? (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Image URL</label>
                  <input
                    value={text(active.data?.src)}
                    onChange={(e) => setActiveData({ src: e.target.value })}
                    className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                    placeholder="https://…"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Alt text</label>
                  <input
                    value={text(active.data?.alt)}
                    onChange={(e) => setActiveData({ alt: e.target.value })}
                    className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Caption</label>
                  <input
                    value={text(active.data?.caption)}
                    onChange={(e) => setActiveData({ caption: e.target.value })}
                    className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                  />
                </div>
              </div>
            ) : active.type === 'embed_url' || active.type === 'button_link' || active.type === 'download' ? (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Label</label>
                  <input
                    value={text(active.data?.label)}
                    onChange={(e) => setActiveData({ label: e.target.value })}
                    className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
                    placeholder="Open link"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">URL</label>
                  <input
                    value={text(active.data?.url)}
                    onChange={(e) => setActiveData({ url: e.target.value })}
                    className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
                    placeholder="https://…"
                  />
                </div>
                {active.type === 'embed_url' ? (
                  <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Caption</label>
                    <input
                      value={text(active.data?.caption)}
                      onChange={(e) => setActiveData({ caption: e.target.value })}
                      className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
                    />
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-widest text-white/50">Advanced (JSON)</div>
                <textarea
                  value={JSON.stringify(active.data ?? {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value || '{}');
                      setActiveBlock({ data: parsed });
                    } catch {
                      // ignore parse errors while typing
                    }
                  }}
                  rows={12}
                  className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-4 py-3 text-white/80 text-xs font-mono resize-y"
                />
                <div className="text-white/45 text-xs">
                  Tip: for complex blocks (tables, surveys, flashcards) you can edit the JSON directly.
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={() => addBlock('markdown')}
                className="inline-flex items-center gap-2 px-4 py-2 fc-light-glass-panel fc-light-chrome-panel rounded-xl hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
              >
                <Plus size={14} /> Add markdown section
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

