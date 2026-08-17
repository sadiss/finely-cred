import React, { useMemo, useState } from 'react';
import { Landmark, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { BankruptcyLetterType, BankruptcyScenario } from '../../domain/bankruptcyLegal';
import { BANKRUPTCY_SCENARIO_RECOMMENDATIONS } from '../../domain/bankruptcyLegal';
import {
  BANKRUPTCY_LETTER_SPECS,
  getBankruptcyLetterBody,
  type BankruptcyLetterArgs,
} from '../../legal/bankruptcyLetterTemplates';
import {
  BANKRUPTCY_REMOVAL_GROUNDS,
  BANKRUPTCY_WORKFLOW_STEPS,
  COURT_INQUIRY_METHOD_ASSESSMENT,
} from '../../legal/bankruptcyKnowledgePack';
import { BankruptcyAdvisorChat } from './BankruptcyAdvisorChat';
import { DebtLetterChipGrid } from '../debt/DebtLetterChipGrid';
import { CollateralWorkstationSection } from '../debt/CollateralWorkstationSection';
import { PartnerDebtSnapshotStrip } from '../debt/PartnerDebtSnapshotStrip';
import { FinelyOsKpiGrid } from '../os/FinelyOsKpiGrid';
import {
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_FIELD_WIDTH_SM,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsGlowField,
  finelyOsMicroStat,
} from '../../features/os/finelyOsLightUi';

export function BankruptcyCenterView({
  partnerId,
  partnerName,
  partnerEmail,
  partnerState,
  address1,
  city,
  postalCode,
  onBuildDraft,
  canSeeTemplates,
}: {
  partnerId: string;
  partnerName: string;
  partnerEmail?: string;
  partnerState?: string;
  address1?: string;
  city?: string;
  postalCode?: string;
  onBuildDraft: (id: BankruptcyLetterType, text: string) => void;
  canSeeTemplates: boolean;
}) {
  const [scenario, setScenario] = useState<BankruptcyScenario>('court_proof_workflow');
  const scenarioRec = useMemo(
    () => BANKRUPTCY_SCENARIO_RECOMMENDATIONS.find((r) => r.scenario === scenario),
    [scenario],
  );
  const specs = useMemo(() => {
    const rec = scenarioRec?.recommendedLetters ?? [];
    return BANKRUPTCY_LETTER_SPECS.filter((s) => rec.includes(s.id));
  }, [scenarioRec]);

  const letterArgs: BankruptcyLetterArgs = {
    debtorName: partnerName,
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    email: partnerEmail,
    state: partnerState,
    address1,
    city,
    postalCode,
  };

  return (
    <div className={FINELY_OS_COMPACT_PAGE}>
      <div className={finelyOsCatalogCardCompact('violet')}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Landmark size={15} className="text-sky-400 shrink-0" />
            <div>
              <span className={finelyOsMicroStat('sky')}>Bankruptcy</span>
              <div className={FINELY_OS_ENTITY_TITLE}>Bankruptcy & bureau dispute center</div>
            </div>
          </div>
          <Link to="/portal/disputes" className={FINELY_OS_SECONDARY_BTN}>
            Dispute center <ArrowRight size={14} />
          </Link>
        </div>
        <p className={`${FINELY_OS_ENTITY_BODY} text-sm opacity-90 max-w-2xl`}>
          Chapters 7/11/13, foreclosure stay, business debt, and credit bureau disputes — court inquiry workflow plus FCRA statutory removal grounds.
        </p>
      </div>

      <PartnerDebtSnapshotStrip partnerId={partnerId} compact accent="sky" />

      <FinelyOsKpiGrid
        glow="sky"
        items={[
          { label: 'Workflow', value: String(BANKRUPTCY_WORKFLOW_STEPS.length), hint: 'Steps' },
          { label: 'Removal grounds', value: String(BANKRUPTCY_REMOVAL_GROUNDS.length), hint: 'FCRA/BK' },
          { label: 'Letters', value: String(BANKRUPTCY_LETTER_SPECS.length), hint: 'Templates' },
        ]}
      />

      <div className={finelyOsCatalogCardCompact('violet')}>
        <label className="block text-xs text-white/60 mb-1">Your situation</label>
        <select
          value={scenario}
          onChange={(e) => setScenario(e.target.value as BankruptcyScenario)}
          className={`${finelyOsGlowField('sky')} ${FINELY_OS_FIELD_WIDTH_SM}`}
        >
          {BANKRUPTCY_SCENARIO_RECOMMENDATIONS.map((r) => (
            <option key={r.scenario} value={r.scenario}>
              {r.label}
            </option>
          ))}
        </select>
        {scenarioRec?.legalWarning ? (
          <p className="mt-2 text-xs text-amber-200/90">{scenarioRec.legalWarning}</p>
        ) : null}
      </div>

      <div className={finelyOsCatalogCardCompact('violet')}>
        <h3 className={`${FINELY_OS_ENTITY_TITLE} mb-2`}>Is the court-letter method enough?</h3>
        <p className={`${FINELY_OS_ENTITY_BODY} text-sm mb-2`}>{COURT_INQUIRY_METHOD_ASSESSMENT.summary}</p>
        <ul className={`${FINELY_OS_ENTITY_BODY} text-xs space-y-1 list-disc pl-4 opacity-90`}>
          {COURT_INQUIRY_METHOD_ASSESSMENT.howToStrengthen.slice(0, 4).map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </div>

      <div className={finelyOsCatalogCardCompact('violet')}>
        <h3 className={`${FINELY_OS_ENTITY_TITLE} mb-2`}>Statutory removal grounds</h3>
        <div className="grid sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
          {BANKRUPTCY_REMOVAL_GROUNDS.map((g) => (
            <div key={g.id} className="rounded-lg border border-sky-500/25 bg-black/30 p-2 text-xs">
              <div className="font-medium text-sky-200">{g.title}</div>
              <div className="text-white/60 mt-1">{g.statutes.join(' · ')}</div>
              <div className="mt-1 opacity-80">{g.whenItApplies}</div>
            </div>
          ))}
        </div>
      </div>

      {canSeeTemplates ? (
        <DebtLetterChipGrid
          specs={specs.map((s) => ({ id: s.id as any, title: s.title, shortDescription: s.shortDescription }))}
          subtitle="Bankruptcy letter templates — same library styling as validation and court tracks."
          onBuild={(id) => onBuildDraft(id as BankruptcyLetterType, getBankruptcyLetterBody(id as BankruptcyLetterType, letterArgs))}
        />
      ) : null}

      <CollateralWorkstationSection title="Bankruptcy coach" subtitle="Ask about Ch 7/13 strategy, stay notices, creditor matrix, and post-discharge bureau cleanup — full width." accent="white">
        <BankruptcyAdvisorChat scenario={scenario} />
      </CollateralWorkstationSection>
    </div>
  );
}
