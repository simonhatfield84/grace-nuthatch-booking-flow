
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface RefundData {
  payment_id: string;
  refund_amount_cents: number;
  refund_reason: string;
  booking_id: number;
  venue_id: string;
  cancel_booking?: boolean; // NEW: Optional parameter to control booking cancellation
}

export const useRefund = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const processRefund = async (refundData: RefundData) => {
    setIsLoading(true);

    try {
      console.log('Processing refund:', refundData);

      const { error } = await supabase.functions.invoke('process-refund', {
        body: {
          ...refundData,
          changed_by: user?.email || 'system',
          cancel_booking: refundData.cancel_booking || false // Default to false for independent refunds
        }
      });

      if (error) throw error;

      const refundType = refundData.cancel_booking ? 'cancellation' : 'independent';
      toast.success(`${refundType === 'cancellation' ? 'Booking cancelled and refund' : 'Refund'} processed successfully!`);
      return { success: true };

    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('Failed to process refund');
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    processRefund,
    isLoading
  };
};
