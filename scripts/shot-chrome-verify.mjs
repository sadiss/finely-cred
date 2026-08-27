import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const base = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:5173';
await mkdir('qa-shots', { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const captures = [
  {
    route: '/preview/workspace-light/portal/dashboard',
    out: 'qa-shots/chrome-partner-dashboard.png',
    async shot() {
      await page.waitForTimeout(3000);
      const hubBtn = page.locator('[data-fc-communication-hub="floating"] button').first();
      if (await hubBtn.count()) {
        await hubBtn.click();
        await page.waitForTimeout(1000);
        const shell = page.locator('[data-fc-comms-shell="1"]').first();
        if (await shell.count()) {
          await shell.screenshot({ path: 'qa-shots/chrome-partner-chat.png' });
          console.log('saved qa-shots/chrome-partner-chat.png');
        }
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
      await page.screenshot({ path: this.out, fullPage: false });
    },
  },
  {
    route: '/preview/workspace-light/admin/dashboard',
    out: 'qa-shots/chrome-admin-top-nav.png',
    viewport: { width: 390, height: 844 },
    async shot() {
      await page.waitForTimeout(2500);
      const toggle = page.locator('[data-fc-admin-nav-bar="1"] .fc-action-chip').first();
      if (await toggle.count()) {
        await toggle.click();
        await page.waitForTimeout(500);
        const nav = page.locator('[data-fc-admin-nav-bar="1"] .fc-view-tabs').first();
        if (await nav.count()) {
          await nav.screenshot({ path: this.out });
          return;
        }
      }
      await page.screenshot({ path: this.out, fullPage: false });
    },
  },
  {
    route: '/',
    out: 'qa-shots/chrome-home-public-chat.png',
    async shot() {
      const launcher = page.locator('.finely-public-chat-widget button, [data-fc-public-chat-widget="1"] button').first();
      await launcher.waitFor({ state: 'visible', timeout: 15_000 });
      await launcher.click();
      await page.waitForTimeout(800);
      const panel = page.locator('.fc-public-chat-panel').first();
      await panel.waitFor({ state: 'visible', timeout: 15_000 });
      await panel.screenshot({ path: this.out });
    },
  },
];

for (const cap of captures) {
  if (cap.viewport) {
    await page.setViewportSize(cap.viewport);
  } else {
    await page.setViewportSize({ width: 1440, height: 900 });
  }
  await page.goto(`${base}${cap.route}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  console.log(`route ${cap.route} -> ${page.url()}`);
  try {
    await cap.shot();
    console.log(`saved ${cap.out}`);
  } catch (err) {
    await page.screenshot({ path: cap.out.replace('.png', '-fallback.png'), fullPage: false });
    console.warn(`fallback for ${cap.route}:`, err?.message || err);
  }
}

await browser.close();
