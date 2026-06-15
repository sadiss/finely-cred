/**
 * Senior QA human sign-off ops (wave 64) — mirrors docs/SENIOR-QA-WALKTHROUGH.md.
 */

export type SeniorQaSignoffItem = {
  id: string;
  path: string;
  label: string;
  criterion: string;
  automated: boolean;
};

export const SENIOR_QA_SIGNOFF_ITEMS: SeniorQaSignoffItem[] = [
  {
    id: 'path-start-here',
    path: '/start-here',
    label: 'Start Here — three lanes',
    criterion: 'Pick a lane without reading fine print',
    automated: true,
  },
  {
    id: 'path-resources-monitoring',
    path: '/resources#monitoring',
    label: 'Resources — monitoring links',
    criterion: 'Find a credit monitoring link and understand why',
    automated: true,
  },
  {
    id: 'path-onboarding',
    path: '/onboarding',
    label: 'Onboarding — next step strip',
    criterion: 'One obvious next step, no jargon',
    automated: true,
  },
  {
    id: 'path-portal-hub',
    path: '/portal/dashboard',
    label: 'Portal hub — Ask Finely / Watch how',
    criterion: 'Strategy call wording on calendar; help strip works',
    automated: true,
  },
  {
    id: 'path-help-center',
    path: '/help-center',
    label: 'Help center — search playbooks',
    criterion: 'Search "upload report" and open a playbook',
    automated: true,
  },
  {
    id: 'path-affiliate',
    path: '/affiliate/hub',
    label: 'Affiliate hub — pitch helper',
    criterion: 'Copy a referral pitch',
    automated: true,
  },
  {
    id: 'path-letters',
    path: '/portal/letters',
    label: 'Letter Studio',
    criterion: 'Plain steps, no command-center jargon',
    automated: true,
  },
  {
    id: 'path-admin-partners',
    path: '/admin/partners',
    label: 'Admin partners list',
    criterion: 'Upload report buttons work — no nested broken buttons',
    automated: true,
  },
  {
    id: 'path-mastery',
    path: '/dashboard',
    label: 'Mastery workspace sidebar',
    criterion: 'Labeled sections: Overview, Disputes, etc.',
    automated: true,
  },
  {
    id: 'voice-mic',
    path: '/start-here',
    label: 'Voice mic (Chrome/Edge)',
    criterion: 'Ask Finely mic transcribes after browser permission',
    automated: false,
  },
  {
    id: 'read-aloud',
    path: '/start-here',
    label: 'Read aloud',
    criterion: 'Tour player + Ask Finely read-aloud works',
    automated: false,
  },
  {
    id: 'readable-text',
    path: '/start-here',
    label: 'Readable text (18px+)',
    criterion: 'Non-tech tester can read without squinting',
    automated: false,
  },
];

const STORAGE_KEY = 'finely.launchSeniorQaSignoff.v1';

export function loadSeniorQaSignoffs(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveSeniorQaSignoff(id: string, checked: boolean): Record<string, boolean> {
  const next = { ...loadSeniorQaSignoffs(), [id]: checked };
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function getSeniorQaSignoffProgress(): {
  total: number;
  signed: number;
  automatedSigned: number;
  automatedTotal: number;
  complete: boolean;
} {
  const signoffs = loadSeniorQaSignoffs();
  const signed = SENIOR_QA_SIGNOFF_ITEMS.filter((i) => signoffs[i.id]).length;
  const automatedItems = SENIOR_QA_SIGNOFF_ITEMS.filter((i) => i.automated);
  const automatedSigned = automatedItems.filter((i) => signoffs[i.id]).length;
  return {
    total: SENIOR_QA_SIGNOFF_ITEMS.length,
    signed,
    automatedSigned,
    automatedTotal: automatedItems.length,
    complete: signed === SENIOR_QA_SIGNOFF_ITEMS.length,
  };
}

export function summarizeSeniorQaSignoffForCoOwner(): string {
  const p = getSeniorQaSignoffProgress();
  const pending = SENIOR_QA_SIGNOFF_ITEMS.filter((i) => !loadSeniorQaSignoffs()[i.id])
    .map((i) => `- ${i.label} (${i.path})`)
    .join('\n');
  return [
    `Senior QA sign-off: ${p.signed}/${p.total} complete (automated paths ${p.automatedSigned}/${p.automatedTotal})`,
    p.complete ? 'All human sign-off items checked.' : `Pending:\n${pending || '(none)'}`,
    '',
    'Automated: npm run launch:senior:qa (23 Playwright paths)',
    'Admin: /admin/launch-os#senior-qa',
  ].join('\n');
}
