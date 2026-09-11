import type { HaitianPieceAccent, HaitianPieceArchitecture } from './haitianPieceSpec';

export type HaitianMetroSlug =
  | 'miami'
  | 'brooklyn'
  | 'boston'
  | 'houston'
  | 'atlanta'
  | 'washington'
  | 'chicago'
  | 'philadelphia'
  | 'jacksonville'
  | 'new-jersey';

export type HaitianMetroSection = {
  headingEn: string;
  headingHt: string;
  paragraphsEn: string[];
  paragraphsHt: string[];
};

export type HaitianMetroDesk = {
  slug: HaitianMetroSlug;
  placeKey: string;
  pieceId: string;
  architecture: HaitianPieceArchitecture;
  accent: HaitianPieceAccent;
  city: string;
  metro: string;
  jobEn: string;
  jobHt: string;
  ledeEn: string;
  ledeHt: string;
  actionEn: string;
  actionHt: string;
  sections: HaitianMetroSection[];
};

export const HAITIAN_METRO_DESKS: HaitianMetroDesk[] = [
  {
    slug: 'miami',
    placeKey: 'miami',
    pieceId: 'metro-miami',
    architecture: 'metro-miami-ledger',
    accent: 'emerald',
    city: 'Miami',
    metro: 'South Florida',
    jobEn: 'A computer can decide you are three people — then a collector swears you are hiding.',
    jobHt: 'Yon òdinatè ka deside ou se twa moun — epi yon kolektè swe ou kache.',
    ledeEn:
      'You were living a normal Miami life: Haiti on the old forms, a cousin’s couch, a condo. The file treats that like a disguise. That is why a loan says no and a collector will not stop — not because you needed “address cleanup.”',
    ledeHt:
      'Ou t ap viv yon lavi nòmal Miami. Dosye a trete sa tankou yon degize. Se poutèt sa yon prè di non.',
    actionEn: 'Pull all three bureaus. Circle every name and address the file invented. Do not pay a collector who has the wrong you.',
    actionHt: 'Pran twa biwo yo. Make chak non ak adrès dosye a envante. Pa peye yon kolektè ki gen move ou.',
    sections: [
      {
        headingEn: 'How the trick shows up in Miami',
        headingHt: 'Kouman trick la parèt nan Miami',
        paragraphsEn: [
          'Furnishers that only know USPS habits get confused by overseas lines. Broward and Palm Beach are not “close enough” to Miami on a bureau page. Pull all three cousins. One of them is still shouting the old Haiti line.',
          'Circle what the file invented. Then talk. Pale Kreyòl when you are ready.',
        ],
        paragraphsHt: [
          'Furnisher ki konnen sèlman USPS konfonn ak liy lòt peyi. Broward se pa “pre ase” Miami sou yon paj biwo.',
        ],
      },
    ],
  },
  {
    slug: 'brooklyn',
    placeKey: 'brooklyn',
    pieceId: 'metro-brooklyn',
    architecture: 'metro-brooklyn-mailbox',
    accent: 'violet',
    city: 'Brooklyn',
    metro: 'New York',
    jobEn: 'The mailbox still wins in court. The envelope date is evidence. A screenshot of a text is a rumor.',
    jobHt: 'Bwat la toujou genyen nan tribinal. Dat anvlòp la se prèv. Yon foto tèks se tripotay.',
    ledeEn:
      'Kings County collectors do not accept “I meant to open it after church.” A 30-day window can start when the letter lands, not when you felt ready. Do not pay from fear the same week.',
    ledeHt: 'Kolektè Kings County pa aksepte “mwen te vle ouvri l apre legliz.” Pa peye paske w pè nan menm semèn nan.',
    actionEn: 'Keep the envelope. Write the day it arrived. Do not pay from fear this week.',
    actionHt: 'Kenbe anvlòp la. Ekri jou li rive. Pa peye paske w pè semèn sa a.',
    sections: [
      {
        headingEn: 'Argue with the paper',
        headingHt: 'Diskite ak papye a',
        paragraphsEn: [
          'Old addresses across the boroughs still furnish. Argue with the paper, not a portal chat. Certified receipts beat memory.',
        ],
        paragraphsHt: ['Kenbe anvlòp la. Resi sètifye bat memwa. Pa diskite ak yon chat pòtal.'],
      },
    ],
  },
  {
    slug: 'boston',
    placeKey: 'boston',
    pieceId: 'metro-boston',
    architecture: 'metro-boston-campus',
    accent: 'sky',
    city: 'Boston',
    metro: 'Boston · Brockton',
    jobEn: 'The hospital and the college both sold your name. They are not the same debt.',
    jobHt: 'Lopital ak lekòl tou de vann non ou. Yo pa menm dèt.',
    ledeEn:
      'One dispute letter to both cousins is how both get confused. Campus accounts and hospital billing are different English. Brockton and Randolph are not a rounding error.',
    ledeHt: 'Yon sèl lèt diskisyon bay tou de kouzen se jan yo konfonn. Separe lekòl ak lopital.',
    actionEn: 'Split the stack into two piles — student vs hospital — before anyone writes.',
    actionHt: 'Separe pil la an de — lekòl ak lopital — anvan nenpòt moun ekri.',
    sections: [
      {
        headingEn: 'Two piles',
        headingHt: 'De pil',
        paragraphsEn: [
          'Student loans and campus cards are not the same tradeline family. Hospital billing may have its own collector. Ask who owns the debt. Pull all three. Medical furnishing is uneven.',
        ],
        paragraphsHt: ['Prè etidyan ak kat lekòl se pa menm fanmi. Mande kiyès ki posede dèt lopital la.'],
      },
    ],
  },
  {
    slug: 'houston',
    placeKey: 'houston',
    pieceId: 'metro-houston',
    architecture: 'metro-houston-cycle',
    accent: 'rose',
    city: 'Houston',
    metro: 'Texas',
    jobEn: 'Payday Friday. Snapshot Wednesday. Panic Thursday. You already paid. The percentage missed the memo.',
    jobHt: 'Pèyman vandredi. Foto mèkredi. Panik Jedi. Ou deja peye. Pousantaj la pa resevwa memo a.',
    ledeEn:
      'The bureau photographs the card on statement day, not payday. Disputing utilization that is accurate wastes a round. Do not close the card to hide a snapshot.',
    ledeHt: 'Biwo a foto kat la jou deklarasyon. Pa fèmen kat la pou kache yon foto.',
    actionEn: 'Write each card’s statement date. Do not close the card to hide a snapshot.',
    actionHt: 'Ekri dat deklarasyon chak kat. Pa fèmen kat la pou kache yon foto.',
    sections: [
      {
        headingEn: 'Ask the issuer when they report',
        headingHt: 'Mande kilè yo rapòte',
        paragraphsEn: [
          'It is a date, not a vibe. On-time still matters when the percentage is loud. Texas files still pull three bureaus.',
        ],
        paragraphsHt: ['Se yon dat, se pa yon vibes. Peye alè toujou konte lè pousantaj la fò.'],
      },
    ],
  },
  {
    slug: 'atlanta',
    placeKey: 'atlanta',
    pieceId: 'metro-atlanta',
    architecture: 'metro-atlanta-moves',
    accent: 'violet',
    city: 'Atlanta',
    metro: 'Georgia',
    jobEn: 'Moving does not kill a collection. The fourth buyer with a new logo is still shouting.',
    jobHt: 'Demenajman pa touye yon koleksyon. Katriyèm achtè a toujou ap rele.',
    ledeEn:
      'The name that matters is the original creditor. Do not pay four collectors for one original account. A move is not a legal eraser.',
    ledeHt: 'Non ki konte se premye krèdye a. Pa peye kat kolektè pou yon sèl kont.',
    actionEn: 'Match each collection to the original creditor. Do not pay four collectors for one account.',
    actionHt: 'Matche chak koleksyon ak premye krèdye a. Pa peye kat kolektè pou yon sèl kont.',
    sections: [
      {
        headingEn: 'Buyer names change',
        headingHt: 'Non achtè yo chanje',
        paragraphsEn: [
          'Original creditor often does not. Address history across Georgia can look like three people. Screenshot each collection line, dated.',
        ],
        paragraphsHt: ['Premye krèdye a souvan pa chanje. Foto chak liy koleksyon, ak dat.'],
      },
    ],
  },
  {
    slug: 'washington',
    placeKey: 'washington',
    pieceId: 'metro-washington',
    architecture: 'metro-dc-fan',
    accent: 'sky',
    city: 'Washington',
    metro: 'DC · Maryland · Virginia',
    jobEn: 'Three states on one file looks like identity theft. To you it is commuting. The Beltway is not a bureau.',
    jobHt: 'Twa eta sou yon dosye sanble vòl idantite. Pou ou se trajè. Beltway a se pa yon biwo.',
    ledeEn:
      'DC, Maryland, and Virginia can all print on one person. Jr / II / hyphenated names duplicate files. Freeze if the stack looks like a stranger. Then sit with findings.',
    ledeHt: 'DC, Maryland, ak Virginia ka tout ekri sou yon sèl moun. Freeze si pil la sanble yon etranje.',
    actionEn: 'List DC / MD / VA as the file prints them. Freeze if it looks like a stranger.',
    actionHt: 'Lis DC / MD / VA jan dosye a ekri yo. Freeze si sa sanble yon etranje.',
    sections: [
      {
        headingEn: 'Do not dispute accurate old addresses you actually used',
        headingHt: 'Pa diskite adrès kòrèk ou te vrèman itilize',
        paragraphsEn: [
          'MD and VA spellings of the same street still count as two lines. Pull all three. One cousin loves old Virginia.',
        ],
        paragraphsHt: ['Òtograf MD ak VA menm ri a toujou konte kòm de liy. Pran twa yo.'],
      },
    ],
  },
  {
    slug: 'chicago',
    placeKey: 'chicago',
    pieceId: 'metro-chicago',
    architecture: 'metro-chicago-docket',
    accent: 'rose',
    city: 'Chicago',
    metro: 'Illinois',
    jobEn: 'ComEd and a Visa are not one “Chicago debt.” City, utility, and medical sit next to bank cards like they went to the same party. They did not.',
    jobHt: 'ComEd ak yon Visa se pa yon sèl dèt Chicago. Yo chita bò kote, yo pa menm fèt.',
    ledeEn:
      'Municipal furnishers use different English than banks. Medical can look quiet until a collector buys it. Do not mix a city ticket with a Mastercard dispute.',
    ledeHt: 'Pa melanje yon tikè vil ak yon diskisyon Mastercard. Pòtal yo bliye. Papye sonje.',
    actionEn: 'Mark what you still recognize. Separate utility from revolving before anyone writes.',
    actionHt: 'Make sa w toujou rekonèt. Separe sèvis piblik ak revolving anvan nenpòt lèt.',
    sections: [
      {
        headingEn: 'Keep the city notices',
        headingHt: 'Kenbe avi vil yo',
        paragraphsEn: ['Portals forget. Paper remembers. Pull all three. City items are uneven.'],
        paragraphsHt: ['Kenbe avi vil yo. Pran twa biwo yo.'],
      },
    ],
  },
  {
    slug: 'philadelphia',
    placeKey: 'philadelphia',
    pieceId: 'metro-philadelphia',
    architecture: 'metro-philly-age',
    accent: 'emerald',
    city: 'Philadelphia',
    metro: 'Pennsylvania',
    jobEn: 'Your oldest good card is doing more work than a weekend of “credit repair.” Do not throw out the museum.',
    jobHt: 'Pi ansyen bon kat ou a ap fè plis travay pase yon wikenn “credit repair.” Pa jete mize a.',
    ledeEn:
      'Challenging a clean old account because you are bored is how people shrink their own garden. Too-old-to-stay is a finding. Healthy-old is a feature.',
    ledeHt: 'Diskite yon kont pwòp paske ou anwiye se jan moun redwi jaden yo. Kite bon laj travay.',
    actionEn: 'Screenshot first. Challenge only what is wrong. Do not close the oldest good card.',
    actionHt: 'Foto anvan. Diskite sèlman sa ki mal. Pa fèmen pi ansyen bon kat la.',
    sections: [
      {
        headingEn: 'Age is an asset',
        headingHt: 'Laj se yon byen',
        paragraphsEn: [
          'Average age of accounts cares about the oldest revolving. Pennsylvania clutter is often old collections plus good cards. Split them.',
        ],
        paragraphsHt: ['Laj mwayèn pran swen pi ansyen revolving la. Separe ansyen koleksyon ak bon kat.'],
      },
    ],
  },
  {
    slug: 'jacksonville',
    placeKey: 'jacksonville',
    pieceId: 'metro-jacksonville',
    architecture: 'metro-jax-auto',
    accent: 'violet',
    city: 'Jacksonville',
    metro: 'Northeast Florida',
    jobEn: 'Florida mail is not on island time. It is on statute time. The VIN does not RSVP to your weekend.',
    jobHt: 'Lapòs Florid pa sou tan zile. Li sou tan lwa. VIN nan pa konfime pou wikenn ou.',
    ledeEn:
      'Insurance and auto items often carry a short clock. Force-placed insurance can invent a new number overnight. Do not wait for the next paycheck to read a sale notice.',
    ledeHt: 'Asirans ak oto gen fenèt kout. Pa tann pwochèn pèyman pou li yon avi vant.',
    actionEn: 'Photograph the notice and every bureau screen before you write. Write the VIN.',
    actionHt: 'Foto avi a ak chak ekran biwo anvan w ekri. Ekri VIN nan.',
    sections: [
      {
        headingEn: 'Repo clocks and bureau reporting are different rooms',
        headingHt: 'Relè repo ak rapò biwo se chanm diferan',
        paragraphsEn: ['Keep the insurance cancellation page. Pull all three. Auto furnishers are uneven.'],
        paragraphsHt: ['Kenbe paj anilasyon asirans lan. Pran twa yo.'],
      },
    ],
  },
  {
    slug: 'new-jersey',
    placeKey: 'newjersey',
    pieceId: 'metro-new-jersey',
    architecture: 'metro-nj-corridor',
    accent: 'sky',
    city: 'New Jersey',
    metro: 'Newark · Elizabeth · Jersey City',
    jobEn: 'The Turnpike is not a credit bureau. The file may have Newark, Elizabeth, and Jersey City while a collector pretends you are “NYC-ish.”',
    jobHt: 'Turnpike la se pa yon biwo kredi. Dosye a ka gen twa vil pandan yon kolektè pretann ou se NYC.',
    ledeEn:
      'This desk is the destination on purpose. Say which city the envelope came to. Collectors and bureaus print the city.',
    ledeHt: 'Biwo sa a se destinasyon an espre. Di nan ki vil anvlòp la rive.',
    actionEn: 'Say which city the envelope came to — Newark, Elizabeth, or Jersey City.',
    actionHt: 'Di nan ki vil anvlòp la rive — Newark, Elizabeth, oswa Jersey City.',
    sections: [
      {
        headingEn: 'Three cities, one corridor, one Haitian desk',
        headingHt: 'Twa vil, yon koridò, yon biwo ayisyen',
        paragraphsEn: ['There is no English city stub for this corridor. We read the letter that arrived in New Jersey.'],
        paragraphsHt: ['Nou li lèt ki rive nan New Jersey. Di vil anvlòp la.'],
      },
    ],
  },
];

export function haitianMetroBySlug(slug: string | undefined): HaitianMetroDesk | undefined {
  if (!slug) return undefined;
  return HAITIAN_METRO_DESKS.find((desk) => desk.slug === slug);
}

export function haitianMetroPath(slug: HaitianMetroSlug): string {
  return `/haitian/${slug}`;
}
