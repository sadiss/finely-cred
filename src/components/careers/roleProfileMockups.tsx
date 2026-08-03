import React from 'react';
import {
  BadgeCheck,
  Building2,
  CalendarClock,
  CreditCard,
  Gavel,
  Link2,
  Lock,
  ShieldCheck,
  Users,
} from 'lucide-react';

/**
 * Shareboard / portal-profile mockups — one per role page.
 *
 * These are static premium mocks (no charts, no sparklines, no fake graphs). Every
 * role gets a different silhouette, palette, and orientation so the five public
 * role pages never read as the same template.
 */

const MOCK_LABEL = 'text-[9px] font-black uppercase tracking-[0.28em]';

function MockCaption({ children, tone = 'light' }: { children: React.ReactNode; tone?: 'light' | 'dark' }) {
  return (
    <p className={`mt-3 text-center text-[11px] italic ${tone === 'dark' ? 'text-[#0a1628]/55' : 'text-white/40'}`}>
      {children}
    </p>
  );
}

/* ───────────────── Real estate — referral shareboard (landscape, navy + gold) ───────────────── */

const RE_REFERRALS = [
  { name: 'M. Alvarez', stage: 'Restore desk', owner: 'Finely specialist · Dana', tone: 'amber' },
  { name: 'The Okafors', stage: 'AU prep', owner: 'Finely specialist · Rey', tone: 'sky' },
  { name: 'J. Whitfield', stage: 'Lender-ready', owner: 'Handed back to you', tone: 'emerald' },
] as const;

const RE_TONE: Record<'amber' | 'sky' | 'emerald', string> = {
  amber: 'border-amber-300/40 bg-amber-400/12 text-amber-100',
  sky: 'border-sky-300/40 bg-sky-400/12 text-sky-100',
  emerald: 'border-emerald-300/40 bg-emerald-400/12 text-emerald-100',
};

export function RealEstateReferralBoardMock() {
  return (
    <figure className="w-full">
      <div
        className="relative overflow-hidden rounded-[26px] border border-amber-300/25 p-5 sm:p-6 shadow-[0_40px_90px_-50px_rgba(0,0,0,0.9)]"
        style={{
          background:
            'linear-gradient(155deg,#0b1526 0%,#111f36 46%,#0a1220 100%), radial-gradient(circle at 88% 8%, rgba(212,175,55,0.22), transparent 55%)',
        }}
      >
        <div className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-amber-200/80 via-amber-400/30 to-transparent" />

        <header className="flex flex-wrap items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-amber-200/40 bg-amber-300/10 text-lg font-black tracking-tight text-amber-100">
            RT
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold text-white">Your referral shareboard</p>
              <span className={`${MOCK_LABEL} rounded-full border border-emerald-300/40 bg-emerald-400/10 px-2 py-1 text-emerald-100`}>
                Verified partner
              </span>
            </div>
            <p className="mt-1 text-xs text-white/50">Lic. #0000000 · Riverstone Realty · Metro Atlanta &amp; North Fulton</p>
          </div>
        </header>

        <div className="mt-5 space-y-2">
          {RE_REFERRALS.map((r) => (
            <div
              key={r.name}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-3.5 py-3"
            >
              <span className="text-sm font-semibold text-white/85">{r.name}</span>
              <span className={`${MOCK_LABEL} rounded-lg border px-2 py-1 ${RE_TONE[r.tone]}`}>{r.stage}</span>
              <span className="ml-auto text-[11px] text-white/45">{r.owner}</span>
            </div>
          ))}
        </div>

        <footer className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
          <span className="inline-flex items-center gap-2 rounded-lg border border-amber-200/30 bg-black/30 px-3 py-2 text-[11px] font-semibold text-amber-100/90">
            <Link2 size={13} /> finelycred.com/r/riverstone
          </span>
          <span className="text-[11px] text-white/40">Attribution stays on your link for every partner you send.</span>
        </footer>
      </div>
      <MockCaption>Illustrative shareboard — partner names and stages are examples, not real files.</MockCaption>
    </figure>
  );
}

