
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
}

export const useRefund = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const processRefund = async (refundData: RefundData) => {
    setIsLoading(true);

    try {
      console.log('Processing independent refund:', refundData);

      const { error } = await supabase.functions.invoke('process-refund', {
        body: {
          ...refundData,
          changed_by: user?.email || 'system'
        }
      });

      if (error) throw error;

      toast.success('Refund processed successfully!');
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
