
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, addDays, isAfter, isBefore } from "date-fns";
import { CalendarIcon, Loader2 } from 'lucide-react';
import { UnifiedAvailabilityService } from "@/services/unifiedAvailabilityService";
import { supabase } from "@/integrations/supabase/client";

interface DateSelectorWithAvailabilityProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date | undefined) => void;
  partySize: number;
  venueId?: string;
}

export const DateSelectorWithAvailability = ({
  selectedDate,
  onDateSelect,
  partySize,
  venueId
}: DateSelectorWithAvailabilityProps) => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const queryClient = useQueryClient();

  // Get booking windows for the venue
  const { data: bookingWindows = [] } = useQuery({
    queryKey: ['booking-windows', venueId],
    queryFn: async () => {
      if (!venueId) return [];
      
      const { data, error } = await supabase
        .from('booking_windows')
        .select('*')
        .eq('venue_id', venueId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!venueId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Get available dates using unified service with cache invalidation
  const { data: availableDates = [], isLoading, error, isSuccess } = useQuery({
    queryKey: ['unified-available-dates', partySize, venueId],
    queryFn: async () => {
      if (!venueId || bookingWindows.length === 0) return [];

      console.log(`🚀 Starting enhanced availability check for ${partySize} guests`);
      const startTime = performance.now();
      
      try {
        const dates: Date[] = [];
        const totalDays = 60;
        let processedDays = 0;

        // Process dates in chunks for better UX
        const chunkSize = 10;
        for (let i = 0; i < totalDays; i += chunkSize) {
          const chunkPromises: Promise<{ date: Date; available: boolean }>[] = [];
          
          for (let j = 0; j < chunkSize && (i + j) < totalDays; j++) {
            const date = addDays(new Date(), i + j);
            const dateStr = format(date, 'yyyy-MM-dd');
            
            chunkPromises.push(
              UnifiedAvailabilityService.checkDateAvailability(venueId, dateStr, partySize, bookingWindows)
                .then(available => ({ date, available }))
            );
          }

          const chunkResults = await Promise.all(chunkPromises);
          const availableInChunk = chunkResults
            .filter(result => result.available)
            .map(result => result.date);
          
          dates.push(...availableInChunk);
          processedDays += chunkResults.length;
          
          // Update progress
          const progress = Math.round((processedDays / totalDays) * 100);
          setLoadingProgress(progress);
          
          console.log(`✅ Processed chunk ${Math.floor(i/chunkSize) + 1}: ${availableInChunk.length} available`);
        }
        
        const endTime = performance.now();
        console.log(`⚡ Enhanced availability check completed in ${Math.round(endTime - startTime)}ms`);
        console.log(`🎯 Total available dates: ${dates.length}`);
        
        return dates;
      } catch (error) {
        console.error('❌ Enhanced availability check failed:', error);
        throw error;
      }
    },
    enabled: !!venueId && partySize > 0 && bookingWindows.length > 0,
    staleTime: 2 * 60 * 1000, // Reduced cache time for more real-time updates
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  // Handle cache invalidation when dates are successfully loaded
  useEffect(() => {
    if (isSuccess && availableDates) {
      // Invalidate related time slot queries when dates are refreshed
      queryClient.invalidateQueries({ queryKey: ['unified-time-slots'] });
    }
  }, [isSuccess, availableDates, queryClient]);

  const isDateAvailable = (date: Date) => {
    return availableDates.some(availableDate => 
      format(availableDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const isDateDisabled = (date: Date) => {
    // Disable past dates
    if (isBefore(date, new Date())) return true;
    
    // Disable dates more than 60 days in future
    if (isAfter(date, addDays(new Date(), 60))) return true;
    
    // Disable dates without availability
    return !isDateAvailable(date);
  };

  if (error) {
    console.error('Error loading availability:', error);
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900">
      <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
        <CardTitle className="text-2xl text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <CalendarIcon className="h-6 w-6" />
          Choose your date
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          Select from available dates for {partySize} {partySize === 1 ? 'person' : 'people'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 bg-white dark:bg-gray-900">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <div className="text-center">
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                Checking availability with enhanced validation...
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {loadingProgress > 0 ? `${loadingProgress}% complete` : 'Validating against actual table allocation'}
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400 font-medium">
                Unable to check availability
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Please try again or contact us directly
              </p>
            </div>
          </div>
        ) : (
          <>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={onDateSelect}
              disabled={isDateDisabled}
              className="rounded-md border border-gray-300 dark:border-gray-600 mx-auto"
            />
            
            {availableDates.length === 0 && !isLoading && (
              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800 text-center">
                <p className="text-amber-800 dark:text-amber-200">
                  No availability found for {partySize} {partySize === 1 ? 'person' : 'people'} in the next 60 days.
                </p>
                <p className="text-amber-700 dark:text-amber-300 text-sm mt-1">
                  Try reducing your party size or contact us directly.
                </p>
              </div>
            )}

            {availableDates.length > 0 && (
              <div className="mt-4 text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {availableDates.length} dates available for your party size
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  ✅ Enhanced validation with race condition protection
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
