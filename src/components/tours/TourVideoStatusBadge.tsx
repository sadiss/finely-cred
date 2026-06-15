import React from 'react';
import { Film, Loader2 } from 'lucide-react';
import { useTourVideoAsset } from '../../hooks/useTourVideoAsset';
import { getTourVideoPublicUrl } from '../../domain/tourPlayback';
import { FINELY_OS_ENTITY_SUBLABEL } from '../../features/os/finelyOsLightUi';

type Props = {
  tourId: string;
  className?: string;
};

/** Admin Tour Studio — shows whether factory MP4 is published. */
export function TourVideoStatusBadge({ tourId, className = '' }: Props) {
  const status = useTourVideoAsset(tourId);
  const mp4Url = getTourVideoPublicUrl(tourId);

  if (status === 'checking') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs opacity-60 ${className}`}>
        <Loader2 size={12} className="animate-spin" />
        Checking MP4…
      </span>
    );
  }

  if (status === 'ready') {
    return (
      <a
        href={mp4Url}
        target="_blank"
        rel="noreferrer"
        className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20 ${className}`}
      >
        <Film size={12} />
        MP4 ready
      </a>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-1 ${FINELY_OS_ENTITY_SUBLABEL} ${className}`}
      title={`Run tour:capture + tour:assemble → ${mp4Url}`}
    >
      <Film size={12} className="opacity-50" />
      Steps only · no MP4
    </span>
  );
}
