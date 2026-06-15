type AuditRouteResult = {
  route: string;
  pathname: string;
  searchLen: number;
  viewportH: number | null;
  documentScrollH: number | null;
  rootFound: boolean;
  rootOverflowY: string | null;
  rootHeight: string | null;
  waitedFrames: number;
  suspectNodesCount: number;
  suspectNodesPreview: Array<{ tag: string; cls: string }>;
};

function now() {
  return Date.now();
}

function withAuditQuery(path: string) {
  if (path.includes('?')) return `${path}&debugUi=1&audit=1`;
  return `${path}?debugUi=1&audit=1`;
}

async function rafFrames(frames: number) {
  for (let i = 0; i < frames; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
  }
}

async function waitForRouteDom(expectedPathname: string, maxFrames: number) {
  let waited = 0;
  for (let i = 0; i < maxFrames; i += 1) {
    const root = document.querySelector('[data-fc-pageshell-root="1"]') as HTMLElement | null;
    const rootPath = root ? root.getAttribute('data-fc-pathname') : null;
    const routeMarker = document.querySelector(
      `[data-fc-route-content="1"][data-fc-route-pathname="${expectedPathname}"]`,
    ) as HTMLElement | null;
    if (root && rootPath === expectedPathname && routeMarker) return { root, waitedFrames: waited };
    // eslint-disable-next-line no-await-in-loop
    await rafFrames(1);
    waited += 1;
  }
  const root = document.querySelector('[data-fc-pageshell-root="1"]') as HTMLElement | null;
  return { root, waitedFrames: waited };
}

function collectRouteMetrics(route: string, args: { waitedFrames: number }): AuditRouteResult {
  const root = document.querySelector('[data-fc-pageshell-root="1"]') as HTMLElement | null;
  const rootStyle = root ? window.getComputedStyle(root) : null;

  // Heuristic: list likely nested scrollers / hard-height containers.
  const nodes = Array.from(document.querySelectorAll('[class]')) as HTMLElement[];
  const suspects = nodes.filter((n) => {
    const cls = String((n as any).className || '');
    if (!cls) return false;
    return (
      cls.includes('overflow-y-auto') ||
      cls.includes('overflow-y-scroll') ||
      cls.includes('max-h-') ||
      cls.includes('h-screen') ||
      cls.includes('min-h-0')
    );
  });

  const preview = suspects.slice(0, 18).map((n) => ({
    tag: String(n.tagName || '').toLowerCase(),
    cls: String((n as any).className || '').slice(0, 160),
  }));

  return {
    route,
    pathname: window.location.pathname,
    searchLen: String(window.location.search || '').length,
    viewportH: typeof window !== 'undefined' ? window.innerHeight : null,
    documentScrollH: typeof document !== 'undefined' ? document.documentElement.scrollHeight : null,
    rootFound: Boolean(root),
    rootOverflowY: rootStyle ? rootStyle.overflowY : null,
    rootHeight: rootStyle ? rootStyle.height : null,
    waitedFrames: args.waitedFrames,
    suspectNodesCount: suspects.length,
    suspectNodesPreview: preview,
  };
}

export async function runSiteAudit(args: {
  runId: string;
  /** Optional remote ingest endpoint (dev-only). If missing, results are logged to console only. */
  endpoint?: string;
  navigate: (to: string) => void | Promise<void>;
}) {
  const routes = [
    '/portal/dashboard',
    '/portal/projects',
    '/portal/reports',
    '/portal/disputes',
    '/portal/documents',
    '/portal/templates',
    '/portal/letters',
    '/portal/letters/vault',
    '/portal/messages',
    '/portal/debt',
    '/portal/barter',
    '/business/dashboard',
    '/business/profile',
    '/business/vendors',
    '/admin/partners',
    '/admin',
    '/admin/settings',
    '/admin/tenants',
    '/admin/templates',
  ];

  const endpoint = String(args.endpoint || '').trim();
  const post = (hypothesisId: string, location: string, message: string, data: any) => {
    if (!endpoint) {
      // Best-effort only: no remote telemetry by default.
      // eslint-disable-next-line no-console
      console.info('[audit]', { runId: args.runId, hypothesisId, location, message, data });
      return;
    }
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId: args.runId,
        hypothesisId,
        location,
        message,
        data,
        timestamp: now(),
      }),
    }).catch(() => {});
  };

  post('H18', 'src/debug/runSiteAudit.ts:runSiteAudit', 'audit.start', { routesCount: routes.length });

  for (const r of routes) {
    const target = withAuditQuery(r);
    post('H18', 'src/debug/runSiteAudit.ts:runSiteAudit', 'audit.navigate', { target });
    try {
      void args.navigate(target);
    } catch (e: any) {
      post('H18', 'src/debug/runSiteAudit.ts:runSiteAudit', 'audit.navigate.error', {
        target,
        message: String(e?.message || e || ''),
      });
      continue;
    }

    // Wait for React to commit the new route into PageShell (avoids sampling the previous DOM).
    // eslint-disable-next-line no-await-in-loop
    const waited = await waitForRouteDom(r, 240);
    // Give layout one extra frame to stabilize after root appears.
    // eslint-disable-next-line no-await-in-loop
    await rafFrames(2);

    const metrics = collectRouteMetrics(target, { waitedFrames: waited.waitedFrames });
    post('H18', 'src/debug/runSiteAudit.ts:runSiteAudit', 'audit.route.metrics', metrics);
  }

  post('H18', 'src/debug/runSiteAudit.ts:runSiteAudit', 'audit.done', { ok: true });
}

