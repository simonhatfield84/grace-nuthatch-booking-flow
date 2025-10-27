import { test, expect } from '@playwright/test';

test.describe('Legacy Widget - Slug-Based Routing', () => {
  test('loads The Nuthatch via slug', async ({ page }) => {
    await page.goto('/booking/the-nuthatch');
    
    // Check first step is visible (party size selection)
    await expect(page.locator('text=Party & Date')).toBeVisible({ timeout: 10000 });
    
    // Select party size
    await page.locator('button').filter({ hasText: /^2$/ }).first().click();
    
    // Wait for date picker to be available
    await page.waitForTimeout(500);
    
    // Find and click a future date
    const futureDate = page.locator('[role="gridcell"]:not([aria-disabled="true"])').first();
    await futureDate.click();
    
    // Should show service step after date selection
    await expect(page.locator('text=Service')).toBeVisible({ timeout: 5000 });
  });

  test('shows error for invalid venue slug', async ({ page }) => {
    await page.goto('/booking/invalid-venue-9999');
    
    // Should show "Venue Not Found" error
    await expect(page.locator('text=Venue Not Found')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=invalid-venue-9999')).toBeVisible();
  });

  test('redirects /booking to /booking/the-nuthatch', async ({ page }) => {
    await page.goto('/booking');
    
    // Should redirect to the-nuthatch
    await expect(page).toHaveURL('/booking/the-nuthatch');
    
    // Should show party step
    await expect(page.locator('text=Party & Date')).toBeVisible({ timeout: 10000 });
  });
});
