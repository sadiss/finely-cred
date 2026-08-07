import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PUBLIC_CAREER_TRACKS, type PublicCareerTrackId } from '../../config/publicCareers';

type Props = {
  currentId: PublicCareerTrackId;
  /** Restrict the cross-link to specific tracks only (e.g. Agency → Credit Specialist only). Defaults to every other track. */
  only?: PublicCareerTrackId[];
  label?: string;
  className?: string;
};

/**
 * Single, unobtrusive cross-link to other career tracks — replaces the 6-track
 * `CareersQuickNav` grid. With one other track it renders a plain link; with
 * several it collapses into a small dropdown so it never competes with the
 * page's primary CTA.
 */
export function CareerOtherTracksLink({ currentId, only, label = 'Other careers', className = '' }: Props) {
  const navigate = useNavigate();
  const tracks = PUBLIC_CAREER_TRACKS.filter((t) => t.id !== currentId && (!only || only.includes(t.id)));
  if (!tracks.length) return null;

  if (tracks.length === 1) {
    const track = tracks[0]!;
    return (
      <button
        type="button"
        onClick={() => navigate(track.path)}
        className={`inline-flex items-center gap-1 text-sm font-semibold text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-slate-800 hover:decoration-slate-500 ${className}`}
      >
        {track.label} instead? <span aria-hidden>→</span>
      </button>
    );
  }

  return (
    <details className={`group relative ${className}`}>
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800">
        {label} <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border-2 border-slate-200 bg-white p-2 shadow-xl">
        {tracks.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => navigate(t.path)}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {t.label}
            <span className="block text-xs font-normal text-slate-400">{t.hint}</span>
          </button>
        ))}
      </div>
    </details>
  );
}
