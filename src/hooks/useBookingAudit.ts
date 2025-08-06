
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BookingAudit {
  id: string;
  booking_id: number;
  change_type: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  changed_by: string | null;
  changed_at: string;
  notes: string | null;
  venue_id: string;
  source_type: string | null;
  source_details: Record<string, any>;
  email_status: string | null;
  notification_details: Record<string, any>;
}

export const useBookingAudit = (bookingId?: number) => {
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

  const { data: auditTrail = [] } = useQuery({
    queryKey: ['booking-audit', bookingId],
    queryFn: async () => {
      if (!bookingId) return [];
      
      const { data, error } = await supabase
        .from('booking_audit')
        .select('*')
        .eq('booking_id', bookingId)
        .order('changed_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as BookingAudit[];
    },
    enabled: !!bookingId
  });

  const logAuditMutation = useMutation({
    mutationFn: async (auditData: Omit<BookingAudit, 'id' | 'changed_at' | 'venue_id'>) => {
      if (!userVenue) {
        throw new Error('No venue associated with user');
      }

      const { error } = await supabase
        .from('booking_audit')
        .insert([{
          ...auditData,
          venue_id: userVenue,
          changed_at: new Date().toISOString()
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-audit'] });
    }
  });

  return {
    auditTrail,
    logAudit: logAuditMutation.mutateAsync
  };
};
