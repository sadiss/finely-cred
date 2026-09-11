import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Clipboard, FileJson, FlaskConical, Layers, ListOrdered, Type, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { parseCreditReportHtml } from '../../../../creditReports/parseHtmlReport';
import { detectProviderFromText } from '../../../../creditReports/detectProvider';
import { detectReportDateFromText } from '../../../../creditReports/parsePdfText';
import { parseCreditReportText } from '../../../../creditReports/parseTextReport';
import { FinelyOsOverviewStatTile } from '../../../os/FinelyOsOverviewStatTile';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsGlowTextarea,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';

type LabMode = 'html' | 'pdf' | 'output';

const LAB_MODES: Array<{
  id: LabMode;
  label: string;
  hint: string;
  icon: typeof FlaskConical;
  accent: 'emerald' | 'violet' | 'sky';
}> = [
  { id: 'html', label: 'HTML report', hint: 'IdentityIQ / MyScoreIQ exports', icon: Layers, accent: 'violet' },
  { id: 'pdf', label: 'PDF text', hint: 'Extracted bureau text', icon: Type, accent: 'sky' },
  { id: 'output', label: 'Parsed JSON', hint: 'Ticket-ready output', icon: FileJson, accent: 'emerald' },
];

function safeJson(x: unknown) {
  try {
    return JSON.stringify(x, null, 2);
  } catch {
    return String(x);
  }
}

