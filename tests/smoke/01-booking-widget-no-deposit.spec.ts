import { test, expect } from '@playwright/test';

/**
 * Smoke Test: Booking Widget - No Deposit Flow
 * 
 * Validates the complete booking journey without payment requirements.
 * This is the most critical user path for the application.
 */

test.describe('Booking Widget - No Deposit Flow', () => {
  test('should complete booking without payment', async ({ page }) => {
    // Navigate to booking widget (update with real venue slug)
    await page.goto('/booking?venue=test-venue');
    
    // Wait for widget to load
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
    
    // Step 1: Party size selection
    const partySizeButton = page.locator('button').filter({ hasText: /\d+ guest/ }).first();
    if (await partySizeButton.isVisible()) {
      await partySizeButton.click();
    }
    
    // Step 2: Date selection
    await page.waitForTimeout(1000);
    const availableDate = page.locator('[role="button"]:not([disabled])').first();
    if (await availableDate.isVisible()) {
      await availableDate.click();
    }
    
    // Step 3: Time selection
    await page.waitForTimeout(1000);
    const timeSlot = page.locator('button').filter({ hasText: /\d{2}:\d{2}/ }).first();
    if (await timeSlot.isVisible()) {
      await timeSlot.click();
    }
    
    // Step 4: Service selection (if applicable)
    await page.waitForTimeout(1000);
    const serviceCard = page.locator('[data-testid="service-card"], button').first();
    if (await serviceCard.isVisible()) {
      await serviceCard.click();
    }
    
    // Step 5: Guest details
    await page.waitForTimeout(1000);
    
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test Guest');
    }
    
    const emailInput = page.locator('input[name="email"], input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill(`test-${Date.now()}@example.com`);
    }
    
    const phoneInput = page.locator('input[name="phone"], input[type="tel"]');
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('+44 20 1234 5678');
    }
    
    // Accept terms if present
    const termsCheckbox = page.locator('input[type="checkbox"]');
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }
    
    // Submit booking
    const submitButton = page.locator('button[type="submit"]').last();
    await submitButton.click();
    
    // Step 6: Confirmation
    await expect(page.locator('text=/confirmed|success|complete/i')).toBeVisible({ 
      timeout: 15000 
    });
    
    console.log('✅ Booking widget flow completed successfully');
  });
});
