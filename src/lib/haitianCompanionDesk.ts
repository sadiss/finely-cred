import type { AgentPersonaId } from '../domain/agentPersonas';
import { CS } from '../config/creditSpecialistProgram';
import type { ChatLocale } from './publicChatI18n';
import { openPublicChat, type PublicChatGoal } from './publicChatEvents';

export const HAITIAN_DESK_LIVE_PATH = '/haitian';
export const HAITIAN_DESK_ALIAS_PATH = '/kreyol';
export const HAITIAN_DESK_PREVIEW_PATH = '/preview/haitian';
export const HAITIAN_KIT_PATH = '/free-kreyol-guide';

export const HAITIAN_COMPANION_PERSONA_ID: AgentPersonaId = 'haitian_companion';

export const HAITIAN_STAFF_IDS = [
  'staff-marie-claire-baptiste',
  'staff-nadege-pierre',
  'staff-farah-jean-louis',
  'staff-jean-marc-toussaint',
  'staff-samuel-augustin',
  'staff-patrick-saint-louis',
] as const;

export type HaitianStaffId = (typeof HAITIAN_STAFF_IDS)[number];

export function isHaitianStaffId(id: string): boolean {
  return (HAITIAN_STAFF_IDS as readonly string[]).includes(id);
}

export function isHaitianDeskPath(pathname: string): boolean {
  const p = (pathname || '').split('?')[0];
  return (
    p === HAITIAN_DESK_LIVE_PATH ||
    p === HAITIAN_DESK_ALIAS_PATH ||
    p === HAITIAN_DESK_PREVIEW_PATH ||
    p.startsWith(`${HAITIAN_DESK_LIVE_PATH}/`) ||
    p === '/portal/haitian' ||
    p === '/admin/haitian' ||
    p === '/preview/workspace-light/portal/haitian' ||
    p === '/preview/workspace-light/admin/haitian' ||
    p.startsWith(`${HAITIAN_KIT_PATH}`)
  );
}

/** Public nav says Haitian community. Signed-in people get the new desk, not the old public shell. */
export function resolveHaitianCommunityHref(opts: { isAdmin?: boolean; isAuthed?: boolean }): string {
  if (opts.isAdmin) return '/admin/haitian';
  if (opts.isAuthed) return '/portal/haitian';
  return HAITIAN_DESK_LIVE_PATH;
}

/** Kits are internal. Guests never browse a public catalog. */
export function resolveHaitianKitRedirect(opts: {
  isAdmin?: boolean;
  isAuthed?: boolean;
  isSpecialist?: boolean;
}): string {
  if (opts.isAdmin) return '/admin/haitian';
  if (opts.isAuthed && opts.isSpecialist && CS.hubPath) {
    return `${CS.hubPath}?tab=haitian`;
  }
  if (opts.isAuthed) return '/portal/haitian';
  return HAITIAN_DESK_LIVE_PATH;
}

export function haitianLaneFromPath(pathname: string): string | undefined {
  return isHaitianDeskPath(pathname) ? 'haitian' : undefined;
}

/** Hard denylist — never emit these in copy, art, names, or prompts. */
export const HAITIAN_DESK_DENYLIST = [
  'vodou',
  'voodoo',
  'witchcraft',
  'zombie',
  'zombies',
  'loa',
  'lwa',
  'possession',
  'black magic',
  'baron samedi',
  'erzulie',
  'boat people',
  'broken english',
  'illiterate',
] as const;

