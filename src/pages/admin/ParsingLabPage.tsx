import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Clipboard, FlaskConical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { parseCreditReportHtml } from '../../creditReports/parseHtmlReport';
import { detectProviderFromText } from '../../creditReports/detectProvider';
import { detectReportDateFromText } from '../../creditReports/parsePdfText';
import { parseCreditReportText } from '../../creditReports/parseTextReport';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsInlineListItem,
} from '../../features/os/finelyOsLightUi';

function safeJson(x: any) {
  try {
    return JSON.stringify(x, null, 2);
  } catch {
    return String(x);
  }
}

export default function ParsingLabPage() {
  const navigate = useNavigate();
  const [html, setHtml] = useState('');
  const [pdfText, setPdfText] = useState('');
  const [parsedJson, setParsedJson] = useState<string>('');
  const [notice, setNotice] = useState<string | null>(null);

  const parsed = useMemo(() => {
    if (!html.trim()) return null;
    try {
      const p = parseCreditReportHtml(html);
      return p;
    } catch (e: any) {
      return { error: e?.message || 'Parse failed.' } as any;
    }
  }, [html]);

  const pdfHints = useMemo(() => {
    const t = pdfText.trim();
    if (!t) return null;
    const parsedResult = (() => {
      try {
        return parseCreditReportText(t);
      } catch (e: any) {
        return { error: e?.message || 'Parse failed.' } as any;
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
      setNotice('Copied.');
      setTimeout(() => setNotice(null), 1200);
    } catch {
      setNotice('Copy failed.');
      setTimeout(() => setNotice(null), 1200);
    }
  };

  const statTile = (label: string, value: React.ReactNode) => (
    <div className={`${finelyOsInlineListItem()} p-4`}>
      <div className={FINELY_OS_ENTITY_SUBLABEL}>{label}</div>
      <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>{value}</div>
    </div>
  );

  return (
    <PageShell
      badge="Admin"
      title="Parsing Lab"
      subtitle="Paste report HTML or extracted PDF text to validate ingestion coverage and debug signals. This is a regression harness for parser improvements."
    >
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK} title="Back to Admin Dashboard">
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>parsing_lab</div>
        </div>

        {notice && <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div>}

        <div className="grid lg:grid-cols-2 gap-6">
          <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
            <div className={`inline-flex items-center gap-3 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>
              <FlaskConical size={18} />
              <span>HTML report</span>
            </div>
            <p className={FINELY_OS_ENTITY_BODY}>
              Paste exported HTML (IdentityIQ / MyScoreIQ). We parse tradelines, scores, sections, and debug coverage.
            </p>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className={`${FINELY_OS_ENTITY_INPUT} min-h-[260px] font-mono text-[11px]`}
              placeholder="Paste HTML here…"
            />

            {parsed && !(parsed as any).error && (
              <div className="grid grid-cols-2 gap-3">
                {statTile('Provider', (parsed as any).provider)}
                {statTile('Report date', (parsed as any).reportDate || '—')}
                {statTile('Tradelines', ((parsed as any).tradelines?.length ?? 0).toString())}
                {statTile('Scores', ((parsed as any).scores?.length ?? 0).toString())}
              </div>
            )}

            {parsed && (parsed as any).error && <div className={FINELY_OS_NOTICE_ERROR}>{(parsed as any).error}</div>}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  const json = safeJson(parsed);
                  setParsedJson(json);
                  void copy(json);
                }}
                className={FINELY_OS_SECONDARY_BTN}
                disabled={!parsed}
              >
                <Clipboard size={14} /> Copy parsed JSON
              </button>
              <button type="button" onClick={() => setHtml('')} className={FINELY_OS_SECONDARY_BTN}>
                Clear
              </button>
            </div>
          </div>

          <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
            <div className={`inline-flex items-center gap-3 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>
              <FlaskConical size={18} />
              <span>PDF extracted text</span>
            </div>
            <p className={FINELY_OS_ENTITY_BODY}>
              Paste extracted text (from our PDF extractor). We’ll detect provider/date hints and show coverage.
            </p>
            <textarea
              value={pdfText}
              onChange={(e) => setPdfText(e.target.value)}
              className={`${FINELY_OS_ENTITY_INPUT} min-h-[260px] font-mono text-[11px]`}
              placeholder="Paste extracted PDF text here…"
            />

            {pdfHints && (
              <div className="grid grid-cols-2 gap-3">
                {statTile('Provider hint', pdfHints.provider)}
                {statTile('Report date hint', pdfHints.reportDate || '—')}
                {pdfHints.parsed && !(pdfHints.parsed as any).error ? (
                  <>
                    {statTile('PDF tradelines', ((pdfHints.parsed as any).tradelines?.length ?? 0).toString())}
                    {statTile('PDF scores', ((pdfHints.parsed as any).scores?.length ?? 0).toString())}
                  </>
                ) : null}
                <div className={`${finelyOsInlineListItem()} p-4 col-span-2`}>
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Coverage</div>
                  <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} font-mono text-xs`}>
                    {pdfHints.chars.toLocaleString()} chars • first line: {pdfHints.firstLine.slice(0, 120)}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => void copy(pdfText)} className={FINELY_OS_SECONDARY_BTN} disabled={!pdfText.trim()}>
                <Clipboard size={14} /> Copy text
              </button>
              <button type="button" onClick={() => setPdfText('')} className={FINELY_OS_SECONDARY_BTN}>
                Clear
              </button>
            </div>
          </div>
        </div>

        {parsedJson && (
          <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-3`}>
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>Latest parsed JSON</div>
            <pre className={`whitespace-pre-wrap break-words text-[11px] font-mono ${FINELY_OS_ENTITY_BODY}`}>
              {parsedJson.slice(0, 60_000)}
            </pre>
            <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
              Tip: paste this JSON into a ticket when we find a new export variant that breaks parsing.
            </div>
          </div>
        )}

        <div className={`${FINELY_OS_BANNER} space-y-3`}>
          <div className={FINELY_OS_ENTITY_VALUE}>Next improvement loop</div>
          <ol className={`${FINELY_OS_ENTITY_BODY} space-y-1 list-decimal list-inside`}>
            <li>Paste an export that parses poorly (0 tradelines, unknown provider/date, etc.).</li>
            <li>Copy the parsed JSON + debug signals.</li>
            <li>We extend selectors/patterns in the parser and retest here.</li>
          </ol>
          <button type="button" onClick={() => navigate('/admin/partners')} className={FINELY_OS_PRIMARY_BTN}>
            Open Partner Management <ArrowRight size={14} />
          </button>
        </div>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
