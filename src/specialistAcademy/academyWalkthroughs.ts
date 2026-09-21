export type WalkthroughScene =
  | 'portal-home'
  | 'reports'
  | 'negative-detail'
  | 'dispute-builder'
  | 'evidence-gate'
  | 'mail-preview'
  | 'tasks'
  | 'debt-center'
  | 'summons';

export type WalkthroughHotspot = {
  x: number;
  y: number;
  labelEn: string;
  labelHt: string;
  tone?: 'amber' | 'rose' | 'emerald';
};

export type WalkthroughStep = {
  id: string;
  scene: WalkthroughScene;
  stepLabelEn: string;
  stepLabelHt: string;
  captionEn: string;
  captionHt: string;
  whyEn: string;
  whyHt: string;
  nextClickEn: string;
  nextClickHt: string;
  hotspots: WalkthroughHotspot[];
};

export const RESTORE_MAIL_WALKTHROUGH: WalkthroughStep[] = [
  {
    id: 'r1',
    scene: 'portal-home',
    stepLabelEn: 'Portal entry',
    stepLabelHt: 'Antre portal',
    captionEn: 'Partner opens **Credit Restore** from the portal dashboard — this is the front door to reports, disputes, and letters.',
    captionHt: 'Patnè ouvri **Credit Restore** sou tablo portal la — pòt devan rapò, dispute, ak lèt.',
    whyEn: 'Specialists teach partners where restore lives so they do not hunt menus during live calls.',
    whyHt: 'Espesyalis montre kote restore ye pou patnè pa pèdi nan meni pandan apèl.',
    nextClickEn: 'Next: upload or open the latest tri-merge report.',
    nextClickHt: 'Apre: monte oswa ouvri dènye rapò tri-merge.',
    hotspots: [{ x: 68, y: 42, labelEn: 'Press Credit Restore', labelHt: 'Klike Restore', tone: 'amber' }],
  },
  {
    id: 'r2',
    scene: 'reports',
    stepLabelEn: 'Credit Intel report',
    stepLabelHt: 'Rapò Credit Intel',
    captionEn: 'Upload a **SAMPLE** report or open the parsed **Credit Intel** view. Parsed tradelines power dispute candidates.',
    captionHt: 'Monte yon rapò **EGZANP** oswa ouvri **Credit Intel** — tradelines parse bay kandida dispute.',
    whyEn: 'Consumer power starts with what the file actually shows — not TikTok rumors.',
    whyHt: 'Pouvwa konsomatè kòmanse ak sa fichye a montre — pa rèv TikTok.',
    nextClickEn: 'Next: pick a negative account to dispute.',
    nextClickHt: 'Apre: chwazi yon kont negatif pou dispute.',
    hotspots: [
      { x: 22, y: 28, labelEn: 'Upload report', labelHt: 'Monte rapò', tone: 'amber' },
      { x: 72, y: 55, labelEn: 'Parsed tradelines', labelHt: 'Tradelines', tone: 'emerald' },
    ],
  },
  {
    id: 'r3',
    scene: 'negative-detail',
    stepLabelEn: 'Account detail',
    stepLabelHt: 'Detay kont',
    captionEn: 'Open the tradeline (demo account **•••• 4821**). Screenshot the **actual** fields you will dispute — status, balance, payment grid.',
    captionHt: 'Ouvri tradeline (kont demo **•••• 4821**). Capture **chan** ou pral dispute — estati, balans, grid.',
    whyEn: 'Metro 2 / factual disputes need exhibits that match the human-readable report.',
    whyHt: 'Dispute faktik bezwen prèv ki matche rapò a.',
    nextClickEn: 'Next: start dispute / open letter builder.',
    nextClickHt: 'Apre: kòmanse dispute / builder lèt.',
    hotspots: [{ x: 58, y: 62, labelEn: 'Open dispute', labelHt: 'Dispute', tone: 'rose' }],
  },
  {
    id: 'r4',
    scene: 'dispute-builder',
    stepLabelEn: 'Letter builder',
    stepLabelHt: 'Builder lèt',
    captionEn: 'Use **Disputes** → letter templates with factual clauses. Vary structure (OCR-safe) — no cookie-cutter walls.',
    captionHt: 'Itilize **Disputes** → modèl ak kloz faktik. Varie estrikti (OCR) — pa menm blòk tout kote.',
    whyEn: 'Partners exercise FCRA rights with clear asks: investigate, verify, correct.',
    whyHt: 'Patnè itilize dwa FCRA: envestige, verifye, korije.',
    nextClickEn: 'Next: pass evidence / compliance gate.',
    nextClickHt: 'Apre: pase gate prèv / konfòmite.',
    hotspots: [{ x: 76, y: 38, labelEn: 'Generate letter', labelHt: 'Jenere lèt', tone: 'amber' }],
  },
  {
    id: 'r5',
    scene: 'evidence-gate',
    stepLabelEn: 'Evidence gate',
    stepLabelHt: 'Gate prèv',
    captionEn: 'Attach **screenshot exhibits** before send. Compliance gate blocks mail if required evidence is missing.',
    captionHt: 'Tache **screenshot** anvan voye. Gate bloke si prèv obligatwa manke.',
    whyEn: 'Litigation-ready files beat emotional letters with no exhibits.',
    whyHt: 'Dosye ak prèv pi fò pase lèt san egzibisyon.',
    nextClickEn: 'Next: preview PDF and mail.',
    nextClickHt: 'Apre: preview PDF ak mail.',
    hotspots: [{ x: 50, y: 72, labelEn: 'Attach exhibit', labelHt: 'Tache prèv', tone: 'emerald' }],
  },
  {
    id: 'r6',
    scene: 'mail-preview',
    stepLabelEn: 'Mail & PDF',
    stepLabelHt: 'Mail & PDF',
    captionEn: 'Preview → export PDF → **certified mail** / LetterStream instructions. Log tracking in Vault.',
    captionHt: 'Preview → PDF → **mail sètifye** / LetterStream. Note tracking nan Vault.',
    whyEn: 'Paper trail is consumer power — dates prove you invoked process.',
    whyHt: 'Papye se pouvwa — dat montre ou te swiv pwosesis la.',
    nextClickEn: 'Next: schedule tasks for Round 2 / follow-up.',
    nextClickHt: 'Apre: planifye tasks pou Round 2.',
    hotspots: [{ x: 64, y: 58, labelEn: 'Send / mail', labelHt: 'Voye mail', tone: 'amber' }],
  },
  {
    id: 'r7',
    scene: 'tasks',
    stepLabelEn: 'Tasks & follow-up',
    stepLabelHt: 'Tasks',
    captionEn: '**Tasks** calendar Round 2 windows, validation follow-ups, and complaint ladder timing — never blind restarts.',
    captionHt: '**Tasks** pou dat Round 2, follow-up validasyon, plent — pa rekòmanse Round 1 aveg.',
    whyEn: 'Trainees should run the file like a project, not one-shot letters.',
    whyHt: 'Espesyalis jere dosye tankou pwojè, pa yon sèl lèt.',
    nextClickEn: 'Continue to Debt Center when collection risk exists.',
    nextClickHt: 'Kontinye nan Debt Center si gen risk koleksyon.',
    hotspots: [{ x: 40, y: 45, labelEn: 'Due dates', labelHt: 'Dat limit', tone: 'emerald' }],
  },
];

