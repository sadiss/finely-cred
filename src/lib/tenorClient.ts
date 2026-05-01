export type TenorGif = {
  id: string;
  title?: string;
  url: string;
  previewUrl?: string;
  width?: number;
  height?: number;
};

export async function searchTenorGifs(args: { apiKey: string; query: string; limit?: number }): Promise<TenorGif[]> {
  const q = args.query.trim();
  if (!q) return [];
  const limit = Math.max(1, Math.min(24, args.limit ?? 18));

  const url = new URL('https://tenor.googleapis.com/v2/search');
  url.searchParams.set('q', q);
  url.searchParams.set('key', args.apiKey);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('media_filter', 'tinygif,tinygif_transparent,gif');
  url.searchParams.set('contentfilter', 'medium');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`GIF search failed (${res.status})`);
  const data: any = await res.json();
  const results = Array.isArray(data?.results) ? data.results : [];

  return results
    .map((r: any) => {
      const media = r?.media_formats ?? {};
      const tiny = media?.tinygif ?? media?.tinygif_transparent ?? null;
      const gif = media?.gif ?? null;
      const pick = tiny || gif;
      const url = pick?.url ?? r?.url ?? null;
      if (!url) return null;
      return {
        id: String(r?.id ?? url),
        title: r?.content_description ?? r?.title ?? undefined,
        url: String(url),
        previewUrl: String((tiny?.url ?? gif?.url ?? url) || url),
        width: typeof pick?.dims?.[0] === 'number' ? pick.dims[0] : undefined,
        height: typeof pick?.dims?.[1] === 'number' ? pick.dims[1] : undefined,
      } satisfies TenorGif;
    })
    .filter(Boolean) as TenorGif[];
}

