import React, { useState } from 'react';
import { ArrowRight, Download, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../features/unified/FinelyUnifiedHubLayout';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import {
  downloadBusinessCreditOneSheet,
  listBusinessCreditOneSheets,
  type BusinessCreditOneSheetId,
} from '../resources/buildBusinessCreditOneSheetPdf';
import {
  BUSINESS_CREDIT_PROCESS_BRIEF,
  downloadBusinessCreditProcessBrief,
} from '../resources/buildBusinessCreditProcessBriefPdf';
import {
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsGlowTile,
  type FinelyOsPublicAccent,
} from '../features/os/finelyOsLightUi';

const ACCENTS: FinelyOsPublicAccent[] = [
  'sky',
  'amber',
  'emerald',
  'violet',
  'fuchsia',
  'rose',
  'sky',
  'amber',
];

export default function BusinessCreditOneSheetsPage() {
  const navigate = useNavigate();
  const sheets = listBusinessCreditOneSheets();
  const [busy, setBusy] = useState<BusinessCreditOneSheetId | 'process_brief' | null>(null);
  const [err, setErr] = useState<string | null>(null);

  usePublicSeoMeta({
    title: 'Business Credit Partner One-Sheets',
    description:
      'The 3-sheet Business Credit Process Brief plus premium single-page partner one-sheets — Fundability Roadmap, Tier Ladder & Capital Outlook, Foundation, Builder, Elite, Empire, comparison, and named-cards path. Download PDFs and get a work-calibrated quote.',
    path: '/resources/business-credit-one-sheets',
  });

  const onDownload = async (id: BusinessCreditOneSheetId) => {
    setBusy(id);
    setErr(null);
    try {
      await downloadBusinessCreditOneSheet(id);
    } catch (e) {
      setErr((e as Error)?.message || 'Download failed');
    } finally {
      setBusy(null);
    }
  };

  const onDownloadBrief = async () => {
    setBusy('process_brief');
    setErr(null);
    try {
      await downloadBusinessCreditProcessBrief();
    } catch (e) {
      setErr((e as Error)?.message || 'Download failed');
    } finally {
      setBusy(null);
    }
  };

  const brief = BUSINESS_CREDIT_PROCESS_BRIEF;

  return (
    <PageShell
      badge="Partner resources"
      title="Business Credit Partner One-Sheets"
      subtitle="Start with the 3-sheet Process Brief, then the Fundability Roadmap one-sheet (pillars + stage gates). Use Tier Ladder for capital outlook, then download your tier sheet and get a work-calibrated quote."
    >
      <div className={`${FINELY_OS_PAGE} fc-senior-simple`}>
        <FinelyUnifiedHubLayout
          eyebrow="Partner one-sheets"
          title="Business Credit Partner One-Sheets"
          subtitle="Process Brief → Fundability Roadmap → Tier Ladder → destination sheet. Results vary · not guaranteed · business credit only · funding subject to underwriting · not legal advice."
          accent="amber"
          kpis={[
            { label: 'Process brief', value: '3-sheet', hint: 'How we build', accent: 'emerald' },
            { label: 'One-sheets', value: String(sheets.length), hint: 'Single-page layouts', accent: 'amber' },
            { label: 'Next step', value: 'Quote', hint: 'Work-calibrated', accent: 'violet' },
          ]}
          primaryAction={{
            label: 'Get Business Credit quote',
            onClick: () => navigate('/pricing/business-credit'),
          }}
          secondaryAction={{
            label: 'Back to Resources',
            onClick: () => navigate('/resources'),
          }}
          detailSlot={
            <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
              Download the Process Brief and Fundability Roadmap first, then Tier Ladder & Capital Outlook for fee /
              outlay / potential. Pick the tier sheet that matches your destination and open pricing for a
              work-calibrated quote.
            </p>
          }
        >
          {err ? <p className="mb-3 text-sm text-rose-300">{err}</p> : null}

          {/* Featured 3-sheet process brief */}
          <article
            className={`${finelyOsCatalogCardCompact('emerald')} mb-4 space-y-3 border border-emerald-400/30`}
            data-fc-accent="emerald"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300/90`}>{brief.eyebrow}</div>
                <h2 className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>{brief.title}</h2>
                <p className={`mt-1.5 text-sm ${FINELY_OS_ENTITY_BODY}`}>{brief.summary}</p>
                <p className="mt-2 text-xs text-emerald-100/65">
                  Read this before one-sheets — sequence first, then Fundability Roadmap, then pick the destination that
                  matches your file.
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span className={`${FINELY_OS_ENTITY_CHIP} bg-emerald-500/15 text-emerald-200`}>
                  Featured · {brief.sheetLabel}
                </span>
                <span className={`${FINELY_OS_ENTITY_CHIP} bg-black/30 text-white/55`}>Start here</span>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-3">
              {brief.pages.map((line, i) => {
                const [chipTitle, chipBody] = line.includes(' — ')
                  ? (line.split(' — ') as [string, string])
                  : [line, ''];
                return (
                  <div key={line} className={`${finelyOsGlowTile('emerald', false)} space-y-1 !p-3`}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`${FINELY_OS_ENTITY_CHIP} bg-emerald-500/20 text-emerald-100`}>
                        Page {i + 1}
                      </span>
                      <span className="text-xs font-semibold text-emerald-100/90">{chipTitle}</span>
                    </div>
                    {chipBody ? (
                      <p className={`text-xs leading-snug ${FINELY_OS_ENTITY_BODY}`}>{chipBody}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <button
                type="button"
                disabled={busy === 'process_brief'}
                onClick={() => void onDownloadBrief()}
                className={`${FINELY_OS_PRIMARY_BTN} inline-flex items-center gap-2`}
              >
                <Download size={14} /> {busy === 'process_brief' ? 'Building…' : brief.downloadLabel}
              </button>
              <button
                type="button"
                onClick={() => navigate('/pricing/business-credit')}
                className={`${FINELY_OS_SECONDARY_BTN} inline-flex items-center gap-2`}
              >
                Get work-calibrated quote <ArrowRight size={14} />
              </button>
              <span className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                Then Fundability Roadmap → Tier Ladder → destination sheets
              </span>
            </div>
          </article>

          <div className={`mb-3 ${FINELY_OS_ENTITY_SUBLABEL}`}>
            Fundability Roadmap · Tier Ladder · destination sheets
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {sheets.map((s, i) => {
              const accent = ACCENTS[i % ACCENTS.length]!;
              return (
                <article key={s.id} className={`${finelyOsCatalogCardCompact(accent)} space-y-3`} data-fc-accent={accent}>
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 shrink-0 text-amber-300" size={18} />
                    <div className="min-w-0">
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>{s.eyebrow}</div>
                      <h2 className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>{s.title}</h2>
                      {s.priceLine ? (
                        <div className="mt-1 text-lg font-black text-amber-200">{s.priceLine}</div>
                      ) : null}
                      {s.capitalProgramFeeLine && s.capitalOutlayLine && s.capitalPotentialLine ? (
                        <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                          <div>
                            <div className="uppercase tracking-wider text-white/40">Program</div>
                            <div className="font-semibold text-white">{s.capitalProgramFeeLine}</div>
                          </div>
                          <div>
                            <div className="uppercase tracking-wider text-white/40">Vendor outlay</div>
                            <div className="font-semibold text-white">{s.capitalOutlayLine}</div>
                          </div>
                          <div>
                            <div className="uppercase tracking-wider text-white/40">Potential BC</div>
                            <div className="font-semibold text-amber-200">{s.capitalPotentialLine}</div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>{s.summary}</p>

                  <div>
                    <div className={`text-[10px] uppercase tracking-wider text-white/45`}>Who it&apos;s for</div>
                    <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{s.whoFor}</p>
                  </div>

                  <div>
                    <div className={`text-[10px] uppercase tracking-wider text-white/45`}>What&apos;s inside</div>
                    <ul className={`mt-1 space-y-1 text-sm ${FINELY_OS_ENTITY_BODY} list-disc pl-4`}>
                      {s.includes.slice(0, 5).map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                      {s.includes.length > 5 ? (
                        <li className="text-white/50">+ {s.includes.length - 5} more in the PDF</li>
                      ) : null}
                    </ul>
                  </div>

                  <div>
                    <div className={`text-[10px] uppercase tracking-wider text-white/45`}>Proof points</div>
                    <ul className={`mt-1 space-y-1 text-sm ${FINELY_OS_ENTITY_BODY} list-disc pl-4`}>
                      {s.proofPoints.slice(0, 3).map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={FINELY_OS_ENTITY_CHIP}>{s.effort}</span>
                  </div>

                  <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>{s.cta}</p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      disabled={busy === s.id}
                      onClick={() => void onDownload(s.id)}
                      className={`${FINELY_OS_PRIMARY_BTN} inline-flex items-center gap-2`}
                    >
                      <Download size={14} /> {busy === s.id ? 'Building…' : 'Download PDF'}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/pricing/business-credit')}
                      className={`${FINELY_OS_SECONDARY_BTN} inline-flex items-center gap-2`}
                    >
                      Get quote <ArrowRight size={14} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/pricing/business-credit')}
              className={`${FINELY_OS_PRIMARY_BTN} inline-flex items-center gap-2`}
            >
              Open Business Credit pricing <ArrowRight size={14} />
            </button>
            <button type="button" onClick={() => navigate('/resources')} className={FINELY_OS_SECONDARY_BTN}>
              Resource library
            </button>
          </div>

          <p className={`mt-6 ${FINELY_OS_COMPLIANCE_FOOTNOTE}`}>
            Results vary · not guaranteed · business credit only · funding subject to underwriting · outlay varies by
            vendors. Named-card and lender outcomes are never guaranteed.
          </p>
        </FinelyUnifiedHubLayout>

        <MarketingStaffChatStrip
          roleId="funding_strategist"
          goal="business"
          roleLabel="funding strategist"
          subline="Questions about which Business Credit tier or one-sheet fits your file? Chat before you quote."
        />
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
