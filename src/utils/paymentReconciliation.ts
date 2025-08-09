import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isErrorEventData } from "./typeGuards";

export interface PaymentReconciliationData {
  bookingId: number;
  paymentIntentId: string;
  amountCents: number;
  stripeStatus: string;
}

export const reconcilePayment = async (data: PaymentReconciliationData) => {
  try {
    console.log('🔧 Starting manual payment reconciliation for booking:', data.bookingId);

    const now = new Date().toISOString();

    // Update booking status to confirmed
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({ 
        status: 'confirmed',
        updated_at: now
      })
      .eq('id', data.bookingId);

    if (bookingError) {
      console.error('Error updating booking status:', bookingError);
      throw bookingError;
    }

    // Update payment status to succeeded with processed_at timestamp
    const { error: paymentError } = await supabase
      .from('booking_payments')
      .update({
        status: 'succeeded',
        processed_at: now,
        updated_at: now
      })
      .eq('stripe_payment_intent_id', data.paymentIntentId);

    if (paymentError) {
      console.error('Error updating payment status:', paymentError);
      
      // If update failed, try to create the missing payment record
      console.log('🔧 Attempting to create missing payment record');
      const { error: createError } = await supabase
        .from('booking_payments')
        .insert({
          booking_id: data.bookingId,
          stripe_payment_intent_id: data.paymentIntentId,
          amount_cents: data.amountCents,
          status: 'succeeded',
          payment_method_type: 'card',
          processed_at: now,
          created_at: now,
          updated_at: now
        });

      if (createError) {
        console.error('Error creating payment record:', createError);
        throw createError;
      } else {
        console.log('✅ Created missing payment record');
      }
    }

    // Create a webhook event record for the manual reconciliation
    await supabase
      .from('webhook_events')
      .insert({
        stripe_event_id: `manual_reconcile_${data.bookingId}_${Date.now()}`,
        event_type: 'manual_reconciliation',
        event_data: {
          manual_reconciliation: true,
          reconciled_by: 'admin_tool',
          original_stripe_status: data.stripeStatus,
          booking_id: data.bookingId,
          payment_intent_id: data.paymentIntentId,
          amount_cents: data.amountCents
        },
        processed_at: now,
        test_mode: false
      });

    // Log the manual reconciliation with enhanced details
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
          reason: 'webhook_failure_recovery',
          timestamp: now
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

// Enhanced function to check payment consistency
export const checkPaymentConsistency = async (bookingId: number) => {
  try {
    // Get booking data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('status')
      .eq('id', bookingId)
      .maybeSingle();

    if (bookingError) {
      console.error('Booking query error:', bookingError);
      return { consistent: false, reason: 'booking_query_failed', error: bookingError };
    }

    if (!booking) {
      return { consistent: false, reason: 'missing_booking_record' };
    }

    // Query payment data with proper error handling
    const { data: paymentData, error: paymentError } = await supabase
      .from('booking_payments')
      .select('status, processed_at')
      .eq('booking_id', bookingId)
      .maybeSingle();

    // Handle payment query errors or missing payment
    if (paymentError) {
      console.error('Payment query error:', paymentError);
      return { consistent: false, reason: 'payment_query_failed', error: paymentError };
    }

    if (!paymentData) {
      return { consistent: false, reason: 'missing_payment_record' };
    }

    // Check webhook events for this booking (simplified query)
    const { data: webhookEvents } = await supabase
      .from('webhook_events')
      .select('event_type, event_data, created_at, processed_at')
      .order('created_at', { ascending: false })
      .limit(10); // Get recent events instead of filtering by booking_id

    // Check for consistency issues
    if (booking.status === 'confirmed' && paymentData.status !== 'succeeded') {
      return { 
        consistent: false, 
        reason: 'booking_confirmed_payment_not_succeeded',
        webhookEvents: webhookEvents || []
      };
    }

    if (paymentData.status === 'succeeded' && booking.status !== 'confirmed') {
      return { 
        consistent: false, 
        reason: 'payment_succeeded_booking_not_confirmed',
        webhookEvents: webhookEvents || []
      };
    }

    // Check processed_at timestamp if payment is succeeded
    if (paymentData.status === 'succeeded' && !paymentData.processed_at) {
      return { 
        consistent: false, 
        reason: 'missing_processed_timestamp',
        webhookEvents: webhookEvents || []
      };
    }

    // Check for failed webhook events using type guard
    const failedEvents = webhookEvents?.filter(e => isErrorEventData(e.event_data)) || [];
    if (failedEvents.length > 0) {
      return {
        consistent: false,
        reason: 'webhook_processing_failures',
        webhookEvents: failedEvents
      };
    }

    return { 
      consistent: true, 
      webhookEvents: webhookEvents || []
    };
  } catch (error) {
    console.error('Error checking payment consistency:', error);
    return { consistent: false, reason: 'check_failed', error };
  }
};
