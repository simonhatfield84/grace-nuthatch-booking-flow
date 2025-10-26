import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

/**
 * Smoke Test: Lock Management Flow
 * 
 * Validates that the lock creation, extension, and release APIs work correctly
 * and that database state is properly maintained.
 */

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wxyotttvyexxzeaewyga.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

test.describe('Lock Management Flow', () => {
  let lockToken: string;
  const testVenueSlug = 'test-venue';
  const testServiceId = '00000000-0000-0000-0000-000000000000'; // Update with real service ID
  
  test('should create lock via API', async ({ request }) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split('T')[0];
    
    const response = await request.post(`${supabaseUrl}/functions/v1/locks/create`, {
      data: {
        venueSlug: testVenueSlug,
        serviceId: testServiceId,
        date: dateStr,
        time: '19:00',
        partySize: 4
      },
      headers: {
        'apikey': supabaseKey
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.lockToken).toBeDefined();
    
    lockToken = data.lockToken;
    console.log('✅ Lock created:', lockToken.substring(0, 8) + '...');
    
    // Verify lock in database
    const { data: lock, error } = await supabase
      .from('booking_locks')
      .select('*')
      .eq('lock_token', lockToken)
      .single();
    
    expect(error).toBeNull();
    expect(lock).toBeDefined();
    expect(lock.released_at).toBeNull();
    console.log('✅ Lock verified in database');
  });
  
  test('should extend lock', async ({ request }) => {
    if (!lockToken) {
      test.skip();
      return;
    }
    
    const response = await request.post(`${supabaseUrl}/functions/v1/locks/extend`, {
      data: { lockToken },
      headers: {
        'apikey': supabaseKey
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.expiresAt).toBeDefined();
    console.log('✅ Lock extended');
  });
  
  test('should release lock', async ({ request }) => {
    if (!lockToken) {
      test.skip();
      return;
    }
    
    const response = await request.post(`${supabaseUrl}/functions/v1/locks/release`, {
      data: { lockToken },
      headers: {
        'apikey': supabaseKey
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.ok).toBe(true);
    console.log('✅ Lock released');
    
    // Verify lock released in DB
    const { data: lock } = await supabase
      .from('booking_locks')
      .select('released_at')
      .eq('lock_token', lockToken)
      .single();
    
    expect(lock?.released_at).not.toBeNull();
    console.log('✅ Lock release verified in database');
  });
});
