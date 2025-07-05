
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePlatformMetrics = () => {
  return useQuery({
    queryKey: ['platform-metrics'],
    queryFn: async () => {
      // Get venue counts
      const { data: venues, error: venuesError } = await supabase
        .from('venues')
        .select('approval_status');

      if (venuesError) throw venuesError;

      // Get user count
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id');

      if (profilesError) throw profilesError;

      // Get booking count
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id');

      if (bookingsError) throw bookingsError;

      const totalVenues = venues?.length || 0;
      const activeVenues = venues?.filter(v => v.approval_status === 'approved').length || 0;
      const pendingVenues = venues?.filter(v => v.approval_status === 'pending').length || 0;
      const totalUsers = profiles?.length || 0;
      const totalBookings = bookings?.length || 0;

      return {
        totalVenues,
        activeVenues,
        pendingVenues,
        totalUsers,
        totalBookings,
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
