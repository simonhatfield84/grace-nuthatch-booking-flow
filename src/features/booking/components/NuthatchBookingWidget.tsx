
import { useState } from 'react';
import { NuthatchHeader } from './shared/NuthatchHeader';
import { ProgressIndicator } from './shared/ProgressIndicator';
import { PartyStep } from './steps/PartyStep';
import { DateStep } from './steps/DateStep';
import { TimeStep } from './steps/TimeStep';
import { ServiceStep } from './steps/ServiceStep';
import { GuestDetailsStep } from './steps/GuestDetailsStep';
import { PaymentStep } from './steps/PaymentStep';
import { ConfirmationStep } from './steps/ConfirmationStep';

type BookingStep = 'party' | 'date' | 'time' | 'service' | 'details' | 'payment' | 'confirmation';

interface BookingData {
  partySize: number;
  date: Date | null;
  time: string;
  service: any;
  guestDetails: any;
  bookingId: number | null;
  paymentAmount: number;
  paymentRequired: boolean;
}

export function NuthatchBookingWidget() {
  const [currentStep, setCurrentStep] = useState<BookingStep>('party');
  const [bookingData, setBookingData] = useState<BookingData>({
    partySize: 2,
    date: null,
    time: '',
    service: null,
    guestDetails: null,
    bookingId: null,
    paymentAmount: 0,
    paymentRequired: false,
  });

  // Hard-coded venue ID for Nuthatch
  const venueId = 'nuthatch-venue-id';

  const updateBookingData = (updates: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...updates }));
  };

  const handlePartySelection = (partySize: number) => {
    updateBookingData({ partySize });
    setCurrentStep('date');
  };

  const handleDateSelection = (date: Date) => {
    updateBookingData({ date });
    setCurrentStep('time');
  };

  const handleTimeSelection = (time: string) => {
    updateBookingData({ time });
    setCurrentStep('service');
  };

  const handleServiceSelection = (service: any) => {
    updateBookingData({ service });
    setCurrentStep('details');
  };

  const handleGuestDetailsSubmit = (guestDetails: any, bookingId: number, paymentRequired: boolean, paymentAmount: number) => {
    updateBookingData({ 
      guestDetails, 
      bookingId, 
      paymentRequired, 
      paymentAmount 
    });
    
    if (paymentRequired && paymentAmount > 0) {
      setCurrentStep('payment');
    } else {
      setCurrentStep('confirmation');
    }
  };

  const handlePaymentSuccess = () => {
    setCurrentStep('confirmation');
  };

  const handleBack = () => {
    const stepOrder: BookingStep[] = ['party', 'date', 'time', 'service', 'details', 'payment', 'confirmation'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'party':
        return (
          <PartyStep
            initialSize={bookingData.partySize}
            onContinue={handlePartySelection}
          />
        );
      case 'date':
        return (
          <DateStep
            selectedDate={bookingData.date}
            onDateSelect={handleDateSelection}
            partySize={bookingData.partySize}
            venueId={venueId}
          />
        );
      case 'time':
        return (
          <TimeStep
            selectedDate={bookingData.date}
            selectedTime={bookingData.time}
            onTimeSelect={handleTimeSelection}
            partySize={bookingData.partySize}
            venueId={venueId}
          />
        );
      case 'service':
        return (
          <ServiceStep
            selectedService={bookingData.service}
            onServiceSelect={handleServiceSelection}
            partySize={bookingData.partySize}
            selectedDate={bookingData.date}
            venueId={venueId}
          />
        );
      case 'details':
        return (
          <GuestDetailsStep
            bookingData={bookingData}
            onSubmit={handleGuestDetailsSubmit}
            onBack={handleBack}
          />
        );
      case 'payment':
        return (
          <PaymentStep
            amount={bookingData.paymentAmount}
            paymentRequired={bookingData.paymentRequired}
            onSuccess={handlePaymentSuccess}
            bookingId={bookingData.bookingId!}
            description={`Payment for ${bookingData.service?.title} - ${bookingData.partySize} guests`}
          />
        );
      case 'confirmation':
        return (
          <ConfirmationStep
            bookingData={bookingData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-nuthatch-light">
      <NuthatchHeader />
      
      <div className="max-w-md mx-auto px-4 py-8">
        <ProgressIndicator 
          currentStep={currentStep}
          totalSteps={bookingData.paymentRequired ? 7 : 6}
        />
        
        <div className="mt-8">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
