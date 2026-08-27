import React from 'react';
import type { ParsedCreditReport, ParsedTradeline } from '../domain/creditReports';
import type { EvidenceItem } from '../domain/evidence';
import { getBlobStore } from '../storage/getBlobStore';
import { newId } from '../utils/ids';
import { captureReactElementPng } from '../utils/captureReactPng';
import { TradelineEvidenceSheet } from '../components/evidence/EvidenceSheet';

function norm(s: string) {
  return (s || '').toLowerCase().trim();
}

/**
 * Best-effort tradeline lookup by creditor/account name — same normalization used
 * across the dispute letter builder (exact match, then substring match either way).
 */
export function findMatchingTradeline(
  parsed: ParsedCreditReport | null | undefined,
  accountName: string,
): ParsedTradeline | null {
  if (!parsed?.tradelines?.length) return null;
  const needle = norm(accountName);
  if (!needle) return null;
  return (
    parsed.tradelines.find((t) => norm(t.creditorName) === needle) ??
    parsed.tradelines.find((t) => needle.includes(norm(t.creditorName)) || norm(t.creditorName).includes(needle)) ??
    null
  );
}

/**
 * Capture a clearly labeled Finely Parsed Exhibit as a PNG,
 * store it in the blob store, and build the EvidenceItem record. Does NOT persist to the
 * evidence repo — callers decide when/how to upsert (mirrors EvidenceUploader's onCreated pattern).
 *
 * Shared by ParsedReportViewer's "Capture" button and the in-popup capture flow in
 * EvidencePickerModal so both use the exact same capture pipeline.
 */
export async function captureTradelineEvidenceScreenshot(args: {
  tradeline: ParsedTradeline;
  partnerId: string;
  reportId?: string;
  creditorName?: string;
}): Promise<EvidenceItem> {
  const { tradeline, partnerId, reportId } = args;
  const creditorName = (args.creditorName || tradeline.creditorName || '').trim() || 'Account';

  const dataUrl = await captureReactElementPng(
    React.createElement(TradelineEvidenceSheet, { tradeline, showHeader: true }),
    { pixelRatio: 2, widthPx: 1100 },
  );
  const blob = await (await fetch(dataUrl)).blob();
  const store = getBlobStore();
  const put = await store.put(blob, {
    kind: 'evidence_screenshot',
    partnerId,
    reportId,
    creditorName,
  });

  const safeName = creditorName.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');
  const now = new Date().toISOString();
  const filename = `Finely_Parsed_Exhibit_${safeName || 'Tradeline'}_${now.slice(0, 10)}.png`;

  const item: EvidenceItem = {
    id: newId('evidence'),
    partnerId,
    reportId,
    type: 'screenshot',
    source: 'parsed_finely_exhibit',
    creditorName,
    caption: `Finely Parsed Exhibit: ${creditorName} · generated from parsed report data, not bureau UI`,
    filename,
    mimeType: 'image/png',
    sizeBytes: blob.size,
    blobRef: put.ref,
    provenance: {
      kind: 'parsed_finely_exhibit',
      sourceReportId: reportId,
      parseVersion: tradeline.sourceAnchor?.parseVersion,
      generatedAt: now,
      mailEligible: false,
      humanVerified: false,
    },
    createdAt: now,
  };
  return item;
}
