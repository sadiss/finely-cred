import React from 'react';
import { Car } from 'lucide-react';
import type { DebtScenario } from '../../domain/debtLegal';
import { DebtCoachChat } from './DebtCoachChat';

const QUICK = [
  { label: 'Wrongful repo', prompt: 'They repossessed without default or breach of peace — what do I demand under UCC Article 9?' },
  { label: 'Reinstate vehicle', prompt: 'How do I reinstate my auto loan and get the vehicle back before sale?' },
  { label: 'Claim & delivery', prompt: 'I was sued for claim and delivery / replevin — what goes in my answer and affidavit?' },
];

const CHIPS = [
  { label: 'Redemption rights', prompt: 'Can I redeem the collateral before sale and what payoff must I tender?' },
  { label: 'Deficiency fight', prompt: 'Deficiency balance after repo sale looks inflated — what accounting do I demand?' },
  { label: 'Personal property', prompt: 'They kept my belongings in the car — what letter demands return of personal property?' },
  { label: 'Lease turn-in', prompt: 'Dealer refused lease return and repo followed — how do I document lessor breach?' },
  { label: 'Surplus funds', prompt: 'Sale exceeded what I owed — how do I demand surplus funds under UCC § 9-615?' },
  { label: 'Credit reporting', prompt: 'Repo balance on credit report is wrong — what FCRA dispute targets auto deficiency?' },
];

export function RepossessionAdvisorChat({
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
      mode="repossession"
      scenario={scenario ?? 'summons_served'}
      debtName={debtName}
      stateJurisdiction={stateJurisdiction}
      icon={<Car size={18} className="text-rose-300" />}
      title="Repossession coach"
      tagline="UCC Article 9 — protect your collateral"
      taskType="debt.repossession.advisor"
      systemPrompt="You are Finely Cred Repossession Coach. UCC Article 9 repossession limits, breach of peace, reinstatement, redemption, commercially reasonable sale, deficiency under § 9-615, personal property in vehicle, claim-and-delivery answers, lease trust standing, FDCPA on deficiency collectors, FCRA reporting disputes. Consumer-favorable. Never tell user to admit debt without proof."
      quickSteps={QUICK}
      promptChips={CHIPS}
      accent="rose"
      coachLane="repossession"
    />
  );
}
