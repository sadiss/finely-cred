import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { LegalResourceLink } from '../../lib/legalResources';
import { FINELY_OS_ENTITY_BODY } from '../../features/os/finelyOsLightUi';

const URL_RE = /https?:\/\/[^\s)\]]+/g;
const MD_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;

function isInternal(href: string) {
  return href.startsWith('/');
}

export function LegalResourceStrip({
  links,
  accentClass = 'text-violet-300',
}: {
  links: LegalResourceLink[];
  accentClass?: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {links.map((l) =>
        isInternal(l.href) ? (
          <Link
            key={l.id}
            to={l.href}
            className={`inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-[10px] font-semibold ${accentClass} hover:bg-white/[0.06] transition`}
            title={l.hint}
          >
            {l.label}
          </Link>
        ) : (
          <a
            key={l.id}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-[10px] font-semibold ${accentClass} hover:bg-white/[0.06] transition`}
            title={l.hint}
          >
            {l.label} <ExternalLink size={10} />
          </a>
        ),
      )}
    </div>
  );
}

function renderInlineLinks(text: string, linkClass: string) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  const combined = text.replace(MD_LINK_RE, (_, label: string, url: string) => `__MD__${label}__${url}__`);
  const tokens = combined.split(/(__MD__[^_]+__https?:\/\/[^_]+__)/);
  for (const tok of tokens) {
    const md = tok.match(/^__MD__(.+?)__(https?:\/\/[^_]+)__$/);
    if (md) {
      parts.push(
        <a key={key++} href={md[2]} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {md[1]}
        </a>,
      );
      continue;
    }
    let m: RegExpExecArray | null;
    const re = new RegExp(URL_RE);
    let idx = 0;
    while ((m = re.exec(tok))) {
      if (m.index > idx) parts.push(tok.slice(idx, m.index));
      const url = m[0];
      parts.push(
        <a key={key++} href={url} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {url.replace(/^https?:\/\//, '').slice(0, 48)}
          {url.length > 56 ? '…' : ''}
        </a>,
      );
      idx = m.index + url.length;
    }
    if (idx < tok.length) parts.push(tok.slice(idx));
  }
  return parts;
}

export function DebtCoachMessage({
  text,
  accentClass = 'text-emerald-300 hover:text-emerald-200',
}: {
  text: string;
  accentClass?: string;
}) {
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  return (
    <div className={`space-y-2 text-sm leading-relaxed ${FINELY_OS_ENTITY_BODY}`}>
      {lines.map((line, i) => {
        const step = line.match(/^(\d+)[.)]\s+(.+)/);
        if (step) {
          return (
            <div key={i} className="flex gap-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2">
              <span className={`shrink-0 font-black text-[10px] uppercase tracking-widest ${accentClass}`}>{step[1]}</span>
              <span className="text-white/85">{renderInlineLinks(step[2], `${accentClass} underline underline-offset-2`)}</span>
            </div>
          );
        }
        return (
          <p key={i} className="text-white/85">
            {renderInlineLinks(line, `${accentClass} underline underline-offset-2`)}
          </p>
        );
      })}
    </div>
  );
}
