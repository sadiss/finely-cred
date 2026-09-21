import React, { useMemo } from 'react';
import { AlertTriangle, BookOpen, CheckCircle2, Lightbulb } from 'lucide-react';

function inlineFormat(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const s = text;
  while ((m = re.exec(s))) {
    if (m.index > last) parts.push(s.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) parts.push(<strong key={m.index} className="text-white font-semibold">{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith('*')) parts.push(<em key={m.index} className="text-white/90">{tok.slice(1, -1)}</em>);
    else if (tok.startsWith('`')) parts.push(<code key={m.index} className="px-1.5 py-0.5 rounded bg-white/10 text-amber-100 text-[0.9em] font-mono">{tok.slice(1, -1)}</code>);
    else {
      const lm = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(tok);
      if (lm) {
        parts.push(
          <a key={m.index} href={lm[2]} className="text-amber-300 hover:text-amber-200 underline underline-offset-2" target="_blank" rel="noreferrer">
            {lm[1]}
          </a>,
        );
      } else parts.push(tok);
    }
    last = m.index + tok.length;
  }
  if (last < s.length) parts.push(s.slice(last));
  return parts;
}

function slugHeading(text: string) {
  return text
    .replace(/\*\*/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

type Block =
  | { kind: 'h1' | 'h2' | 'h3'; text: string; id?: string }
  | { kind: 'p'; text: string }
  | { kind: 'ul' | 'ol'; items: string[] }
  | { kind: 'hr' }
  | { kind: 'table'; rows: string[][] }
  | { kind: 'img'; alt: string; src: string }
  | { kind: 'quote'; lines: string[]; variant: 'example' | 'compliance' | 'mistake' | 'default' };

function parseMarkdown(md: string): Block[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^---+\s*$/.test(line)) {
      blocks.push({ kind: 'hr' });
      i++;
      continue;
    }
    if (/^\|.+\|$/.test(line)) {
      const rows: string[][] = [];
      while (i < lines.length && /^\|.+\|$/.test(lines[i])) {
        const row = lines[i]
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());
        if (!row.every((c) => /^[-:]+$/.test(c))) rows.push(row);
        i++;
      }
      if (rows.length) blocks.push({ kind: 'table', rows });
      continue;
    }
    const img = /^!\[([^\]]*)\]\(([^)]+)\)\s*$/.exec(line.trim());
    if (img) {
      blocks.push({ kind: 'img', alt: img[1], src: img[2] });
      i++;
      continue;
    }
    const h = /^(#{1,3})\s+(.+)$/.exec(line);
    if (h) {
      const level = h[1].length;
      const text = h[2];
      const kind = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3';
      blocks.push({ kind, text, id: level >= 2 ? slugHeading(text) : undefined });
      i++;
      continue;
    }
    if (/^>\s?/.test(line)) {
      const ql: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        ql.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      const joined = ql.join(' ');
      let variant: 'example' | 'compliance' | 'mistake' | 'default' = 'default';
      if (/example|eg\./i.test(joined)) variant = 'example';
      else if (/compliance|not legal advice|educational only/i.test(joined)) variant = 'compliance';
      else if (/mistake|red flag|do not/i.test(joined)) variant = 'mistake';
      blocks.push({ kind: 'quote', lines: ql, variant });
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push({ kind: 'ul', items });
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ kind: 'ol', items });
      continue;
    }
    if (!line.trim()) {
      i++;
      continue;
    }
    const para: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}|[-*]|\d+\.|>|\||---)/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    blocks.push({ kind: 'p', text: para.join(' ') });
  }
  return blocks;
}

