/**
 * Guided post-judgment process paths — educational only, not legal advice.
 * Steps operate on the open debt case (no second account list).
 */

import type { DebtCase, PostJudgmentMechanism } from './debt';

export type JudgmentAttackStepId =
  | 'get_the_papers'
  | 'calendar_the_window'
  | 'protect_the_account'
  | 'mechanism_letters'
  | 'attack_the_judgment'
  | 'counterclaim_paths'
  | 'parallel_help'
  | 'last_resort_process';

export type JudgmentAttackStep = {
  id: JudgmentAttackStepId;
  title: string;
  whyNow: string;
  doThis: string[];
  watchFor: string;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
};

function mechanismLabel(mechanism: PostJudgmentMechanism | undefined): string {
  if (mechanism === 'setoff') return 'deposit setoff';
  if (mechanism === 'ach') return 'ACH / electronic pull';
  if (mechanism === 'levy') return 'bank levy';
  return 'levy, setoff, or electronic pull';
}

function mechanismLetterHint(mechanism: PostJudgmentMechanism | undefined): string {
  if (mechanism === 'ach') {
    return 'Start with the Reg E unauthorized-transfer draft, then the records / signature-card request.';
  }
  if (mechanism === 'setoff') {
    return 'Start with the Reg Z card-issuer offset demand, then the records request.';
  }
  return 'Start with the records / signature-card request and the 31 C.F.R. Part 212 protected-benefits notice if benefits hit this account.';
}

