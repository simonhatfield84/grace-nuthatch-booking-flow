
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { differenceInHours } from 'date-fns';

export interface RefundEligibility {
  isEligible: boolean;
  hoursUntilBooking: number;
  refundWindowHours: number;
  canStaffOverride: boolean;
  eligibilityReason: string;
  paymentAmount: number;
  hasPayment: boolean;
}

export const useRefundEligibility = (
  bookingId: number,
  bookingDate: string,
  bookingTime: string,
  service: string,
  venueId: string
) => {
  const { user } = useAuth();
  const [eligibility, setEligibility] = useState<RefundEligibility | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkEligibility = async () => {
      if (!bookingId) return;

      try {
        setIsLoading(true);

        // Check if user is staff (can override)
        const { data: isStaff } = await supabase.rpc('is_admin', {
          _user_id: user?.id,
          _venue_id: venueId
        });

        // Get service refund settings - handle case where columns might not exist yet
        const { data: serviceData } = await supabase
          .from('services')
          .select(`
            title,
            refund_window_hours,
            auto_refund_enabled,
            refund_policy_text
          `)
          .eq('title', service)
          .eq('venue_id', venueId)
          .single();

        // Get payment information
        const { data: payment } = await supabase
          .from('booking_payments')
          .select('amount_cents, status')
          .eq('booking_id', bookingId)
          .eq('status', 'succeeded')
          .single();

        // Calculate time until booking
        const bookingDateTime = new Date(`${bookingDate}T${bookingTime}`);
        const hoursUntilBooking = differenceInHours(bookingDateTime, new Date());
        
        // Use default values if columns don't exist or have no data
        const refundWindowHours = serviceData?.refund_window_hours || 24;
        const isWithinWindow = hoursUntilBooking >= refundWindowHours;
        const paymentAmount = payment?.amount_cents || 0;
        const hasPayment = payment && payment.status === 'succeeded';

        let eligibilityReason = '';
        if (!hasPayment) {
          eligibilityReason = 'No payment to refund';
        } else if (isWithinWindow) {
          eligibilityReason = `Within ${refundWindowHours}h cancellation window (${hoursUntilBooking}h remaining)`;
        } else {
          eligibilityReason = `Outside ${refundWindowHours}h cancellation window (${Math.abs(hoursUntilBooking)}h past deadline)`;
        }

        setEligibility({
          isEligible: hasPayment && isWithinWindow,
          hoursUntilBooking,
          refundWindowHours,
          canStaffOverride: isStaff || false,
          eligibilityReason,
          paymentAmount: paymentAmount / 100, // Convert to pounds
          hasPayment: hasPayment || false
        });

      } catch (error) {
        console.error('Error checking refund eligibility:', error);
        setEligibility({
          isEligible: false,
          hoursUntilBooking: 0,
          refundWindowHours: 24,
          canStaffOverride: false,
          eligibilityReason: 'Error checking eligibility',
          paymentAmount: 0,
          hasPayment: false
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkEligibility();
  }, [bookingId, bookingDate, bookingTime, service, venueId, user?.id]);

  return { eligibility, isLoading };
};
