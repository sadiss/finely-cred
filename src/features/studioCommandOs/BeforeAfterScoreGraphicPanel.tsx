import React, { useMemo, useRef, useState } from 'react';
import { CheckCircle2, Download, Save, Sparkles } from 'lucide-react';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsGlowField,
  finelyOsGlowTile,
} from '../os/finelyOsLightUi';
import { getFeaturedCaseStudies, type CaseStudy } from '../../data/caseStudiesRepo';
import { saveContentStudioAsset } from './contentStudioRepo';
import {
  BEFORE_AFTER_GRAPHIC_DISCLAIMER,
  BEFORE_AFTER_GRAPHIC_THEMES,
  BeforeAfterScoreGraphicCanvas,
  clampScore,
  downloadBeforeAfterGraphicPng,
  type BeforeAfterGraphicThemeId,
} from '../../components/proof/BeforeAfterScoreGraphicCanvas';

/**
 * Before/after credit-score comparison graphic generator.
 *
 * Deliverable 2 of the Deep Marketing & Proof Intelligence Sprint (Phase 6):
 * a real, additive Content Studio capability — renders a shareable before/after
 * proof graphic on an HTML5 canvas, seeded from the case-studies repository,
 * and saves it directly as a Content Studio image asset (Assets workroom →
 * approve → publish bridges), with zero new page/route surface.
 *
 * The canvas-drawing logic itself lives in `BeforeAfterScoreGraphicCanvas`
 * (`src/components/proof/`) so `src/pages/BeforeAfterGalleryPage.tsx` (the public
 * before/after proof gallery, Phase C2) can reuse the exact same rendering instead
 * of a second, drifting copy of the drawing code.
 */

const THEME_OPTIONS = BEFORE_AFTER_GRAPHIC_THEMES;
const DISCLAIMER = BEFORE_AFTER_GRAPHIC_DISCLAIMER;

export type BeforeAfterScoreGraphicPanelProps = {
  /** Fired after the graphic is saved into Content Studio assets. */
  onSaved?: () => void;
};

export function BeforeAfterScoreGraphicPanel({ onSaved }: BeforeAfterScoreGraphicPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [startingScore, setStartingScore] = useState(560);
  const [endingScore, setEndingScore] = useState(702);
  const [partnerAlias, setPartnerAlias] = useState('Alex P. — Your City, ST');
  const [themeId, setThemeId] = useState<BeforeAfterGraphicThemeId>('emerald');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const quickFillStudies = useMemo<CaseStudy[]>(
    () => getFeaturedCaseStudies(10).filter((cs) => typeof cs.startingScore === 'number' && typeof cs.endingScore === 'number'),
    [],
  );

  const delta = endingScore - startingScore;

  function downloadPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    downloadBeforeAfterGraphicPng(canvas, startingScore, endingScore);
  }

  function saveAsAsset() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    saveContentStudioAsset({
      title: `Before/after — ${partnerAlias || 'partner'} (${startingScore} → ${endingScore})`,
      assetType: 'image',
      status: 'draft',
      provider: 'manual',
      dataUrl,
      summary: `Credit score comparison graphic: ${startingScore} → ${endingScore} (${delta >= 0 ? '+' : ''}${delta}) for ${partnerAlias || 'a Finely Cred partner'}.`,
      publishTargets: ['social_clip'],
      complianceNotes: ['Verify alias and numbers against the source case study before public use.', DISCLAIMER],
    });
    setSavedNotice('Saved to Content Studio assets — review and approve it in the Assets workroom before publishing.');
    onSaved?.();
    window.setTimeout(() => setSavedNotice(null), 5000);
  }

  function applyCaseStudy(cs: CaseStudy) {
    if (typeof cs.startingScore === 'number') setStartingScore(cs.startingScore);
    if (typeof cs.endingScore === 'number') setEndingScore(cs.endingScore);
    setPartnerAlias(cs.partnerAlias);
  }

  return (
    <div className={`${finelyOsCatalogCardCompact('emerald')} space-y-3`}>
      <div>
        <p className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300 inline-flex items-center gap-1.5`}>
          <Sparkles size={12} /> Proof graphic generator
        </p>
        <h3 className={FINELY_OS_ENTITY_TITLE}>Before/after score comparison</h3>
        <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY} max-w-2xl`}>
          Pick a case study or type your own numbers — renders a shareable proof graphic for Miriam/social content, saved
          straight into Content Studio assets.
        </p>
      </div>

      {quickFillStudies.length ? (
        <div className="space-y-1.5">
          <div className={`text-[10px] uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>Quick-fill from case studies</div>
          <div className="flex flex-wrap gap-2">
            {quickFillStudies.map((cs) => (
              <button
                key={cs.id}
                type="button"
                onClick={() => applyCaseStudy(cs)}
                className={`${finelyOsGlowTile('emerald')} px-3 py-1.5 text-left text-[11px] font-semibold text-white/80`}
                title={cs.title}
              >
                {cs.partnerAlias.split('—')[0]?.trim()} · {cs.startingScore}→{cs.endingScore}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(220px,260px)]">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className={`text-[10px] uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>Before score</div>
              <input
                type="number"
                min={300}
                max={850}
                value={startingScore}
                onChange={(e) => setStartingScore(clampScore(Number(e.target.value)))}
                className={`${finelyOsGlowField('violet')} mt-1.5`}
              />
            </label>
            <label className="block">
              <div className={`text-[10px] uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>After score</div>
              <input
                type="number"
                min={300}
                max={850}
                value={endingScore}
                onChange={(e) => setEndingScore(clampScore(Number(e.target.value)))}
                className={`${finelyOsGlowField('emerald')} mt-1.5`}
              />
            </label>
          </div>
          <label className="block">
            <div className={`text-[10px] uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>Partner alias</div>
            <input
              type="text"
              value={partnerAlias}
              onChange={(e) => setPartnerAlias(e.target.value)}
              placeholder="First name + last initial — City, ST"
              className={`${finelyOsGlowField('sky')} mt-1.5`}
            />
          </label>

          <div className="space-y-1.5">
            <div className={`text-[10px] uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>Theme</div>
            <div className="flex flex-wrap gap-2">
              {THEME_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setThemeId(t.id)}
                  className={`${finelyOsGlowTile(t.glow, themeId === t.id)} px-3 py-1.5 text-[11px] font-semibold text-white/85`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {savedNotice ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-100 inline-flex items-start gap-2">
              <CheckCircle2 size={14} className="shrink-0 mt-0.5" /> {savedNotice}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={saveAsAsset}>
              <Save size={14} /> Save to Content Studio
            </button>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={downloadPng}>
              <Download size={14} /> Download PNG
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <BeforeAfterScoreGraphicCanvas
            ref={canvasRef}
            startingScore={startingScore}
            endingScore={endingScore}
            partnerAlias={partnerAlias}
            themeId={themeId}
          />
          <p className="text-[10px] text-white/35 text-center">Live preview · exports at 1080×1080</p>
        </div>
      </div>
    </div>
  );
}
