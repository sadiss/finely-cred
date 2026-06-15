/** Tour step highlight metadata — saved by tour-capture factory per step. */

export type TourStepHighlight = {
  stepId: string;
  selector?: string;
  label?: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TourHighlightManifest = {
  tourId: string;
  steps: TourStepHighlight[];
};

export function getTourHighlightManifestUrl(tourId: string): string {
  return `/tours/${encodeURIComponent(tourId)}/highlights.json`;
}

export async function fetchTourHighlights(tourId: string): Promise<TourHighlightManifest | null> {
  try {
    const res = await fetch(getTourHighlightManifestUrl(tourId));
    if (!res.ok) return null;
    return (await res.json()) as TourHighlightManifest;
  } catch {
    return null;
  }
}
