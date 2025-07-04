
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
    updateBooking: updateBookingMutation.mutateAsync
  };
};
