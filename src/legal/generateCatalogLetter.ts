import type { DebtLetterBuildArgs } from './debtLetterBuildArgs';
import { getLetterBody } from './debtLetterTemplates';
import { catalogEntryById, type DebtLetterCatalogEntry } from './debtLetterCatalog';
import { getRepossessionAnswerBody } from './specialized/repossessionBodies';
import { getForeclosureQualifiedWrittenRequestBody } from './specialized/foreclosureBodies';
import { getSecuritizationAnswerBody } from './specialized/securitizationBodies';
import { getCounterclaimOutlineBody } from './specialized/counterclaimBodies';

const OUTLINE_SECTIONS: Record<string, (e: DebtLetterCatalogEntry, a: DebtLetterBuildArgs) => string> = {
  court_counterclaim_fdcpa: (_e, a) => getCounterclaimOutlineBody(a),
  repossession_answer_claim_delivery: (e, a) => getRepossessionAnswerBody(a),
  foreclosure_qualified_written_request: (e, a) => getForeclosureQualifiedWrittenRequestBody(a),
  securitization_answer_discover: (e, a) => getSecuritizationAnswerBody(a, 'discover'),
  securitization_answer_amex: (e, a) => getSecuritizationAnswerBody(a, 'amex'),
  securitization_answer_boa: (e, a) => getSecuritizationAnswerBody(a, 'boa'),
  securitization_counter_affidavit: (e, a) => getSecuritizationAnswerBody(a, 'counter_affidavit'),
};

function genericOutline(e: DebtLetterCatalogEntry, args: DebtLetterBuildArgs): string {
  const addr = [args.debtorAddress1, args.debtorAddress2, args.debtorCity, args.debtorState, args.debtorPostalCode]
    .filter(Boolean)
    .join(', ');
  const laws = e.laws.join('; ');
  const when = e.whenToUse.map((w) => `• ${w}`).join('\n');

  return `${args.debtorName}
${addr || '[YOUR MAILING ADDRESS]'}
${args.debtorPhone ? `Phone: ${args.debtorPhone}` : ''}
${args.debtorEmail ? `Email: ${args.debtorEmail}` : ''}

Date: ${args.date}

Via Certified Mail — Return Receipt Requested

${args.recipientName || args.creditorName || '[CREDITOR / SERVICER / COLLECTOR]'}
${args.recipientAddress || '[CREDITOR MAILING ADDRESS]'}

Re: ${e.title}
    Account / Case: ${args.accountNumber || args.caseNumber || '[ACCOUNT OR CASE NUMBER]'}
    Alleged amount: ${args.summonsContext?.amountClaimed || '[AMOUNT IF KNOWN]'}

To Whom It May Concern:

I am writing regarding the above-referenced matter. This letter is a formal ${e.category} communication. I do not waive any rights and I do not admit liability for any alleged debt, deficiency, lien, or obligation.

KEY PRINCIPLE
${e.keyPrinciple}

WHEN THIS LETTER APPLIES
${when}

APPLICABLE LAW (verify in your jurisdiction — educational reference only)
${laws}

DEMANDS AND REQUESTS
1. Identify the original creditor, current owner, servicer, and counsel of record for this specific account or case.
2. Provide complete account-level documentation — not a pool summary — proving your authority to collect, foreclose, repossess, or report this obligation.
3. Provide a complete itemized ledger of all charges, payments, credits, fees, interest, insurance, escrow, and adjustments.
4. Cease inaccurate credit reporting and collection activity until you provide competent proof.
5. Confirm in writing within 30 days (or the applicable statutory deadline) that you have complied.

PRESERVATION OF RIGHTS
I reserve all rights under federal and state consumer protection, contract, UCC, RESPA, TILA, FCRA, FDCPA, SCRA, and civil procedure laws, including the right to raise all defenses, counterclaims, and discovery requests.

Sincerely,

${args.debtorName}`;
}

/** Build letter text from catalog id or legacy DebtLetterType. */
export function generateCatalogLetterBody(catalogId: string, args: DebtLetterBuildArgs): string {
  const entry = catalogEntryById(catalogId);
  if (!entry) {
    return genericOutline(
      {
        id: catalogId,
        category: 'validation',
        title: catalogId.replace(/_/g, ' '),
        shortDescription: '',
        whenToUse: ['Custom catalog entry'],
        laws: ['FDCPA', 'FCRA', 'State consumer law'],
        keyPrinciple: 'Demand proof before action.',
        scenarios: [],
        tier: 'outline',
      },
      args,
    );
  }

  if (entry.tier === 'full' && entry.letterType) {
    return getLetterBody(entry.letterType, args);
  }

  const custom = OUTLINE_SECTIONS[entry.id];
  if (custom) return custom(entry, args);

  return genericOutline(entry, args);
}

export function resolveCatalogDraftId(id: string): string {
  const entry = catalogEntryById(id);
  if (entry?.letterType) return entry.letterType;
  return id;
}
