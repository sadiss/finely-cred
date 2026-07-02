/**
 * Legal framework for debt & summons responses.
 * Letter types, legal basis (FDCPA, FCRA, state SOL, UCC, contract law, banking law),
 * and scenario-driven "what to send when" — for validation, time-barred debt,
 * affidavits, and summons response (e.g. 35-day situation).
 */

export type DebtLetterType =
  | 'validation_request'       // FDCPA § 809 — demand validation before collection
  | 'validation_round2_deficiency' // second round — validation response was incomplete/deficient
  | 'validation_round3_final_demand' // third round — final demand after failure to validate
  | 'cease_and_desist'        // FDCPA § 805(c) — stop contact
  | 'affidavit_of_dispute'    // Sworn statement disputing debt / no contract
  | 'time_barred_response'    // Statute of limitations defense
  | 'summons_response_affidavit'  // Court/summons response (e.g. post-35-day answer)
  | 'debt_dispute_letter';    // General dispute to collector (accuracy/verification)

export type LegalBasisCategory =
  | 'consumer_protection'     // FDCPA, FCRA
  | 'contract_law'            // Consideration, statute of frauds, accord & satisfaction
  | 'banking_law'             // UCC, TILA, state banking
  | 'civil_procedure'         // SOL, answer deadlines, affidavits
  | 'evidence';               // Burden of proof, best evidence

export type LegalCitation = {
  category: LegalBasisCategory;
  cite: string;           // e.g. "15 U.S.C. § 1692g"
  shortName: string;      // e.g. "FDCPA § 809"
  description: string;
};

export type DebtLetterSpec = {
  id: DebtLetterType;
  title: string;
  shortDescription: string;
  whenToUse: string[];
  legalBasis: LegalCitation[];
  /** Contract / banking law angle in plain terms */
  contractLawAngle?: string;
  bankingLawAngle?: string;
  /** Key legal principle (e.g. "Validation shifts burden to collector") */
  keyPrinciple: string;
};

export type DebtScenario =
  | 'first_contact'           // Just received collection notice — validation window
  | 'validation_period'       // Within 30 days of first contact — send validation
  | 'post_validation'         // After validation request — dispute or cease
  | 'time_barred'              // Debt older than state SOL — no suit, no collection
  | 'summons_served'          // Summons received — answer deadline (e.g. 35 days)
  | 'post_35_days'             // Past answer deadline — affidavit / motion to reopen
  | 'unknown';                 // User hasn't specified — show all options

export type ScenarioRecommendation = {
  scenario: DebtScenario;
  label: string;
  description: string;
  recommendedLetterTypes: DebtLetterType[];
  legalWarning?: string;  // e.g. "Answer deadlines are jurisdictional in many states."
};