export function buildJudgmentAttackSteps(debt: DebtCase): JudgmentAttackStep[] {
  const mechanism = mechanismLabel(debt.mechanism);
  const state = (debt.accountState ?? debt.judgmentState ?? debt.stateJurisdiction ?? '').trim().toUpperCase();
  const stateBit = state ? ` ${state}` : '';
  const bankBit = debt.accountBank?.trim() ? ` at ${debt.accountBank.trim()}` : '';
  const nonPartyBit = debt.nonPartyInvolved
    ? ' This file is marked as involving a non-party owner — demand ownership records before any turnover.'
    : '';

  return [
    {
      id: 'get_the_papers',
      title: 'Get the papers that froze the money',
      whyNow: `You cannot challenge a ${mechanism} with a guess. You need the writ, restraining notice, levy, or bank letter for this case.`,
      doThis: [
        'Ask the bank for a copy of every levy, writ, restraining notice, or internal setoff authorization they received, with the date served.',
        'Get the case caption, docket / index number, court name, and judgment date from the court clerk (phone or portal — do not scrape court sites).',
        'If a non-party or minor is on the account, request the signature card and titling documents first.',
      ],
      watchFor: 'A bank “hold” without a writ still needs a written explanation. Results vary · not legal advice.',
      accent: 'emerald',
    },
    {
      id: 'calendar_the_window',
      title: 'Calendar the exemption / objection window',
      whyNow: `State${stateBit} claim windows are often measured in days, not weeks. Missing the printed cutoff can forfeit the listing even when the funds were exempt.`,
      doThis: [
        'Use the exemption profile and holiday-adjusted due date on this page as a planning estimate only.',
        'Enter the judgment-entered date so vacate, appeal, and confession-of-judgment clocks can count from the right day.',
        'Count levy claims from the notice you actually received — not from the judgment date unless the notice says so.',
        'If the last day lands on a weekend or U.S. federal holiday, many courts roll to the next open day — confirm local rules.',
      ],
      watchFor: 'Timers here skip weekends and, when holiday data loads, U.S. federal holidays. Confirm with counsel.',
      accent: 'violet',
    },
    {
      id: 'protect_the_account',
      title: 'Protect what is still in the account',
      whyNow: `A ${mechanism}${bankBit} generally reaches only the judgment debtor’s non-exempt interest.${nonPartyBit}`,
      doThis: [
        'List every deposit from Social Security, SSI, VA, unemployment, or other protected benefits in the last 60 days.',
        'Send the 31 C.F.R. Part 212 notice to the bank if those benefits are in the account.',
        'File the state exemption / objection form in the profile — do not wait for the bank to “sort it out.”',
      ],
      watchFor: 'Federal benefit rules and state exemptions can both apply. One does not automatically replace the other.',
      accent: 'sky',
    },
    {
      id: 'mechanism_letters',
      title: 'Use the mechanism-matched letter drafts',
      whyNow: mechanismLetterHint(debt.mechanism),
      doThis: [
        'Open the recommended draft below, customize facts (dates, amounts, account mask), and have counsel review before sending.',
        'Keep a copy and send in a way you can prove (certified mail, bank message center, or both).',
        'If money already left, ask for the trace number, originator, and restoration or hold on repeat pulls.',
      ],
      watchFor: 'Drafts are process guidance. They are not a filing and they are not legal advice.',
      accent: 'rose',
    },
    {
      id: 'attack_the_judgment',
      title: 'Ask whether the judgment itself can be reopened',
      whyNow:
        'A levy does not prove the underlying case was fair. Vacate / set-aside paths exist when service failed, the partner never appeared, or the court lacked power — names and deadlines vary by state.',
      doThis: [
        'Compare the affidavit of service to where you actually lived and whether anyone competent was served.',
        'Check whether the plaintiff had standing (assignment chain) and whether the claim was time-barred when filed.',
        'Ask counsel about a motion to vacate / set aside (state analog to Fed. R. Civ. P. 60) and an emergency stay of enforcement while that motion is pending.',
      ],
      watchFor: 'Vacate deadlines can be days, not months. A successful vacate reopens the case — it does not erase a valid debt by itself.',
      accent: 'emerald',
    },
    {
      id: 'counterclaim_paths',
      title: 'Possible counter-sue paths (process map only)',
      whyNow:
        'Some fact patterns support a separate claim or counterclaim. This is a path list so you can brief counsel — not a recommendation to sue.',
      doThis: [
        'FDCPA path (15 U.S.C. § 1692 et seq.): false threats, amount inflation, or collection activity that ignored a written dispute — one-year clock is common (§ 1692k(d)).',
        'Wrongful levy / conversion / abuse-of-process path: restrained funds belonged to a non-party, a minor, or were federally protected benefits the bank failed to review.',
        'Reg E / Reg Z / 31 C.F.R. Part 212 path: the institution skipped the investigation, offset, or benefit-lookup procedure the regulation describes.',
        'State unfair-collection or wrongful-garnishment statutes: names differ; counsel matches the forum to the facts.',
      ],
      watchFor:
        'Counterclaims have their own statutes of limitation, notice rules, and fee-shifting risks. Results vary · not legal advice.',
      accent: 'violet',
    },
    {
      id: 'parallel_help',
      title: 'Open a parallel help lane the same day',
      whyNow: 'Court clocks do not pause while you wait for a bank callback. Free legal-aid and bank-regulator lanes can run beside the letters.',
      doThis: [
        'Use the LawHelp-by-ZIP helper on this page (or LawHelp.org) to find a legal-aid office in the account or judgment state.',
        'OCC HelpWithMyBank is for national-bank levy / offset / EFTA questions; CFPB takes collection and deposit complaints.',
        'Bring the writ, bank letter, and a 60-day transaction printout to any intake.',
      ],
      watchFor: 'Aid offices have income and case-type screens. Call the same day the notice arrives.',
      accent: 'sky',
    },
    {
      id: 'last_resort_process',
      title: 'Last-resort process notes — not a plan',
      whyNow:
        'If turnover is imminent and counsel is not yet retained, people sometimes ask about a stay or bankruptcy. Those are serious, fact-specific processes — not a default next click.',
      doThis: [
        'Ask counsel whether the trial court can stay enforcement while a vacate or exemption hearing is pending.',
        'Bankruptcy’s automatic stay (11 U.S.C. § 362) can halt a levy — only after a licensed bankruptcy attorney maps exemptions, means testing, and long-term cost.',
        'Do not treat an online form as a stay. Filing the wrong chapter, or filing without counsel, can make the money problem worse.',
      ],
      watchFor: 'This workspace will not file court papers or a bankruptcy petition. Results vary · not legal advice.',
      accent: 'rose',
    },
  ];
}
