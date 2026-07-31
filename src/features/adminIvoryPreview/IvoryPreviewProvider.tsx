import React, { createContext, useContext, useMemo } from 'react';
import './adminIvoryPreview.css';

type IvoryPreviewContextValue = {
  active: boolean;
  surfaceId: string | null;
};

const IvoryPreviewContext = createContext<IvoryPreviewContextValue>({
  active: false,
  surfaceId: null,
});

export function useIvoryPreview(): IvoryPreviewContextValue {
  return useContext(IvoryPreviewContext);
}

/**
 * Scopes layout-preview CSS (live dark admin tokens) to a wrapper div only.
 * Live admin pages are never mutated — mount this only on /admin/preview/* routes.
 */
export function IvoryPreviewProvider({
  surfaceId = null,
  children,
}: {
  surfaceId?: string | null;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({ active: true as const, surfaceId: surfaceId ?? null }),
    [surfaceId],
  );

  return (
    <IvoryPreviewContext.Provider value={value}>
      <div
        data-fc-ivory-preview="1"
        data-fc-admin-ivory-preview="1"
        data-fc-ivory-surface={surfaceId || undefined}
        className="min-h-screen"
      >
        {children}
      </div>
    </IvoryPreviewContext.Provider>
  );
}
