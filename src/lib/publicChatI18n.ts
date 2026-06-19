export type ChatLocale = 'en' | 'es' | 'ht' | 'fr' | 'pt' | 'zh' | 'vi' | 'ar';

export const CHAT_LOCALE_ORDER: ChatLocale[] = ['en', 'es', 'ht', 'fr', 'pt', 'zh', 'vi', 'ar'];

export const CHAT_LOCALE_LABELS: Record<ChatLocale, string> = {
  en: 'English',
  es: 'Español',
  ht: 'Kreyòl Ayisyen',
  fr: 'Français',
  pt: 'Português',
  zh: '中文',
  vi: 'Tiếng Việt',
  ar: 'العربية',
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
  yourOptions: string;
  openOptions: string;
  closeOptions: string;
  pickLaneToStart: string;
  suggestedReplies: string;
  popularTopics: string;
  easyReadMode: string;
  pageHelp: string;
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
    needPartnerForStaff:
      'To message a specific team member directly, create a free partner account. Otherwise I can book you a call with them.',
    welcomeGeneric:
      "Hi — I'm your Finely Cred guide. Pick a lane or tell me what you need — I'll connect you with whoever is on support shift.",
    trustedLinks: 'Helpful links',
    hearWelcome: 'Hear welcome',
    close: 'Close',
    yourOptions: 'Your options',
    openOptions: 'Options',
    closeOptions: 'Close options',
    pickLaneToStart: 'Pick your lane to start',
    suggestedReplies: 'Suggested replies',
    popularTopics: 'Popular topics',
    easyReadMode: 'Easy read mode (short sentences)',
    pageHelp: 'Help on this page',
  },
  es: {
    chatWith: 'Chatear con',
    aiGuide: 'Guía IA · soporte en vivo en turno',
    liveSpecialist: 'Especialista en vivo cuando esté listo',
    pickLane: 'Elige tu camino',
    you: 'Tú',
    typing: 'está escribiendo…',
    sendPlaceholder: 'Escribe tu mensaje…',
    language: 'Idioma',
    bookSession: 'Reservar una llamada estratégica',
    appointmentSet: 'Tu solicitud de sesión está registrada — confirmaremos por correo.',
    needPartnerForStaff:
      'Para escribir directamente a un miembro del equipo, crea una cuenta de socio gratis. Si no, puedo reservarte una llamada.',
    welcomeGeneric:
      'Hola — soy tu guía de Finely Cred. Elige un camino o cuéntame qué necesitas — te conectaré con quien esté de turno.',
    trustedLinks: 'Enlaces útiles',
    hearWelcome: 'Escuchar bienvenida',
    close: 'Cerrar',
    yourOptions: 'Tus opciones',
    openOptions: 'Opciones',
    closeOptions: 'Cerrar opciones',
    pickLaneToStart: 'Elige tu camino para empezar',
    suggestedReplies: 'Respuestas sugeridas',
    popularTopics: 'Temas populares',
    easyReadMode: 'Modo lectura fácil (frases cortas)',
    pageHelp: 'Ayuda en esta página',
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
    yourOptions: 'Opsyon ou yo',
    openOptions: 'Opsyon',
    closeOptions: 'Fèmen opsyon yo',
    pickLaneToStart: 'Chwazi wout ou pou kòmanse',
    suggestedReplies: 'Repons sijere',
    popularTopics: 'Sijè popilè',
    easyReadMode: 'Lekti fasil (fraz kout)',
    pageHelp: 'Èd sou paj sa a',
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
      "Pour contacter un membre précis de l'équipe, créez un compte partenaire gratuit. Sinon je peux réserver un appel.",
    welcomeGeneric:
      'Bonjour — je suis votre guide Finely Cred. Choisissez un parcours ou dites-moi votre besoin — je vous connecte au support en service.',
    trustedLinks: 'Liens utiles',
    hearWelcome: 'Écouter le message',
    close: 'Fermer',
    yourOptions: 'Vos options',
    openOptions: 'Options',
    closeOptions: 'Fermer les options',
    pickLaneToStart: 'Choisissez votre parcours pour commencer',
    suggestedReplies: 'Réponses suggérées',
    popularTopics: 'Sujets populaires',
    easyReadMode: 'Mode lecture facile (phrases courtes)',
    pageHelp: 'Aide sur cette page',
  },
  pt: {
    chatWith: 'Conversar com',
    aiGuide: 'Guia IA · suporte ao vivo de plantão',
    liveSpecialist: 'Especialista ao vivo quando você estiver pronto',
    pickLane: 'Escolha seu caminho',
    you: 'Você',
    typing: 'está digitando…',
    sendPlaceholder: 'Digite sua mensagem…',
    language: 'Idioma',
    bookSession: 'Agendar uma chamada estratégica',
    appointmentSet: 'Sua solicitação de sessão foi registrada — confirmaremos por e-mail.',
    needPartnerForStaff:
      'Para falar diretamente com um membro da equipe, crie uma conta parceira gratuita. Caso contrário, posso agendar uma ligação.',
    welcomeGeneric:
      'Olá — sou seu guia Finely Cred. Escolha um caminho ou diga o que precisa — vou conectar você com quem está de plantão.',
    trustedLinks: 'Links úteis',
    hearWelcome: 'Ouvir boas-vindas',
    close: 'Fechar',
    yourOptions: 'Suas opções',
    openOptions: 'Opções',
    closeOptions: 'Fechar opções',
    pickLaneToStart: 'Escolha seu caminho para começar',
    suggestedReplies: 'Respostas sugeridas',
    popularTopics: 'Tópicos populares',
    easyReadMode: 'Modo leitura fácil (frases curtas)',
    pageHelp: 'Ajuda nesta página',
  },
  zh: {
    chatWith: '与…聊天',
    aiGuide: 'AI 向导 · 值班在线支持',
    liveSpecialist: '准备好后可连接真人专家',
    pickLane: '选择您的方向',
    you: '您',
    typing: '正在输入…',
    sendPlaceholder: '输入您的消息…',
    language: '语言',
    bookSession: '预约策略咨询',
    appointmentSet: '您的预约请求已提交 — 我们将通过电子邮件确认。',
    needPartnerForStaff: '如需直接联系特定团队成员，请创建免费合作伙伴账户。否则我可以为您预约通话。',
    welcomeGeneric: '您好 — 我是您的 Finely Cred 向导。选择方向或告诉我您的需求 — 我会为您连接值班支持人员。',
    trustedLinks: '有用链接',
    hearWelcome: '收听欢迎语',
    close: '关闭',
    yourOptions: '您的选项',
    openOptions: '选项',
    closeOptions: '关闭选项',
    pickLaneToStart: '选择方向以开始',
    suggestedReplies: '建议回复',
    popularTopics: '热门话题',
    easyReadMode: '易读模式（短句）',
    pageHelp: '本页帮助',
  },
  vi: {
    chatWith: 'Trò chuyện với',
    aiGuide: 'Hướng dẫn AI · hỗ trợ trực tiếp đang trực',
    liveSpecialist: 'Chuyên viên trực tiếp khi bạn sẵn sàng',
    pickLane: 'Chọn hướng của bạn',
    you: 'Bạn',
    typing: 'đang nhập…',
    sendPlaceholder: 'Nhập tin nhắn…',
    language: 'Ngôn ngữ',
    bookSession: 'Đặt cuộc gọi chiến lược',
    appointmentSet: 'Yêu cầu buổi tư vấn đã được ghi nhận — chúng tôi sẽ xác nhận qua email.',
    needPartnerForStaff:
      'Để nhắn trực tiếp với thành viên cụ thể, hãy tạo tài khoản đối tác miễn phí. Nếu không, tôi có thể đặt cuộc gọi cho bạn.',
    welcomeGeneric:
      'Xin chào — tôi là hướng dẫn Finely Cred của bạn. Chọn hướng hoặc cho tôi biết bạn cần gì — tôi sẽ kết nối bạn với người đang trực.',
    trustedLinks: 'Liên kết hữu ích',
    hearWelcome: 'Nghe lời chào',
    close: 'Đóng',
    yourOptions: 'Tùy chọn của bạn',
    openOptions: 'Tùy chọn',
    closeOptions: 'Đóng tùy chọn',
    pickLaneToStart: 'Chọn hướng để bắt đầu',
    suggestedReplies: 'Gợi ý trả lời',
    popularTopics: 'Chủ đề phổ biến',
    easyReadMode: 'Chế độ đọc dễ (câu ngắn)',
    pageHelp: 'Trợ giúp trên trang này',
  },
  ar: {
    chatWith: 'الدردشة مع',
    aiGuide: 'مرشد ذكي · دعم مباشر متاح',
    liveSpecialist: 'أخصائي مباشر عندما تكون جاهزًا',
    pickLane: 'اختر مسارك',
    you: 'أنت',
    typing: 'يكتب…',
    sendPlaceholder: 'اكتب رسالتك…',
    language: 'اللغة',
    bookSession: 'احجز مكالمة استراتيجية',
    appointmentSet: 'تم تسجيل طلب جلستك — سنتأكد عبر البريد الإلكتروني.',
    needPartnerForStaff:
      'لمراسلة عضو محدد من الفريق مباشرة، أنشئ حساب شريك مجاني. وإلا يمكنني حجز مكالمة لك.',
    welcomeGeneric:
      'مرحبًا — أنا مرشد Finely Cred. اختر مسارًا أو أخبرني بما تحتاج — سأوصلك بمن هو على الدعم الآن.',
    trustedLinks: 'روابط مفيدة',
    hearWelcome: 'استمع للترحيب',
    close: 'إغلاق',
    yourOptions: 'خياراتك',
    openOptions: 'خيارات',
    closeOptions: 'إغلاق الخيارات',
    pickLaneToStart: 'اختر مسارك للبدء',
    suggestedReplies: 'ردود مقترحة',
    popularTopics: 'مواضيع شائعة',
    easyReadMode: 'وضع القراءة السهلة (جمل قصيرة)',
    pageHelp: 'مساعدة في هذه الصفحة',
  },
};

