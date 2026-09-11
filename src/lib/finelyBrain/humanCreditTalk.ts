/**
 * Spoken specialist answers — not SOP checklists or brochure copy.
 * Used when the live model is down, and when a visitor asks what a term is.
 */

function isDefinitionAsk(message: string, term: RegExp): boolean {
  const msg = message.toLowerCase().trim();
  if (!term.test(msg)) return false;
  if (/\b(what('s| is| does)|explain|mean|definition|stand for|tell me about)\b/.test(msg)) return true;
  const words = msg.replace(/[^\p{L}\p{N}]+/gu, ' ').split(/\s+/).filter(Boolean);
  return words.length <= 5;
}

const TERMS: Array<{ test: RegExp; reply: string }> = [
  {
    test: /\bfcra\b|fair credit reporting act/,
    reply:
      'FCRA is the Fair Credit Reporting Act — the federal law that says Equifax, Experian, and TransUnion have to investigate when you dispute something they published about you. That is the clock behind a restore letter. It is not a delete button. Want me to show you how it shows up on a real file?',
  },
  {
    test: /\bfdcpa\b|fair debt collection/,
    reply:
      'FDCPA is the Fair Debt Collection Practices Act — the rules collectors have to follow when they come after a consumer debt. It is why a validation letter exists, and why they cannot just keep calling after you tell them to stop. It does not erase the balance by itself. Is a collector on you right now?',
  },
  {
    test: /\bpaydex\b/,
    reply:
      'PAYDEX is Dun & Bradstreet’s bill-pay score for a business — basically “do you pay vendors on time.” It is not a personal FICO. Lenders and vendors glance at it when they decide whether to give the company terms. Are you trying to get a PAYDEX started, or raise one you already have?',
  },
  {
    test: /\bcfpb\b|consumer financial protection/,
    reply:
      'The CFPB is the Consumer Financial Protection Bureau — the federal desk that takes complaints when a bureau, furnisher, or collector will not do their job. A complaint there is not a magic delete. It is the next door when the company stonewalls. Want the path for that, or are you still on the first letter?',
  },
  {
    test: /\btradelines?\b/,
    reply:
      'A tradeline is just an account on a credit file — a card, a loan, a vendor line. People say “tradelines” when they mean adding authorized-user or business accounts to thicken a thin file. It is seasoning and payment history, not a wipe of old damage. Are you looking at personal AU lines or business vendor lines?',
  },
  {
    test: /\butilization\b/,
    reply:
      'Utilization is how much of your available credit you are using. If the card limit is $1,000 and the balance is $900, the file looks tight even if you never missed a payment. That is why we talk about paying down or raising limits before we talk about new applications. What balances are sitting on the cards right now?',
  },
  {
    test: /\b(debt )?validation\b/,
    reply:
      'A validation letter asks the collector to prove the debt — who they are, what they say you owe, and that they have the right to collect it. You send that to the collector, not to Equifax. Different fight from a bureau dispute. Do you have the collection letter in front of you?',
  },
  {
    test: /\bfurnisher/,
    reply:
      'The furnisher is the company that told the bureau about the account — the bank, the lender, the collector. The bureau only published what they sent. That is why a clean dispute often goes to both. Which name is on the account?',
  },
  {
    test: /\bmetro\s*2\b/,
    reply:
      'Metro 2 is the format furnishers use to report accounts to the bureaus. When a field is wrong, it is often a Metro 2 coding problem — status, balance, date, or how they marked it late. You do not write “Metro 2” in the letter. You name the field that does not match the proof.',
  },
  {
    test: /\bcredit score\b/,
    reply:
      'A credit score is a three-digit number built from the file — payments, balances, age, new pulls. Lenders buy a FICO more often than the number an app flashes. The file comes first. The score moves after the fields change. Are you trying to see the number, or clean the file?',
  },
  {
    test: /\bfico\b/,
    reply:
      'FICO is a scoring model lenders actually buy. It is not the Vantage number a lot of apps flash. Same file can print two different scores. When we talk restore, we talk the file first — the score moves after the fields change. Which number are you looking at, and where did you see it?',
  },
  {
    test: /\bein\b|employer identification/,
    reply:
      'An EIN is the IRS number for the business — like a Social for the company. You need it before Dun & Bradstreet, vendor terms, or most business cards. It does not by itself get you credit. Do you already have the EIN, or are you still forming the entity?',
  },
  {
    test: /\bduns\b|d-u-n-s/,
    reply:
      'A D-U-N-S number is Dun & Bradstreet’s file number for the company. No D-U-N-S, no PAYDEX. Getting the number is the easy part. Paying a few real vendors on time is what makes the file mean something. Has the company been registered with D&B yet?',
  },
  {
    test: /\bcharge[-\s]?off\b/,
    reply:
      'A charge-off means the creditor wrote the balance off their books as a loss. The debt can still be collected, and it still sits on the file. It is ugly, but it is not the same as a judgment. Is this on a card, an auto, or a collection that bought it?',
  },
  {
    test: /\b(hard )?inquir(y|ies)\b/,
    reply:
      'A hard inquiry is a lender pulling the file because you applied. Too many in a short window makes the next underwriter nervous. Soft pulls — the ones you do yourself — do not work the same way. Are you seeing a pull you do not recognize, or are you about to apply?',
  },
  {
    test: /\bcredit freeze\b|\bfreeze my (credit|file)\b/,
    reply:
      'A credit freeze locks the file so a new lender cannot open it unless you thaw it. It is a theft move, not a score move. You freeze each bureau yourself. Useful if someone is opening accounts. In the way if you are about to apply. Which one are you in?',
  },
];

/** Human definition when the visitor is asking what a term is — not a situation dump. */
export function humanTermReply(message: string): string | null {
  const msg = (message || '').trim();
  if (!msg) return null;
  for (const row of TERMS) {
    if (isDefinitionAsk(msg, row.test)) return row.reply;
  }
  return null;
}

/** How-to doors — official public sites, not bureau APIs and not a restore lecture. */
export function humanHowToReply(message: string): string | null {
  const msg = (message || '').toLowerCase().trim();
  if (!msg) return null;

  const asksHow =
    /\b(how (can|do) i|where (can|do) i|how to)\b/.test(msg)
    || /\b(find|check|see|get|pull|download)\b.{0,40}\b(credit )?score\b/.test(msg);
  const asksScore = asksHow && /\b(credit )?score\b/.test(msg);
  const asksReport =
    /\bannualcreditreport\b/.test(msg)
    || /\bannual credit report\b/.test(msg)
    || (/\b(free )?(credit )?report\b/.test(msg) && /\b(how|where|get|pull|annual|official)\b/.test(msg));

  if (asksScore || asksReport) {
    return 'The free official file is AnnualCreditReport.com — Equifax, Experian, and TransUnion, once a week, no card. That is the report lenders use. Apps often flash a different number. Want the link, or are you trying to read a score you already have?';
  }

  if (/\b(freeze|thaw|unfreeze)\b/.test(msg) && /\b(credit|file|bureau|equifax|experian|transunion)\b/.test(msg)) {
    return 'A freeze is on each bureau’s own site — Equifax, Experian, and TransUnion. You lock the file so a new lender cannot open it unless you thaw it. I can give you those three doors.';
  }

  if (
    (/\b(file|submit|make|open|how)\b/.test(msg) && /\b(cfpb|complaint)\b/.test(msg))
    || /\bcfpb complaint\b/.test(msg)
  ) {
    return 'You file at consumerfinance.gov/complaint. Name the company, what they did, and what you want. It is not a delete button. Use it when a bureau or collector stonewalls after you already wrote them.';
  }

  if (/\b(identity theft|stolen (ssn|identity|social)|someone opened)\b/.test(msg)) {
    return 'Identity theft starts at IdentityTheft.gov. You get a recovery plan and the freeze path. That is the official door — not a restore letter.';
  }

  return null;
}

/** First spoken answer: how-to door, then definition. */
export function humanSpokenReply(message: string): string | null {
  return humanHowToReply(message) ?? humanTermReply(message);
}

export const HUMAN_I_DONT_KNOW =
  'I do not have a clean answer for that. Tell me what is in front of you — a report, a collector letter, or a company file — or ask me to book a session.';

export function speakPageHelp(whenToUse: string, firstStep?: string): string {
  const firstMove = firstStep?.trim() ? ` First move: ${firstStep.trim()}.` : '';
  return `${whenToUse.trim()}${firstMove} Want me to walk that with you?`;
}

export function speakKnowledgeHit(title: string, snippet: string): string {
  const body = (snippet || title || '').replace(/\s+/g, ' ').trim();
  if (!body) {
    return 'Tell me what is in front of you — a report, a collector letter, or a company file — and I will start there.';
  }
  if (body.length <= 240) return body;
  return `${body.slice(0, 236).replace(/\s+\S*$/, '')}…`;
}

export const HUMAN_SITE_OVERVIEW =
  'Finely Cred is a credit desk. People come here to clean a personal file, stand up business credit, deal with collector paper, or add tradelines. You can work the file yourself, or we run it with you. What are you looking at right now?';

export const HUMAN_DISPUTE_VS_DEBT =
  'A dispute letter goes to Equifax, Experian, or TransUnion — you are saying a field on the report is wrong. A debt letter goes to the collector or the creditor — you are asking them to prove the bill or stop calling. Same mailbox at home, two different fights. Which one is sitting in front of you?';

export const HUMAN_FREE_GUIDE =
  'The free guide is the first restore kit — rights you actually use, the first letter round, and what to do when a bureau stalls. Open Start free guide. No card. If you want someone on the file with you after that, we book a session.';

export const HUMAN_CREDIT_RESTORE =
  'Personal restore here is evidence-first. We pull what the bureaus published, pick the fields that do not match, and send one clean claim at a time. Not a wipe. Not a 30-day miracle. Do you have a current report in front of you?';

export const HUMAN_PRICING =
  'You can start with the free guide and keep going yourself, or have the desk run the file with you. Funding and tradelines depend on the file — not a posted rate card. What are you trying to get done?';

export const HUMAN_GENERIC_NEXT =
  'Tell me what is in front of you — a report, a collector letter, or a company file — and I will start there.';

export function shouldSkipKnowledgeArticle(id: string): boolean {
  return id === 'mental-wellbeing';
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'how', 'can', 'i', 'my', 'me', 'to', 'do', 'what', 'is', 'for', 'of', 'and', 'or',
  'find', 'out', 'please', 'tell', 'about', 'this', 'that', 'with', 'your',
]);

/** True when the excerpt actually talks about the question — not a nearby lecture. */
export function excerptAnswersQuery(query: string, excerpt: string): boolean {
  const words = (query || '')
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
  if (!words.length) return true;
  const hay = (excerpt || '').toLowerCase();
  const hits = words.filter((w) => hay.includes(w));
  if (words.length === 1) return hits.length === 1;
  return hits.length >= 2;
}
