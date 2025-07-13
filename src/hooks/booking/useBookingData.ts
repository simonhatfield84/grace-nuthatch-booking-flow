
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CoreBookingService } from "@/services/core/BookingService";
import { useToast } from "@/hooks/use-toast";

export function useBookingData(venueId?: string, date?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get bookings for a specific date
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings', venueId, date],
    queryFn: () => CoreBookingService.getBookingsForDate(venueId!, date!),
    enabled: !!venueId && !!date,
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: CoreBookingService.createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({ 
        title: "Booking created", 
        description: "Booking has been created successfully." 
      });
    },
    onError: (error: any) => {
      console.error('❌ Create booking error:', error);
      toast({ 
        title: "Error", 
        description: "Failed to create booking.", 
        variant: "destructive" 
      });
    }
  });

  // Update booking mutation
  const updateBookingMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number, updates: any }) => 
      CoreBookingService.updateBooking(id, updates),
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
    updateBooking: updateBookingMutation.mutateAsync,
  };
}
