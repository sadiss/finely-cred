/** Debt, summons, judgment, or levy case tracked per partner (separate from bureau dispute cases). */
export type DebtOrSummonsType = 'debt' | 'summons' | 'judgment' | 'levy';

/** Post-judgment collection mechanism when funds are taken or restrained. */
export type PostJudgmentMechanism = 'levy' | 'setoff' | 'ach';

export type DebtSenderSnapshot = {
  fullName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  capturedAt?: string;
};

export type DebtCase = {
  id: string;
  partnerId: string;
  type: DebtOrSummonsType;
  /** Creditor or plaintiff name */
  name: string;
  /** Original amount or amount claimed */
  amountCents: number;
  status: 'open' | 'in_review' | 'resolved' | 'disputed';
  dueDate?: string; // ISO date
  courtCaseNumber?: string;
  /** Court name from scrape / caption (e.g. 36th District Court) */
  courtName?: string;
  notes?: string;
  /** First written contact from collector (for 30-day validation window) */
  firstContactDate?: string;
  /** Last payment date (for SOL / time-barred analysis) */
  lastPaymentDate?: string;
  /** Date summons/complaint was served (for the state answer calendar) */
  dateServed?: string;
  /** Next hearing / trial / return date (ISO yyyy-mm-dd preferred) */
  hearingDate?: string;
  /** Date the money judgment was entered (ISO yyyy-mm-dd). Vacate / appeal / COJ clocks use this first. */
  judgmentEnteredAt?: string;
  /**
   * Date a qualifying post-trial motion was actually filed (ISO yyyy-mm-dd).
   * Unlocks an extended appeal timer only when the state encodes one (e.g. Texas 90-day track).
   * Do not invent this date.
   */
  postTrialMotionFiledAt?: string;
  /**
   * Court track for the summons answer calendar. Small-claims timers use the
   * small-claims split only when this is set — general-jurisdiction remains the default.
   */
  summonsCourtTrack?: 'general' | 'small_claims';
  /**
   * How the summons was served. Unlocks a longer general-jurisdiction answer
   * window only when the state calendar encodes one (e.g. NY 30-day track).
   * Unknown stays on the shorter / safer default. Do not guess.
   */
  summonsServiceMethod?: 'personal_in_state' | 'other_or_out_of_state';
  /**
   * Whether the complaint arrived with the summons. Unlocks a longer
   * general-jurisdiction window only when the state calendar encodes one
   * (e.g. Wisconsin 45 days). Unknown stays on the shorter / safer default.
   */
  summonsPapersServed?: 'summons_and_complaint' | 'summons_only';
  /**
   * Partner recorded that they did not participate in the hearing that produced the judgment.
   * Gates a restricted-appeal timer only when the state encodes one and a judgment date exists.
   * Do not mark this unless it is already true.
   */
  didNotParticipateInHearing?: boolean;
  /**
   * Date the partner (or counsel) opened a bill-of-review / equivalent track (ISO yyyy-mm-dd).
   * Gates that timer only. Do not invent this date.
   */
  billOfReviewNotedAt?: string;
  /** State or jurisdiction for SOL and procedure */
  stateJurisdiction?: string;
  /** Collector / plaintiff mailing identity for letters */
  collectorName?: string;
  /** Plaintiff's collection law firm (if sued) */
  plaintiffLawFirm?: string;
  plaintiffLawFirmAddress?: string;
  /** Plaintiff's attorney of record */
  plaintiffAttorneyName?: string;
  plaintiffAttorneyBarNumber?: string;
  /** Affidavit caption county (defaults from profile state if blank) */
  affidavitCounty?: string;
  /** Loan / note identifiers from complaint or servicer records */
  loanId?: string;
  borrowerId?: string;
  originalCreditor?: string;
  recipientName?: string;
  recipientAddress?: string;
  recipientPhone?: string;
  accountNumberMasked?: string;
  /** Link back to parsed credit report tradeline when auto-detected */
  reportId?: string;
  tradelineIndex?: number;
  linkedEvidenceIds?: string[];
  processedDocumentIds?: string[];
  source?: 'manual' | 'tradeline' | 'document' | 'import';
  senderSnapshot?: DebtSenderSnapshot;
  /** Post-judgment collection mechanism (levy, setoff, ACH pull). */
  mechanism?: PostJudgmentMechanism;
  /** Financial institution where account was levied or offset. */
  accountBank?: string;
  /** State where judgment was entered. */
  judgmentState?: string;
  /** State where levied / offset account is located. */
  accountState?: string;
  /** Account involves non-party owner (minor, spouse, business entity, etc.). */
  nonPartyInvolved?: boolean;
  createdAt: string;
  updatedAt: string;
};
