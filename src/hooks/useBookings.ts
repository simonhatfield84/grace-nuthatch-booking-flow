
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { TableAllocationService } from "@/services/tableAllocation";
import { calculateBookingDuration, getServiceIdFromServiceName } from "@/utils/durationCalculation";
import { Booking } from "@/types/booking";

// Export the Booking type so other files can import it from here if needed
export type { Booking };

export const useBookings = (date?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get user's venue ID
  const { data: userVenue } = useQuery({
    queryKey: ['user-venue', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('venue_id')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data?.venue_id;
    },
    enabled: !!user,
  });

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings', date, userVenue],
    queryFn: async () => {
      if (!userVenue) return [];
      
      let query = supabase
        .from('bookings')
        .select('*')
        .eq('venue_id', userVenue)
        .order('booking_time');
      
      if (date) {
        query = query.eq('booking_date', date);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Bookings query error:', error);
        throw error;
      }
      
      console.log('📚 Bookings fetched:', {
        date,
        userVenue,
        count: data?.length || 0,
        bookings: data?.map(b => ({
          id: b.id,
          guest_name: b.guest_name,
          table_id: b.table_id,
          status: b.status,
          booking_date: b.booking_date,
          booking_time: b.booking_time
        }))
      });
      
      return (data || []) as Booking[];
    },
    enabled: !!userVenue,
  });

  const createBookingMutation = useMutation({
    mutationFn: async (newBooking: Omit<Booking, 'id' | 'created_at' | 'updated_at' | 'table_id' | 'is_unallocated' | 'end_time' | 'booking_reference' | 'venue_id'> & { duration_minutes?: number }) => {
      if (!userVenue) {
        throw new Error('No venue associated with user');
      }

      console.log('🚶‍♂️ Creating booking with data:', newBooking);

      // Use provided duration or calculate from service rules
      let duration = newBooking.duration_minutes;
      if (!duration) {
        const serviceId = newBooking.service ? await getServiceIdFromServiceName(newBooking.service) : null;
        duration = await calculateBookingDuration(serviceId || undefined, newBooking.party_size);
      }

      // For walk-ins, assign table immediately if original_table_id is provided
      const tableId = newBooking.status === 'seated' && newBooking.original_table_id 
        ? newBooking.original_table_id 
        : null;

      // First create the booking with the duration
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert([{
          ...newBooking,
          duration_minutes: duration,
          table_id: tableId,
          is_unallocated: !tableId,
          venue_id: userVenue,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Booking creation error:', error);
        throw error;
      }

      console.log('✅ Booking created:', booking);

      // Enhanced audit entry for booking creation with source details
      const sourceType = newBooking.status === 'seated' ? 'host_via_interface_walkin' : 
                        newBooking.phone ? 'host_via_phone' : 'host_via_interface';
      
      const sourceDetails = {
        interface: 'host_dashboard',
        booking_type: newBooking.status === 'seated' ? 'walk_in' : 'advance_reservation',
        party_size: newBooking.party_size,
        service: newBooking.service || 'Dinner',
        duration_minutes: duration,
        timestamp: new Date().toISOString()
      };

      if (newBooking.original_table_id) {
        sourceDetails.original_table_id = newBooking.original_table_id;
      }

      await supabase
        .from('booking_audit')
        .insert([{
          booking_id: booking.id,
          change_type: 'created',
          changed_by: user?.email || 'system',
          notes: `Booking created for ${newBooking.guest_name}${newBooking.status === 'seated' ? ' (Walk-in)' : ''}`,
          venue_id: userVenue,
          source_type: sourceType,
          source_details: sourceDetails,
          email_status: 'not_applicable' // Will be updated if/when emails are sent
        }]);

      // If not a walk-in, try to allocate it to a table
      if (newBooking.status !== 'seated' && !tableId) {
        try {
          await TableAllocationService.allocateBookingToTables(
            booking.id,
            booking.party_size,
            booking.booking_date,
            booking.booking_time
          );
        } catch (allocationError) {
          console.warn('⚠️ Table allocation failed:', allocationError);
          // Don't throw - booking was created successfully
        }
      }

      return booking as Booking;
    },
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

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number, updates: Partial<Booking> }) => {
      // Get the current booking to compare changes
      const { data: currentBooking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .eq('venue_id', userVenue)
        .single();

      const { data, error } = await supabase
        .from('bookings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('venue_id', userVenue)
        .select()
        .single();
      
      if (error) throw error;

      // Log audit entries for each changed field with enhanced details
      if (currentBooking) {
        const auditEntries = [];
        
        Object.keys(updates).forEach(key => {
          const oldValue = currentBooking[key];
          const newValue = updates[key as keyof Booking];
          
          if (oldValue !== newValue && key !== 'updated_at') {
            let changeType = 'updated';
            if (key === 'status') changeType = 'status_changed';
            if (key === 'table_id') changeType = 'table_changed';
            if (key === 'booking_time') changeType = 'time_changed';
            
            auditEntries.push({
              booking_id: id,
              change_type: changeType,
              field_name: key,
              old_value: oldValue?.toString() || null,
              new_value: newValue?.toString() || null,
              changed_by: user?.email || 'system',
              venue_id: userVenue,
              source_type: 'host_via_interface',
              source_details: {
                interface: 'host_dashboard',
                field_updated: key,
                timestamp: new Date().toISOString()
              }
            });
          }
        });

        if (auditEntries.length > 0) {
          await supabase
            .from('booking_audit')
            .insert(auditEntries);
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-audit'] });
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
