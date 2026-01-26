import { test, expect } from '@playwright/test';

test.describe('Public Share Page', () => {
  test('should show not found for invalid slug', async ({ page }) => {
    await page.goto('/share/invalid-slug-that-does-not-exist');

    // Should show edge not found or 404
    await expect(
      page.getByText(/not found|doesn't exist|no edge/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('should load share page structure', async ({ page }) => {
    // This tests the page loads without errors
    // Even if the edge doesn't exist, the page should render
    const response = await page.goto('/share/test-slug');

    // Should return a valid response (not 500)
    expect(response?.status()).toBeLessThan(500);
  });
});
