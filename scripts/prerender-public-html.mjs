#!/usr/bin/env node
/**
 * Build-time HTML snapshots for public marketing routes.
 *
 * Why not vite-ssg / vite-plugin-prerender:
 * this app is a large React Router SPA (Supabase, portal, Three, PDF).
 * A full SSR rewrite or Puppeteer crawl of 100+ routes is fragile.
 * Snapshots reuse the existing publicSeoCatalog + built index.html so
 * crawlers get unique title / description / canonical / JSON-LD / H1
 * without changing runtime routing.
 *
 * Usage:
 *   node scripts/prerender-public-html.mjs
 *   node scripts/prerender-public-html.mjs --html index.html --out /tmp/fc-prerender
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  brandDocumentTitle,
  isArticlePath,
  isHaitianLangPath,
  pageUrl,
  parsePublicSeoCatalog,
} from './lib/parsePublicSeoCatalog.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
function argValue(flag, fallback) {
  const idx = args.indexOf(flag);
  if (idx === -1) return fallback;
  return args[idx + 1] || fallback;
}

const htmlPath = path.resolve(root, argValue('--html', 'dist/index.html'));
const outDir = path.resolve(root, argValue('--out', 'dist'));
const site = (process.env.VITE_SITE_URL || process.env.SITE_URL || 'https://finelycred.com').replace(/\/$/, '');

const FAQ_PATH = path.join(root, 'src/data/publicFaq.ts');

function loadFaqs() {
  if (!fs.existsSync(FAQ_PATH)) return [];
  const src = fs.readFileSync(FAQ_PATH, 'utf8');
  const items = [];
  const re = /q:\s*'((?:\\'|[^'])*)'\s*,\s*a:\s*'((?:\\'|[^'])*)'/g;
  let match;
  while ((match = re.exec(src))) {
    items.push({
      q: match[1].replace(/\\'/g, "'"),
      a: match[2].replace(/\\'/g, "'"),
    });
  }
  return items;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function replaceOrInsertMeta(html, attr, key, content) {
  const re = new RegExp(`<meta\\s+${attr}="${key}"\\s+content="[^"]*"\\s*/?>`, 'i');
  const tag = `<meta ${attr}="${key}" content="${escapeHtml(content)}" />`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function replaceOrInsertLink(html, rel, href) {
  const re = new RegExp(`<link\\s+rel="${rel}"\\s+href="[^"]*"\\s*/?>`, 'i');
  const tag = `<link rel="${rel}" href="${escapeHtml(href)}" />`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function upsertJsonLd(html, id, data) {
  const script = `<script type="application/ld+json" id="${id}">${JSON.stringify(data)}</script>`;
  const re = new RegExp(`<script type="application/ld\\+json" id="${id}">[\\s\\S]*?</script>`, 'i');
  if (re.test(html)) return html.replace(re, script);
  return html.replace('</head>', `    ${script}\n  </head>`);
}

function stripJsonLd(html, id) {
  return html.replace(new RegExp(`<script type="application/ld\\+json" id="${id}">[\\s\\S]*?</script>`, 'gi'), '');
}

function demoteBootErrorHeading(html) {
  return html.replace(
    /<h1([^>]*)>\s*Finely Cred could not start\s*<\/h1>/i,
    '<p$1>Finely Cred could not start</p>',
  );
}

function injectSeoDocStyles(html) {
  if (html.includes('#fc-seo-doc')) return html;
  const css = `
      #fc-seo-doc {
        box-sizing: border-box;
        max-width: 44rem;
        margin: 0 auto;
        padding: 3.25rem 1.5rem 2rem;
        font-family: Inter, system-ui, sans-serif;
        color: #e2e8f0;
      }
      #fc-seo-doc h1 {
        margin: 0 0 0.75rem;
        font-size: 1.85rem;
        line-height: 1.2;
        color: #fbbf24;
        font-weight: 700;
      }
      #fc-seo-doc p, #fc-seo-doc li {
        opacity: 0.8;
        line-height: 1.65;
        margin: 0 0 0.85rem;
      }
      #fc-seo-doc a { color: #fbbf24; }
      html.fc-app-ready #fc-seo-doc { display: none !important; }
`;
  if (html.includes('html.fc-app-ready #fc-boot-loader')) {
    return html.replace('html.fc-app-ready #fc-boot-loader', `${css}\n      html.fc-app-ready #fc-boot-loader`);
  }
  return html.replace('</style>', `${css}    </style>`);
}

function buildOrganization(origin) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Finely Cred',
    url: origin,
    description: 'Credit restore, dispute letters, business credit, and funding readiness platform.',
  };
}

function buildWebSite(origin) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Finely Cred',
    url: origin,
    description: 'Credit restore, dispute letters, business credit, and funding readiness.',
    publisher: { '@id': `${origin}/#organization` },
  };
}

function buildWebPage(origin, route, brandedTitle) {
  const url = pageUrl(origin, route.path);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: brandedTitle,
    description: route.description,
    url,
    isPartOf: { '@type': 'WebSite', name: 'Finely Cred', url: origin },
    publisher: { '@type': 'Organization', name: 'Finely Cred', url: origin },
  };
}

function buildArticle(origin, route, brandedTitle) {
  const url = pageUrl(origin, route.path);
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: brandedTitle,
    description: route.description,
    url,
    author: { '@type': 'Organization', name: 'Finely Cred' },
    publisher: { '@type': 'Organization', name: 'Finely Cred', url: origin },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };
}

