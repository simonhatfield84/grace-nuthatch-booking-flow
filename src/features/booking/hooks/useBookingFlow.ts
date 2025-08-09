
import { useBookingContext } from '../contexts/BookingContext';
import { BookingService } from '../services/BookingService';
import { useVenueBySlug } from '@/hooks/useVenueBySlug';

export function useBookingFlow(venueSlug: string) {
  const { state, updateBookingData, setLoading, setError, nextStep, prevStep, goToStep } = useBookingContext();
  const { data: venue, isLoading: venueLoading, error: venueError } = useVenueBySlug(venueSlug);

  const handlePartySelection = (partySize: number) => {
    updateBookingData({ partySize });
    // Don't auto-advance, PartyDateStep handles both party size and date
  };

  const handleDateSelection = async (date: Date) => {
    updateBookingData({ date });
    // Move to time selection (step 1) after both party and date are selected
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

  const handleGuestDetails = (details: any, paymentRequired: boolean, paymentAmount: number = 0, bookingId?: number) => {
    updateBookingData({
      guestDetails: details,
      paymentRequired,
      paymentAmount,
      bookingId
    });
    
    // Always go to confirmation step (step 4) after guest details/payment is complete
    goToStep(4);
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
