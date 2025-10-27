
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
import { HoldBanner } from "../shared/HoldBanner";
import { useSlotLock } from "../../hooks/useSlotLock";

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
  const { lockData, releaseLock } = useSlotLock();
  
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
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleLockExpiry = () => {
    toast.error("Your time hold has expired. Please select your time again.");
    window.location.href = '/booking';
  };

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
        // GUARDRAIL 1: Payment calculation deferred to form submission
      }
    };

    loadData();
  }, [service, venue, partySize]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Mobile number is required';
    } else if (!/^[\+]?[\d\s\-\(\)]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid mobile number';
    }

    if (!formData.termsAccepted) {
      newErrors.terms = 'You must accept the terms and conditions to proceed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsCreatingBooking(true);
    const reqId = crypto.randomUUID().substring(0, 8);

    try {
      console.log(`🎫 [${reqId}] Submitting booking to unified endpoint`);

      // Call the unified booking-submit endpoint (server decides everything)
      const { data: response, error } = await supabase.functions.invoke('booking-submit', {
        body: {
          venueSlug: venue.slug,
          serviceId: service.id,
          date: format(date, 'yyyy-MM-dd'),
          time: time,
          partySize: partySize,
          guest: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone
          },
          notes: formData.notes || null,
          lockToken: lockData?.lockToken ?? null
        }
      });

      if (error || !response?.ok) {
        console.error(`❌ [${reqId}] Booking submission failed:`, error || response);
        
        const errorMsg = response?.error || error?.message || 'Failed to create booking';
        toast.error(errorMsg);
        return;
      }

      const booking = response.booking;
      setBookingId(booking.id);

      console.log(`✅ [${reqId}] Server response:`, {
        bookingId: booking.id,
        status: booking.status,
        paymentRequired: response.payment?.required,
        reqId
      });

      // Handle response based on server's decision
      if (response.payment?.required) {
        console.log(`💳 [${reqId}] Payment required - showing Stripe`);
        
        // Server requires payment - show Stripe Elements
        setClientSecret(response.payment.client_secret);
        setPaymentCalculation({ 
          shouldCharge: true, 
          amount: response.payment.amount_cents 
        });
        setShowPaymentForm(true);
        
        toast.success(`Please complete your £${(response.payment.amount_cents / 100).toFixed(2)} payment to confirm your booking.`);
      } else {
        // No payment required - booking is confirmed
        console.log(`✅ [${reqId}] No payment required - booking confirmed`);
        
        toast.success("Booking confirmed successfully!");
        onChange(formData, false, 0, booking.id);
      }

    } catch (error) {
      console.error(`❌ [${reqId}] Error:`, error);
      toast.error(error instanceof Error ? error.message : 'Failed to create booking');
    } finally {
      setIsCreatingBooking(false);
    }
  };

  // Removed: createBookingWithPayment - replaced by unified booking-submit endpoint

  // Removed: initializePayment - handled by unified booking-submit endpoint

  const handlePaymentSuccess = async () => {
    console.log('💳 Payment successful, processing confirmation...');
    setIsProcessingPayment(true);
    
    try {
      // Extended wait time for webhook processing
      console.log('⏱️ Waiting for webhook processing...');
      await new Promise(resolve => setTimeout(resolve, 5000)); // Increased to 5 seconds

      // Enhanced payment verification with multiple attempts
      console.log('🔍 Checking payment status for booking:', bookingId);
      
      let paymentVerified = false;
      let attempts = 0;
      const maxAttempts = 4; // Increased attempts
      
      while (!paymentVerified && attempts < maxAttempts) {
        attempts++;
        console.log(`🔄 Payment verification attempt ${attempts}/${maxAttempts}`);
        
        // First, check if the booking payment record exists and is successful
        const { data: paymentData, error: paymentError } = await supabase
          .from('booking_payments')
          .select('*')
          .eq('booking_id', bookingId!)
          .order('created_at', { ascending: false })
          .limit(1);

        if (paymentError) {
          console.error('❌ Error checking payment status:', paymentError);
        } else {
          console.log('📊 Payment data from database:', paymentData);
          
          const latestPayment = paymentData?.[0];
          
          if (latestPayment?.status === 'succeeded') {
            console.log('✅ Payment confirmed in database');
            paymentVerified = true;
            break;
          } else {
            console.log(`⏳ Payment status: ${latestPayment?.status || 'not found'}, retrying...`);
          }
        }
        
        // Wait before next attempt (except for last attempt)
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      if (paymentVerified) {
        // Release lock after successful payment
        if (lockData) {
          await releaseLock('paid');
          console.log('✅ Lock released after successful payment');
        }
        
        // Verify booking status was also updated
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select('status')
          .eq('id', bookingId!)
          .single();
          
        if (bookingError) {
          console.error('❌ Error checking booking status:', bookingError);
        } else {
          console.log('📋 Current booking status:', bookingData?.status);
        }

        toast.success('Payment completed and booking confirmed!');
        onChange(formData, true, paymentCalculation?.amount || 0, bookingId!);
      } else {
        console.error('❌ Payment verification failed after all attempts');
        // Still proceed with success since webhook might be delayed
        console.log('⚡ Proceeding with booking confirmation despite verification timeout');
        
        // Release lock even if verification timeout occurs
        if (lockData) {
          await releaseLock('paid');
        }
        
        toast.success('Payment processed! Your booking is being confirmed.');
        onChange(formData, true, paymentCalculation?.amount || 0, bookingId!);
      }
    } catch (error) {
      console.error('❌ Error in payment success handling:', error);
      toast.error(error instanceof Error ? error.message : 'Payment completed but there was an issue confirming your booking. Please check your email for confirmation or contact the venue.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    toast.error(errorMessage);
    setIsProcessingPayment(false);
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getButtonText = () => {
    if (isProcessingPayment) {
      return 'Confirming Payment...';
    }
    if (isCreatingBooking) {
      return 'Creating Booking...';
    }
    if (showPaymentForm) {
      return 'Complete Payment Below';
    }
    if (paymentCalculation?.shouldCharge) {
      return 'Continue to Payment';
    }
    return 'Complete Booking';
  };

  const isButtonDisabled = () => {
    return !formData.name || 
           !formData.email ||
           !formData.phone || 
           !formData.termsAccepted || 
           isCreatingBooking || 
           isProcessingPayment ||
           showPaymentForm;
  };

  // Don't show the main submit button if payment form is visible and processing
  const shouldShowSubmitButton = !showPaymentForm || (!clientSecret && !isProcessingPayment);

  return (
    <div className="space-y-6">
      {lockData && (
        <HoldBanner 
          lockToken={lockData.lockToken}
          expiresAt={lockData.expiresAt}
          onExpiry={handleLockExpiry}
        />
      )}
      
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
            Email Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            className={`mt-1 border-nuthatch-border focus:border-nuthatch-green ${
              errors.email ? 'border-red-500' : ''
            }`}
            placeholder="your.email@example.com"
            required
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
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

      {/* Submit Button - Only show when not in payment form mode */}
      {shouldShowSubmitButton && (
        <Button
          onClick={handleSubmit}
          className="w-full bg-nuthatch-green hover:bg-nuthatch-dark text-nuthatch-white"
          disabled={isButtonDisabled()}
        >
          {isProcessingPayment || isCreatingBooking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {getButtonText()}
            </>
          ) : paymentCalculation?.shouldCharge ? (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              {getButtonText()}
            </>
          ) : (
            getButtonText()
          )}
        </Button>
      )}

      {/* Payment Section */}
      {showPaymentForm && clientSecret && (
        <div className="mt-8 p-6 border border-nuthatch-border rounded-lg bg-nuthatch-light">
          <div className="mb-6">
            <h3 className="text-xl font-nuthatch-heading font-light text-nuthatch-dark mb-2">
              Secure Payment
            </h3>
            <p className="text-nuthatch-muted">
              Complete your booking with a secure payment below.
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

          <StripeProvider venueSlug={venue?.slug} usePublicMode={true}>
            <div className={`space-y-4 ${isProcessingPayment ? 'opacity-50 pointer-events-none' : ''}`}>
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

          {isProcessingPayment && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-blue-800 text-sm font-medium">
                  Verifying payment and confirming your booking...
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
