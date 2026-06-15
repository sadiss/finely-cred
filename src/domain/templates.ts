export type TemplateCategory =
  | 'credit_dispute'
  | 'furnisher_dispute'
  | 'identity_theft'
  | 'debt_collection'
  | 'court_filing'
  | 'bankruptcy'
  | 'chexsystems'
  | 'business_funding'
  | 'contracts'
  | 'ops';

export type TemplateTone = 'formal' | 'firm' | 'friendly';

/** Variant goals: OCR-friendly readability vs branded print-ready. */
export type TemplateVariantKind = 'ocr_clean' | 'branded_modern';

export type TemplateVariantRecipe = {
  id: string; // e.g. ocr_clean_v1
  kind: TemplateVariantKind;
  label: string;
  /** Minor formatting choices used by renderers. */
  format: {
    headingStyle: 'classic' | 'modern';
    bulletStyle: 'dots' | 'dashes';
    /** Extra whitespace between paragraphs (OCR readability). */
    paragraphSpacing: 'tight' | 'normal' | 'loose';
  };
};

export type TemplateBase = {
  id: string;
  title: string;
  category: TemplateCategory;
  description: string;
  tags: string[];
  /** Number of copy “versions” for OCR-friendly variation. */
  versions: number;
  /**
   * Optional entitlements required to see/use this base in partner-facing UIs.
   * (Admin screens can still render everything.)
   */
  requiredEntitlements?: string[];
  /** Which partner data context is required to render reliably. */
  requiredFields?: string[];
  /**
   * Render body as HTML string with merge fields like {{partner.fullName}}.
   * Keep it printable; no external CSS required.
   */
  renderHtml: (
    ctx: TemplateRenderContext & { version: number; tone: TemplateTone; variant: TemplateVariantRecipe },
  ) => string;
};

export type TemplateRenderContext = {
  nowIso: string;
  jurisdictionState?: string; // two-letter code preferred

  partner: {
    id: string;
    fullName: string;
    email?: string;
    phone?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };

  // Optional letter context (dispute/debt/case)
  bureau?: 'EXP' | 'EQF' | 'TUC';
  creditorName?: string;
  accountRef?: string; // last4 or case number
  amountCents?: number;
  incidentDate?: string;
};

export type RenderedTemplate = {
  baseId: string;
  title: string;
  category: TemplateCategory;
  variantId: string;
  version: number;
  tone: TemplateTone;
  html: string;
  text: string;
};

