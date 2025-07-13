
import { useState } from "react";
import { DateSelectorWithAvailability } from "./DateSelectorWithAvailability";
import { SimplifiedTimeSelector } from "./SimplifiedTimeSelector";
import { PartyNumberSelector } from "./PartyNumberSelector";
import { ServiceSelector } from "./ServiceSelector";
import { GuestDetailsForm } from "./GuestDetailsForm";
import { PaymentStep } from "./PaymentStep";
import { BookingConfirmation } from "./BookingConfirmation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import { calculatePaymentAmount } from "@/utils/paymentCalculation";
import { useVenueBySlug } from "@/hooks/useVenueBySlug";

export type BookingStep = 'party' | 'date' | 'time' | 'service' | 'details' | 'payment' | 'confirmation';

interface BookingFlowManagerProps {
  venueSlug: string;
  onStepChange?: (step: BookingStep) => void;
}

export const BookingFlowManager = ({ venueSlug, onStepChange }: BookingFlowManagerProps) => {
  const [currentStep, setCurrentStep] = useState<BookingStep>('party');
  const [bookingData, setBookingData] = useState({
    partySize: 2, // Default party size
    date: null as Date | null,
    time: '',
    service: null as any,
    serviceId: '',
    guestDetails: null as any,
    paymentRequired: false,
    paymentAmount: 0,
    bookingId: null as number | null,
  });

  // Resolve venue slug to venue UUID
  const { data: venue, isLoading: venueLoading, error: venueError } = useVenueBySlug(venueSlug);

  const handleStepChange = (step: BookingStep) => {
    setCurrentStep(step);
    onStepChange?.(step);
  };

  const handleBack = () => {
    const steps: BookingStep[] = ['party', 'date', 'time', 'service', 'details', 'payment', 'confirmation'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      handleStepChange(steps[currentIndex - 1]);
    }
  };

  const updateBookingData = (updates: Partial<typeof bookingData>) => {
    setBookingData(prev => ({ ...prev, ...updates }));
  };

  // Show loading state while venue is being resolved
  if (venueLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-gray-700 font-medium">Loading venue...</p>
      </div>
    );
  }

  // Show error if venue not found
  if (venueError || !venue) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="text-center">
          <p className="text-red-600 font-medium">Venue not found</p>
          <p className="text-sm text-gray-500 mt-1">
            The venue "{venueSlug}" could not be found or is not available for bookings.
          </p>
        </div>
      </div>
    );
  }

  const renderBackButton = () => {
    if (currentStep === 'party' || currentStep === 'confirmation') return null;
    
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
      case 'party':
        return (
          <PartyNumberSelector
            selectedSize={bookingData.partySize}
            onSizeSelect={(size) => {
              updateBookingData({ partySize: size });
              handleStepChange('date');
            }}
          />
        );

      case 'date':
        return (
          <DateSelectorWithAvailability
            selectedDate={bookingData.date}
            onDateSelect={(date) => {
              updateBookingData({ date });
              handleStepChange('time');
            }}
            partySize={bookingData.partySize}
            venueId={venue.id}
          />
        );

      case 'time':
        return (
          <SimplifiedTimeSelector
            selectedDate={bookingData.date}
            selectedTime={bookingData.time}
            onTimeSelect={(time) => {
              updateBookingData({ time });
              handleStepChange('service');
            }}
            selectedService={bookingData.service}
            partySize={bookingData.partySize}
            venueId={venue.id}
          />
        );

      case 'service':
        return (
          <ServiceSelector
            selectedService={bookingData.service}
            onServiceSelect={(service) => {
              updateBookingData({ 
                service: service,
                serviceId: service.id
              });
              handleStepChange('details');
            }}
            partySize={bookingData.partySize}
            selectedDate={bookingData.date}
            venueId={venue.id}
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
                    venue.id
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
              service: bookingData.service?.title || '',
            }}
          />
        );

      case 'payment':
        return (
          <PaymentStep
            amount={bookingData.paymentAmount}
            description={`Payment for ${bookingData.service?.title} - ${bookingData.partySize} guests`}
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
              service: bookingData.service?.title || '',
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
