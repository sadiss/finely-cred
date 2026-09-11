/**
 * Haitian marketing pieces — guest documents, not staff SOPs.
 * Hook first. Article they re-read. One action today. No prices on the page.
 */
import { FINELY_COPY_COMPLIANCE_EN, FINELY_COPY_COMPLIANCE_HT } from './finelyCopyVoice';
import { HAITIAN_DESK_LIVE_PATH } from './haitianCompanionDesk';
import { HAITIAN_LETTER_MEANING_KIT_ID } from './haitianLetterMeaningCopy';

export const HT_PIECE_COMPLIANCE_EN = FINELY_COPY_COMPLIANCE_EN;
export const HT_PIECE_COMPLIANCE_HT = FINELY_COPY_COMPLIANCE_HT;

export type HaitianPieceAccent = 'emerald' | 'violet' | 'sky' | 'rose';
export type HaitianPieceRoom = 'service' | 'debt' | 'outreach' | 'roles' | 'metro';
export type HaitianPieceFormat = 'flyer' | 'one-sheet' | 'two-sheet' | 'three-sheet' | 'letter' | 'court';

export type HaitianPieceArchitecture =
  | 'bureau-dossier'
  | 'diy-starter-card'
  | 'card-use-ledger'
  | 'ein-folder'
  | 'vendor-ladder'
  | 'collector-letter'
  | 'validation-docket'
  | 'dfy-matter-brief'
  | 'court-summons'
  | 'foreclosure-notice'
  | 'repo-notice'
  | 'bankruptcy-file'
  | 'tradeline-stack'
  | 'privacy-lock'
  | 'bundle-band'
  | 'chex-stamp'
  | 'maintenance-calendar'
  | 'welcome-one-sheet'
  | 'bureau-file'
  | 'visit-runway'
  | 'helper-playbook'
  | 'church-handbill'
  | 'appointment-card'
  | 'cs-recruit-playbook'
  | 'cs-field-pack'
  | 'affiliate-pass'
  | 'admin-playbook'
  | 'metro-miami-ledger'
  | 'metro-brooklyn-mailbox'
  | 'metro-boston-campus'
  | 'metro-houston-cycle'
  | 'metro-atlanta-moves'
  | 'metro-dc-fan'
  | 'metro-chicago-docket'
  | 'metro-philly-age'
  | 'metro-jax-auto'
  | 'metro-nj-corridor';

export type HaitianGlossaryRow = { en: string; ht: string };

export type HaitianPieceSection = {
  headingEn: string;
  headingHt: string;
  paragraphsEn: string[];
  paragraphsHt: string[];
  table?: { columns: string[]; rows: string[][] };
  form?: { labelEn: string; labelHt: string }[];
};

export type HaitianPieceSpec = {
  id: string;
  ordinal: string;
  room: HaitianPieceRoom;
  format: HaitianPieceFormat;
  architecture: HaitianPieceArchitecture;
  accent: HaitianPieceAccent;
  pageCount: 1 | 2 | 3;
  title: string;
  titleHt: string;
  hookEn: string;
  hookHt: string;
  purpose: string;
  purposeHt: string;
  whoFor: string;
  whoForHt: string;
  lede: string;
  ledeHt: string;
  actionEn: string;
  actionHt: string;
  sections: HaitianPieceSection[];
  glossary: HaitianGlossaryRow[];
  ctaPath: string;
  captionEn: string;
  captionHt: string;
  emailSubjectEn: string;
  emailSubjectHt: string;
  emailLedeEn: string;
  emailLedeHt: string;
  metroKey?: string;
  internal: true;
};

const C = {
  vary: HT_PIECE_COMPLIANCE_EN,
  varyHt: HT_PIECE_COMPLIANCE_HT,
} as const;

function spec(piece: HaitianPieceSpec): HaitianPieceSpec {
  return piece;
}

function section(
  headingEn: string,
  headingHt: string,
  paragraphsEn: string[],
  paragraphsHt: string[],
  extra?: Pick<HaitianPieceSection, 'table' | 'form'>,
): HaitianPieceSection {
  return { headingEn, headingHt, paragraphsEn, paragraphsHt, ...extra };
}

const PROOF: HaitianPieceSpec[] = [
  spec({
    id: 'restore',
    ordinal: '01',
    room: 'service',
    format: 'three-sheet',
    architecture: 'bureau-dossier',
    accent: 'emerald',
    pageCount: 3,
    title: 'Your file is gossip',
    titleHt: 'Dosye w se tripotay',
    hookEn:
      'Paying a collection often does not delete it. You can pay the rumor and still live with the headline.',
    hookHt: 'Peye yon koleksyon souvan pa efase l. Ou ka peye, epi tit la rete sou dosye a.',
    purpose:
      'Your credit file is a gossip column written by computers that have never met you. Three cousins copy the story at different speeds.',
    purposeHt: 'Dosye kredi w se yon jounal tripotay. Twa kouzen kopi istwa a nan vitès diferan.',
    whoFor: 'For anyone who paid and still sees the same ugly line — or who has never read the screen the banks read.',
    whoForHt: 'Pou moun ki peye e ki toujou wè menm liy la — oswa ki pa janm li ekran bank yo li.',
    lede: 'Your credit file is a gossip column written by computers that have never met you.',
    ledeHt: 'Dosye kredi w se yon jounal tripotay odinate yo ekri, e yo pa janm rankontre w.',
    actionEn: 'Photograph all three bureau screens. Circle one finding. Do not mail from memory.',
    actionHt: 'Foto twa ekran biwo yo. Make yon jwenn. Pa voye lèt sou memwa.',
    sections: [
      section(
        'The rumor can stay after you pay',
        'Peye pa toujou efase tit la',
        [
          'The file is not a receipt book. It is a story furnishers keep telling. Pay the collection and the headline can still print. The seven-year clock often starts from the first missed payment — not the day you noticed, and not the day you felt sorry.',
          'Equifax, Experian, and TransUnion are three cousins who do not share a group chat. One can look kind on Tuesday while another still shouts. The PDF they email you is a cousin. The screen is the document.',
        ],
        [
          'Dosye a se pa yon liv resi. Se yon istwa furnisher yo kontinye rakonte. Peye koleksyon an, tit la ka toujou ekri.',
          'Equifax, Experian, ak TransUnion se twa kouzen ki pa gen menm gwoup chat. PDF yo voye se yon kouzen. Ekran an se dokiman an.',
        ],
        {
          table: {
            columns: ['Finding', 'What it looks like', 'What to keep'],
            rows: [
              ['Wrong person', 'A name or life that is not yours', 'Screenshot of the line'],
              ['Wrong amount', 'A number that does not match your paper', 'Your statement or letter'],
              ['Too old to stay', 'The clock started earlier than they say', 'First missed-pay date if you have it'],
              ['Closed, still open', 'The account ended. The file missed the memo', 'Closure letter or screenshot'],
            ],
          },
        },
      ),
      section(
        'The file has a calendar, not a mood',
        'Dosye a gen kalandriye, se pa yon atitid',
        [
          'Bureaus update on their clock. A round of letters is not a weekend binge. Late updates can land on one cousin and not the other two. Pull all three before you celebrate.',
          'Opening a new card while you wait adds a plot twist nobody asked for. Hold still. Let the screens change. Then look again.',
        ],
        [
          'Biwo yo mete ajou sou relè yo. Yon wonn lèt se pa yon wikenn prese. Pran twa yo anvan w selebre.',
          'Ouvri yon nouvo kat pandan w ap tann ajoute yon istwa pèsonn pa mande.',
        ],
        {
          form: [
            { labelEn: 'Round mailed (date)', labelHt: 'Wonn voye (dat)' },
            { labelEn: 'Equifax pulled', labelHt: 'Equifax pran' },
            { labelEn: 'Experian pulled', labelHt: 'Experian pran' },
            { labelEn: 'TransUnion pulled', labelHt: 'TransUnion pran' },
          ],
        },
      ),
      section(
        'Hold the garden',
        'Kenbe jaden an',
        [
          'After a clean round, the file can drift. Furnishers re-report. New cards shout. A credit file is a garden — nobody applauds watering until they do.',
          'Do not celebrate by opening three cards. Watch how much you use. Put the next pull on a calendar.',
        ],
        [
          'Apre yon wonn pwòp, dosye a ka derive. Pa selebre lè w ouvri twa kat. Mete pwochèn pran an sou kalandriye a.',
        ],
      ),
    ],
    glossary: [
      { en: 'credit file', ht: 'dosye kredi' },
      { en: 'bureau', ht: 'biwo rapo' },
      { en: 'collection', ht: 'koleksyon' },
      { en: 'dispute', ht: 'diskisyon sou sa ki sou dosye a' },
    ],
    ctaPath: '/services/personal-credit-restore',
    captionEn: `Paying a collection often does not delete it. The rumor can stay. Photograph the screen. ${C.vary}`,
    captionHt: `Peye yon koleksyon souvan pa efase l. Foto ekran an. Pale Kreyol le w pare. ${C.varyHt}`,
    emailSubjectEn: 'You can pay the rumor and still live with the headline',
    emailSubjectHt: 'Peye pa toujou efase tit la',
    emailLedeEn:
      'Your file is a gossip column written by computers that have never met you. Photograph all three screens before anyone mails a letter.',
    emailLedeHt: 'Dosye w se yon jounal tripotay. Foto twa ekran yo anvan nenpot lèt.',
    internal: true,
  }),
  spec({
    id: HAITIAN_LETTER_MEANING_KIT_ID,
    ordinal: '02',
    room: 'debt',
    format: 'letter',
    architecture: 'collector-letter',
    accent: 'sky',
    pageCount: 2,
    title: 'What this letter says',
    titleHt: 'Lèt sa a di kisa?',
    hookEn: 'That collection letter is a clock, not a bill you have to pay before breakfast.',
    hookHt: 'Lèt koleksyon an se yon relè, se pa yon bòdwo ou dwe peye anvan manje maten.',
    purpose:
      'A collector letter has the confidence of a wedding invitation and the paperwork of a parking ticket. Read the English line before anyone pays.',
    purposeHt: 'Yon let kolekte gen konfyans yon envitasyon maryaj. Li liy angle a anvan nenpot peye.',
    whoFor: 'For the person who opened an envelope this week and felt their stomach drop.',
    whoForHt: 'Pou moun ki ouvri yon anvlop semèn sa a epi ki santi vant yo desann.',
    lede: 'A collector letter is a clock. It is not an order to pay today.',
    ledeHt: 'Yon let kolekte se yon rele. Se pa yon lod pou peye jodi a.',
    actionEn: 'Keep the envelope. Write the date it arrived. Do not pay this week from fear.',
    actionHt: 'Kenbe anvlop la. Ekri dat li rive. Pa peye semèn sa a paske w pe.',
    sections: [
      section(
        'The line on the letter',
        'Liy ki sou let la',
        [
          'This account is reporting a collection. That English means a collector is already telling a story on your file. It does not mean you must pay before breakfast. Paying from fear the same week you opened the mail is how good people buy silence that does not last.',
          'Debt often sells for pennies. The buyer on the letterhead may not have the original contract. You may ask them to prove it is yours and the amount is real. That window is short. It does not start when you feel ready.',
        ],
        [
          'Yon kolekte ap rapote yon kont sou dosye w. Sa pa vle di ou dwe peye jodi a. Peye paske w pe nan menm semèn nan se jan moun bon achte silans ki pa dire.',
          'Det souvan vann pou kek santim. Ou ka mande yo montre sa a se pou ou epi montan an vre.',
        ],
      ),
      section(
        'Words you will see again',
        'Mo w ap we anko',
        ['Learn the English. You will meet it on the next envelope, the bureau screen, and the phone script.'],
        ['Aprann mo angle yo. W ap we yo sou pwochèn anvlop, sou ekran biwo, ak nan telefon.'],
        {
          table: {
            columns: ['English on the paper', 'Meaning', 'Where it shows up'],
            rows: [
              ['collection', 'koleksyon — a rumor with a phone number', 'Letter and bureau line'],
              ['account', 'kont — the file they say is yours', 'Account ref / Re: line'],
              ['reporting', 'ap rapote — telling the story to a bureau', 'The scary sentence'],
              ['validation', 'mande prev — show me it is mine', 'Your written request'],
            ],
          },
        },
      ),
      section(
        'The envelope is evidence',
        'Anvlop la se prev',
        [
          'Keep it. Write the day it arrived. A screenshot of a text is a rumor. The envelope date is how clocks start arguments. Do not pay from fear the same week.',
        ],
        [
          'Kenbe l. Ekri jou li rive. Yon foto teks se tripotay. Dat anvlop la se jan rele yo komanse diskisyon.',
        ],
      ),
    ],
    glossary: [
      { en: 'collection', ht: 'koleksyon' },
      { en: 'account', ht: 'kont' },
      { en: 'reporting', ht: 'ap rapote' },
      { en: 'validation', ht: 'mande prev' },
    ],
    ctaPath: '/services/debt-legal',
    captionEn: `A collection letter is a clock, not a breakfast bill. Keep the envelope. ${C.vary}`,
    captionHt: `Let koleksyon an se yon rele. Kenbe anvlop la. ${C.varyHt}`,
    emailSubjectEn: 'That collection letter is a clock',
    emailSubjectHt: 'Let koleksyon an se yon rele',
    emailLedeEn:
      'We kept the English line on the page and put the meaning beside it. Keep the envelope. Do not pay from fear this week.',
    emailLedeHt: 'Nou kite liy angle a sou paj la. Kenbe anvlop la. Pa peye paske w pe.',
    internal: true,
  }),
  spec({
    id: 'community-flyer',
    ordinal: '03',
    room: 'outreach',
    format: 'flyer',
    architecture: 'church-handbill',
    accent: 'rose',
    pageCount: 1,
    title: 'A rumor with a phone number',
    titleHt: 'Yon tripotay ki gen nimewo',
    hookEn: 'A collection is a rumor with a phone number. Paying it often does not delete the headline.',
    hookHt: 'Yon koleksyon se yon tripotay ki gen yon nimewo telefon. Peye l souvan pa efase tit la.',
    purpose: 'Credit help for Haitian Americans. Scan when you are ready. Nobody is grading your accent.',
    purposeHt: 'Nou ede Ayisyen ki viv Ozetazini ak kredi ak let. Skan le w pare.',
    whoFor: 'For a table at church, a niece, or anyone putting paper where people already sit.',
    whoForHt: 'Pou yon tab legliz, yon nyes, oswa nenpot moun k ap mete papye kote moun deja chita.',
    lede: 'A collection is a rumor with a phone number. We read the English line. Pale Kreyol when you are ready.',
    ledeHt: 'Yon koleksyon se yon tripotay ki gen nimewo. Nou li liy angle a. Pale Kreyol le w pare.',
    actionEn: 'Scan the code on the page to open Haitian community. Pale Kreyòl when you are ready to talk.',
    actionHt: 'Skan kòd la pou ouvri Haitian community. Pale Kreyòl lè w pare pou pale.',
    sections: [
      section(
        'What most people never learn',
        'Sa pifo moun pa janm aprann',
        [
          'A credit file is a written story, and the story can be wrong without anyone meaning harm. The letter in English stays English because the bureaus speak English. Kreyol makes the meaning clear. It does not replace the paper you mail.',
        ],
        [
          'Dosye kredi se yon istwa ekri, epi istwa a ka mal san pesonn pa vle fe mal. Angle rete sou papye w voye. Kreyol fè siyifikasyon an kle.',
        ],
      ),
      section(
        'Four secrets, four desks',
        'Kat sekre, kat biwo',
        [
          'Restore: paying often does not delete the rumor. Debt: the letter is a clock. Building: the bureau photographs statement day, not payday. Business: the company file lives on the EIN, not the owner Social Security number.',
        ],
        [
          'Restore: peye souvan pa efase tripotay la. Det: let la se yon rele. Building: biwo a foto jou deklarasyon. Biznis: dosye konpayi an viv sou EIN.',
        ],
      ),
    ],
    glossary: [
      { en: 'collection', ht: 'koleksyon' },
      { en: 'credit file', ht: 'dosye kredi' },
    ],
    ctaPath: HAITIAN_DESK_LIVE_PATH,
    captionEn: `A collection is a rumor with a phone number. Paying it often does not delete the headline. Pale Kreyol when you are ready. ${C.vary}`,
    captionHt: `Yon koleksyon se yon tripotay ki gen nimewo. Pale Kreyol le w pare. ${C.varyHt}`,
    emailSubjectEn: 'A collection is a rumor with a phone number',
    emailSubjectHt: 'Yon koleksyon se yon tripotay ki gen nimewo',
    emailLedeEn: 'Print this page. Put it where people already sit. They scan when they are ready.',
    emailLedeHt: 'Enprime paj sa a. Mete l kote moun deja chita. Yo skan le yo pare.',
    internal: true,
  }),
];

