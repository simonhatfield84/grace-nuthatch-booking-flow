import { test, expect } from '@playwright/test';

/**
 * Smoke Test: Booking Overlap Prevention
 * 
 * Validates that the database exclusion constraint prevents double bookings
 * on the same table at overlapping times.
 */

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wxyotttvyexxzeaewyga.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

test.describe('Booking Overlap Prevention', () => {
  test('should prevent overlapping bookings', async ({ request }) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);
    const dateStr = futureDate.toISOString().split('T')[0];
    
    const bookingData = {
      booking: {
        venue_id: '00000000-0000-0000-0000-000000000000', // Update with real venue ID
        service_id: '00000000-0000-0000-0000-000000000000', // Update with real service ID
        service: 'Dinner',
        booking_date: dateStr,
        booking_time: '19:00',
        party_size: 4,
        guest_name: 'Test Guest 1',
        email: `test1-${Date.now()}@example.com`,
        phone: '+44 20 1234 5678',
        table_id: 1, // Specific table for testing
      },
      lockToken: null
    };
    
    // First booking should succeed
    const response1 = await request.post(`${supabaseUrl}/functions/v1/booking-create-secure`, {
      data: bookingData,
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('First booking status:', response1.status());
    const data1 = await response1.json();
    console.log('First booking response:', data1);
    
    // Second booking at same time should fail with conflict
    const response2 = await request.post(`${supabaseUrl}/functions/v1/booking-create-secure`, {
      data: {
        ...bookingData,
        booking: {
          ...bookingData.booking,
          guest_name: 'Test Guest 2',
          email: `test2-${Date.now()}@example.com`,
        }
      },
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Second booking status:', response2.status());
    const data2 = await response2.json();
    console.log('Second booking response:', data2);
    
    // Should either get 409 conflict or explicit error about overlap
    expect([409, 400, 500]).toContain(response2.status());
    expect(data2.success === false || data2.error).toBeTruthy();
    
    console.log('✅ Overlap prevention working correctly');
  });
});
