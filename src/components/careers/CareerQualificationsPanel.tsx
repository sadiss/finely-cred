import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { careerIconTile, type CareerAccent } from './careerUi';

export type CareerQualificationItem = {
  title: string;
  body: string;
};

type Props = {
  heading: string;
  subheading?: string;
  requirements: CareerQualificationItem[];
  footnote?: string;
  accent?: CareerAccent;
  className?: string;
};

/** Requirements / qualifications for the currently-selected tier or path — plain English. */
export function CareerQualificationsPanel({ heading, subheading, requirements, footnote, accent = 'slate', className = '' }: Props) {
  if (!requirements.length) return null;

  return (
    <div className={`rounded-2xl border-2 border-slate-200 bg-white p-6 sm:p-7 space-y-4 ${className}`}>
      <div className="max-w-2xl space-y-1.5">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{heading}</h2>
        {subheading ? <p className="text-sm leading-relaxed text-slate-600">{subheading}</p> : null}
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {requirements.map((r) => (
          <li key={r.title} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
            <span className={careerIconTile(accent)}>
              <ShieldCheck size={17} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-slate-900">{r.title}</span>
              <span className="block text-xs leading-relaxed text-slate-500">{r.body}</span>
            </span>
          </li>
        ))}
      </ul>
      {footnote ? <p className="text-xs leading-relaxed text-slate-400">{footnote}</p> : null}
    </div>
  );
}
