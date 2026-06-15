export type RouteSpec = {
  path: string;
  title: string;
  badge?: string;
  subtitle?: string;
};

// Routeable placeholders for the full architecture.
// These are intentionally “shells” until each module is implemented.
export const PUBLIC_ROUTES: RouteSpec[] = [
  { path: '/fix-my-credit', title: 'Fix My Credit', badge: 'Public', subtitle: 'Personal credit restore overview and intake entry.' },
  { path: '/build-my-credit', title: 'Build My Credit', badge: 'Public', subtitle: 'Personal credit foundation + optimization overview.' },
  { path: '/debt-summons-help', title: 'Debt & Summons Help', badge: 'Public' },
  { path: '/business-credit-solutions', title: 'Business Credit Solutions', badge: 'Public' },
  { path: '/services', title: 'Services Overview', badge: 'Public' },
  { path: '/personal-credit', title: 'Personal Credit Solutions', badge: 'Public' },
  { path: '/business-credit', title: 'Business Credit Solutions', badge: 'Public' },
  { path: '/funding-readiness', title: 'Funding Readiness', badge: 'Public' },
  { path: '/tradelines', title: 'Tradelines Overview', badge: 'Public' }, // real page exists
  { path: '/diy-academy', title: 'DIY Academy', badge: 'Public' },
  { path: '/resources', title: 'Resource Library', badge: 'Public' },
  { path: '/blog', title: 'Blog', badge: 'Public' },
  { path: '/blog/:slug', title: 'Blog Post', badge: 'Public' },
  { path: '/testimonials', title: 'Testimonials', badge: 'Public' },
  { path: '/about', title: 'About', badge: 'Public' }, // real page exists
  { path: '/affiliate', title: 'Affiliate Program', badge: 'Public' },
  { path: '/credit-specialists', title: 'Credit Specialist Program', badge: 'Public' },
  { path: '/agents', title: 'Credit Specialist Program', badge: 'Public' },
  { path: '/events', title: 'Events & Webinars', badge: 'Public' },
  { path: '/contact', title: 'Contact', badge: 'Public' },
  { path: '/enlightenment-session', title: 'Book a strategy call', badge: 'Public' },
  { path: '/owners-guide', title: "Owner's Guide", badge: 'Reference' },
  { path: '/free-guide', title: 'Free Credit Dispute Letter Guide', badge: 'Free Guide' },
  { path: '/g/:code', title: 'Partner Referral Link', badge: 'Signup' },
  { path: '/consultation', title: 'Consultation Booking (legacy)', badge: 'Public' },
  { path: '/faq', title: 'FAQ', badge: 'Public' },
  { path: '/pricing', title: 'Pricing', badge: 'Public', subtitle: 'Ranges, principles, and “Apply” CTA. Exact pricing after intake.' },
  { path: '/terms', title: 'Terms', badge: 'Legal' },
  { path: '/privacy', title: 'Privacy', badge: 'Legal' },
  { path: '/disclaimer', title: 'Disclaimer', badge: 'Legal' },
];

export const AUTH_ROUTES: RouteSpec[] = [
  { path: '/login', title: 'Login', badge: 'Auth' },
  { path: '/signup', title: 'Signup', badge: 'Auth' },
  { path: '/forgot-password', title: 'Forgot Password', badge: 'Auth' },
  { path: '/onboarding', title: 'Onboarding Wizard', badge: 'Auth' }, // real modal experience exists
  { path: '/credit-specialist/hub', title: 'Specialist Hub', badge: 'Credit Specialist' },
  { path: '/affiliate/hub', title: 'Affiliate Hub', badge: 'Affiliate' },
  { path: '/seller/hub', title: 'AU Seller Hub', badge: 'AU Seller' },
  { path: '/agency/signup', title: 'Specialist Workspace Signup', badge: 'Credit Specialist' },
  { path: '/claim', title: 'Claim Profile', badge: 'Auth' },
  { path: '/account/settings', title: 'Account Settings', badge: 'Account' },
];

