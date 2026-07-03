import type { DebtLetterBuildArgs } from '../debtLetterBuildArgs';

type Variant = 'discover' | 'amex' | 'boa' | 'counter_affidavit';

const VARIANT_INTRO: Record<Variant, string> = {
  discover:
    'Plaintiff sues on a securitized credit card receivable without proving reassignment from the pooling trust back to Plaintiff with account-level specificity.',
  amex: 'Plaintiff sues while receivables may have been conveyed to a securitization trust under a pooling and servicing agreement; Plaintiff must prove reassignment of this specific account.',
  boa: 'Plaintiff must prove the chain of title from Bank of America through any trust/SPV back to the party suing, with documents identifying this account.',
  counter_affidavit:
    "Defendant swears that Plaintiff has not produced account-specific assignment or the signed agreement bearing Defendant's handwriting.",
};

export function getSecuritizationAnswerBody(args: DebtLetterBuildArgs, variant: Variant): string {
  const plaintiff = args.recipientName || args.creditorName || '[PLAINTIFF]';
  const caseNo = args.caseNumber || '[CASE NUMBER]';
  const court = args.summonsContext?.courtName || '[COURT NAME]';
  const state = args.summonsContext?.jurisdictionState || args.debtorState || '[STATE]';

  return `STATE OF ${state.toUpperCase()}
IN THE ${court.toUpperCase()}

${plaintiff},
    Plaintiff,                              Case No. ${caseNo}
-vs-
${args.debtorName},
    Defendant, Pro Se
_____________________________________________________________________________/

DEFENDANT ANSWER AND AFFIRMATIVE DEFENSES
(Securitization / Standing — ${variant.replace('_', ' ')} pattern)

PRELIMINARY STATEMENT
${VARIANT_INTRO[variant]}

Defendant denies an account-stated or breach-of-contract claim because:
• There is no signed agreement attached bearing Defendant's name as Plaintiff alleges;
• There is no account-level assignment schedule tying this debt to Plaintiff;
• Payment history and ownership of the receivable after securitization are unexplained.

ANSWER
Defendant denies each allegation not specifically admitted. Defendant lacks sufficient information to admit allegations regarding securitization trusts, certificateholders, and servicing splits.

AFFIRMATIVE DEFENSES
1. Lack of standing / not real party in interest.
2. Failure to prove chain of title under applicable assignment law and UCC Article 9.
3. Failure to state account stated — no agreement and no payment to Plaintiff.
4. Hearsay and insufficient business records foundation.
5. FDCPA / state collection practices — misrepresentation of collector vs creditor status (if pledging mini-Miranda).
6. Statute of limitations and statute of frauds (if applicable).

DISCOVERY PRESERVATION
Defendant demands production of: pooling & servicing agreement excerpts, receivables sale schedules identifying this account, trust assignments back to Plaintiff, payment waterfall, and all mini-Miranda approval records.

WHEREFORE Defendant requests dismissal and costs.

/s/ ${args.debtorName}
${args.debtorName}, Pro Se
Date: ${args.date}`;
}
