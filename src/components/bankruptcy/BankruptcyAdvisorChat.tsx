import React from 'react';
import { Landmark } from 'lucide-react';
import type { BankruptcyScenario } from '../../domain/bankruptcyLegal';
import { DebtCoachChat } from '../debt/DebtCoachChat';

const QUICK = [
  { label: 'Save my home', prompt: 'I have a foreclosure sale date coming up. Walk me through filing timing, automatic stay, and Chapter 13 home retention step by step.' },
  { label: 'Court → bureau flow', prompt: 'Is contacting the bankruptcy court clerk enough to remove a bankruptcy from my credit report?' },
  { label: 'Post-discharge', prompt: 'How do I dispute tradelines still showing balance after Chapter 7 discharge?' },
];

const CHIPS = [
  { label: 'Foreclosure stay', prompt: 'Does filing bankruptcy stop a foreclosure sale? What must I file before the sale date?' },
  { label: 'Ch 13 cure plan', prompt: 'How does Chapter 13 help me cure mortgage arrearage and keep my home? What makes a plan feasible?' },
  { label: '§ 1681c obsolescence', prompt: 'How long can a bankruptcy public record report under FCRA § 1681c?' },
  { label: '§ 524 discharge', prompt: 'How does 11 U.S.C. § 524 affect credit reporting after discharge?' },
  { label: 'Business Ch 11', prompt: 'What is the difference between business Chapter 11 and personal Chapter 7?' },
  { label: 'Not my bankruptcy', prompt: 'How do I dispute a bankruptcy on my report that is not mine?' },
];

export function BankruptcyAdvisorChat({
  scenario,
  injectPrompt,
}: {
  scenario: BankruptcyScenario;
  injectPrompt?: string;
}) {
  return (
    <DebtCoachChat
      mode="validation"
      accent="sky"
      scenario={scenario as any}
      icon={<Landmark size={18} className="text-sky-300" />}
      title="Bankruptcy coach"
      tagline="Liberation paths — home retention, stay, discharge, bureau fixes"
      taskType="bankruptcy.advisor"
      systemPrompt="You are Finely Cred Bankruptcy & Credit Reporting Coach under Ruth (Co-Owner) stewardship. Chapters 7/11/12/13, automatic stay, foreclosure timing, home retention via Ch 13, FCRA § 611/§ 623/§ 1681c, § 524 discharge reporting, court clerk inquiry workflow. When someone may lose their home, go deep: sale date, stay timing, arrearage cure, plan feasibility, loss mitigation, dual-tracking. Explain that clerk letters alone rarely delete legitimate BK — pair with accuracy and verification failures. Educational only — urge licensed bankruptcy counsel for filing."
      quickSteps={QUICK}
      promptChips={CHIPS}
      coachLane="bankruptcy"
      injectPrompt={injectPrompt}
    />
  );
}
