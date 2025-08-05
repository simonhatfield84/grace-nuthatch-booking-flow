
import { useBookingContext } from '../contexts/BookingContext';
import { BookingService } from '../services/BookingService';
import { useVenueBySlug } from '@/hooks/useVenueBySlug';

export function useBookingFlow(venueSlug: string) {
  const { state, updateBookingData, setLoading, setError, nextStep, prevStep, goToStep } = useBookingContext();
  const { data: venue, isLoading: venueLoading, error: venueError } = useVenueBySlug(venueSlug);

  const handlePartySelection = (partySize: number) => {
    updateBookingData({ partySize });
    nextStep();
  };

  const handleDateSelection = async (date: Date) => {
    updateBookingData({ date });
    nextStep();
  };

  const handleTimeSelection = (time: string) => {
    updateBookingData({ time });
    nextStep();
  };

  const handleServiceSelection = (service: any) => {
    updateBookingData({ service });
    nextStep();
  };

  const handleGuestDetails = (details: any, bookingId?: number) => {
    updateBookingData({
      guestDetails: details,
      bookingId
    });
    
    // Always go to confirmation step (step 5) after guest details is complete
    goToStep(5);
  };

  return {
    // State
    currentStep: state.currentStepIndex,
    bookingData: state.bookingData,
    isLoading: state.isLoading || venueLoading,
    error: state.error || venueError?.message,
    venue,

    // Actions
    handlePartySelection,
    handleDateSelection,
    handleTimeSelection,
    handleServiceSelection,
    handleGuestDetails,
    goBack: prevStep,
    goToStep,

    // Utilities
    clearCache: BookingService.clearCache,
  };
}
