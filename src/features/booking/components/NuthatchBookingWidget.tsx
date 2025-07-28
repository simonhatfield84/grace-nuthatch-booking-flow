import React, { useState } from 'react';
import { PartyStep } from './steps/PartyStep';
import { DateStep } from './steps/DateStep';
import { TimeStep } from './steps/TimeStep';
import { ServiceStep } from './steps/ServiceStep';
import { GuestDetailsStep } from './steps/GuestDetailsStep';
import { PaymentStep } from './steps/PaymentStep';
import { ConfirmationStep } from './steps/ConfirmationStep';

interface BookingData {
  partySize: number;
  date: Date | null;
  time: string;
  service: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  bookingId?: string;
}

type BookingStep = 'party' | 'date' | 'time' | 'service' | 'guest-details' | 'payment' | 'confirmation';

export default function NuthatchBookingWidget() {
  const [currentStep, setCurrentStep] = useState<BookingStep>('party');
  const [bookingData, setBookingData] = useState<BookingData>({
    partySize: 1,
    date: null,
    time: '',
    service: '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
  });

  const nextStep = (data: Partial<BookingData> = {}) => {
    setBookingData({ ...bookingData, ...data });
    switch (currentStep) {
      case 'party':
        setCurrentStep('date');
        break;
      case 'date':
        setCurrentStep('time');
        break;
      case 'time':
        setCurrentStep('service');
        break;
      case 'service':
        setCurrentStep('guest-details');
        break;
      case 'guest-details':
        setCurrentStep('payment');
        break;
      case 'payment':
        setCurrentStep('confirmation');
        break;
      default:
        setCurrentStep('party');
    }
  };

  const prevStep = () => {
    switch (currentStep) {
      case 'date':
        setCurrentStep('party');
        break;
      case 'time':
        setCurrentStep('date');
        break;
      case 'service':
        setCurrentStep('time');
        break;
      case 'guest-details':
        setCurrentStep('service');
        break;
      case 'payment':
        setCurrentStep('guest-details');
        break;
      case 'confirmation':
        setCurrentStep('payment');
        break;
      default:
        setCurrentStep('party');
    }
  };

  const setBookingId = (bookingId: string) => {
    setBookingData({ ...bookingData, bookingId: bookingId });
    nextStep();
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'party':
        return (
          <PartyStep 
            initialSize={bookingData.partySize}
            onContinue={(partySize) => nextStep({ partySize })}
          />
        );
      case 'date':
        return (
          <DateStep 
            selectedDate={bookingData.date}
            onDateSelect={(date) => nextStep({ date })}
            partySize={bookingData.partySize}
            venueId="nuthatch"
          />
        );
      case 'time':
        return (
          <TimeStep 
            selectedTime={bookingData.time}
            onTimeSelect={(time) => nextStep({ time })}
            selectedDate={bookingData.date}
            partySize={bookingData.partySize}
            venueId="nuthatch"
          />
        );
      case 'service':
        return (
          <ServiceStep 
            selectedService={bookingData.service}
            onServiceSelect={(service) => nextStep({ service })}
            partySize={bookingData.partySize}
            selectedDate={bookingData.date}
            venueId="nuthatch"
          />
        );
      case 'guest-details':
        return (
          <GuestDetailsStep 
            bookingData={bookingData}
            onSubmit={(guestDetails, bookingId, paymentRequired, paymentAmount) => {
              setBookingData({ 
                ...bookingData, 
                ...guestDetails,
                bookingId: bookingId.toString(),
                paymentRequired,
                paymentAmount
              });
              nextStep();
            }}
            onBack={prevStep}
          />
        );
      case 'payment':
        return bookingData.bookingId ? (
          <PaymentStep 
            bookingId={parseInt(bookingData.bookingId)}
            amount={bookingData.paymentAmount || 0}
            paymentRequired={bookingData.paymentRequired || false}
            onSuccess={() => nextStep()}
          />
        ) : (
          <div>Error: No booking ID available</div>
        );
      case 'confirmation':
        return <ConfirmationStep bookingData={bookingData} />;
      default:
        return (
          <PartyStep 
            initialSize={bookingData.partySize}
            onContinue={(partySize) => nextStep({ partySize })}
          />
        );
    }
  };

  return (
    <div>
      <h2>Book a Table</h2>
      {renderCurrentStep()}
    </div>
  );
}
