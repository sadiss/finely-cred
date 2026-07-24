import React from 'react';
import { Gavel } from 'lucide-react';
import type { DebtScenario } from '../../domain/debtLegal';
import { DebtCoachChat } from './DebtCoachChat';

const QUICK = [
  { label: 'Calendar deadline', prompt: 'How do I calculate and calendar my summons answer deadline?' },
  { label: 'Five-gate strategy', prompt: 'Walk me through the five-gate debt-buyer strategy: named plaintiff, transfer chain, account-level match, amount legality, and witness reliability.' },
  { label: 'Hearing script', prompt: 'Give me short court-safe answers: recognize original account if true, but force proof of ownership, authority, and amount.' },
];

const CHIPS = [
  { label: 'Burden of proof', prompt: 'What must the plaintiff prove in a debt collection lawsuit?' },
  { label: 'Standing', prompt: 'How do I challenge standing and chain of assignment?' },
  { label: 'Account-level sale file', prompt: 'They have a bill of sale but no account-level sale file — what questions do I ask and what letters do I send?' },
  { label: 'Amount audit', prompt: 'How do I attack the dollars — charge-off vs sale vs lawsuit balance, interest, and unauthorized fees?' },
  { label: 'Settlement terms', prompt: 'Settlement offered — what terms protect me from a consent judgment and accidental admission?' },
  { label: 'Motion to compel', prompt: 'When should I file a motion to compel discovery for assignment documents?' },
  { label: 'Open Defense Book', prompt: 'Summarize the Partner Defense Book court card and five questions I should ask at hearing.' },
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
