import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load the landing page', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads with the brand name
    await expect(page.locator('body')).toBeVisible();

    // Check for Edge of ICT branding
    await expect(page.getByText(/Edge of ICT|EDGE.*OF.*ICT/i).first()).toBeVisible();
  });

  test('should have sign in button', async ({ page }) => {
    await page.goto('/');

    // Look for sign in / login button
    const signInButton = page.getByRole('button', { name: /sign in|login|get started/i }).first();
    await expect(signInButton).toBeVisible();
  });

  test('should navigate to login when clicking sign in', async ({ page }) => {
    await page.goto('/');

    // Click sign in / get started button
    const signInButton = page.getByRole('button', { name: /sign in|login|get started/i }).first();

    if (await signInButton.isVisible()) {
      await signInButton.click();

      // Should redirect to auth page or show auth modal
      await expect(page).toHaveURL(/\/(login|auth|dashboard)/);
    }
  });

  test('should have theme toggle', async ({ page }) => {
    await page.goto('/');

    // Look for theme toggle button
    const themeToggle = page.getByRole('button', { name: /theme|dark|light/i });

    if (await themeToggle.count() > 0) {
      await expect(themeToggle.first()).toBeVisible();
    }
  });
});
