import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Loader2 } from 'lucide-react';
import { HoldBannerUI } from '../ui/HoldBannerUI';
import { prepareBooking, createPaymentIntent } from '@/features/bookingAPI';
import { useToast } from '@/hooks/use-toast';

interface GuestDetails {
  name: string;
  phone: string;
  email: string;
  notes: string;
  marketingOptIn: boolean;
  termsAccepted: boolean;
}

interface GuestDetailsStepUIProps {
  venueSlug: string;
  bookingData: {
    serviceId: string;
    date: string;
    time: string;
    partySize: number;
  };
  lockToken: string;
  secondsRemaining: number;
  onSubmit: (details: any, requiresPayment: boolean) => Promise<void>;
}

export function GuestDetailsStepUI({ 
  venueSlug,
  bookingData,
  lockToken,
  secondsRemaining,
  onSubmit
}: GuestDetailsStepUIProps) {
  const [details, setDetails] = useState<GuestDetails>({
    name: '',
    phone: '',
    email: '',
    notes: '',
    marketingOptIn: false,
    termsAccepted: false,
  });

  const [showTerms, setShowTerms] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof GuestDetails, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requiresPayment, setRequiresPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [amountCents, setAmountCents] = useState(0);
  const { toast } = useToast();

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof GuestDetails, string>> = {};

    if (!details.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!details.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!details.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }

    if (!details.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePrepare = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const result = await prepareBooking(venueSlug, {
        serviceId: bookingData.serviceId,
        date: bookingData.date,
        time: bookingData.time,
        partySize: bookingData.partySize,
        guest: {
          name: details.name,
          email: details.email,
          phone: details.phone,
        },
        notes: details.notes,
        lockToken,
      });

      if (!result.ok) {
        throw new Error(result.error || 'Booking failed');
      }

      if (result.requiresPayment) {
        // Create payment intent
        const paymentResult = await createPaymentIntent(
          result.bookingData,
          result.amountCents!
        );

        if (!paymentResult.ok) {
          throw new Error('Failed to initialize payment');
        }

        setRequiresPayment(true);
        setClientSecret(paymentResult.clientSecret!);
        setPublishableKey(paymentResult.publishableKey!);
        setAmountCents(result.amountCents!);
      } else {
        // No payment required - booking confirmed immediately
        await onSubmit({
          ...details,
          booking: result.booking,
        }, false);
      }
    } catch (error: any) {
      console.error('Prepare booking error:', error);
      toast({
        title: 'Booking failed',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = <K extends keyof GuestDetails>(
    field: K,
    value: GuestDetails[K]
  ) => {
    setDetails(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Show payment form if payment is required
  if (requiresPayment && clientSecret && publishableKey) {
    const stripePromise = loadStripe(publishableKey);

    return (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <PaymentForm
          amountCents={amountCents}
          details={details}
          secondsRemaining={secondsRemaining}
          onSuccess={async () => {
            await onSubmit({ ...details, paymentCompleted: true }, true);
          }}
        />
      </Elements>
    );
  }

  return (
    <div className="space-y-6">
      <HoldBannerUI secondsRemaining={secondsRemaining} />

      <Card>
        <CardHeader>
          <CardTitle className="font-nuthatch-heading text-nuthatch-dark">
            Guest Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={details.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Your full name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              type="tel"
              value={details.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="Your phone number"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={details.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="your@email.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Special Requests</Label>
            <Textarea
              id="notes"
              value={details.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Any dietary requirements or special requests?"
              rows={3}
            />
          </div>

          <div className="flex items-start space-x-2 pt-2">
            <Checkbox
              id="marketing"
              checked={details.marketingOptIn}
              onCheckedChange={(checked) => 
                updateField('marketingOptIn', checked === true)
              }
            />
            <label
              htmlFor="marketing"
              className="text-sm text-nuthatch-muted font-nuthatch-body leading-tight cursor-pointer"
            >
              Keep me in the loop with news and offers. We'll only send you the good stuff.
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={details.termsAccepted}
                onCheckedChange={(checked) => 
                  updateField('termsAccepted', checked === true)
                }
                className={errors.termsAccepted ? 'border-red-500' : ''}
              />
              <label
                htmlFor="terms"
                className="text-sm text-nuthatch-muted font-nuthatch-body leading-tight cursor-pointer"
              >
                I accept the{' '}
                <button
                  type="button"
                  onClick={() => setShowTerms(!showTerms)}
                  className="text-nuthatch-green underline hover:text-nuthatch-dark"
                >
                  terms and conditions
                </button>{' '}
                *
              </label>
            </div>
            {errors.termsAccepted && (
              <p className="text-sm text-red-500 ml-6">{errors.termsAccepted}</p>
            )}
          </div>

          {showTerms && (
            <Card className="bg-gray-50">
              <CardContent className="p-4 text-sm text-nuthatch-muted space-y-2">
                <p className="font-medium text-nuthatch-dark">Terms & Conditions</p>
                <p>By making a reservation, you agree to:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Arrive within 15 minutes of your reservation time</li>
                  <li>Return your table within 2 hours</li>
                  <li>Provide 24 hours notice for cancellations</li>
                  <li>Pay any applicable deposit or no-show fees</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Button 
        onClick={handlePrepare}
        disabled={isSubmitting}
        className="w-full bg-black hover:bg-gray-800 text-white"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Continue'
        )}
      </Button>
    </div>
  );
}

// Payment form component
interface PaymentFormProps {
  amountCents: number;
  details: GuestDetails;
  secondsRemaining: number;
  onSuccess: () => void;
}

function PaymentForm({ amountCents, details, secondsRemaining, onSuccess }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
        receipt_email: details.email,
      },
      redirect: 'if_required',
    });

    if (error) {
      toast({
        title: 'Payment failed',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
      setIsProcessing(false);
    } else {
      // Payment succeeded - webhook will create booking
      // Wait briefly then show confirmation
      setTimeout(() => {
        onSuccess();
      }, 2000);
    }
  };

  return (
    <div className="space-y-6">
      <HoldBannerUI secondsRemaining={secondsRemaining} />

      <Card>
        <CardHeader>
          <CardTitle className="font-nuthatch-heading text-nuthatch-dark">
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Deposit required: <strong>£{(amountCents / 100).toFixed(2)}</strong>
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-lg">
              <PaymentElement />
            </div>

            <Button 
              type="submit" 
              disabled={isProcessing || !stripe}
              className="w-full bg-black hover:bg-gray-800 text-white"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing payment...
                </>
              ) : (
                `Pay £${(amountCents / 100).toFixed(2)} & Confirm`
              )}
            </Button>
          </form>

          <p className="text-xs text-nuthatch-muted text-center">
            Your payment is secured by Stripe. The deposit will be charged immediately.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
