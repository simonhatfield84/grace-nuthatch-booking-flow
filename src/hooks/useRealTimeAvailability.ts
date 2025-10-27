
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TableAvailabilityService } from '@/services/tableAvailabilityService';
import { format } from 'date-fns';

interface TimeSlotAvailability {
  time: string;
  available: boolean;
  tableCount: number;
  status: 'plenty' | 'limited' | 'full';
  message: string;
}

interface UseRealTimeAvailabilityProps {
  selectedDate: Date | null;
  partySize: number;
  venueId?: string;
  refreshInterval?: number;
}

export const useRealTimeAvailability = ({
  selectedDate,
  partySize,
  venueId,
  refreshInterval = 30000 // 30 seconds
}: UseRealTimeAvailabilityProps) => {
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Force refresh function
  const forceRefresh = useCallback(() => {
    setLastRefresh(Date.now());
  }, []);

  // Get venue ID if not provided (for public bookings)
  const { data: defaultVenue } = useQuery({
    queryKey: ['default-venue'],
    queryFn: async () => {
      const { data } = await supabase
        .from('venues_public')
        .select('id')
        .limit(1)
        .single();
      return data;
    },
    enabled: !venueId
  });

  const targetVenueId = venueId || defaultVenue?.id;

  // Get real-time availability data
  const { data: availabilityData, isLoading, error } = useQuery({
    queryKey: ['real-time-availability', selectedDate, partySize, targetVenueId, lastRefresh],
    queryFn: async () => {
      if (!selectedDate || !targetVenueId) return {};
      
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const startTime = '17:00';
      const endTime = '22:00';
      
      return await TableAvailabilityService.getRealTimeAvailability(
        targetVenueId,
        dateStr,
        startTime,
        endTime,
        partySize
      );
    },
    enabled: !!selectedDate && !!targetVenueId,
    refetchInterval: refreshInterval,
    staleTime: 15000 // Consider data stale after 15 seconds
  });

  // Process availability data into enhanced format
  const processedSlots: TimeSlotAvailability[] = useMemo(() => {
    if (!availabilityData) return [];

    return Object.entries(availabilityData).map(([time, data]) => {
      const { available, tableCount } = data;
      
      let status: 'plenty' | 'limited' | 'full';
      let message: string;

      if (!available || tableCount === 0) {
        status = 'full';
        message = 'Fully booked';
      } else if (tableCount === 1) {
        status = 'limited';
        message = 'Only 1 table left';
      } else if (tableCount <= 3) {
        status = 'limited';
        message = `${tableCount} tables available`;
      } else {
        status = 'plenty';
        message = `${tableCount} tables available`;
      }

      return {
        time,
        available,
        tableCount,
        status,
        message
      };
    });
  }, [availabilityData]);

  // Auto-refresh setup
  useEffect(() => {
    if (!refreshInterval) return;

    const interval = setInterval(() => {
      forceRefresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, forceRefresh]);

  return {
    slots: processedSlots,
    isLoading,
    error,
    forceRefresh,
    lastRefresh: new Date(lastRefresh)
  };
};
