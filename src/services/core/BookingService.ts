
import { supabase } from "@/integrations/supabase/client";
import { AvailabilityService } from "./AvailabilityService";

export class CoreBookingService {
  // Create a new booking
  static async createBooking(bookingData: any) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          ...bookingData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  // Update an existing booking
  static async updateBooking(id: number, updates: any) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  }

  // Get bookings for a specific date
  static async getBookingsForDate(venueId: string, date: string) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('venue_id', venueId)
        .eq('booking_date', date)
        .order('booking_time');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }
  }

  // Get services for a venue
  static async getServices(venueId: string, partySize?: number) {
    try {
      let query = supabase
        .from('services')
        .select('*')
        .eq('venue_id', venueId)
        .eq('active', true)
        .eq('online_bookable', true)
        .order('title');

      if (partySize) {
        query = query
          .lte('min_guests', partySize)
          .gte('max_guests', partySize);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  }

  // Clean up expired bookings
  static async cleanupExpiredBookings() {
    try {
      const { error } = await supabase.rpc('expire_pending_payments');
      
      if (error) {
        console.error('Error cleaning up expired bookings:', error);
        throw error;
      }
      
      console.log('✅ Expired bookings cleaned up successfully');
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
  }

  // Delegate availability methods to AvailabilityService
  static getAvailableDates = AvailabilityService.getAvailableDates.bind(AvailabilityService);
  static getAvailableTimeSlots = AvailabilityService.getAvailableTimeSlots.bind(AvailabilityService);
  static checkDateAvailability = AvailabilityService.checkDateAvailability.bind(AvailabilityService);
  static clearCache = AvailabilityService.clearCache.bind(AvailabilityService);
}
