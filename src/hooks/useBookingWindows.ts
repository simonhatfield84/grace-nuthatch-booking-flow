
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sortDaysChronologically } from "@/utils/dayUtils";
import { useEffect } from "react";

export const useBookingWindows = () => {
  const { data: allBookingWindows = [], isLoading: isLoadingWindows, error: windowsError } = useQuery({
    queryKey: ['all-booking-windows'],
    queryFn: async () => {
      console.log('Fetching booking windows...');
      const { data, error } = await supabase
        .from('booking_windows')
        .select('*')
        .order('created_at');
      
      if (error) {
        console.error('Error fetching booking windows:', error);
        throw error;
      }
      
      console.log('Raw booking windows data:', data);
      
      // Transform data with safer date parsing
      const transformedData = data.map(window => {
        try {
          const transformed = {
            ...window,
            days: sortDaysChronologically(window.days), // Sort days chronologically
            start_date: window.start_date ? new Date(window.start_date) : null,
            end_date: window.end_date ? new Date(window.end_date) : null,
            blackout_periods: Array.isArray(window.blackout_periods) 
              ? window.blackout_periods.map((bp: any) => {
                  try {
                    return {
                      ...bp,
                      startDate: bp.startDate ? new Date(bp.startDate) : new Date(),
                      endDate: bp.endDate ? new Date(bp.endDate) : new Date()
                    };
                  } catch (dateError) {
                    console.warn('Error parsing blackout period dates:', dateError, bp);
                    return {
                      ...bp,
                      startDate: new Date(),
                      endDate: new Date()
                    };
                  }
                })
              : []
          };
          
          console.log('Transformed window:', transformed);
          return transformed;
        } catch (transformError) {
          console.error('Error transforming booking window:', transformError, window);
          return {
            ...window,
            start_date: null,
            end_date: null,
            blackout_periods: []
          };
        }
      });
      
      console.log('Final transformed booking windows:', transformedData);
      return transformedData;
    }
  });

  // Log any query errors
  useEffect(() => {
    if (windowsError) {
      console.error('Booking windows query error:', windowsError);
    }
  }, [windowsError]);

  // Helper function to get booking windows for a service
  const getWindowsForService = (serviceId: string) => {
    const windows = allBookingWindows.filter(window => window.service_id === serviceId);
    console.log(`Windows for service ${serviceId}:`, windows);
    return windows;
  };

  return {
    allBookingWindows,
    isLoadingWindows,
    windowsError,
    getWindowsForService
  };
};
