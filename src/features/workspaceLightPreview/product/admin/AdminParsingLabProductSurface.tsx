import React, { useMemo, useState } from 'react';
import { ArrowRight, Clipboard, FileJson, FlaskConical, Layers, ListOrdered, Type } from 'lucide-react';
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
  const pdfTradelines =
    pdfHints?.parsed && !('error' in pdfHints.parsed)
      ? String((pdfHints.parsed as { tradelines?: unknown[] }).tradelines?.length ?? 0)
      : '—';
  const providerHint =
    (parsed && !('error' in parsed) ? (parsed as { provider?: string }).provider : null) ??
    pdfHints?.provider ??
    '—';
  const reportDateHint =
    (parsed && !('error' in parsed) ? (parsed as { reportDate?: string }).reportDate : null) ??
    pdfHints?.reportDate ??
    '—';

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
        },
        {
          label: 'Report date',
          value: reportDateHint,
          hint: 'Parsed or hinted',
          accent: 'rose',
        },
      ]}
      metricTitle="Parser signals"
      metricDescription="Paste a sample export, then copy JSON for engineering tickets."
    >
      <span hidden data-surface-kind="real" data-surface-key={`admin:${pageId ?? 'parsing-lab'}`} />

      <div className={FINELY_OS_PAGE} data-surface-layout="split-workbench">
        {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}

        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Navigator + signal inspector */}
          <aside className="lg:col-span-4 space-y-4">
            <nav
              className={`${finelyOsCatalogCard('rose')} p-5 lg:p-6 space-y-4`}
              data-fc-accent="rose"
              aria-label="Parser modes"
            >
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <FlaskConical size={16} />
                <span>Parser modes</span>
              </div>
              <div className="space-y-2">
                {LAB_MODES.map((tool) => {
                  const Icon = tool.icon;
                  const isActive = mode === tool.id;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => setMode(tool.id)}
                      className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${
                        isActive
                          ? tool.accent === 'emerald'
                            ? 'border-emerald-400/40 bg-emerald-500/15'
                            : tool.accent === 'violet'
                              ? 'border-violet-400/40 bg-violet-500/15'
                              : 'border-sky-400/40 bg-sky-500/15'
                          : 'border-white/10 bg-black/20 hover:border-white/25'
                      }`}
                      data-fc-accent={isActive ? tool.accent : undefined}
                      aria-current={isActive ? 'true' : undefined}
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={16} />
                        <span className="text-base font-extrabold">{tool.label}</span>
                      </div>
                      <p className={`mt-1 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{tool.hint}</p>
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className={`${finelyOsCatalogCard('violet')} p-5 lg:p-6 space-y-4`} data-fc-accent="violet">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Live signals</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <FinelyOsOverviewStatTile
                  icon={Layers}
                  label="HTML tradelines"
                  value={htmlTradelines}
                  hint="Pasted export"
                  accent="violet"
                  iconAccent="violet"
                />
                <FinelyOsOverviewStatTile
                  icon={Type}
                  label="PDF tradelines"
                  value={pdfTradelines}
                  hint="Extracted text"
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
                  accent="fuchsia"
                  iconAccent="fuchsia"
                />
              </div>
            </div>

            <div className={`${finelyOsCatalogCard('emerald')} p-5 lg:p-6 space-y-3`} data-fc-accent="emerald">
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <ListOrdered size={14} />
                <span>Regression steps</span>
              </div>
              <ol className={`${FINELY_OS_ENTITY_BODY} space-y-2 list-decimal list-inside text-base font-semibold`}>
                <li>Paste an export that parses poorly.</li>
                <li>Copy parsed JSON and debug signals.</li>
                <li>Extend selectors, then retest here.</li>
              </ol>
              <button
                type="button"
                className={`${FINELY_OS_SECONDARY_BTN} w-full`}
                onClick={() => navigate('/admin/partners')}
              >
                Open partner management <ArrowRight size={14} />
              </button>
            </div>
          </aside>

          {/* Workbench canvas */}
          <section
            className={`lg:col-span-8 space-y-5 ${finelyOsCatalogCard(activeCanvasAccent)} p-6 lg:p-8`}
            data-fc-accent={activeCanvasAccent}
          >
            <div>
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <FlaskConical size={18} />
                <span>{LAB_MODES.find((m) => m.id === mode)?.label ?? 'Editor'}</span>
              </div>
              <h2 className="mt-2 text-3xl font-extrabold">
                {mode === 'html' ? 'HTML export workbench' : mode === 'pdf' ? 'PDF text workbench' : 'Parsed output'}
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
                {parsed && !('error' in parsed) ? (
                  <div className={`${finelyOsCatalogCard('sky')} p-5 space-y-2`} data-fc-accent="sky">
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>HTML parse summary</div>
                    <div className={`grid grid-cols-2 gap-3 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                      <div>
                        Provider:{' '}
                        <span className={FINELY_OS_ENTITY_VALUE}>
                          {(parsed as { provider?: string }).provider ?? '—'}
                        </span>
                      </div>
                      <div>
                        Report date:{' '}
                        <span className={FINELY_OS_ENTITY_VALUE}>
                          {(parsed as { reportDate?: string }).reportDate || '—'}
                        </span>
                      </div>
                      <div>
                        Tradelines:{' '}
                        <span className={FINELY_OS_ENTITY_VALUE}>
                          {(parsed as { tradelines?: unknown[] }).tradelines?.length ?? 0}
                        </span>
                      </div>
                      <div>
                        Scores:{' '}
                        <span className={FINELY_OS_ENTITY_VALUE}>
                          {(parsed as { scores?: unknown[] }).scores?.length ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={copyParsedJson} disabled={!parsed}>
                    <Clipboard size={14} /> Copy parsed JSON
                  </button>
                  <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setHtml('')}>
                    Clear HTML
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
                {pdfHints ? (
                  <div className={`${finelyOsCatalogCard('violet')} p-5 space-y-2`} data-fc-accent="violet">
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>PDF text summary</div>
                    <div className={`grid grid-cols-2 gap-3 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                      <div>
                        Provider hint: <span className={FINELY_OS_ENTITY_VALUE}>{pdfHints.provider}</span>
                      </div>
                      <div>
                        Report date hint: <span className={FINELY_OS_ENTITY_VALUE}>{pdfHints.reportDate || '—'}</span>
                      </div>
                      {pdfHints.parsed && !('error' in pdfHints.parsed) ? (
                        <>
                          <div>
                            PDF tradelines:{' '}
                            <span className={FINELY_OS_ENTITY_VALUE}>
                              {(pdfHints.parsed as { tradelines?: unknown[] }).tradelines?.length ?? 0}
                            </span>
                          </div>
                          <div>
                            PDF scores:{' '}
                            <span className={FINELY_OS_ENTITY_VALUE}>
                              {(pdfHints.parsed as { scores?: unknown[] }).scores?.length ?? 0}
                            </span>
                          </div>
                        </>
                      ) : null}
                    </div>
                    <div className={`mt-2 text-sm font-mono font-bold ${FINELY_OS_ENTITY_BODY}`}>
                      {pdfHints.chars.toLocaleString()} chars · first line: {pdfHints.firstLine.slice(0, 120)}
                    </div>
                  </div>
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
                </div>
              </>
            ) : null}
          </section>
        </div>
      </div>

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
