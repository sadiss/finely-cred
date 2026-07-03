import React from 'react';
import { Gavel } from 'lucide-react';
import type { DebtScenario } from '../../domain/debtLegal';
import { DebtCoachChat } from './DebtCoachChat';

const QUICK = [
  { label: 'Calendar deadline', prompt: 'How do I calculate and calendar my summons answer deadline?' },
  { label: 'Affidavit outline', prompt: 'What belongs in a sworn affidavit of dispute for this type of case?' },
  { label: 'Discovery RFAs', prompt: 'What requests for admission should I send about assignments and securitization?' },
];

const CHIPS = [
  { label: 'Burden of proof', prompt: 'What must the plaintiff prove in a debt collection lawsuit?' },
  { label: 'Standing', prompt: 'How do I challenge standing and chain of assignment?' },
  { label: 'Mini-Miranda', prompt: 'My summons has debt-collector language — what does that mean for FDCPA and my answer?' },
  { label: 'Motion to compel', prompt: 'When should I file a motion to compel discovery for assignment documents?' },
  { label: 'Talk to their lawyer', prompt: 'Should I negotiate with the collection attorney before filing my answer?' },
];

export function CourtAdvisorChat({
  scenario,
  debtName,
  caseNumber,
  stateJurisdiction,
}: {
  scenario: DebtScenario;
  debtName?: string;
  caseNumber?: string;
  stateJurisdiction?: string;
}) {
  return (
    <DebtCoachChat
      mode="court"
      accent="fuchsia"
      scenario={scenario}
      debtName={debtName}
      caseNumber={caseNumber}
      stateJurisdiction={stateJurisdiction}
      icon={<Gavel size={18} className="text-fuchsia-300" />}
      title="Court coach"
      tagline="Deadlines first — then your sworn record"
      taskType="debt.court.advisor"
      systemPrompt="You are Finely Cred Court & Affidavit Coach. Summons deadlines, sworn affidavits, burden of proof, SOL, standing, chain of assignment. Educational only — urge licensed counsel for jurisdiction-specific procedure."
      quickSteps={QUICK}
      promptChips={CHIPS}
      coachLane="court"
    />
  );
}
