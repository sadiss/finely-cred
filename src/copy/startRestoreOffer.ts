/** Start Restore — consumer starter offer (not Core membership pricing). */
export const START_RESTORE_PACKAGE_ID = 'start_restore_147';

export const startRestoreOffer = {
  name: 'Start Restore',
  priceTodayCents: 14700,
  priceTodayLabel: '$147',
  coreDepositAltCents: 20000,
  coreDepositAltLabel: '$200',
  creditWindowDays: 7,
  strategyCallMinutes: '15–20',
} as const;

export const startRestoreCopyEn = {
  headline: 'Start Restore',
  subhead: 'A focused first step into credit restore — not the full multi-month Core program.',
  priceLine: '$147 today',
  depositLine: 'Or $200 down applied toward Core when you upgrade inside 7 days.',
  includesTitle: 'What you get today',
  includes: [
    'Personalized restore roadmap (where you are → sensible next actions)',
    'First-action checklist aligned to your reports (educational + execution-ready)',
    `${startRestoreOffer.strategyCallMinutes}-minute strategy call with a Finely specialist`,
  ],
  notIncludedTitle: 'What this is not',
  notIncluded: [
    'Not full multi-month Advanced Credit Restore (Core / DFY tiers stay separate)',
    'Not debt erasure — balances and legal obligations may remain',
    'Not “credit repair” hype — we say credit restore (accurate, structured dispute work)',
  ],
  creditTitle: 'Upgrade credit',
  creditBody: `Your ${startRestoreOffer.priceTodayLabel} is credited toward eligible Core / restore programs if you upgrade within ${startRestoreOffer.creditWindowDays} days.`,
  honesty: 'Credit restore improves accuracy and positioning on your reports. It does not guarantee score increases, deletions, or loan approvals.',
  noraNote:
    'Funding conversations (including Nora Capital pathways) are introduced only after you have clarity and express interest — never as a pressure pitch on day one.',
  ctaPrimary: 'Start Restore — $147',
  ctaSecondary: 'Compare full Core pricing',
} as const;

export const startRestoreCopyHt = {
  headline: 'Kòmanse Restore',
  subhead: 'Premye etap nan restore kredi — pa pwogram Core plizyè mwa a.',
  priceLine: '$147 jodi a',
  depositLine: 'Oswa $200 antre ki aplike sou Core si w upgrade nan 7 jou.',
  includesTitle: 'Sa w jwenn jodi a',
  includes: [
    'Plan restore pèsonalize (kote w ye → pwochen aksyon ki gen sans)',
    'Lis premye aksyon selon rapò w',
    `Apèl estrateji ${startRestoreOffer.strategyCallMinutes} minit ak yon espesyalis Finely`,
  ],
  notIncludedTitle: 'Sa li pa ye',
  notIncluded: [
    'Pa restore DFY plizyè mwa konplè (Core rete pri apart)',
    'Pa efase dèt — balans yo ka rete',
    'Pa “credit repair” — nou di credit restore (travay sou presizyon rapò)',
  ],
  creditTitle: 'Kredi upgrade',
  creditBody: `${startRestoreOffer.priceTodayLabel} kredite sou Core / restore si w upgrade nan ${startRestoreOffer.creditWindowDays} jou.`,
  honesty: 'Restore amelyore presizyon rapò — pa gen garanti nòt, efase, oswa prè.',
  noraNote: 'Pale sou finansman (Nora Capital) sèlman lè w gen konfyans e w montre enterè — pa presyon jou 1.',
  ctaPrimary: 'Kòmanse Restore — $147',
  ctaSecondary: 'Gade pri Core konplè',
} as const;
