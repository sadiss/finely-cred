import React, { useMemo } from 'react';
import {
  HAITIAN_COLLECTOR_LETTER as LETTER,
  HAITIAN_LETTER_MEANING_VOICE as VOICE,
  formatHaitianLetterDate,
} from '../../../../lib/haitianLetterMeaningCopy';
import './haitianCollectorLetterPreview.css';

export function HaitianCollectorLetterPreview() {
  const letterDate = useMemo(() => formatHaitianLetterDate(), []);

  return (
    <div className="fc-ht-paper-stack">
      <article className="fc-ht-paper" aria-label="Sample collector letter">
        <div className="fc-ht-paper__navy">{LETTER.sampleBanner}</div>
        <div className="fc-ht-paper__body">
          <p className="fc-ht-paper__name">{LETTER.collectorName}</p>
          <p className="fc-ht-paper__unit">{LETTER.collectorUnit}</p>
          <p className="fc-ht-paper__addr">{LETTER.collectorAddress}</p>
          <p className="fc-ht-paper__addr">{LETTER.collectorCityLine}</p>
          <hr className="fc-ht-paper__rule" />
          <p className="fc-ht-paper__meta">{letterDate}</p>
          <p className="fc-ht-paper__meta">
            {LETTER.accountRefLabel}: {LETTER.accountRef}
          </p>
          <p className="fc-ht-paper__re">{LETTER.reLine}</p>
          <p className="fc-ht-paper__hi">{LETTER.salutation}</p>
          <p className="fc-ht-paper__artifact">{LETTER.artifactLine}</p>
          <p className="fc-ht-paper__p">{LETTER.validationParagraph}</p>
          <p className="fc-ht-paper__close">{LETTER.closing}</p>
          <p className="fc-ht-paper__sign">{LETTER.signoffName}</p>
          <p className="fc-ht-paper__unit">{LETTER.signoffUnit}</p>
          <p className="fc-ht-paper__foot">{LETTER.footer}</p>
        </div>
      </article>

      <article className="fc-ht-paper" aria-label="Two-voice meaning sheet">
        <div className="fc-ht-paper__navy">
          {VOICE.title} · {VOICE.titleHt}
        </div>
        <div className="fc-ht-paper__body">
          <p className="fc-ht-paper__kicker">{VOICE.artifactLabel}</p>
          <p className="fc-ht-paper__artifact">{LETTER.artifactLine}</p>
          <hr className="fc-ht-paper__rule" />
          <p className="fc-ht-paper__kicker">{VOICE.meaningLabel}</p>
          <p className="fc-ht-paper__p">{VOICE.meaningHt}</p>
          <hr className="fc-ht-paper__rule" />
          <p className="fc-ht-paper__kicker">
            {VOICE.wordsHeading} / {VOICE.wordsHeadingHt}
          </p>
          {VOICE.words.map((word) => (
            <p key={word.en} className="fc-ht-paper__word">
              <span>{word.en}</span>
              <span>= {word.ht}</span>
            </p>
          ))}
          <hr className="fc-ht-paper__rule" />
          <p className="fc-ht-paper__kicker">
            {VOICE.nextStepHeading} / {VOICE.nextStepHeadingHt}
          </p>
          <p className="fc-ht-paper__artifact">{VOICE.nextStepEn}</p>
          <p className="fc-ht-paper__p">{VOICE.nextStepHt}</p>
          <p className="fc-ht-paper__foot">{VOICE.footer}</p>
        </div>
      </article>
    </div>
  );
}
