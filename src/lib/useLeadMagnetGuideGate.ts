import { useCallback, useEffect, useState } from 'react';
import { isLeadMagnetUnlocked, LEAD_MAGNET_UNLOCK_EVENT } from './leadMagnetUnlock';

export function useLeadMagnetGuideGate(funnelId: string) {
  const [unlocked, setUnlocked] = useState(() =>
    typeof window !== 'undefined' ? isLeadMagnetUnlocked(funnelId) : false,
  );

  const refresh = useCallback(() => {
    setUnlocked(isLeadMagnetUnlocked(funnelId));
  }, [funnelId]);

  useEffect(() => {
    refresh();
    const onUnlock = (event: Event) => {
      const id = (event as CustomEvent<{ funnelId?: string }>).detail?.funnelId;
      if (!id || id === funnelId) refresh();
    };
    window.addEventListener(LEAD_MAGNET_UNLOCK_EVENT, onUnlock);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(LEAD_MAGNET_UNLOCK_EVENT, onUnlock);
      window.removeEventListener('storage', refresh);
    };
  }, [funnelId, refresh]);

  return { unlocked, previewLocked: !unlocked, refresh };
}

/** Preview visitors stay on page 1 until they submit the capture form. */
export function clampLeadMagnetChapter(next: number, total: number, unlocked: boolean): number {
  const max = unlocked ? Math.max(0, total - 1) : 0;
  return Math.max(0, Math.min(max, next));
}
