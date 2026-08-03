/**
 * Shared typography for public credit specialist / agency / AU seller pages.
 *
 * IMPORTANT — theme-independent contrast:
 * These tokens render inside `finelyOsCatalogCard()` panels, which use a dark/glass
 * surface by default (public visitors are forced to the dark theme unless the
 * `lightThemePublic` flag is on — see `finelyThemeAccess.ts`). We use the sitewide
 * `text-white` / `text-white/NN` scale on purpose: `index.css` already auto-converts
 * those exact opacity buckets to dark-safe ink (`--fc-light-heading` / `--fc-light-body` /
 * `--fc-light-muted`) whenever `html[data-fc-theme="light"]` is active. Do NOT swap these
 * back to `text-slate-900` / `text-slate-600` etc. unless the element also has its own
 * guaranteed light background (e.g. an explicit `bg-white` wrapper) — otherwise the copy
 * goes invisible on the default dark public theme.
 */
export const CS_PUBLIC = {
  pageKicker: 'text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-violet-700',
  pageTitle: 'text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white',
  pageLead: 'text-base sm:text-lg text-white/80 leading-relaxed max-w-3xl',
  sectionKicker: 'text-sm font-bold uppercase tracking-widest text-amber-700',
  sectionTitle: 'text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight',
  sectionLead: 'text-base sm:text-lg text-white/80 leading-relaxed max-w-3xl',
  cardTitle: 'text-xl sm:text-2xl font-bold text-white',
  cardLabel: 'text-sm font-bold uppercase tracking-wider text-white/60',
  statHuge: 'text-4xl sm:text-5xl font-black tabular-nums',
  statLabel: 'text-sm font-semibold text-white/70',
  body: 'text-base text-white/80 leading-relaxed',
  bodySm: 'text-sm text-white/80 leading-relaxed',
} as const;
