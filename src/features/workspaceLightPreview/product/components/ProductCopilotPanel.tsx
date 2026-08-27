import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  Calendar,
  ChevronDown,
  Compass,
  Globe,
  Maximize2,
  MessageCircle,
  Mic,
  Minimize2,
  Send,
  Sparkles,
  Users,
  Volume2,
  X,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../auth/AuthProvider';
import { getUserDisplayName } from '../../../../auth/userProfile';
import { openCommunicationHub } from '../../../../components/chat/communicationHubModel';
import type { AiGatewayMessage } from '../../../../lib/aiClient';
import { converseWithFinelyAi } from '../../../../lib/conversationalAi';
import { finelyPublicAnswer } from '../../../../lib/finelyBrain/finelyPublicAnswer';
import { speakFinelyText, useFinelyVoiceInput } from '../../../../hooks/useFinelyVoiceInput';
import {
  CHAT_LOCALE_LABELS,
  CHAT_LOCALE_ORDER,
  detectLocaleFromText,
  isRtlLocale,
  localeInstruction,
  t,
  type ChatLocale,
} from '../../../../lib/publicChatI18n';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import type { WorkspaceProductRole } from '../workspaceProductTokens';
import './productCopilotPanel.css';

type CopilotMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  source?: 'gateway' | 'knowledge_local' | 'demo';
};

export type ProductCopilotOpenDetail = {
  prompt?: string;
  contextLabel?: string;
};

type HubHandoffTab = 'ai' | 'team' | 'meetings' | 'guide';

const OPEN_PRODUCT_COPILOT_EVENT = 'finely:open-product-copilot';
const COPILOT_HANDOFF_KEY = 'finely:copilot-handoff';
const COPILOT_EXPANDED_KEY = 'finely:copilot-expanded';
const COPILOT_LOCALE_KEY = 'finely:copilot-locale';
const COPILOT_MOBILE_QUERY = '(max-width: 900px)';

export function openProductCopilot(detail: ProductCopilotOpenDetail = {}) {
  openCommunicationHub({
    tab: 'ai',
    expanded: true,
    prompt: detail.prompt,
    contextLabel: detail.contextLabel,
  });
  window.dispatchEvent(new CustomEvent<ProductCopilotOpenDetail>(OPEN_PRODUCT_COPILOT_EVENT, { detail }));
}

function messageId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/** Quick prompts change with the page the partner/admin is actually looking at. */
function deriveContextualPrompts(pathname: string, role: WorkspaceProductRole): string[] {
  const p = pathname.toLowerCase();
  if (p.includes('dispute')) {
    return role === 'admin'
      ? ['Which disputes are overdue?', 'Summarize this dispute round', 'What evidence is missing?']
      : ['What is my dispute status?', 'Explain this dispute reason', 'What happens after I dispute?'];
  }
  if (p.includes('report')) {
    return role === 'admin'
      ? ['What changed on this report?', 'Flag negative items to review', 'Explain this tradeline']
      : ['What does this report show?', 'Which items should I dispute?', 'Explain my utilization'];
  }
  if (p.includes('letter') || p.includes('mail')) {
    return role === 'admin'
      ? ['What letters need approval?', 'Explain this letter template', 'What is the mailing SLA?']
      : ['When will my letter mail?', 'What does this letter say?', 'Can I still edit this letter?'];
  }
  if (p.includes('document')) {
    return role === 'admin'
      ? ['What documents are missing?', 'Explain this document type', 'Flag documents needing review']
      : ['What document should I upload?', 'Why is this document needed?', 'Is my upload secure?'];
  }
  if (p.includes('readiness') || p.includes('lender')) {
    return role === 'admin'
      ? ['Explain this readiness score', 'Which lenders fit this partner?', 'What is blocking approval?']
      : ['Explain my readiness score', 'What lenders fit my profile?', 'What should I improve first?'];
  }
  if (p.includes('message') || p.includes('comms')) {
    return role === 'admin'
      ? ['Which threads need a reply?', 'Summarize this conversation', 'Who should I assign this to?']
      : ['When is my next session?', 'How do I reach my specialist?', 'What should I ask my coach?'];
  }
  if (p.includes('project') || p.includes('workflow')) {
    return role === 'admin'
      ? ['What is overdue this week?', 'Explain this workflow stage', 'Where is the bottleneck?']
      : ['What should I finish next?', 'Explain this project stage', 'What is due this week?'];
  }
  if (p.includes('partner') || p.includes('case') || p.includes('crm')) {
    return ['What needs attention first?', 'Explain today’s service risk', 'Where should I find this tool?'];
  }
  return role === 'admin'
    ? ['What needs attention first?', 'Explain today’s service risk', 'Where should I find this tool?']
    : ['What should I do next?', 'Explain my readiness score', 'What document should I upload?'];
}