export const HAITIAN_COMPANION_SYSTEM_PROMPT = [
  'You are a Haitian Companion at Finely Cred — bilingual (Kreyòl Ayisyen + American English).',
  'You work the Haitian community desk for Haitian Americans in the U.S. Hubs include Miami / South Florida, Brooklyn / New York, Boston / Brockton, Houston, Atlanta, Washington DC, Chicago, Philadelphia, Jacksonville, and New Jersey (Newark, Elizabeth, Jersey City). Point at Haitian community or the matching /haitian/:metro desk — never dump a guest onto a black English /credit/:city SEO stub.',
  'TWO-VOICE METHOD (agent law, never lecture the guest about it): Keep the English artifact visible (letter line, bureau word, form field). Explain it clearly in Kreyòl. Then name the English words they will see again. They must learn the English because bureaus, collectors, courts, and the internet are in English.',
  'Do not pretend the portal or letters are in Kreyòl. Do not dump a full translated guide. Do not name the product Desk Kreyòl or Creole Desk. The product is Haitian community — credit help for Haitian Americans. Kreyòl is a language, not the product name.',
  'Language: Follow the guest. The site and chat default to English. Only speak Kreyòl when they write Kreyòl or tap Pale Kreyòl / the Kreyòl chip. Use 1979 IPN spelling: mwen, kreyòl, lèt, kredi. Never treat Kreyòl as broken French. Never default to French.',
  'Voice-first and easy: short sentences, one next step, phone-friendly. Offer Hear it / Tande l when a block is long.',
  'Respect: dignity, family, work, education. Money talk is often private. Trusted insiders (Manman, church, a known specialist) matter more than cold ads.',
  'Sòl / tontine is a real community savings practice. You may say U.S. bureau credit is a different system. Never mock sòl. Never tell anyone to abandon it. Never use sòl as a brand gag.',
  'DENYLIST — never mention, joke about, or illustrate: vodou, voodoo, witchcraft, zombies, loa/lwa, possession, black magic, Baron Samedi, Erzulie, boat people, broken English, illiterate, carnival-clown culture, poverty porn.',
  'Call logged-in portal users partners. Public visitors are guests until they become partners.',
  'Educational only. Not legal advice. Results vary. Funding subject to underwriting.',
  'Handoffs: restore → /haitian or /services/personal-credit-restore · debt → /services/debt-legal · building → /services/personal-credit-building · business → /services/business-credit · kits stay internal · specialists → /credit-specialist · session → book a consultation. Do not dump guests onto /credit/:city English SEO stubs.',
  'MARKETING VOICE (ads, kits, captions, emails): insightful, witty, educational. Teach a wow most people do not know. Do not post prices. If they ask what it costs, answer in conversation or point at /pricing. Chat greetings stay hospitality — name, what this desk is for, then invite. Never open with “What do you need?”',
  'When they want to help a relative, they may sit there — they must not take the phone. The letter is the paper in the mailbox. The bureau page is Equifax, Experian, or TransUnion on the website. One English sentence. Then they stop for the day.',
].join(' ');

export type HaitianPlaceAccent = 'emerald' | 'violet' | 'sky' | 'rose';

export type HaitianPlaceCard = {
  key: string;
  accent: HaitianPlaceAccent;
  city: string;
  metro: string;
  english: string;
  kreyol: string;
  cityPath?: string;
};

/** Match `metro-new-jersey` to the `newjersey` place card (hyphens stripped). */
export function haitianPlaceForKitId(kitId: string): HaitianPlaceCard | undefined {
  const compact = kitId.replace(/-/g, '');
  return HAITIAN_PLACE_CARDS.find((card) => compact.includes(card.key));
}

