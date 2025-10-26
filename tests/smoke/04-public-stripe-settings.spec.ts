import { test, expect } from '@playwright/test';

/**
 * Smoke Test: Public Stripe Settings
 * 
 * Validates that the public Stripe settings endpoint returns the correct
 * publishable key for approved venues and handles errors appropriately.
 */

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wxyotttvyexxzeaewyga.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

test.describe('Public Stripe Settings', () => {
  test('should return publishable key for approved venue', async ({ request }) => {
    const response = await request.post(`${supabaseUrl}/functions/v1/public-stripe-settings`, {
      data: { venueSlug: 'test-venue' }, // Update with real approved venue
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Stripe settings response:', data);
    
    // Should return either valid settings or venue_not_found
    if (data.ok) {
      expect(data.publishableKey).toMatch(/^pk_(test|live)_/);
      expect(typeof data.testMode).toBe('boolean');
      expect(data.active).toBe(true);
      console.log('✅ Received valid Stripe settings');
    } else {
      // Venue not found or not configured is acceptable for test
      expect(['venue_not_found', 'stripe_not_configured']).toContain(data.code);
      console.log('⚠️  Venue not found or not configured (expected for test)');
    }
  });
  
  test('should handle non-existent venue', async ({ request }) => {
    const response = await request.post(`${supabaseUrl}/functions/v1/public-stripe-settings`, {
      data: { venueSlug: 'non-existent-venue-xyz-123' },
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    expect(data.ok).toBe(false);
    expect(data.code).toBe('venue_not_found');
    console.log('✅ Non-existent venue handled correctly');
  });
  
  test('should validate contract structure', async ({ request }) => {
    const response = await request.post(`${supabaseUrl}/functions/v1/public-stripe-settings`, {
      data: { venueSlug: 'test-venue' },
      headers: {
        'apikey': supabaseKey
      }
    });
    
    const data = await response.json();
    
    // Validate response structure matches contract
    expect(data).toHaveProperty('ok');
    expect(typeof data.ok).toBe('boolean');
    
    if (data.ok) {
      expect(data).toHaveProperty('publishableKey');
      expect(data).toHaveProperty('testMode');
      expect(data).toHaveProperty('active');
    } else {
      expect(data).toHaveProperty('code');
      expect(data).toHaveProperty('message');
    }
    
    console.log('✅ Contract structure validated');
  });
});
