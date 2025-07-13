
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, isAfter, isBefore } from "date-fns";
import { CalendarIcon, Loader2 } from 'lucide-react';
import { OptimizedAvailabilityService } from "@/services/optimizedAvailabilityService";

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

  // Get available dates using optimized service
  const { data: availableDates = [], isLoading, error } = useQuery({
    queryKey: ['optimized-available-dates', partySize, venueId],
    queryFn: async () => {
      if (!venueId) return [];

      console.log(`🚀 Starting optimized availability check for ${partySize} guests`);
      const startTime = performance.now();
      
      try {
        const dates = await OptimizedAvailabilityService.getAvailableDatesInChunks(
          venueId,
          partySize,
          15 // Process 15 dates at a time
        );
        
        const endTime = performance.now();
        console.log(`⚡ Optimized check completed in ${Math.round(endTime - startTime)}ms`);
        
        return dates;
      } catch (error) {
        console.error('❌ Optimized availability check failed:', error);
        throw error;
      }
    },
    enabled: !!venueId && partySize > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
    refetchOnWindowFocus: false, // Don't refetch when user returns to tab
  });

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
                Checking availability...
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                This may take a moment for the first search
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
                  ⚡ Powered by optimized availability checking
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
