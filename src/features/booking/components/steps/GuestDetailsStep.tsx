import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StripeProvider } from "@/components/providers/StripeProvider";
import { StripeCardForm } from "@/components/payments/StripeCardForm";
import { calculatePaymentAmount } from "@/utils/paymentCalculation";

interface GuestDetailsStepProps {
  onNext: (details: any, paymentRequired: boolean, paymentAmount: number, bookingId?: number) => void;
  onBack: () => void;
  bookingData: any;
  venueSlug: string;
}

export function GuestDetailsStep({ onNext, onBack, bookingData, venueSlug }: GuestDetailsStepProps) {
  const [guestDetails, setGuestDetails] = useState({
    name: '',
    email: '',
    phone: '',
    specialRequests: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentCalculation, setPaymentCalculation] = useState<{
    shouldCharge: boolean;
    amount: number;
    description: string;
    chargeType: string;
  } | null>(null);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setGuestDetails(prev => ({ ...prev, [field]: value }));
  };

  const calculatePayment = async () => {
    if (!bookingData.venue?.id) return;

    try {
      const calculation = await calculatePaymentAmount(
        bookingData.service?.id || null,
        bookingData.partySize,
        bookingData.venue.id
      );
      
      console.log('💰 Payment calculation result:', calculation);
      setPaymentCalculation(calculation);
    } catch (error) {
      console.error('Payment calculation error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!guestDetails.name.trim() || !guestDetails.email.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Calculate payment if not already done
      if (!paymentCalculation) {
        await calculatePayment();
      }

      // Create booking first
      const { data, error: bookingError } = await supabase.functions.invoke('booking-create-secure', {
        body: {
          venue_slug: venueSlug,
          service_id: bookingData.service?.id || null,
          booking_date: bookingData.date.toISOString().split('T')[0],
          booking_time: bookingData.time,
          party_size: bookingData.partySize,
          guest_name: guestDetails.name,
          email: guestDetails.email,
          phone: guestDetails.phone || null,
          special_requests: guestDetails.specialRequests || null,
          source: 'widget'
        }
      });

      if (bookingError) {
        console.error('Booking creation error:', bookingError);
        throw new Error(bookingError.message || 'Failed to create booking');
      }

      if (!data?.booking) {
        throw new Error('No booking data returned');
      }

      console.log('✅ Booking created:', data.booking);
      setBookingId(data.booking.id);

      // Recalculate payment with actual venue data
      if (!paymentCalculation) {
        const calculation = await calculatePaymentAmount(
          bookingData.service?.id || null,
          bookingData.partySize,
          bookingData.venue.id
        );
        setPaymentCalculation(calculation);
      }

      // If payment is required, create payment intent
      if (paymentCalculation?.shouldCharge && paymentCalculation.amount > 0) {
        console.log('💳 Payment required, creating payment intent...');
        
        const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment-intent', {
          body: {
            bookingId: data.booking.id,
            amount: paymentCalculation.amount,
            currency: 'gbp',
            description: paymentCalculation.description || 'Booking payment'
          }
        });

        if (paymentError) {
          console.error('Payment intent error:', paymentError);
          throw new Error('Failed to initialize payment. Please try again.');
        }

        if (!paymentData?.client_secret) {
          throw new Error('Payment system error. Please contact the venue.');
        }

        console.log('💳 Payment intent created successfully');
        setClientSecret(paymentData.client_secret);
        setShowPayment(true);
      } else {
        // No payment required, proceed directly
        console.log('✅ No payment required, proceeding...');
        onNext(
          guestDetails,
          false,
          0,
          data.booking.id
        );
      }

    } catch (err) {
      console.error('Submission error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create booking';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    console.log('💳 Payment successful');
    toast.success('Payment completed successfully!');
    
    if (paymentCalculation && bookingId) {
      onNext(
        guestDetails,
        true,
        paymentCalculation.amount,
        bookingId
      );
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const formatAmount = (pence: number) => {
    return (pence / 100).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-nuthatch-heading font-light text-nuthatch-dark mb-2">
          Your Details
        </h2>
        <p className="text-nuthatch-muted">
          Please provide your contact information to complete the booking
        </p>
      </div>

      {!showPayment ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-nuthatch-dark">Name *</Label>
              <Input
                id="name"
                type="text"
                value={guestDetails.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="border-nuthatch-border focus:border-nuthatch-green"
                required
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-nuthatch-dark">Email *</Label>
              <Input
                id="email"
                type="email"
                value={guestDetails.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="border-nuthatch-border focus:border-nuthatch-green"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-nuthatch-dark">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={guestDetails.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="border-nuthatch-border focus:border-nuthatch-green"
                placeholder="Optional"
              />
            </div>

            <div>
              <Label htmlFor="specialRequests" className="text-nuthatch-dark">Special Requests</Label>
              <Textarea
                id="specialRequests"
                value={guestDetails.specialRequests}
                onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                className="border-nuthatch-border focus:border-nuthatch-green"
                placeholder="Any dietary requirements or special requests..."
                rows={3}
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between">
            <Button
              type="button"
              onClick={onBack}
              variant="outline"
              className="border-nuthatch-border text-nuthatch-dark hover:bg-nuthatch-light"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-nuthatch-green hover:bg-nuthatch-dark text-nuthatch-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Booking...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <Card className="p-6 bg-nuthatch-light border-nuthatch-border">
            <div className="flex items-center justify-between mb-4">
              <span className="text-nuthatch-dark">Payment Required:</span>
              <span className="text-2xl font-bold text-nuthatch-dark">
                £{paymentCalculation ? formatAmount(paymentCalculation.amount) : '0.00'}
              </span>
            </div>
            <p className="text-sm text-nuthatch-muted">
              {paymentCalculation?.description}
            </p>
          </Card>

          {clientSecret ? (
            <StripeProvider venueSlug={venueSlug} usePublicMode={true}>
              <StripeCardForm
                clientSecret={clientSecret}
                amount={paymentCalculation?.amount || 0}
                description={paymentCalculation?.description || 'Booking payment'}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </StripeProvider>
          ) : (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-nuthatch-muted">Setting up secure payment...</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between">
            <Button
              type="button"
              onClick={onBack}
              variant="outline"
              className="border-nuthatch-border text-nuthatch-dark hover:bg-nuthatch-light"
            >
              Back
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
