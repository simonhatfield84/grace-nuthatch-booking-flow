
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
}

export const useBookingAudit = (bookingId?: number) => {
  const queryClient = useQueryClient();

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
    mutationFn: async (auditData: Omit<BookingAudit, 'id' | 'changed_at'>) => {
      const { error } = await supabase
        .from('booking_audit')
        .insert([{
          ...auditData,
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
