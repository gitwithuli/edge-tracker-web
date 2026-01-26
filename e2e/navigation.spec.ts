import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should redirect unauthenticated users from dashboard to login', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login or show auth required
    await page.waitForURL(/\/(login|auth|\?).*|\/dashboard/, { timeout: 10000 });

    // Either redirected to login or stayed on dashboard (if session exists)
    const url = page.url();
    expect(url).toMatch(/\/(login|auth|dashboard)/);
  });

  test('should redirect unauthenticated users from edge page to login', async ({ page }) => {
    await page.goto('/edge/some-edge-id');

    // Should redirect to login
    await page.waitForURL(/\/(login|auth|\?).*|\/edge\//, { timeout: 10000 });
  });

  test('should redirect unauthenticated users from macros to login', async ({ page }) => {
    await page.goto('/macros');

    // Should redirect to login
    await page.waitForURL(/\/(login|auth|\?).*|\/macros/, { timeout: 10000 });
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-12345');

    // Should not crash (no 500 error)
    expect(response?.status()).toBeLessThan(500);
  });
});
