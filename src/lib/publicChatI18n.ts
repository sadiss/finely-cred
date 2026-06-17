export type ChatLocale = 'en' | 'ht' | 'fr';

export const CHAT_LOCALE_LABELS: Record<ChatLocale, string> = {
  en: 'English',
  ht: 'Kreyòl Ayisyen',
  fr: 'Français',
};

type Strings = {
  chatWith: string;
  aiGuide: string;
  liveSpecialist: string;
  pickLane: string;
  you: string;
  typing: string;
  sendPlaceholder: string;
  language: string;
  bookSession: string;
  appointmentSet: string;
  needPartnerForStaff: string;
  welcomeGeneric: string;
  trustedLinks: string;
  hearWelcome: string;
  close: string;
};

const STRINGS: Record<ChatLocale, Strings> = {
  en: {
    chatWith: 'Chat with',
    aiGuide: 'AI guide · live support on shift',
    liveSpecialist: 'Live support specialist when ready',
    pickLane: 'Pick your lane',
    you: 'You',
    typing: 'is typing…',
    sendPlaceholder: 'Type your message…',
    language: 'Language',
    bookSession: 'Book a strategy call',
    appointmentSet: 'Your session request is in — we will confirm by email.',
    needPartnerForStaff: 'To message a specific team member directly, create a free partner account. Otherwise I can book you a call with them.',
    welcomeGeneric:
      "Hi — I'm your Finely Cred guide. Pick a lane or tell me what you need — I'll connect you with whoever is on support shift.",
    trustedLinks: 'Helpful links',
    hearWelcome: 'Hear welcome',
    close: 'Close',
  },
  ht: {
    chatWith: 'Pale ak',
    aiGuide: 'Gid AI · sipò an dirèk lè ekip la sou sèvis',
    liveSpecialist: 'Espesyalis sipò an dirèk lè w pare',
    pickLane: 'Chwazi wout ou',
    you: 'Ou',
    typing: 'ap ekri…',
    sendPlaceholder: 'Ekri mesaj ou…',
    language: 'Lang',
    bookSession: 'Pran yon randevou konsiltasyon',
    appointmentSet: 'Demann randevou ou anrejistre — n ap konfime pa imel.',
    needPartnerForStaff:
      'Pou pale dirèkteman ak yon manm ekip, kreye yon kont patnè gratis. Sinon m ka pran randevou pou ou pale avèk yo.',
    welcomeGeneric:
      'Bonjou — m se gid Finely Cred ou. Chwazi yon wout oswa di m sa w bezwen — m ap konekte w ak moun ki sou sèvis sipò jodi a.',
    trustedLinks: 'Lyen itil',
    hearWelcome: 'Tande mesaj byenveni',
    close: 'Fèmen',
  },
  fr: {
    chatWith: 'Discuter avec',
    aiGuide: 'Guide IA · support en direct en service',
    liveSpecialist: 'Spécialiste support quand vous êtes prêt',
    pickLane: 'Choisissez votre parcours',
    you: 'Vous',
    typing: 'écrit…',
    sendPlaceholder: 'Écrivez votre message…',
    language: 'Langue',
    bookSession: 'Réserver un appel stratégique',
    appointmentSet: 'Votre demande de rendez-vous est enregistrée — confirmation par e-mail.',
    needPartnerForStaff:
      'Pour contacter un membre précis de l\'équipe, créez un compte partenaire gratuit. Sinon je peux réserver un appel.',
    welcomeGeneric:
      'Bonjour — je suis votre guide Finely Cred. Choisissez un parcours ou dites-moi votre besoin — je vous connecte au support en service.',
    trustedLinks: 'Liens utiles',
    hearWelcome: 'Écouter le message',
    close: 'Fermer',
  },
};

export function t(locale: ChatLocale, key: keyof Strings): string {
  return STRINGS[locale]?.[key] ?? STRINGS.en[key];
}

export function detectLocaleFromText(text: string): ChatLocale | null {
  const s = text.toLowerCase();
  const htHints = ['bonjou', 'kijan', 'mwen', 'ou', 'kreyòl', 'kreyol', 'sèvis', 'kòm', 'mesi', 'bezwen', 'kredi', 'dèt'];
  const frHints = ['bonjour', 'merci', 'comment', 'crédit', 'aide', 'rendez-vous', 'français'];
  if (htHints.some((h) => s.includes(h))) return 'ht';
  if (frHints.some((h) => s.includes(h))) return 'fr';
  return null;
}

export function localeInstruction(locale: ChatLocale): string {
  if (locale === 'ht') {
    return 'Respond in Haitian Creole (Kreyòl Ayisyen) unless the visitor switches to English or French. Use natural, warm Caribbean phrasing — not stiff translation. Many visitors are Haitian-American; be respectful and clear.';
  }
  if (locale === 'fr') {
    return 'Respond in French unless the visitor switches language. Keep a professional but warm tone.';
  }
  return 'Respond in English unless the visitor writes in Haitian Creole or French — then match their language.';
}
