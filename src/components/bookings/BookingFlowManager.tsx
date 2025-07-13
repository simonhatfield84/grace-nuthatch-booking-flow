
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
import { calculatePaymentAmount } from "@/utils/paymentCalculation";

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
    serviceId: '',
    guestDetails: null as any,
    paymentRequired: false,
    paymentAmount: 0,
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
              updateBookingData({ 
                service: service.title,
                serviceId: service.id
              });
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
            onSubmit={async (details, paymentRequired) => {
              let paymentAmount = 0;
              
              if (paymentRequired && bookingData.serviceId) {
                try {
                  const paymentCalculation = await calculatePaymentAmount(
                    bookingData.serviceId,
                    bookingData.partySize,
                    venueSlug
                  );
                  paymentAmount = paymentCalculation.amount;
                } catch (error) {
                  console.error('Error calculating payment:', error);
                }
              }

              updateBookingData({ 
                guestDetails: details, 
                paymentRequired,
                paymentAmount
              });
              
              if (paymentRequired) {
                handleStepChange('payment');
              } else {
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
            amount={bookingData.paymentAmount}
            description={`Payment for ${bookingData.service} - ${bookingData.partySize} guests`}
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
