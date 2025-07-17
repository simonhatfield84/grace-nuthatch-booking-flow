import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { AlertCircle, Info, Loader2, CreditCard } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { calculatePaymentAmount } from "@/utils/paymentCalculation";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { StripeProvider } from "@/components/providers/StripeProvider";
import { StripeCardForm } from "@/components/payments/StripeCardForm";
import { AppleGooglePayButton } from "@/components/payments/AppleGooglePayButton";

interface GuestDetailsStepProps {
  value: {
    name: string;
    email: string;
    phone: string;
    notes?: string;
    marketingOptIn: boolean;
    termsAccepted: boolean;
  } | null;
  service: any;
  venue: any;
  partySize: number;
  date: Date;
  time: string;
  onChange: (details: any, paymentRequired: boolean, paymentAmount: number, bookingId?: number) => void;
}

export function GuestDetailsStep({ value, service, venue, partySize, date, time, onChange }: GuestDetailsStepProps) {
  const [formData, setFormData] = useState({
    name: value?.name || '',
    email: value?.email || '',
    phone: value?.phone || '',
    notes: value?.notes || '',
    marketingOptIn: value?.marketingOptIn ?? true,
    termsAccepted: value?.termsAccepted || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTerms, setShowTerms] = useState(false);
  const [terms, setTerms] = useState('');
  const [paymentCalculation, setPaymentCalculation] = useState<any>(null);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Load terms and conditions and calculate payment
  useEffect(() => {
    const loadData = async () => {
      // Load terms
      let termsText = service?.terms_and_conditions;
      
      if (!termsText && venue?.id) {
        termsText = "Standard booking terms and conditions apply. By proceeding, you agree to our cancellation policy and terms of service.";
      }
      
      setTerms(termsText || "Standard booking terms and conditions apply.");

  // Calculate payment
      if (service?.id && venue?.id) {
        console.log('🔍 Calculating payment for:', {
          serviceId: service.id,
          partySize,
          venueId: venue.id,
          serviceTitle: service.title,
          serviceRequiresPayment: service.requires_payment,
          serviceChargeType: service.charge_type,
          serviceChargeAmount: service.charge_amount_per_guest
        });
        const calculation = await calculatePaymentAmount(service.id, partySize, venue.id);
        console.log('💰 Payment calculation result:', calculation);
        setPaymentCalculation(calculation);
      }
    };

    loadData();
  }, [service, venue, partySize]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Mobile number is required';
    } else if (!/^[\+]?[\d\s\-\(\)]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid mobile number';
    }

    // Email validation - will be required in future
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.termsAccepted) {
      newErrors.terms = 'You must accept the terms and conditions to proceed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const paymentRequired = paymentCalculation?.shouldCharge || false;
    const paymentAmount = paymentCalculation?.amount || 0;

    console.log('📝 Form submitted:', {
      paymentRequired,
      paymentAmount,
      paymentCalculation,
      service: service?.title,
      partySize
    });

    // Create booking first
    await createBooking(paymentAmount);
  };

  const createBooking = async (paymentAmount: number) => {
    setIsCreatingBooking(true);
    try {
      // First, try to allocate tables
      const { TableAllocationService } = await import("@/services/tableAllocation");
      
      const allocationResult = await TableAllocationService.allocateTable(
        partySize,
        format(date, 'yyyy-MM-dd'),
        time,
        120, // duration minutes
        venue.id
      );

      if (!allocationResult.tableIds || allocationResult.tableIds.length === 0) {
        throw new Error('No tables available for your requested time. Please try a different time slot.');
      }

      const bookingPayload = {
        venue_id: venue.id,
        guest_name: formData.name,
        email: formData.email || null,
        phone: formData.phone,
        party_size: partySize,
        booking_date: format(date, 'yyyy-MM-dd'),
        booking_time: time,
        service: service?.title || 'Dinner',
        notes: formData.notes || null,
        status: 'pending_payment', // Set as pending payment
        table_id: allocationResult.tableIds[0],
        is_unallocated: false,
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingPayload])
        .select()
        .single();

      if (error) throw error;

      console.log('Booking created successfully:', data.id);
      setBookingId(data.id);
      
      // If payment is required, create payment intent and show payment form
      if (paymentAmount > 0) {
        console.log('Payment required, creating payment intent...');
        await createPaymentIntent(data.id, paymentAmount);
        // Don't call onChange here - wait for payment completion
      } else {
        // No payment required, proceed to confirmation
        toast.success("Booking created successfully!");
        onChange(formData, false, 0, data.id);
      }

    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create booking. Please try again.');
    } finally {
      setIsCreatingBooking(false);
    }
  };

  const createPaymentIntent = async (bookingId: number, amount: number) => {
    try {
      console.log('Creating payment intent for booking:', bookingId, 'amount:', amount);

      const { data, error: paymentError } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          bookingId: bookingId,
          amount: amount,
          currency: 'gbp',
          description: `${service?.title} - The Nuthatch`
        }
      });

      if (paymentError) {
        console.error('Payment intent error:', paymentError);
        throw new Error('Failed to initialize payment. Please try again.');
      }

      if (!data?.client_secret) {
        console.error('No client secret returned:', data);
        throw new Error('Payment system error. Please contact the venue.');
      }

      console.log('✅ Payment intent created successfully:', data);
      setClientSecret(data.client_secret);
      setShowPaymentForm(true);
      toast.success("Payment form is ready. Please complete your payment below.");

    } catch (err) {
      console.error('Payment setup error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize payment';
      toast.error(errorMessage);
    }
  };

  const handlePaymentSuccess = () => {
    console.log('Payment successful, proceeding to confirmation');
    toast.success('Payment completed successfully!');
    setShowPaymentForm(false);
    onChange(formData, true, paymentCalculation?.amount || 0, bookingId!);
  };

  const handlePaymentError = (errorMessage: string) => {
    toast.error(errorMessage);
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-nuthatch-heading font-light text-nuthatch-dark mb-2">
          Guest Details
        </h2>
        <p className="text-nuthatch-muted">
          Please provide your contact information
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-nuthatch-dark">
            Full Name *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            className={`mt-1 border-nuthatch-border focus:border-nuthatch-green ${
              errors.name ? 'border-red-500' : ''
            }`}
            placeholder="Enter your full name"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone" className="text-nuthatch-dark">
            Mobile Number *
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            className={`mt-1 border-nuthatch-border focus:border-nuthatch-green ${
              errors.phone ? 'border-red-500' : ''
            }`}
            placeholder="Enter your mobile number"
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email" className="text-nuthatch-dark">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            className={`mt-1 border-nuthatch-border focus:border-nuthatch-green ${
              errors.email ? 'border-red-500' : ''
            }`}
            placeholder="Enter your email address (optional)"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
          <p className="text-sm text-nuthatch-muted mt-1">
            Optional for now, but recommended for booking confirmations
          </p>
        </div>

        <div>
          <Label htmlFor="notes" className="text-nuthatch-dark">
            Special Requests
          </Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            className="mt-1 border-nuthatch-border focus:border-nuthatch-green"
            placeholder="Allergies, dietary requirements, special occasions..."
            rows={3}
          />
        </div>
      </div>

      {/* Payment Information */}
      {paymentCalculation?.shouldCharge && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {paymentCalculation.description} - £{(paymentCalculation.amount / 100).toFixed(2)}
            {paymentCalculation.chargeType === 'error' ? 
              ' (Payment system not configured)' : 
              '. You will be taken to our secure payment page next.'
            }
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4 pt-4 border-t border-nuthatch-border">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="marketing"
            checked={formData.marketingOptIn}
            onCheckedChange={(checked) => updateField('marketingOptIn', checked)}
            className="mt-1"
          />
          <div>
            <Label htmlFor="marketing" className="text-nuthatch-muted text-xs">
              Keep me in the loop about special offers and events
            </Label>
            <p className="text-xs text-nuthatch-muted opacity-75">
              We'll only send you the good stuff, promise!
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="terms"
            checked={formData.termsAccepted}
            onCheckedChange={(checked) => updateField('termsAccepted', checked)}
            className="mt-1"
          />
          <div>
            <Label htmlFor="terms" className="text-nuthatch-dark text-sm">
              I accept the{' '}
              <button
                type="button"
                onClick={() => setShowTerms(!showTerms)}
                className="text-nuthatch-green underline hover:no-underline"
              >
                terms and conditions
              </button>
              *
            </Label>
            {errors.terms && (
              <p className="text-red-500 text-sm mt-1">{errors.terms}</p>
            )}
          </div>
        </div>

        {showTerms && (
          <Card className="p-4 bg-nuthatch-light border-nuthatch-border">
            <h4 className="font-medium text-nuthatch-dark mb-2">
              Terms and Conditions
            </h4>
            <div className="text-sm text-nuthatch-dark whitespace-pre-wrap max-h-40 overflow-y-auto">
              {terms}
            </div>
          </Card>
        )}
      </div>

      {!showPaymentForm ? (
        <Button
          onClick={handleSubmit}
          className="w-full bg-nuthatch-green hover:bg-nuthatch-dark text-nuthatch-white"
          disabled={!formData.name || !formData.phone || !formData.termsAccepted || isCreatingBooking}
        >
          {isCreatingBooking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Booking...
            </>
          ) : paymentCalculation?.shouldCharge ? (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Continue to Payment
            </>
          ) : (
            "Complete Booking"
          )}
        </Button>
      ) : null}

      {/* Payment Section */}
      {showPaymentForm && clientSecret && (
        <div className="mt-8 p-6 border border-nuthatch-border rounded-lg bg-nuthatch-light">
          <div className="mb-6">
            <h3 className="text-xl font-nuthatch-heading font-light text-nuthatch-dark mb-2">
              Secure Payment
            </h3>
            <p className="text-nuthatch-muted">
              Complete your booking with a secure payment
            </p>
          </div>

          <Card className="p-4 bg-white border-nuthatch-border mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-nuthatch-dark">Booking Total:</span>
              <span className="text-2xl font-bold text-nuthatch-dark">
                £{((paymentCalculation?.amount || 0) / 100).toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-nuthatch-muted">
              This payment secures your reservation at The Nuthatch
            </p>
          </Card>

          <StripeProvider venueId={venue?.id} usePublicMode={true}>
            <div className="space-y-4">
              <AppleGooglePayButton
                clientSecret={clientSecret}
                amount={paymentCalculation?.amount || 0}
                description={`${service?.title} - The Nuthatch`}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
              
              <StripeCardForm
                clientSecret={clientSecret}
                amount={paymentCalculation?.amount || 0}
                description={`${service?.title} - The Nuthatch`}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </div>
          </StripeProvider>
        </div>
      )}
    </div>
  );
}