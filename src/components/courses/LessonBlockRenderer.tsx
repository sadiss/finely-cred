import React, { useMemo, useState } from 'react';
import type { LessonContentBlock } from '../../domain/courses';

function txt(v: any) {
  return String(v ?? '');
}

export function LessonBlockRenderer({ blocks }: { blocks: LessonContentBlock[] }) {
  const list = Array.isArray(blocks) ? blocks : [];
  return (
    <div className="space-y-4">
      {list.map((b) => (
        <Block key={b.id} b={b} />
      ))}
    </div>
  );
}

function Block({ b }: { b: LessonContentBlock }) {
  const d = b.data || {};

  if (b.type === 'divider') return <div className="h-px bg-white/10" />;

  if (b.type === 'heading') return <div className="text-white text-2xl font-semibold">{txt(d.text || d.title)}</div>;
  if (b.type === 'subheading') return <div className="text-white/90 text-lg font-semibold">{txt(d.text || d.title)}</div>;

  if (b.type === 'markdown' || b.type === 'rich_text') {
    return <div className="whitespace-pre-wrap break-words text-white/80 text-sm leading-relaxed">{txt(d.markdown)}</div>;
  }

  if (b.type === 'callout') {
    const tone = String(d.tone || 'info');
    const toneCls =
      tone === 'success'
        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-50'
        : tone === 'warning'
          ? 'border-amber-500/30 bg-amber-500/10 text-amber-50'
          : tone === 'danger'
            ? 'border-rose-500/30 bg-rose-500/10 text-rose-50'
            : 'border-sky-500/30 bg-sky-500/10 text-sky-50';
    return (
      <div className={`rounded-2xl border p-4 ${toneCls}`}>
        {d.title ? <div className="font-semibold">{txt(d.title)}</div> : null}
        {d.markdown ? <div className="mt-2 whitespace-pre-wrap text-sm text-white/85">{txt(d.markdown)}</div> : null}
      </div>
    );
  }

  if (b.type === 'quote') {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
        <div className="text-white/85 text-sm italic">“{txt(d.quote)}”</div>
        {d.by ? <div className="mt-2 text-white/50 text-xs">{txt(d.by)}</div> : null}
      </div>
    );
  }

  if (b.type === 'image') {
    const src = txt(d.src).trim();
    return (
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        {src ? (
          <img src={src} alt={txt(d.alt)} className="w-full rounded-xl border border-white/10" />
        ) : (
          <div className="text-white/60 text-sm">Image URL not set.</div>
        )}
        {d.caption ? <div className="mt-2 text-white/60 text-xs">{txt(d.caption)}</div> : null}
      </div>
    );
  }

  if (b.type === 'embed_url') {
    const url = txt(d.url).trim();
    return (
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="text-white/70 text-sm">Embed:</div>
        {url ? (
          <a className="fc-action-link mt-2" href={url} target="_blank" rel="noreferrer">
            {url}
          </a>
        ) : (
          <div className="text-white/60 text-sm">URL not set.</div>
        )}
        {d.caption ? <div className="mt-2 text-white/60 text-xs">{txt(d.caption)}</div> : null}
      </div>
    );
  }

  if (b.type === 'button_link' || b.type === 'download') {
    const url = txt(d.url).trim();
    const label = txt(d.label || (b.type === 'download' ? 'Download' : 'Open link'));
    return (
      <div>
        {url ? (
          <a href={url} target="_blank" rel="noreferrer" className="fc-button-brand inline-flex">
            {label}
          </a>
        ) : (
          <div className="text-white/60 text-sm">Link URL not set.</div>
        )}
      </div>
    );
  }

  if (b.type === 'checklist') {
    const items: string[] = Array.isArray(d.items) ? d.items.map((x: any) => String(x ?? '')).filter((s: string) => s.trim()) : [];
    return (
      <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
        {d.title ? <div className="text-white font-semibold">{txt(d.title)}</div> : null}
        {items.length ? (
          <ul className="mt-3 space-y-2 text-white/75 text-sm">
            {items.map((it, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-white/30" />
                <span>{it}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-2 text-white/60 text-sm">No items.</div>
        )}
      </div>
    );
  }

  if (b.type === 'steps') {
    const steps: string[] = Array.isArray(d.steps) ? d.steps.map((x: any) => String(x ?? '')).filter((s: string) => s.trim()) : [];
    return (
      <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
        {d.title ? <div className="text-white font-semibold">{txt(d.title)}</div> : null}
        {steps.length ? (
          <ol className="mt-3 space-y-2 text-white/75 text-sm list-decimal list-inside">
            {steps.map((it, idx) => (
              <li key={idx}>{it}</li>
            ))}
          </ol>
        ) : (
          <div className="mt-2 text-white/60 text-sm">No steps.</div>
        )}
      </div>
    );
  }

  if (b.type === 'faq') {
    const items: Array<{ q: string; a: string }> = Array.isArray(d.items) ? d.items : [];
    return (
      <div className="space-y-2">
        {items.map((x, idx) => (
          <div key={idx} className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="text-white font-semibold">{txt((x as any).q)}</div>
            <div className="mt-2 text-white/70 text-sm whitespace-pre-wrap">{txt((x as any).a)}</div>
          </div>
        ))}
      </div>
    );
  }

  if (b.type === 'accordion') {
    const items: Array<{ title: string; markdown?: string }> = Array.isArray(d.items) ? d.items : [];
    return (
      <div className="space-y-2">
        {items.map((x, idx) => (
          <details key={idx} className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <summary className="cursor-pointer select-none text-white font-semibold">{txt((x as any).title)}</summary>
            <div className="mt-3 text-white/70 text-sm whitespace-pre-wrap">{txt((x as any).markdown)}</div>
          </details>
        ))}
      </div>
    );
  }

  if (b.type === 'quiz_mcq') return <QuizMcq b={b} />;
  if (b.type === 'quiz_true_false') return <QuizTrueFalse b={b} />;

  if (b.type === 'video_asset') {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-white/60 text-sm">
        Video asset: <span className="font-mono">{txt(d.videoAssetId)}</span>
        {d.caption ? <div className="mt-2 text-white/60">{txt(d.caption)}</div> : null}
      </div>
    );
  }

  if (b.type === 'audio_asset') {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-white/60 text-sm">
        Audio asset: <span className="font-mono">{txt(d.audioAssetId)}</span>
        {d.caption ? <div className="mt-2 text-white/60">{txt(d.caption)}</div> : null}
      </div>
    );
  }

  // Fallback
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="text-[10px] uppercase tracking-widest text-white/40">{b.type}</div>
      <pre className="mt-2 text-white/70 text-xs whitespace-pre-wrap">{JSON.stringify(d ?? {}, null, 2)}</pre>
    </div>
  );
}

