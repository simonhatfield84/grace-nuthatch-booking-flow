
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { BookingFormProvider } from "../contexts/BookingFormContext";
import { ServiceSelectionStep } from "./steps/ServiceSelectionStep";
import { GuestDetailsStep } from "./steps/GuestDetailsStep";
import { BookingConfirmationStep } from "./steps/BookingConfirmationStep";
import { useVenueBySlug } from "@/hooks/useVenueBySlug";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type BookingStep = 'service' | 'details' | 'confirmation';

export function BookingFlowManager() {
  const { venueSlug } = useParams<{ venueSlug: string }>();
  const [currentStep, setCurrentStep] = useState<BookingStep>('service');
  const [completedBookingId, setCompletedBookingId] = useState<number | null>(null);

  const { data: venue, isLoading, error } = useVenueBySlug(venueSlug || '');

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Venue Not Found</h1>
          <p className="text-gray-600">The venue you're looking for doesn't exist or isn't available for booking.</p>
        </div>
      </div>
    );
  }

  const handleStepComplete = (bookingId?: number) => {
    if (currentStep === 'service') {
      setCurrentStep('details');
    } else if (currentStep === 'details') {
      if (bookingId) {
        setCompletedBookingId(bookingId);
      }
      setCurrentStep('confirmation');
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'service':
        return <ServiceSelectionStep onNext={handleStepComplete} />;
      case 'details':
        return <GuestDetailsStep onNext={handleStepComplete} />;
      case 'confirmation':
        return <BookingConfirmationStep bookingId={completedBookingId} />;
      default:
        return <ServiceSelectionStep onNext={handleStepComplete} />;
    }
  };

  return (
    <BookingFormProvider venueId={venue.id}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8">
          {renderCurrentStep()}
        </div>
      </div>
    </BookingFormProvider>
  );
}
