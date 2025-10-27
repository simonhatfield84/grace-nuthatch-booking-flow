import { test, expect } from '@playwright/test';

test.describe('V5 Widget - Disabled State', () => {
  test('shows "temporarily unavailable" message for V5 routes', async ({ page }) => {
    await page.goto('/booking/the-nuthatch/v5');
    
    await expect(page.locator('text=Widget Temporarily Unavailable')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Use Standard Booking')).toBeVisible();
  });

  test('V5 standard booking link redirects to legacy widget', async ({ page }) => {
    await page.goto('/booking/the-nuthatch/v5');
    
    // Click the "Use Standard Booking" button
    await page.locator('text=Use Standard Booking').click();
    
    // Should redirect to legacy widget
    await expect(page).toHaveURL(/\/booking\/the-nuthatch$/);
    await expect(page.locator('text=Party & Date')).toBeVisible({ timeout: 10000 });
  });
});
