import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2 } from "lucide-react";
import { V4BookingData } from "../V4BookingWidget";
import { V4WidgetConfig } from "@/hooks/useV4WidgetConfig";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { TableAllocationService } from "@/services/tableAllocation";
import { calculatePaymentAmount } from "@/utils/paymentCalculation";
import { StripeProvider } from "@/components/providers/StripeProvider";
import { StripeCardForm } from "@/components/payments/StripeCardForm";
import { Card } from "@/components/ui/card";

interface GuestDetailsStepProps {
  bookingData: V4BookingData;
  venueId: string;
  venueSlug: string;
  venueName: string;
  onUpdate: (updates: Partial<V4BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
  config?: V4WidgetConfig;
}

export function GuestDetailsStep({ bookingData, venueId, venueSlug, venueName, onUpdate, onNext, onBack, config }: GuestDetailsStepProps) {
  const [details, setDetails] = useState({
    name: bookingData.guestDetails?.name || '',
    email: bookingData.guestDetails?.email || '',
    phone: bookingData.guestDetails?.phone || '',
    notes: bookingData.guestDetails?.notes || '',
    marketingOptIn: bookingData.guestDetails?.marketingOptIn || false,
    termsAccepted: bookingData.guestDetails?.termsAccepted || false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentCalculation, setPaymentCalculation] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Load payment calculation
  useEffect(() => {
    if (bookingData.service?.id && venueId) {
      calculatePaymentAmount(bookingData.service.id, bookingData.partySize, venueId)
        .then(setPaymentCalculation);
    }
  }, [bookingData.service, bookingData.partySize, venueId]);

  const isValid = details.name && details.email && details.phone && details.termsAccepted;

  const createBooking = async () => {
    if (!bookingData.date || !bookingData.service) {
      toast.error("Missing booking information");
      return;
    }

    setIsSubmitting(true);
    try {
      // Allocate table
      const allocationResult = await TableAllocationService.allocateTable(
        bookingData.partySize,
        format(bookingData.date, 'yyyy-MM-dd'),
        bookingData.time,
        120,
        venueId
      );

      if (!allocationResult.tableIds || allocationResult.tableIds.length === 0) {
        throw new Error('No tables available for your requested time. Please try a different time slot.');
      }

      // Build booking payload
      const bookingPayload = {
        venue_id: venueId,
        service_id: bookingData.service.id,
        guest_name: details.name,
        email: details.email,
        phone: details.phone,
        party_size: bookingData.partySize,
        booking_date: format(bookingData.date, 'yyyy-MM-dd'),
        booking_time: bookingData.time,
        service: bookingData.service.title,
        notes: details.notes || null,
        status: paymentCalculation?.shouldCharge ? 'pending_payment' : 'confirmed',
        table_id: allocationResult.tableIds[0],
        is_unallocated: false,
        source: 'widget' as const,
      };

      // Call booking-create-secure with lock token
      const { data: response, error } = await supabase.functions.invoke('booking-create-secure', {
        body: {
          booking: bookingPayload,
          lockToken: bookingData.lockToken
        }
      });

      if (error || !response?.booking) {
        throw new Error(response?.error || 'Failed to create booking');
      }

      const booking = response.booking;
      console.log('✅ Booking created:', booking.id);

      // Handle payment or confirm
      if (paymentCalculation?.shouldCharge) {
        await createPaymentIntent(booking.id, paymentCalculation.amount);
      } else {
        // Send confirmation email
        if (details.email) {
          await supabase.functions.invoke('send-email', {
            body: {
              booking_id: booking.id,
              guest_email: details.email,
              venue_id: venueId,
              email_type: 'booking_confirmation'
            }
          });
        }

        toast.success("Booking confirmed successfully!");
        onUpdate({ 
          guestDetails: details,
          bookingId: booking.id,
          paymentRequired: false,
          paymentAmount: 0
        });
        onNext();
      }

    } catch (error) {
      console.error('Booking creation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const createPaymentIntent = async (bookingId: number, amount: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          bookingId,
          amount,
          currency: 'gbp',
          description: `${bookingData.service?.title} - ${venueName}`
        }
      });

      if (error || !data?.client_secret) {
        throw new Error('Failed to initialize payment');
      }

      setClientSecret(data.client_secret);
      setShowPaymentForm(true);
      
      onUpdate({ 
        guestDetails: details,
        bookingId,
        paymentRequired: true,
        paymentAmount: amount
      });

      toast.success("Please complete your payment below");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Payment setup failed');
    }
  };

  const handlePaymentSuccess = async () => {
    setIsProcessingPayment(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const { data: payment } = await supabase
        .from('booking_payments')
        .select('status')
        .eq('booking_id', bookingData.bookingId!)
        .single();

      if (payment?.status === 'succeeded') {
        toast.success('Payment completed!');
        onNext();
      } else {
        toast.success('Payment processed! Your booking is being confirmed.');
        onNext();
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast.error('Payment completed but verification failed. Please check your email.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    toast.error(errorMessage);
    setIsProcessingPayment(false);
  };

  const handleSubmit = () => {
    if (!isValid) return;
    createBooking();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="v4-heading text-2xl font-bold mb-2">Your Details</h2>
        <p className="v4-body text-muted-foreground">Please provide your contact information</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={details.name}
            onChange={(e) => setDetails({ ...details, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={details.email}
            onChange={(e) => setDetails({ ...details, email: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            type="tel"
            value={details.phone}
            onChange={(e) => setDetails({ ...details, phone: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Special Requests (optional)</Label>
          <Textarea
            id="notes"
            value={details.notes}
            onChange={(e) => setDetails({ ...details, notes: e.target.value })}
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="marketing"
            checked={details.marketingOptIn}
            onCheckedChange={(checked) => setDetails({ ...details, marketingOptIn: checked as boolean })}
          />
          <Label htmlFor="marketing" className="text-sm">
            I'd like to receive updates and offers
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="terms"
            checked={details.termsAccepted}
            onCheckedChange={(checked) => setDetails({ ...details, termsAccepted: checked as boolean })}
          />
          <Label htmlFor="terms" className="text-sm">
            I accept the terms and conditions *
          </Label>
        </div>
      </div>

      {showPaymentForm && clientSecret && (
        <Card className="p-6 space-y-4">
          <h3 className="v4-heading text-lg font-bold">Complete Payment</h3>
          <p className="v4-body text-sm text-muted-foreground">
            Amount: £{(paymentCalculation?.amount / 100).toFixed(2)}
          </p>
          <StripeProvider venueSlug={venueSlug} usePublicMode>
            <StripeCardForm
              clientSecret={clientSecret}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              amount={paymentCalculation?.amount || 0}
              description={`${bookingData.service?.title} - ${venueName}`}
            />
          </StripeProvider>
        </Card>
      )}

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1" disabled={isSubmitting || showPaymentForm}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        {!showPaymentForm && (
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="flex-1 v4-btn-primary"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : paymentCalculation?.shouldCharge ? (
              'Continue to Payment'
            ) : (
              config?.copy_json?.ctaText || 'Complete Booking'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
