import type { ProspectTarget } from '../domain/crmProspects';

export type ProspectOfferPath = {
  title: string;
  subtitle: string;
  ctas: Array<{ label: string; url: string }>;
  defaultOutreach: string;
  tags: string[];
  nextActionLabel: string;
};

export function recommendedPathForTarget(t: ProspectTarget): ProspectOfferPath {
  switch (t) {
    case 'clients':
      return {
        title: 'Recommended offer path: Customer /acquisition',
        subtitle: 'Route to Services and let onboarding qualify + capture package intent.',
        ctas: [
          { label: 'Business credit programs', url: '/services?tab=business_credit' },
          { label: 'Personal credit programs', url: '/services?tab=personal_credit' },
          { label: 'Book free strategy call', url: '/consultation' },
        ],
        tags: ['offer:services', 'offer:session'],
        nextActionLabel: 'Send outreach with Services link',
        defaultOutreach:
          `Hey — quick question. Are you focused on personal credit, business credit, or both?\n\n` +
          `We built a guided path that qualifies goals and routes to the right plan:\n` +
          `Business credit: /services?tab=business_credit\n` +
          `Personal credit: /services?tab=personal_credit\n\n` +
          `Or book a free strategy call:\n/consultation\n`,
      };
    case 'affiliates':
      return {
        title: 'Recommended offer path: Affiliate partner',
        subtitle: 'Convert through the Affiliate page and then enroll into Agency plan if needed.',
        ctas: [
          { label: 'Affiliate program', url: '/affiliate' },
          { label: 'Agency plans', url: '/services?tab=agency' },
        ],
        tags: ['offer:affiliate', 'offer:agency'],
        nextActionLabel: 'Send affiliate invite + terms',
        defaultOutreach:
          `Hi — we’re expanding our partner network. Here’s our affiliate program:\n` +
          `/affiliate\n\n` +
          `If you also run customer files, here are the agency plans:\n` +
          `/services?tab=agency\n`,
      };
    case 'agents':
    case 'teams':
      return {
        title: 'Recommended offer path: Team / Agent onboarding',
        subtitle: 'Route to Agency plans and book a kickoff if needed.',
        ctas: [
          { label: 'Agency plans', url: '/services?tab=agency' },
          { label: 'Book free strategy call', url: '/consultation' },
        ],
        tags: ['offer:agency'],
        nextActionLabel: 'Send agency plan + book kickoff',
        defaultOutreach:
          `Hey — are you looking to join as an agent/team, or run your own client pipeline?\n\n` +
          `Agency plans + tooling:\n/services?tab=agency\n\n` +
          `Book a kickoff session:\n/consultation\n`,
      };
    case 'au_sellers':
      return {
        title: 'Recommended offer path: AU seller onboarding',
        subtitle: 'Convert into supply-side inventory via Seller Application.',
        ctas: [{ label: 'Apply as AU seller', url: '/au/seller/apply' }],
        tags: ['offer:au_seller'],
        nextActionLabel: 'Send AU seller application link',
        defaultOutreach: `Hi — if you’re open to listing AU inventory, apply here:\n/au/seller/apply\n`,
      };
    case 'b2b_partners':
      return {
        title: 'Recommended offer path: B2B partnership',
        subtitle: 'Route to Contact/Consultation so you can qualify and propose terms.',
        ctas: [
          { label: 'Contact', url: '/contact' },
          { label: 'Book free strategy call', url: '/consultation' },
        ],
        tags: ['offer:b2b'],
        nextActionLabel: 'Qualify partnership requirements',
        defaultOutreach:
          `Hi — we’re exploring a B2B partnership. What’s the best contact for next steps?\n\n` +
          `You can reach us here:\n/contact\n\n` +
          `Or book time here (free strategy call):\n/consultation\n`,
      };
    default:
      return {
        title: 'Recommended offer path',
        subtitle: 'Route to Services and qualify best fit.',
        ctas: [{ label: 'Services', url: '/services' }],
        tags: ['offer:services'],
        nextActionLabel: 'Send services link',
        defaultOutreach: `Here’s our services catalog:\n/services\n`,
      };
  }
}

