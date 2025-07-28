import React, { useState } from 'react';
import PartyStep from './PartyStep';
import DateStep from './DateStep';
import TimeStep from './TimeStep';
import ServiceStep from './ServiceStep';
import GuestDetailsStep from './GuestDetailsStep';
import PaymentStep from './PaymentStep';
import ConfirmationStep from './ConfirmationStep';

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
        return <PartyStep />;
      case 'date':
        return <DateStep />;
      case 'time':
        return <TimeStep />;
      case 'service':
        return <ServiceStep />;
      case 'guest-details':
        return <GuestDetailsStep />;
      case 'payment':
        return bookingData.bookingId ? (
          <PaymentStep bookingId={Number(bookingData.bookingId)} />
        ) : (
          <div>Error: No booking ID available</div>
        );
      case 'confirmation':
        return <ConfirmationStep />;
      default:
        return <PartyStep />;
    }
  };

  return (
    <div>
      <h2>Book a Table</h2>
      {renderCurrentStep()}
    </div>
  );
}
