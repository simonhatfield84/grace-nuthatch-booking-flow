
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PaymentReconciliationData {
  bookingId: number;
  paymentIntentId: string;
  amountCents: number;
  stripeStatus: string;
}

export const reconcilePayment = async (data: PaymentReconciliationData) => {
  try {
    console.log('🔧 Starting manual payment reconciliation for booking:', data.bookingId);

    // Update booking status to confirmed
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({ 
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', data.bookingId);

    if (bookingError) {
      console.error('Error updating booking status:', bookingError);
      throw bookingError;
    }

    // Update payment status to succeeded
    const { error: paymentError } = await supabase
      .from('booking_payments')
      .update({
        status: 'succeeded',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', data.paymentIntentId);

    if (paymentError) {
      console.error('Error updating payment status:', paymentError);
      throw paymentError;
    }

    // Log the manual reconciliation
    await supabase
      .from('security_audit')
      .insert({
        event_type: 'manual_payment_reconciliation',
        event_details: {
          booking_id: data.bookingId,
          payment_intent_id: data.paymentIntentId,
          amount_cents: data.amountCents,
          stripe_status: data.stripeStatus,
          reconciled_by: 'manual_intervention',
          reason: 'webhook_failure_recovery'
        }
      });

    // Send confirmation email
    const { data: booking } = await supabase
      .from('bookings')
      .select('email, venue_id')
      .eq('id', data.bookingId)
      .single();

    if (booking?.email) {
      await supabase.functions.invoke('send-email', {
        body: {
          booking_id: data.bookingId,
          guest_email: booking.email,
          venue_id: booking.venue_id,
          email_type: 'booking_confirmation'
        }
      });
    }

    console.log('✅ Payment reconciliation completed successfully');
    toast.success('Payment reconciled and confirmation email sent');

    return { success: true };
  } catch (error) {
    console.error('❌ Payment reconciliation failed:', error);
    toast.error('Failed to reconcile payment');
    return { success: false, error };
  }
};
