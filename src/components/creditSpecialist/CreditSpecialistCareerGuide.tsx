import React, { useMemo, useState } from 'react';
import { ArrowRight, Check, ChevronRight, GraduationCap, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AgentSplitCalculator } from '../agent/AgentSplitCalculator';
import { TogglePillGroup } from '../ui/TogglePillGroup';
import type { AgentTrainingPhaseId, AgentSpecialtyId } from '../../domain/agentProgram';
import { AGENT_SPECIALTIES, defaultAgentOperatingModel, formatAgentMoney, SPECIALTY_ECONOMICS } from '../../domain/agentProgram';
import {
  exampleEarnings,
  getTrainingPhaseDetail,
  TRAINING_PHASE_CAREER_DETAILS,
  PROGRAM_ROLE_MODEL,
  REVENUE_SHARE_EXPLAINER,
} from '../../config/creditSpecialistCareers';
import { AGENCY } from '../../config/agencyPartnersProgram';
import { CS_PUBLIC } from './creditSpecialistPublicUi';
import { FINELY_OS_PRIMARY_BTN, FINELY_OS_SECONDARY_BTN, finelyOsCatalogCard } from '../../features/os/finelyOsLightUi';

const LADDER_COLORS: Record<AgentTrainingPhaseId, string> = {
  apprenticeship: 'from-amber-500 to-orange-600',
  guided: 'from-violet-500 to-indigo-600',
  independent: 'from-emerald-500 to-teal-600',
  partner: 'from-slate-800 to-amber-600',
};

