import type { DebtLetterBuildArgs } from '../debtLetterBuildArgs';

/** FDCPA / state collection counterclaim outline — educational; verify pleading format locally. */
export function getCounterclaimOutlineBody(args?: DebtLetterBuildArgs): string {
  const debtor = args?.debtorName || '[DEFENDANT NAME]';
  const plaintiff = args?.recipientName || args?.creditorName || '[PLAINTIFF / COUNTER-DEFENDANT]';
  const caseNo = args?.caseNumber || '[CASE NUMBER]';
  const date = args?.date || '[DATE]';

  return `COUNTER-PLAINTIFF'S COUNTERCLAIM OUTLINE
(Counter-Defendant: ${plaintiff})
Case No. ${caseNo}

NOTE: This is an educational outline — not filed pleadings. Have a licensed attorney review before filing. Many courts require a separate counterclaim document and filing fee.

I. PRELIMINARY STATEMENT
Counter-Plaintiff ${debtor} alleges Counter-Defendant violated the Fair Debt Collection Practices Act (15 U.S.C. § 1692 et seq.) and applicable state collection practices acts by:
• Suing on a debt without account-level proof of ownership;
• Using false, deceptive, or misleading representations in connection with collection;
• Placing debt-collector disclosure language on formal pleadings where not permitted (15 U.S.C. § 1692e(11));
• Failing to provide validation under 15 U.S.C. § 1692g where required.

II. PARTIES
Counter-Plaintiff is a natural person and consumer.
Counter-Defendant is a debt collector / debt buyer collecting defaulted debt for another.

III. JURISDICTION
This court has jurisdiction under 15 U.S.C. § 1692k(d) and supplemental state law claims.

IV. FACTS (CUSTOMIZE)
[Summons date, mini-Miranda text on complaint, missing assignments, securitization admissions, etc.]

V. CLAIMS
COUNT I — FDCPA § 1692e (false/misleading representations)
COUNT II — FDCPA § 1692g (validation failures)
COUNT III — State collection practices act (parallel theories)
COUNT IV — RMCPA / state deceptive practices (if applicable)

VI. DAMAGES
Actual damages, statutory damages up to $1,000 under FDCPA, attorney fees and costs under 15 U.S.C. § 1692k, and other relief.

Respectfully submitted,

/s/ ${debtor}
${debtor}, Pro Se Counter-Plaintiff
Dated: ${date}`;
}

export function getCounterclaimOutlineBodyWithArgs(args: DebtLetterBuildArgs): string {
  return getCounterclaimOutlineBody(args);
}
