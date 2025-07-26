
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { DateTimeStep } from "./DateTimeStep";
import { DetailsStep } from "./DetailsStep";
import { ConfirmationStep } from "./ConfirmationStep";
import { PaymentStep } from "./PaymentStep";
import type { BookingData } from "@/types/booking";

interface NuthatchBookingWidgetProps {
  onBookingComplete?: (bookingId: number) => void;
}

export function NuthatchBookingWidget({ onBookingComplete }: NuthatchBookingWidgetProps) {
  const [currentStep, setCurrentStep] = useState<'datetime' | 'details' | 'confirmation' | 'payment'>('datetime');
  const [bookingData, setBookingData] = useState<BookingData>({
    selectedDate: null,
    selectedTime: null,
    partySize: 2,
    tableId: null,
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    specialRequests: '',
    bookingId: null,
    paymentAmount: 0,
    paymentRequired: false
  });
  const [error, setError] = useState<string | null>(null);

  const handleStepComplete = (stepData: Partial<BookingData>) => {
    console.log('Step completed with data:', stepData);
    setBookingData(prev => ({ ...prev, ...stepData }));
    setError(null);

    // Determine next step
    if (currentStep === 'datetime') {
      setCurrentStep('details');
    } else if (currentStep === 'details') {
      setCurrentStep('confirmation');
    } else if (currentStep === 'confirmation') {
      // Check if payment is required
      if (stepData.paymentRequired) {
        setCurrentStep('payment');
      } else {
        // Booking complete
        const finalBookingId = stepData.bookingId ?? bookingData.bookingId;
        if (finalBookingId && onBookingComplete) {
          onBookingComplete(typeof finalBookingId === 'string' ? parseInt(finalBookingId, 10) : finalBookingId);
        }
      }
    } else if (currentStep === 'payment') {
      // Payment complete
      const finalBookingId = stepData.bookingId ?? bookingData.bookingId;
      if (finalBookingId && onBookingComplete) {
        onBookingComplete(typeof finalBookingId === 'string' ? parseInt(finalBookingId, 10) : finalBookingId);
      }
    }
  };

  const handleStepError = (errorMessage: string) => {
    console.error('Step error:', errorMessage);
    setError(errorMessage);
  };

  const handleBack = () => {
    setError(null);
    if (currentStep === 'details') {
      setCurrentStep('datetime');
    } else if (currentStep === 'confirmation') {
      setCurrentStep('details');
    } else if (currentStep === 'payment') {
      setCurrentStep('confirmation');
    }
  };

  // Debug logging
  useEffect(() => {
    console.log('Current booking data:', bookingData);
    console.log('Current step:', currentStep);
  }, [bookingData, currentStep]);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-6">
        <div className={`flex items-center space-x-2 ${currentStep === 'datetime' ? 'text-primary' : currentStep !== 'datetime' ? 'text-green-600' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'datetime' ? 'bg-primary text-primary-foreground' : currentStep !== 'datetime' ? 'bg-green-600 text-white' : 'bg-muted'}`}>
            1
          </div>
          <span className="font-medium">Date & Time</span>
        </div>
        
        <div className={`flex items-center space-x-2 ${currentStep === 'details' ? 'text-primary' : ['confirmation', 'payment'].includes(currentStep) ? 'text-green-600' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'details' ? 'bg-primary text-primary-foreground' : ['confirmation', 'payment'].includes(currentStep) ? 'bg-green-600 text-white' : 'bg-muted'}`}>
            2
          </div>
          <span className="font-medium">Your Details</span>
        </div>
        
        <div className={`flex items-center space-x-2 ${currentStep === 'confirmation' ? 'text-primary' : currentStep === 'payment' ? 'text-green-600' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'confirmation' ? 'bg-primary text-primary-foreground' : currentStep === 'payment' ? 'bg-green-600 text-white' : 'bg-muted'}`}>
            3
          </div>
          <span className="font-medium">Confirmation</span>
        </div>
        
        {bookingData.paymentRequired && (
          <div className={`flex items-center space-x-2 ${currentStep === 'payment' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'payment' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              4
            </div>
            <span className="font-medium">Payment</span>
          </div>
        )}
      </div>

      {/* Step Content */}
      {currentStep === 'datetime' && (
        <DateTimeStep
          selectedDate={bookingData.selectedDate}
          selectedTime={bookingData.selectedTime}
          partySize={bookingData.partySize}
          onComplete={handleStepComplete}
          onError={handleStepError}
        />
      )}

      {currentStep === 'details' && (
        <DetailsStep
          bookingData={bookingData}
          onComplete={handleStepComplete}
          onError={handleStepError}
          onBack={handleBack}
        />
      )}

      {currentStep === 'confirmation' && (
        <ConfirmationStep
          bookingData={bookingData}
          onComplete={handleStepComplete}
          onError={handleStepError}
          onBack={handleBack}
        />
      )}

      {currentStep === 'payment' && bookingData.bookingId !== null && (
        <PaymentStep
          amount={bookingData.paymentAmount}
          paymentRequired={bookingData.paymentRequired}
          bookingId={typeof bookingData.bookingId === 'string' ? parseInt(bookingData.bookingId, 10) : bookingData.bookingId}
          onComplete={handleStepComplete}
          onError={handleStepError}
          onBack={handleBack}
        />
      )}
    </div>
  );
}