export const HAITIAN_PLACE_CARDS: HaitianPlaceCard[] = [
  {
    key: 'miami',
    accent: 'emerald',
    city: 'Miami',
    metro: 'South Florida',
    english: 'Miami · Broward · Palm Beach',
    kreyol: 'Nou chita ak Ayisyen nan Florid Sid. Nou li lèt yo. Nou montre pwochen etap la.',
    cityPath: '/haitian/miami',
  },
  {
    key: 'brooklyn',
    accent: 'violet',
    city: 'Brooklyn',
    metro: 'New York',
    english: 'Brooklyn · Kings County',
    kreyol: 'Nou chita ak Ayisyen nan Brooklyn ak Nouyòk. Nou li lèt yo. Nou montre pwochen etap la.',
    cityPath: '/haitian/brooklyn',
  },
  {
    key: 'boston',
    accent: 'sky',
    city: 'Boston',
    metro: 'Boston · Brockton',
    english: 'Boston · Brockton · Randolph',
    kreyol: 'Nou chita ak Ayisyen nan Boston ak Brockton. Nou li lèt yo. Nou montre pwochen etap la.',
    cityPath: '/haitian/boston',
  },
  {
    key: 'houston',
    accent: 'rose',
    city: 'Houston',
    metro: 'Texas',
    english: 'Houston · Harris County',
    kreyol: 'Nou chita ak Ayisyen nan Houston. Nou li dosye pèsonèl ak dosye biznis.',
    cityPath: '/haitian/houston',
  },
  {
    key: 'atlanta',
    accent: 'violet',
    city: 'Atlanta',
    metro: 'Georgia',
    english: 'Atlanta · Metro Atlanta',
    kreyol: 'Nou chita ak Ayisyen nan Atlanta. Nou li dosye kredi ak lèt koleksyon.',
    cityPath: '/haitian/atlanta',
  },
  {
    key: 'washington',
    accent: 'sky',
    city: 'Washington',
    metro: 'DC · Maryland · Virginia',
    english: 'Washington DC · MD · VA',
    kreyol: 'Nou chita ak Ayisyen nan DC, Maryland, ak Virginia. Nou li lèt yo.',
    cityPath: '/haitian/washington',
  },
  {
    key: 'chicago',
    accent: 'rose',
    city: 'Chicago',
    metro: 'Illinois',
    english: 'Chicago · Cook County',
    kreyol: 'Nou chita ak Ayisyen nan Chicago. Nou li lèt yo. Nou montre pwochen etap la.',
    cityPath: '/haitian/chicago',
  },
  {
    key: 'philadelphia',
    accent: 'emerald',
    city: 'Philadelphia',
    metro: 'Pennsylvania',
    english: 'Philadelphia · Delaware Valley',
    kreyol: 'Nou chita ak Ayisyen nan Philadelphia. Nou li dosye kredi ak lèt kolektè.',
    cityPath: '/haitian/philadelphia',
  },
  {
    key: 'jacksonville',
    accent: 'violet',
    city: 'Jacksonville',
    metro: 'Northeast Florida',
    english: 'Jacksonville · Duval County',
    kreyol: 'Nou chita ak Ayisyen nan Jacksonville. Nou li lèt kredi ak koleksyon.',
    cityPath: '/haitian/jacksonville',
  },
  {
    key: 'newjersey',
    accent: 'sky',
    city: 'New Jersey',
    metro: 'Newark · Elizabeth · Jersey City',
    english: 'Newark · Elizabeth · Jersey City',
    kreyol: 'Nou chita ak Ayisyen nan New Jersey. Nou li lèt yo. Nou montre pwochen etap la.',
    cityPath: '/haitian/new-jersey',
  },
];

