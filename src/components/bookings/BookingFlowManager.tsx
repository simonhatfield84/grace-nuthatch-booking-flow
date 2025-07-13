
import { useState } from "react";
import { DateSelectorWithAvailability } from "./DateSelectorWithAvailability";
import { EnhancedTimeSlotSelector } from "./EnhancedTimeSlotSelector";
import { PartyNumberSelector } from "./PartyNumberSelector";
import { ServiceSelector } from "./ServiceSelector";
import { GuestDetailsForm } from "./GuestDetailsForm";
import { PaymentStep } from "./PaymentStep";
import { BookingConfirmation } from "./BookingConfirmation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export type BookingStep = 'date' | 'time' | 'party' | 'service' | 'details' | 'payment' | 'confirmation';

interface BookingFlowManagerProps {
  venueSlug: string;
  onStepChange?: (step: BookingStep) => void;
}

export const BookingFlowManager = ({ venueSlug, onStepChange }: BookingFlowManagerProps) => {
  const [currentStep, setCurrentStep] = useState<BookingStep>('date');
  const [bookingData, setBookingData] = useState({
    date: null as Date | null,
    time: '',
    partySize: 2, // Default party size
    service: '',
    guestDetails: null as any,
    paymentRequired: false,
    bookingId: null as number | null,
  });

  const handleStepChange = (step: BookingStep) => {
    setCurrentStep(step);
    onStepChange?.(step);
  };

  const handleBack = () => {
    const steps: BookingStep[] = ['date', 'time', 'party', 'service', 'details', 'payment', 'confirmation'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      handleStepChange(steps[currentIndex - 1]);
    }
  };

  const updateBookingData = (updates: Partial<typeof bookingData>) => {
    setBookingData(prev => ({ ...prev, ...updates }));
  };

  const renderBackButton = () => {
    if (currentStep === 'date' || currentStep === 'confirmation') return null;
    
    return (
      <Button 
        variant="outline" 
        onClick={handleBack}
        className="mb-4"
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'date':
        return (
          <DateSelectorWithAvailability
            selectedDate={bookingData.date}
            onDateSelect={(date) => {
              updateBookingData({ date });
              handleStepChange('time');
            }}
            partySize={bookingData.partySize}
            venueId={venueSlug}
          />
        );

      case 'time':
        return (
          <EnhancedTimeSlotSelector
            selectedDate={bookingData.date}
            selectedTime={bookingData.time}
            onTimeSelect={(time) => {
              updateBookingData({ time });
              handleStepChange('party');
            }}
            partySize={bookingData.partySize}
            venueId={venueSlug}
          />
        );

      case 'party':
        return (
          <PartyNumberSelector
            selectedSize={bookingData.partySize}
            onSizeSelect={(size) => {
              updateBookingData({ partySize: size });
              handleStepChange('service');
            }}
          />
        );

      case 'service':
        return (
          <ServiceSelector
            selectedService={bookingData.service}
            onServiceSelect={(service) => {
              updateBookingData({ service });
              handleStepChange('details');
            }}
            partySize={bookingData.partySize}
            selectedDate={bookingData.date}
            venueId={venueSlug}
          />
        );

      case 'details':
        return (
          <GuestDetailsForm
            onSubmit={(details, paymentRequired) => {
              updateBookingData({ 
                guestDetails: details, 
                paymentRequired 
              });
              if (paymentRequired) {
                handleStepChange('payment');
              } else {
                // Create booking and go to confirmation
                handleStepChange('confirmation');
              }
            }}
            bookingData={{
              date: bookingData.date?.toISOString().split('T')[0] || '',
              time: bookingData.time,
              partySize: bookingData.partySize,
              service: bookingData.service,
            }}
          />
        );

      case 'payment':
        return (
          <PaymentStep
            amount={50} // This should be calculated based on service
            description="Booking deposit"
            bookingId={bookingData.bookingId || undefined}
            onPaymentSuccess={() => {
              handleStepChange('confirmation');
            }}
            onPaymentError={(error) => {
              console.error('Payment error:', error);
            }}
          />
        );

      case 'confirmation':
        return (
          <BookingConfirmation
            bookingData={{
              ...bookingData,
              date: bookingData.date?.toISOString().split('T')[0] || '',
            }}
            venueSlug={venueSlug}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto">
      {renderBackButton()}
      {renderCurrentStep()}
    </div>
  );
};
