import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { V5BookingProvider, useV5Booking } from '../context/V5BookingContext';
import { useV5WidgetConfig } from '../hooks/useV5WidgetConfig';
import { useUTM } from '../hooks/useUTM';
import { useAttemptLogger } from '../hooks/useAttemptLogger';
import { parseURLPrefill, parseVariant } from '../utils/paramParsing';
import { BrandHeader } from './BrandHeader';
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
import { calculatePaymentAmount } from '@/utils/paymentCalculation';
import { format } from 'date-fns';

interface V5BookingWidgetProps {
  venueSlug: string;
}

function V5BookingWidgetInner({ venueSlug }: V5BookingWidgetProps) {
  const [searchParams] = useSearchParams();
  const variant = parseVariant(searchParams);
  const prefill = parseURLPrefill(searchParams);
  
  const { data: config, isLoading, error } = useV5WidgetConfig(venueSlug, variant);
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
  const handleLockExpired = () => {
    toast({
      title: 'Time slot expired',
      description: 'Please select a new time',
      variant: 'destructive'
    });
    
    logAttempt({
      serviceId: state.selectedService?.id,
      date: state.selectedDate ? format(state.selectedDate, 'yyyy-MM-dd') : undefined,
      time: state.selectedTime,
      partySize: state.partySize,
      result: 'abandoned',
      reason: 'lock_expired',
      utm: state.utm
    });
    
    updateState({ lockToken: undefined, lockExpiresAt: undefined, selectedTime: undefined });
    goToStep('time');
  };
  
  // Handle guest step completion
  const handleGuestComplete = async (guestData: any) => {
    markStepComplete('guest');
    updateState({ guestData });
    
    try {
      // Calculate payment
      const payment = await calculatePaymentAmount(
        state.selectedService,
        state.partySize!,
        config!.venueId
      );
      
      // Create booking
      const bookingPayload = {
        venue_id: config!.venueId,
        service: state.selectedService.title,
        booking_date: format(state.selectedDate!, 'yyyy-MM-dd'),
        booking_time: state.selectedTime,
        party_size: state.partySize,
        guest_name: guestData.name,
        email: guestData.email,
        phone: guestData.phone,
        notes: guestData.notes,
        status: payment.shouldCharge ? 'pending_payment' : 'confirmed',
        lockToken: state.lockToken,
        utm_source: state.utm.utm_source,
        utm_medium: state.utm.utm_medium,
        utm_campaign: state.utm.utm_campaign,
        utm_content: state.utm.utm_content,
        utm_term: state.utm.utm_term
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
          utm: state.utm
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
        utm: state.utm
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
      utm: state.utm
    });
    
    goToStep('confirmation');
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-6 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Venue Not Found</h2>
          <p className="text-muted-foreground">
            The booking page you're looking for doesn't exist or is not available.
          </p>
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
        
        <Card className="mt-4 mx-4 mb-4">
          {state.lockToken && state.lockExpiresAt && (
            <div className="p-4 border-b">
              <HoldBanner 
                expiresAt={state.lockExpiresAt}
                onExpired={handleLockExpired}
              />
            </div>
          )}
          
          {state.currentStep === 'partyDate' && (
            <PartyDateStep
              venueId={config.venueId}
              initialParty={state.partySize}
              initialDate={state.selectedDate}
              onContinue={(party, date) => {
                updateState({ partySize: party, selectedDate: date });
                markStepComplete('partyDate');
                goToStep(variant === 'serviceFirst' ? 'service' : 'service');
              }}
            />
          )}
          
          {state.currentStep === 'service' && (
            <ServiceStep
              venueId={config.venueId}
              partySize={state.partySize!}
              initialService={prefill.service}
              onContinue={(service) => {
                updateState({ selectedService: service });
                markStepComplete('service');
                goToStep('time');
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
              onBack={() => goToStep('service')}
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
  
  return (
    <V5BookingProvider initialUTM={utm}>
      <V5BookingWidgetInner venueSlug={venueSlug} />
    </V5BookingProvider>
  );
}