/* ───────────────── Case help — parchment dossier (portrait-ish, serif, stamped) ───────────────── */

const CASE_DOCKET = [
  { matter: 'Midland Funding v. Partner', court: 'Dist. Ct · Div. 3', next: 'Answer due — 12 days' },
  { matter: 'Portfolio Recovery v. Partner', court: 'County Civ.', next: 'Discovery packet review' },
  { matter: 'Validation — Velocity', court: 'Pre-litigation', next: 'Day 24 of 30 clock' },
] as const;

export function CaseDeskDossierMock() {
  return (
    <figure className="w-full">
      <div className="relative">
        {/* folder tab */}
        <div className="ml-6 inline-flex items-center gap-2 rounded-t-lg border border-b-0 border-stone-400/60 bg-[#e7dfcc] px-4 py-1.5">
          <Gavel size={13} className="text-stone-700" />
          <span className="font-serif text-[11px] font-bold uppercase tracking-[0.2em] text-stone-700">Case desk file</span>
        </div>
        <div
          className="relative overflow-hidden rounded-sm rounded-tl-none border border-stone-400/60 p-5 sm:p-7 shadow-[0_28px_60px_-36px_rgba(41,37,36,0.6)]"
          style={{
            background:
              'linear-gradient(180deg,#faf6ea 0%,#f3ecdb 100%), radial-gradient(circle at 12% 8%, rgba(120,113,108,0.08), transparent 45%)',
          }}
        >
          <div className="pointer-events-none absolute right-4 top-5 -rotate-[14deg] rounded-md border-2 border-rose-800/45 px-3 py-1.5">
            <p className="font-serif text-[10px] font-black uppercase tracking-[0.2em] text-rose-800/70">Scope limited</p>
          </div>

          <p className="font-serif text-[10px] font-black uppercase tracking-[0.28em] text-stone-500">Credential block</p>
          <h4 className="mt-1.5 font-serif text-xl font-bold text-stone-900">A. Reyes, Paralegal</h4>
          <p className="mt-1 font-serif text-sm text-stone-600">
            Bar / cert. #00000 · Reyes Legal Support · Approved scope: assigned partner matters only
          </p>

          <div className="mt-5 border-t border-stone-300 pt-4">
            <p className="font-serif text-[10px] font-black uppercase tracking-[0.28em] text-stone-500">
              Assigned matters
            </p>
            <table className="mt-3 w-full border-collapse text-left font-serif text-sm">
              <tbody>
                {CASE_DOCKET.map((d) => (
                  <tr key={d.matter} className="border-b border-dotted border-stone-300 last:border-0">
                    <td className="py-2.5 pr-3 font-semibold text-stone-900">{d.matter}</td>
                    <td className="hidden py-2.5 pr-3 text-stone-500 sm:table-cell">{d.court}</td>
                    <td className="py-2.5 text-right text-stone-700">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarClock size={13} className="text-stone-500" />
                        {d.next}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-center gap-2 font-serif text-[11px] text-stone-600">
              <Lock size={13} /> Access is per-partner, logged, and revocable.
            </div>
            <div className="min-w-[9rem] border-t border-stone-500/70 pt-1.5 text-center font-serif text-[10px] uppercase tracking-[0.18em] text-stone-500">
              Session log signature
            </div>
          </div>
        </div>
      </div>
      <MockCaption tone="dark">Illustrative dossier — matters shown are examples, not real partner cases.</MockCaption>
    </figure>
  );
}

/* ───────────────── Credit specialist — holographic credential badge (portrait) ───────────────── */

const CS_VERIFIED = ['Findings-based dispute method', 'Letter studio + evidence vault', 'Escalation ladder cleared'] as const;
const CS_SERVICES = ['Personal restore', 'Credit build', 'Debt validation', 'Funding readiness'] as const;

export function SpecialistCredentialMock() {
  return (
    <figure className="mx-auto w-full max-w-[22rem]">
      {/* lanyard */}
      <div className="mx-auto h-6 w-28 rounded-t-xl border-x border-t border-white/15 bg-white/[0.06]" />
      <div
        className="relative overflow-hidden rounded-[28px] border border-violet-300/30 p-6 shadow-[0_44px_100px_-46px_rgba(139,92,246,0.6)]"
        style={{
          background:
            'linear-gradient(160deg,rgba(76,29,149,0.55) 0%,rgba(15,23,42,0.96) 42%,rgba(8,47,73,0.7) 100%), radial-gradient(circle at 80% 4%, rgba(217,70,239,0.28), transparent 52%)',
        }}
      >
        <div className="mx-auto -mt-2 mb-5 h-2 w-16 rounded-full bg-black/60 ring-1 ring-white/15" />

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`${MOCK_LABEL} text-violet-200/80`}>Finely Cred</p>
            <p className="mt-1 text-lg font-semibold leading-tight text-white">Credit Specialist</p>
          </div>
          <BadgeCheck size={26} className="shrink-0 text-emerald-300" />
        </div>

        <div className="mt-5 inline-flex items-center gap-2 rounded-md bg-[linear-gradient(100deg,rgba(251,191,36,0.9),rgba(245,158,11,0.75))] px-3 py-1.5">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/80">Certified tier</span>
        </div>

        <div className="mt-5 space-y-2.5">
          {CS_VERIFIED.map((v) => (
            <div key={v} className="flex items-center gap-2.5 text-[13px] text-white/75">
              <ShieldCheck size={14} className="shrink-0 text-violet-200" />
              {v}
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-white/10 pt-4">
          <p className={`${MOCK_LABEL} text-white/40`}>Service menu shown to routed partners</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {CS_SERVICES.map((s) => (
              <span
                key={s}
                className="rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-white/70"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <p className="mt-5 font-mono text-[11px] tracking-[0.24em] text-white/35">FC · SPEC · 0000</p>
      </div>
      <MockCaption>Illustrative portal credential — tier and specialty depend on your certification progress.</MockCaption>
    </figure>
  );
}

/* ───────────────── Agency — white-label tenant console (browser chrome, wide) ───────────────── */

const AGENCY_SEATS = ['DK', 'MR', 'AJ', 'TL'] as const;
const AGENCY_LANES = [
  { lane: 'Restore', chips: ['New partner', 'In findings', 'Milestone'] },
  { lane: 'Build', chips: ['Vendor ladder', 'AU prep'] },
  { lane: 'Funding', chips: ['Docs in', 'Underwriting'] },
] as const;

export function AgencyTenantConsoleMock() {
  return (
    <figure className="w-full">
      <div className="overflow-hidden rounded-2xl border border-amber-300/25 bg-black/70 shadow-[0_46px_110px_-48px_rgba(0,0,0,0.95)]">
        {/* window chrome */}
        <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-2.5">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          </span>
          <span className="flex-1 truncate rounded-md border border-white/10 bg-black/50 px-3 py-1.5 font-mono text-[11px] text-amber-100/80">
            portal.yourbrand.com/partners
          </span>
          <span className={`${MOCK_LABEL} hidden rounded-full border border-amber-300/35 bg-amber-400/10 px-2 py-1 text-amber-200 sm:inline`}>
            White-label
          </span>
        </div>

        <div className="grid gap-0 sm:grid-cols-[10rem_1fr]">
          {/* tenant sidebar */}
          <aside className="border-b border-white/10 bg-white/[0.02] p-4 sm:border-b-0 sm:border-r">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-dashed border-amber-300/50 text-[9px] font-black uppercase tracking-widest text-amber-200/70">
                Logo
              </span>
              <span className="text-sm font-semibold text-white/85">Your Agency</span>
            </div>
            <div className="mt-4 space-y-1.5">
              {['Partners', 'Disputes', 'Letters', 'Payouts'].map((n, i) => (
                <div
                  key={n}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${
                    i === 0 ? 'bg-amber-400/15 text-amber-100' : 'text-white/45'
                  }`}
                >
                  {n}
                </div>
              ))}
            </div>
          </aside>

          <div className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-amber-200" />
                <span className={`${MOCK_LABEL} text-white/45`}>Seat roster</span>
                <span className="flex -space-x-2">
                  {AGENCY_SEATS.map((s) => (
                    <span
                      key={s}
                      className="grid h-7 w-7 place-items-center rounded-full border border-black/60 bg-white/10 text-[9px] font-black text-white/75"
                    >
                      {s}
                    </span>
                  ))}
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.05] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/55">
                <Building2 size={12} /> Tenant admin
              </span>
            </div>

            <p className={`${MOCK_LABEL} mt-5 text-white/45`}>Lead routing lanes</p>
            <div className="mt-2.5 grid gap-2.5 sm:grid-cols-3">
              {AGENCY_LANES.map((l) => (
                <div key={l.lane} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-200/85">{l.lane}</p>
                  <div className="mt-2 space-y-1.5">
                    {l.chips.map((c) => (
                      <div key={c} className="rounded-md border border-white/10 bg-black/35 px-2 py-1.5 text-[11px] text-white/65">
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <MockCaption>Illustrative tenant console — branding, seats, and lanes are configured at signup.</MockCaption>
    </figure>
  );
}

/* ───────────────── AU seller — inventory shelf + payout receipt (stacked cards) ───────────────── */

const AU_SHELF = [
  { issuer: 'Issuer A · Signature', limit: '$42,000', age: '11 yr', slots: '1 of 2 open', tilt: '-rotate-2' },
  { issuer: 'Issuer B · Platinum', limit: '$28,500', age: '7 yr', slots: '2 of 2 open', tilt: 'rotate-1' },
  { issuer: 'Issuer C · Reserve', limit: '$65,000', age: '14 yr', slots: 'Filled — rotates in 18 d', tilt: '-rotate-1' },
] as const;

export function AuSellerShelfMock() {
  return (
    <figure className="w-full">
      <div className="rounded-[26px] border border-emerald-300/25 bg-[linear-gradient(165deg,rgba(6,78,59,0.5),rgba(2,20,26,0.92))] p-5 sm:p-6 shadow-[0_40px_96px_-50px_rgba(16,185,129,0.5)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CreditCard size={15} className="text-emerald-200" />
            <p className="text-sm font-semibold text-white">Your inventory shelf</p>
          </div>
          <span className={`${MOCK_LABEL} rounded-full border border-emerald-300/40 bg-emerald-400/10 px-2.5 py-1 text-emerald-100`}>
            Verified supplier · 4 seasons
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {AU_SHELF.map((c) => (
            <div
              key={c.issuer}
              className={`${c.tilt} rounded-2xl border border-emerald-200/20 bg-[linear-gradient(105deg,rgba(255,255,255,0.1),rgba(255,255,255,0.02))] p-4 backdrop-blur-sm transition-transform hover:rotate-0`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-white/90">{c.issuer}</p>
                <p className="font-mono text-lg font-black tabular-nums text-emerald-100">{c.limit}</p>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <span className="rounded-md border border-white/12 bg-black/30 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white/60">
                  Age {c.age}
                </span>
                <span className="rounded-md border border-emerald-300/25 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-100">
                  {c.slots}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* perforated payout receipt */}
        <div className="mt-6 rounded-xl border border-dashed border-emerald-200/35 bg-black/35 px-4 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={`${MOCK_LABEL} text-emerald-200/80`}>Payout ledger</p>
            <p className="text-[11px] text-white/45">Placement-linked · pending &amp; cleared</p>
          </div>
          <div className="mt-2.5 space-y-1.5 font-mono text-[11px] text-white/60">
            <div className="flex justify-between gap-3">
              <span>Placement #0000 · Issuer A</span>
              <span className="text-emerald-200">Cleared</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Placement #0000 · Issuer B</span>
              <span className="text-amber-200">Pending verification</span>
            </div>
          </div>
        </div>
      </div>
      <MockCaption>Illustrative shelf — limits, ages, and slot counts are examples, not current inventory.</MockCaption>
    </figure>
  );
}
