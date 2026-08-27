import { createContext, useContext } from 'react';
import type { WlAccent } from './workspaceLightDesignTokens';

export type WorkspaceLightPreviewContextValue = {
  active: boolean;
  surfaceId: string | null;
  pageBed: string;
  hubAccent: WlAccent;
  viewMode: 'preview' | 'split' | 'live';
  setViewMode?: (mode: 'preview' | 'split' | 'live') => void;
  dataMode: 'demo' | 'real';
  setDataMode?: (mode: 'demo' | 'real') => void;
  presentationMode: boolean;
  setPresentationMode?: (value: boolean) => void;
  density: 'compact' | 'comfortable';
  setDensity?: (d: 'compact' | 'comfortable') => void;
  showSectionOutlines: boolean;
  setShowSectionOutlines?: (v: boolean) => void;
};

export const WorkspaceLightPreviewContext = createContext<WorkspaceLightPreviewContextValue>({
  active: false,
  surfaceId: null,
  pageBed: 'hub',
  hubAccent: 'violet',
  viewMode: 'preview',
  dataMode: 'demo',
  presentationMode: false,
  density: 'comfortable',
  showSectionOutlines: false,
});

export function useWorkspaceLightPreview(): WorkspaceLightPreviewContextValue {
  return useContext(WorkspaceLightPreviewContext);
}
