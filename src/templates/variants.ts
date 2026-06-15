import type { TemplateTone, TemplateVariantRecipe } from '../domain/templates';

export const TEMPLATE_VARIANTS: TemplateVariantRecipe[] = [
  {
    id: 'ocr_clean_v1',
    kind: 'ocr_clean',
    label: 'OCR clean v1 (classic)',
    format: { headingStyle: 'classic', bulletStyle: 'dots', paragraphSpacing: 'loose' },
  },
  {
    id: 'ocr_clean_v2',
    kind: 'ocr_clean',
    label: 'OCR clean v2 (tight)',
    format: { headingStyle: 'classic', bulletStyle: 'dashes', paragraphSpacing: 'normal' },
  },
  {
    id: 'branded_modern_v1',
    kind: 'branded_modern',
    label: 'Branded modern v1',
    format: { headingStyle: 'modern', bulletStyle: 'dots', paragraphSpacing: 'normal' },
  },
];

export const TEMPLATE_TONES: Array<{ id: TemplateTone; label: string }> = [
  { id: 'formal', label: 'Formal' },
  { id: 'firm', label: 'Firm' },
  { id: 'friendly', label: 'Friendly' },
];

