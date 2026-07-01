import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PUBLIC_CAREER_TRACKS, type PublicCareerTrackId } from '../../config/publicCareers';

type Props = {
  active: PublicCareerTrackId;
  className?: string;
};

/** Jump between career tracks without mixing specialist vs agency messaging. */
export function CareersQuickNav({ active, className = '' }: Props) {
  const navigate = useNavigate();

  return (
    <nav
      className={`rounded-2xl border-2 border-slate-200 bg-slate-50 p-3 sm:p-4 ${className}`}
      aria-label="Career tracks"
    >
      <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3">Careers — pick your track</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {PUBLIC_CAREER_TRACKS.map((track) => {
          const isActive = track.id === active;
          return (
            <button
              key={track.id}
              type="button"
              onClick={() => {
                if (!isActive) navigate(track.path);
              }}
              className={
                'text-left rounded-xl px-4 py-4 border-2 transition-all ' +
                (isActive
                  ? 'border-violet-500 bg-white shadow-md ring-2 ring-violet-200'
                  : 'border-slate-200 bg-white hover:border-violet-300 hover:shadow-sm')
              }
            >
              <div className={`text-base sm:text-lg font-bold ${isActive ? 'text-violet-700' : 'text-slate-900'}`}>
                {track.shortLabel}
              </div>
              <div className="text-xs sm:text-sm text-slate-500 mt-1 leading-snug">{track.hint}</div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
