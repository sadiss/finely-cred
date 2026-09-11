import { useCallback, useState } from 'react';
import { isLeadMagnetUnlocked } from './leadMagnetUnlock';
import { useLeadMagnetGuideGate } from './useLeadMagnetGuideGate';

export type LeadMagnetUnlockIntent = 'read' | 'download' | 'continue';

export function useLeadMagnetUnlockFlow(funnelId: string) {
  const gate = useLeadMagnetGuideGate(funnelId);
  const [open, setOpen] = useState(false);
  const [intent, setIntent] = useState<LeadMagnetUnlockIntent>('continue');

  const requestAccess = useCallback(
    (next: LeadMagnetUnlockIntent): boolean => {
      if (gate.unlocked || isLeadMagnetUnlocked(funnelId)) return false;
      setIntent(next);
      setOpen(true);
      return true;
    },
    [funnelId, gate.unlocked],
  );

  return {
    ...gate,
    open,
    setOpen,
    intent,
    requestAccess,
  };
}
