import { useEffect, useState } from 'react';
import { getTourVideoPublicUrl } from '../domain/tourPlayback';

export type TourVideoAssetStatus = 'checking' | 'ready' | 'missing';

/** HEAD-check whether assembled MP4 exists in /public/tours (Part C factory output). */
export function useTourVideoAsset(tourId: string | null | undefined): TourVideoAssetStatus {
  const [status, setStatus] = useState<TourVideoAssetStatus>('checking');

  useEffect(() => {
    if (!tourId) {
      setStatus('missing');
      return;
    }

    let cancelled = false;
    setStatus('checking');

    const url = getTourVideoPublicUrl(tourId);
    fetch(url, { method: 'HEAD' })
      .then((res) => {
        if (cancelled) return;
        setStatus(res.ok ? 'ready' : 'missing');
      })
      .catch(() => {
        if (!cancelled) setStatus('missing');
      });

    return () => {
      cancelled = true;
    };
  }, [tourId]);

  return status;
}
