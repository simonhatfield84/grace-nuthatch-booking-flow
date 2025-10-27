
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfDay, parseISO } from "date-fns";
import { UnifiedAvailabilityService } from "./unifiedAvailabilityService";
import type { Json } from "@/integrations/supabase/types";

// Updated interface to match database types
interface DatabaseBookingWindow {
  id: string;
  venue_id: string;
  service_id: string;
  days: string[];
  start_time: string;
  end_time: string;
  max_bookings_per_slot: number;
  start_date?: string | null;
  end_date?: string | null;
  blackout_periods?: Json | null;
}

// Helper function to safely parse blackout periods
function parseBlackoutPeriods(blackoutPeriodsJson: Json | null): any[] {
  if (!blackoutPeriodsJson) return [];
  
  try {
    if (Array.isArray(blackoutPeriodsJson)) {
      return blackoutPeriodsJson;
    }
    if (typeof blackoutPeriodsJson === 'string') {
      return JSON.parse(blackoutPeriodsJson);
    }
    return [];
  } catch (error) {
    console.warn('Failed to parse blackout periods:', error);
    return [];
  }
}

// Helper function to convert database booking window to service format
function convertToBookingWindow(dbWindow: DatabaseBookingWindow) {
  return {
    ...dbWindow,
    blackout_periods: parseBlackoutPeriods(dbWindow.blackout_periods)
  };
}

export class OptimizedAvailabilityService {
  private static cache = new Map<string, { data: string[], timestamp: number }>();
  private static CACHE_DURATION = 10 * 60 * 1000; // 10 minutes - Extended for better performance

  static clearCache() {
    console.log('🗑️ Clearing availability cache');
    this.cache.clear();
  }

  /**
   * Get available dates in chunks to optimize performance
   */
  static async getAvailableDatesInChunks(
    venueId: string,
    partySize: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<string[]> {
    const start = startDate || startOfDay(new Date());
    const end = endDate || addDays(start, 90); // Default to 3 months

    console.log(`🔍 Getting available dates for venue ${venueId}, party size ${partySize}`);
    console.log(`📅 Date range: ${format(start, 'yyyy-MM-dd')} to ${format(end, 'yyyy-MM-dd')}`);

    // Create cache key
    const cacheKey = `${venueId}-${partySize}-${format(start, 'yyyy-MM-dd')}-${format(end, 'yyyy-MM-dd')}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`✅ Using cached availability data (${cached.data.length} dates)`);
      return cached.data;
    }

    try {
      // Get booking windows for this venue first
      const { data: dbBookingWindows, error: windowsError } = await supabase
        .from('booking_windows_public')
        .select('*')
        .eq('venue_id', venueId);

      if (windowsError) {
        console.error('❌ Error fetching booking windows:', windowsError);
        return [];
      }

      if (!dbBookingWindows || dbBookingWindows.length === 0) {
        console.log(`❌ No booking windows found for venue ${venueId}`);
        return [];
      }

      console.log(`📋 Found ${dbBookingWindows.length} booking windows`);
      
      // Convert database windows to service format
      const bookingWindows = dbBookingWindows.map(convertToBookingWindow);
      
      // Log booking windows details for debugging
      bookingWindows.forEach(window => {
        const blackoutCount = window.blackout_periods?.length || 0;
        console.log(`📋 Window ${window.id}:`, {
          service_id: window.service_id,
          days: window.days,
          times: `${window.start_time}-${window.end_time}`,
          blackouts: blackoutCount
        });
      });

      // Generate date range to check
      const datesToCheck: string[] = [];
      let currentDate = start;
      
      while (currentDate <= end) {
        datesToCheck.push(format(currentDate, 'yyyy-MM-dd'));
        currentDate = addDays(currentDate, 1);
      }

      console.log(`🗓️ Checking ${datesToCheck.length} dates`);

      // Check availability for each date in optimized batches
      const batchSize = 21; // Increased from 14 to 21 days for better performance
      const availableDates: string[] = [];

      for (let i = 0; i < datesToCheck.length; i += batchSize) {
        const batch = datesToCheck.slice(i, i + batchSize);
        console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(datesToCheck.length/batchSize)}: ${batch[0]} to ${batch[batch.length-1]}`);
        
        const batchResults = await Promise.all(
          batch.map(async (dateStr) => {
            try {
              const hasAvailability = await UnifiedAvailabilityService.checkDateAvailability(
                venueId,
                dateStr,
                partySize,
                bookingWindows
              );
              
              return hasAvailability ? dateStr : null;
            } catch (error) {
              console.error(`❌ Error checking availability for ${dateStr}:`, error);
              return null;
            }
          })
        );

        // Add successful results to available dates
        const batchAvailable = batchResults.filter(result => result !== null) as string[];
        availableDates.push(...batchAvailable);
        console.log(`✅ Batch complete: ${batchAvailable.length}/${batch.length} dates available`);

        // Reduced delay for better performance - decreased from 50ms to 25ms
        if (i + batchSize < datesToCheck.length) {
          await new Promise(resolve => setTimeout(resolve, 25));
        }
      }

      console.log(`✅ Final result: ${availableDates.length} available dates out of ${datesToCheck.length} checked`);

      // Cache the results
      this.cache.set(cacheKey, {
        data: availableDates,
        timestamp: Date.now()
      });

      return availableDates.sort();

    } catch (error) {
      console.error('❌ Error in getAvailableDatesInChunks:', error);
      return [];
    }
  }

  /**
   * Check if a specific date has availability
   */
  static async checkSingleDateAvailability(
    venueId: string,
    date: string,
    partySize: number
  ): Promise<boolean> {
    try {
      // Get booking windows for this venue
      const { data: dbBookingWindows, error } = await supabase
        .from('booking_windows_public')
        .select('*')
        .eq('venue_id', venueId);

      if (error || !dbBookingWindows) {
        console.error('Error fetching booking windows:', error);
        return false;
      }

      // Convert to service format
      const bookingWindows = dbBookingWindows.map(convertToBookingWindow);

      return await UnifiedAvailabilityService.checkDateAvailability(
        venueId,
        date,
        partySize,
        bookingWindows
      );
    } catch (error) {
      console.error('Error checking single date availability:', error);
      return false;
    }
  }
}