export const HAITIAN_DESK_TRUSTED_LINKS = [
  { id: 'haitian_desk', topics: ['haitian', 'kreyol', 'kreyòl', 'creole', 'ayisyen', 'ayiti'], label: 'Haitian community', href: HAITIAN_DESK_LIVE_PATH },
  { id: 'kreyol_kit', topics: ['kreyol', 'kreyòl', 'kit', 'feyè', 'download', 'gid'], label: 'Credit kits', href: HAITIAN_KIT_PATH },
  { id: 'haitian_miami', topics: ['miami', 'florida', 'broward', 'florid'], label: 'Miami Haitian desk', href: '/haitian/miami' },
  { id: 'haitian_brooklyn', topics: ['brooklyn', 'kings', 'new york', 'nouyòk'], label: 'Brooklyn Haitian desk', href: '/haitian/brooklyn' },
  { id: 'haitian_boston', topics: ['boston', 'brockton', 'randolph', 'massachusetts'], label: 'Boston Haitian desk', href: '/haitian/boston' },
  { id: 'haitian_houston', topics: ['houston', 'texas'], label: 'Houston Haitian desk', href: '/haitian/houston' },
  { id: 'haitian_atlanta', topics: ['atlanta', 'georgia'], label: 'Atlanta Haitian desk', href: '/haitian/atlanta' },
  { id: 'haitian_dc', topics: ['washington', 'dc', 'maryland', 'virginia'], label: 'Washington Haitian desk', href: '/haitian/washington' },
  { id: 'haitian_chicago', topics: ['chicago', 'illinois'], label: 'Chicago Haitian desk', href: '/haitian/chicago' },
  { id: 'haitian_philly', topics: ['philadelphia', 'philly'], label: 'Philadelphia Haitian desk', href: '/haitian/philadelphia' },
  { id: 'haitian_jax', topics: ['jacksonville'], label: 'Jacksonville Haitian desk', href: '/haitian/jacksonville' },
  { id: 'haitian_nj', topics: ['new jersey', 'newark', 'elizabeth', 'jersey city'], label: 'New Jersey Haitian desk', href: '/haitian/new-jersey' },
  { id: 'haitian_restore', topics: ['restore', 'lèt', 'letter', 'bureau', 'equifax'], label: 'Personal credit restore', href: '/pricing/personal-credit-restore' },
  { id: 'haitian_debt', topics: ['debt', 'dèt', 'collector', 'summons', 'validation'], label: 'Debt and legal', href: '/pricing/debt-legal' },
  { id: 'haitian_specialist', topics: ['specialist', 'ede', 'helper', 'espesyalis'], label: 'Credit specialist program', href: '/credit-specialist' },
] as const;

/** Pale Kreyòl is the opt-in. The English site and default chat stay in English. */
export function openHaitianCompanionChat(detail?: { goal?: PublicChatGoal; locale?: ChatLocale }) {
  openPublicChat({
    goal: detail?.goal ?? 'haitian',
    personaId: HAITIAN_COMPANION_PERSONA_ID,
    locale: detail?.locale ?? 'ht',
  });
}

export const HAITIAN_LETTER_SAMPLES = [
  {
    key: 'collection',
    label: 'Collection',
    english: 'This account is reporting a collection.',
    kreyol: 'Yon kolektè ap rapòte yon kont sou dosye kredi w.',
    learn: 'collection · account · reporting',
  },
  {
    key: 'verify',
    label: 'Verify',
    english: 'Please verify this information.',
    kreyol: 'Yo mande pou verifye enfòmasyon sa a — se pa yon lòd pou peye jodi a.',
    learn: 'verify · information',
  },
  {
    key: 'bureaus',
    label: 'Bureaus',
    english: 'Equifax · Experian · TransUnion',
    kreyol: 'Twa biwo ki kenbe dosye pèsonèl la. Yon lèt dwe nonmen sa ki sou ekran an.',
    learn: 'bureau · credit file',
  },
] as const;

export const HAITIAN_HEAR_IT_LINES = {
  welcome:
    'Bonjou. Nou ede Ayisyen ki viv Ozetazini ak kredi, lèt, ak kolektè. Pale Kreyòl lè w pare, gade yon sèvis, oswa rezève yon sesyon. Rezilta yo varye.',
  letter:
    'Lèt la di: This account is reporting a collection. Sa vle di: yon kolektè ap rapòte yon kont sou dosye w. Mo sou lèt la: collection, account, reporting.',
  helper:
    'Si w ap ede yon moun: se yo ki kenbe telefòn nan. Ou pa pran l. Ou montre yon fraz angle. Yon lèt oswa yon ekran. Apre sa nou de kanpe.',
} as const;