export const PORTAL_PERSONAL_ROUTES: RouteSpec[] = [
  { path: '/portal/dashboard', title: 'Partner Dashboard', badge: 'Partner Portal' },
  { path: '/portal/checklist', title: 'Onboarding Checklist', badge: 'Partner Portal' },
  { path: '/portal/checkout', title: 'Plan Selection & Checkout', badge: 'Partner Portal' },
  { path: '/portal/wealth-paths', title: 'Wealth Paths', badge: 'Partner Portal' },
  { path: '/portal/reports', title: 'My Credit Reports', badge: 'Partner Portal' },
  { path: '/portal/analysis', title: 'Analysis Vault', badge: 'Partner Portal' },
  { path: '/portal/disputes', title: 'Dispute Center', badge: 'Partner Portal' },
  { path: '/portal/disputes/:id', title: 'Dispute Item Detail', badge: 'Partner Portal' },
  { path: '/portal/debt', title: 'Debt & Summons Center', badge: 'Partner Portal' },
  { path: '/portal/debt/:id', title: 'Debt/Summons Case', badge: 'Partner Portal' },
  { path: '/portal/build', title: 'Credit Building Center', badge: 'Partner Portal' },
  { path: '/portal/identity-theft', title: 'Identity Theft Center', badge: 'Partner Portal' },
  { path: '/portal/escalations', title: 'Complaints & Escalations', badge: 'Partner Portal' },
  { path: '/portal/documents', title: 'Documents Vault', badge: 'Partner Portal' },
  { path: '/portal/templates', title: 'Template Library', badge: 'Partner Portal' },
  { path: '/portal/letters', title: 'Letter Studio', badge: 'Partner Portal' },
  { path: '/portal/letters/vault', title: 'Letters Vault', badge: 'Partner Portal' },
  { path: '/portal/projects', title: 'Tasks & Notifications', badge: 'Partner Portal' },
  { path: '/portal/messages', title: 'Communication Hub', badge: 'Partner Portal' },
  { path: '/portal/calendar', title: 'Calendar & video meetings', badge: 'Partner Portal' },
  { path: '/portal/projects', title: 'Projects & Tasks', badge: 'Partner Portal' },
  { path: '/portal/billing', title: 'Profile & Billing', badge: 'Partner Portal' },
  { path: '/portal/education', title: 'Education Library', badge: 'Partner Portal' },
  { path: '/portal/barter', title: 'Barter Exchange', badge: 'Partner Portal' },
];

export const PORTAL_BUSINESS_ROUTES: RouteSpec[] = [
  { path: '/business/dashboard', title: 'Business Dashboard', badge: 'Business Portal' },
  { path: '/business/profile', title: 'Business Profile & Fundability Matrix', badge: 'Business Portal' },
  { path: '/business/vendors', title: 'Vendor Center', badge: 'Business Portal' },
  { path: '/business/lender-logic', title: 'Business Funding Readiness', badge: 'Business Portal' },
  { path: '/business/documents', title: 'Business Documents', badge: 'Business Portal' },
  { path: '/business/billion-path', title: 'Billion Path • Capital Readiness OS', badge: 'Business Portal' },
];

export const AU_ROUTES: RouteSpec[] = [
  { path: '/au/marketplace', title: 'AU Marketplace', badge: 'AU' },
  { path: '/au/request', title: 'AU Request', badge: 'AU' },
  { path: '/au/orders', title: 'My AU Orders', badge: 'AU' },
  { path: '/au/seller/apply', title: 'Seller Application', badge: 'Seller' },
  { path: '/au/seller/dashboard', title: 'Seller Dashboard', badge: 'Seller' },
  { path: '/au/seller/cards', title: 'Seller Card Management', badge: 'Seller' },
];

export const RENT_ROUTES: RouteSpec[] = [
  { path: '/rent-reporting', title: 'Rent Reporting Hub', badge: 'Rent Reporting' },
];

export const BOOKSTORE_ROUTES: RouteSpec[] = [
  { path: '/bookstore', title: 'Bookstore', badge: 'Store' },
  { path: '/bookstore/:id', title: 'Product Detail', badge: 'Store' },
];

