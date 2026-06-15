import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Crown,
  ExternalLink,
  Share2,
  Shield,
  UserCog,
  Users,
  Wallet,
  FileSignature,
  ShoppingBag,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsInlineListItem,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';
import { capabilitiesForRole, workflowIdForCapabilityRole, type RoleCapabilityRole } from '../../config/roleCapabilityMatrix';
import { RoleWorkflowPanel } from '../../components/workflow/RoleWorkflowPanel';
import { demoRoleWorkflowProgress } from '../../lib/roleWorkflowProgress';
import { LAUNCH_ROLE_COURSES } from '../../config/launchRoleCourses';

type RoleType = 'partner' | 'business' | 'agent' | 'affiliate' | 'au_seller' | 'au_buyer' | 'admin';

type RoleConfig = {
  title: string;
  shortLabel: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: 'violet' | 'fuchsia' | 'emerald' | 'sky';
  previewPath: string;
  addPath: string;
  addLabel: string;
  preview: string[];
  access: { label: string; path: string }[];
  contracts: string[];
  payouts: string[];
};

const ROLE_CONFIG: Record<RoleType, RoleConfig> = {
  partner: {
    title: 'Partner (client portal)',
    shortLabel: 'Partner',
    icon: Users,
    accent: 'sky',
    previewPath: '/portal/dashboard',
    addPath: '/admin/partners#create-partner',
    addLabel: 'Create partner',
    preview: [
      'Personal restore/build workspace: reports, disputes, letters, tasks',
      'Billing, documents, education, and messaging with their assigned team',
      'Scoped to one partner record — no admin or tenant settings',
      'Entitlements gate premium modules (debt kill, business build, etc.)',
    ],
    access: [
      { label: 'Portal dashboard', path: '/portal/dashboard' },
      { label: 'Credit reports', path: '/portal/reports' },
      { label: 'Disputes & letters', path: '/portal/disputes' },
      { label: 'Billing', path: '/portal/billing' },
    ],
    contracts: ['Service agreement on onboarding', 'Dispute authorization letters (per round)', 'Optional add-on entitlements at checkout'],
    payouts: ['N/A — client pays Finely; no outbound payouts to partner role'],
  },
  business: {
    title: 'Business credit lane',
    shortLabel: 'Business',
    icon: BriefcaseBusiness,
    accent: 'emerald',
    previewPath: '/business/dashboard',
    addPath: '/admin/partners?lane=business_credit#create-partner',
    addLabel: 'Add business partner',
    preview: [
      'Vendor stack, funding readiness, lender logic, and bureau disputes',
      'Separate nav from personal portal — business profile + documents',
      'Admin sees same partner record under Partner Management',
    ],
    access: [
      { label: 'Business dashboard', path: '/business/dashboard' },
      { label: 'Vendor catalog', path: '/business/vendors' },
      { label: 'Lender Logic', path: '/business/lender-logic' },
      { label: 'Business disputes', path: '/business/disputes' },
    ],
    contracts: ['Business credit service terms', 'Vendor enrollment agreements where applicable'],
    payouts: ['N/A — revenue is inbound client fees'],
  },
  agent: {
    title: 'Credit specialist (agent)',
    shortLabel: 'Agent',
    icon: UserCog,
    accent: 'fuchsia',
    previewPath: '/credit-specialist/hub',
    addPath: '/admin/team',
    addLabel: 'Invite agent',
    preview: [
      'Hub with assigned partners only — tasks, messages, calendar',
      'Revenue split calculator reflects training phase and value levers',
      'Cannot access tenant billing, other admins, or unassigned partners',
    ],
    access: [
      { label: 'Agent hub', path: '/credit-specialist/hub' },
      { label: 'Assigned partner files', path: '/admin/partners' },
      { label: 'Ops tasks', path: '/admin/workflow' },
    ],
    contracts: ['Agent operating agreement (program terms)', 'Client engagement under Finely brand'],
    payouts: ['Agent split on client revenue — see Finance / agent hub payout center', 'Configure method in agent profile'],
  },
  affiliate: {
    title: 'Affiliate partner',
    shortLabel: 'Affiliate',
    icon: Share2,
    accent: 'violet',
    previewPath: '/affiliate/hub',
    addPath: '/admin/partners?add=affiliate#create-partner',
    addLabel: 'Add affiliate',
    preview: [
      'Referral links, conversion tracking, and commission ledger',
      'Lane=affiliate on partner record; public program at /affiliate',
      'Payout center shows pending / paid referral commissions',
    ],
    access: [
      { label: 'Affiliate hub', path: '/affiliate/hub' },
      { label: 'Public program page', path: '/affiliate' },
    ],
    contracts: ['Affiliate program terms', 'Referral disclosure requirements'],
    payouts: ['Commission on qualified referrals', 'Payout center — bank / Cash App / Zelle when configured'],
  },
  au_seller: {
    title: 'AU seller',
    shortLabel: 'AU seller',
    icon: BadgeCheck,
    accent: 'emerald',
    previewPath: '/seller/hub',
    addPath: '/admin/au-sellers',
    addLabel: 'Add AU seller',
    preview: [
      'List tradeline inventory, verification uploads, contracts',
      'Admin approves listings before marketplace visibility',
      'Seller share of AU placement gross per program defaults',
    ],
    access: [
      { label: 'Seller hub', path: '/seller/hub' },
      { label: 'Listings', path: '/seller/listings' },
      { label: 'Contracts', path: '/seller/contracts' },
      { label: 'Payouts', path: '/seller/payouts' },
    ],
    contracts: ['AU seller agreement', 'Listing verification attestations'],
    payouts: ['Seller share of AU placement gross (see AU program defaults)', 'Payout method required before disbursement'],
  },
  au_buyer: {
    title: 'AU buyer',
    shortLabel: 'AU buyer',
    icon: ShoppingBag,
    accent: 'sky',
    previewPath: '/au/marketplace',
    addPath: '/au/request',
    addLabel: 'Start buyer intake',
    preview: [
      'Browse marketplace inventory and submit structured AU placement requests',
      'Document checklist and eligibility attestation on intake',
      'Order tracking through fulfillment — no seller-side listing tools',
    ],
    access: [
      { label: 'AU marketplace', path: '/au/marketplace' },
      { label: 'Submit request', path: '/au/request' },
      { label: 'My orders', path: '/au/orders' },
    ],
    contracts: ['AU placement terms', 'Authorization and eligibility attestations'],
    payouts: ['N/A — buyer pays for tradeline placement'],
  },
  admin: {
    title: 'Platform admin',
    shortLabel: 'Admin',
    icon: Crown,
    accent: 'violet',
    previewPath: '/admin',
    addPath: '/admin/access',
    addLabel: 'Control center',
    preview: [
      'Full tenant ops: partners, cases, CRM, automations, finance',
      'Role preview (this page) — inspect every lane before go-live',
      'Team & Roles for RBAC-lite; entitlements and billing overrides',
    ],
    access: [
      { label: 'Admin dashboard', path: '/admin' },
      { label: 'Partner management', path: '/admin/partners' },
      { label: 'Finance & payouts', path: '/admin/finance' },
      { label: 'Team & roles', path: '/admin/team' },
    ],
    contracts: ['Platform operator agreements', 'Template management in Comms Studio'],
    payouts: ['Admin configures vendor / agent / affiliate payout rules in Finance'],
  },
};

