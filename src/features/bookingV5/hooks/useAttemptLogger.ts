import { supabase } from '@/integrations/supabase/client';
import { UTMParams } from './useUTM';

export function useAttemptLogger(venueId: string, venueSlug: string) {
  const logAttempt = async (params: {
    serviceId?: string;
    date?: string;
    time?: string;
    partySize?: number;
    result: 'success' | 'failed' | 'abandoned';
    reason?: string;
    utm?: UTMParams;
    variant?: 'standard' | 'serviceFirst';
  }) => {
    try {
      await (supabase as any).from('booking_attempts').insert({
        venue_id: venueId,
        venue_slug: venueSlug,
        service_id: params.serviceId || null,
        date: params.date || null,
        time: params.time || null,
        party_size: params.partySize || null,
        result: params.result,
        reason: params.reason || null,
        variant: params.variant || null,
        utm: params.utm || {}
      });
    } catch (error) {
      console.error('Failed to log booking attempt:', error);
      // Don't throw - logging is non-critical
    }
  };
  
  return { logAttempt };
}
