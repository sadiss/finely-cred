/** Merge tags for welcome banners, Comms Studio, and outbound email. */
export type TemplateVariableGroup = {
  label: string;
  vars: Array<{ key: string; label: string; example?: string }>;
};

export const TEMPLATE_VARIABLE_GROUPS: TemplateVariableGroup[] = [
  {
    label: 'Client / partner',
    vars: [
      { key: 'partner.profile.fullName', label: 'Full name', example: 'Jane Doe' },
      { key: 'partner.profile.email', label: 'Email', example: 'jane@email.com' },
      { key: 'partner.profile.phone', label: 'Phone', example: '(555) 555-5555' },
      { key: 'partner.lane', label: 'Lane / program', example: 'other' },
      { key: 'partner.status', label: 'Partner status', example: 'active' },
      { key: 'partner.id', label: 'Partner ID', example: 'partner_…' },
    ],
  },
  {
    label: 'User account',
    vars: [
      { key: 'user.name', label: 'Display name', example: 'Jane' },
      { key: 'user.firstName', label: 'First name', example: 'Jane' },
      { key: 'user.email', label: 'Login email', example: 'jane@email.com' },
      { key: 'user.role', label: 'Role', example: 'client' },
      { key: 'user.phone', label: 'Account phone', example: '(555) 555-5555' },
    ],
  },
  {
    label: 'Brand & links',
    vars: [
      { key: 'brand.name', label: 'Brand name', example: 'Finely Cred' },
      { key: 'brand.supportEmail', label: 'Support email', example: 'support@…' },
      { key: 'brand.supportPhone', label: 'Support phone', example: '+1…' },
      { key: 'links.dashboard', label: 'Dashboard URL path', example: '/dashboard' },
      { key: 'links.portal', label: 'Portal URL path', example: '/portal/dashboard' },
      { key: 'links.reports', label: 'Reports URL path', example: '/portal/reports' },
      { key: 'links.billing', label: 'Billing URL path', example: '/portal/billing' },
      { key: 'links.account', label: 'Account settings path', example: '/account/settings' },
    ],
  },
  {
    label: 'Short aliases (welcome banner)',
    vars: [
      { key: 'firstName', label: 'First name (short)', example: 'Jane' },
      { key: 'name', label: 'Full name (short)', example: 'Jane Doe' },
      { key: 'email', label: 'Email (short)', example: 'jane@…' },
      { key: 'role', label: 'Role (short)', example: 'Client' },
      { key: 'brandName', label: 'Brand (short)', example: 'Finely Cred' },
      { key: 'lane', label: 'Lane (short)', example: 'personal restore' },
    ],
  },
  {
    label: 'Date & time',
    vars: [{ key: 'now.iso', label: 'Current timestamp (ISO)', example: new Date().toISOString() }],
  },
];

export const ALL_TEMPLATE_VAR_KEYS: string[] = TEMPLATE_VARIABLE_GROUPS.flatMap((g) => g.vars.map((v) => v.key));

export const WELCOME_HTML_STARTER = `<div style="font-family:system-ui,sans-serif;line-height:1.6;color:#f5f5f5;">
  <p style="margin:0 0 12px;font-size:22px;font-weight:600;color:#fbbf24;">Welcome back, {{user.firstName}}</p>
  <p style="margin:0 0 16px;color:rgba(255,255,255,0.75);">
    Your {{brand.name}} dashboard is ready. Upload a credit report when you can — we'll turn it into disputes, evidence, and next steps.
  </p>
  <p style="margin:0;color:rgba(255,255,255,0.55);font-size:13px;">
    Questions? Email <a href="mailto:{{brand.supportEmail}}" style="color:#fbbf24;">{{brand.supportEmail}}</a>
  </p>
</div>`;

export const WELCOME_EMAIL_SUBJECT_STARTER = 'Welcome to {{brand.name}}, {{user.firstName}}';
