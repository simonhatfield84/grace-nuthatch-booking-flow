
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfDay, parseISO } from "date-fns";
import { UnifiedAvailabilityService } from "./unifiedAvailabilityService";

export class OptimizedAvailabilityService {
  private static cache = new Map<string, { data: string[], timestamp: number }>();
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static clearCache() {
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
      console.log(`✅ Using cached availability data`);
      return cached.data;
    }

    try {
      // Get booking windows for this venue first
      const { data: bookingWindows, error: windowsError } = await supabase
        .from('booking_windows')
        .select('*')
        .eq('venue_id', venueId);

      if (windowsError) {
        console.error('Error fetching booking windows:', windowsError);
        return [];
      }

      if (!bookingWindows || bookingWindows.length === 0) {
        console.log(`❌ No booking windows found for venue ${venueId}`);
        return [];
      }

      console.log(`📋 Found ${bookingWindows.length} booking windows`);

      // Generate date range to check
      const datesToCheck: string[] = [];
      let currentDate = start;
      
      while (currentDate <= end) {
        datesToCheck.push(format(currentDate, 'yyyy-MM-dd'));
        currentDate = addDays(currentDate, 1);
      }

      console.log(`🗓️ Checking ${datesToCheck.length} dates`);

      // Check availability for each date in smaller batches
      const batchSize = 7; // Check one week at a time
      const availableDates: string[] = [];

      for (let i = 0; i < datesToCheck.length; i += batchSize) {
        const batch = datesToCheck.slice(i, i + batchSize);
        
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
              console.error(`Error checking availability for ${dateStr}:`, error);
              return null;
            }
          })
        );

        // Add successful results to available dates
        batchResults.forEach(result => {
          if (result) {
            availableDates.push(result);
          }
        });

        // Small delay between batches to prevent overwhelming the system
        if (i + batchSize < datesToCheck.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`✅ Found ${availableDates.length} available dates out of ${datesToCheck.length} checked`);

      // Cache the results
      this.cache.set(cacheKey, {
        data: availableDates,
        timestamp: Date.now()
      });

      return availableDates.sort();

    } catch (error) {
      console.error('Error in getAvailableDatesInChunks:', error);
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
      const { data: bookingWindows, error } = await supabase
        .from('booking_windows')
        .select('*')
        .eq('venue_id', venueId);

      if (error || !bookingWindows) {
        console.error('Error fetching booking windows:', error);
        return false;
      }

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