export function ProductCopilotPanel({
  role,
  pageTitle,
  partnerId,
  dataMode,
  open,
  onOpenChange,
  navigationMode = 'live',
}: {
  role: WorkspaceProductRole;
  pageTitle: string;
  partnerId?: string;
  dataMode: 'demo' | 'real';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `live` targets real app routes on maximize; `preview` stays inside the workspace-light preview shell. */
  navigationMode?: 'preview' | 'live';
}) {
  const auth = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const firstName = auth.user ? getUserDisplayName(auth.user).split(/\s+/)[0] : role === 'admin' ? 'Admin' : 'Partner';
  const [draft, setDraft] = useState('');
  const [contextLabel, setContextLabel] = useState(pageTitle);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COPILOT_EXPANDED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [messages, setMessages] = useState<CopilotMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      text:
        role === 'admin'
          ? 'I’m ready to help you prioritize partner work, explain service signals, or find the right operating lane.'
          : 'I’m ready to explain your next credit step, documents, disputes, readiness, or lender-fit signals.',
      source: 'demo',
    },
  ]);
  const [locale, setLocale] = useState<ChatLocale>(() => {
    try {
      const stored = localStorage.getItem(COPILOT_LOCALE_KEY) as ChatLocale | null;
      return stored && CHAT_LOCALE_ORDER.includes(stored) ? stored : 'en';
    } catch {
      return 'en';
    }
  });
  const [localeOpen, setLocaleOpen] = useState(false);

  // Same shared hook the Hub AI coach and calendar dictation use — the copilot must not grow
  // its own speech implementation or it will drift from the rest of the workspace.
  const voice = useFinelyVoiceInput({
    onResult: (text) => setDraft((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text)),
  });

  const composerText = useMemo(() => {
    if (!voice.listening || !voice.interimTranscript) return draft;
    const base = draft.trim();
    const interim = voice.interimTranscript.trim();
    return base ? `${base} ${interim}` : interim;
  }, [draft, voice.listening, voice.interimTranscript]);

  const quickPrompts = useMemo(() => deriveContextualPrompts(pathname, role), [pathname, role]);

  const messagesWorkspaceNavItem = useMemo(
    () => getWorkspaceProductNavItem(role, role === 'admin' ? 'communications' : 'messages'),
    [role],
  );

  const fullWorkspacePath = (tab: HubHandoffTab) => {
    const fallback =
      navigationMode === 'preview'
        ? role === 'admin'
          ? '/preview/workspace-light/admin/communications'
          : '/preview/workspace-light/portal/messages'
        : role === 'admin'
          ? '/admin/comms'
          : '/portal/messages';
    const basePath =
      navigationMode === 'preview'
        ? messagesWorkspaceNavItem?.path
        : messagesWorkspaceNavItem?.legacyPath ?? messagesWorkspaceNavItem?.livePath;
    return `${basePath ?? fallback}?hub=${tab}&openHub=1`;
  };

  const openFullWorkspace = (tab: HubHandoffTab = 'ai') => {
    try {
      sessionStorage.setItem(
        COPILOT_HANDOFF_KEY,
        JSON.stringify({ pageTitle, contextLabel, draft, transcript: messages, ts: Date.now() }),
      );
    } catch {
      // Best-effort context carry — never block navigation on storage failures.
    }
    onOpenChange(false);
    navigate(fullWorkspacePath(tab));
  };

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<ProductCopilotOpenDetail>).detail ?? {};
      if (detail.prompt) setDraft(detail.prompt);
      setContextLabel(detail.contextLabel || pageTitle);
      onOpenChange(true);
      requestAnimationFrame(() => inputRef.current?.focus());
    };
    window.addEventListener(OPEN_PRODUCT_COPILOT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_PRODUCT_COPILOT_EVENT, onOpen);
  }, [onOpenChange, pageTitle]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', onKeyDown);
    requestAnimationFrame(() => inputRef.current?.focus());
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onOpenChange, open]);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
  }, [busy, messages]);

  useEffect(() => {
    try {
      localStorage.setItem(COPILOT_EXPANDED_KEY, expanded ? '1' : '0');
    } catch {
      // Best-effort persistence — never block the UI on storage failures.
    }
  }, [expanded]);

  useEffect(() => {
    try {
      localStorage.setItem(COPILOT_LOCALE_KEY, locale);
    } catch {
      // Language choice is a convenience — never block the UI on storage failures.
    }
  }, [locale]);

  const toggleExpanded = () => {
    if (typeof window !== 'undefined' && window.matchMedia?.(COPILOT_MOBILE_QUERY).matches) return;
    setExpanded((current) => !current);
  };

  const submit = async () => {
    const text = draft.trim();
    if (!text || busy) return;

    if (voice.listening) voice.stop();

    // Typing in Kreyòl (or any supported language) switches the reply language without
    // making the partner hunt for the picker — same behaviour as the public chat.
    const detected = detectLocaleFromText(text);
    const activeLocale = detected ?? locale;
    if (detected && detected !== locale) setLocale(detected);

    const nextUser: CopilotMessage = { id: messageId('user'), role: 'user', text };
    const history = [...messages, nextUser];
    setMessages(history);
    setDraft('');
    setBusy(true);

    try {
      if (dataMode === 'demo') {
        const result = finelyPublicAnswer({
          pathname,
          message: text,
          channel: 'chat',
          seniorMode: false,
        });
        setMessages((current) => [
          ...current,
          { id: messageId('assistant'), role: 'assistant', text: result.reply, source: 'demo' },
        ]);
      } else {
        const aiMessages: AiGatewayMessage[] = history.map((message) => ({
          role: message.role,
          content: message.text,
        }));
        const result = await converseWithFinelyAi({
          messages: aiMessages,
          userMessage: text,
          taskType: role === 'admin' ? 'admin_workspace_copilot' : 'partner_workspace_copilot',
          systemPromptBase: `${
            role === 'admin'
              ? 'You are Ask Finely inside the Finely Cred admin workspace. Be concise, evidence-based, and operational. Explain what the visible signal means, what to do next, and where to open the work. Never invent partner facts.'
              : 'You are Ask Finely inside the Finely Cred partner portal. Give calm, plain-English, evidence-based guidance about reports, disputes, documents, readiness, and next steps. Never guarantee outcomes and never give legal advice.'
          }\n\n${localeInstruction(activeLocale)}`,
          context: {
            locale: activeLocale,
            surface: 'communication_hub',
            partnerId,
            pathname,
            userName: auth.user ? getUserDisplayName(auth.user) : undefined,
            lane: role === 'admin' ? 'admin_operations' : 'partner_credit',
            journeyStage: pageTitle,
            conversationalAddendum: `Current product surface: ${pageTitle}. Context selected in the interface: ${contextLabel}.`,
          },
        });
        setMessages((current) => [
          ...current,
          { id: messageId('assistant'), role: 'assistant', text: result.text, source: result.source },
        ]);
      }
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: messageId('assistant'),
          role: 'assistant',
          text: 'I could not reach the live assistant just now. Your workspace is still available—try again or open the full messages workspace.',
          source: 'knowledge_local',
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {!open ? (
        <button
          type="button"
          className="fc-wlp-copilot-launcher"
          onClick={() => onOpenChange(true)}
          aria-label="Open Ask Finely"
        >
          <span className="fc-wlp-copilot-launcher-icon">
            <Sparkles size={22} strokeWidth={2.2} />
          </span>
          <span className="fc-wlp-copilot-launcher-copy">
            <strong>Ask Finely</strong>
            <span>Get your next step</span>
          </span>
          <MessageCircle size={18} aria-hidden />
        </button>
      ) : null}

      {open ? (
        <section
          className={`fc-wlp-copilot fc-wlp-copilot--rich${expanded ? ' fc-wlp-copilot--expanded' : ''}`}
          role="dialog"
          aria-modal="false"
          aria-label="Ask Finely chat"
        >
          <div className="fc-wlp-copilot-depth-layer fcm-depth" data-bed="dark" data-fcm-accent="violet" aria-hidden />
          <span className="fcm-grain" aria-hidden />

          <div className="fc-wlp-copilot-content">
            <header className="fc-wlp-copilot-head">
              <span className="fc-wlp-copilot-avatar">
                <Bot size={21} strokeWidth={2.1} />
              </span>
              <span className="fc-wlp-copilot-title">
                <strong>Ask Finely</strong>
                <span>
                  <i /> Ready · {contextLabel}
                </span>
              </span>
              <button
                type="button"
                className="fc-wlp-copilot-expand-btn"
                onClick={toggleExpanded}
                aria-label={expanded ? 'Collapse Ask Finely' : 'Expand Ask Finely'}
                aria-pressed={expanded}
                title={expanded ? 'Collapse chat' : 'Expand chat'}
              >
                {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button type="button" onClick={() => onOpenChange(false)} aria-label="Minimize Ask Finely">
                <ChevronDown size={17} />
              </button>
              <button type="button" onClick={() => onOpenChange(false)} aria-label="Close Ask Finely">
                <X size={17} />
              </button>
            </header>

            <div className="fc-wlp-copilot-context">
              <Sparkles size={13} />
              <span>{dataMode === 'demo' ? 'Workspace guidance · connected knowledge' : `Workspace guidance for ${firstName}`}</span>
            </div>

            <div className="fc-wlp-copilot-hub-row" aria-label="Communication hub shortcuts">
              <button type="button" className="fc-wlp-copilot-hub-chip" onClick={() => openFullWorkspace('meetings')}>
                <Calendar size={12} /> Book a session
              </button>
              <button type="button" className="fc-wlp-copilot-hub-chip" onClick={() => openFullWorkspace('team')}>
                <Users size={12} /> Team chat
              </button>
              <button type="button" className="fc-wlp-copilot-hub-chip" onClick={() => openFullWorkspace('guide')}>
                <Compass size={12} /> Hub guide
              </button>
            </div>

            <div className="fc-wlp-copilot-messages" ref={messagesRef} aria-live="polite">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className="fc-wlp-copilot-message"
                  data-role={message.role}
                  dir={isRtlLocale(locale) ? 'rtl' : 'ltr'}
                >
                  <div>{message.text}</div>
                  {message.role === 'assistant' ? (
                    <span className="fc-wlp-copilot-message-foot">
                      {message.source
                        ? message.source === 'gateway'
                          ? 'Live intelligence'
                          : message.source === 'demo'
                            ? 'Demo guidance'
                            : 'Finely knowledge'
                        : null}
                      <button
                        type="button"
                        className="fc-wlp-copilot-speak-btn"
                        onClick={() => speakFinelyText(message.text)}
                        title="Read this answer aloud"
                        aria-label="Read this answer aloud"
                      >
                        <Volume2 size={13} />
                      </button>
                    </span>
                  ) : null}
                </article>
              ))}
              {busy ? (
                <div className="fc-wlp-copilot-typing" aria-label="Ask Finely is typing">
                  <i />
                  <i />
                  <i />
                </div>
              ) : null}
            </div>

            <div className="fc-wlp-copilot-prompts" aria-label="Suggested prompts">
              {quickPrompts.map((prompt) => (
                <button key={prompt} type="button" onClick={() => setDraft(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>

            <form
              className="fc-wlp-copilot-compose"
              onSubmit={(event) => {
                event.preventDefault();
                void submit();
              }}
            >
              <textarea
                ref={inputRef}
                value={composerText}
                rows={2}
                dir={isRtlLocale(locale) ? 'rtl' : 'ltr'}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void submit();
                  }
                }}
                placeholder={
                  voice.listening ? 'Listening… speak now' : `${t(locale, 'sendPlaceholder')}`
                }
                aria-label="Message Ask Finely"
              />
              {voice.supported ? (
                <button
                  type="button"
                  className="fc-wlp-copilot-mic-btn"
                  data-listening={voice.listening ? 'true' : undefined}
                  onClick={() => (voice.listening ? voice.stop() : voice.start())}
                  title={voice.listening ? 'Stop dictation' : 'Dictate your message'}
                  aria-label={voice.listening ? 'Stop dictation' : 'Dictate your message'}
                  aria-pressed={voice.listening}
                >
                  <Mic size={16} />
                </button>
              ) : null}
              <button type="submit" disabled={!composerText.trim() || busy} aria-label="Send message">
                <Send size={17} />
              </button>
            </form>

            <div className="fc-wlp-copilot-locale">
              <button
                type="button"
                className="fc-wlp-copilot-locale-btn"
                onClick={() => setLocaleOpen((current) => !current)}
                aria-expanded={localeOpen}
                title={t(locale, 'language')}
              >
                <Globe size={13} /> {CHAT_LOCALE_LABELS[locale]}
              </button>
              {localeOpen ? (
                <div className="fc-wlp-copilot-locale-menu" role="listbox" aria-label={t(locale, 'language')}>
                  {CHAT_LOCALE_ORDER.map((code) => (
                    <button
                      key={code}
                      type="button"
                      role="option"
                      aria-selected={locale === code}
                      data-active={locale === code ? 'true' : undefined}
                      onClick={() => {
                        setLocale(code);
                        setLocaleOpen(false);
                      }}
                    >
                      {CHAT_LOCALE_LABELS[code]}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <footer className="fc-wlp-copilot-foot">
              <span>Results vary · not legal advice · funding subject to underwriting</span>
              <button type="button" onClick={() => openFullWorkspace('ai')}>
                Open communication hub
              </button>
            </footer>
          </div>
        </section>
      ) : null}
    </>
  );
}
