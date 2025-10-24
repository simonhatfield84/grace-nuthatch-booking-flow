import { supabase } from "@/integrations/supabase/client";

export interface AvailabilityRequest {
  venueSlug: string;
  serviceId?: string;
  date: string;
  partySize: number;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface AvailabilityResponse {
  ok: boolean;
  venueId?: string;
  serviceId?: string;
  date?: string;
  partySize?: number;
  slots?: TimeSlot[];
  cached?: boolean;
  took_ms?: number;
  code?: string;
  message?: string;
}

export class AvailabilityApiClient {
  static async checkAvailability(
    request: AvailabilityRequest
  ): Promise<AvailabilityResponse> {
    try {
      console.log('Checking availability via API:', request);

      const { data, error } = await supabase.functions.invoke('check-availability', {
        body: request
      });

      if (error) {
        console.error('Availability API error:', error);
        throw error;
      }

      console.log('Availability API response:', data);
      return data;
    } catch (error) {
      console.error('Availability API client error:', error);
      return {
        ok: false,
        code: 'server_error',
        message: 'Failed to check availability. Please try again.'
      };
    }
  }
}
