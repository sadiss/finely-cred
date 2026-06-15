type GraphError = { error?: { message?: string } };

export async function publishFacebookPageFeed(args: {
  pageId: string;
  caption: string;
  accessToken: string;
}): Promise<{ postId: string }> {
  const feedUrl = `https://graph.facebook.com/v19.0/${encodeURIComponent(args.pageId)}/feed`;
  const publishRes = await fetch(feedUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: args.caption,
      access_token: args.accessToken,
    }),
  });
  const publishData = (await publishRes.json()) as GraphError & { id?: string };
  if (!publishRes.ok || !publishData.id) {
    throw new Error(publishData.error?.message ?? 'Graph API Facebook publish failed');
  }
  return { postId: String(publishData.id) };
}

export async function publishInstagramMedia(args: {
  igBusinessId: string;
  caption: string;
  imageUrl: string;
  accessToken: string;
}): Promise<{ postId: string }> {
  const containerUrl = `https://graph.facebook.com/v19.0/${encodeURIComponent(args.igBusinessId)}/media`;
  const containerRes = await fetch(containerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: args.imageUrl,
      caption: args.caption,
      access_token: args.accessToken,
    }),
  });
  const containerData = (await containerRes.json()) as GraphError & { id?: string };
  if (!containerRes.ok || !containerData.id) {
    throw new Error(containerData.error?.message ?? 'Graph API IG media container failed');
  }

  const publishUrl = `https://graph.facebook.com/v19.0/${encodeURIComponent(args.igBusinessId)}/media_publish`;
  const publishRes = await fetch(publishUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: containerData.id,
      access_token: args.accessToken,
    }),
  });
  const publishData = (await publishRes.json()) as GraphError & { id?: string };
  if (!publishRes.ok || !publishData.id) {
    throw new Error(publishData.error?.message ?? 'Graph API IG media publish failed');
  }
  return { postId: String(publishData.id) };
}

export type MetaConnectionRow = {
  access_token: string;
  page_name?: string | null;
  ig_business_id?: string | null;
};

export async function publishMetaSocialPost(args: {
  pageId: string;
  caption: string;
  platforms?: string[];
  imageUrl?: string;
  conn: MetaConnectionRow;
}): Promise<{ postIds: string[]; platforms: string[] }> {
  const platforms = args.platforms?.length ? args.platforms : ['facebook'];
  const postIds: string[] = [];
  const published: string[] = [];

  if (platforms.includes('facebook')) {
    const fb = await publishFacebookPageFeed({
      pageId: args.pageId,
      caption: args.caption,
      accessToken: args.conn.access_token,
    });
    postIds.push(fb.postId);
    published.push('facebook');
  }

  const wantsIg = platforms.some((p) => p === 'instagram' || p === 'threads');
  if (wantsIg && args.conn.ig_business_id) {
    const imageUrl =
      args.imageUrl ||
      (Deno.env.get('META_DEFAULT_IG_IMAGE_URL') ?? '').trim() ||
      'https://finelycred.com/og-default.jpg';
    const ig = await publishInstagramMedia({
      igBusinessId: args.conn.ig_business_id,
      caption: args.caption,
      imageUrl,
      accessToken: args.conn.access_token,
    });
    postIds.push(ig.postId);
    published.push('instagram');
  }

  if (postIds.length === 0) {
    throw new Error('No platforms published — connect IG business account or include facebook');
  }

  return { postIds, platforms: published };
}
