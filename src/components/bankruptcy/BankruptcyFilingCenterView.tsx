import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Landmark } from 'lucide-react';
import type { BankruptcyCase, BankruptcyChapter } from '../../domain/bankruptcyCase';
import {
  SELF_FILING_DISCLAIMER,
  estimateMeansTestPass,
} from '../../legal/bankruptcyFilingKnowledgePack';
import { SmartProofUploader } from '../evidence/SmartProofUploader';
import type { Partner } from '../../domain/partners';
import { BankruptcyAdvisorChat } from './BankruptcyAdvisorChat';
import { BankruptcyLiberationHub } from './BankruptcyLiberationHub';
import { CollateralWorkstationSection } from '../debt/CollateralWorkstationSection';
import { onBankruptcyScenarioSelected } from '../../lib/bankruptcyLaneCommsAutomation';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_FIELD_WIDTH_SM,
  finelyOsCatalogCardCompact,
  finelyOsGlowField,
  finelyOsMicroStat,
} from '../../features/os/finelyOsLightUi';

const CASE_MILESTONES = [
  { id: 'counseling', label: 'Pre-filing counseling' },
  { id: 'schedules', label: 'Schedules drafted' },
  { id: 'filed', label: 'Petition filed' },
  { id: '341', label: '341 meeting' },
  { id: 'discharge', label: 'Discharge / plan confirm' },
] as const;

function milestoneProgress(bkCase: BankruptcyCase | null): number {
  if (!bkCase) return 0;
  const map: Record<BankruptcyCase['status'], number> = {
    considering: 0,
    pre_filing: 1,
    filed: 3,
    discharged: 5,
    dismissed: 2,
    closed: 5,
  };
  return map[bkCase.status] ?? 0;
}

export function BankruptcyFilingCenterView({
  partner,
  email,
  bkCase,
  onUpdateCase,
}: {
  partner: Partner;
  email?: string;
  bkCase: BankruptcyCase | null;
  onUpdateCase: (c: BankruptcyCase) => void;
}) {
  const [chapter, setChapter] = useState<BankruptcyChapter>(bkCase?.chapter ?? '7');
  const [household, setHousehold] = useState('1');
  const [income, setIncome] = useState('');
  const [coachPrompt, setCoachPrompt] = useState<string | undefined>();
  const coachRef = useRef<HTMLDivElement>(null);

  const means = useMemo(() => {
    const inc = Number(income.replace(/[^\d.]/g, ''));
    if (!inc) return null;
    return estimateMeansTestPass({ householdSize: Number(household) || 1, annualIncome: inc });
  }, [household, income]);

  const progress = milestoneProgress(bkCase);

  useEffect(() => {
    if (!coachPrompt) return;
    coachRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [coachPrompt]);

  return (
    <div className="space-y-4">
      <BankruptcyLiberationHub
        onAskCoach={(prompt) => setCoachPrompt(prompt)}
        onSelectScenario={(id) => {
          if (id === 'save_home_foreclosure' || id === 'ch13_catch_up') setChapter('13');
          if (id === 'fresh_start_ch7') setChapter('7');
          if (id === 'business_reorg') setChapter('11');
          if (bkCase) {
            const ch =
              id === 'business_reorg' ? '11' : id === 'fresh_start_ch7' ? '7' : id === 'ch13_catch_up' || id === 'save_home_foreclosure' ? '13' : bkCase.chapter;
            onUpdateCase({ ...bkCase, chapter: ch });
            setChapter(ch);
          }
          void onBankruptcyScenarioSelected({ partner, scenarioId: id });
        }}
      />

      <div className="grid sm:grid-cols-3 gap-3">
        <div className={finelyOsCatalogCardCompact('violet')}>
          <label className={FINELY_OS_ENTITY_LABEL}>Chapter focus</label>
          <select
            value={chapter}
            onChange={(e) => {
              const ch = e.target.value as BankruptcyChapter;
              setChapter(ch);
              if (bkCase) onUpdateCase({ ...bkCase, chapter: ch });
            }}
            className={`${finelyOsGlowField('sky')} ${FINELY_OS_FIELD_WIDTH_SM} mt-1 w-full`}
          >
            <option value="7">Chapter 7 — fresh start</option>
            <option value="13">Chapter 13 — keep home / cure arrears</option>
            <option value="11">Chapter 11 — business reorg</option>
            <option value="12">Chapter 12 — family farmer</option>
          </select>
        </div>
        <div className={finelyOsCatalogCardCompact('violet')}>
          <div className={FINELY_OS_ENTITY_TITLE}>Case journey</div>
          <div className="mt-2 flex gap-1">
            {CASE_MILESTONES.map((m, i) => (
              <div
                key={m.id}
                title={m.label}
                className={`h-2 flex-1 rounded-full ${i < progress ? 'bg-sky-400' : 'bg-white/10'}`}
              />
            ))}
          </div>
          <div className="mt-1 text-[10px] text-white/50">
            {progress > 0 ? CASE_MILESTONES[progress - 1]?.label : 'Start a case above to track'}
          </div>
        </div>
        <div className={finelyOsCatalogCardCompact('sky')}>
          <div className="flex items-center gap-2">
            <Landmark size={14} className="text-sky-400" />
            <span className={finelyOsMicroStat('sky')}>Educational only</span>
          </div>
          <p className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1 line-clamp-3`}>{SELF_FILING_DISCLAIMER}</p>
        </div>
      </div>

      <div className={finelyOsCatalogCardCompact('violet')}>
        <h3 className={`${FINELY_OS_ENTITY_TITLE} mb-2`}>Means test snapshot (Ch 7)</h3>
        <div className="grid sm:grid-cols-2 gap-3 max-w-lg">
          <div>
            <label className={FINELY_OS_ENTITY_LABEL}>Household size</label>
            <input
              type="number"
              min={1}
              max={8}
              value={household}
              onChange={(e) => setHousehold(e.target.value)}
              className={`${finelyOsGlowField('sky')} w-full mt-1`}
            />
          </div>
          <div>
            <label className={FINELY_OS_ENTITY_LABEL}>Annual gross income ($)</label>
            <input
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="e.g. 52000"
              className={`${finelyOsGlowField('sky')} w-full mt-1`}
            />
          </div>
        </div>
        {means ? (
          <p className={`mt-3 text-sm ${means.likelyCh7Eligible ? 'text-emerald-200' : 'text-amber-200'}`}>
            {means.explanation}
          </p>
        ) : null}
      </div>

      <SmartProofUploader
        partner={partner}
        email={email}
        compact
        bankruptcyCaseId={bkCase?.id}
        uploadContext="bankruptcy"
        onUploaded={() => {}}
      />

      <div ref={coachRef}>
        <CollateralWorkstationSection
          title="Your bankruptcy specialist"
          subtitle="Dedicated coach for your lane — means test, automatic stay, home retention, schedules."
          accent="white"
        >
          <BankruptcyAdvisorChat
            scenario={chapter === '11' ? 'business_chapter_11' : 'personal_chapter_7_13'}
            injectPrompt={coachPrompt}
          />
        </CollateralWorkstationSection>
      </div>
    </div>
  );
}