function QuizMcq({ b }: { b: LessonContentBlock }) {
  const d = b.data || {};
  const q = txt(d.question);
  const choices: string[] = Array.isArray(d.choices) ? d.choices.map((x: any) => String(x ?? '')).filter(Boolean) : [];
  const [selected, setSelected] = useState<number | null>(null);
  const correct = typeof d.answerIndex === 'number' ? d.answerIndex : null;
  const show = selected != null;
  const ok = show && correct != null && selected === correct;
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3">
      <div className="text-white font-semibold">{q || 'Quiz'}</div>
      <div className="space-y-2">
        {choices.map((c, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setSelected(idx)}
            className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
              selected === idx ? 'border-amber-500/30 bg-amber-500/10 text-white' : 'border-white/10 bg-white/[0.02] text-white/75 hover:bg-white/[0.05]'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      {show ? (
        <div className={`rounded-xl border p-3 text-sm ${ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-50' : 'border-rose-500/30 bg-rose-500/10 text-rose-50'}`}>
          {ok ? 'Correct.' : 'Not quite.'}
          {d.explain ? <div className="mt-2 text-white/80">{txt(d.explain)}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

function QuizTrueFalse({ b }: { b: LessonContentBlock }) {
  const d = b.data || {};
  const q = txt(d.question);
  const [selected, setSelected] = useState<boolean | null>(null);
  const correct = typeof d.answer === 'boolean' ? d.answer : null;
  const show = selected != null;
  const ok = show && correct != null && selected === correct;
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3">
      <div className="text-white font-semibold">{q || 'Quiz'}</div>
      <div className="flex gap-2">
        {[
          { v: true, label: 'True' },
          { v: false, label: 'False' },
        ].map((x) => (
          <button
            key={String(x.v)}
            type="button"
            onClick={() => setSelected(x.v)}
            className={`px-4 py-3 rounded-xl border text-sm transition-all ${
              selected === x.v ? 'border-amber-500/30 bg-amber-500/10 text-white' : 'border-white/10 bg-white/[0.02] text-white/75 hover:bg-white/[0.05]'
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>
      {show ? (
        <div className={`rounded-xl border p-3 text-sm ${ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-50' : 'border-rose-500/30 bg-rose-500/10 text-rose-50'}`}>
          {ok ? 'Correct.' : 'Not quite.'}
          {d.explain ? <div className="mt-2 text-white/80">{txt(d.explain)}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

