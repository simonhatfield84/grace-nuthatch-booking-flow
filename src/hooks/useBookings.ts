
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TableAllocationService } from "@/services/tableAllocation";
import { calculateBookingDuration, getServiceIdFromServiceName } from "@/utils/durationCalculation";

export interface Booking {
  id: number;
  table_id: number | null;
  guest_name: string;
  party_size: number;
  booking_date: string;
  booking_time: string;
  status: 'confirmed' | 'seated' | 'finished' | 'cancelled' | 'late';
  is_unallocated: boolean;
  original_table_id: number | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  service: string;
  duration_minutes: number;
  end_time: string;
  booking_reference: string | null;
  created_at: string;
  updated_at: string;
}

export const useBookings = (date?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings', date],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select('*')
        .order('booking_time');
      
      if (date) {
        query = query.eq('booking_date', date);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []) as Booking[];
    }
  });

  const createBookingMutation = useMutation({
    mutationFn: async (newBooking: Omit<Booking, 'id' | 'created_at' | 'updated_at' | 'table_id' | 'is_unallocated' | 'duration_minutes' | 'end_time' | 'booking_reference'>) => {
      // Calculate duration from service rules
      const serviceId = newBooking.service ? await getServiceIdFromServiceName(newBooking.service) : null;
      const duration = await calculateBookingDuration(serviceId || undefined, newBooking.party_size);

      // First create the booking with calculated duration
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert([{
          ...newBooking,
          duration_minutes: duration,
          table_id: null,
          is_unallocated: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;

      // Then try to allocate it to a table
      await TableAllocationService.allocateBookingToTables(
        booking.id,
        booking.party_size,
        booking.booking_date,
        booking.booking_time
      );

      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({ 
        title: "Booking created", 
        description: "Booking has been created with calculated duration and allocated to available tables." 
      });
    },
    onError: (error: any) => {
      console.error('Create booking error:', error);
      toast({ 
        title: "Error", 
        description: "Failed to create booking.", 
        variant: "destructive" 
      });
    }
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number, updates: Partial<Booking> }) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (error: any) => {
      console.error('Update booking error:', error);
      toast({ title: "Error", description: "Failed to update booking.", variant: "destructive" });
    }
  });

  return {
    bookings,
    isLoading,
    createBooking: createBookingMutation.mutateAsync,
    updateBooking: updateBookingMutation.mutateAsync
  };
};
