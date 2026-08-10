import { chromium } from 'playwright';

const targets = process.argv.slice(2);
const routes = targets.length ? targets : ['/', '/pricing', '/tradelines', '/personal-credit'];

const browser = await chromium.launch({
  channel: 'msedge',
  headless: true,
});

const results = [];
for (const route of routes) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`CONSOLE: ${msg.text()}`);
  });
  try {
    await page.goto(`http://127.0.0.1:5173${route}`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    await page.waitForTimeout(2500);
    const info = await page.evaluate(() => {
      const root = document.getElementById('root');
      const text = (root?.innerText || document.body?.innerText || '').trim();
      return {
        title: document.title,
        textLen: text.length,
        hasErrorUi: /Something went wrong/i.test(text) && /Refresh/i.test(text) && /Home/i.test(text),
        hasUnexpected: /We hit an unexpected issue/i.test(text),
        errorMessage: (text.match(/We hit an unexpected issue\.?\s*([\s\S]{0,220})/) || [])[1] || '',
        preview: text.slice(0, 320).replace(/\s+/g, ' '),
      };
    });
    const fatal = errors.filter((e) => /PAGEERROR:|ReferenceError|is not defined|Cannot find module/.test(e));
    results.push({
      route,
      ok: !info.hasErrorUi && info.textLen > 40 && fatal.length === 0,
      ...info,
      errors: errors.slice(0, 12),
      fatal,
    });
  } catch (e) {
    results.push({ route, ok: false, fail: e.message, errors });
  } finally {
    await page.close().catch(() => undefined);
  }
}

await browser.close();
console.log(JSON.stringify({ results }, null, 2));
process.exit(results.some((r) => !r.ok) ? 1 : 0);
