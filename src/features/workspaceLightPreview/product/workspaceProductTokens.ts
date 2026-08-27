import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock3,
  LockKeyhole,
  PlayCircle,
} from 'lucide-react';

export type WorkspaceProductRole = 'admin' | 'partner';
export type WorkspaceProductAccent = 'emerald' | 'violet' | 'sky' | 'rose' | 'graphite';
export type WorkspaceProductStatus =
  | 'needs_action'
  | 'waiting'
  | 'in_progress'
  | 'ready'
  | 'complete'
  | 'blocked';

export type WorkspaceProductStatusMeta = {
  label: string;
  tone: WorkspaceProductAccent;
  icon: LucideIcon;
};

/**
 * One state grammar for every role and every product surface.
 * Components consume the semantic state; color is never selected decoratively.
 */
export const WORKSPACE_PRODUCT_STATUS: Record<WorkspaceProductStatus, WorkspaceProductStatusMeta> = {
  needs_action: { label: 'Needs action', tone: 'rose', icon: AlertTriangle },
  waiting: { label: 'Waiting', tone: 'sky', icon: Clock3 },
  in_progress: { label: 'In progress', tone: 'violet', icon: PlayCircle },
  ready: { label: 'Ready', tone: 'emerald', icon: CheckCircle2 },
  complete: { label: 'Complete', tone: 'emerald', icon: CheckCircle2 },
  blocked: { label: 'Blocked', tone: 'rose', icon: LockKeyhole },
};

export const WORKSPACE_PRODUCT_EMPTY_STATUS: WorkspaceProductStatusMeta = {
  label: 'Not started',
  tone: 'graphite',
  icon: CircleDashed,
};

/**
 * Used only when a row truly needs multiple semantic accents.
 * The sequence avoids same-family neighbors and blue-on-navy adjacency.
 */
export const WORKSPACE_PRODUCT_ACCENT_SEQUENCE: WorkspaceProductAccent[] = [
  'emerald',
  'violet',
  'sky',
  'rose',
];

export const WORKSPACE_PRODUCT_MOTION_MS = 160;

export const WORKSPACE_PRODUCT_BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
} as const;