const MORE: HaitianPieceSpec[] = [
  spec({
    id: 'what-is-credit',
    ordinal: '04',
    room: 'outreach',
    format: 'one-sheet',
    architecture: 'bureau-file',
    accent: 'sky',
    pageCount: 1,
    title: 'There is no single credit report',
    titleHt: 'Pa gen yon sel rapo kredi',
    hookEn:
      'There is no single “the credit report.” Three bureaus gossip at different speeds. One app screenshot is not the whole truth.',
    hookHt: 'Pa gen yon sel rapo kredi. Twa biwo fe tripotay nan vites diferan.',
    purpose: 'Equifax, Experian, and TransUnion can disagree on the same Tuesday.',
    purposeHt: 'Equifax, Experian, ak TransUnion ka pa dako menm madi a.',
    whoFor: 'For anyone who thinks one score app is the document the bank will read.',
    whoForHt: 'Pou moun ki panse yon app not se dokiman bank la li.',
    lede: 'Think of them as three cousins who do not share a group chat.',
    ledeHt: 'Panse yo tankou twa kouzen ki pa gen menm gwoup chat.',
    actionEn: 'Photograph every bureau screen before you write a letter to one.',
    actionHt: 'Foto chak ekran biwo anvan w ekri yon let bay youn.',
    sections: [
      section(
        'Three cousins',
        'Twa kouzen',
        [
          'A “deleted” item can reappear if a furnisher sends it again. Personal information errors — name, address, employer — are findings too. Inquiries, collections, and revolving are different rooms on the same floor.',
          'A score app is a gift shop. AnnualCreditReport.com is the federal door. Pull all three before you argue with one.',
        ],
        [
          'Yon atik “efase” ka tounen si yon furnisher voye l anko. Yon app not se yon boutik kado. Pran twa yo anvan w diskite ak youn.',
        ],
        {
          table: {
            columns: ['Cousin', 'What they keep', 'Why you photograph them'],
            rows: [
              ['Equifax', 'One version of the gossip', 'Your letter must match this screen'],
              ['Experian', 'Another version, same Tuesday', 'They may not have gotten the memo'],
              ['TransUnion', 'The third cousin', 'Late updates land unevenly'],
            ],
          },
        },
      ),
    ],
    glossary: [
      { en: 'bureau', ht: 'biwo rapo' },
      { en: 'credit file', ht: 'dosye kredi' },
      { en: 'score', ht: 'not' },
    ],
    ctaPath: HAITIAN_DESK_LIVE_PATH,
    captionEn: `There is no single credit report. Three cousins gossip at different speeds. ${C.vary}`,
    captionHt: `Pa gen yon sel rapo. Twa kouzen, twa vites. ${C.varyHt}`,
    emailSubjectEn: 'There is no single credit report',
    emailSubjectHt: 'Pa gen yon sel rapo kredi',
    emailLedeEn: 'Three bureaus can disagree on the same Tuesday. Photograph all three screens.',
    emailLedeHt: 'Twa biwo ka pa dako menm madi a. Foto twa ekran yo.',
    internal: true,
  }),
  spec({
    id: 'helper',
    ordinal: '05',
    room: 'roles',
    format: 'one-sheet',
    architecture: 'helper-playbook',
    accent: 'violet',
    pageCount: 1,
    title: 'You’re allowed to sit there. Don’t take the phone.',
    titleHt: 'Ou gen dwa chita la. Pa pran telefòn nan.',
    hookEn:
      'Your mom opened a letter in English and her stomach dropped. If you take her phone and “just do it,” she will nod, you will leave, and next week she will call you crying because she still does not know what the paper said.',
    hookHt:
      'Manman w ouvri yon lèt an angle epi vant li desann. Si ou pran telefòn li epi “jis fè l,” l ap souke tèt, w ap ale, epi semèn pwochèn l ap rele w k ap kriye paske li toujou pa konnen sa papye a te di.',
    purpose:
      'You drove over to help. Stay in the chair. Let her hold her own phone. Your job is to point at one English sentence and wait until she can say it back — not to hijack the visit.',
    purposeHt:
      'Ou vin ede. Rete nan chèz la. Se li ki kenbe telefòn li. Ou montre yon fraz angle epi tann jiskaske li ka di l tounen.',
    whoFor: 'For a niece, son, or spouse sitting beside someone who just opened mail in English.',
    whoForHt: 'Pou yon nyès, pitit, oswa mari/madanm k ap chita bò kote moun ki fèk ouvri lèt an angle.',
    lede: 'Love is not a credit score. She has to understand the sentence — not watch you tap.',
    ledeHt: 'Lanmou se pa yon nòt kredi. Se li ki dwe konprann fraz la — se pa gade ou peze.',
    actionEn:
      'She holds her phone. You point at one English sentence and wait until she can say what it means. One letter or one screen. Then you both stop for the day.',
    actionHt:
      'Se li ki kenbe telefòn li. Ou montre yon fraz angle epi tann jiskaske li ka di sa l vle di. Yon lèt oswa yon ekran. Apre sa nou de kanpe pou jounen an.',
    sections: [
      section(
        'What you are looking at',
        'Kisa w ap gade',
        [
          'The letter is whatever hit the mailbox — a collector asking for money, sometimes a court. Keep the envelope. Write the day it arrived. The bureau page is Equifax, Experian, or TransUnion on the actual website. That screen is what a bank reads. The PDF in email is a cousin. A score app is entertainment. Open the paper or the website she already received. Do not open six new tabs and “finish her file” before lunch.',
          'Read the English sentence out loud. Then say what it means in Kreyòl. Then read the English again so the words stick. Do not promise a score. If the paper looks like a summons — court caption, a date to answer — stop DIY bravado. Keep every page. Your notes app is not the court file. Pale Kreyòl is a talk button when she wants to talk. It is not an order to sit down.',
        ],
        [
          'Lèt la se sa ki rive nan bwat la — yon kolektè, pafwa tribinal. Kenbe anvlòp la. Paj biwo a se Equifax, Experian, oswa TransUnion sou sitwèb la. Se ekran bank lan li. PDF nan imel se yon kouzen. Yon app nòt se amizman. Li fraz angle a byen fò. Apre sa di sa l vle di an Kreyòl. Pa pwomèt yon nòt. Si papye a sanble yon summons, kanpe. Kenbe tout paj yo.',
        ],
      ),
    ],
    glossary: [
      { en: 'letter', ht: 'lèt — papye ki rive nan bwat la' },
      { en: 'bureau page', ht: 'paj biwo — Equifax, Experian, oswa TransUnion' },
      { en: 'summons', ht: 'papye tribinal' },
    ],
    ctaPath: HAITIAN_DESK_LIVE_PATH,
    captionEn: `You’re allowed to sit there. Don’t take the phone. She has to understand the English sentence. ${C.vary}`,
    captionHt: `Ou gen dwa chita la. Pa pran telefòn nan. Se li ki dwe konprann fraz angle a. ${C.varyHt}`,
    emailSubjectEn: 'You’re allowed to sit there. Don’t take the phone.',
    emailSubjectHt: 'Ou gen dwa chita la. Pa pran telefòn nan.',
    emailLedeEn:
      'She holds her own phone. You point at one English sentence — the letter in the mailbox, or the Equifax / Experian / TransUnion screen — and wait until she can say what it means. Then stop for the day.',
    emailLedeHt:
      'Se li ki kenbe telefòn li. Ou montre yon fraz angle — lèt nan bwat la, oswa ekran Equifax / Experian / TransUnion — epi tann jiskaske li ka di sa l vle di.',
    internal: true,
  }),
  spec({
    id: 'community-intro',
    ordinal: '06',
    room: 'outreach',
    format: 'one-sheet',
    architecture: 'welcome-one-sheet',
    accent: 'emerald',
    pageCount: 1,
    title: 'Credit English is a dialect',
    titleHt: 'Angle kredi se yon dyalek',
    hookEn:
      'You do not need a finance degree. Nobody is born fluent in “30-day validation.” You need the English line and someone who will not rush you.',
    hookHt: 'Ou pa bezwen yon diploma finans. Pesonn pa fet pale “30-day validation” flwans.',
    purpose: 'Haitian community is credit help for Haitian Americans. Four desks. One start.',
    purposeHt: 'Nou la pou Ayisyen ki viv Ozetazini. Kat biwo. Yon komanse.',
    whoFor: 'For a guest who just found the desk and needs to know it is for them.',
    whoForHt: 'Pou yon envite ki fek jwenn biwo a.',
    lede: 'A score app is entertainment. The bureau screen is the document.',
    ledeHt: 'Yon app not se amizman. Ekran biwo a se dokiman an.',
    actionEn: 'Pale Kreyol when you want the meaning. Book a session if the stack is thick.',
    actionHt: 'Pale Kreyol le w vle siyifikasyon an. Rezève yon sesyon si pil la epe.',
    sections: [
      section(
        'Four doors',
        'Kat pot',
        [
          'Restore if the screen is wrong. Debt if an envelope arrived. Building if the file is thin. Business if the company needs its own file on the EIN. Pick one for the day. We do not post a number on this paper. If you ask, we talk.',
        ],
        [
          'Restore si ekran an mal. Det si yon anvlop rive. Building si dosye a mens. Biznis si konpayi an bezwen pwop dosye sou EIN. Chwazi youn pou jounen an.',
        ],
      ),
    ],
    glossary: [
      { en: 'credit file', ht: 'dosye kredi' },
      { en: 'letter', ht: 'let' },
    ],
    ctaPath: HAITIAN_DESK_LIVE_PATH,
    captionEn: `Credit English is a dialect. Nobody is born fluent in 30-day validation. ${C.vary}`,
    captionHt: `Angle kredi se yon dyalek. Pale Kreyol le w pare. ${C.varyHt}`,
    emailSubjectEn: 'Nobody is born fluent in credit English',
    emailSubjectHt: 'Pesonn pa fet pale angle kredi',
    emailLedeEn: 'You need the English line and someone who will not rush you. Pale Kreyol when you are ready.',
    emailLedeHt: 'Ou bezwen liy angle a ak yon moun ki p ap prese w.',
    internal: true,
  }),
  spec({
    id: 'building',
    ordinal: '07',
    room: 'service',
    format: 'one-sheet',
    architecture: 'card-use-ledger',
    accent: 'sky',
    pageCount: 1,
    title: 'Payday is the outfit. Statement day is the photo.',
    titleHt: 'Jou pèyman se rad la. Jou deklarasyon se foto a.',
    hookEn:
      'How much you use on the card often moves the file faster than a dramatic “I paid it all and closed it.” Closing the oldest card can shrink your garden.',
    hookHt: 'Konbyen ou itilize sou kat la souvan deplase dosye a pi vit pase “mwen peye tout epi mwen femen l.”',
    purpose: 'The bureau photographs the card on statement day, not on the day you got paid.',
    purposeHt: 'Biwo a foto kat la jou deklarasyon, pa jou ou resevwa lajan.',
    whoFor: 'For anyone whose percentage looks loud even after they paid.',
    whoForHt: 'Pou moun ki gen pousantaj fo menm apre yo peye.',
    lede: 'Your card is not a personality. It is a percentage that likes to gossip at statement time.',
    ledeHt: 'Kat ou a se pa yon pesonalite. Se yon pousantaj ki renmen tripotay le deklarasyon an rive.',
    actionEn: 'Write each card’s statement date. Do not close the oldest good card for sport.',
    actionHt: 'Ekri dat deklarasyon chak kat. Pa femen pi ansyen bon kat la pou plezi.',
    sections: [
      section(
        'The snapshot is not your character',
        'Foto a se pa karakte ou',
        [
          'A zero reported balance is not always the flex people think it is. A thin file is not a moral failure — it is a short story. Add pages on purpose. Hard inquiries cluster: applying everywhere in one weekend is a group chat the bureaus can see.',
          'FICO and Vantage are different math. Mortgage and auto often look at different versions. Nobody can sell you a number like a lottery ticket.',
        ],
        [
          'Yon balans zewo rapote se pa toujou fleks. Yon dosye mens se yon istwa kout. Hard inquiry yo gwoupe. Pesonn pa ka vann ou yon nimewo tankou yon tike lotri.',
        ],
        {
          table: {
            columns: ['Card', 'Statement date', 'What it photographed'],
            rows: [
              ['____________', '______ / ______', '____________'],
              ['____________', '______ / ______', '____________'],
              ['____________', '______ / ______', '____________'],
            ],
          },
        },
      ),
    ],
    glossary: [
      { en: 'utilization', ht: 'konbyen ou itilize sou kat la' },
      { en: 'statement date', ht: 'dat deklarasyon' },
    ],
    ctaPath: '/services/personal-credit-building',
    captionEn: `Payday is the outfit. Statement day is the photo. ${C.vary}`,
    captionHt: `Jou pèyman se rad la. Jou deklarasyon se foto a. ${C.varyHt}`,
    emailSubjectEn: 'The bureau photographs statement day, not payday',
    emailSubjectHt: 'Biwo a foto jou deklarasyon, pa jou pèyman',
    emailLedeEn: 'You already paid. The percentage did not get the memo. Write each statement date.',
    emailLedeHt: 'Ou deja peye. Pousantaj la pa resevwa memo a. Ekri dat deklarasyon yo.',
    internal: true,
  }),
  spec({
    id: 'business',
    ordinal: '08',
    room: 'service',
    format: 'one-sheet',
    architecture: 'ein-folder',
    accent: 'violet',
    pageCount: 1,
    title: 'FICO in a trench coat is a myth',
    titleHt: 'FICO nan yon rad se yon manti',
    hookEn:
      'The company file lives on the EIN. Your Social Security number is not a secret business score hiding in a trench coat. PAYDEX is not FICO in a suit — it is how many days you took to pay the vendor.',
    hookHt: 'Dosye konpayi an viv sou EIN. Nimewo sosyal ou se pa yon not biznis kache. PAYDEX se konbyen jou ou te pran pou peye machann nan.',
    purpose: 'Entity, matching listings, and vendors that actually report come before a company ask.',
    purposeHt: 'Konpayi, lis ki matche, ak machann ki vreman rapote vin anvan yon demann konpayi.',
    whoFor: 'For owners whose personal file is messy and who were told the company cannot have a file.',
    whoForHt: 'Pou pwopriyetè ki panse dosye pèsonel sal la fèmen pòt konpayi an.',
    lede: 'A vendor that does not report is a nice invoice, not a tradeline.',
    ledeHt: 'Yon machann ki pa rapote se yon bodwo janti, se pa yon tradeline.',
    actionEn: 'Write the EIN. Name one vendor that actually reports. Then a company ask — not the owner SSN.',
    actionHt: 'Ekri EIN nan. Nonmen yon machann ki vreman rapote. Apre sa, yon demann sou EIN.',
    sections: [
      section(
        'Two lives, two files',
        'De lavi, de dosye',
        [
          'Using the owner SSN as the company file is how two lives get tangled. Name, address, phone, and SOS listing should tell the same story. DUNS and bureau files are not automatic — you open them on purpose. A domain email that matches the listing beats a free inbox named after a hobby.',
        ],
        [
          'Sèvi ak nimewo sosyal pwopriyetè a kòm dosye konpayi se jan de lavi mele. Non, adres, telefon, ak lis SOS ta dwe rakonte menm istwa a.',
        ],
        {
          table: {
            columns: ['Need', 'Why it matters'],
            rows: [
              ['EIN', 'The company file’s address'],
              ['Matching listings', 'Name, phone, address tell one story'],
              ['Vendors that report', 'Invoices that do not report are souvenirs'],
            ],
          },
        },
      ),
    ],
    glossary: [
      { en: 'EIN', ht: 'nimewo taks konpayi' },
      { en: 'PAYDEX', ht: 'konbyen jou pou peye machann nan' },
    ],
    ctaPath: '/services/business-credit',
    captionEn: `PAYDEX is not FICO in a suit. It is days to pay the vendor. ${C.vary}`,
    captionHt: `PAYDEX se pa FICO nan kostim. ${C.varyHt}`,
    emailSubjectEn: 'The company file is not hiding in your Social Security number',
    emailSubjectHt: 'Dosye konpayi an pa kache nan nimewo sosyal ou',
    emailLedeEn: 'Open the company file on the EIN. Vendors that report. Then a company ask.',
    emailLedeHt: 'Ouvri dosye konpayi an sou EIN. Machann ki rapote. Apre sa, yon demann.',
    internal: true,
  }),
  spec({
    id: 'how-it-works',
    ordinal: '09',
    room: 'outreach',
    format: 'one-sheet',
    architecture: 'visit-runway',
    accent: 'sky',
    pageCount: 1,
    title: 'Credit is not a binge show',
    titleHt: 'Kredi se pa yon seri tout lannwit',
    hookEn:
      'A good visit is one English line, one meaning, one next step. Then you stop. That is not laziness. That is how files get less messy.',
    hookHt: 'Yon bon vizit se yon liy angle, yon siyifikasyon, yon pwochen etap. Apre sa ou kanpe.',
    purpose: 'Rushed weekends create the wrong letter to the wrong cousin.',
    purposeHt: 'Wikenn prese kreye move let bay move kouzen.',
    whoFor: 'For anyone who wants to “finish the whole file this Saturday.”',
    whoForHt: 'Pou moun ki vle fini tout dosye a samdi sa a.',
    lede: 'Stop after episode one. Come back next week if you need another.',
    ledeHt: 'Kanpe apre premye epizod. Tounen semèn pwochèn si w bezwen yon lot.',
    actionEn: 'Bring the envelope that arrived. Pick one desk — restore, debt, building, or business. Then stop for the day.',
    actionHt: 'Pote anvlòp ki rive a. Chwazi yon biwo. Apre sa kanpe pou jounen an.',
    sections: [
      section(
        'How a visit actually works',
        'Kouman yon vizit pase vreman',
        [
          'We read the English line together. You pick one desk — restore, debt, building, or business. We stop. Screenshots without dates are modern folklore. If the paper is a summons, the visit changes shape. We never promise a score. We never pretend to be the court.',
        ],
        [
          'Nou li liy angle a. Ou chwazi yon biwo. Nou kanpe. Si papye a se yon summons, vizit la chanje fom. Nou pa janm pwomet yon not.',
        ],
      ),
    ],
    glossary: [
      { en: 'letter', ht: 'let' },
      { en: 'summons', ht: 'papye tribinal' },
    ],
    ctaPath: HAITIAN_DESK_LIVE_PATH,
    captionEn: `Credit is not a binge show. One line. One step. Then stop. ${C.vary}`,
    captionHt: `Kredi se pa yon seri tout lannwit. Yon liy. Yon etap. ${C.varyHt}`,
    emailSubjectEn: 'A good visit is one episode, not the whole season',
    emailSubjectHt: 'Yon bon vizit se yon epizod, se pa tout sezon an',
    emailLedeEn: 'Read the English line. Pick one desk. Stop for the day.',
    emailLedeHt: 'Li liy angle a. Chwazi yon biwo. Kanpe pou jounen an.',
    internal: true,
  }),
];

