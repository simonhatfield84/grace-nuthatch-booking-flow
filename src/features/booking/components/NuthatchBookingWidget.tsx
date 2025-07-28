
import React, { useState } from 'react';
import { Calendar, Users, Clock, Utensils, User, CreditCard, CheckCircle } from 'lucide-react';
import { NuthatchHeader } from './shared/NuthatchHeader';
import { ProgressIndicator } from './shared/ProgressIndicator';
import { StepNavigation } from './shared/StepNavigation';
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
  paymentRequired?: boolean;
  paymentAmount?: number;
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
    paymentRequired: false,
    paymentAmount: 0,
  });

  const steps = [
    { id: 'party', name: 'Party Size', icon: Users, isValid: bookingData.partySize > 0, isCompleted: currentStep !== 'party' && bookingData.partySize > 0 },
    { id: 'date', name: 'Date', icon: Calendar, isValid: bookingData.date !== null, isCompleted: currentStep !== 'date' && bookingData.date !== null },
    { id: 'time', name: 'Time', icon: Clock, isValid: bookingData.time !== '', isCompleted: currentStep !== 'time' && bookingData.time !== '' },
    { id: 'service', name: 'Service', icon: Utensils, isValid: bookingData.service !== '', isCompleted: currentStep !== 'service' && bookingData.service !== '' },
    { id: 'guest-details', name: 'Details', icon: User, isValid: bookingData.guestName !== '', isCompleted: currentStep !== 'guest-details' && bookingData.guestName !== '' },
    { id: 'payment', name: 'Payment', icon: CreditCard, isValid: true, isCompleted: currentStep !== 'payment' && bookingData.bookingId !== undefined },
    { id: 'confirmation', name: 'Confirmation', icon: CheckCircle, isValid: true, isCompleted: currentStep === 'confirmation' },
  ];

  const getCurrentStepIndex = () => steps.findIndex(step => step.id === currentStep);

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

  const goToStep = (stepIndex: number) => {
    const stepId = steps[stepIndex].id;
    setCurrentStep(stepId as BookingStep);
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
          <div className="text-center py-8">
            <p className="text-nuthatch-muted">Error: No booking ID available</p>
          </div>
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
    <div className="min-h-screen bg-nuthatch-light">
      <NuthatchHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-nuthatch-heading text-3xl font-light text-nuthatch-dark mb-2">
              Reserve Your Table
            </h1>
            <p className="text-nuthatch-muted">
              Book your dining experience at The Nuthatch
            </p>
          </div>

          <div className="bg-nuthatch-white rounded-lg shadow-sm border border-nuthatch-border p-6 mb-6">
            <ProgressIndicator 
              steps={steps}
              currentStep={getCurrentStepIndex()}
              onStepClick={goToStep}
            />
          </div>

          <div className="bg-nuthatch-white rounded-lg shadow-sm border border-nuthatch-border p-6">
            <StepNavigation
              currentStep={getCurrentStepIndex()}
              totalSteps={steps.length}
              onBack={prevStep}
              showBack={currentStep !== 'party' && currentStep !== 'confirmation'}
            />
            
            <div className="mt-4">
              {renderCurrentStep()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
