
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, subDays } from "date-fns";

export const useDashboardData = () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(new Date()), 'yyyy-MM-dd');

  // Today's bookings
  const { data: todaysBookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['dashboard-todays-bookings', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_date', today)
        .order('booking_time');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Weekly bookings for trend
  const { data: weeklyBookings = [], isLoading: loadingWeekly } = useQuery({
    queryKey: ['dashboard-weekly-bookings', weekStart, weekEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('booking_date, party_size, status, service')
        .gte('booking_date', weekStart)
        .lte('booking_date', weekEnd);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Guest count
  const { data: guestStats, isLoading: loadingGuests } = useQuery({
    queryKey: ['dashboard-guest-stats'],
    queryFn: async () => {
      const { count } = await supabase
        .from('guests')
        .select('*', { count: 'exact', head: true });
      
      return { totalGuests: count || 0 };
    }
  });

  // Table availability
  const { data: tableStats, isLoading: loadingTables } = useQuery({
    queryKey: ['dashboard-table-stats'],
    queryFn: async () => {
      const { data: tables } = await supabase
        .from('tables')
        .select('id, seats, online_bookable')
        .neq('status', 'deleted');

      const { data: todaysTableBookings } = await supabase
        .from('bookings')
        .select('table_id')
        .eq('booking_date', today)
        .not('table_id', 'is', null);

      const totalTables = tables?.length || 0;
      const bookedTables = new Set(todaysTableBookings?.map(b => b.table_id)).size;
      
      return {
        totalTables,
        availableTables: totalTables - bookedTables,
        bookedTables
      };
    }
  });

  // Revenue calculation
  const { data: revenueStats, isLoading: loadingRevenue } = useQuery({
    queryKey: ['dashboard-revenue', weekStart, weekEnd],
    queryFn: async () => {
      // This is a simplified calculation - in reality, you'd have pricing data
      const { data: weekBookings } = await supabase
        .from('bookings')
        .select('party_size, service, status')
        .gte('booking_date', weekStart)
        .lte('booking_date', weekEnd)
        .in('status', ['confirmed', 'seated', 'finished']);

      const estimatedRevenue = weekBookings?.reduce((total, booking) => {
        const basePrice = booking.service === 'Afternoon Tea' ? 25 : 45;
        return total + (booking.party_size * basePrice);
      }, 0) || 0;

      return { weeklyRevenue: estimatedRevenue };
    }
  });

  // Unallocated bookings
  const { data: unallocatedBookings = [], isLoading: loadingUnallocated } = useQuery({
    queryKey: ['dashboard-unallocated', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, guest_name, booking_time, party_size, service')
        .eq('booking_date', today)
        .eq('is_unallocated', true)
        .eq('status', 'confirmed');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Calculate metrics
  const todaysCount = todaysBookings.length;
  const yesterdayCount = weeklyBookings.filter(b => 
    b.booking_date === format(subDays(new Date(), 1), 'yyyy-MM-dd')
  ).length;
  const bookingTrend = todaysCount - yesterdayCount;

  const statusBreakdown = todaysBookings.reduce((acc, booking) => {
    acc[booking.status] = (acc[booking.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const servicePopularity = weeklyBookings.reduce((acc, booking) => {
    acc[booking.service || 'Unknown'] = (acc[booking.service || 'Unknown'] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const averagePartySize = todaysBookings.length > 0 
    ? Math.round(todaysBookings.reduce((sum, b) => sum + b.party_size, 0) / todaysBookings.length * 10) / 10
    : 0;

  return {
    todaysBookings: {
      count: todaysCount,
      trend: bookingTrend,
      bookings: todaysBookings,
      statusBreakdown,
      averagePartySize
    },
    guests: {
      total: guestStats?.totalGuests || 0
    },
    tables: {
      total: tableStats?.totalTables || 0,
      available: tableStats?.availableTables || 0,
      booked: tableStats?.bookedTables || 0
    },
    revenue: {
      weekly: revenueStats?.weeklyRevenue || 0
    },
    unallocated: unallocatedBookings,
    servicePopularity,
    isLoading: loadingBookings || loadingWeekly || loadingGuests || loadingTables || loadingRevenue || loadingUnallocated
  };
};