const REST: HaitianPieceSpec[] = [
  spec({
    id: 'restore-diy',
    ordinal: '10',
    room: 'service',
    format: 'one-sheet',
    architecture: 'diy-starter-card',
    accent: 'emerald',
    pageCount: 1,
    title: 'The screenshot is the evidence',
    titleHt: 'Foto ekran an se prev la',
    hookEn: 'The screenshot is the evidence. The emailed PDF is a cousin. Certified mail is how you prove you spoke.',
    hookHt: 'Foto ekran an se prev la. PDF nan imel se yon kouzen. Let sètifye se jan ou pwouve ou pale.',
    purpose: 'Circle one wrong line. Photograph the bureau screen. Mail the English letter.',
    purposeHt: 'Make yon liy ki mal. Foto ekran biwo a. Voye let angle a.',
    whoFor: 'For the person starting restore themselves this week.',
    whoForHt: 'Pou moun k ap komanse restore yo menm semèn sa a.',
    lede: 'Do not mail from memory of last year’s lease.',
    ledeHt: 'Pa voye let sou memwa kontra ane pase a.',
    actionEn: 'Photograph the screen first. Then write the tracking number.',
    actionHt: 'Foto ekran an anvan. Apre sa ekri nimewo tracking.',
    sections: [
      section(
        'Why the screen beats the PDF',
        'Poukisa ekran an bat PDF la',
        [
          'The PDF they email is a cousin, not the twin. Your letter has to match what the bureau shows the furnisher. Circle one finding. Wrong person, wrong amount, too-old-to-stay — not vibes.',
        ],
        ['Foto ekran biwo a. Let ou a dwe matche sa biwo a montre. Make yon jwenn — pa santiman.'],
        {
          form: [
            { labelEn: 'Bureau (Equifax / Experian / TransUnion)', labelHt: 'Biwo' },
            { labelEn: 'Tracking number', labelHt: 'Nimewo tracking' },
            { labelEn: 'Date mailed', labelHt: 'Dat voye' },
          ],
        },
      ),
    ],
    glossary: [
      { en: 'screenshot', ht: 'foto ekran' },
      { en: 'dispute', ht: 'diskisyon sou sa ki sou dosye a' },
    ],
    ctaPath: '/services/personal-credit-restore',
    captionEn: `The emailed PDF is a cousin. The screen is the document. ${C.vary}`,
    captionHt: `PDF nan imel se yon kouzen. Ekran an se dokiman an. ${C.varyHt}`,
    emailSubjectEn: 'The emailed PDF is a cousin. The screen is the document.',
    emailSubjectHt: 'PDF nan imel se yon kouzen',
    emailLedeEn: 'Photograph the bureau screen. Then mail. Write the tracking number here.',
    emailLedeHt: 'Foto ekran biwo a. Apre sa voye. Ekri nimewo tracking la.',
    internal: true,
  }),
  spec({
    id: 'debt-diy',
    ordinal: '11',
    room: 'debt',
    format: 'one-sheet',
    architecture: 'validation-docket',
    accent: 'rose',
    pageCount: 1,
    title: 'Ask for proof',
    titleHt: 'Mande prev',
    hookEn:
      'You may ask them to prove it is yours and the amount is real. That window is short. It does not start when you feel ready.',
    hookHt: 'Ou ka mande yo montre sa a se pou ou. Fenet la kout. Li pa komanse le ou santi w pare.',
    purpose: 'Validation is English for show me this is mine. Mini-Miranda is a warning label, not your confession.',
    purposeHt: 'Validasyon vle di: montre m sa a se pou mwen. Mini-Miranda se yon avetisman, se pa konfesyon ou.',
    whoFor: 'For the person holding a collection notice and a rising pulse.',
    whoForHt: 'Pou moun ki kenbe yon avi koleksyon ak yon kè k ap monte.',
    lede: 'Pay to delete is a negotiation, not a right stamped on the page.',
    ledeHt: 'Pay to delete se yon negosyasyon, se pa yon dwa ki tape sou paj la.',
    actionEn: 'Date the envelope. Photograph every page. Do not pay from panic on day one.',
    actionHt: 'Date anvlop la. Foto chak paj. Pa peye nan panik jou youn.',
    sections: [
      section(
        'The letter is a clock',
        'Let la se yon rele',
        [
          'A summons is court paper. A collection notice is not automatically a lawsuit. Licensing, chain of title, and itemized amounts are questions — not attitude. Clocks win more arguments than adjectives.',
        ],
        [
          'Yon summons se papye tribinal. Yon avi koleksyon se pa otomatikman yon pwose. Kenbe tout dat.',
        ],
        {
          form: [
            { labelEn: 'Day the envelope arrived', labelHt: 'Jou anvlop la rive' },
            { labelEn: 'Who sent it (letterhead)', labelHt: 'Kiyes ki voye l' },
            { labelEn: 'Validation request mailed', labelHt: 'Demann validasyon voye' },
          ],
        },
      ),
    ],
    glossary: [
      { en: 'validation', ht: 'mande prev' },
      { en: 'collector', ht: 'kolekte' },
      { en: 'original creditor', ht: 'premye kredye' },
    ],
    ctaPath: '/services/debt-legal',
    captionEn: `Ask them to prove it. The window does not wait until you feel ready. ${C.vary}`,
    captionHt: `Mande prev. Fenet la pa tann. ${C.varyHt}`,
    emailSubjectEn: 'The validation window does not wait until you feel ready',
    emailSubjectHt: 'Fenet validasyon an pa tann',
    emailLedeEn: 'Date the envelope. Ask for proof in writing. Do not pay from panic on day one.',
    emailLedeHt: 'Date anvlop la. Mande prev nan ekri. Pa peye nan panik.',
    internal: true,
  }),
  spec({
    id: 'debt-dfy',
    ordinal: '12',
    room: 'debt',
    format: 'one-sheet',
    architecture: 'dfy-matter-brief',
    accent: 'rose',
    pageCount: 1,
    title: 'Two rooms. One chair.',
    titleHt: 'De chanm. Yon chez.',
    hookEn: 'You keep the paper. We run the clocks. Panic-paying both jobs on the same morning is how good people buy nothing.',
    hookHt: 'Ou kenbe papye a. Nou mennen rele yo. Peye tou de travay nan menm maten se jan moun bon achte anyen.',
    purpose: 'A matter brief: what arrived, the date, whether it is court paper.',
    purposeHt: 'Yon rezime: sa ki rive, dat la, si se papye tribinal.',
    whoFor: 'For households who want the desk to run the English paper while they keep the stack.',
    whoForHt: 'Pou kay ki vle biwo a mennen papye angle a pandan yo kenbe pil la.',
    lede: 'If court paper is in the stack, that room goes first.',
    ledeHt: 'Si papye tribinal nan pil la, chanm sa a ale anvan.',
    actionEn: 'Put the stack in one envelope. Name whether it is a letter or court paper.',
    actionHt: 'Mete pil la nan yon anvlop. Di si se yon let oswa papye tribinal.',
    sections: [
      section(
        'You hold / we run',
        'Ou kenbe / nou mennen',
        [
          'You keep every envelope and date. We run the English requests and the calendar. Two rooms can run in the same month. They still need different papers. One next step per sitting.',
        ],
        ['Ou kenbe tout anvlop ak dat. Nou mennen demann angle yo. De chanm, toujou yon chez.'],
        {
          form: [
            { labelEn: 'What arrived (letter / notice / summons)', labelHt: 'Sa ki rive' },
            { labelEn: 'Date on the envelope', labelHt: 'Dat sou anvlop la' },
            { labelEn: 'Court paper? yes / no', labelHt: 'Papye tribinal? wi / non' },
          ],
        },
      ),
    ],
    glossary: [
      { en: 'validation', ht: 'mande prev' },
      { en: 'summons', ht: 'papye tribinal' },
    ],
    ctaPath: '/services/debt-legal',
    captionEn: `You keep the paper. We run the clocks. One chair. ${C.vary}`,
    captionHt: `Ou kenbe papye a. Nou mennen rele yo. ${C.varyHt}`,
    emailSubjectEn: 'You keep the paper. We run the clocks.',
    emailSubjectHt: 'Ou kenbe papye a. Nou mennen rele yo.',
    emailLedeEn: 'Name what arrived. Keep the dates. If it is court paper, that room first.',
    emailLedeHt: 'Nonmen sa ki rive. Kenbe dat yo. Si se papye tribinal, chanm sa a anvan.',
    internal: true,
  }),
  spec({
    id: 'litigation',
    ordinal: '13',
    room: 'debt',
    format: 'court',
    architecture: 'court-summons',
    accent: 'rose',
    pageCount: 2,
    title: 'Sample summons',
    titleHt: 'Egzanp papye tribinal',
    hookEn: 'A summons is court paper. It has a clock. It is not a strongly worded collection email in nicer font.',
    hookHt: 'Yon summons se papye tribinal. Li gen yon rele. Se pa yon imel koleksyon ak yon pi bel font.',
    purpose: 'If you do not answer, the court can decide without you. A phone call to the collector is not an answer.',
    purposeHt: 'Si ou pa reponn, tribinal la ka deside san ou. Yon apel telefon bay kolekte a se pa yon repons.',
    whoFor: 'For anyone who needs to recognize court paper before the date runs out.',
    whoForHt: 'Pou moun ki bezwen rekonet papye tribinal anvan dat la pase.',
    lede: 'Court captions are allergic to vibes. They want dates, names, and a response.',
    ledeHt: 'Caption tribinal yo pa renmen vibes. Yo vle dat, non, ak yon repons.',
    actionEn: 'If a real one arrived, find the answer date and keep every page. This PDF is a sample — not your live case.',
    actionHt: 'Si yon vre rive, jwenn dat repons la. PDF sa a se yon egzanp — se pa ka ou a.',
    sections: [
      section(
        'What this paper is',
        'Kisa papye sa a ye',
        [
          'A summons is the court telling someone they have been sued. Ignoring the date is its own problem. An answer is a filing. A phone call to the collector is not an answer. A collection letter last month and a summons this month are different objects.',
          'This page is a teaching example. It is not a live case and it is not legal advice. If a real summons arrived, you need the real caption and a professional — not this PDF pretending to be the court.',
        ],
        [
          'Yon summons se tribinal la k ap di yon moun yo pote l nan tribinal. Inyore dat la se yon pwoblem apa. Yon apel telefon se pa yon answer.',
          'Paj sa a se yon egzanp. Se pa yon ka vivan. Se pa konseye legal.',
        ],
        {
          table: {
            columns: ['Word on page 1', 'Meaning'],
            rows: [
              ['summons', 'Court paper that starts the clock'],
              ['complaint', 'What they say you did / owe'],
              ['caption', 'Court, parties, case number'],
              ['plaintiff / defendant', 'Who sued / who is named'],
              ['answer date', 'The plot. Missing it can become a default'],
            ],
          },
        },
      ),
    ],
    glossary: [
      { en: 'summons', ht: 'papye tribinal' },
      { en: 'caption', ht: 'tit tribinal: non, nimewo dosye' },
      { en: 'default', ht: 'tribinal deside san ou reponn' },
    ],
    ctaPath: '/services/debt-legal',
    captionEn: `A summons is court paper with a clock. It is not a collection email in nicer font. ${C.vary}`,
    captionHt: `Yon summons se papye tribinal. Li gen yon rele. ${C.varyHt}`,
    emailSubjectEn: 'A summons is not a collection email in nicer font',
    emailSubjectHt: 'Yon summons se pa yon imel koleksyon',
    emailLedeEn: 'This is a sample so you can recognize the real one. If a real one arrived, the answer date is the plot.',
    emailLedeHt: 'Sa a se yon egzanp pou w rekonet vre a. Si yon vre rive, dat repons la se istwa a.',
    internal: true,
  }),
  spec({
    id: 'foreclosure',
    ordinal: '14',
    room: 'debt',
    format: 'one-sheet',
    architecture: 'foreclosure-notice',
    accent: 'rose',
    pageCount: 1,
    title: 'The county does not take good intentions',
    titleHt: 'Konte a pa pran bon entansyon',
    hookEn:
      'A foreclosure notice is a clock on a house. Equifax cannot pause a sale. The county does not accept good intentions as certified mail.',
    hookHt: 'Yon avi sezi kay se yon rele sou yon kay. Equifax pa ka kanpe yon vant.',
    purpose: 'Bureau letters and foreclosure clocks are different desks. Read the notice that arrived.',
    purposeHt: 'Let biwo ak rele sezi kay se biwo diferan. Li avi ki rive a.',
    whoFor: 'For anyone who opened a notice about the house and thought a dispute letter might pause it.',
    whoForHt: 'Pou moun ki ouvri yon avi sou kay la epi ki panse yon let diskisyon ka kanpe l.',
    lede: 'Notice of default, sale date, and reinstatement are English words with calendars.',
    ledeHt: 'Notice of default, dat vant, ak reinstatement se mo angle ki gen kalandriye.',
    actionEn: 'Find the sale date on the page. Keep every envelope. Book a session the same week.',
    actionHt: 'Jwenn dat vant lan sou paj la. Kenbe tout anvlop. Rezève yon sesyon nan menm semèn nan.',
    sections: [
      section(
        'This clock is not the bureau',
        'Rele sa a se pa biwo a',
        [
          'A dispute to Equifax does not pause a sale. Loss-mitigation packets have their own clocks. Incomplete packets stall people, not the sale. Mortgage servicer and investor are not always the same shop. This is not legal advice. If counsel is needed, say so early.',
        ],
        ['Let biwo pa kanpe vant lan. Kenbe tout anvlop. Dat vant yo pa pran swen let la te kache anba katalog.'],
        {
          form: [
            { labelEn: 'Property line as printed', labelHt: 'Liy kay jan yo ekri l' },
            { labelEn: 'Sale or default date on the notice', labelHt: 'Dat sou avi a' },
            { labelEn: 'Who sent it', labelHt: 'Kiyes ki voye l' },
          ],
        },
      ),
    ],
    glossary: [
      { en: 'notice of default', ht: 'avi defo' },
      { en: 'sale date', ht: 'dat vant' },
    ],
    ctaPath: '/services/debt-legal',
    captionEn: `A foreclosure notice is a clock on a house. Equifax cannot pause a sale. ${C.vary}`,
    captionHt: `Yon avi sezi kay se yon rele sou yon kay. ${C.varyHt}`,
    emailSubjectEn: 'Equifax cannot pause a sale',
    emailSubjectHt: 'Equifax pa ka kanpe yon vant',
    emailLedeEn: 'Find the sale date on the notice. Keep every envelope. Book a session the same week.',
    emailLedeHt: 'Jwenn dat vant lan. Kenbe tout anvlop. Rezève yon sesyon nan menm semèn nan.',
    internal: true,
  }),
  spec({
    id: 'repossession',
    ordinal: '15',
    room: 'debt',
    format: 'one-sheet',
    architecture: 'repo-notice',
    accent: 'violet',
    pageCount: 1,
    title: 'The VIN does not wait for Sunday',
    titleHt: 'VIN nan pa tann dimanch',
    hookEn: 'Auto and insurance clocks are short. “They have not picked it up” is not months. The VIN does not RSVP to family meeting night.',
    hookHt: 'Atik oto ak asirans souvan gen yon fenet kout. VIN nan pa konfime pou reyinyon fanmi.',
    purpose: 'Notices, insurance lapses, and deficiency balances have their own English clocks.',
    purposeHt: 'Avi, asirans ki ekspire, ak balans deficiency gen pwop rele angle yo.',
    whoFor: 'For anyone holding a car or insurance notice and hoping Florida time applies.',
    whoForHt: 'Pou moun ki kenbe yon avi oto oswa asirans.',
    lede: 'A car notice is not shy. It assumes you check the mailbox more than the group chat.',
    ledeHt: 'Yon avi oto pa timid. Li sipoze ou tcheke bwat la plis pase gwoup chat la.',
    actionEn: 'Photograph every page. Write the VIN. Do not wait for the next paycheck to read a sale notice.',
    actionHt: 'Foto chak paj. Ekri VIN nan. Pa tann pwochèn pèyman pou li yon avi vant.',
    sections: [
      section(
        'Short windows',
        'Fenet kout',
        [
          'Right to cure and redemption are phrases with calendars, not moods. A deficiency after sale can still hunt the file. Insurance lapses can trigger force-placed policies and new numbers. “I think it said Friday” is not a date.',
        ],
        ['Right to cure se yon kalandriye. Yon deficiency apre vant ka toujou chase dosye a. Foto chak paj.'],
        {
          form: [
            { labelEn: 'VIN as printed', labelHt: 'VIN jan yo ekri l' },
            { labelEn: 'Deadline on the notice', labelHt: 'Dat limit sou avi a' },
            { labelEn: 'Insurance cancellation page kept? yes / no', labelHt: 'Paj anilasyon asirans?' },
          ],
        },
      ),
    ],
    glossary: [
      { en: 'VIN', ht: 'nimewo machin nan' },
      { en: 'deficiency', ht: 'sa ki rete apre vant' },
    ],
    ctaPath: '/services/debt-legal',
    captionEn: `The VIN does not wait for Sunday. Photograph the notice. ${C.vary}`,
    captionHt: `VIN nan pa tann dimanch. Foto avi a. ${C.varyHt}`,
    emailSubjectEn: 'The VIN does not RSVP to your weekend',
    emailSubjectHt: 'VIN nan pa konfime pou wikenn ou',
    emailLedeEn: 'Photograph every page. Write the VIN. Auto clocks are short.',
    emailLedeHt: 'Foto chak paj. Ekri VIN nan. Relè oto yo kout.',
    internal: true,
  }),
  spec({
    id: 'bankruptcy',
    ordinal: '16',
    room: 'debt',
    format: 'one-sheet',
    architecture: 'bankruptcy-file',
    accent: 'sky',
    pageCount: 1,
    title: 'Not a bureau delete button',
    titleHt: 'Se pa yon bouton efase',
    hookEn: 'Bankruptcy is a court chapter, not a bureau delete button. The case and the file are two rooms. Chapter numbers are not hotel floors.',
    hookHt: 'Bankruptcy se yon chapit tribinal, se pa yon bouton biwo. Dosye a ak ka a se de chanm.',
    purpose: 'A discharged debt can still print until the bureaus catch the chapter.',
    purposeHt: 'Yon det discharged ka toujou ekri jiskaske biwo yo pran chapit la.',
    whoFor: 'For anyone who thought filing erased the gossip overnight.',
    whoForHt: 'Pou moun ki te panse depo a efase tripotay la lannwit.',
    lede: 'We read the line. We do not file a case. We will not role-play the trustee.',
    ledeHt: 'Nou li liy la. Nou pa depoze yon ka. Nou p ap jwe wol trustee a.',
    actionEn: 'Keep the discharge and the docket. Read what the file still prints.',
    actionHt: 'Kenbe discharge a ak docket la. Li sa dosye a toujou ekri.',
    sections: [
      section(
        'Two rooms',
        'De chanm',
        [
          '7 and 13 are different plots. Do not mix the homework. Reporting after a case follows its own English rules. Dates and case numbers matter. Rebuilding after a chapter is a new story. Do not chase a promised score. Screenshots of a score app are not the case.',
        ],
        ['7 ak 13 se istwa diferan. Rapo apre yon ka swiv pwop reg angle li. Foto yon app not se pa ka a.'],
        {
          table: {
            columns: ['Room', 'What to keep'],
            rows: [
              ['The case', 'Discharge, docket, chapter 7 or 13'],
              ['The file', 'What still prints on three bureaus'],
            ],
          },
        },
      ),
    ],
    glossary: [
      { en: 'chapter 7 / 13', ht: 'chapit tribinal' },
      { en: 'discharge', ht: 'papye ki di ka a fini' },
    ],
    ctaPath: '/services/debt-legal',
    captionEn: `Bankruptcy is a court chapter, not a bureau delete button. ${C.vary}`,
    captionHt: `Bankruptcy se yon chapit tribinal, se pa yon bouton efase. ${C.varyHt}`,
    emailSubjectEn: 'A chapter on the file is not a delete button',
    emailSubjectHt: 'Yon chapit sou dosye a se pa yon bouton efase',
    emailLedeEn: 'Keep the case papers. Read what the file still prints. Two rooms.',
    emailLedeHt: 'Kenbe papye ka a. Li sa dosye a toujou ekri. De chanm.',
    internal: true,
  }),
  spec({
    id: 'tradelines',
    ordinal: '17',
    room: 'service',
    format: 'one-sheet',
    architecture: 'tradeline-stack',
    accent: 'violet',
    pageCount: 1,
    title: 'A guest chair is not a house',
    titleHt: 'Yon chez envite se pa yon kay',
    hookEn:
      'A tradeline is a line on a file, not a magic stamp. Sitting as an authorized user is someone else’s family plan. Lenders can see if the line appeared last Tuesday.',
    hookHt: 'Yon tradeline se yon liy sou yon dosye, se pa yon magi. Authorized user se istwa yon lot moun.',
    purpose: 'Primary versus authorized user is not a fashion label. Timing, utilization, and whose name is primary all move.',
    purposeHt: 'Primary kont authorized user se pa yon etikèt mod. Tan, itilizasyon, ak non prensipal la tout deplase.',
    whoFor: 'For anyone offered a “line” as if it were a lottery ticket.',
    whoForHt: 'Pou moun yo ofri yon “liy” tankou yon tike lotri.',
    lede: 'If someone sells you a number, they are selling a mood.',
    ledeHt: 'Si yon moun vann ou yon nimewo, yo ap vann yon atitid.',
    actionEn: 'Name primary vs authorized user. Your own on-time revolving still has to exist.',
    actionHt: 'Nonmen primary kont authorized user. Pwop revolving ale ou a toujou dwe egziste.',
    sections: [
      section(
        'Read the household fine print',
        'Li ti let kay la',
        [
          'A high-limit card with high use can arrive as a loud percentage, not a trophy. Their late payment can visit you. Your own on-time revolving still has to exist. A guest chair is not a house. No promised score.',
        ],
        ['Yon kat gwo limit ak gwo itilizasyon ka rive kòm yon pousantaj fo, pa yon twofe. Risk gen ladan lavni moun prensipal la.'],
        {
          table: {
            columns: ['Word', 'What it means'],
            rows: [
              ['tradeline', 'A line on a file. Timing matters.'],
              ['authorized user', 'Someone else’s history in your guest chair'],
              ['primary', 'Whose plot you borrowed'],
              ['seasoning', 'Whether the line looks like last Tuesday'],
            ],
          },
        },
      ),
    ],
    glossary: [
      { en: 'tradeline', ht: 'liy sou dosye a' },
      { en: 'authorized user', ht: 'envite sou kat yon lot moun' },
    ],
    ctaPath: '/services/personal-credit-building',
    captionEn: `A tradeline is not a magic stamp. A guest chair is not a house. ${C.vary}`,
    captionHt: `Yon tradeline se pa yon magi. Yon chez envite se pa yon kay. ${C.varyHt}`,
    emailSubjectEn: 'A guest chair is not a house',
    emailSubjectHt: 'Yon chez envite se pa yon kay',
    emailLedeEn: 'Understand the line, the timing, and the risk. No promised score.',
    emailLedeHt: 'Konprann liy la, tan an, ak risk la. Pa gen not yo pwomet.',
    internal: true,
  }),
  spec({
    id: 'privacy',
    ordinal: '18',
    room: 'service',
    format: 'one-sheet',
    architecture: 'privacy-lock',
    accent: 'sky',
    pageCount: 1,
    title: 'A deadbolt is not a paint job',
    titleHt: 'Yon sere-bar se pa pentire',
    hookEn: 'A freeze is a lock on new accounts. It does not make collections vanish. It does not repaint the living room.',
    hookHt: 'Yon freeze kredi se yon kadna sou nouvo kont. Li pa fe koleksyon yo disparèt. Li pa pentire salon an.',
    purpose: 'You freeze each bureau separately. They do not share a group chat. A fraud alert is not a freeze.',
    purposeHt: 'Ou freeze chak biwo apa. Yon alèt fwod se pa menm ak yon freeze.',
    whoFor: 'For anyone who thinks freezing deletes the gossip they already have.',
    whoForHt: 'Pou moun ki panse freeze efase tripotay ki deja la.',
    lede: 'AnnualCreditReport.com is the federal door. A score app is a gift shop.',
    ledeHt: 'AnnualCreditReport.com se pot federal la. Yon app not se yon boutik kado.',
    actionEn: 'Freeze each bureau. Write the PINs where a Tuesday can find them. Unlock only when you are the one applying.',
    actionHt: 'Freeze chak biwo. Ekri PIN yo kote yon madi ka jwenn yo. Debloke selman le se ou k ap aplike.',
    sections: [
      section(
        'Lock, then findings',
        'Kadna, apre sa jwenn',
        [
          'Identity theft and a messy file are cousins. Treat the lock and the findings as two jobs. Thaw before you apply. Lenders cannot applaud a locked door. PINs get lost in drawers.',
        ],
        ['Ou freeze pou nouvo kont. Ou tounen sou jwenn yo apre. Debloke anvan w aplike.'],
        {
          form: [
            { labelEn: 'Equifax PIN', labelHt: 'PIN Equifax' },
            { labelEn: 'Experian PIN', labelHt: 'PIN Experian' },
            { labelEn: 'TransUnion PIN', labelHt: 'PIN TransUnion' },
          ],
        },
      ),
    ],
    glossary: [
      { en: 'freeze', ht: 'kadna sou nouvo kont' },
      { en: 'PIN', ht: 'kod pou debloke' },
    ],
    ctaPath: HAITIAN_DESK_LIVE_PATH,
    captionEn: `A freeze is a deadbolt. It does not repaint the living room. ${C.vary}`,
    captionHt: `Yon freeze se yon sere-bar. Li pa pentire salon an. ${C.varyHt}`,
    emailSubjectEn: 'A freeze does not make collections vanish',
    emailSubjectHt: 'Yon freeze pa fe koleksyon yo disparèt',
    emailLedeEn: 'Freeze each bureau. Write the PINs. Then come back to the findings.',
    emailLedeHt: 'Freeze chak biwo. Ekri PIN yo. Apre sa tounen sou jwenn yo.',
    internal: true,
  }),
  spec({
    id: 'bundles',
    ordinal: '19',
    room: 'service',
    format: 'one-sheet',
    architecture: 'bundle-band',
    accent: 'rose',
    pageCount: 1,
    title: 'Two rooms, not a smoothie',
    titleHt: 'De chanm, se pa yon smoothie',
    hookEn: 'Restore plus debt is two rooms with a door — not one letter that fixes the file and the collector. A bundle is a playlist, not a blender.',
    hookHt: 'Restore plis det se de chanm ak yon pot nan mitan — se pa yon smoothie.',
    purpose: 'Bureau findings and collector clocks can run in the same month. They still need different English papers.',
    purposeHt: 'Jwenn biwo ak rele kolekte ka kouri nan menm mwa. Yo toujou bezwen papye angle diferan.',
    whoFor: 'For anyone hoping one letter covers the screen and the envelope.',
    whoForHt: 'Pou moun ki espere yon sel let kouvri ekran an ak anvlop la.',
    lede: 'Keep the songs in order. Court paper goes first if it is in the stack.',
    ledeHt: 'Yon bundle se yon playlist. Si papye tribinal nan pil la, chanm sa a ale anvan.',
    actionEn: 'If court paper is in the stack, that room first. Otherwise pick the screen or the envelope — one door today.',
    actionHt: 'Si papye tribinal nan pil la, chanm sa a anvan. Sinon chwazi ekran an oswa anvlop la.',
    sections: [
      section(
        'Walk through one door',
        'Pase yon pot',
        [
          'Name the finding on the bureau first if the screen is wrong. Ask the collector for proof if the envelope is a demand. Do not pay from panic on day one of both jobs. Two rooms, still one chair.',
        ],
        ['Nonmen jwenn nan sou biwo a si ekran an mal. Mande kolekte a prev si anvlop la se yon demann. Yon pot jodi a.'],
      ),
    ],
    glossary: [
      { en: 'restore', ht: 'fè yo korije dosye a' },
      { en: 'validation', ht: 'mande prev' },
    ],
    ctaPath: '/services',
    captionEn: `Two rooms with a door. Not a smoothie. One door today. ${C.vary}`,
    captionHt: `De chanm. Se pa yon smoothie. Yon pot jodi a. ${C.varyHt}`,
    emailSubjectEn: 'Two rooms, not a smoothie',
    emailSubjectHt: 'De chanm, se pa yon smoothie',
    emailLedeEn: 'The screen and the envelope are different English papers. Walk through one door today.',
    emailLedeHt: 'Ekran an ak anvlop la se papye diferan. Pase yon pot jodi a.',
    internal: true,
  }),
  spec({
    id: 'chexsystems',
    ordinal: '20',
    room: 'service',
    format: 'one-sheet',
    architecture: 'chex-stamp',
    accent: 'sky',
    pageCount: 1,
    title: 'Dressed for Sunday. Remembered on Tuesday.',
    titleHt: 'Abiye pou dimanch. Yo sonje w madi.',
    hookEn:
      'ChexSystems is not Equifax. Your credit score can look fine while a bank still remembers a bounced chapter. That is why a checking account can say no when the score app is smiling.',
    hookHt: 'ChexSystems se pa Equifax. Not kredi w ka abiye pou dimanch pandan bank la toujou sonje madi.',
    purpose: 'Banks may look at a different report. Cleanup there is a different English desk.',
    purposeHt: 'Bank yo ka gade yon lot rapo. Netwayaj la se yon lot biwo angle.',
    whoFor: 'For anyone denied a checking account while the score app looked kind.',
    whoForHt: 'Pou moun bank refize yon kont chek pandan app not la te souri.',
    lede: 'Overdrafts and unpaid account closures can live here, not on Experian.',
    ledeHt: 'Overdraft ak kont yo femen san peye ka viv isit la, pa sou Experian.',
    actionEn: 'Keep the denial letter. It names the report. Ask which report the bank used.',
    actionHt: 'Kenbe let refi a. Li nonmen rapo a. Mande ki rapo bank la itilize.',
    sections: [
      section(
        'The wrong cousin',
        'Move kouzen an',
        [
          'Ask which report the bank is using before you argue with the wrong cousin. A second-chance checking product is a product, not a moral lecture. IDs and addresses must match the bank’s story too. This is not a FICO. Do not treat it like one.',
        ],
        ['Mande ki rapo bank la ap itilize anvan w diskite ak move kouzen an. Sa a se pa yon FICO.'],
        {
          table: {
            columns: ['Report', 'What it remembers'],
            rows: [
              ['ChexSystems', 'Banking chapters — overdrafts, unpaid closures'],
              ['Equifax / Experian / TransUnion', 'Credit file gossip — cards, collections, loans'],
            ],
          },
        },
      ),
    ],
    glossary: [
      { en: 'ChexSystems', ht: 'rapo bank' },
      { en: 'FICO', ht: 'not kredi' },
    ],
    ctaPath: HAITIAN_DESK_LIVE_PATH,
    captionEn: `ChexSystems is not Equifax. The score app can smile while the bank remembers Tuesday. ${C.vary}`,
    captionHt: `ChexSystems se pa Equifax. Not la ka souri. Bank la sonje madi. ${C.varyHt}`,
    emailSubjectEn: 'Your score can smile while the bank remembers Tuesday',
    emailSubjectHt: 'Not la ka souri. Bank la sonje madi.',
    emailLedeEn: 'Keep the denial letter. It names the report. Do not argue with Equifax about a Chex story.',
    emailLedeHt: 'Kenbe let refi a. Li nonmen rapo a. Pa diskite ak Equifax sou yon istwa Chex.',
    internal: true,
  }),
  spec({
    id: 'maintenance',
    ordinal: '21',
    room: 'service',
    format: 'one-sheet',
    architecture: 'maintenance-calendar',
    accent: 'emerald',
    pageCount: 1,
    title: 'The garden after the win',
    titleHt: 'Jaden an apre viktwa a',
    hookEn: 'After the letters, the file can drift. Furnishers re-report. A credit file is a garden. Nobody applauds watering until they do.',
    hookHt: 'Apre yon wonn let, dosye a ka derive. Yon dosye kredi se yon jaden.',
    purpose: 'Holding the gain is a calendar, not a victory lap. New cards can shout. Utilization can wander.',
    purposeHt: 'Kenbe sa ki kle se yon kalandriye, se pa yon tour viktwa.',
    whoFor: 'For anyone who just had a clean round and wants to keep it.',
    whoForHt: 'Pou moun ki fek gen yon wonn pwop epi ki vle kenbe l.',
    lede: 'Do not wait for a denial letter to be your alarm.',
    ledeHt: 'Pa tann yon let refi kòm alam ou.',
    actionEn: 'Put the next three-bureau pull on a calendar. Do not open a stack of cards to celebrate.',
    actionHt: 'Mete pwochèn pran twa biwo sou kalandriye a. Pa ouvri yon pil kat pou selebre.',
    sections: [
      section(
        'Watering is the product',
        'Wouze se pwodui a',
        [
          'Watch card use after the win. Quiet percentages stay quiet on purpose. Keep the screenshots from the round that worked. Alerts exist — use them like smoke detectors, not like jewelry.',
        ],
        ['Gade itilizasyon kat apre viktwa a. Kenbe foto ekran wonn ki te mache a. Alèt yo se detekte lafimen.'],
        {
          form: [
            { labelEn: 'Next Equifax pull', labelHt: 'Pwochèn Equifax' },
            { labelEn: 'Next Experian pull', labelHt: 'Pwochèn Experian' },
            { labelEn: 'Next TransUnion pull', labelHt: 'Pwochèn TransUnion' },
          ],
        },
      ),
    ],
    glossary: [
      { en: 'utilization', ht: 'konbyen ou itilize' },
      { en: 'furnisher', ht: 'moun k ap rapote sou dosye a' },
    ],
    ctaPath: '/services/personal-credit-restore',
    captionEn: `A credit file is a garden. Put the next pull on the calendar. ${C.vary}`,
    captionHt: `Yon dosye kredi se yon jaden. Mete pwochèn pran an sou kalandriye a. ${C.varyHt}`,
    emailSubjectEn: 'The file can drift after the win',
    emailSubjectHt: 'Dosye a ka derive apre viktwa a',
    emailLedeEn: 'Put the next three-bureau pull on a calendar. Do not celebrate with new cards.',
    emailLedeHt: 'Mete pwochèn pran an sou kalandriye a. Pa selebre ak nouvo kat.',
    internal: true,
  }),
  spec({
    id: 'business-ladder',
    ordinal: '22',
    room: 'service',
    format: 'one-sheet',
    architecture: 'vendor-ladder',
    accent: 'emerald',
    pageCount: 1,
    title: 'Reporters, not souvenirs',
    titleHt: 'Moun k ap rapote, se pa souvni',
    hookEn: 'Five store cards in one afternoon is sport. A ladder is behavior: vendors that report, then a company ask.',
    hookHt: 'Senk kat magazen nan yon apremidi se plezi. Yon nechel se konpòtman: machann ki rapote, apre sa yon demann.',
    purpose: 'Net-30 is a behavior, not a personality brand. Tier vendors. Do not collect souvenirs.',
    purposeHt: 'Net-30 se yon konpòtman. Mete machann yo sou yon nechel.',
    whoFor: 'For owners ready to ask on the company file without a shopping spree.',
    whoForHt: 'Pou pwopriyetè ki pare pou mande sou dosye konpayi an.',
    lede: 'A vendor that does not report is a nice invoice, not a tradeline.',
    ledeHt: 'Yon machann ki pa rapote se yon bodwo janti.',
    actionEn: 'Name one next vendor that reports. Then a company ask — no dollar list on this paper.',
    actionHt: 'Nonmen yon pwochen machann ki rapote. Apre sa, yon demann sou EIN.',
    sections: [
      section(
        'Climb on purpose',
        'Monte espre',
        [
          'Entity and EIN first. Then vendors that actually report. Then a company ask — not the owner Social Security number. Charm is not approval. If you need funding, that depends on whether they approve you.',
        ],
        ['Dabo konpayi an ak EIN. Apre sa machann ki vreman rapote. Apre sa yon demann sou EIN. Si w bezwen lajen, sa depann si yo apwouve w.'],
      ),
    ],
    glossary: [
      { en: 'vendor that reports', ht: 'machann ki rapote sou dosye konpayi' },
      { en: 'EIN', ht: 'nimewo taks konpayi' },
    ],
    ctaPath: '/services/business-credit',
    captionEn: `A vendor that does not report is a souvenir. Climb reporters, then ask. ${C.vary}`,
    captionHt: `Yon machann ki pa rapote se yon souvni. ${C.varyHt}`,
    emailSubjectEn: 'Five store cards in one afternoon is sport',
    emailSubjectHt: 'Senk kat magazen nan yon apremidi se plezi',
    emailLedeEn: 'One next vendor that reports. Then a company ask on the EIN.',
    emailLedeHt: 'Yon pwochen machann ki rapote. Apre sa yon demann sou EIN.',
    internal: true,
  }),
  spec({
    id: 'book-session',
    ordinal: '23',
    room: 'outreach',
    format: 'one-sheet',
    architecture: 'appointment-card',
    accent: 'emerald',
    pageCount: 1,
    title: 'Bring the envelope',
    titleHt: 'Pote anvlop la',
    hookEn: 'A session is a sitting, not a TED talk. We do not need your whole life story. We need the envelope.',
    hookHt: 'Yon sesyon se yon chita, se pa yon konferans. Nou pa bezwen tout istwa lavi w. Nou bezwen anvlop la.',
    purpose: 'You understand enough to book when you can point at the English sentence that arrived — the letter in the mailbox, or the bureau screen.',
    purposeHt: 'Ou konprann ase lè ou ka montre fraz angle ki rive a.',
    whoFor: 'For anyone waiting until they “understand everything” before they book.',
    whoForHt: 'Pou moun k ap tann jiskaske yo konprann tout bagay.',
    lede: 'Bring the paper itself, or screenshots of the bureau website with the date visible.',
    ledeHt: 'Pote papye a, oswa foto sitwèb biwo a ak dat la vizib.',
    actionEn: 'Book a sitting. Write the date, the time, who is coming, and which paper you are bringing.',
    actionHt: 'Rezève yon chita. Ekri dat, lè, kiyès k ap vini, ak ki papye.',
    sections: [
      section(
        'What to bring',
        'Sa pou pote',
        [
          'Say whether it is a bureau page, a collector letter, or court paper. One desk per sitting unless the stack is court-first. Ask questions. We will not mock the words you are learning. If you need a number, ask. We do not print it on this card.',
        ],
        ['Di si se yon paj biwo, yon let kolekte, oswa papye tribinal. Poze kesyon. Si w bezwen yon nimewo, mande.'],
        {
          form: [
            { labelEn: 'Date', labelHt: 'Dat' },
            { labelEn: 'Time', labelHt: 'Le' },
            { labelEn: 'Who is coming', labelHt: 'Kiyes k ap vini' },
            { labelEn: 'Paper you are bringing', labelHt: 'Papye w ap pote' },
          ],
        },
      ),
    ],
    glossary: [
      { en: 'session', ht: 'yon chita' },
      { en: 'letter', ht: 'let' },
    ],
    ctaPath: '/consultation',
    captionEn: `A session is a sitting. Bring the envelope. ${C.vary}`,
    captionHt: `Yon sesyon se yon chita. Pote anvlop la. ${C.varyHt}`,
    emailSubjectEn: 'We need the envelope, not the whole life story',
    emailSubjectHt: 'Nou bezwen anvlop la, se pa tout istwa lavi w',
    emailLedeEn: 'Book a sitting. Bring the letter that arrived, or screenshots with dates.',
    emailLedeHt: 'Rezève yon chita. Pote let ki rive a, oswa foto ak dat.',
    internal: true,
  }),
  spec({
    id: 'specialist-recruit',
    ordinal: '24',
    room: 'roles',
    format: 'one-sheet',
    architecture: 'cs-recruit-playbook',
    accent: 'violet',
    pageCount: 1,
    title: 'One household. One page. Not thirty inboxes.',
    titleHt: 'Yon kay. Yon paj. Pa trant bwat.',
    hookEn:
      'A Credit Specialist sits with one Haitian household and sends one page that matches what arrived. Emailing the same PDF to thirty people is not hospitality. It is litter.',
    hookHt: 'Yon Credit Specialist chita ak yon kay epi voye yon paj ki matche sa ki rive. Voye menm PDF la bay trant moun se fatra.',
    purpose:
      'You are considering this work. Your week is one family, one English sentence, one next step — not a price list on Facebook.',
    purposeHt: 'Ou ap panse fè travay sa a. Semèn nan se yon fanmi, yon fraz angle, yon pwochen etap — se pa yon lis pri sou Facebook.',
    whoFor: 'For someone considering becoming a Credit Specialist for Haitian community.',
    whoForHt: 'Pou moun k ap panse vin Credit Specialist pou Haitian community.',
    lede: 'If the PDF is only a header, you sent a hat without a person inside it.',
    ledeHt: 'Si PDF la se sèlman yon tit, ou voye yon chapo san moun andedan.',
    actionEn: 'Open Haitian community. Learn one page well. Sit with one household this week.',
    actionHt: 'Ouvri Haitian community. Aprann yon paj byen. Chita ak yon kay semèn sa a.',
    sections: [
      section(
        'What the week actually looks like',
        'Kouman semèn nan sanble vreman',
        [
          'Pick restore, debt, building, or a city flyer — not all four in one sitting. The caption should teach one fact most people do not know. It should not list prices. The person at the table holds their phone. You point at the sentence. If they ask what it costs, answer in conversation, not on the flyer. Witty is allowed. Cruel is not.',
        ],
        [
          'Chwazi restore, dèt, building, oswa yon feye vil — pa kat nan menm chita. Caption nan dwe anseye yon bagay pifò moun pa konnen. Pa lis pri. Moun nan tab la kenbe telefòn yo. Ou montre fraz la. Si yo mande pri a, reponn nan konvèsasyon.',
        ],
      ),
    ],
    glossary: [
      { en: 'Credit Specialist', ht: 'espesyalis kredi' },
      { en: 'partner', ht: 'patne' },
    ],
    ctaPath: '/haitian',
    captionEn: `One piece. One person. A blast to thirty inboxes is litter. ${C.vary}`,
    captionHt: `Yon feye. Yon moun. Yon blast se fatra. ${C.varyHt}`,
    emailSubjectEn: 'A blast to thirty inboxes is litter',
    emailSubjectHt: 'Yon blast nan trant bwat se fatra',
    emailLedeEn: 'A Credit Specialist sits with one household and sends one page that matches what arrived.',
    emailLedeHt: 'Yon Credit Specialist chita ak yon kay epi voye yon paj ki matche sa ki rive.',
    internal: true,
  }),
  spec({
    id: 'specialist-field-pack',
    ordinal: '25',
    room: 'roles',
    format: 'one-sheet',
    architecture: 'cs-field-pack',
    accent: 'sky',
    pageCount: 1,
    title: 'Look at what is on their table',
    titleHt: 'Gade sa ki sou tab yo',
    hookEn:
      'This week you send one page that matches what is sitting in front of them — not the whole closet. If an envelope arrived, send the letter page. If Sunday is a church table, send the handbill. If they live in Miami, send the Miami flyer to their email, not to “Miami.”',
    hookHt: 'Matche sa ki sou tab la. Yon paj. Se pa tout klozèt la. Si yon anvlòp rive, voye paj lèt la. Si se dimanch legliz, voye feye a.',
    purpose:
      'You already know this family. Send the page that names the paper they are holding. Type a person’s email. A city is what the flyer is about — not who receives it.',
    purposeHt: 'Voye paj ki nonmen papye yo kenbe. Tape imel yon moun. Yon vil se sijè feye a — se pa moun k ap resevwa l.',
    whoFor: 'For Credit Specialists sending one page this week.',
    whoForHt: 'Pou Credit Specialist k ap voye yon paj semèn sa a.',
    lede: 'One page per send. Their name in the To field. Never a city as the recipient.',
    ledeHt: 'Yon paj pou chak voye. Non yo nan To. Pa yon vil kòm destinataire.',
    actionEn: 'Pick the matching page. Type their email. Tell them the one fact they did not know.',
    actionHt: 'Chwazi paj ki matche. Tape imel yo. Di yo yon bagay yo pa t konnen.',
    sections: [
      section(
        'Three starters',
        'Twa kòmanse',
        [
          'A collector envelope on the table: send “What this letter says.” A church or community table: send “A rumor with a phone number.” A household in Miami or Brooklyn: that city’s flyer, still emailed to a person. Do not invent a price. Do not send thirty copies because the week felt slow.',
        ],
        ['Anvlòp kolektè: Kisa lèt sa a di. Dimanch: feye tripotay ki gen nimewo. Vil: feye vil la, toujou bay yon moun.'],
        {
          table: {
            columns: ['What they are holding', 'Page to send'],
            rows: [
              ['A collector envelope', 'What this letter says'],
              ['A church / community table', 'A rumor with a phone number'],
              ['A household in a city we cover', 'That city’s flyer — emailed to a person'],
            ],
          },
        },
      ),
    ],
    glossary: [{ en: 'one piece', ht: 'yon sel feye' }],
    ctaPath: '/haitian',
    captionEn: `Match the paper on the table. One piece. Not the catalog. ${C.vary}`,
    captionHt: `Matche papye sou tab la. Yon feye. ${C.varyHt}`,
    emailSubjectEn: 'Match the paper on the table — one piece',
    emailSubjectHt: 'Matche papye sou tab la — yon feye',
    emailLedeEn: 'This week: one matching page to one person. Tell them the fact they did not know. Do not post a price.',
    emailLedeHt: 'Semèn sa a: yon feye ki matche, yon moun. Anseye wow la.',
    internal: true,
  }),
  spec({
    id: 'affiliate-share',
    ordinal: '26',
    room: 'roles',
    format: 'one-sheet',
    architecture: 'affiliate-pass',
    accent: 'emerald',
    pageCount: 1,
    title: 'Share the fact they did not know',
    titleHt: 'Pataje verite yo pa t konnen',
    hookEn: 'People forward the fact they did not know. A dollar amount starts an argument. You are not a walking cash register.',
    hookHt: 'Moun yo voye verite yo pa t konnen. Yon montan komanse yon diskisyon. Ou se pa yon kes k ap mache.',
    purpose:
      'You already know someone who needs this. Forward the fact they did not know — paying often does not delete the headline, the letter is a clock — not a dollar amount that starts a fight.',
    purposeHt: 'Pataje verite yo pa t konnen. Se pa yon montan ki kòmanse yon diskisyon.',
    whoFor: 'For affiliates and referral partners sharing one page.',
    whoForHt: 'Pou afilye k ap pataje yon paj.',
    lede: 'You are the person who knew the collection letter was a clock, not a breakfast bill.',
    ledeHt: 'Ou se moun ki te konnen lèt koleksyon an se yon relè, se pa bòdwo manje maten.',
    actionEn: 'Share one page. Invite Pale Kreyòl when they are ready to talk. If they ask a number, then you may answer.',
    actionHt: 'Pataje yon paj. Envite Pale Kreyòl lè yo pare pou pale. Si yo mande yon nimewo, lè sa a ou ka reponn.',
    sections: [
      section(
        'How to share without becoming a coupon',
        'Kouman pou pataje san tounen koupon',
        [
          'One page per share. If they need Kreyòl, keep the English sentence on the paper and put the meaning beside it. No flags, food, or carnival as costume. Point at Haitian community or a city desk. Results vary. Not legal advice.',
        ],
        ['Yon paj pou chak pataj. Kenbe fraz angle a. Pa drapo, manje, oswa kanaval. Montre Haitian community.'],
      ),
    ],
    glossary: [{ en: 'partner', ht: 'patne' }],
    ctaPath: HAITIAN_DESK_LIVE_PATH,
    captionEn: `Share the fact they did not know. Not a coupon. ${C.vary}`,
    captionHt: `Pataje verite yo pa t konnen. Se pa yon koupon. ${C.varyHt}`,
    emailSubjectEn: 'Share the fact they did not know',
    emailSubjectHt: 'Pataje verite yo pa t konnen',
    emailLedeEn: 'Forward the insight, not a price. Invite Pale Kreyol when they are ready.',
    emailLedeHt: 'Pataje insight la, se pa yon pri. Envite Pale Kreyol.',
    internal: true,
  }),
  spec({
    id: 'admin-playbook',
    ordinal: '27',
    room: 'roles',
    format: 'one-sheet',
    architecture: 'admin-playbook',
    accent: 'sky',
    pageCount: 1,
    title: 'Send the page that matches what they are holding',
    titleHt: 'Voye paj ki matche sa yo kenbe',
    hookEn:
      'If two PDFs look like twins with different hats, neither is dressed. Look at what they are holding — a collector letter, court paper, a Sunday table — and send that page. Not the first tile in the grid.',
    hookHt: 'Si de PDF sanble marasa ak chapo diferan, okenn pa abiye. Gade sa yo kenbe. Voye paj sa a — se pa premye kaye nan gri a.',
    purpose:
      'You pick which Haitian page to download and email. One page. One person’s inbox. A city name is the topic of a flyer, never the To field.',
    purposeHt: 'Chwazi paj ki matche. Yon paj. Bwat yon moun. Yon vil se sijè, se pa To.',
    whoFor: 'For marketers picking which Haitian page to send.',
    whoForHt: 'Pou moun k ap chwazi ki paj pou voye.',
    lede: 'Each page is its own object. No price on the paper.',
    ledeHt: 'Chak paj se pwòp objè li. Pa gen pri sou papye a.',
    actionEn: 'Pick the matching page. Download it. Send it to a person’s email.',
    actionHt: 'Chwazi paj ki matche. Telechaje l. Voye l nan imel yon moun.',
    sections: [
      section(
        'What they are holding → which page',
        'Sa yo kenbe → ki paj',
        [
          'Chat can be warm. The page still has to teach. Fill the letter-size sheet. A header-only download is a failed download. Cities are flyer topics. The To field is always a person.',
        ],
        ['Ospitalite nan chat. Paj la toujou anseye. Ranpli paj lèt la. Vil yo se sijè. To se toujou yon moun.'],
        {
          table: {
            columns: ['If they are holding', 'Send'],
            rows: [
              ['A collector letter', 'What this letter says'],
              ['Court-looking paper', 'Sample summons'],
              ['A Sunday table', 'A rumor with a phone number'],
              ['A bureau screen', 'Your file is gossip'],
              ['A Miami / Brooklyn household', 'That local flyer — still to a person'],
            ],
          },
        },
      ),
    ],
    glossary: [{ en: 'closet', ht: 'plakad feye yo' }],
    ctaPath: '/haitian',
    captionEn: `Send the page that matches what they are holding. One person’s email. ${C.vary}`,
    captionHt: `Voye paj ki matche sa yo kenbe. Imel yon moun. ${C.varyHt}`,
    emailSubjectEn: 'Send the page that matches what they are holding',
    emailSubjectHt: 'Voye paj ki matche sa yo kenbe',
    emailLedeEn: 'Look at the paper in their hands. Send that page to a person. A city is a flyer topic, not an inbox.',
    emailLedeHt: 'Voye paj ki matche bay yon moun. Vil yo se sijè, se pa bwat.',
    internal: true,
  }),
];

