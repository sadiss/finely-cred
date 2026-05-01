import type { TemplateBase } from '../domain/templates';
import { TEMPLATE_BASE_LIBRARY } from './bases/library';

// In Phase 2+, this grows into a comprehensive, versioned library (200+ bases).
export const TEMPLATE_BASES: TemplateBase[] = [...TEMPLATE_BASE_LIBRARY];

export function getTemplateBase(id: string): TemplateBase | null {
  return TEMPLATE_BASES.find((t) => t.id === id) ?? null;
}