function buildFaqPage(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

function seoDocHtml(route, faqs) {
  const extra =
    route.path === '/faq' && faqs.length
      ? `<dl>${faqs
          .map(
            (item) =>
              `<dt><strong>${escapeHtml(item.q)}</strong></dt><dd>${escapeHtml(item.a)}</dd>`,
          )
          .join('')}</dl>`
      : '';
  return `<article id="fc-seo-doc">
        <h1>${escapeHtml(route.title)}</h1>
        <p>${escapeHtml(route.description)}</p>
        ${extra}
      </article>`;
}

function applySnapshot(template, route, faqs) {
  const branded = brandDocumentTitle(route.title);
  const url = pageUrl(site, route.path);
  const lang = isHaitianLangPath(route.path) ? 'ht' : 'en';
  let html = injectSeoDocStyles(demoteBootErrorHeading(template));
  html = html.replace(/<html lang="[^"]*"/, `<html lang="${lang}"`);
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(branded)}</title>`);
  html = replaceOrInsertMeta(html, 'name', 'description', route.description);
  html = replaceOrInsertMeta(html, 'name', 'robots', 'index, follow');
  html = replaceOrInsertMeta(html, 'property', 'og:title', branded);
  html = replaceOrInsertMeta(html, 'property', 'og:description', route.description);
  html = replaceOrInsertMeta(html, 'property', 'og:url', url);
  html = replaceOrInsertMeta(html, 'property', 'og:type', isArticlePath(route.path) ? 'article' : 'website');
  html = replaceOrInsertMeta(html, 'property', 'og:image', `${site}/brand/finely-cred-logo-dark.png`);
  html = replaceOrInsertLink(html, 'canonical', url);

  html = upsertJsonLd(html, 'fc-org-schema', { ...buildOrganization(site), '@id': `${site}/#organization` });
  html = upsertJsonLd(html, 'fc-website-schema', buildWebSite(site));
  html = upsertJsonLd(html, 'fc-webpage-schema', buildWebPage(site, route, branded));
  if (isArticlePath(route.path)) {
    html = upsertJsonLd(html, 'fc-article-schema', buildArticle(site, route, branded));
  } else {
    html = stripJsonLd(html, 'fc-article-schema');
  }
  if (route.path === '/faq' && faqs.length) {
    html = upsertJsonLd(html, 'fc-faq-schema', buildFaqPage(faqs));
  } else {
    html = stripJsonLd(html, 'fc-faq-schema');
  }

  const doc = seoDocHtml(route, faqs);
  if (/<article id="fc-seo-doc">[\s\S]*?<\/article>/.test(html)) {
    html = html.replace(/<article id="fc-seo-doc">[\s\S]*?<\/article>/, doc);
  } else {
    html = html.replace('<div id="app">', `${doc}\n    <div id="app">`);
  }
  return html;
}

function applySpaFallback(template) {
  let html = injectSeoDocStyles(demoteBootErrorHeading(template));
  html = html.replace(/<title>[^<]*<\/title>/, '<title>Finely Cred</title>');
  html = replaceOrInsertMeta(html, 'name', 'robots', 'noindex, follow');
  html = replaceOrInsertMeta(html, 'name', 'googlebot', 'noindex, follow');
  html = replaceOrInsertMeta(html, 'name', 'description', 'Finely Cred private workspace. This screen is not indexed.');
  html = html.replace(/<article id="fc-seo-doc">[\s\S]*?<\/article>/g, '');
  html = stripJsonLd(html, 'fc-webpage-schema');
  html = stripJsonLd(html, 'fc-article-schema');
  html = stripJsonLd(html, 'fc-faq-schema');
  return html;
}

function writeRouteHtml(outRoot, routePath, html) {
  if (routePath === '/') {
    fs.writeFileSync(path.join(outRoot, 'index.html'), html, 'utf8');
    return path.join(outRoot, 'index.html');
  }
  const destDir = path.join(outRoot, routePath.replace(/^\//, ''));
  fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, 'index.html');
  fs.writeFileSync(dest, html, 'utf8');
  return dest;
}

if (!fs.existsSync(htmlPath)) {
  console.error(`✗ Missing HTML template: ${htmlPath}`);
  process.exit(1);
}

const catalogSrc = fs.readFileSync(path.join(root, 'src/data/publicSeoCatalog.ts'), 'utf8');
const catalog = parsePublicSeoCatalog(catalogSrc);
const publicRoutes = catalog.filter((row) => row.sitemap !== false);
if (publicRoutes.length < 80) {
  console.error(`✗ Catalog parse too small (${publicRoutes.length}). Check parsePublicSeoCatalog.`);
  process.exit(1);
}

const template = fs.readFileSync(htmlPath, 'utf8');
const faqs = loadFaqs();
fs.mkdirSync(outDir, { recursive: true });

const fallback = applySpaFallback(template);
fs.writeFileSync(path.join(outDir, 'spa-fallback.html'), fallback, 'utf8');

const notFound = applySnapshot(
  template,
  {
    path: '/404',
    title: 'Page not found',
    description: 'That Finely Cred URL does not exist. Return to the homepage or a published guide.',
    sitemap: false,
    hasSchema: false,
  },
  [],
);
const notFoundHtml = replaceOrInsertMeta(notFound, 'name', 'robots', 'noindex, nofollow');
fs.writeFileSync(path.join(outDir, '404.html'), notFoundHtml, 'utf8');

let written = 0;
for (const route of publicRoutes) {
  writeRouteHtml(outDir, route.path, applySnapshot(template, route, faqs));
  written += 1;
}

console.log(`Wrote ${written} prerendered marketing snapshots + spa-fallback.html → ${path.relative(root, outDir) || '.'}`);
