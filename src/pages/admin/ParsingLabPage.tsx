import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Clipboard, FlaskConical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { parseCreditReportHtml } from '../../creditReports/parseHtmlReport';
import { detectProviderFromText } from '../../creditReports/detectProvider';
import { detectReportDateFromText } from '../../creditReports/parsePdfText';
import { parseCreditReportText } from '../../creditReports/parseTextReport';

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
    const parsed = (() => {
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
      parsed,
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

  return (
    <PageShell
      badge="Admin"
      title="Parsing Lab"
      subtitle="Paste report HTML or extracted PDF text to validate ingestion coverage and debug signals. This is a regression harness for parser improvements."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
            title="Back to Admin Dashboard"
          >
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">parsing_lab</div>
        </div>

        {notice && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            {notice}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <FlaskConical size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">HTML report</span>
            </div>
            <p className="text-white/60 text-sm">
              Paste exported HTML (IdentityIQ / MyScoreIQ). We parse tradelines, scores, sections, and debug coverage.
            </p>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className="w-full min-h-[260px] bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors font-mono text-[11px]"
              placeholder="Paste HTML here…"
            />

            {parsed && !(parsed as any).error && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Provider</div>
                  <div className="mt-1 text-white font-semibold">{(parsed as any).provider}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Report date</div>
                  <div className="mt-1 text-white font-semibold">{(parsed as any).reportDate || '—'}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Tradelines</div>
                  <div className="mt-1 text-white font-semibold">{((parsed as any).tradelines?.length ?? 0).toString()}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Scores</div>
                  <div className="mt-1 text-white font-semibold">{((parsed as any).scores?.length ?? 0).toString()}</div>
                </div>
              </div>
            )}

            {parsed && (parsed as any).error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
                {(parsed as any).error}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  const json = safeJson(parsed);
                  setParsedJson(json);
                  void copy(json);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                disabled={!parsed}
              >
                <Clipboard size={14} /> Copy parsed JSON
              </button>
              <button
                type="button"
                onClick={() => setHtml('')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <FlaskConical size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">PDF extracted text</span>
            </div>
            <p className="text-white/60 text-sm">
              Paste extracted text (from our PDF extractor). We’ll detect provider/date hints and show coverage.
            </p>
            <textarea
              value={pdfText}
              onChange={(e) => setPdfText(e.target.value)}
              className="w-full min-h-[260px] bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors font-mono text-[11px]"
              placeholder="Paste extracted PDF text here…"
            />

            {pdfHints && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Provider hint</div>
                  <div className="mt-1 text-white font-semibold">{pdfHints.provider}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Report date hint</div>
                  <div className="mt-1 text-white font-semibold">{pdfHints.reportDate || '—'}</div>
                </div>
                {pdfHints.parsed && !(pdfHints.parsed as any).error ? (
                  <>
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="text-[10px] uppercase tracking-widest text-white/40">PDF tradelines</div>
                      <div className="mt-1 text-white font-semibold">{((pdfHints.parsed as any).tradelines?.length ?? 0).toString()}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="text-[10px] uppercase tracking-widest text-white/40">PDF scores</div>
                      <div className="mt-1 text-white font-semibold">{((pdfHints.parsed as any).scores?.length ?? 0).toString()}</div>
                    </div>
                  </>
                ) : null}
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 col-span-2">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Coverage</div>
                  <div className="mt-1 text-white/80 text-sm font-mono">
                    {pdfHints.chars.toLocaleString()} chars • first line: {pdfHints.firstLine.slice(0, 120)}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void copy(pdfText)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                disabled={!pdfText.trim()}
              >
                <Clipboard size={14} /> Copy text
              </button>
              <button
                type="button"
                onClick={() => setPdfText('')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {parsedJson && (
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6">
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Latest parsed JSON</div>
            <pre className="mt-3 whitespace-pre-wrap break-words text-[11px] text-white/70 font-mono">
              {parsedJson.slice(0, 60_000)}
            </pre>
            <div className="mt-4 text-white/40 text-xs">
              Tip: paste this JSON into a ticket when we find a new export variant that breaks parsing.
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
          <div className="text-white font-semibold">Next improvement loop</div>
          <ol className="mt-2 text-white/70 text-sm space-y-1 list-decimal list-inside">
            <li>Paste an export that parses poorly (0 tradelines, unknown provider/date, etc.).</li>
            <li>Copy the parsed JSON + debug signals.</li>
            <li>We extend selectors/patterns in the parser and retest here.</li>
          </ol>
          <button
            type="button"
            onClick={() => navigate('/admin/partners')}
            className="mt-4 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
          >
            Open Partner Management <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </PageShell>
  );
}

