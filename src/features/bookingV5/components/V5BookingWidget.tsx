import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { V5BookingProvider, useV5Booking, V5BookingStep } from '../context/V5BookingContext';
import { useV5WidgetConfig } from '../hooks/useV5WidgetConfig';
import { useUTM } from '../hooks/useUTM';
import { useAttemptLogger } from '../hooks/useAttemptLogger';
import { StripeProvider } from '@/components/providers/StripeProvider';
import { parseURLPrefill, parseVariant } from '../utils/paramParsing';
import { BrandHeader } from './BrandHeader';
import { HeroSection } from './HeroSection';
import { HoldBanner } from './HoldBanner';
import { PartyDateStep } from '../steps/PartyDateStep';
import { ServiceStep } from '../steps/ServiceStep';
import { TimeStep } from '../steps/TimeStep';
import { GuestStep } from '../steps/GuestStep';
import { PaymentStep } from '../steps/PaymentStep';
import { ConfirmationStep } from '../steps/ConfirmationStep';
import { useBrandingForVenue } from '@/hooks/useBrandingForVenue';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { calculatePaymentAmountAnonymous } from '@/utils/paymentCalculation';
import { format } from 'date-fns';

interface V5BookingWidgetProps {
  venueSlug: string;
}

function V5BookingWidgetInner({ venueSlug }: V5BookingWidgetProps) {
  const [searchParams] = useSearchParams();
  const urlVariant = parseVariant(searchParams);
  const prefill = parseURLPrefill(searchParams);
  
  const { data: config, isLoading, error } = useV5WidgetConfig(venueSlug, urlVariant);
  const { state, updateState, goToStep, markStepComplete } = useV5Booking();
  const { logAttempt } = useAttemptLogger(config?.venueId || '', venueSlug);
  const { toast } = useToast();
  
  // Apply branding
  useBrandingForVenue(venueSlug);
  
  // Prefill from URL
  useEffect(() => {
    if (prefill.party) updateState({ partySize: prefill.party });
    if (prefill.date) updateState({ selectedDate: prefill.date });
    if (prefill.service) {
      // Service will be validated in ServiceStep
    }
  }, [prefill]);
  
  // Handle lock expiry
  const handleLockExpired = async () => {
    const expiredCopy = {
      title: config.copy?.holdBanner?.expiredTitle || 'Time slot expired',
      message: config.copy?.holdBanner?.expiredMessage || 'Please select a new time'
    };
    
    // Release lock with reason='expired'
    if (state.lockToken) {
      try {
        await supabase.functions.invoke('locks/release', {
          body: {
            lockToken: state.lockToken,
            reason: 'expired'
          }
        });
      } catch (error) {
        console.error('Failed to release lock:', error);
      }
    }
    
    toast({
      title: expiredCopy.title,
      description: expiredCopy.message,
      variant: 'destructive'
    });
    
    logAttempt({
      serviceId: state.selectedService?.id,
      date: state.selectedDate ? format(state.selectedDate, 'yyyy-MM-dd') : undefined,
      time: state.selectedTime,
      partySize: state.partySize,
      result: 'abandoned',
      reason: 'lock_expired',
      utm: state.utm,
      variant: state.variant
    });
    
    updateState({ lockToken: undefined, lockExpiresAt: undefined, selectedTime: undefined });
    goToStep('time');
  };
  
  // Handle guest step completion
  const handleGuestComplete = async (guestData: any) => {
    markStepComplete('guest');
    updateState({ guestData });
    
    try {
      // Calculate payment using anonymous-safe method
      const payment = await calculatePaymentAmountAnonymous(
        venueSlug,
        state.selectedService?.id || null,
        state.partySize!
      );
      
      console.log('💰 Payment calculation result:', payment);
      
      // Check if Stripe is available
      const { data: stripeSettings } = await supabase.functions.invoke('public-stripe-settings', {
        body: { venueSlug }
      });
      
      const stripeActive = stripeSettings?.ok && stripeSettings?.active;
      
      // Decision: No payment required → Skip to confirmation
      if (!payment.shouldCharge) {
        console.log('✅ No payment required, creating booking...');
      }
      
      // Decision: Payment required but Stripe inactive → Show error and stop
      if (payment.shouldCharge && !stripeActive) {
        console.error('❌ Payment required but Stripe inactive');
        toast({
          title: 'Payment Unavailable',
          description: 'This booking requires payment but card payments are currently disabled. Please contact the venue.',
          variant: 'destructive'
        });
        
        await logAttempt({
          serviceId: state.selectedService?.id,
          date: state.selectedDate ? format(state.selectedDate, 'yyyy-MM-dd') : undefined,
          time: state.selectedTime,
          partySize: state.partySize,
          result: 'failed',
          reason: 'payment_required_but_stripe_inactive',
          utm: state.utm,
          variant: state.variant
        });
        
        return;
      }
      
      // Create booking - wrap in 'booking' object as expected by edge function
      const bookingPayload = {
        booking: {
          venue_id: config!.venueId,
          service_id: state.selectedService?.id || null,
          service: state.selectedService.title,
          booking_date: format(state.selectedDate!, 'yyyy-MM-dd'),
          booking_time: state.selectedTime,
          party_size: state.partySize,
          guest_name: guestData.name,
          email: guestData.email,
          phone: guestData.phone,
          notes: guestData.notes || null,
          status: payment.shouldCharge ? 'pending_payment' : 'confirmed',
          source: 'widget'
        },
        lockToken: state.lockToken,
        variant: state.variant,
        utm: {
          utm_source: state.utm.utm_source,
          utm_medium: state.utm.utm_medium,
          utm_campaign: state.utm.utm_campaign,
          utm_content: state.utm.utm_content,
          utm_term: state.utm.utm_term
        }
      };
      
      const { data, error } = await supabase.functions.invoke('booking-create-secure', {
        body: bookingPayload
      });
      
      if (error || !data?.booking) {
        throw new Error(data?.message || 'Booking creation failed');
      }
      
      updateState({ 
        bookingId: data.booking.id, 
        paymentRequired: payment.shouldCharge,
        paymentAmount: payment.amount
      });
      
      if (payment.shouldCharge) {
        goToStep('payment');
      } else {
        // Log success
        await logAttempt({
          serviceId: state.selectedService?.id,
          date: format(state.selectedDate!, 'yyyy-MM-dd'),
          time: state.selectedTime,
          partySize: state.partySize,
          result: 'success',
          utm: state.utm,
          variant: state.variant
        });
        
        goToStep('confirmation');
      }
    } catch (error: any) {
      console.error('Booking creation failed:', error);
      toast({
        title: 'Booking Failed',
        description: error.message || 'Unable to create booking',
        variant: 'destructive'
      });
      
      await logAttempt({
        serviceId: state.selectedService?.id,
        date: state.selectedDate ? format(state.selectedDate, 'yyyy-MM-dd') : undefined,
        time: state.selectedTime,
        partySize: state.partySize,
        result: 'failed',
        reason: 'booking_creation_failed',
        utm: state.utm,
        variant: state.variant
      });
    }
  };
  
  // Handle payment completion
  const handlePaymentSuccess = async () => {
    await logAttempt({
      serviceId: state.selectedService?.id,
      date: state.selectedDate ? format(state.selectedDate!, 'yyyy-MM-dd') : undefined,
      time: state.selectedTime,
      partySize: state.partySize,
      result: 'success',
      utm: state.utm,
      variant: state.variant
    });
    
    goToStep('confirmation');
  };
  
  // Helper: Determine previous step based on variant
  const getPreviousStep = (currentStep: V5BookingStep): V5BookingStep | null => {
    if (state.variant === 'serviceFirst') {
      // serviceFirst flow: service → partyDate → time → guest → payment
      if (currentStep === 'time') return 'partyDate';
      if (currentStep === 'partyDate') return 'service';
      if (currentStep === 'guest') return 'time';
      if (currentStep === 'payment') return 'guest';
    } else {
      // standard flow: partyDate → service → time → guest → payment
      if (currentStep === 'service') return 'partyDate';
      if (currentStep === 'time') return 'service';
      if (currentStep === 'guest') return 'time';
      if (currentStep === 'payment') return 'guest';
    }
    return null;
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error || !config) {
    // Determine error message based on error code
    let title = 'Venue Not Available';
    let message = 'The booking page you\'re looking for doesn\'t exist or is not currently accepting bookings.';
    
    if (error?.message?.includes('not approved') || error?.message?.includes('not currently accepting')) {
      title = 'Bookings Temporarily Unavailable';
      message = 'This venue is not currently accepting online bookings. Please check back later or contact the venue directly.';
    } else if (error?.message?.includes('not found')) {
      title = 'Venue Not Found';
      message = 'We couldn\'t find the booking page you\'re looking for. Please check the URL and try again.';
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-6 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{title}</h2>
          <p className="text-muted-foreground">{message}</p>
        </Card>
      </div>
    );
  }
  
  const logoUrl = config.branding?.logo_light || config.branding?.logo_dark;
  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto">
        <BrandHeader 
          logoUrl={logoUrl}
          venueName={venueSlug}
        />
        
        {config.media && config.media.length > 0 && (
          <HeroSection images={config.media.filter(m => m.type === 'hero')} />
        )}
        
        <Card className="mt-4 mx-4 mb-4" style={{ fontFamily: 'var(--font-body)' }}>
          {state.lockToken && state.lockExpiresAt && (
            <div className="p-4 border-b">
              <HoldBanner 
                expiresAt={state.lockExpiresAt}
                onExpired={handleLockExpired}
                copy={config.copy?.holdBanner}
              />
            </div>
          )}
          
          {state.currentStep === 'partyDate' && (
            <PartyDateStep
              venueId={config.venueId}
              serviceId={state.variant === 'serviceFirst' ? state.selectedService?.id : undefined}
              initialParty={state.partySize}
              initialDate={state.selectedDate}
              onContinue={(party, date) => {
                updateState({ partySize: party, selectedDate: date });
                markStepComplete('partyDate');
                goToStep(state.variant === 'serviceFirst' ? 'time' : 'service');
              }}
            />
          )}
          
          {state.currentStep === 'service' && (
            <ServiceStep
              venueId={config.venueId}
              partySize={state.partySize!}
              selectedDate={state.variant === 'standard' ? state.selectedDate : undefined}
              initialService={prefill.service}
              onContinue={(service) => {
                updateState({ selectedService: service });
                markStepComplete('service');
                goToStep(state.variant === 'serviceFirst' ? 'partyDate' : 'time');
              }}
            />
          )}
          
          {state.currentStep === 'time' && (
            <TimeStep
              venueSlug={venueSlug}
              serviceId={state.selectedService!.id}
              date={state.selectedDate!}
              partySize={state.partySize!}
              onContinue={(time, lockToken, expiresAt) => {
                updateState({ selectedTime: time, lockToken, lockExpiresAt: expiresAt });
                markStepComplete('time');
                goToStep('guest');
              }}
              onBack={() => {
                const prevStep = getPreviousStep('time');
                if (prevStep) goToStep(prevStep);
              }}
            />
          )}
          
          {state.currentStep === 'guest' && (
            <GuestStep
              service={state.selectedService}
              venueId={config.venueId}
              onContinue={handleGuestComplete}
              onBack={() => goToStep('time')}
            />
          )}
          
          {state.currentStep === 'payment' && state.bookingId && (
            <PaymentStep
              bookingId={state.bookingId}
              amount={state.paymentAmount!}
              description={`${state.selectedService?.title} - ${state.partySize} guests`}
              onSuccess={handlePaymentSuccess}
              onBack={() => goToStep('guest')}
            />
          )}
          
          {state.currentStep === 'confirmation' && state.bookingId && (
            <ConfirmationStep
              bookingReference={`BK${state.bookingId}`}
              date={state.selectedDate!}
              time={state.selectedTime!}
              partySize={state.partySize!}
              serviceName={state.selectedService?.title}
              guestEmail={state.guestData?.email!}
              paymentAmount={state.paymentAmount}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

export function V5BookingWidget({ venueSlug }: V5BookingWidgetProps) {
  const utm = useUTM();
  const [searchParams] = useSearchParams();
  const urlVariant = parseVariant(searchParams);
  
  // Fetch config FIRST to resolve venue
  const { data: config, isLoading, error } = useV5WidgetConfig(venueSlug, urlVariant);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Show error state BEFORE Stripe loads
  if (error || !config) {
    let title = 'Venue Not Available';
    let message = 'The booking page you\'re looking for doesn\'t exist or is not currently accepting bookings.';
    
    if (error?.message?.includes('not approved') || error?.message?.includes('not currently accepting')) {
      title = 'Bookings Temporarily Unavailable';
      message = 'This venue is not currently accepting online bookings. Please check back later or contact the venue directly.';
    } else if (error?.message?.includes('not found')) {
      title = 'Venue Not Found';
      message = 'We couldn\'t find the booking page you\'re looking for. Please check the URL and try again.';
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-6 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{title}</h2>
          <p className="text-muted-foreground">{message}</p>
        </Card>
      </div>
    );
  }
  
  const effectiveVariant = config.variant || 'standard';
  
  console.log('🎯 Effective Variant:', {
    configVariant: config.variant,
    effectiveVariant,
    utmParams: utm
  });
  
  // ONLY load Stripe after venue is confirmed valid
  return (
    <StripeProvider venueSlug={venueSlug} usePublicMode={true}>
      <V5BookingProvider initialUTM={utm} variant={effectiveVariant}>
        <V5BookingWidgetInner venueSlug={venueSlug} />
      </V5BookingProvider>
    </StripeProvider>
  );
}
