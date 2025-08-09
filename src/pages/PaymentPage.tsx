
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { StripeProvider } from "@/components/providers/StripeProvider";
import { StripeCardForm } from "@/components/payments/StripeCardForm";

interface PaymentData {
  booking: {
    id: number;
    guest_name: string;
    booking_date: string;
    booking_time: string;
    party_size: number;
    service: string;
    venue_name: string;
  };
  amount_cents: number;
  payment_intent_id: string;
  client_secret: string;
  venue_slug: string;
}

export default function PaymentPage() {
  const { paymentIntentId } = useParams<{ paymentIntentId: string }>();
  const navigate = useNavigate();
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  useEffect(() => {
    if (!paymentIntentId) {
      setError("Invalid payment link");
      setLoading(false);
      return;
    }

    loadPaymentData();
  }, [paymentIntentId]);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      
      // Get payment details from booking_payments table
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('booking_payments')
        .select(`
          id,
          booking_id,
          amount_cents,
          stripe_payment_intent_id,
          status
        `)
        .eq('stripe_payment_intent_id', paymentIntentId)
        .eq('status', 'pending')
        .single();

      if (paymentError || !paymentRecord) {
        throw new Error('Payment request not found or already processed');
      }

      // Get booking details
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          id,
          guest_name,
          booking_date,
          booking_time,
          party_size,
          service,
          venue_id,
          venues!inner(name, slug)
        `)
        .eq('id', paymentRecord.booking_id)
        .single();

      if (bookingError || !booking) {
        throw new Error('Booking details not found');
      }

      // Get client secret from Stripe
      const { data: stripeData, error: stripeError } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          bookingId: booking.id,
          amount: paymentRecord.amount_cents,
          currency: 'gbp',
          description: `Payment for booking ${booking.id}`,
          existing_payment_intent_id: paymentIntentId
        }
      });

      if (stripeError || !stripeData?.client_secret) {
        throw new Error('Failed to initialize payment');
      }

      setPaymentData({
        booking: {
          id: booking.id,
          guest_name: booking.guest_name,
          booking_date: booking.booking_date,
          booking_time: booking.booking_time,
          party_size: booking.party_size,
          service: booking.service,
          venue_name: booking.venues.name
        },
        amount_cents: paymentRecord.amount_cents,
        payment_intent_id: paymentIntentId,
        client_secret: stripeData.client_secret,
        venue_slug: booking.venues.slug
      });

    } catch (err) {
      console.error('Error loading payment data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setPaymentCompleted(true);
    toast.success('Payment completed successfully!');
    
    // Redirect to success page after a short delay
    setTimeout(() => {
      navigate('/payment-success');
    }, 2000);
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    toast.error(errorMessage);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-nuthatch-cream flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading payment details...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !paymentData) {
    return (
      <div className="min-h-screen bg-nuthatch-cream flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Payment Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error || 'Payment information unavailable'}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentCompleted) {
    return (
      <div className="min-h-screen bg-nuthatch-cream flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Payment Successful!</h2>
            <p className="text-nuthatch-muted mb-4">
              Your booking payment has been processed successfully.
            </p>
            <p className="text-sm text-nuthatch-muted">
              Redirecting you to the success page...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nuthatch-cream py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" 
            alt="The Nuthatch" 
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-nuthatch-heading font-light text-nuthatch-dark mb-2">
            Complete Your Payment
          </h1>
          <p className="text-nuthatch-muted">
            Secure your booking at {paymentData.booking.venue_name}
          </p>
        </div>

        {/* Booking Summary */}
        <Card className="mb-6 border-nuthatch-border">
          <CardHeader className="bg-nuthatch-light">
            <CardTitle className="text-nuthatch-dark">Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-nuthatch-dark">Guest:</span>
                <p className="text-nuthatch-muted">{paymentData.booking.guest_name}</p>
              </div>
              <div>
                <span className="font-medium text-nuthatch-dark">Service:</span>
                <p className="text-nuthatch-muted">{paymentData.booking.service}</p>
              </div>
              <div>
                <span className="font-medium text-nuthatch-dark">Date:</span>
                <p className="text-nuthatch-muted">{paymentData.booking.booking_date}</p>
              </div>
              <div>
                <span className="font-medium text-nuthatch-dark">Time:</span>
                <p className="text-nuthatch-muted">{paymentData.booking.booking_time}</p>
              </div>
              <div>
                <span className="font-medium text-nuthatch-dark">Party Size:</span>
                <p className="text-nuthatch-muted">{paymentData.booking.party_size} guests</p>
              </div>
              <div>
                <span className="font-medium text-nuthatch-dark">Amount:</span>
                <p className="text-2xl font-bold text-nuthatch-dark">
                  £{(paymentData.amount_cents / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <StripeProvider venueSlug={paymentData.venue_slug} usePublicMode={true}>
          <Card className="border-nuthatch-border">
            <CardHeader className="bg-nuthatch-light">
              <CardTitle className="text-nuthatch-dark">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <StripeCardForm
                clientSecret={paymentData.client_secret}
                amount={paymentData.amount_cents}
                description={`Payment for booking at ${paymentData.booking.venue_name}`}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </CardContent>
          </Card>
        </StripeProvider>
      </div>
    </div>
  );
}