function metroFlyer(
  id: string,
  ordinal: string,
  architecture: HaitianPieceArchitecture,
  accent: HaitianPieceAccent,
  title: string,
  titleHt: string,
  hookEn: string,
  hookHt: string,
  articleEn: string[],
  articleHt: string[],
  actionEn: string,
  actionHt: string,
  table: { columns: string[]; rows: string[][] },
  metroKey: string,
  path: string,
  emailSubjectEn: string,
  emailSubjectHt: string,
): HaitianPieceSpec {
  return spec({
    id,
    ordinal,
    room: 'metro',
    format: 'flyer',
    architecture,
    accent,
    pageCount: 1,
    title,
    titleHt,
    hookEn,
    hookHt,
    purpose: hookEn,
    purposeHt: hookHt,
    whoFor: hookEn,
    whoForHt: hookHt,
    lede: hookEn,
    ledeHt: hookHt,
    actionEn,
    actionHt,
    sections: [
      section('How the trick shows up here', 'Kouman trick la parèt isit la', articleEn, articleHt, { table }),
    ],
    glossary: [{ en: 'credit file', ht: 'dosye kredi' }],
    ctaPath: path,
    captionEn: `${hookEn} ${C.vary}`,
    captionHt: `${hookHt} ${C.varyHt}`,
    emailSubjectEn,
    emailSubjectHt,
    emailLedeEn: `${hookEn} ${actionEn}`,
    emailLedeHt: `${hookHt} ${actionHt}`,
    metroKey,
    internal: true,
  });
}

