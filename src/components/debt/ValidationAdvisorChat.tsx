import React from 'react';
import { ShieldCheck } from 'lucide-react';
import type { DebtScenario } from '../../domain/debtLegal';
import { DebtCoachChat } from './DebtCoachChat';

const QUICK = [
  { label: 'Send 1692g letter', prompt: 'What exactly should my first FDCPA validation letter demand, step by step?' },
  { label: 'Document audit grid', prompt: 'Walk me through the Defense Book document audit: agreement, bill of sale, sale file, statements, entity authority, witness proof.' },
  { label: 'Round 2 deficiency', prompt: 'They sent a weak validation packet — what goes in my deficiency letter?' },
];

const CHIPS = [
  { label: '1692g proof list', prompt: 'What must they prove under FDCPA § 1692g?' },
  { label: 'Bill of sale only', prompt: 'They sent only a bill of sale — what goes in my deficiency letter?' },
  { label: 'Assignment chain', prompt: 'How do I demand assignment registry and chain of title from the original creditor?' },
  { label: 'UCC proof of assignment', prompt: 'How do I use UCC § 9-406 reasonable proof of assignment without overclaiming the debt is void?' },
  { label: 'Credit reporting', prompt: 'Can I challenge credit reporting without admitting the debt?' },
  { label: 'If they ignore me', prompt: 'What if they ignore my validation letter — what do I file next?' },
  { label: 'Open Rights Reference', prompt: 'Summarize the Laws & Rights Reference stack for my validation track and which 2–3 laws fit a typical debt-buyer packet.' },
];

export function ValidationAdvisorChat({
  scenario,
  debtName,
  stateJurisdiction,
  embedded = false,
}: {
  scenario: DebtScenario;
  debtName?: string;
  stateJurisdiction?: string;
  /** When true, render inline (no launcher button) — for FinelyOsWorkstationCoachHub. */
  embedded?: boolean;
}) {
  return (
    <DebtCoachChat
      mode="validation"
      accent="emerald"
      scenario={scenario}
      debtName={debtName}
      stateJurisdiction={stateJurisdiction}
      icon={<ShieldCheck size={18} className="text-emerald-300" />}
      title="Validation coach"
      tagline="Proof-before-collection — your next move"
      taskType="debt.validation.advisor"
      systemPrompt="You are Finely Cred Validation Coach. FDCPA § 1692g, licensing, ownership, itemized accounting, chain of title, credit reporting. Consumer-favorable, procedural. Never tell user to admit the debt."
      quickSteps={QUICK}
      promptChips={CHIPS}
      coachLane="validation"
      modalLaunch={embedded ? undefined : { triggerLabel: 'Ask validation coach' }}
    />
  );
}