export const DEBT_LEGAL_WALKTHROUGH: WalkthroughStep[] = [
  {
    id: 'd1',
    scene: 'debt-center',
    stepLabelEn: 'Debt Center',
    stepLabelHt: 'Debt Center',
    captionEn: '**Debt & Summons Center** — validation first on collector debt (§809 educational). Log sends before bureau blitz.',
    captionHt: '**Debt Center** — validasyon an premye sou dèt kolektè. Note voye anvan biwo.',
    whyEn: 'FDCPA-shaped tools protect partners before litigation pressure rises.',
    whyHt: 'Zouti FDCPA pwoteje patnè anvan presyon tribinal.',
    nextClickEn: 'Next: summons path if court mail arrives.',
    nextClickHt: 'Apre: chemen somasyon si tribinal voye papye.',
    hotspots: [{ x: 55, y: 50, labelEn: 'Send validation', labelHt: 'Voye validasyon', tone: 'amber' }],
  },
  {
    id: 'd2',
    scene: 'summons',
    stepLabelEn: 'Summons literacy',
    stepLabelHt: 'Somasyon',
    captionEn: 'Upload summons to Vault, calendar **answer** deadlines, escalate to counsel — never ignore court.',
    captionHt: 'Monte somasyon nan Vault, mete dat **repons**, avoka — pa ignore tribinal.',
    whyEn: 'Consumer power on court mail is act on paper + counsel, not panic.',
    whyHt: 'Pouvwa sou tribinal = aji sou papye + avoka.',
    nextClickEn: 'Return to bureau rounds only when debt gate clears.',
    nextClickHt: 'Retounen round biwo lè gate dèt klè.',
    hotspots: [{ x: 48, y: 66, labelEn: 'Calendar date', labelHt: 'Mete dat', tone: 'rose' }],
  },
];

