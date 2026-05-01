import React, { useMemo } from 'react';
import { ArrowLeft, ArrowRight, UserCog, Share2, BadgeCheck } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { ActionLink, Button } from '../../components/ui';

type RoleType = 'agent' | 'affiliate' | 'au_seller';

const ROLE_CONFIG: Record<
  RoleType,
  { title: string; icon: React.ComponentType<{ size?: number; className?: string }>; addPath: string; addLabel: string; preview: string[] }
> = {
  agent: {
    title: 'Agent dashboard',
    icon: UserCog,
    addPath: '/admin/team',
    addLabel: 'Add agent',
    preview: [
      'Partner dashboard scoped to assigned clients',
      'Can view/edit only partners explicitly assigned via Team & Roles',
      'Task queue for assigned partners',
      'Messages and calendar for assigned partners',
      'No access to tenant settings, billing, or other admins',
    ],
  },
  affiliate: {
    title: 'Affiliate dashboard',
    icon: Share2,
    addPath: '/admin/partners?add=affiliate#create-partner',
    addLabel: 'Add affiliate partner',
    preview: [
      'Affiliate portal with unique referral links',
      'Earn commissions on qualified referrals',
      'Track conversions and payouts',
      'Partner with lane=affiliate (create via Partner Management)',
      'Public page: /affiliate for program info',
    ],
  },
  au_seller: {
    title: 'AU Seller dashboard',
    icon: BadgeCheck,
    addPath: '/admin/au-sellers',
    addLabel: 'Add AU seller',
    preview: [
      'Seller dashboard: listings, verification, payouts',
      'Submit card inventory with proof',
      'Admin approves listings before they go live',
      'Payout settings (bank, Cash App, Zelle)',
      'AU marketplace: /au/marketplace for buyers',
    ],
  },
};

export default function AdminRolePreviewPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const roleRaw = params.get('role')?.toLowerCase() ?? 'agent';
  const role: RoleType = ['agent', 'affiliate', 'au_seller'].includes(roleRaw) ? (roleRaw as RoleType) : 'agent';

  const config = useMemo(() => ROLE_CONFIG[role], [role]);
  const Icon = config.icon;

  return (
    <PageShell
      badge="Admin"
      title="Role preview"
      subtitle={`Preview: ${config.title} — what this role sees and how to add them.`}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <ActionLink to="/admin" icon={<ArrowLeft size={16} />}>
            Admin Dashboard
          </ActionLink>
          <div className="flex flex-wrap gap-2">
            {(['agent', 'affiliate', 'au_seller'] as RoleType[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => navigate(`/admin/role-preview?role=${r}`)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  r === role
                    ? 'bg-amber-500 text-black'
                    : 'border border-white/10 bg-white/[0.02] text-white/60 hover:bg-white/[0.05] hover:text-white/80'
                }`}
              >
                {ROLE_CONFIG[r].title.replace(' dashboard', '')}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl border border-amber-500/25 bg-amber-500/10">
              <Icon size={24} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">{config.title}</h2>
              <p className="text-white/60 text-sm">What this role experiences in the platform</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-3">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Preview</div>
              <ul className="space-y-2">
                {config.preview.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-white/80 text-sm">
                    <span className="text-amber-500/80">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-4">
              <div className="text-[10px] uppercase tracking-widest text-amber-400/80">Add this role</div>
              <p className="text-white/70 text-sm">
                {role === 'agent' &&
                  'Go to Team & Roles, invite by email with role=Agent. Assign partners for limited scope.'}
                {role === 'affiliate' &&
                  'Create a partner in Partner Management with lane=Affiliate. Or have them apply via /affiliate.'}
                {role === 'au_seller' &&
                  'Go to AU Sellers and use "Add seller" to create a placeholder. Sellers can also apply via /au/seller/apply.'}
              </p>
              <Button variant="primary" onClick={() => navigate(config.addPath)}>
                {config.addLabel} <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