function Callout({
  variant,
  lines,
}: {
  variant: 'example' | 'compliance' | 'mistake' | 'default';
  lines: string[];
}) {
  const tone =
    variant === 'example'
      ? 'border-violet-500/30 bg-violet-500/10'
      : variant === 'compliance'
        ? 'border-amber-500/30 bg-amber-500/10'
        : variant === 'mistake'
          ? 'border-rose-500/30 bg-rose-500/10'
          : 'border-white/15 bg-white/[0.04]';
  const Icon =
    variant === 'example' ? Lightbulb : variant === 'compliance' ? AlertTriangle : variant === 'mistake' ? AlertTriangle : BookOpen;
  return (
    <div className={`rounded-2xl border p-5 ${tone}`}>
      <div className="flex items-start gap-3">
        <Icon size={18} className="shrink-0 text-amber-200 mt-0.5" />
        <div className="space-y-2 text-white/80 text-[15px] leading-relaxed">
          {lines.map((l, idx) => (
            <p key={idx}>{inlineFormat(l)}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AcademyMarkdown({ markdown, className }: { markdown: string; className?: string }) {
  const blocks = useMemo(() => parseMarkdown(markdown), [markdown]);

  const complianceFooter = /educational only|edikasyon sèlman/i.test(markdown.slice(-800));

  return (
    <article className={`max-w-3xl mx-auto space-y-6 ${className ?? ''}`}>
      {blocks.map((b, idx) => {
        if (b.kind === 'h1') {
          return (
            <h1 key={idx} className="text-3xl md:text-4xl font-bold text-white tracking-tight pt-2">
              {inlineFormat(b.text)}
            </h1>
          );
        }
        if (b.kind === 'h2') {
          return (
            <h2
              key={idx}
              id={b.id ? `academy-${b.id}` : undefined}
              className="text-xl md:text-2xl font-semibold text-white mt-8 border-b border-white/10 pb-2 scroll-mt-28"
            >
              {inlineFormat(b.text)}
            </h2>
          );
        }
        if (b.kind === 'h3') {
          return (
            <h3
              key={idx}
              id={b.id ? `academy-${b.id}` : undefined}
              className="text-lg font-semibold text-amber-100/95 mt-6 scroll-mt-28"
            >
              {inlineFormat(b.text)}
            </h3>
          );
        }
        if (b.kind === 'img') {
          return (
            <figure key={idx} className="rounded-2xl border border-white/10 overflow-hidden bg-black/30">
              <img src={b.src} alt={b.alt} className="w-full h-auto" loading="lazy" />
              {b.alt ? (
                <figcaption className="px-4 py-3 text-white/55 text-sm border-t border-white/10">{b.alt}</figcaption>
              ) : null}
            </figure>
          );
        }
        if (b.kind === 'p') {
          return (
            <p key={idx} className="text-white/75 text-[15px] md:text-base leading-relaxed">
              {inlineFormat(b.text)}
            </p>
          );
        }
        if (b.kind === 'ul') {
          return (
            <ul key={idx} className="list-disc pl-6 space-y-2 text-white/75 text-[15px] leading-relaxed">
              {b.items.map((it, j) => (
                <li key={j}>{inlineFormat(it)}</li>
              ))}
            </ul>
          );
        }
        if (b.kind === 'ol') {
          return (
            <ol key={idx} className="list-decimal pl-6 space-y-2 text-white/75 text-[15px] leading-relaxed">
              {b.items.map((it, j) => (
                <li key={j}>{inlineFormat(it)}</li>
              ))}
            </ol>
          );
        }
        if (b.kind === 'hr') return <hr key={idx} className="border-white/10 my-8" />;
        if (b.kind === 'table') {
          const [head, ...body] = b.rows;
          return (
            <div key={idx} className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/[0.06] text-white/90">
                  <tr>
                    {head.map((c, j) => (
                      <th key={j} className="px-4 py-3 font-semibold">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-white/70">
                  {body.map((row, ri) => (
                    <tr key={ri} className="border-t border-white/10">
                      {row.map((c, ci) => (
                        <td key={ci} className="px-4 py-3 align-top">{inlineFormat(c)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (b.kind === 'quote') {
          return <Callout key={idx} variant={b.variant} lines={b.lines} />;
        }
        return null;
      })}
      {complianceFooter ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 flex gap-3 mt-10">
          <CheckCircle2 size={18} className="text-amber-300 shrink-0" />
          <p className="text-white/65 text-sm leading-relaxed">
            This material is for specialist education only. It is not legal advice. Finely Cred does not guarantee deletions, score changes, loan approvals, or credit card approvals. Nora funding remains a separate pathway.
          </p>
        </div>
      ) : null}
    </article>
  );
}
