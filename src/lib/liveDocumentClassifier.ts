import type { DocumentType } from '../domain/documents';
import type { CropMargins, DocScanProfile } from '../utils/imageScan';
import { profileForDocType } from './evidenceDocumentTaxonomy';

export type LiveDocumentGuess = {
  label: string;
  docType: DocumentType;
  suggestedProfile: DocScanProfile;
  confidence: number;
};

function lumAt(data: Uint8ClampedArray, w: number, x: number, y: number) {
  const i = (y * w + x) * 4;
  return 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
}

function analyzeRegion(
  canvas: HTMLCanvasElement,
  crop: CropMargins,
): {
  aspect: number;
  paperRatio: number;
  colorVariance: number;
  edgeDensity: number;
} {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { aspect: 1, paperRatio: 0, colorVariance: 0, edgeDensity: 0 };

  const w = canvas.width;
  const h = canvas.height;
  const x0 = Math.floor(crop.left * w);
  const y0 = Math.floor(crop.top * h);
  const x1 = Math.floor((1 - crop.right) * w);
  const y1 = Math.floor((1 - crop.bottom) * h);
  const rw = Math.max(1, x1 - x0);
  const rh = Math.max(1, y1 - y0);
  const aspect = rw / rh;

  const img = ctx.getImageData(x0, y0, rw, rh);
  const d = img.data;
  let paper = 0;
  let samples = 0;
  let colorSum = 0;
  let edge = 0;
  const step = Math.max(1, Math.floor(Math.min(rw, rh) / 48));

  for (let y = 0; y < rh; y += step) {
    for (let x = 0; x < rw; x += step) {
      const i = (y * rw + x) * 4;
      const r = d[i]!;
      const g = d[i + 1]!;
      const b = d[i + 2]!;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum > 215) paper++;
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      colorSum += chroma;
      if (x > 0) {
        const pi = (y * rw + (x - step)) * 4;
        const pl = 0.299 * d[pi]! + 0.587 * d[pi + 1]! + 0.114 * d[pi + 2]!;
        if (Math.abs(lum - pl) > 28) edge++;
      }
      samples++;
    }
  }

  return {
    aspect,
    paperRatio: samples ? paper / samples : 0,
    colorVariance: samples ? colorSum / samples : 0,
    edgeDensity: samples ? edge / samples : 0,
  };
}

/**
 * Fast frame-level guess for live camera overlay (no OCR — aspect + color heuristics).
 */
export function classifyLiveDocumentFrame(
  canvas: HTMLCanvasElement,
  crop: CropMargins,
  hintProfile?: DocScanProfile,
): LiveDocumentGuess {
  const stats = analyzeRegion(canvas, crop);
  const { aspect, paperRatio, colorVariance, edgeDensity } = stats;

  const scores: Array<{ docType: DocumentType; profile: DocScanProfile; score: number; label: string }> = [];

  if (aspect >= 1.35 && aspect <= 1.85 && colorVariance > 18) {
    scores.push({ docType: 'id_document', profile: 'id_card', score: 0.55 + colorVariance / 120, label: 'Government ID / license' });
  }
  if (aspect >= 1.35 && aspect <= 1.85 && colorVariance > 10 && colorVariance <= 22) {
    scores.push({ docType: 'ssn_card', profile: 'ssn_card', score: 0.5 + (22 - colorVariance) / 80, label: 'SSN card' });
  }
  if (paperRatio > 0.42 && aspect >= 0.55 && aspect <= 0.92) {
    scores.push({ docType: 'bureau_response', profile: 'bureau_mail', score: 0.45 + paperRatio * 0.35 + edgeDensity * 2, label: 'Bureau letter' });
    scores.push({ docType: 'collection_notice', profile: 'creditor_letter', score: 0.4 + paperRatio * 0.3 + edgeDensity * 1.8, label: 'Collector / creditor letter' });
  }
  if (paperRatio > 0.35 && aspect >= 0.65 && aspect <= 1.15) {
    scores.push({ docType: 'summons', profile: 'creditor_letter', score: 0.38 + edgeDensity * 2.2, label: 'Court papers / summons' });
    scores.push({ docType: 'court_filing', profile: 'creditor_letter', score: 0.35 + edgeDensity * 2, label: 'Court filing' });
  }
  if (paperRatio > 0.5 && edgeDensity > 0.08) {
    scores.push({ docType: 'affidavit', profile: 'creditor_letter', score: 0.32 + paperRatio * 0.25, label: 'Affidavit / sworn statement' });
  }

  scores.push({ docType: 'unknown', profile: 'general', score: 0.2, label: 'Document' });

  if (hintProfile === 'id_card') {
    const row = scores.find((s) => s.profile === 'id_card');
    if (row) row.score += 0.22;
    if (aspect >= 1.4 && aspect <= 1.75 && edgeDensity > 0.06) {
      scores.push({ docType: 'id_document', profile: 'id_card', score: 0.62 + edgeDensity, label: 'Government ID / license' });
    }
  }
  if (hintProfile === 'ssn_card') {
    const row = scores.find((s) => s.profile === 'ssn_card');
    if (row) row.score += 0.2;
  }
  if (hintProfile === 'bureau_mail') {
    const row = scores.find((s) => s.docType === 'bureau_response');
    if (row) row.score += 0.12;
  }

  scores.sort((a, b) => b.score - a.score);
  const best = scores[0]!;
  const confidence = Math.max(0, Math.min(1, best.score));

  const profileMeta = profileForDocType(best.docType);
  return {
    label: best.label || profileMeta.label,
    docType: best.docType,
    suggestedProfile: best.profile,
    confidence,
  };
}

export function cropStability(a: CropMargins, b: CropMargins, tolerance = 0.025): boolean {
  return (
    Math.abs(a.left - b.left) < tolerance &&
    Math.abs(a.top - b.top) < tolerance &&
    Math.abs(a.right - b.right) < tolerance &&
    Math.abs(a.bottom - b.bottom) < tolerance
  );
}

/** True when live detection strongly disagrees with the user's selected scan type. */
export function isProfileMismatch(selected: DocScanProfile, guess: LiveDocumentGuess | null): boolean {
  if (!guess || guess.confidence < 0.52) return false;
  if (guess.suggestedProfile === selected) return false;
  const cardLike = selected === 'id_card' || selected === 'ssn_card';
  const guessCard = guess.suggestedProfile === 'id_card' || guess.suggestedProfile === 'ssn_card';
  if (cardLike !== guessCard) return true;
  if (selected === 'bureau_mail' && guess.suggestedProfile === 'creditor_letter') return false;
  if (selected === 'creditor_letter' && guess.suggestedProfile === 'bureau_mail') return false;
  return guess.confidence >= 0.58;
}
