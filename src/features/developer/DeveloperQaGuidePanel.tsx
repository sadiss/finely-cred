import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Compass,
  FlaskConical,
  KeyRound,
  Mail,
  MapPin,
  MessageSquare,
  Sparkles,
  Users,
} from 'lucide-react';
import { DEVELOPER_BOOTSTRAP_LOGIN } from '../../auth/developer';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
} from '../os/finelyOsLightUi';

type GuideStep = {
  step: number;
  title: string;
  body: string;
  action?: { label: string; href: string };
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
};

const START_HERE_STEPS: GuideStep[] = [
  {
    step: 1,
    title: 'Sign in & land here',
    body: 'Use your developer email below. After login you arrive at this command center — your home base for every launch test.',
    icon: KeyRound,
    accent: 'violet',
  },
  {
    step: 2,
    title: 'Pick or create a partner',
    body: 'Open Partners, choose a seed partner, or create one for QA. Use View as partner to walk the portal exactly like a real partner.',
    action: { label: 'Open partners', href: '/admin/partners' },
    icon: Users,
    accent: 'emerald',
  },
  {
    step: 3,
    title: 'Run the letter → mail pipeline',
    body: 'View as partner → upload a report → generate a dispute letter → PDF → Mail modal. Job names show as Partner_Bureau (e.g. Yoli_TransUnion).',
    action: { label: 'Mail queue', href: '/admin/mail' },
    icon: Mail,
    accent: 'sky',
  },
  {
    step: 4,
    title: 'Test email & SMS safely',
    body: 'Comms studio sends redirect to sandbox inboxes — never the partner’s real email or phone. Check the sandbox banner at the top.',
    action: { label: 'Comms studio', href: '/admin/comms' },
    icon: MessageSquare,
    accent: 'rose',
  },
  {
    step: 5,
    title: 'Ask the AI copilot anything',
    body: 'Scroll to the AI panel below. Tap a quick prompt or type your question — it knows mail, letters, partners, and sandbox rules.',
    icon: Sparkles,
    accent: 'violet',
  },
];

const WHAT_THINGS_DO = [
  {
    title: 'Session score & all-time high',
    detail: 'Check off items in the Launch checklist. Your score rises as you complete tests. Beat your all-time high before launch.',
  },
  {
    title: 'Tool lanes (colored tiles)',
    detail: 'Each tile opens a real admin module — partners, mail, growth, AI ops, parsing lab. Same code production uses.',
  },
  {
    title: 'Sandbox banner',
    detail: 'Yellow/sky strip means outbound email, SMS, and live mail are guarded. Physical mail needs MAIL_TEST_MODE on.',
  },
  {
    title: 'View as partner',
    detail: 'From partner detail, click View as partner. Portal opens in a new tab with an amber banner — you stay signed in as developer.',
  },
  {
    title: 'Create & delete partners',
    detail: 'Partners list supports create, import, and delete for QA seeds. Use test data only — never real partner PII in sandbox runs.',
  },
];

export function DeveloperQaGuidePanel() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Login card — large type */}
      <section className={`${finelyOsCatalogCardCompact('violet')} !p-5`}>
        <div className="flex items-start gap-4">
          <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 p-3 shrink-0">
            <Compass size={28} className="text-violet-200" />
          </div>
          <div className="min-w-0 flex-1">
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Start here</p>
            <h2 className={`${FINELY_OS_ENTITY_TITLE} text-2xl mt-1`}>How to use this bench</h2>
            <p className={`${FINELY_OS_ENTITY_BODY} text-base mt-3 max-w-3xl leading-relaxed`}>
              This page is your launch QA home. Work top to bottom: read the steps, check off the checklist, open tool lanes,
              and ask the AI copilot when stuck.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-white/12 bg-black/25 p-4">
            <p className={`${FINELY_OS_ENTITY_SUBLABEL} text-sm`}>Your login email</p>
            <p className={`${FINELY_OS_ENTITY_VALUE} text-lg mt-1 break-all`}>{DEVELOPER_BOOTSTRAP_LOGIN.email}</p>
          </div>
          <div className="rounded-xl border border-white/12 bg-black/25 p-4">
            <p className={`${FINELY_OS_ENTITY_SUBLABEL} text-sm`}>Initial password</p>
            <p className={`${FINELY_OS_ENTITY_VALUE} text-lg mt-1 font-mono`}>{DEVELOPER_BOOTSTRAP_LOGIN.initialPassword}</p>
            <p className={`${FINELY_OS_ENTITY_BODY} text-base mt-2`}>
              Reset anytime:{' '}
              <button
                type="button"
                className="text-sky-300 underline underline-offset-2 hover:text-sky-200"
                onClick={() => navigate('/account/settings?tab=security')}
              >
                Account → Security
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* Numbered steps — big cards */}
      <section className="space-y-3">
        <p className={`${FINELY_OS_ENTITY_SUBLABEL} text-sm px-1`}>Five-step navigation guide</p>
        {START_HERE_STEPS.map((s) => {
          const Icon = s.icon;
          return (
            <article
              key={s.step}
              className={`${finelyOsCatalogCardCompact(s.accent)} !p-5 flex flex-wrap items-start gap-4`}
            >
              <div className="flex items-center gap-3 shrink-0">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-black/30 text-xl font-bold text-white">
                  {s.step}
                </span>
                <Icon size={26} className="text-white/70" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-semibold text-white">{s.title}</h3>
                <p className={`${FINELY_OS_ENTITY_BODY} text-base mt-2 leading-relaxed max-w-2xl`}>{s.body}</p>
                {s.action ? (
                  <Link to={s.action.href} className={`${FINELY_OS_PRIMARY_BTN} mt-4 inline-flex`}>
                    {s.action.label} <ArrowRight size={16} />
                  </Link>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>

      {/* What things do */}
      <section className={`${finelyOsCatalogCardCompact('sky')} !p-5`}>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={22} className="text-sky-300" />
          <h3 className="text-xl font-semibold text-white">What each section does</h3>
        </div>
        <ul className="grid gap-4 md:grid-cols-2">
          {WHAT_THINGS_DO.map((item) => (
            <li key={item.title} className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-lg font-semibold text-white/95">{item.title}</p>
              <p className={`${FINELY_OS_ENTITY_BODY} text-base mt-2 leading-relaxed`}>{item.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Map */}
      <section className={`${finelyOsCatalogCardCompact('emerald')} !p-5`}>
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={22} className="text-emerald-300" />
          <h3 className="text-xl font-semibold text-white">Where to find things</h3>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-base">
          {[
            ['Partners & view-as', '/admin/partners'],
            ['Mail letters', '/admin/mail'],
            ['Cases & debt', '/admin/cases'],
            ['Comms & email', '/admin/comms'],
            ['Growth & marketing', '/admin/growth-command'],
            ['AI co-owner', '/admin/ops-agent'],
            ['Letter templates', '/admin/templates'],
            ['Feature flags', '/admin/settings'],
          ].map(([label, href]) => (
            <Link
              key={href}
              to={href}
              className="rounded-lg border border-white/10 bg-black/25 px-4 py-3 text-white/85 hover:bg-black/40 hover:text-white transition-colors flex items-center justify-between gap-2"
            >
              <span className="font-medium">{label}</span>
              <ArrowRight size={16} className="text-white/40 shrink-0" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