export function t(locale: ChatLocale, key: keyof Strings): string {
  return STRINGS[locale]?.[key] ?? STRINGS.en[key];
}

export function detectLocaleFromText(text: string): ChatLocale | null {
  const s = text.toLowerCase();
  const htHints = ['bonjou', 'kijan', 'mwen', 'kreyòl', 'kreyol', 'sèvis', 'mesi', 'bezwen', 'dèt', ' kòm '];
  const frHints = ['bonjour', 'merci', 'comment', 'crédit', 'aide', 'rendez-vous', 'français', 'parlez'];
  const esHints = ['hola', 'gracias', 'cómo', 'como', 'crédito', 'credito', 'ayuda', 'español', 'espanol', 'necesito', 'quiero'];
  const ptHints = ['olá', 'ola', 'obrigado', 'crédito', 'credito', 'ajuda', 'português', 'portugues', 'preciso'];
  const zhHints = ['你好', '谢谢', '信用', '帮助', '怎么', '需要'];
  const viHints = ['xin chào', 'xin chao', 'cảm ơn', 'cam on', 'tín dụng', 'tin dung', 'giúp', 'giup'];
  const arHints = ['مرحب', 'شكر', 'ائتمان', 'مساعدة', 'كيف', 'أحتاج'];
  if (htHints.some((h) => s.includes(h))) return 'ht';
  if (arHints.some((h) => s.includes(h))) return 'ar';
  if (zhHints.some((h) => s.includes(h))) return 'zh';
  if (viHints.some((h) => s.includes(h))) return 'vi';
  if (esHints.some((h) => s.includes(h))) return 'es';
  if (ptHints.some((h) => s.includes(h))) return 'pt';
  if (frHints.some((h) => s.includes(h))) return 'fr';
  return null;
}

export function localeInstruction(locale: ChatLocale): string {
  switch (locale) {
    case 'ht':
      return 'Respond in Haitian Creole (Kreyòl Ayisyen) unless the visitor switches language. Use natural, warm Caribbean phrasing — not stiff translation.';
    case 'fr':
      return 'Respond in French unless the visitor switches language. Keep a professional but warm tone.';
    case 'es':
      return 'Respond in Spanish unless the visitor switches language. Use clear, warm Latin American / US Spanish.';
    case 'pt':
      return 'Respond in Portuguese (Brazilian-friendly) unless the visitor switches language.';
    case 'zh':
      return 'Respond in Simplified Chinese unless the visitor switches language.';
    case 'vi':
      return 'Respond in Vietnamese unless the visitor switches language.';
    case 'ar':
      return 'Respond in Modern Standard Arabic unless the visitor switches language.';
    default:
      return 'Respond in English unless the visitor writes in another supported language — then match their language. Supported: English, Spanish, Haitian Creole, French, Portuguese, Chinese, Vietnamese, Arabic.';
  }
}

export function isRtlLocale(locale: ChatLocale): boolean {
  return locale === 'ar';
}
