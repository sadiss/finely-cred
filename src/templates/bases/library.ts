import type { TemplateBase } from '../../domain/templates';
import { STARTER_TEMPLATE_BASES } from './starterPack';
import { ADVANCED_LITIGATION_TEMPLATE_BASES } from './litigationAdvanced';

/**
 * Central library export.
 * As we expand, keep bases split by domain/category files and compose here.
 */
export const TEMPLATE_BASE_LIBRARY: TemplateBase[] = [...STARTER_TEMPLATE_BASES, ...ADVANCED_LITIGATION_TEMPLATE_BASES];

