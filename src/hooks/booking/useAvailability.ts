
import { useQuery } from "@tanstack/react-query";
import { AvailabilityService } from "@/services/core/AvailabilityService";
import { format } from "date-fns";

export function useAvailability(
  venueId: string,
  partySize: number,
  selectedDate?: Date
) {
  // Get available dates
  const { data: availableDates = [], isLoading: datesLoading } = useQuery({
    queryKey: ['available-dates', venueId, partySize],
    queryFn: () => AvailabilityService.getAvailableDates(venueId, partySize),
    enabled: !!venueId && partySize > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Get available time slots for selected date
  const { data: timeSlots = [], isLoading: timeSlotsLoading } = useQuery({
    queryKey: ['time-slots', venueId, selectedDate, partySize],
    queryFn: () => {
      if (!selectedDate) return [];
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      return AvailabilityService.getAvailableTimeSlots(venueId, dateStr, partySize);
    },
    enabled: !!venueId && !!selectedDate && partySize > 0,
    staleTime: 2 * 60 * 1000,
  });

  const clearCache = () => {
    AvailabilityService.clearCache();
  };

  return {
    availableDates,
    timeSlots,
    isLoading: datesLoading || timeSlotsLoading,
    clearCache,
  };
}
