

import { BookingProvider } from '../contexts/BookingContext';
import { useBookingFlow } from '../hooks/useBookingFlow';
import { PartyDateStep } from './steps/PartyDateStep';
import { TimeStep } from './steps/TimeStep';
import { ServiceStep } from './steps/ServiceStep';
import { GuestDetailsStep } from './steps/GuestDetailsStep';
import { BookingConfirmation } from '@/components/bookings/BookingConfirmation';
import { StepNavigation } from './shared/StepNavigation';
import { ProgressIndicator } from './shared/ProgressIndicator';
import { Loader2, Users, Clock, Utensils, User } from 'lucide-react';

interface BookingWidgetProps {
  venueSlug: string;
}

const STEP_TITLES = [
  'Party & Date',
  'Choose Time',
  'Select Service',
  'Your Details',
  'Confirmed'
];

function BookingWidgetContent({ venueSlug }: BookingWidgetProps) {
  const {
    currentStep,
    bookingData,
    isLoading,
    error,
    venue,
    handlePartySelection,
    handleDateSelection,
    handleTimeSelection,
    handleServiceSelection,
    handleGuestDetails,
    goBack,
  } = useBookingFlow(venueSlug);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-gray-700 font-medium">Loading venue...</p>
      </div>
    );
  }

  if (error || !venue) {
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

  const handlePartyDateContinue = (partySize: number, date: Date) => {
    handlePartySelection(partySize);
    handleDateSelection(date);
  };

  // Create proper step objects for ProgressIndicator
  const steps = [
    {
      id: 'party-date',
      name: 'Party & Date',
      icon: Users,
      isValid: bookingData.partySize > 0 && bookingData.date !== null,
      isCompleted: bookingData.partySize > 0 && bookingData.date !== null && currentStep > 0
    },
    {
      id: 'time',
      name: 'Choose Time',
      icon: Clock,
      isValid: bookingData.time !== '',
      isCompleted: bookingData.time !== '' && currentStep > 1
    },
    {
      id: 'service',
      name: 'Select Service',
      icon: Utensils,
      isValid: bookingData.service !== null,
      isCompleted: bookingData.service !== null && currentStep > 2
    },
    {
      id: 'details',
      name: 'Your Details',
      icon: User,
      isValid: bookingData.guestDetails !== null,
      isCompleted: bookingData.guestDetails !== null && currentStep > 3
    }
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <PartyDateStep
            initialPartySize={bookingData.partySize}
            selectedDate={bookingData.date}
            onContinue={handlePartyDateContinue}
            venueId={venue.id}
          />
        );
      case 1:
        return (
          <TimeStep
            selectedTime={bookingData.time}
            onTimeSelect={handleTimeSelection}
            selectedDate={bookingData.date}
            partySize={bookingData.partySize}
            venueId={venue.id}
          />
        );
      case 2:
        return (
          <ServiceStep
            selectedService={bookingData.service}
            onServiceSelect={handleServiceSelection}
            partySize={bookingData.partySize}
            selectedDate={bookingData.date}
            venueId={venue.id}
          />
        );
      case 3:
        return (
          <GuestDetailsStep
            onNext={handleGuestDetails}
            onBack={goBack}
            bookingData={{
              ...bookingData,
              venue,
            }}
            venueSlug={venueSlug}
          />
        );
      case 4:
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
      {currentStep !== 4 && (
        <ProgressIndicator 
          steps={steps}
          currentStep={currentStep} 
        />
      )}
      
      <StepNavigation
        currentStep={currentStep}
        totalSteps={STEP_TITLES.length}
        onBack={goBack}
        showBack={currentStep > 0 && currentStep !== 4}
      />
      
      {renderStep()}
    </div>
  );
}

export function BookingWidget({ venueSlug }: BookingWidgetProps) {
  return (
    <BookingProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <BookingWidgetContent venueSlug={venueSlug} />
        </div>
      </div>
    </BookingProvider>
  );
}

