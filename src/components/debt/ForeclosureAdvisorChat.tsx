import React from 'react';
import { Home } from 'lucide-react';
import type { DebtScenario } from '../../domain/debtLegal';
import { DebtCoachChat } from './DebtCoachChat';

const QUICK = [
  { label: 'RESPA QWR now', prompt: 'What must I demand in a RESPA qualified written request for my mortgage loan history and escrow?' },
  { label: 'Stop dual-track', prompt: 'Foreclosure filed while modification pending — how do I document and stop dual tracking?' },
  { label: 'Note & assignment', prompt: 'How do I demand the original note and recorded assignment chain before foreclosure proceeds?' },
];

const CHIPS = [
  { label: 'Loss mitigation', prompt: 'What loss mitigation options should I request before foreclosure sale?' },
  { label: 'Wrongful acceleration', prompt: 'My acceleration notice looks defective — what defenses and letters should I send?' },
  { label: 'SCRA stay', prompt: 'I am active duty — how does SCRA protect me from foreclosure and what notice do I send?' },
  { label: 'Bankruptcy stay', prompt: 'I filed Chapter 13 — what notice stops the foreclosure sale?' },
  { label: 'Credit after FC', prompt: 'Foreclosure on my credit report is wrong — what FCRA dispute do I send?' },
  { label: 'Force-placed insurance', prompt: 'Servicer force-placed insurance inflated my escrow — what RESPA dispute applies?' },
];

export function ForeclosureAdvisorChat({
  scenario,
  debtName,
  stateJurisdiction,
}: {
  scenario?: DebtScenario;
  debtName?: string;
  stateJurisdiction?: string;
}) {
  return (
    <DebtCoachChat
      mode="foreclosure"
      scenario={scenario ?? 'summons_served'}
      debtName={debtName}
      stateJurisdiction={stateJurisdiction}
      icon={<Home size={18} className="text-amber-300" />}
      title="Foreclosure coach"
      tagline="Servicer accountability — your next move"
      taskType="debt.foreclosure.advisor"
      systemPrompt="You are Finely Cred Foreclosure Coach. RESPA § 2605 qualified written requests, loss mitigation, dual-tracking, note possession, assignment chain, UCC § 3-308 burden, SCRA stays, bankruptcy stay notices, post-foreclosure FCRA disputes. Consumer-favorable, procedural. Never tell user to admit default without analysis."
      quickSteps={QUICK}
      promptChips={CHIPS}
      accent="amber"
      coachLane="foreclosure"
    />
  );
}
