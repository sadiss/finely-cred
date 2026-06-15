import React, { useMemo } from 'react';
import type { Bureau, ParsedSectionItem, ParsedTradeline, TradelineRow } from '../../domain/creditReports';

function safe(v?: string | null) {
  const s = (v ?? '').toString().trim();
  return s ? s : '—';
}

function bureauLabel(b: Bureau) {
  if (b === 'TUC') return 'TransUnion';
  if (b === 'EXP') return 'Experian';
  return 'Equifax';
}

const DEFAULT_BUREAU_ORDER: Bureau[] = ['TUC', 'EXP', 'EQF'];

function sheetBaseStyle(): React.CSSProperties {
  // Inline styles ensure capture stays white/black even if Tailwind is missing in clone.
  return {
    background: '#ffffff',
    color: '#0b0f0e',
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji','Segoe UI Emoji'",
  };
}

function SheetChrome({
  title,
  subtitle,
  metaLeft,
  metaRight,
  children,
  showHeader = true,
}: {
  title: string;
  subtitle?: string;
  metaLeft?: string;
  metaRight?: string;
  children: React.ReactNode;
  showHeader?: boolean;
}) {
  return (
    <div style={sheetBaseStyle()} className="w-[1100px] p-4">
      {showHeader ? (
        <>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.18em] text-black/60 font-semibold">Evidence</div>
              <div className="mt-1 text-[16px] font-semibold text-black leading-tight break-words">{title}</div>
              {subtitle ? <div className="mt-1 text-[11px] text-black/70">{subtitle}</div> : null}
            </div>
            <div className="text-right text-[11px] text-black/70 shrink-0">
              {metaRight ? <div>{metaRight}</div> : null}
              {metaLeft ? <div className="mt-1">{metaLeft}</div> : null}
            </div>
          </div>
          <div className="mt-3">{children}</div>
        </>
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
}

function AccountDetailsTable({
  rows,
  bureauOrder = DEFAULT_BUREAU_ORDER,
  leftHeaderLabel = 'Field',
}: {
  rows: TradelineRow[];
  bureauOrder?: Bureau[];
  leftHeaderLabel?: string;
}) {
  return (
    <div className="border border-black/20 overflow-hidden">
      <div className="overflow-hidden">
        <table className="w-full text-left border-collapse text-[12px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.18em] text-black/60 bg-black/[0.03]">
              <th className="py-2 px-3 border-b border-black/15">{safe(leftHeaderLabel)}</th>
              {bureauOrder.map((b) => (
                <th key={b} className="py-2 px-3 border-b border-black/15">
                  {bureauLabel(b)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.label}_${i}`} className={i % 2 === 0 ? 'bg-white' : 'bg-black/[0.01]'}>
                <td className="py-2 px-3 align-top border-b border-black/10 text-black/75">{safe(r.label)}</td>
                {bureauOrder.map((b) => (
                  <td
                    key={b}
                    className="py-2 px-3 align-top border-b border-black/10 text-black/90 whitespace-pre-wrap break-words"
                  >
                    {safe(r.byBureau?.[b])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentHistoryTable({
  tradeline,
  bureauOrder = DEFAULT_BUREAU_ORDER,
}: {
  tradeline: ParsedTradeline;
  bureauOrder?: Bureau[];
}) {
  const ph = tradeline.paymentHistory2y;
  if (!ph) {
    return (
      <div className="mt-6 rounded-2xl border border-black/10 bg-white px-5 py-4">
        <div className="text-[11px] uppercase tracking-[0.22em] text-black/55 font-black">2-year payment history</div>
        <div className="mt-2 text-[12px] text-black/60">Payment history was not detected for this account.</div>
      </div>
    );
  }

  const by = ph.byBureau ?? {};
  const anyRow = (by.TUC || by.EXP || by.EQF || []) as { code: string }[];
  const cols = Math.max(anyRow.length, ph.months?.length ?? 0, ph.years?.length ?? 0, 0);
  const months = (ph.months?.length ? ph.months : Array.from({ length: cols }).map((_, i) => String(i + 1))).slice(0, cols);
  const years = (ph.years?.length ? ph.years : Array.from({ length: cols }).map(() => '')).slice(0, cols);

  const codeCell = (code: string) => {
    const c = (code || '').toUpperCase().trim();
    const derog = ['30', '60', '90', '120', 'CO', 'COL', 'CL'].includes(c) || c.includes('LATE') || c.includes('CHARGE');
    return <span className={derog ? 'text-red-700' : 'text-black/70'}>{c || '·'}</span>;
  };

  return (
    <div className="mt-3 border border-black/20 overflow-hidden">
      <table className="w-full border-collapse table-fixed text-[11px]">
        <tbody>
            <tr>
              <td className="px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-black/60 font-semibold w-[130px] border-b border-black/15 bg-black/[0.03]">
                Month
              </td>
              {months.map((m, i) => (
                <td key={i} className="px-1 py-2 text-[10px] text-black/60 text-center border-b border-black/15 bg-black/[0.03]">
                  {safe(m)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-black/50 font-semibold border-b border-black/15 bg-black/[0.02]">
                Year
              </td>
              {years.map((y, i) => (
                <td key={i} className="px-1 py-2 text-[10px] text-black/40 text-center border-b border-black/15 bg-black/[0.02]">
                  {safe(y)}
                </td>
              ))}
            </tr>
            {bureauOrder.map((b) => (
              <tr key={b}>
                <td className="px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-black/70 font-semibold border-b border-black/10">
                  {bureauLabel(b)}
                </td>
                {Array.from({ length: cols }).map((_, i) => (
                  <td key={i} className="px-1 py-2 text-center align-middle border-b border-black/10">
                    {codeCell(((by[b] ?? [])[i] as any)?.code || '')}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

export function TradelineEvidenceSheet({
  tradeline,
  bureauOrder = DEFAULT_BUREAU_ORDER,
  showHeader = false,
}: {
  tradeline: ParsedTradeline;
  bureauOrder?: Bureau[];
  showHeader?: boolean;
}) {
  const rows = tradeline.fields ?? [];
  const acct = tradeline.accountNumberMasked ? `acct: ${tradeline.accountNumberMasked}` : undefined;
  const statusLine = useMemo(() => {
    const bits = [tradeline.accountType, tradeline.accountStatus].map((x) => (x || '').trim()).filter(Boolean);
    return bits.length ? bits.join(' • ') : undefined;
  }, [tradeline.accountType, tradeline.accountStatus]);

  return (
    <SheetChrome title={tradeline.creditorName} subtitle={statusLine} metaRight={acct} showHeader={showHeader}>
      <AccountDetailsTable rows={rows} bureauOrder={bureauOrder} leftHeaderLabel={tradeline.creditorName || tradeline.accountType || 'Company'} />
      <PaymentHistoryTable tradeline={tradeline} bureauOrder={bureauOrder} />
    </SheetChrome>
  );
}

export function SectionItemEvidenceSheet({
  sectionTitle,
  itemLabel,
  item,
  columns,
  row,
}: {
  sectionTitle: string;
  itemLabel: string;
  item?: ParsedSectionItem | null;
  columns?: string[];
  row?: string[];
}) {
  const pairs = useMemo(() => {
    if (item?.fields) {
      return Object.entries(item.fields)
        .map(([k, v]) => ({ k: (k || '').trim(), v: (v || '').trim() }))
        .filter((p) => p.k && p.v);
    }
    if (columns?.length && row?.length) {
      return columns
        .map((c, i) => ({ k: (c || '').trim(), v: (row[i] ?? '').trim() }))
        .filter((p) => p.k && p.v);
    }
    return [];
  }, [item, columns, row]);

  return (
    <SheetChrome title={`${sectionTitle}: ${itemLabel}`} subtitle="Section item details">
      <div className="border border-black/20 overflow-hidden">
        <table className="w-full text-left border-collapse text-[12px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.18em] text-black/60 bg-black/[0.03]">
              <th className="py-2 px-3 border-b border-black/15 w-[320px]">Field</th>
              <th className="py-2 px-3 border-b border-black/15">Value</th>
            </tr>
          </thead>
          <tbody>
            {pairs.length ? (
              pairs.map((p, i) => (
                <tr key={`${p.k}_${i}`} className={i % 2 === 0 ? 'bg-white' : 'bg-black/[0.01]'}>
                  <td className="py-2 px-3 align-top border-b border-black/10 text-black/75">{safe(p.k)}</td>
                  <td className="py-2 px-3 align-top border-b border-black/10 text-black/90 whitespace-pre-wrap break-words">
                    {safe(p.v)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-4 px-5 text-black/55" colSpan={2}>
                  No structured fields were detected for this item.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </SheetChrome>
  );
}

