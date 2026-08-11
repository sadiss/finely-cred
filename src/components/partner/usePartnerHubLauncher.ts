import { useCallback, useState } from 'react';
import type { PartnerHubLauncherId } from './partnerHubLauncherUi';

/** Open/close state for partner hub launcher modals — reusable on role dashboards. */
export function usePartnerHubLauncher<T extends string = PartnerHubLauncherId>(initial: T | null = null) {
  const [openId, setOpenId] = useState<T | null>(initial);

  const open = useCallback((id: T) => setOpenId(id), []);
  const close = useCallback(() => setOpenId(null), []);
  const isOpen = useCallback((id: T) => openId === id, [openId]);

  return { openId, open, close, isOpen };
}
