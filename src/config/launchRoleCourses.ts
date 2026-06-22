/** Launch OS role training tracks — links SOPs, tours, and existing course hubs (Part A). */

export type LaunchRoleCourse = {
  id: string;
  role: string;
  title: string;
  desc: string;
  lessonCount: number;
  hubPath: string;
  sopIds: string[];
  tourIds?: string[];
  accent: 'emerald' | 'violet' | 'amber' | 'sky' | 'fuchsia';
};

export const LAUNCH_ROLE_COURSES: LaunchRoleCourse[] = [
  {
    id: 'course-partner-client',
    role: 'Partner / client',
    title: 'Fix credit step-by-step',
    desc: 'Monitoring → upload report → disputes → letters → follow-up.',
    lessonCount: 5,
    hubPath: '/portal/courses',
    sopIds: ['sop-public-monitoring-links', 'sop-portal-upload-report', 'sop-portal-dispute-letter'],
    tourIds: ['tour-resources-monitoring', 'tour-portal-upload-report', 'tour-portal-dispute-letter'],
    accent: 'emerald',
  },
  {
    id: 'course-affiliate',
    role: 'Affiliate',
    title: 'Refer & earn responsibly',
    desc: 'Toolkit links, Denefits pitch, compliance-friendly copy.',
    lessonCount: 4,
    hubPath: '/affiliate/hub',
    sopIds: ['sop-affiliate-toolkit', 'sop-affiliate-denefits-pitch'],
    tourIds: ['tour-affiliate-toolkit'],
    accent: 'violet',
  },
  {
    id: 'course-agent',
    role: 'Credit specialist',
    title: 'Work customer files',
    desc: 'Hub economics, client dashboard, letter workflow execution.',
    lessonCount: 4,
    hubPath: '/credit-specialist/hub',
    sopIds: ['sop-agent-client-file'],
    tourIds: ['tour-agent-client-file'],
    accent: 'amber',
  },
  {
    id: 'course-admin-ops',
    role: 'Admin / ops',
    title: 'Daily ops launch playbook',
    desc: 'Create partners, upload reports, triage workflow queue.',
    lessonCount: 5,
    hubPath: '/admin/launch-os',
    sopIds: ['sop-admin-create-partner', 'sop-admin-upload-client-report', 'sop-admin-workflow-triage'],
    tourIds: ['tour-admin-partners', 'tour-admin-workflow'],
    accent: 'sky',
  },
  {
    id: 'course-business',
    role: 'Business credit',
    title: 'Vendor stack & funding',
    desc: 'Entity profile, vendor sequencing, lender logic modeling.',
    lessonCount: 3,
    hubPath: '/business/dashboard',
    sopIds: ['sop-business-vendor-stack'],
    tourIds: ['tour-business-vendors'],
    accent: 'fuchsia',
  },
  {
    id: 'course-compliance',
    role: 'All roles',
    title: 'Compliance before you mail',
    desc: 'Evidence gate, language review, identity vault checks.',
    lessonCount: 3,
    hubPath: '/help-center',
    sopIds: ['sop-compliance-letter-gate'],
    accent: 'emerald',
  },
];

export function getLaunchRoleCourse(id: string): LaunchRoleCourse | null {
  return LAUNCH_ROLE_COURSES.find((c) => c.id === id) ?? null;
}
