/**
 * Shared structured-content model for in-app e-guide readers.
 *
 * Each guide owns its own visual system through the `prefix` class namespace —
 * the markup here only guarantees that every page carries real structure
 * (steps, checklists, statutes, tables, comparisons) instead of plain prose.
 */
import React from 'react';
import { Check, CircleAlert, Quote, Scale } from 'lucide-react';

export type GuideBlock =
  | { kind: 'paragraphs'; items: string[] }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'steps'; items: Array<{ label: string; body: string }> }
  | { kind: 'checklist'; title?: string; items: string[] }
  | { kind: 'callout'; tone?: 'note' | 'warn' | 'law'; title?: string; body: string }
  | { kind: 'quote'; text: string; attribution?: string }
  | { kind: 'chips'; label?: string; items: Array<{ label: string; note?: string }> }
  | { kind: 'table'; caption?: string; columns: string[]; rows: string[][] }
  | { kind: 'stats'; items: Array<{ value: string; label: string }> }
  | { kind: 'timeline'; items: Array<{ when: string; what: string }> }
  | {
      kind: 'compare';
      left: { title: string; items: string[] };
      right: { title: string; items: string[] };
    };

export type GuideSection = {
  heading: string;
  kicker?: string;
  blocks: GuideBlock[];
};

export type GuideChapter = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  kicker: string;
  teaser: string;
  readMinutes: number;
  /** Short "what this chapter buys you" line rendered in the opener. */
  promise: string;
  takeaway: string;
  sections: GuideSection[];
};

export type GuideMeta = {
  title: string;
  shortTitle: string;
  tagline: string;
  description: string;
  compliance: string;
  edition: string;
  landingPath: string;
  readPath: string;
};

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function chapterIndexById(chapters: GuideChapter[], id: string) {
  const i = chapters.findIndex((c) => c.id === id);
  return i >= 0 ? i : 0;
}

export function guideReadMinutes(chapters: GuideChapter[]) {
  return chapters.reduce((sum, c) => sum + c.readMinutes, 0);
}

function CalloutIcon({ tone }: { tone: 'note' | 'warn' | 'law' }) {
  if (tone === 'warn') return <CircleAlert size={16} aria-hidden />;
  if (tone === 'law') return <Scale size={16} aria-hidden />;
  return <Quote size={16} aria-hidden />;
}

/**
 * Renders one block with `${prefix}-` scoped classes so each guide's stylesheet
 * can give the same structure a completely different silhouette.
 */
export function GuideBlockView({ block, prefix }: { block: GuideBlock; prefix: string }) {
  const p = prefix;

  switch (block.kind) {
    case 'paragraphs':
      return (
        <>
          {block.items.map((text) => (
            <p key={text.slice(0, 56)} className={`${p}-p`}>
              {text}
            </p>
          ))}
        </>
      );

    case 'bullets':
      return (
        <ul className={`${p}-list`}>
          {block.items.map((text) => (
            <li key={text.slice(0, 56)}>
              <span className={`${p}-marker`} aria-hidden />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      );

    case 'steps':
      return (
        <ol className={`${p}-steps`}>
          {block.items.map((step, i) => (
            <li key={step.label} className={`${p}-step`}>
              <span className={`${p}-step-num`} aria-hidden>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className={`${p}-step-body`}>
                <span className={`${p}-step-label`}>{step.label}</span>
                <span className={`${p}-step-text`}>{step.body}</span>
              </div>
            </li>
          ))}
        </ol>
      );

    case 'checklist':
      return (
        <div className={`${p}-check`}>
          {block.title ? <div className={`${p}-check-title`}>{block.title}</div> : null}
          <ul className={`${p}-check-list`}>
            {block.items.map((text) => (
              <li key={text.slice(0, 56)}>
                <span className={`${p}-check-box`} aria-hidden>
                  <Check size={12} strokeWidth={3} />
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case 'callout': {
      const tone = block.tone ?? 'note';
      return (
        <aside className={cx(`${p}-callout`, `${p}-callout--${tone}`)}>
          <span className={`${p}-callout-icon`} aria-hidden>
            <CalloutIcon tone={tone} />
          </span>
          <div>
            {block.title ? <div className={`${p}-callout-title`}>{block.title}</div> : null}
            <p className={`${p}-callout-body`}>{block.body}</p>
          </div>
        </aside>
      );
    }

    case 'quote':
      return (
        <blockquote className={`${p}-quote`}>
          <p>{block.text}</p>
          {block.attribution ? <cite>{block.attribution}</cite> : null}
        </blockquote>
      );

    case 'chips':
      return (
        <div className={`${p}-chip-wrap`}>
          {block.label ? <div className={`${p}-chip-label`}>{block.label}</div> : null}
          <div className={`${p}-chip-row`}>
            {block.items.map((chip) => (
              <span key={chip.label} className={`${p}-chip`}>
                <strong>{chip.label}</strong>
                {chip.note ? <em>{chip.note}</em> : null}
              </span>
            ))}
          </div>
        </div>
      );

    case 'table':
      return (
        <div className={`${p}-table-wrap`}>
          {block.caption ? <div className={`${p}-table-caption`}>{block.caption}</div> : null}
          <div className={`${p}-table-scroll`}>
            <table className={`${p}-table`}>
              <thead>
                <tr>
                  {block.columns.map((col) => (
                    <th key={col} scope="col">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row) => (
                  <tr key={row.join('|')}>
                    {row.map((cell, i) => (
                      <td key={`${cell}-${i}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    case 'stats':
      return (
        <div className={`${p}-stat-grid`}>
          {block.items.map((stat) => (
            <div key={stat.label} className={`${p}-stat`}>
              <div className={`${p}-stat-value`}>{stat.value}</div>
              <div className={`${p}-stat-label`}>{stat.label}</div>
            </div>
          ))}
        </div>
      );

    case 'timeline':
      return (
        <ol className={`${p}-timeline`}>
          {block.items.map((item) => (
            <li key={item.when}>
              <span className={`${p}-timeline-when`}>{item.when}</span>
              <span className={`${p}-timeline-what`}>{item.what}</span>
            </li>
          ))}
        </ol>
      );

    case 'compare':
      return (
        <div className={`${p}-compare`}>
          {[block.left, block.right].map((col, idx) => (
            <div key={col.title} className={cx(`${p}-compare-col`, idx === 1 && `${p}-compare-col--alt`)}>
              <div className={`${p}-compare-title`}>{col.title}</div>
              <ul>
                {col.items.map((text) => (
                  <li key={text.slice(0, 56)}>{text}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}

export function GuideSectionView({
  section,
  prefix,
  index,
}: {
  section: GuideSection;
  prefix: string;
  index: number;
}) {
  return (
    <section className={`${prefix}-section`}>
      <header className={`${prefix}-section-head`}>
        {section.kicker ? (
          <span className={`${prefix}-section-kicker`}>{section.kicker}</span>
        ) : (
          <span className={`${prefix}-section-kicker`}>Section {String(index + 1).padStart(2, '0')}</span>
        )}
        <h3 className={`${prefix}-section-title`}>{section.heading}</h3>
      </header>
      <div className={`${prefix}-section-body`}>
        {section.blocks.map((block, i) => (
          <GuideBlockView key={`${block.kind}-${i}`} block={block} prefix={prefix} />
        ))}
      </div>
    </section>
  );
}