const LESSON_WALKTHROUGHS: Record<string, WalkthroughStep[]> = {
  'f-visual-walkthrough': [...RESTORE_MAIL_WALKTHROUGH, ...DEBT_LEGAL_WALKTHROUGH],
  'f-rounds': RESTORE_MAIL_WALKTHROUGH.filter((s) => ['r2', 'r3', 'r4', 'r6'].includes(s.id)),
  'f-evidence-ocr': RESTORE_MAIL_WALKTHROUGH.filter((s) => ['r3', 'r5', 'r4'].includes(s.id)),
  'f-debt-validation': DEBT_LEGAL_WALKTHROUGH,
  'f-summons': DEBT_LEGAL_WALKTHROUGH.filter((s) => s.id === 'd2'),
  'f-debt-legal': DEBT_LEGAL_WALKTHROUGH,
  workflow: RESTORE_MAIL_WALKTHROUGH,
};

export function getWalkthroughForLesson(lessonId: string | null | undefined): WalkthroughStep[] {
  if (!lessonId) return [];
  return LESSON_WALKTHROUGHS[lessonId] ?? [];
}

export type AcademyCourseModule = {
  id: string;
  titleEn: string;
  titleHt: string;
  blurbEn: string;
  blurbHt: string;
  lessonId: string;
  quizId?: string;
  tone: 'gold' | 'emerald' | 'violet';
};

export const ACADEMY_COURSE_MODULES: AcademyCourseModule[] = [
  {
    id: 'm1',
    titleEn: 'Consumer power',
    titleHt: 'Pouvwa konsomatè',
    blurbEn: 'How bureaus, furnishers, and e-OSCAR really work — rights first.',
    blurbHt: 'Biwo, founisè, e-OSCAR — dwa an premye.',
    lessonId: 'f-consumer-power',
    tone: 'violet',
  },
  {
    id: 'm2',
    titleEn: 'Visual restore → mail',
    titleHt: 'Restore vizyèl → mail',
    blurbEn: 'Step-by-step portal walkthrough for restore, mail, and vault.',
    blurbHt: 'Chemen pwodwi ak done demo sèlman.',
    lessonId: 'f-visual-walkthrough',
    quizId: 'methodology',
    tone: 'gold',
  },
  {
    id: 'm3',
    titleEn: 'Debt & legal',
    titleHt: 'Dèt ak legal',
    blurbEn: 'Validation, summons literacy, Litigation Command alignment.',
    blurbHt: 'Validasyon, somasyon, Litigation Command.',
    lessonId: 'f-debt-legal',
    quizId: 'debt-legal',
    tone: 'emerald',
  },
  {
    id: 'm4',
    titleEn: 'Compliance law',
    titleHt: 'Lwa konfòmite',
    blurbEn: 'Metro 2, FCRA, FDCPA, CFPB — consumer-power lenses.',
    blurbHt: 'Metro 2, FCRA, FDCPA, CFPB.',
    lessonId: 'h-metro2',
    quizId: 'compliance',
    tone: 'gold',
  },
  {
    id: 'm4b',
    titleEn: 'Statutory depth drill',
    titleHt: 'Pwofondè statutory',
    blurbEn: 'FCRA, FDCPA, Metro 2 fields, FICO honesty — doctorate-style lessons + quiz.',
    blurbHt: 'FCRA, FDCPA, Metro 2, FICO.',
    lessonId: 'f-fcra-doctrine',
    quizId: 'track-f-statutory-depth',
    tone: 'violet',
  },
  {
    id: 'm5',
    titleEn: 'BUILD & funding readiness',
    titleHt: 'BUILD',
    blurbEn: 'Underwriting literacy — no loan guarantees.',
    blurbHt: 'Literati finansman — pa garanti prè.',
    lessonId: 'f-build',
    quizId: 'build',
    tone: 'emerald',
  },
];
