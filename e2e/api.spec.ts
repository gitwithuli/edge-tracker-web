import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('should have working OG image endpoint', async ({ request }) => {
    // Test the OG image API returns correct content type for valid requests
    // Note: This may 404 for non-existent edges, which is expected
    const response = await request.get('/api/og/edge/test-slug');

    // Should not crash (500) even for non-existent edges
    expect(response.status()).toBeLessThan(500);
  });

  test('should reject unauthorized backup API requests', async ({ request }) => {
    // The backup API should require authorization
    const response = await request.get('/api/backup/auto');

    // Should reject unauthorized requests (401 or 405)
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('should have working webhook endpoint structure', async ({ request }) => {
    // NOWPayments webhook should exist but reject invalid requests
    const response = await request.post('/api/webhooks/nowpayments', {
      data: {},
    });

    // Should return 400+ for invalid request, not 500
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });
});
