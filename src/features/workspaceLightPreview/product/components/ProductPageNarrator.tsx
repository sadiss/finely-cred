import React, { useCallback, useEffect, useState } from 'react';
import { Square, Volume2 } from 'lucide-react';
import { speakFinelyText } from '../../../../hooks/useFinelyVoiceInput';

/**
 * Reads the current page aloud.
 *
 * Lives in the workspace chrome rather than on each surface deliberately: there are 40+
 * destinations, and a narrate button bolted onto each one would drift — some pages would get it,
 * some would not, and the ones that did would each phrase it differently. Reading the rendered
 * page instead means every destination is narratable the moment it exists, and the narration can
 * never describe something that is not actually on screen.
 *
 * What it reads, in order of preference: the page's "what to do next" guide (the part a partner
 * most often needs spoken), otherwise the command header. Both are pulled live from the DOM.
 */

function collect(selector: string): string {
  const el = document.querySelector(selector);
  if (!el) return '';
  return (el.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** Most on-screen copy already ends in a period; joining with another produces an audible stumble. */
function sentences(parts: string[]): string {
  return parts
    .filter(Boolean)
    .map((part) => part.replace(/[.\s]+$/, ''))
    .join('. ');
}

function buildNarration(): string {
  const header = collect('.fc-wlp-command-title');
  const summary = collect('.fc-wlp-command-copy');
  const guide = document.querySelector('.fc-wlp-page-guide');

  if (guide) {
    const heading = (guide.querySelector('h2')?.textContent ?? '').trim();
    const body = (guide.querySelector('p')?.textContent ?? '').trim();
    const steps = Array.from(guide.querySelectorAll('ol li'))
      .map((li, index) => `Step ${index + 1}. ${(li.textContent ?? '').trim()}`)
      .join(' ');
    const narration = sentences([header, heading, body, steps]);
    if (narration) return `${narration}.`;
  }

  const fallback = sentences([header, summary]);
  return fallback ? `${fallback}.` : '';
}

export function ProductPageNarrator() {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  // Navigating away mid-sentence would otherwise keep narrating the previous page.
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const toggle = useCallback(() => {
    if (speaking) {
      stop();
      return;
    }
    const text = buildNarration();
    if (!text) return;
    speakFinelyText(text);
    setSpeaking(true);
    // `speechSynthesis` has no reliable "finished" event across browsers when the utterance is
    // replaced, so poll the queue instead of trusting `onend`.
    const timer = window.setInterval(() => {
      if (!window.speechSynthesis?.speaking) {
        window.clearInterval(timer);
        setSpeaking(false);
      }
    }, 400);
  }, [speaking, stop]);

  if (!supported) return null;

  return (
    <button
      type="button"
      className="fc-wlp-utility-action"
      data-accent="sky"
      data-open={speaking ? 'true' : undefined}
      onClick={toggle}
      aria-label={speaking ? 'Stop reading this page' : 'Read this page aloud'}
      title={speaking ? 'Stop reading' : 'Read this page aloud'}
    >
      {speaking ? <Square size={14} fill="currentColor" /> : <Volume2 size={17} />}
      <span className="fc-wlp-utility-label">{speaking ? 'Stop' : 'Listen'}</span>
    </button>
  );
}
