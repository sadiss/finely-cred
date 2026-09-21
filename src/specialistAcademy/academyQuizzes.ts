export type AcademyQuizQuestion = {
  id: string;
  prompt: string;
  promptHt?: string;
  choices: string[];
  choicesHt?: string[];
  answerIndex: number;
  explain: string;
  explainHt?: string;
};

export type AcademyQuiz = {
  id: string;
  title: string;
  titleHt?: string;
  module: 'methodology' | 'compliance' | 'debt-legal' | 'build';
  passPercent: number;
  questions: AcademyQuizQuestion[];
};

export const ACADEMY_QUIZZES: AcademyQuiz[] = [
  {
    id: 'methodology',
    title: 'Track F — Methodology mastery',
    titleHt: 'Trac F — Metodoloji',
    module: 'methodology',
    passPercent: 80,
    questions: [
      {
        id: 'm1',
        prompt: 'When collection risk exists, what runs first in Sanz doctrine?',
        choices: ['Mass Round 1 bureau deletes', 'Debt-first triage and validation on collectors', 'CFPB complaint', 'Nora funding application'],
        answerIndex: 1,
        explain: 'Debt-first + validation (SOP-08/09) gates restore when collector or summons risk is present.',
      },
      {
        id: 'm2',
        prompt: 'Validation under FDCPA §809 (educational) empowers the consumer to:',
        choices: ['Demand proof before continued collection in the statutory framework', 'Automatically delete all tradelines', 'Skip court if sued', 'Guarantee a 100-point score increase'],
        answerIndex: 0,
        explain: 'Validation is a consumer tool to request verification—not a score guarantee.',
      },
      {
        id: 'm3',
        prompt: 'A partner was served a summons yesterday. Best immediate Finely action?',
        choices: ['Mail Round 1 to all bureaus tonight', 'Upload summons, calendar answer deadline, pause blind bureau spam', 'Ignore court until deletions land', 'File CFPB first'],
        answerIndex: 1,
        explain: 'SOP-10: court literacy and documentation; counsel when needed.',
      },
      {
        id: 'm4',
        prompt: 'Round 2 differs from Round 1 because it:',
        choices: ['Repeats the same letter with a new date', 'Uses bureau/furnisher responses and tightens factual contradictions', 'Only works for inquiries', 'Replaces validation'],
        answerIndex: 1,
        explain: 'Round 2 is response-driven with exhibits.',
      },
      {
        id: 'm5',
        prompt: 'When is CFPB appropriate?',
        choices: ['Day one before any mail', 'After disciplined rounds with a clean Vault narrative', 'Whenever the client is angry', 'Instead of validation'],
        answerIndex: 1,
        explain: 'SOP-12/19: after failed rounds when warranted.',
      },
      {
        id: 'm6',
        prompt: 'OCR discipline means:',
        choices: ['Send identical letters to every account', 'Vary structure while keeping facts truthful', 'Never mail certified', 'Only use one template forever'],
        answerIndex: 1,
        explain: 'SOP-13: avoid cookie-cutter bulk patterns.',
      },
      {
        id: 'm7',
        prompt: 'Prior company sent Round 2 last month. Finely should:',
        choices: ['Restart Round 1 boilerplate', 'Intake PDFs and continue at the correct round stage', 'Hide prior letters from the file', 'Promise deletion in 30 days'],
        answerIndex: 1,
        explain: 'SOP-14: never blind Round 1 restart.',
      },
      {
        id: 'm8',
        prompt: 'BUILD coaching during restore should:',
        choices: ['Promise Nora approval', 'Teach mix/utilization literacy without loan guarantees', 'Replace debt triage', 'Skip payment discipline'],
        answerIndex: 1,
        explain: 'SOP-15: underwriting education, not lender policy.',
      },
      {
        id: 'm9',
        prompt: 'Evidence for a collection dispute must show:',
        choices: ['FICO score only', 'The actual collection/tradeline on the report', 'A social media post', 'Nothing—letters alone are enough'],
        answerIndex: 1,
        explain: 'SOP-13: per-account screenshots.',
      },
      {
        id: 'm10',
        prompt: 'Finely’s voice with partners should emphasize:',
        choices: ['Guaranteed deletions and funding', 'Process, rights, documentation, and honest limits', 'Ignoring collectors', 'Legal representation by Finely'],
        answerIndex: 1,
        explain: 'Consumer-power framing: empower within compliance bounds.',
      },
    ],
  },
  {
    id: 'compliance',
    title: 'Track H — Compliance & industry mechanics',
    titleHt: 'Trac H — Konfòmite',
    module: 'compliance',
    passPercent: 80,
    questions: [
      {
        id: 'c1',
        prompt: 'Metro 2 is best described as:',
        choices: ['A magic deletion code', 'A furnisher data format—errors on the report are factual dispute ammo', 'A court filing system', 'A Nora funding API'],
        answerIndex: 1,
        explain: 'Transparent mechanics + FCRA disputes—not “codes.”',
      },
      {
        id: 'c2',
        prompt: 'Bureaus (CRAs) are:',
        choices: ['Government courts', 'Businesses that compile and sell consumer reports', 'Collectors only', 'Loan approval engines'],
        answerIndex: 1,
        explain: 'Understanding the system helps consumers push back factually.',
      },
      {
        id: 'c3',
        prompt: 'Many bureau disputes route to furnishers via:',
        choices: ['e-OSCAR (industry dispute network)', 'Only notarized court orders', 'Social media', 'Random email'],
        answerIndex: 0,
        explain: 'Knowing the flow explains investigation timing.',
      },
      {
        id: 'c4',
        prompt: 'FCRA disputes at Finely focus on:',
        choices: ['Inventing fraud stories', 'Accuracy and verification with exhibits', 'Harassing callers', 'Guaranteed deletion'],
        answerIndex: 1,
        explain: 'Investigation + MOFV language.',
      },
      {
        id: 'c5',
        prompt: 'FDCPA validation empowers consumers to:',
        choices: ['Request verification of alleged collector debt in writing', 'Erase mortgages instantly', 'Avoid all payments legally without review', 'Get automatic lawsuit wins'],
        answerIndex: 0,
        explain: 'Pair with SOP-09; educational framing.',
      },
      {
        id: 'c6',
        prompt: 'A collector must generally identify itself as collecting a debt (educational “mini-Miranda”). Specialists should:',
        choices: ['Coach partners to document calls and use validation/dispute tracks', 'Tell partners to threaten collectors', 'Promise arrests of collectors', 'Skip documentation'],
        answerIndex: 0,
        explain: 'Consumer-power = paper trail + rights tools.',
      },
      {
        id: 'c7',
        prompt: 'TILA literacy for specialists means:',
        choices: ['Originate loans for partners', 'Explain disclosure awareness; refer contract questions to lenders/counsel', 'Set APR for clients', 'Replace restore work'],
        answerIndex: 1,
        explain: 'Funding conversations stay in scope.',
      },
      {
        id: 'c8',
        prompt: 'Foreclosure on a report vs one late payment:',
        choices: ['Same thing', 'Different—foreclosure is a legal process; disputes target inaccurate reporting with proof', 'Always deleted by Round 1', 'Ignored by Finely'],
        answerIndex: 1,
        explain: 'Track H foreclosure module; counsel for legal process.',
      },
      {
        id: 'c9',
        prompt: 'Repo tradeline disputes should include:',
        choices: ['Disposition/accounting docs + playbook tasks', 'Only emotional language', 'No exhibits', 'Guaranteed repo removal promise'],
        answerIndex: 0,
        explain: 'negativePlaybooks repossession + SOP-20.',
      },
      {
        id: 'c10',
        prompt: '“Expose the system” at Finely means:',
        choices: ['Illegal shortcuts', 'Teach transparent industry mechanics + lawful consumer tools', 'Conspiracy theories', 'Harassment campaigns'],
        answerIndex: 1,
        explain: 'Educational consumer-power framing.',
      },
    ],
  },
  {
    id: 'debt-legal',
    title: 'Debt & Legal — summons & collectors',
    titleHt: 'Dèt ak legal',
    module: 'debt-legal',
    passPercent: 80,
    questions: [
      {
        id: 'd1',
        prompt: 'Debt buyer lawsuits often hinge on:',
        choices: ['Proof of assignment and account documentation', 'Finely deleting TikTok codes', 'Ignoring mail', 'CFPB before validation'],
        answerIndex: 0,
        explain: 'Validation + documentation; counsel for answers.',
      },
      {
        id: 'd2',
        prompt: 'Answer deadlines on summons are:',
        choices: ['Optional suggestions', 'Calendar facts—document immediately (SOP-10)', 'Ignored if disputing bureaus', 'Always 90 days everywhere'],
        answerIndex: 1,
        explain: 'Never “ignore court.”',
      },
      {
        id: 'd3',
        prompt: 'Affidavits in debt/court context may be required when:',
        choices: ['Jurisdiction/rules call for sworn responses—escalate to counsel', 'Never', 'Only for Round 1 bureau mail', 'Only for BUILD'],
        answerIndex: 0,
        explain: 'Trainees document; attorneys file strategy.',
      },
      {
        id: 'd4',
        prompt: 'Debt Center + Litigation Command on the portal support:',
        choices: ['Validation, dispute letters, summons outlines, legal basis education', 'Guaranteed lawsuit wins', 'Automatic court filing by Finely', 'Skipping Vault uploads'],
        answerIndex: 0,
        explain: 'Align product workflows with training.',
      },
      {
        id: 'd5',
        prompt: 'Cease contact letters should be used:',
        choices: ['With lead review and accurate facts—not rage spam', 'Before any validation ever', 'To threaten violence', 'As first step instead of evidence'],
        answerIndex: 0,
        explain: 'FDCPA tools used disciplined.',
      },
      {
        id: 'd6',
        prompt: 'Time-barred debt (SOL educational) means specialists:',
        choices: ['Coach consumers to get state-specific legal advice; document; use product templates appropriately', 'Promise collectors cannot sue in every case without review', 'Invent dates', 'Skip triage'],
        answerIndex: 0,
        explain: 'Counsel for legal conclusions.',
      },
      {
        id: 'd7',
        prompt: 'Collector vs original creditor (educational):',
        choices: ['Always the same rights and letters', 'Different roles—validation often targets collectors; accuracy disputes may involve furnishers', 'Only bureaus matter', 'Only Nora matters'],
        answerIndex: 1,
        explain: 'Sequence matters in Sanz doctrine.',
      },
      {
        id: 'd8',
        prompt: 'Partner uploads summons PDF. You should:',
        choices: ['Create tasks for deadlines and notify lead', 'Delete it', 'Only mail Round 1', 'Promise dismissal'],
        answerIndex: 0,
        explain: 'Litigation-ready file posture.',
      },
      {
        id: 'd9',
        prompt: 'What should you NOT promise?',
        choices: ['Court outcomes, guaranteed deletions, or Finely acting as their lawyer', 'That you will document mail dates', 'That you will use validation when appropriate', 'That you will upload to Vault'],
        answerIndex: 0,
        explain: 'Compliance boundaries.',
      },
      {
        id: 'd10',
        prompt: 'Haitian desk best practice:',
        choices: ['Kreyòl explanations; English collector/bureau letters', 'Kreyòl letters to Equifax only', 'No documentation', 'Skip validation'],
        answerIndex: 0,
        explain: 'Track C norms.',
      },
    ],
  },
  {
    id: 'build',
    title: 'BUILD & funding-readiness',
    titleHt: 'BUILD',
    module: 'build',
    passPercent: 75,
    questions: [
      {
        id: 'b1',
        prompt: 'BUILD targets (educational) often include:',
        choices: ['2+ revolving in good standing, mix awareness, healthy installment', '10 new cards this week', 'Guaranteed 800 score', 'No payments needed'],
        answerIndex: 0,
        explain: 'Industry teaching targets—not laws.',
      },
      {
        id: 'b2',
        prompt: 'Authorized user tradelines:',
        choices: ['May help sometimes; impact limited/conditional—no approval promise', 'Guarantee black card approval', 'Replace validation', 'Are illegal'],
        answerIndex: 0,
        explain: 'AU honesty card.',
      },
      {
        id: 'b3',
        prompt: 'Utilization coaching focuses on:',
        choices: ['Revolving balances vs limits (model-dependent)', 'Deleting all debt by magic', 'Ignoring payments', 'Court answers'],
        answerIndex: 0,
        explain: 'FICO-style education ~30% bucket.',
      },
      {
        id: 'b4',
        prompt: 'Before Nora language, complete:',
        choices: ['SOP-15 funding-readiness checklist', 'Round 0 spam', 'CFPB only', 'Nothing'],
        answerIndex: 0,
        explain: 'Soft handoff discipline.',
      },
      {
        id: 'b5',
        prompt: 'Finely vs Nora:',
        choices: ['Finely restores/documents; Nora/lenders decide funding separately', 'Same company guarantees loans', 'Nora deletes bureaus', 'Finely is the court'],
        answerIndex: 0,
        explain: 'Track G.',
      },
      {
        id: 'b6',
        prompt: 'During active summons clock, BUILD should:',
        choices: ['Not push reckless new credit apps; prioritize court/debt gates', 'Open five cards immediately', 'Stop all documentation', 'Ignore debt'],
        answerIndex: 0,
        explain: 'Parallel BUILD with gates.',
      },
      {
        id: 'b7',
        prompt: 'Payment history in classic score education is about:',
        choices: ['~35% weight—on-time payments matter', '0%—scores are random', 'Only inquiries matter', 'Only AU matters'],
        answerIndex: 0,
        explain: 'Educational shorthand.',
      },
      {
        id: 'b8',
        prompt: 'Aspirational “premium card” talk is OK when:',
        choices: ['Labeled as aspirational education—not a Finely promise', 'Promised as guaranteed', 'Used to skip restore', 'Replacing compliance footer'],
        answerIndex: 0,
        explain: 'Track F BUILD section.',
      },
    ],
  },
];

export function getQuiz(id: string): AcademyQuiz | undefined {
  return ACADEMY_QUIZZES.find((q) => q.id === id);
}