const ROLE_ORDER: RoleType[] = ['partner', 'business', 'agent', 'affiliate', 'au_seller', 'au_buyer', 'admin'];

const ICON_BOX: Record<RoleConfig['accent'], string> = {
  violet: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
  fuchsia: 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300',
  emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  sky: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
};

const TAB_ACCENTS: Record<RoleType, 'violet' | 'fuchsia' | 'emerald' | 'sky'> = {
  partner: 'sky',
  business: 'emerald',
  agent: 'fuchsia',
  affiliate: 'violet',
  au_seller: 'emerald',
  au_buyer: 'sky',
  admin: 'violet',
};

const DETAIL_TABS = [
  { id: 'experience', label: 'Experience' },
  { id: 'routes', label: 'Routes' },
  { id: 'contracts', label: 'Contracts' },
  { id: 'capabilities', label: 'Capabilities' },
] as const;

type DetailTab = (typeof DETAIL_TABS)[number]['id'];

const ROLE_COURSE_ID: Partial<Record<RoleType, string>> = {
  partner: 'course-partner-client',
  affiliate: 'course-affiliate',
  agent: 'course-agent',
  admin: 'course-admin-ops',
  business: 'course-business',
};

export default function AdminRolePreviewPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [detailTab, setDetailTab] = useState<DetailTab>('experience');
  const roleRaw = params.get('role')?.toLowerCase() ?? 'partner';
  const role: RoleType = ROLE_ORDER.includes(roleRaw as RoleType) ? (roleRaw as RoleType) : 'partner';

  const config = useMemo(() => ROLE_CONFIG[role], [role]);
  const capabilities = useMemo(() => capabilitiesForRole(role as RoleCapabilityRole), [role]);
  const workflowId = useMemo(() => workflowIdForCapabilityRole(role as RoleCapabilityRole), [role]);
  const workflowDemoProgress = useMemo(
    () => (workflowId ? demoRoleWorkflowProgress(workflowId) : undefined),
    [workflowId],
  );
  const launchCourse = useMemo(
    () => LAUNCH_ROLE_COURSES.find((c) => c.id === ROLE_COURSE_ID[role]) ?? null,
    [role],
  );
  const Icon = config.icon;

  return (
    <PageShell
      badge="Admin"
      title="Role preview"
      subtitle={`Inspect what each role sees — access, contracts, and payouts.`}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <div className={`${FINELY_OS_VIEW_TABS} flex flex-wrap gap-1 max-w-full`}>
            {ROLE_ORDER.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => navigate(`/admin/role-preview?role=${r}`)}
                className={finelyOsViewTab(role === r, TAB_ACCENTS[r])}
              >
                {ROLE_CONFIG[r].shortLabel}
              </button>
            ))}
          </div>
        </div>

        <FinelyUnifiedHubLayout
          eyebrow={`${config.shortLabel} role preview`}
          title={config.title}
          subtitle="What this role experiences — routes, contracts, payouts, and capability matrix."
          accent={config.accent}
          tabs={DETAIL_TABS.map((t) => ({ id: t.id, label: t.label }))}
          activeTab={detailTab}
          onTabChange={(id) => setDetailTab(id as DetailTab)}
          primaryAction={{ label: config.addLabel, onClick: () => navigate(config.addPath) }}
          secondaryAction={{ label: 'Open live view', onClick: () => window.open(config.previewPath, '_blank') }}
        >
          {detailTab === 'experience' && (
            <ul className={`space-y-2 ${FINELY_OS_ENTITY_BODY}`}>
              {config.preview.map((item, i) => (
                <li key={i} className={`${finelyOsInlineListItem()} p-4 flex items-start gap-2`}>
                  <span className="text-fuchsia-300">•</span>
                  {item}
                </li>
              ))}
            </ul>
          )}

          {detailTab === 'routes' && (
            <ul className="space-y-2">
              {config.access.map((a) => (
                <li key={a.path} className={`${finelyOsInlineListItem()} p-4`}>
                  <button
                    type="button"
                    onClick={() => navigate(a.path)}
                    className={`text-sm ${FINELY_OS_ENTITY_BODY} hover:text-white underline underline-offset-4 decoration-white/20`}
                  >
                    {a.label}
                  </button>
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono text-[9px] mt-0.5`}>{a.path}</div>
                </li>
              ))}
            </ul>
          )}

          {detailTab === 'contracts' && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className={`${finelyOsInlineListItem()} p-5 space-y-3`}>
                <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                  <FileSignature size={12} /> Contracts & signing
                </div>
                <ul className={`space-y-2 ${FINELY_OS_ENTITY_BODY}`}>
                  {config.contracts.map((c, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-violet-300">•</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`${finelyOsInlineListItem()} p-5 space-y-3`}>
                <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                  <Wallet size={12} /> Payouts
                </div>
                <ul className={`space-y-2 ${FINELY_OS_ENTITY_BODY}`}>
                  {config.payouts.map((p, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-300">•</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {detailTab === 'capabilities' && capabilities ? (
            <div className={`${finelyOsInlineListItem()} p-5 space-y-3`}>
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <BadgeCheck size={12} /> Role capability matrix
              </div>
              <div className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                <div>
                  <span className={FINELY_OS_ENTITY_SUBLABEL}>Earn model: </span>
                  {capabilities.earnModel}
                </div>
                <div className="mt-2">
                  <span className={FINELY_OS_ENTITY_SUBLABEL}>Entitlements: </span>
                  {capabilities.entitlements.join(' · ')}
                </div>
                <div className="mt-2">
                  <span className={FINELY_OS_ENTITY_SUBLABEL}>Primary routes: </span>
                  <span className="font-mono text-[11px]">{capabilities.primaryRoutes.join(' · ')}</span>
                </div>
              </div>
              {workflowId ? (
                <RoleWorkflowPanel roleId={workflowId} compact completedSteps={workflowDemoProgress} />
              ) : null}
            </div>
          ) : detailTab === 'capabilities' ? (
            <p className={FINELY_OS_ENTITY_BODY}>No capability matrix entry for this role.</p>
          ) : null}
        </FinelyUnifiedHubLayout>

        {launchCourse ? (
          <div className={`${finelyOsCatalogCard('amber')} !p-5 space-y-3`} data-fc-accent="amber">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Launch training track</div>
            <div className={FINELY_OS_ENTITY_VALUE}>{launchCourse.title}</div>
            <p className={FINELY_OS_ENTITY_BODY}>{launchCourse.desc}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate(launchCourse.hubPath)}>
                Open training hub <ArrowRight size={14} />
              </button>
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/launch-os')}>
                All playbooks
              </button>
            </div>
          </div>
        ) : null}

        <div className={`${FINELY_OS_BANNER} flex flex-wrap items-center justify-between gap-4`}>
          <div>
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300`}>Provision this role</div>
            <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
              {role === 'partner' && 'Create a partner in Partner Management and send a claim link for portal access.'}
              {role === 'business' && 'Create partner with business lane or route; client uses /business/* after login.'}
              {role === 'agent' && 'Team & Roles → invite with Agent role; assign partners for scoped access.'}
              {role === 'affiliate' && 'Partner Management with lane=Affiliate, or application via /affiliate.'}
              {role === 'au_seller' && 'AU Sellers → Add seller; they complete verification and payout setup.'}
              {role === 'au_buyer' && 'Public marketplace + /au/request intake — no seller tools; track in /au/orders.'}
              {role === 'admin' && 'Control Center grants admin/owner; use least privilege for day-to-day ops.'}
            </p>
          </div>
          <button type="button" onClick={() => navigate(config.addPath)} className={FINELY_OS_PRIMARY_BTN}>
            {config.addLabel} <ArrowRight size={14} />
          </button>
        </div>
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
