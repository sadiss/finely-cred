import type { DebtLetterBuildArgs } from './debtLetterBuildArgs';
import { getLetterBody } from './debtLetterTemplates';
import { catalogEntryById, type DebtLetterCatalogEntry } from './debtLetterCatalog';
import { getRepossessionAnswerBody } from './specialized/repossessionBodies';
import { getForeclosureQualifiedWrittenRequestBody } from './specialized/foreclosureBodies';
import { getSecuritizationAnswerBody } from './specialized/securitizationBodies';
import { getCounterclaimOutlineBody } from './specialized/counterclaimBodies';
import { getCreditCollateralBureauBody } from './specialized/creditCollateralBureauBodies';
import { scrubLetterBodyForMail } from '../lib/letterBodySafety';
import { formatLetterRecipientBlock, resolveLetterMailRecipient } from '../lib/letterMailingAddress';

const OUTLINE_SECTIONS: Record<string, (e: DebtLetterCatalogEntry, a: DebtLetterBuildArgs) => string> = {
  court_counterclaim_fdcpa: (_e, a) => getCounterclaimOutlineBody(a),
  repossession_answer_claim_delivery: (_e, a) => getRepossessionAnswerBody(a),
  foreclosure_qualified_written_request: (_e, a) => getForeclosureQualifiedWrittenRequestBody(a),
  securitization_answer_discover: (_e, a) => getSecuritizationAnswerBody(a, 'discover'),
  securitization_answer_amex: (_e, a) => getSecuritizationAnswerBody(a, 'amex'),
  securitization_answer_boa: (_e, a) => getSecuritizationAnswerBody(a, 'boa'),
  securitization_counter_affidavit: (_e, a) => getSecuritizationAnswerBody(a, 'counter_affidavit'),
  // Credit-hub FC / Repo bureau bodies (full strength — not short outlines)
  repossession_credit_report_repo: (_e, a) => getCreditCollateralBureauBody('repossession_credit_report_repo', a)!,
  repossession_bureau_tradeline_dispute: (_e, a) => getCreditCollateralBureauBody('repossession_bureau_tradeline_dispute', a)!,
  repossession_deficiency_bureau_dispute: (_e, a) => getCreditCollateralBureauBody('repossession_deficiency_bureau_dispute', a)!,
  repossession_specialty_cra_dispute: (_e, a) => getCreditCollateralBureauBody('repossession_specialty_cra_dispute', a)!,
  repossession_furnisher_reporting_dispute: (_e, a) => getCreditCollateralBureauBody('repossession_furnisher_reporting_dispute', a)!,
  foreclosure_post_foreclosure_fcr: (_e, a) => getCreditCollateralBureauBody('foreclosure_post_foreclosure_fcr', a)!,
  foreclosure_bureau_tradeline_dispute: (_e, a) => getCreditCollateralBureauBody('foreclosure_bureau_tradeline_dispute', a)!,
  foreclosure_public_record_remark_dispute: (_e, a) => getCreditCollateralBureauBody('foreclosure_public_record_remark_dispute', a)!,
  foreclosure_specialty_cra_dispute: (_e, a) => getCreditCollateralBureauBody('foreclosure_specialty_cra_dispute', a)!,
  foreclosure_furnisher_reporting_dispute: (_e, a) => getCreditCollateralBureauBody('foreclosure_furnisher_reporting_dispute', a)!,
};

function genericOutline(e: DebtLetterCatalogEntry, args: DebtLetterBuildArgs): string {
  const senderLines = [
    args.debtorName,
    args.debtorAddress1,
    args.debtorAddress2,
    [args.debtorCity, args.debtorState, args.debtorPostalCode].filter(Boolean).join(', '),
    args.debtorPhone ? `Phone: ${args.debtorPhone}` : '',
  ].filter(Boolean);
  const recipient = formatLetterRecipientBlock(
    resolveLetterMailRecipient({
      recipientName: args.recipientName,
      recipientAddress: args.recipientAddress,
      plaintiffLawFirm: args.plaintiffLawFirm,
      plaintiffLawFirmAddress: args.plaintiffLawFirmAddress,
      debtCollectorName: args.debtCollectorName,
      creditorName: args.creditorName,
      senderName: args.debtorName,
      senderAddress1: args.debtorAddress1,
      senderCity: args.debtorCity,
      senderPostalCode: args.debtorPostalCode,
    }),
  );
  const laws = e.laws.join('; ');
  const when = e.whenToUse.map((w) => `• ${w}`).join('\n');

  return `${senderLines.join('\n') || '[YOUR MAILING ADDRESS]'}

Date: ${args.date}

Via Certified Mail — Return Receipt Requested

${recipient}

Re: ${e.title}
    Account / Case: ${args.accountNumber || args.caseNumber || '[ACCOUNT OR CASE NUMBER]'}
    Alleged amount: ${args.summonsContext?.amountClaimed || '[AMOUNT IF KNOWN]'}

To Whom It May Concern:

I am writing regarding the above-referenced matter. This letter is a formal ${e.category} communication. I do not waive any rights and I do not admit liability for any alleged debt, deficiency, lien, or obligation.

KEY PRINCIPLE
${e.keyPrinciple}

WHEN THIS LETTER APPLIES
${when}

APPLICABLE LAW (verify in your jurisdiction)
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
  const safeArgs: DebtLetterBuildArgs = { ...args, debtorEmail: undefined };
  const entry = catalogEntryById(catalogId);
  let body = '';
  if (!entry) {
    body = genericOutline(
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
      safeArgs,
    );
    return scrubLetterBodyForMail(body);
  }

  if (entry.tier === 'full' && entry.letterType) {
    return getLetterBody(entry.letterType, safeArgs);
  }

  const custom = OUTLINE_SECTIONS[entry.id];
  if (custom) body = custom(entry, safeArgs);
  else {
    const creditBody = getCreditCollateralBureauBody(entry.id, safeArgs);
    body = creditBody || genericOutline(entry, safeArgs);
  }
  return scrubLetterBodyForMail(body);
}

export function resolveCatalogDraftId(id: string): string {
  const entry = catalogEntryById(id);
  if (entry?.letterType) return entry.letterType;
  return id;
}