export const ADMIN_ROUTES: RouteSpec[] = [
  { path: '/admin', title: 'Admin Dashboard', badge: 'Admin' },
  { path: '/admin/access', title: 'Access & Permissions', badge: 'Admin' },
  { path: '/admin/monitoring', title: 'Monitoring', badge: 'Admin' },
  { path: '/admin/crm', title: 'CRM', badge: 'Admin' },
  { path: '/admin/lead-intel', title: 'Lead Intelligence Agent', badge: 'Admin' },
  { path: '/admin/workflow', title: 'Ops Inbox', badge: 'Admin' },
  { path: '/admin/projects', title: 'Projects & Tasks', badge: 'Admin' },
  { path: '/admin/tasks', title: 'Tasks', badge: 'Admin' },
  { path: '/admin/courses', title: 'Courses', badge: 'Admin' },
  { path: '/admin/media-studio', title: 'AI Media Studio', badge: 'Admin' },
  { path: '/admin/nora-capital', title: 'Nora Capital Group API', badge: 'Admin' },
  { path: '/admin/vault', title: 'Secret Vault', badge: 'Admin' },
  { path: '/admin/testimonials', title: 'Testimonials', badge: 'Admin' },
  { path: '/admin/finance', title: 'Finance Allocator', badge: 'Admin' },
  { path: '/admin/automations', title: 'Automation Studio', badge: 'Admin' },
  { path: '/admin/ops-agent', title: 'Ruth · Co-Owner', badge: 'Co-Owner' },
  { path: '/admin/phone-hub', title: 'Finely Phone Hub', badge: 'Admin' },
  { path: '/admin/team', title: 'Team & Roles', badge: 'Admin' },
  { path: '/admin/role-preview', title: 'Role Preview', badge: 'Admin' },
  { path: '/admin/tenants', title: 'Tenants (White‑Label)', badge: 'Admin' },
  { path: '/admin/au-sellers', title: 'AU Sellers', badge: 'Admin' },
  { path: '/admin/comms', title: 'Comms Studio', badge: 'Admin' },
  { path: '/admin/resources', title: 'Resources', badge: 'Admin' },
  { path: '/admin/bookstore', title: 'Bookstore', badge: 'Admin' },
  { path: '/admin/partners', title: 'Partner Management', badge: 'Admin' },
  { path: '/admin/partners/import', title: 'Partner Import', badge: 'Admin' },
  { path: '/admin/partners/:id', title: 'Partner Detail', badge: 'Admin' },
  { path: '/admin/cases', title: 'Case Management', badge: 'Admin' },
  { path: '/admin/cases/:id', title: 'Case Workflow', badge: 'Admin' },
  { path: '/admin/dispute-collaboration', title: 'Dispute Collaboration Hub', badge: 'Admin' },
  { path: '/admin/billing', title: 'Billing & Agreements', badge: 'Admin' },
  { path: '/admin/support', title: 'Support Inbox', badge: 'Admin' },
  { path: '/admin/calendar', title: 'Calendar & Scheduling', badge: 'Admin' },
  { path: '/admin/projects', title: 'Projects (DFY Ops)', badge: 'Admin' },
  { path: '/admin/projects/:id', title: 'Project Board', badge: 'Admin' },
  { path: '/admin/templates', title: 'Template Library', badge: 'Admin' },
  { path: '/admin/products', title: 'Product & Vendor Admin', badge: 'Admin' },
  { path: '/admin/cms', title: 'CMS', badge: 'Admin' },
  { path: '/admin/analytics', title: 'Analytics & Reporting', badge: 'Admin' },
  { path: '/admin/settings', title: 'System Settings', badge: 'Admin' },
];

/** Audit-only route catalog — not mounted directly; App.tsx owns live routes. */
export const ALL_PLACEHOLDER_ROUTES: RouteSpec[] = [
  ...PUBLIC_ROUTES.filter(r => !['/tradelines', '/about'].includes(r.path)),
  ...AUTH_ROUTES.filter(r => !['/onboarding'].includes(r.path)),
  ...PORTAL_PERSONAL_ROUTES,
  ...PORTAL_BUSINESS_ROUTES,
  ...AU_ROUTES,
  ...RENT_ROUTES,
  ...BOOKSTORE_ROUTES,
  ...ADMIN_ROUTES,
];

