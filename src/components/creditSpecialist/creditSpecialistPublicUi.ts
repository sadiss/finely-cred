/** Shared typography for public credit specialist pages — large, scannable headers. */
export const CS_PUBLIC = {
  pageKicker: 'text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-violet-700',
  pageTitle: 'text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900',
  pageLead: 'text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl',
  sectionKicker: 'text-sm font-bold uppercase tracking-widest text-amber-700',
  sectionTitle: 'text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight',
  sectionLead: 'text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl',
  cardTitle: 'text-xl sm:text-2xl font-bold text-slate-900',
  cardLabel: 'text-sm font-bold uppercase tracking-wider text-slate-500',
  statHuge: 'text-4xl sm:text-5xl font-black tabular-nums',
  statLabel: 'text-sm font-semibold text-slate-600',
  body: 'text-base text-slate-600 leading-relaxed',
  bodySm: 'text-sm text-slate-600 leading-relaxed',
} as const;
