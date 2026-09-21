import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function parseMarkdownHeadings(md: string): { id: string; text: string; level: number }[] {
  const out: { id: string; text: string; level: number }[] = [];
  for (const line of md.split('\n')) {
    const m = /^(#{2,3})\s+(.+)$/.exec(line);
    if (!m) continue;
    const level = m[1].length;
    const text = m[2].replace(/\*\*/g, '').trim();
    out.push({ id: slugify(text), text, level });
  }
  return out;
}

export function AcademyLessonToc({
  markdown,
  reduceMotion,
}: {
  markdown: string;
  reduceMotion: boolean;
}) {
  const items = useMemo(() => parseMarkdownHeadings(markdown), [markdown]);
  if (items.length < 2) return null;

  const link = (id: string) => {
    document.getElementById(`academy-${id}`)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <nav className="hidden xl:block sticky top-28 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 max-h-[70vh] overflow-y-auto fc-scroll-area">
      <div className="text-[10px] uppercase tracking-widest text-violet-200/70 font-black mb-3">On this page</div>
      <ul className="space-y-1">
        {items.map((h) => (
          <li key={h.id}>
            <button
              type="button"
              onClick={() => link(h.id)}
              className={`w-full text-left text-xs py-1.5 px-2 rounded-lg hover:bg-white/5 text-white/65 hover:text-white transition-colors ${
                h.level === 3 ? 'pl-4 text-white/50' : ''
              }`}
            >
              {reduceMotion ? h.text : (
                <motion.span whileHover={{ x: 4 }} className="inline-block">{h.text}</motion.span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
