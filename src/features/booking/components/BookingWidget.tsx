import { BookingProvider } from '../contexts/BookingContext';
import { useBookingFlow } from '../hooks/useBookingFlow';
import { PartyStep } from './steps/PartyStep';
import { DateStep } from './steps/DateStep';
import { TimeStep } from './steps/TimeStep';
import { ServiceStep } from './steps/ServiceStep';
import GuestDetailsStep from './steps/GuestDetailsStep';
import { BookingConfirmation } from '@/components/bookings/BookingConfirmation';
import { StepNavigation } from './shared/StepNavigation';
import { ProgressIndicator } from './shared/ProgressIndicator';
import { Loader2 } from 'lucide-react';

interface BookingWidgetProps {
  venueSlug: string;
}

const STEP_TITLES = [
  'Party Size',
  'Select Date', 
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

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <PartyStep
            initialSize={bookingData.partySize}
            onContinue={handlePartySelection}
          />
        );
      case 1:
        return (
          <DateStep
            selectedDate={bookingData.date}
            onDateSelect={handleDateSelection}
            partySize={bookingData.partySize}
            venueId={venue.id}
          />
        );
      case 2:
        return (
          <TimeStep
            selectedTime={bookingData.time}
            onTimeSelect={handleTimeSelection}
            selectedDate={bookingData.date}
            partySize={bookingData.partySize}
            venueId={venue.id}
          />
        );
      case 3:
        return (
          <ServiceStep
            selectedService={bookingData.service}
            onServiceSelect={handleServiceSelection}
            partySize={bookingData.partySize}
            selectedDate={bookingData.date}
            venueId={venue.id}
          />
        );
      case 4:
        return (
          <GuestDetailsStep
            value={bookingData.guestDetails ? {
              name: bookingData.guestDetails.name,
              email: bookingData.guestDetails.email,
              phone: bookingData.guestDetails.phone || '',
              notes: bookingData.guestDetails.notes || '',
              marketingOptIn: bookingData.guestDetails.marketingOptIn,
              termsAccepted: bookingData.guestDetails.termsAccepted
            } : {
              name: '',
              email: '',
              phone: '',
              notes: '',
              marketingOptIn: false,
              termsAccepted: false
            }}
            service={bookingData.service}
            venue={venue}
            partySize={bookingData.partySize}
            date={bookingData.date}
            time={bookingData.time}
            onChange={handleGuestDetails}
          />
        );
      case 5:
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
      {currentStep !== 5 && (
        <ProgressIndicator 
          steps={[]}
          currentStep={currentStep} 
        />
      )}
      
      <StepNavigation
        currentStep={currentStep}
        totalSteps={STEP_TITLES.length}
        onBack={goBack}
        showBack={currentStep > 0 && currentStep !== 5}
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
