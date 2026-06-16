import React, { useEffect, useMemo } from 'react';
import {
  ArrowRight,
  BookOpen,
  Building2,
  FileText,
  Gavel,
  LayoutDashboard,
  LogIn,
  Plus,
  Upload,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { HetaSocietyDisputeTracker } from '../../components/heta/HetaSocietyDisputeTracker';
import { HosBrandMark } from '../../components/heta/HosBrandMark';
import { getHetaMemberByPartner, registerHetaSocietyMember } from '../../lib/hetaSocietyMembership';
import {
  hetaDisputeSlotsRemaining,
  hetaDisputeSlotsUsed,
  listHetaSocietyDisputes,
} from '../../lib/hetaSocietyDisputes';
import {
  HETA_SOCIETY_CAREER_PATHS,
  HETA_SOCIETY_DISPUTE_LIMIT,
  HETA_SOCIETY_SHORT,
  HEAD_OF_SOCIETY_NAME,
} from '../../config/hetaSocietyProgram';
import { Button } from '../../components/ui';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { finelyOsCatalogCard } from '../../features/os/finelyOsLightUi';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';

const QUICK_ACTIONS = [
  {
    id: 'dispute',
    label: 'Start dispute',
    hint: 'Add a negative item to your file',
    icon: Plus,
    accent: 'amber',
    action: 'scroll-disputes',
  },
  {
    id: 'reports',
    label: 'Upload report',
    hint: 'Attach bureau PDFs to items',
    icon: Upload,
    accent: 'emerald',
    path: '/portal/reports',
  },
  {
    id: 'letters',
    label: 'Letter workspace',
    hint: 'Generate and track round one',
    icon: FileText,
    accent: 'sky',
    path: '/portal/letters',
  },
  {
    id: 'business',
    label: 'Business credit',
    hint: 'Entity checklist & vendor path',
    icon: Building2,
    accent: 'violet',
    path: '/business/dashboard',
  },
] as const;

function formatJoined(iso?: string) {
  if (!iso) return 'Member';
  try {
    return `Member since ${new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`;
  } catch {
    return 'Member';
  }
}

export default function HetaSocietyPortalPage() {
  const auth = useAuth();
  const { partner } = usePartnerSession();
  const navigate = useNavigate();

  usePublicSeoMeta({
    title: `${HEAD_OF_SOCIETY_NAME} Portal`,
    description: `HOS member portal — disputes, business credit, and restoration tools for ${HEAD_OF_SOCIETY_NAME}.`,
    path: '/portal/hos',
  });

  const member = useMemo(() => {
    if (!partner?.id) return null;
    return getHetaMemberByPartner(partner.id);
  }, [partner?.id]);

  useEffect(() => {
    if (!partner?.id || !partner.profile.email) return;
    const existing = getHetaMemberByPartner(partner.id);
    if (existing) return;
    if (partner.lane === 'heta_society') {
      registerHetaSocietyMember({
        leadId: `partner_${partner.id}`,
        email: partner.profile.email,
        fullName: partner.profile.fullName,
        partnerId: partner.id,
      });
    }
  }, [partner]);

  const ownerKey = member?.leadId ?? (partner?.id ? `partner_${partner.id}` : '');
  const email = partner?.profile.email ?? member?.email ?? '';

  const slotsUsed = ownerKey ? hetaDisputeSlotsUsed(ownerKey) : 0;
  const slotsLeft = ownerKey ? hetaDisputeSlotsRemaining(ownerKey) : HETA_SOCIETY_DISPUTE_LIMIT;
  const activeDisputes = ownerKey ? listHetaSocietyDisputes(ownerKey).length : 0;
  const firstName = partner?.profile.fullName.split(' ')[0] ?? 'Member';
  const slotPct = Math.round((slotsUsed / HETA_SOCIETY_DISPUTE_LIMIT) * 100);

  const handleQuickAction = (action: (typeof QUICK_ACTIONS)[number]) => {
    if ('path' in action && action.path) {
      navigate(action.path);
      return;
    }
    document.getElementById('hos-dispute-tracker')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!auth.user) {
    return (
      <div className="min-h-screen bg-fc-shell text-white flex flex-col items-center justify-center px-4">
        <HosBrandMark size={48} className="mb-4" />
        <h1 className="text-2xl font-black mb-2">{HEAD_OF_SOCIETY_NAME} Portal</h1>
        <p className="text-white/60 text-center max-w-md mb-6">
          Log in with the email you used to join {HEAD_OF_SOCIETY_NAME} ({HETA_SOCIETY_SHORT}).
        </p>
        <Button variant="gold" onClick={() => navigate('/onboarding?lane=heta_society&next=/portal/hos')}>
          <LogIn className="w-4 h-4" /> Log in
        </Button>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-fc-shell text-white flex items-center justify-center px-4">
        <p className="text-white/60">Loading your HOS file…</p>
      </div>
    );
  }

  return (
    <PageShell
      badge={HETA_SOCIETY_SHORT}
      title={`Welcome back, ${firstName}`}
      subtitle="Your private restoration command center — disputes, business credit, and growth paths in one place."
    >
      <div className="relative overflow-x-clip text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_0%,rgba(251,191,36,0.12),transparent_45%)]" />

        {/* Member status strip */}
        <div className="relative mb-6 rounded-2xl border border-amber-400/25 bg-gradient-to-r from-amber-500/[0.12] via-[#10131a]/90 to-[#0c1210]/95 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/15 p-2">
                <HosBrandMark size={28} className="h-full w-full" alt="" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wide text-amber-100/80">{HEAD_OF_SOCIETY_NAME}</p>
                <p className="font-black text-white truncate">{partner.profile.fullName}</p>
                <p className="text-xs text-white/50">{formatJoined(member?.joinedAt)} · {email}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="rounded-xl border border-white/[0.1] bg-black/25 px-4 py-2.5 min-w-[120px]">
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/45">Dispute slots</p>
                <p className="text-lg font-black text-amber-100">
                  {slotsUsed}<span className="text-white/40 font-semibold">/{HETA_SOCIETY_DISPUTE_LIMIT}</span>
                </p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500" style={{ width: `${slotPct}%` }} />
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.1] bg-black/25 px-4 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/45">Active items</p>
                <p className="text-lg font-black text-white">{activeDisputes}</p>
              </div>
              <div className="rounded-xl border border-white/[0.1] bg-black/25 px-4 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/45">Available</p>
                <p className="text-lg font-black text-emerald-300">{slotsLeft}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="relative mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACTIONS.map(({ id, label, hint, icon: Icon, accent }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleQuickAction(QUICK_ACTIONS.find((a) => a.id === id)!)}
              className="group rounded-2xl border border-white/[0.1] bg-white/[0.04] p-4 text-left transition hover:border-amber-400/30 hover:bg-white/[0.06]"
            >
              <div
                className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border ${
                  accent === 'amber'
                    ? 'border-amber-400/30 bg-amber-500/15 text-amber-200'
                    : accent === 'emerald'
                      ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200'
                      : accent === 'violet'
                        ? 'border-violet-400/30 bg-violet-500/15 text-violet-200'
                        : 'border-sky-400/30 bg-sky-500/15 text-sky-200'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <p className="font-black text-white">{label}</p>
              <p className="mt-1 text-xs text-white/50">{hint}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-200/80 opacity-0 transition group-hover:opacity-100">
                Open <ArrowRight className="h-3 w-3" />
              </span>
            </button>
          ))}
        </div>

        <div className="relative mb-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/portal/dashboard')}>
            <LayoutDashboard className="w-4 h-4" /> Full portal
          </Button>
          <Button variant="gold" size="sm" onClick={() => navigate('/free-guide')}>
            <BookOpen className="w-4 h-4" /> Dispute guide PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/head-of-society')}>
            <Gavel className="w-4 h-4" /> HOS program page
          </Button>
        </div>

        <main className="relative mx-auto max-w-6xl space-y-6">
          <div id="hos-dispute-tracker">
            {ownerKey && email ? (
              <HetaSocietyDisputeTracker
                ownerKey={ownerKey}
                email={email}
                title="Your restoration file"
              />
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className={`${finelyOsCatalogCard('violet')} !p-5`} data-fc-accent="violet">
              <Building2 className="mb-3 h-6 w-6 text-violet-300" />
              <h2 className="text-lg font-black text-white">Business credit starter</h2>
              <p className="mt-2 text-sm text-white/55">Entity setup checklist, vendor path, and funding readiness modules.</p>
              <button
                type="button"
                onClick={() => navigate('/business/dashboard')}
                className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-violet-200"
              >
                Open business hub <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className={`${finelyOsCatalogCard('emerald')} !p-5`} data-fc-accent="emerald">
              <BookOpen className="mb-3 h-6 w-6 text-emerald-300" />
              <h2 className="text-lg font-black text-white">Letter guide & reports</h2>
              <p className="mt-2 text-sm text-white/55">Upload reports, generate letters, and track bureau responses in the full portal.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={() => navigate('/portal/reports')} className="text-xs font-black uppercase tracking-wider text-emerald-200">
                  Reports
                </button>
                <button type="button" onClick={() => navigate('/portal/disputes')} className="text-xs font-black uppercase tracking-wider text-emerald-200">
                  Disputes
                </button>
                <button type="button" onClick={() => navigate('/portal/letters')} className="text-xs font-black uppercase tracking-wider text-emerald-200">
                  Letters
                </button>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-black text-white">Growth opportunities</h2>
            <p className="mb-4 text-sm text-white/50">When your file is moving, explore paths to serve others and build income.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {HETA_SOCIETY_CAREER_PATHS.map(({ id, title, desc, path }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => navigate(path)}
                  className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-4 text-left hover:border-amber-400/30"
                >
                  <p className="text-sm font-bold text-white/90">{title}</p>
                  <p className="mt-1 text-xs text-white/50">{desc}</p>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
      <FinelyOsPageFooter />
    </PageShell>
  );
}
