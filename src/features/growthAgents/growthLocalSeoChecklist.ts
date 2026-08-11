import { getGrowthWeekFocus } from './growthWeekFocus';

export type LocalSeoCheckItem = {
  id: string;
  label: string;
  hint: string;
  href?: string;
};

/** City-scoped local SEO checklist — reads Esther week focus for lane + city. */
export function buildLocalSeoChecklist(city?: string, laneLabel?: string): LocalSeoCheckItem[] {
  const focus = getGrowthWeekFocus();
  const place = (city ?? focus.city).trim() || 'your city';
  const lane = (laneLabel ?? focus.laneLabel).trim() || 'credit restore';
  const slug = place.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return [
    {
      id: 'city-title',
      label: `Page title mentions ${place}`,
      hint: `Include "${place}" + ${lane} in title (20–60 chars).`,
      href: '/resources',
    },
    {
      id: 'cta-path',
      label: 'Book CTA matches week focus',
      hint: `Esther CTA path: ${focus.ctaPath} — same on local landing.`,
      href: focus.ctaPath,
    },
    {
      id: 'geo-copy',
      label: `Local proof line for ${place}`,
      hint: `One sentence: who you help in ${place} · results vary · not legal advice.`,
    },
    {
      id: 'schema',
      label: 'LocalBusiness schema on public route',
      hint: 'Mark hasSchema on city or resources hub — Lydia audit flags gaps.',
      href: '/admin/access',
    },
    {
      id: 'gbp',
      label: 'Google Business Profile service area',
      hint: `Set service area to ${place} + nearby zip rings — manual off-site step.`,
    },
    {
      id: 'nap',
      label: 'NAP consistent across directories',
      hint: 'Name, address, phone match site footer — syndicate after Hannah link copy.',
      href: '/admin/lead-acquisition',
    },
    {
      id: 'pillar-video',
      label: focus.pillarVideoId ? 'Pillar video linked for local embed' : 'Optional pillar video for local embed',
      hint: focus.pillarVideoId
        ? `Embed public resource video on ${place} landing when live.`
        : 'Set pillar id in Esther — Jordan/Miriam supply clips.',
      href: focus.pillarVideoId ? `/resources/videos/${focus.pillarVideoId}` : '/admin/growth-agents/marketing-director',
    },
    {
      id: 'slug',
      label: `URL slug ready: /${slug || 'city'}`,
      hint: slug ? `Preview friendly slug for ${place} geo page draft.` : 'Set a real city in Esther first.',
    },
  ];
}