export function CreditSpecialistCareerGuide() {
  const navigate = useNavigate();
  const [phaseId, setPhaseId] = useState<AgentTrainingPhaseId>('apprenticeship');
  const [previewSpecialties, setPreviewSpecialties] = useState<AgentSpecialtyId[]>(['personal_restore']);
  const phase = getTrainingPhaseDetail(phaseId);
  const previewModel = useMemo(
    () =>
      defaultAgentOperatingModel({
        specialties: previewSpecialties,
        trainingPhase: phaseId,
        capacityTierId: 'agency_solo',
      }),
    [previewSpecialties, phaseId],
  );
  const earnings = exampleEarnings(phase.agentKeepPctTypical, SPECIALTY_ECONOMICS.personal_restore.sampleClientFeeCents);

  return (
    <div className="space-y-12 sm:space-y-16">
      <header className="space-y-4">
        <p className={CS_PUBLIC.pageKicker}>Tiers &amp; pay</p>
        <h1 className={CS_PUBLIC.pageTitle}>How you get paid</h1>
        <p className={CS_PUBLIC.pageLead}>
          Percentages are on <strong className="text-slate-900">that file&apos;s service fee</strong> only. Tools are included
          at every level; your % grows as you run more of the work yourself.
        </p>
      </header>

      <section className={`${finelyOsCatalogCard('amber')} !p-6 sm:!p-10 border-2 border-amber-200 space-y-6`}>
        <div>
          <p className={CS_PUBLIC.sectionKicker}>Read this first</p>
          <h2 className={`mt-2 ${CS_PUBLIC.sectionTitle}`}>Three terms — don&apos;t mix them up</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {PROGRAM_ROLE_MODEL.rows.map((row, i) => (
            <div key={row.term} className="rounded-2xl border-2 border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-lg font-black text-amber-800">
                  {i + 1}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{row.term}</h3>
              </div>
              <p className={CS_PUBLIC.body}>{row.meaning}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-violet-100 border-2 border-violet-200 px-5 py-4">
          <p className="text-base sm:text-lg font-semibold text-violet-950">{PROGRAM_ROLE_MODEL.percentOf}</p>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <p className={CS_PUBLIC.sectionKicker}>Your path</p>
          <h2 className={`mt-2 ${CS_PUBLIC.sectionTitle}`}>Specialist career ladder</h2>
          <p className={`mt-3 ${CS_PUBLIC.sectionLead}`}>
            Tap a step. Everyone starts ~30% keep. Only <strong>Certified partner</strong> reaches up to ~80%.
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {TRAINING_PHASE_CAREER_DETAILS.map((p, idx) => {
            const active = phaseId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPhaseId(p.id)}
                className={
                  'text-left rounded-2xl p-4 sm:p-5 border-2 transition-all ' +
                  (active
                    ? 'border-violet-500 ring-4 ring-violet-200 bg-white shadow-lg'
                    : 'border-slate-200 bg-white hover:border-violet-300 hover:shadow-md')
                }
              >
                <div className={`text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r ${LADDER_COLORS[p.id]} px-2 py-1 rounded-md inline-block`}>
                  Step {idx + 1}
                </div>
                <div className="mt-3 text-lg sm:text-xl font-bold text-slate-900">{p.label}</div>
                <div className={`mt-2 ${CS_PUBLIC.statHuge} text-emerald-600`}>{p.agentKeepPctTypical}%</div>
                <div className={CS_PUBLIC.statLabel}>typical keep</div>
                {active ? (
                  <div className="mt-2 text-sm font-bold text-violet-600 flex items-center gap-1">
                    Selected <ChevronRight size={14} />
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className={`${finelyOsCatalogCard('violet')} !p-6 sm:!p-10 space-y-8`}>
        <div>
          <p className={CS_PUBLIC.sectionKicker}>Step 1 — {phase.label}</p>
          <h2 className={`mt-2 ${CS_PUBLIC.sectionTitle}`}>{phase.tagline}</h2>
        </div>
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-5 text-center">
                <div className={CS_PUBLIC.cardLabel}>You keep</div>
                <div className={`${CS_PUBLIC.statHuge} text-emerald-700 mt-2`}>{phase.agentKeepPctTypical}%</div>
              </div>
              <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-5 text-center">
                <div className={CS_PUBLIC.cardLabel}>Finely</div>
                <div className={`${CS_PUBLIC.statHuge} text-slate-700 mt-2`}>{phase.platformKeepPctTypical}%</div>
              </div>
            </div>
            <div className="rounded-2xl border-2 border-violet-200 bg-violet-50 p-5 space-y-3">
              <h3 className={CS_PUBLIC.cardTitle}>Example dollars</h3>
              <p className={CS_PUBLIC.bodySm}>{SPECIALTY_ECONOMICS.personal_restore.feeLabel} · client pays {earnings.clientFeeLabel}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white border-2 border-emerald-200 p-4">
                  <div className="text-2xl font-black text-emerald-700">{earnings.agentLabel}</div>
                  <div className={CS_PUBLIC.bodySm}>to you</div>
                </div>
                <div className="rounded-xl bg-white border-2 border-slate-200 p-4">
                  <div className="text-2xl font-black text-slate-700">{earnings.platformLabel}</div>
                  <div className={CS_PUBLIC.bodySm}>to Finely</div>
                </div>
              </div>
            </div>
            <p className={CS_PUBLIC.body}><strong>Why:</strong> {phase.whyThisSplit}</p>
            <p className={CS_PUBLIC.bodySm}><strong>Leads:</strong> {phase.leadsAndMarketing}</p>
          </div>
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border-2 border-emerald-200 bg-white p-6 space-y-3">
              <h3 className={`${CS_PUBLIC.cardTitle} flex items-center gap-2`}><Users size={22} /> Your tasks</h3>
              <ul className="space-y-2">
                {phase.yourTasks.map((t) => (
                  <li key={t} className={`flex gap-2 ${CS_PUBLIC.body}`}><Check size={18} className="text-emerald-600 shrink-0" />{t}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-sky-200 bg-white p-6 space-y-3">
              <h3 className={`${CS_PUBLIC.cardTitle} flex items-center gap-2`}><GraduationCap size={22} /> Finely provides</h3>
              <ul className="space-y-2">
                {phase.finelyProvides.map((t) => (
                  <li key={t} className={`flex gap-2 ${CS_PUBLIC.body}`}><Check size={18} className="text-sky-600 shrink-0" />{t}</li>
                ))}
              </ul>
            </div>
            <div className="sm:col-span-2 rounded-2xl border-2 border-violet-200 bg-violet-50 p-4">
              <p className={CS_PUBLIC.body}><strong>Graduate when:</strong> {phase.graduateWhen}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${finelyOsCatalogCard('sky')} !p-6 sm:!p-8 space-y-4`}>
        <h2 className={CS_PUBLIC.cardTitle}>{REVENUE_SHARE_EXPLAINER.headline}</h2>
        <ul className="space-y-2">
          {REVENUE_SHARE_EXPLAINER.bullets.map((b) => (
            <li key={b} className={`flex gap-2 ${CS_PUBLIC.body}`}>
              <Check size={18} className="text-sky-600 shrink-0" />
              {b}
            </li>
          ))}
        </ul>
        <p className={CS_PUBLIC.bodySm}>{REVENUE_SHARE_EXPLAINER.footnote}</p>
      </section>

      <section className="rounded-2xl border-2 border-slate-300 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 sm:p-10">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-amber-300">Different track</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold">Building a company?</h2>
            <p className="mt-3 text-lg text-white/80">
              Agency partners get a tenant, team seats, and white-label portal — capacity tiers and company splits live on
              the agency page, not here.
            </p>
          </div>
          <button type="button" onClick={() => navigate(AGENCY.publicPath)} className={FINELY_OS_PRIMARY_BTN}>
            Agency partners <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <section className={`${finelyOsCatalogCard('amber')} !p-6 sm:!p-10 space-y-6`}>
        <h2 className={CS_PUBLIC.sectionTitle}>Try a sample sale</h2>
        <TogglePillGroup
          label="Specialty"
          variant="white"
          multiple
          options={AGENT_SPECIALTIES.map((s) => ({
            id: s.id,
            label: s.label,
            hint: formatAgentMoney(SPECIALTY_ECONOMICS[s.id].sampleClientFeeCents),
          }))}
          value={previewSpecialties}
          onChange={(v) => setPreviewSpecialties(v as AgentSpecialtyId[])}
        />
        <AgentSplitCalculator model={previewModel} showLeverControls={false} compact />
      </section>
    </div>
  );
}
