/**
 * Spoken 1979 IPN Kreyòl + hospitable English for Haitian community.
 * English artifacts stay English. Never French. Never briefing titles.
 */
import { FINELY_COPY_COMPLIANCE_EN, FINELY_COPY_COMPLIANCE_HT } from './finelyCopyVoice';

export const HT_COMPLIANCE_EN = FINELY_COPY_COMPLIANCE_EN;
export const HT_COMPLIANCE_HT = FINELY_COPY_COMPLIANCE_HT;

export const HT_GLOSSARY = {
  creditFile: { en: 'credit file', ht: 'dosye kredi' },
  bureau: { en: 'bureau', ht: 'biwo rapò' },
  score: { en: 'score', ht: 'nòt' },
  dispute: { en: 'dispute', ht: 'diskisyon sou sa ki sou dosye a' },
  collection: { en: 'collection', ht: 'koleksyon' },
  account: { en: 'account', ht: 'kont' },
  reporting: { en: 'reporting', ht: 'ap rapòte' },
  utilization: { en: 'utilization', ht: 'konbyen ou itilize sou kat la' },
} as const;

export const HT_PUBLIC = {
  heroEyebrow: 'Haitian Americans in the U.S.',
  heroTitleLead: 'Haitian',
  heroTitleEm: 'community',
  heroSub: 'Credit help for Haitian Americans',
  heroLede:
    'A collection is a rumor with a phone number. Paying it often does not delete the headline. We read the English line. Kreyòl makes the meaning clear. Pale Kreyòl when you are ready.',
  paleKreyol: 'Pale Kreyòl',
  bookSession: 'Book a session',
  processKicker: 'How a visit works',
  processH2: 'Credit is not a binge show',
  processLede: 'One English line. One meaning. One next step. Then you stop. That is how files get less messy.',
  offersKicker: 'Four desks',
  offersH2: 'Four secrets most people never learn',
  offersLede: 'Ask when you want a number — we do not post it here.',
  wowKicker: 'The file',
  wowH2: 'Your credit file is a gossip column written by computers that have never met you',
  wowLede:
    'There is no single “the credit report.” Equifax, Experian, and TransUnion can disagree on the same Tuesday. Photograph the screen. The emailed PDF is a cousin.',
  staffKicker: 'Your team',
  staffH2: 'Six specialists. They speak Kreyòl.',
  staffLede: 'They sit with files, letters, and the next step. Nobody is grading your accent.',
  metroKicker: 'City desks',
  metroH2: 'Haitian Americans across the U.S.',
  helperKicker: 'If you are helping',
  helperH2: 'You’re allowed to sit there. Don’t take the phone.',
  helperTitle: 'Se yo ki kenbe telefòn nan. Ou pa pran l.',
  helperTitleEn: 'She holds her phone. You point at the sentence.',
} as const;

export const HT_OFFERS = [
  {
    id: 'restore',
    accent: 'emerald' as const,
    path: '/services/personal-credit-restore',
    kicker: 'Personal restore',
    kickerHt: 'Dosye pèsonèl',
    title: 'Fix what is wrong on the bureau file',
    titleHt: 'Fè yo retire sa ki pa vre sou dosye a',
    process: 'Photograph the screen. Name the finding. Mail the English letter.',
    processHt: 'Foto ekran an. Nonmen jwenn nan. Voye lèt angle a.',
    wow: 'Paying a collection often does not delete it. You can pay the rumor and still live with the headline.',
    wowHt: 'Peye yon koleksyon souvan pa efase l. Ou ka peye, epi tit la rete.',
    priceId: 'personal_restore_starter',
  },
  {
    id: 'debt',
    accent: 'rose' as const,
    path: '/services/debt-legal',
    kicker: 'Debt and legal',
    kickerHt: 'Dèt ak kolektè',
    title: 'Ask for proof before you pay',
    titleHt: 'Mande prèv anvan w peye',
    process: 'Keep the envelope. Ask for proof. Do not pay from fear the same week.',
    processHt: 'Kenbe anvlòp la. Mande prèv. Pa peye paske w pè nan menm semèn nan.',
    wow: 'That collection letter is a clock, not a bill you have to pay before breakfast.',
    wowHt: 'Lèt koleksyon an se yon relè, se pa yon bòdwo ou dwe peye anvan manje maten.',
    priceId: 'debt_kill_diy',
  },
  {
    id: 'build',
    accent: 'sky' as const,
    path: '/services/personal-credit-building',
    kicker: 'Credit building',
    kickerHt: 'Bati dosye a',
    title: 'Grow a thin file, without a promised score',
    titleHt: 'Bati yon dosye mens, san yo pa pwomèt yon nòt',
    process: 'Write the statement date. Watch how much you use. Do not close the oldest good card for sport.',
    processHt: 'Ekri dat deklarasyon an. Gade konbyen ou itilize. Pa fèmen pi ansyen bon kat la pou plezi.',
    wow: 'Payday is the outfit. Statement day is the photo.',
    wowHt: 'Jou pèyman se rad la. Jou deklarasyon se foto a.',
    priceId: 'personal_build_starter',
  },
  {
    id: 'business',
    accent: 'violet' as const,
    path: '/services/business-credit',
    kicker: 'Business credit',
    kickerHt: 'Kredi biznis',
    title: 'Open the company file on the EIN',
    titleHt: 'Ouvri dosye konpayi an sou EIN, pa sou nimewo sosyal pwopriyetè a',
    process: 'Write the EIN. Name a vendor that reports. Then a company ask — not the owner Social Security number.',
    processHt: 'Ekri EIN nan. Nonmen yon machann ki rapòte. Apre sa, yon demann sou EIN.',
    wow: 'PAYDEX is not FICO in a suit. It is how many days you took to pay the vendor.',
    wowHt: 'PAYDEX se pa FICO nan kostim. Li se konbyen jou ou te pran pou peye machann nan.',
    priceId: 'business_foundation',
  },
] as const;

export const HT_HEAR = {
  welcome:
    'Bonjou. Nou ede Ayisyen ki viv Ozetazini ak kredi, lèt, ak kolektè. Pale Kreyòl lè w pare, gade yon sèvis, oswa rezève yon sesyon. Rezilta yo varye.',
  letter:
    'Lèt la di: This account is reporting a collection. Sa vle di: yon kolektè ap rapòte yon kont sou dosye w. Mo sou lèt la: collection, account, reporting.',
  helper:
    'Si w ap ede yon moun: se yo ki kenbe telefòn nan. Ou pa pran l. Ou montre yon fraz angle. Yon lèt oswa yon ekran. Apre sa nou de kanpe.',
} as const;
