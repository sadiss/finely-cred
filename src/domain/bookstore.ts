export type BookstoreProduct = {
  id: string;
  /** URL-safe slug used in routes. */
  slug: string;
  title: string;
  sub: string;
  /** Displayed like "04" */
  vol?: string;
  /** Accent color for the 3D cover asset */
  accentColor: string;
  /** Price in cents (USD) */
  priceAmount: number;
  /** Short marketing description */
  desc: string;
  /** Bullet outcomes/features */
  bullets: string[];
  /** Long-form content for in-depth books (markdown) */
  contentMarkdown?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

