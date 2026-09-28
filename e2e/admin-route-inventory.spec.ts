import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { canUseDevMockAuth, e2ePortalCredentials, isSupabaseConfiguredInLocalEnv } from './helpers/localEnv';
import { signInViaPortal } from './helpers/devAuth';

const skipReason = isSupabaseConfiguredInLocalEnv() && !e2ePortalCredentials()
  ? 'Supabase configured — set E2E_TEST_EMAIL + E2E_TEST_PASSWORD'
  : !canUseDevMockAuth() && !e2ePortalCredentials()
    ? 'No dev mock auth and no E2E credentials'
    : null;

function listStaticAdminRoutes(): string[] {
  const app = fs.readFileSync(path.resolve('src/App.tsx'), 'utf8');
  const found = [...app.matchAll(/path="(\/admin[^"]*)"/g)].map((m) => m[1]);
  return [...new Set(found)]
    .filter((p) => p === '/admin' || p.startsWith('/admin/'))
    .filter((p) => !p.includes(':') && !p.includes('*') && !p.includes('preview'))
    .sort();
}

test.describe('Admin route inventory', () => {
  test.skip(!!skipReason, skipReason ?? '');
  test.setTimeout(180_000);

  test('every static /admin mount in App.tsx is listed', () => {
    const routes = listStaticAdminRoutes();
    expect(routes.length).toBeGreaterThan(40);
    expect(routes).toContain('/admin');
    expect(routes).toContain('/admin/crm');
    expect(routes).toContain('/admin/leads');
    expect(routes).toContain('/admin/resources');
  });

  test('authenticated admin routes render without pageerror', async ({ page }) => {
    const adminEmail = e2ePortalCredentials()?.email ?? 'partnersupport@finelycred.com';
    const adminPassword = e2ePortalCredentials()?.password ?? 'testpassword1';
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await signInViaPortal(page, { email: adminEmail, password: adminPassword });

    const core = [
      '/admin',
      '/admin/crm',
      '/admin/leads',
      '/admin/leads-os',
      '/admin/resources',
      '/admin/haitian',
      '/admin/partners',
      '/admin/courses',
      '/admin/settings',
    ];
    const rest = listStaticAdminRoutes().filter((p) => !core.includes(p)).slice(0, 24);
    const routes = [...core, ...rest];

    for (const route of routes) {
      errors.length = 0;
      const res = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      expect(res?.ok() ?? true, `${route} HTTP`).toBeTruthy();
      await expect(page.locator('body')).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 24);
      expect(overflow, `${route} horizontal overflow`).toBeFalsy();
      const serious = errors.filter((e) => !/Download the React DevTools|favicon|net::ERR/i.test(e));
      expect(serious, `${route} console/page errors: ${serious.join(' | ')}`).toEqual([]);
    }
  });
});
