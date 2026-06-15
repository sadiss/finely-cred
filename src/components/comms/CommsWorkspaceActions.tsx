import React from 'react';
import { ArrowRight, Calendar, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PORTAL_COMMS_PATHS } from './commsWorkspaceModel';

type Props = {
  variant?: 'inline' | 'card';
  showCalendar?: boolean;
  showHub?: boolean;
  calendarLabel?: string;
  hubLabel?: string;
};

/** Compact Hub + Calendar CTAs for bookstore, education, and other content pages. */
export function CommsWorkspaceActions({
  variant = 'card',
  showCalendar = true,
  showHub = true,
  calendarLabel = 'Book a strategy call',
  hubLabel = 'Communication Hub',
}: Props) {
  const navigate = useNavigate();

  const buttons = (
    <>
      {showHub && (
        <button
          type="button"
          onClick={() => navigate(PORTAL_COMMS_PATHS.hub)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200 text-[10px] font-black uppercase tracking-widest hover:bg-fuchsia-500/20 transition-all"
        >
          <MessageSquare size={14} /> {hubLabel} <ArrowRight size={12} />
        </button>
      )}
      {showCalendar && (
        <button
          type="button"
          onClick={() => navigate(PORTAL_COMMS_PATHS.calendar)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-200 text-[10px] font-black uppercase tracking-widest hover:bg-sky-500/20 transition-all"
        >
          <Calendar size={14} /> {calendarLabel} <ArrowRight size={12} />
        </button>
      )}
    </>
  );

  if (variant === 'inline') {
    return <div className="flex flex-wrap gap-2">{buttons}</div>;
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-transparent p-5 flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="text-[10px] uppercase tracking-widest text-white/45 font-black">Questions or a live session?</div>
        <p className="mt-1 text-sm text-white/60 max-w-xl">
          Use the Communication Hub for chat and coaching. Use Calendar to book strategy calls and join video meetings.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">{buttons}</div>
    </div>
  );
}
