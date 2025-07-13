
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
    date: '',
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
            venueSlug={venueSlug}
            selectedDate={bookingData.date}
            onDateSelect={(date) => {
              updateBookingData({ date });
              handleStepChange('time');
            }}
          />
        );

      case 'time':
        return (
          <EnhancedTimeSlotSelector
            venueSlug={venueSlug}
            selectedDate={bookingData.date}
            partySize={bookingData.partySize}
            selectedTime={bookingData.time}
            onTimeSelect={(time) => {
              updateBookingData({ time });
              handleStepChange('party');
            }}
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
            venueSlug={venueSlug}
            selectedService={bookingData.service}
            partySize={bookingData.partySize}
            onServiceSelect={(service) => {
              updateBookingData({ service });
              handleStepChange('details');
            }}
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
              date: bookingData.date,
              time: bookingData.time,
              partySize: bookingData.partySize,
              service: bookingData.service,
            }}
          />
        );

      case 'payment':
        return (
          <PaymentStep
            bookingData={bookingData}
            onPaymentComplete={(bookingId) => {
              updateBookingData({ bookingId });
              handleStepChange('confirmation');
            }}
          />
        );

      case 'confirmation':
        return (
          <BookingConfirmation
            bookingData={bookingData}
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