const METROS: HaitianPieceSpec[] = [
  metroFlyer(
    'metro-miami',
    '28',
    'metro-miami-ledger',
    'emerald',
    'The computer thinks you are hiding',
    'Ordinatè a panse ou kache',
    'A computer can decide you are three people — then a collector swears you are hiding. You were living a normal Miami life.',
    'Yon ordinatè ka deside ou se twa moun — epi yon kolekte swe ou kache. Ou t ap viv yon lavi nòmal Miami.',
    [
      'Haiti on the old forms, a cousin’s couch, a condo — the file treats that like a disguise. Furnishers that only know USPS habits get confused. Broward and Palm Beach are not “close enough” to Miami on a bureau page. This is not a service called address cleanup. It is why a loan says no and a collector will not stop.',
    ],
    [
      'Ayiti sou ansyen fom, yon chez kouzen, yon condo — dosye a trete sa tankou yon degize. Se poutet sa yon pre se di non.',
    ],
    'Pull all three bureaus. Circle every name and address the file invented. Do not pay a collector who has the wrong you.',
    'Pran twa biwo yo. Make chak non ak adres dosye a envante. Pa peye yon kolekte ki gen move ou.',
    {
      columns: ['What the file invented', 'Still you?'],
      rows: [
        ['Haiti / overseas line', 'yes / no / years ______'],
        ['Condo or HOA name as printed', 'yes / no / years ______'],
        ['Cousin or old couch address', 'yes / no / years ______'],
      ],
    },
    'miami',
    '/haitian/miami',
    'The computer decided you are three people',
    'Ordinatè a deside ou se twa moun',
  ),
  metroFlyer(
    'metro-brooklyn',
    '29',
    'metro-brooklyn-mailbox',
    'violet',
    'The mailbox still wins in court',
    'Bwat la toujou genyen nan tribinal',
    'The envelope date is evidence. A screenshot of a text is a rumor. Kings County collectors do not accept “I meant to open it after church.”',
    'Dat anvlop la se prev. Yon foto teks se tripotay. Kolekte Kings County pa aksepte “mwen te vle ouvri l apre legliz.”',
    [
      'Brooklyn mailboxes still win arguments. A 30-day validation window can start when the letter lands, not when you felt ready. Old addresses across boroughs still furnish. Do not pay from fear the same week. Argue with the paper, not a portal chat.',
    ],
    [
      'Bwat Brooklyn toujou genyen diskisyon. Yon fenet 30 jou ka komanse le let la rive. Pa peye paske w pe nan menm semèn nan.',
    ],
    'Keep the envelope. Write the day it arrived. Do not pay from fear this week.',
    'Kenbe anvlop la. Ekri jou li rive. Pa peye paske w pe semèn sa a.',
    {
      columns: ['Evidence', 'Write it'],
      rows: [
        ['Day the envelope arrived', '______ / ______ / ______'],
        ['Who is on the letterhead', '________________'],
        ['What the English line asks', '________________'],
      ],
    },
    'brooklyn',
    '/haitian/brooklyn',
    'The envelope date is evidence. A text is a rumor.',
    'Dat anvlop la se prev. Yon teks se tripotay.',
  ),
  metroFlyer(
    'metro-boston',
    '30',
    'metro-boston-campus',
    'sky',
    'The hospital and the college both sold your name',
    'Lopital ak lekòl tou de vann non ou',
    'The hospital and the college both sold your name. They are not the same debt. One dispute letter to both cousins is how both get confused.',
    'Lopital ak lekòl tou de vann non ou. Yo pa menm det. Yon sel let diskisyon bay tou de kouzen se jan yo konfonn.',
    [
      'Campus accounts and hospital billing are different English. Student loans and campus cards are not the same tradeline family. Hospital billing may have its own collector. Brockton and Randolph are not a rounding error on the address. Pull all three. Medical furnishing is uneven.',
    ],
    [
      'Kont lekòl ak bodwo lopital se angle diferan. Separe yo anvan premye wonn nan. Brockton ak Randolph se pa yon erè awondi.',
    ],
    'Split the stack into two piles — student vs hospital — before anyone writes.',
    'Separe pil la an de — lekòl ak lopital — anvan nenpot moun ekri.',
    {
      columns: ['Pile', 'Whose English'],
      rows: [
        ['Student / campus', '________________'],
        ['Hospital / medical', '________________'],
      ],
    },
    'boston',
    '/haitian/boston',
    'The hospital and the college both sold your name',
    'Lopital ak lekòl tou de vann non ou',
  ),
  metroFlyer(
    'metro-houston',
    '31',
    'metro-houston-cycle',
    'rose',
    'Payday Friday. Snapshot Wednesday. Panic Thursday.',
    'Pèyman vandredi. Foto mèkredi. Panik Jedi.',
    'The bureau takes your picture on statement day. You already paid. The percentage did not get the memo.',
    'Biwo a foto kat la jou deklarasyon. Ou deja peye. Pousantaj la pa resevwa memo a.',
    [
      'Energy-cycle paydays move utilization. Disputing utilization that is accurate wastes a round. On-time still matters when the percentage is loud. Do not close the card to hide a snapshot. Ask the issuer when they report. It is a date, not a vibe.',
    ],
    [
      'Pèyman sik enèji deplase itilizasyon. Diskite itilizasyon ki korek gaspiye yon wonn. Pa femen kat la pou kache yon foto.',
    ],
    'Write each card’s statement date. Do not close the card to hide a snapshot.',
    'Ekri dat deklarasyon chak kat. Pa femen kat la pou kache yon foto.',
    {
      columns: ['Card', 'Payday', 'Statement date'],
      rows: [
        ['____________', '____________', '______ / ______'],
        ['____________', '____________', '______ / ______'],
      ],
    },
    'houston',
    '/haitian/houston',
    'The bureau photographs statement day, not payday',
    'Biwo a foto jou deklarasyon, pa jou pèyman',
  ),
  metroFlyer(
    'metro-atlanta',
    '32',
    'metro-atlanta-moves',
    'violet',
    'Moving does not kill a collection',
    'Demenajman pa touye yon koleksyon',
    'The fourth buyer with a new logo is still shouting about the apartment you left years ago. The name that matters is the original creditor.',
    'Katriyèm achte ak yon nouvo logo toujou ap rele sou apatman ou te kite. Non ki konte se premye kredye a.',
    [
      'Collections follow moves. Buyer names change. Original creditor often does not. Address history across Georgia can look like three people. Do not pay four collectors for one original account. A move is not a legal eraser.',
    ],
    [
      'Koleksyon yo swiv demenajman. Non achte yo chanje. Premye kredye a souvan pa chanje. Pa peye kat kolekte pou yon sel kont.',
    ],
    'Match each collection to the original creditor. Do not pay four collectors for one account.',
    'Matche chak koleksyon ak premye kredye a. Pa peye kat kolekte pou yon sel kont.',
    {
      columns: ['Collection name now', 'Original creditor', 'Still yours?'],
      rows: [
        ['________________', '________________', 'yes / no'],
        ['________________', '________________', 'yes / no'],
      ],
    },
    'atlanta',
    '/haitian/atlanta',
    'Moving does not kill a collection',
    'Demenajman pa touye yon koleksyon',
  ),
  metroFlyer(
    'metro-washington',
    '33',
    'metro-dc-fan',
    'sky',
    'Three states looks like identity theft',
    'Twa eta sanble vòl idantite',
    'DC, Maryland, and Virginia can all print on one person. To you it is commuting. The Beltway is not a bureau.',
    'DC, Maryland, ak Virginia ka tout ekri sou yon sel moun. Pou ou se trajè. Beltway a se pa yon biwo.',
    [
      'Three-state stacks look like identity theft even when it is just the job. Jr / II / hyphenated names duplicate files. MD and VA spellings of the same street still count as two lines. Freeze if the stack looks like a stranger. Then sit with findings. Do not dispute accurate old addresses you actually used.',
    ],
    [
      'Pil twa eta sanble vòl idantite menm le se jis travay. Freeze si pil la sanble yon etranje. Apre sa chita ak jwenn yo.',
    ],
    'List DC / MD / VA as the file prints them. Freeze if it looks like a stranger.',
    'Lis DC / MD / VA jan dosye a ekri yo. Freeze si sa sanble yon etranje.',
    {
      columns: ['State', 'Address as the file prints it'],
      rows: [
        ['DC', '________________'],
        ['MD', '________________'],
        ['VA', '________________'],
      ],
    },
    'washington',
    '/haitian/washington',
    'Three states on one file looks like identity theft',
    'Twa eta sou yon dosye sanble vòl idantite',
  ),
  metroFlyer(
    'metro-chicago',
    '34',
    'metro-chicago-docket',
    'rose',
    'ComEd and a Visa are not one debt',
    'ComEd ak yon Visa se pa yon sel det',
    'City, utility, and medical sit next to bank cards like they went to the same party. They did not. They are not one “Chicago debt.”',
    'Atik vil, sèvis piblik, ak medikal chita bo kote kat bank. Yo pa yon sel “det Chicago.”',
    [
      'Municipal and utility furnishers use different English than banks. Medical in Illinois can look quiet until a collector buys it. Do not mix a city ticket with a Mastercard dispute. Keep the city notices. Portals forget. Paper remembers.',
    ],
    [
      'Furnisher vil ak sèvis piblik sèvi ak angle diferan pase bank. Pa melanje yon tike vil ak yon diskisyon Mastercard.',
    ],
    'Mark what you still recognize. Separate utility from revolving before anyone writes.',
    'Make sa w toujou rekonet. Separe sèvis piblik ak revolving anvan nenpot lèt.',
    {
      columns: ['Line', 'Room'],
      rows: [
        ['City / utility / medical', '________________'],
        ['Bank card / revolving', '________________'],
      ],
    },
    'chicago',
    '/haitian/chicago',
    'ComEd and a Visa are not one Chicago debt',
    'ComEd ak yon Visa se pa yon sel det',
  ),
  metroFlyer(
    'metro-philadelphia',
    '35',
    'metro-philly-age',
    'emerald',
    'Do not throw out the museum',
    'Pa jete mize a',
    'Your oldest good card is doing more work than a weekend of “credit repair.” Challenging a clean old account because you are bored is how people shrink their own garden.',
    'Pi ansyen bon kat ou a ap fe plis travay pase yon wikenn “credit repair.” Diskite yon kont pwop paske ou anwiye se jan moun redwi jaden yo.',
    [
      'Age on good lines is an asset. Too-old-to-stay is a finding. Healthy-old is a feature. Average age of accounts cares about the oldest revolving. Pennsylvania clutter is often old collections plus good cards. Split them. Do not close the oldest good card for sport.',
    ],
    [
      'Laj sou bon liy se yon byen. Twò granmoun pou rete se yon jwenn. Ansyen-an-sante se yon avantaj. Pa femen pi ansyen bon kat la pou plezi.',
    ],
    'Screenshot first. Challenge only what is wrong. Do not close the oldest good card.',
    'Foto anvan. Diskite selman sa ki mal. Pa femen pi ansyen bon kat la.',
    {
      columns: ['Line', 'Keep or challenge'],
      rows: [
        ['Oldest good revolving', 'keep — let it age'],
        ['Old collection that looks wrong', 'screenshot, then challenge'],
      ],
    },
    'philadelphia',
    '/haitian/philadelphia',
    'Your oldest good card is doing the real work',
    'Pi ansyen bon kat ou a ap fe travay la',
  ),
  metroFlyer(
    'metro-jacksonville',
    '36',
    'metro-jax-auto',
    'violet',
    'Florida mail is on statute time',
    'Lapòs Florid sou tan lwa',
    'Florida mail is not on island time. The VIN does not RSVP to your weekend. Insurance and auto items often carry a short clock.',
    'Lapòs Florid Nòdès pa sou tan zile. VIN nan pa konfime pou wikenn ou.',
    [
      'Force-placed insurance can invent a new number overnight. Repo clocks and bureau reporting are different rooms. Keep the insurance cancellation page. Do not wait for the next paycheck to read a sale notice. Photograph every bureau screen and every notice before you write.',
    ],
    [
      'Asirans force-placed ka envante yon nouvo nimewo lannwit. Relè repo ak rapo biwo se chanm diferan. Pa tann pèyman pou li yon avi vant.',
    ],
    'Photograph the notice and every bureau screen before you write. Write the VIN.',
    'Foto avi a ak chak ekran biwo anvan w ekri. Ekri VIN nan.',
    {
      columns: ['Clock', 'Date on the paper'],
      rows: [
        ['VIN', '________________'],
        ['Insurance / repo deadline', '______ / ______ / ______'],
      ],
    },
    'jacksonville',
    '/haitian/jacksonville',
    'The VIN does not RSVP to your weekend',
    'VIN nan pa konfime pou wikenn ou',
  ),
  metroFlyer(
    'metro-new-jersey',
    '37',
    'metro-nj-corridor',
    'sky',
    'The Turnpike is not a credit bureau',
    'Turnpike la se pa yon biwo kredi',
    'Newark, Elizabeth, Jersey City — the file may have all three while a collector pretends you are “NYC-ish.” This desk is the destination on purpose.',
    'Newark, Elizabeth, Jersey City — dosye a ka gen tout twa pandan yon kolekte pretann ou se “NYC-ish.”',
    [
      'There is no English city SEO stub for this corridor. Collectors and bureaus print the city. Say which city the envelope came to. Three cities, one corridor, one Haitian desk.',
    ],
    [
      'Pa gen paj SEO angle pou korido sa a. Di nan ki vil anvlop la rive. Twa vil, yon korido, yon biwo ayisyen.',
    ],
    'Say which city the envelope came to — Newark, Elizabeth, or Jersey City.',
    'Di nan ki vil anvlop la rive — Newark, Elizabeth, oswa Jersey City.',
    {
      columns: ['City on the envelope', 'Circle'],
      rows: [
        ['Newark', 'yes / no'],
        ['Elizabeth', 'yes / no'],
        ['Jersey City', 'yes / no'],
      ],
    },
    'newjersey',
    '/haitian/new-jersey',
    'The Turnpike is not a credit bureau',
    'Turnpike la se pa yon biwo kredi',
  ),
];