export default function AdminParsingLabProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'sky';

  const [mode, setMode] = useState<LabMode>('html');
  const [html, setHtml] = useState('');
  const [pdfText, setPdfText] = useState('');
  const [parsedJson, setParsedJson] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [signalsOpen, setSignalsOpen] = useState(false);

  const parsed = useMemo(() => {
    if (!html.trim()) return null;
    try {
      return parseCreditReportHtml(html);
    } catch (e: unknown) {
      return { error: (e as Error)?.message || 'Parse failed.' };
    }
  }, [html]);

  const pdfHints = useMemo(() => {
    const t = pdfText.trim();
    if (!t) return null;
    const parsedResult = (() => {
      try {
        return parseCreditReportText(t);
      } catch (e: unknown) {
        return { error: (e as Error)?.message || 'Parse failed.' };
      }
    })();
    return {
      provider: detectProviderFromText(t),
      reportDate: detectReportDateFromText(t),
      chars: t.length,
      firstLine: t.split(/\r?\n/).slice(0, 1)[0] ?? '',
      parsed: parsedResult,
    };
  }, [pdfText]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice('Copied to clipboard.');
      setTimeout(() => setNotice(null), 1400);
    } catch {
      setNotice('Copy failed — check browser permissions.');
      setTimeout(() => setNotice(null), 1400);
    }
  };

  const copyParsedJson = () => {
    const source = mode === 'pdf' && pdfHints?.parsed ? pdfHints.parsed : parsed;
    const json = safeJson(source);
    setParsedJson(json);
    setMode('output');
    void copy(json);
  };

  const activeCanvasAccent = mode === 'html' ? 'violet' : mode === 'pdf' ? 'sky' : 'emerald';

  const htmlTradelines =
    parsed && !('error' in parsed) ? String((parsed as { tradelines?: unknown[] }).tradelines?.length ?? 0) : '—';
  const htmlScores =
    parsed && !('error' in parsed) ? String((parsed as { scores?: unknown[] }).scores?.length ?? 0) : '—';
  const pdfTradelines =
    pdfHints?.parsed && !('error' in pdfHints.parsed)
      ? String((pdfHints.parsed as { tradelines?: unknown[] }).tradelines?.length ?? 0)
      : '—';
  const pdfScores =
    pdfHints?.parsed && !('error' in pdfHints.parsed)
      ? String((pdfHints.parsed as { scores?: unknown[] }).scores?.length ?? 0)
      : '—';
  const providerHint =
    (parsed && !('error' in parsed) ? (parsed as { provider?: string }).provider : null) ??
    pdfHints?.provider ??
    '—';
  const reportDateHint =
    (parsed && !('error' in parsed) ? (parsed as { reportDate?: string }).reportDate : null) ??
    pdfHints?.reportDate ??
    '—';

  useEffect(() => {
    if (!signalsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSignalsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [signalsOpen]);

  const modeValue = (id: LabMode) => {
    if (id === 'html') return htmlTradelines;
    if (id === 'pdf') return pdfTradelines;
    return parsedJson ? 'Ready' : '—';
  };

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Studio"
      title="Parsing lab"
      description="Validate bureau exports before partners import bad tradelines or missing scores."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={navItem?.icon}
      primaryAction={
        <ProductPagePrimaryAction
          label="Copy parsed JSON"
          onClick={copyParsedJson}
          disabled={!parsed && !pdfHints?.parsed}
        />
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/partners')}>
          Partner records
        </button>
      }
      metrics={[
        {
          label: 'HTML tradelines',
          value: htmlTradelines,
          hint: 'From pasted HTML',
          accent: 'violet',
          onClick: () => setMode('html'),
        },
        {
          label: 'PDF tradelines',
          value: pdfTradelines,
          hint: 'From extracted text',
          accent: 'sky',
          onClick: () => setMode('pdf'),
        },
        {
          label: 'Provider',
          value: providerHint,
          hint: 'Detected bureau',
          accent: 'emerald',
          onClick: () => setSignalsOpen(true),
        },
        {
          label: 'Report date',
          value: reportDateHint,
          hint: 'Parsed or hinted',
          accent: 'rose',
          onClick: () => setSignalsOpen(true),
        },
      ]}
      metricTitle="Parser signals"
      metricDescription="Paste a sample export, then copy JSON for engineering tickets."
    >
      <span hidden data-surface-kind="real" data-surface-key={`admin:${pageId ?? 'parsing-lab'}`} />

      <div className={FINELY_OS_PAGE} data-surface-layout="command-deck">
        {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" role="tablist" aria-label="Parser modes">
          {LAB_MODES.map((tool) => {
            const Icon = tool.icon;
            const isActive = mode === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setMode(tool.id)}
                className={`${finelyOsCatalogCard(tool.accent)} p-6 lg:p-8 text-left min-h-[160px] flex flex-col gap-3 transition-all ${
                  isActive ? 'ring-2 ring-white/30 scale-[1.01]' : 'hover:shadow-lg'
                }`}
                data-fc-accent={tool.accent}
                aria-current={isActive ? 'true' : undefined}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[0.06]">
                    <Icon size={22} />
                  </span>
                  <span className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{modeValue(tool.id)}</span>
                </div>
                <div>
                  <div className="text-xl font-extrabold">{tool.label}</div>
                  <p className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{tool.hint}</p>
                </div>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setSignalsOpen(true)}
            className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8 text-left min-h-[160px] flex flex-col gap-3 transition-all hover:shadow-lg`}
            data-fc-accent="rose"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[0.06]">
                <FlaskConical size={22} />
              </span>
              <span className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{providerHint}</span>
            </div>
            <div>
              <div className="text-xl font-extrabold">Parser signals</div>
              <p className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                Tradelines, scores, and regression steps
              </p>
            </div>
          </button>
        </div>

        <section className={`${finelyOsCatalogCard(activeCanvasAccent)} p-6 lg:p-8 space-y-5`} data-fc-accent={activeCanvasAccent}>
          <div>
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
              <FlaskConical size={18} />
              <span>{LAB_MODES.find((m) => m.id === mode)?.label ?? 'Editor'}</span>
            </div>
            <h2 className="mt-2 text-3xl font-extrabold">
              {mode === 'html' ? 'HTML export' : mode === 'pdf' ? 'PDF text' : 'Parsed output'}
            </h2>
            <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
              {mode === 'html'
                ? 'Paste exported HTML. Tradelines, scores, sections, and coverage appear as you type.'
                : mode === 'pdf'
                  ? 'Paste text from our PDF extractor. Provider and date hints validate before import.'
                  : 'Latest parsed JSON — attach to a ticket when a bureau variant breaks.'}
            </p>
          </div>

          {mode === 'html' ? (
            <>
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                rows={16}
                className={`${finelyOsGlowTextarea('violet')} min-h-[320px] font-mono text-sm`}
                placeholder="Paste HTML here…"
                aria-label="HTML report paste area"
              />
              {parsed && 'error' in parsed ? <div className={FINELY_OS_NOTICE_ERROR}>{parsed.error}</div> : null}
              <div className="flex flex-wrap gap-3">
                <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={copyParsedJson} disabled={!parsed}>
                  <Clipboard size={14} /> Copy parsed JSON
                </button>
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setHtml('')}>
                  Clear HTML
                </button>
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setSignalsOpen(true)}>
                  Open signals
                </button>
              </div>
            </>
          ) : null}

          {mode === 'pdf' ? (
            <>
              <textarea
                value={pdfText}
                onChange={(e) => setPdfText(e.target.value)}
                rows={16}
                className={`${finelyOsGlowTextarea('sky')} min-h-[320px] font-mono text-sm`}
                placeholder="Paste extracted PDF text here…"
                aria-label="PDF extracted text paste area"
              />
              {pdfHints?.parsed && 'error' in pdfHints.parsed ? (
                <div className={FINELY_OS_NOTICE_ERROR}>{pdfHints.parsed.error}</div>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={FINELY_OS_PRIMARY_BTN}
                  onClick={() => void copy(pdfText)}
                  disabled={!pdfText.trim()}
                >
                  <Clipboard size={14} /> Copy text
                </button>
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setPdfText('')}>
                  Clear text
                </button>
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setSignalsOpen(true)}>
                  Open signals
                </button>
              </div>
            </>
          ) : null}

          {mode === 'output' ? (
            <>
              <pre
                className={`${finelyOsGlowTextarea('emerald')} min-h-[320px] whitespace-pre-wrap break-words font-mono text-sm overflow-auto max-h-[480px]`}
                aria-label="Parsed JSON output"
              >
                {parsedJson.slice(0, 60_000) || 'Run a parse on HTML or PDF text, then copy JSON here.'}
              </pre>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={FINELY_OS_PRIMARY_BTN}
                  onClick={() => void copy(parsedJson)}
                  disabled={!parsedJson}
                >
                  <Clipboard size={14} /> Copy again
                </button>
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setParsedJson('')}>
                  Clear output
                </button>
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setSignalsOpen(true)}>
                  Open signals
                </button>
              </div>
            </>
          ) : null}
        </section>
      </div>

      {signalsOpen ? (
        <div
          className="fc-wlp-local-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Parser signals"
          onClick={() => setSignalsOpen(false)}
        >
          <div
            className="fc-wlp-local-modal fc-wlp-wide-drawer p-6 lg:p-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className={FINELY_OS_ENTITY_SUBLABEL}>Parser signals</p>
                <h2 className={`mt-2 text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Live parse readout</h2>
                <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                  Tradelines, scores, provider, and date from the pasted export.
                </p>
              </div>
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setSignalsOpen(false)} aria-label="Close signals">
                <X size={14} /> Close
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FinelyOsOverviewStatTile
                icon={Layers}
                label="HTML tradelines"
                value={htmlTradelines}
                hint={`Scores ${htmlScores}`}
                accent="violet"
                iconAccent="violet"
              />
              <FinelyOsOverviewStatTile
                icon={Type}
                label="PDF tradelines"
                value={pdfTradelines}
                hint={`Scores ${pdfScores}`}
                accent="sky"
                iconAccent="sky"
              />
              <FinelyOsOverviewStatTile
                icon={FlaskConical}
                label="Provider"
                value={providerHint}
                hint="Detected bureau"
                accent="emerald"
                iconAccent="emerald"
              />
              <FinelyOsOverviewStatTile
                icon={FileJson}
                label="Report date"
                value={reportDateHint}
                hint="Parsed or hinted"
                accent="rose"
                iconAccent="rose"
              />
            </div>

            {pdfHints ? (
              <p className={`text-sm font-mono font-bold ${FINELY_OS_ENTITY_BODY}`}>
                {pdfHints.chars.toLocaleString()} chars · first line: {pdfHints.firstLine.slice(0, 120)}
              </p>
            ) : null}

            <div>
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <ListOrdered size={14} />
                <span>Regression steps</span>
              </div>
              <ol className={`${FINELY_OS_ENTITY_BODY} mt-3 grid gap-3 sm:grid-cols-3 list-none`}>
                <li className={`${finelyOsCatalogCard('emerald')} p-5 text-base font-bold`} data-fc-accent="emerald">
                  1. Paste an export that parses poorly.
                </li>
                <li className={`${finelyOsCatalogCard('violet')} p-5 text-base font-bold`} data-fc-accent="violet">
                  2. Copy parsed JSON and debug signals.
                </li>
                <li className={`${finelyOsCatalogCard('sky')} p-5 text-base font-bold`} data-fc-accent="sky">
                  3. Extend selectors, then retest here.
                </li>
              </ol>
              <button
                type="button"
                className={`${FINELY_OS_SECONDARY_BTN} mt-4`}
                onClick={() => navigate('/admin/partners')}
              >
                Open partner management <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
