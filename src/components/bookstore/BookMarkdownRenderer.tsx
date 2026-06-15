import React, { useMemo } from 'react';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
} from '../../features/os/finelyOsLightUi';

type Block =
  | { type: 'h1' | 'h2' | 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'hr' }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] };

function inlineFormat(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function parseMarkdown(md: string): Block[] {
  const lines = (md || '').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? '';
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      blocks.push({ type: 'hr' });
      i += 1;
      continue;
    }

    if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'h1', text: trimmed.slice(2).trim() });
      i += 1;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'h2', text: trimmed.slice(3).trim() });
      i += 1;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', text: trimmed.slice(4).trim() });
      i += 1;
      continue;
    }

    if (trimmed.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && (lines[i]?.trim().startsWith('> ') || lines[i]?.trim() === '>')) {
        quoteLines.push((lines[i] ?? '').trim().replace(/^>\s?/, ''));
        i += 1;
      }
      blocks.push({ type: 'quote', text: quoteLines.join(' ') });
      continue;
    }

    if (/^[-*]\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test((lines[i] ?? '').trim())) {
        items.push((lines[i] ?? '').trim().replace(/^[-*]\s+/, ''));
        i += 1;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test((lines[i] ?? '').trim())) {
        items.push((lines[i] ?? '').trim().replace(/^\d+\.\s+/, ''));
        i += 1;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    if (trimmed.includes('|') && i + 1 < lines.length && /^\|?[-:\s|]+\|?$/.test((lines[i + 1] ?? '').trim())) {
      const headers = trimmed
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && (lines[i] ?? '').includes('|')) {
        const row = (lines[i] ?? '')
          .split('|')
          .map((c) => c.trim())
          .filter(Boolean);
        if (row.length) rows.push(row);
        i += 1;
      }
      blocks.push({ type: 'table', headers, rows });
      continue;
    }

    const paraLines: string[] = [trimmed];
    i += 1;
    while (i < lines.length) {
      const next = (lines[i] ?? '').trim();
      if (!next || next.startsWith('#') || next.startsWith('>') || /^[-*]\s/.test(next) || /^\d+\.\s/.test(next) || /^---+$/.test(next)) {
        break;
      }
      paraLines.push(next);
      i += 1;
    }
    blocks.push({ type: 'p', text: paraLines.join(' ') });
  }

  return blocks;
}

export function BookMarkdownRenderer({ markdown, accent = 'amber' }: { markdown: string; accent?: 'amber' | 'emerald' | 'violet' | 'sky' | 'fuchsia' }) {
  const blocks = useMemo(() => parseMarkdown(markdown), [markdown]);

  const accentBorder =
    accent === 'emerald'
      ? 'border-emerald-500/30'
      : accent === 'violet'
        ? 'border-violet-500/30'
        : accent === 'sky'
          ? 'border-sky-500/30'
          : accent === 'fuchsia'
            ? 'border-fuchsia-500/30'
            : 'border-amber-500/30';

  const accentQuote =
    accent === 'emerald'
      ? 'border-emerald-500/50 bg-emerald-500/5'
      : accent === 'violet'
        ? 'border-violet-500/50 bg-violet-500/5'
        : 'border-amber-500/50 bg-amber-500/5';

  return (
    <div className={`book-markdown space-y-5 ${FINELY_OS_ENTITY_BODY} text-[15px] leading-[1.75]`}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'h1':
            return (
              <h1 key={idx} className={`${FINELY_OS_ENTITY_VALUE} text-2xl font-black tracking-tight pt-2`}>
                {inlineFormat(block.text)}
              </h1>
            );
          case 'h2':
            return (
              <h2
                key={idx}
                className={`${FINELY_OS_ENTITY_VALUE} text-lg font-bold mt-8 pb-2 border-b ${accentBorder}`}
              >
                {inlineFormat(block.text)}
              </h2>
            );
          case 'h3':
            return (
              <h3 key={idx} className={`${FINELY_OS_ENTITY_VALUE} text-base font-semibold mt-5`}>
                {inlineFormat(block.text)}
              </h3>
            );
          case 'p':
            return (
              <p key={idx} className="text-slate-700 dark:text-slate-300">
                {inlineFormat(block.text)}
              </p>
            );
          case 'quote':
            return (
              <blockquote
                key={idx}
                className={`rounded-xl border-l-4 px-4 py-3 italic text-sm ${accentQuote}`}
              >
                {inlineFormat(block.text)}
              </blockquote>
            );
          case 'hr':
            return <hr key={idx} className="border-slate-200/60 dark:border-white/10 my-6" />;
          case 'ul':
            return (
              <ul key={idx} className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
                {block.items.map((item, j) => (
                  <li key={j}>{inlineFormat(item)}</li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={idx} className="list-decimal pl-5 space-y-2 text-slate-700 dark:text-slate-300">
                {block.items.map((item, j) => (
                  <li key={j}>{inlineFormat(item)}</li>
                ))}
              </ol>
            );
          case 'table':
            return (
              <div key={idx} className="overflow-x-auto rounded-xl border border-slate-200/60 dark:border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-100/80 dark:bg-white/5">
                      {block.headers.map((h, j) => (
                        <th key={j} className={`px-3 py-2 text-left ${FINELY_OS_ENTITY_SUBLABEL} font-semibold`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, ri) => (
                      <tr key={ri} className="border-t border-slate-200/40 dark:border-white/5">
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-3 py-2 align-top">
                            {inlineFormat(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