export const HAITIAN_PIECES: HaitianPieceSpec[] = [...PROOF, ...MORE, ...REST, ...METROS];

export function haitianPieceById(id: string | undefined): HaitianPieceSpec | undefined {
  if (!id) return undefined;
  return HAITIAN_PIECES.find((piece) => piece.id === id);
}

export function listHaitianPieces(): HaitianPieceSpec[] {
  return HAITIAN_PIECES;
}

export function listHaitianPiecesByRoom(room: HaitianPieceRoom): HaitianPieceSpec[] {
  return HAITIAN_PIECES.filter((piece) => piece.room === room);
}

export const HAITIAN_PIECE_ROOMS: { id: HaitianPieceRoom; title: string; lede: string }[] = [
  {
    id: 'service',
    title: 'Credit desks',
    lede: 'Restore, building, business, the freeze — pages about the file itself.',
  },
  {
    id: 'debt',
    title: 'When a letter arrives',
    lede: 'Collector letters, court paper, house and car notices.',
  },
  {
    id: 'outreach',
    title: 'Church and Facebook',
    lede: 'Print a handbill. Post one fact. Book a sitting. Scan when they are ready.',
  },
  {
    id: 'roles',
    title: 'Family and partners',
    lede: 'For a niece at the table, a Credit Specialist, or someone forwarding one page.',
  },
  {
    id: 'metro',
    title: 'City flyers',
    lede: 'A flyer about Miami or Brooklyn. You still type a person’s email.',
  },
];

