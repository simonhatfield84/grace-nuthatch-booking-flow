
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

  const handleGuestDetails = (details: any, paymentRequired: boolean, paymentAmount: number = 0) => {
    updateBookingData({
      guestDetails: details,
      paymentRequired,
      paymentAmount
    });
    
    if (paymentRequired) {
      nextStep(); // Go to payment step
    } else {
      goToStep(6); // Skip to confirmation
    }
  };

  const handlePaymentSuccess = () => {
    nextStep(); // Go to confirmation
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
    handlePaymentSuccess,
    goBack: prevStep,
    goToStep,

    // Utilities
    clearCache: BookingService.clearCache,
  };
}
