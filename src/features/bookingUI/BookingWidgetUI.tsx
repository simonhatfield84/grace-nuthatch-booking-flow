/**
 * UI-only clone of the booking widget.
 * Logic will be wired via BookingAPI later.
 * 
 * This is a visual duplicate preserving all design elements:
 * - Typography (Playfair Display, Lato, Karla)
 * - Nuthatch color scheme
 * - Spacing, layout, animations
 * - Microcopy and user messaging
 * 
 * All data/API calls are stubbed with static values.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { StepNavigationUI } from './ui/StepNavigationUI';
import { PartyDateStepUI } from './steps/PartyDateStepUI';
import { ServiceStepUI } from './steps/ServiceStepUI';
import { TimeStepUI } from './steps/TimeStepUI';
import { GuestDetailsStepUI } from './steps/GuestDetailsStepUI';
import { ConfirmationStepUI } from './steps/ConfirmationStepUI';
import { Service } from '@/features/bookingAPI';
import { useLockManager } from '@/features/bookingAPI/useLockManager';
import { format } from 'date-fns';

interface BookingWidgetUIProps {
  venueSlug: string;
  onStepChange?: (step: number) => void;
  debug?: boolean;
}

interface BookingData {
  partySize: number;
  date?: Date;
  service?: Service;
  time?: string;
  guestDetails?: {
    name: string;
    phone: string;
    email: string;
    notes: string;
    marketingOptIn: boolean;
    termsAccepted: boolean;
  };
  bookingReference?: string;
}

export function BookingWidgetUI({ venueSlug, onStepChange, debug }: BookingWidgetUIProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [bookingData, setBookingData] = useState<BookingData>({
    partySize: 2,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lockManager = useLockManager();

  // Stub venue data
  const venue = {
    id: 'stub-venue',
    slug: venueSlug,
    name: 'The Nuthatch',
  };

  const steps = [
    { 
      id: 'party-date', 
      name: 'Party & Date',
      label: bookingData.date 
        ? `${bookingData.partySize} guests` 
        : undefined,
    },
    { 
      id: 'service', 
      name: 'Service',
      label: bookingData.service?.title,
    },
    { 
      id: 'time', 
      name: 'Time',
      label: bookingData.time,
    },
    { 
      id: 'details', 
      name: 'Details',
      label: bookingData.guestDetails?.name,
    },
    { 
      id: 'confirmation', 
      name: 'Confirmation',
    },
  ];

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
    onStepChange?.(step);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      handleStepChange(currentStep - 1);
    }
  };

  const handlePartyDateContinue = (partySize: number, date: Date) => {
    setBookingData(prev => ({ ...prev, partySize, date }));
    handleStepChange(1);
  };

  const handleServiceSelect = (service: any) => {
    setBookingData(prev => ({ ...prev, service }));
    handleStepChange(2);
  };

  const handleTimeSelect = async (time: string) => {
    if (!bookingData.service || !bookingData.date) return;

    const success = await lockManager.acquireLock(
      venueSlug,
      bookingData.service.id,
      format(bookingData.date, 'yyyy-MM-dd'),
      time,
      bookingData.partySize
    );

    if (success) {
      setBookingData(prev => ({ ...prev, time }));
      handleStepChange(3);
    }
  };

  const handleGuestDetailsSubmit = async (details: any, requiresPayment: boolean) => {
    setIsSubmitting(true);
    
    // Mock booking submission with 2s delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock booking reference
    const reference = `BK-2025-${Math.floor(Math.random() * 900000 + 100000)}`;
    
    setBookingData(prev => ({ 
      ...prev, 
      guestDetails: details,
      bookingReference: reference,
    }));
    
    setIsSubmitting(false);
    handleStepChange(4);
  };

  const handleNewBooking = () => {
    setBookingData({ partySize: 2 });
    handleStepChange(0);
  };

  const renderCurrentStep = () => {
    if (isSubmitting) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-nuthatch-green" />
          <p className="text-nuthatch-muted">Processing your booking...</p>
        </div>
      );
    }

    switch (currentStep) {
      case 0:
        return (
          <PartyDateStepUI
            initialPartySize={bookingData.partySize}
            selectedDate={bookingData.date}
            onContinue={handlePartyDateContinue}
          />
        );
      case 1:
        return (
          <ServiceStepUI
            venueSlug={venueSlug}
            partySize={bookingData.partySize}
            selectedDate={bookingData.date}
            selectedService={bookingData.service}
            onServiceSelect={handleServiceSelect}
          />
        );
      case 2:
        return (
          <TimeStepUI
            venueSlug={venueSlug}
            serviceId={bookingData.service?.id || ''}
            partySize={bookingData.partySize}
            selectedTime={bookingData.time}
            selectedDate={bookingData.date}
            onTimeSelect={handleTimeSelect}
          />
        );
      case 3:
        return (
          <GuestDetailsStepUI
            venueSlug={venueSlug}
            bookingData={{
              serviceId: bookingData.service?.id || '',
              date: bookingData.date ? format(bookingData.date, 'yyyy-MM-dd') : '',
              time: bookingData.time || '',
              partySize: bookingData.partySize,
            }}
            lockToken={lockManager.lockToken || ''}
            secondsRemaining={lockManager.secondsRemaining}
            onSubmit={handleGuestDetailsSubmit}
            requiresDeposit={bookingData.service?.requires_payment}
          />
        );
      case 4:
        return (
          <ConfirmationStepUI
            booking={{
              reference: bookingData.bookingReference || 'BK-2025-000000',
              partySize: bookingData.partySize,
              date: bookingData.date!,
              time: bookingData.time!,
              serviceName: bookingData.service?.title || '',
              guestName: bookingData.guestDetails?.name || '',
              guestEmail: bookingData.guestDetails?.email || '',
              guestPhone: bookingData.guestDetails?.phone || '',
              depositPaid: bookingData.service?.requires_payment,
              depositAmount: bookingData.service?.requires_payment ? 1000 : undefined,
            }}
            onNewBooking={handleNewBooking}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-karla">
      {/* Header */}
      <div className="bg-black text-white text-center p-4">
        <h1 className="text-xl font-medium">{venue.name}</h1>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto">
        {/* Step Navigation */}
        {currentStep < 4 && (
          <StepNavigationUI
            steps={steps}
            currentStep={currentStep}
            onStepClick={handleStepChange}
          />
        )}

        {/* Step Content */}
        <div className="p-6 min-h-[400px]">
          {renderCurrentStep()}
        </div>

        {/* Back Button Footer */}
        {currentStep > 0 && currentStep < 4 && !isSubmitting && (
          <div className="border-t border-gray-200 bg-gray-50 p-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        )}
      </div>

      {/* Debug Footer */}
      {debug && (
        <div className="fixed bottom-0 right-0 bg-black text-white text-xs px-3 py-1 rounded-tl-lg">
          Booking UI: New (UI-only)
        </div>
      )}
    </div>
  );
}
