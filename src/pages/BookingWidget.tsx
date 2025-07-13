import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { calculatePaymentAmount } from "@/utils/paymentCalculation";
import { PaymentStep } from "@/components/bookings/PaymentStep";
import { TableAllocationService } from "@/services/tableAllocation";
import { guestService } from "@/services/guestService";
import { PartyNumberSelector } from "@/components/bookings/PartyNumberSelector";
import { DateSelectorWithAvailability } from "@/components/bookings/DateSelectorWithAvailability";
import { ServiceSelector } from "@/components/bookings/ServiceSelector";
import { SimplifiedTimeSelector } from "@/components/bookings/SimplifiedTimeSelector";
import { GuestDetailsForm } from "@/components/bookings/GuestDetailsForm";
import { UnifiedAvailabilityService } from "@/services/unifiedAvailabilityService";

const BookingWidget = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [partySize, setPartySize] = useState(2);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentRequired, setPaymentRequired] = useState(null);
  const [createdBookingId, setCreatedBookingId] = useState(null);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [allocationAlternatives, setAllocationAlternatives] = useState([]);
  const [showAlternatives, setShowAlternatives] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get first venue ID for public bookings
  const { data: firstVenue } = useQuery({
    queryKey: ['first-venue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venues')
        .select('id, name')
        .eq('approval_status', 'approved')
        .limit(1)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Check payment requirements when service/party size changes
  useEffect(() => {
    const checkPaymentRequirement = async () => {
      if (selectedService && firstVenue && partySize) {
        try {
          const paymentCalc = await calculatePaymentAmount(
            selectedService.id,
            partySize,
            firstVenue.id
          );
          setPaymentRequired(paymentCalc);
        } catch (error) {
          console.error('Error calculating payment:', error);
          setPaymentRequired(null);
        }
      }
    };

    checkPaymentRequirement();
  }, [selectedService, partySize, firstVenue]);

  // Create booking mutation with pre-booking validation
  const createBookingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDate || !selectedTime || !firstVenue || !selectedService) {
        throw new Error("Missing required booking details.");
      }

      console.log(`🛡️ Pre-booking validation starting...`);
      
      // CRITICAL: Validate availability before creating booking
      const validationResult = await UnifiedAvailabilityService.validateBookingBeforeCreation(
        firstVenue.id,
        format(selectedDate, 'yyyy-MM-dd'),
        selectedTime,
        partySize,
        selectedService.id
      );

      if (!validationResult.valid) {
        console.error(`❌ Pre-booking validation failed: ${validationResult.reason}`);
        
        if (validationResult.alternatives && validationResult.alternatives.length > 0) {
          throw new Error(`No tables available at ${selectedTime}. Try these times instead: ${validationResult.alternatives.join(', ')}`);
        } else {
          throw new Error(`No tables available at ${selectedTime}. Please select a different time or date.`);
        }
      }

      console.log(`✅ Pre-booking validation passed, creating booking...`);

      const bookingData = {
        service: selectedService.title,
        booking_date: format(selectedDate, 'yyyy-MM-dd'),
        booking_time: selectedTime,
        party_size: partySize,
        guest_name: guestName,
        phone: phone,
        email: email,
        notes: notes,
        venue_id: firstVenue.id,
        status: 'confirmed',
        is_unallocated: true,
        table_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

      if (error) throw error;

      // Create guest record if guest details provided
      if (guestName.trim() && (email || phone)) {
        try {
          await guestService.createGuest({
            name: guestName,
            email: email || null,
            phone: phone || null,
            notes: notes || null,
            opt_in_marketing: false
          });
        } catch (guestError) {
          console.log('Guest already exists or creation failed:', guestError);
        }
      }

      // Try to allocate table automatically
      try {
        const allocationResult = await TableAllocationService.allocateBookingToTables(
          data.id,
          data.party_size,
          data.booking_date,
          data.booking_time
        );

        if (!allocationResult.success && allocationResult.alternatives) {
          setAllocationAlternatives(allocationResult.alternatives);
          setShowAlternatives(true);
        }
      } catch (allocationError) {
        console.warn('Table allocation failed:', allocationError);
      }

      return data;
    },
    onSuccess: (booking) => {
      setCreatedBookingId(booking.id);
      setCreatedBooking(booking);
      
      // If payment is required, go to payment step
      if (paymentRequired?.shouldCharge) {
        setCurrentStep(7); // Payment step
      } else {
        // No payment required, go to confirmation
        setCurrentStep(6); // Confirmation step
      }
    },
    onError: (error) => {
      console.error('Booking creation error:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    await createBookingMutation.mutateAsync();
  };

  const handlePaymentSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
    setCurrentStep(6); // Go to confirmation
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment failed",
      description: error,
      variant: "destructive",
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return partySize >= 1;
      case 2:
        return !!selectedDate;
      case 3:
        return !!selectedService;
      case 4:
        return !!selectedTime;
      case 5:
        return guestName.trim() !== '' && phone.trim() !== '' && /^(\+44|0)[0-9\s-()]{9,}$/.test(phone.trim());
      case 6:
        return false; // Confirmation step
      case 7:
        return false; // Payment step handles its own navigation
      default:
        return false;
    }
  };

  const resetForm = () => {
    setPartySize(2);
    setSelectedDate(null);
    setSelectedService(null);
    setSelectedTime(null);
    setGuestName('');
    setPhone('');
    setEmail('');
    setNotes('');
    setPaymentRequired(null);
    setCreatedBookingId(null);
    setCreatedBooking(null);
    setCurrentStep(1);
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <PartyNumberSelector
            selectedPartySize={partySize}
            onPartySizeSelect={setPartySize}
          />
        );

      case 2:
        return (
          <DateSelectorWithAvailability
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            partySize={partySize}
            venueId={firstVenue?.id}
          />
        );

      case 3:
        return (
          <ServiceSelector
            selectedService={selectedService}
            onServiceSelect={setSelectedService}
            partySize={partySize}
            selectedDate={selectedDate}
            venueId={firstVenue?.id}
          />
        );

      case 4:
        return (
          <SimplifiedTimeSelector
            selectedTime={selectedTime}
            onTimeSelect={setSelectedTime}
            selectedDate={selectedDate}
            selectedService={selectedService}
            partySize={partySize}
            venueId={firstVenue?.id}
          />
        );

      case 5:
        return (
          <GuestDetailsForm
            guestName={guestName}
            phone={phone}
            email={email}
            notes={notes}
            onGuestNameChange={setGuestName}
            onPhoneChange={setPhone}
            onEmailChange={setEmail}
            onNotesChange={setNotes}
            paymentRequired={paymentRequired}
          />
        );

      case 6:
        return (
          <Card className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900">
            <CardHeader className="bg-green-50 dark:bg-green-950 border-b border-green-200 dark:border-green-800">
              <CardTitle className="text-2xl text-green-900 dark:text-green-100">
                {showAlternatives ? "Booking Created - Table Assignment Needed" : "Booking Confirmed!"}
              </CardTitle>
              <CardDescription className="text-green-600 dark:text-green-300">
                {showAlternatives 
                  ? "Your booking was created but no tables are available at your requested time. Here are some alternatives:"
                  : "Your booking has been successfully created"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 bg-white dark:bg-gray-900">
              <div className="space-y-6">
                {/* Booking Reference */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-gray-100">Booking Reference</h3>
                  <p className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">
                    {createdBooking?.booking_reference || `BK-${new Date().getFullYear()}-${String(createdBookingId).padStart(6, '0')}`}
                  </p>
                </div>

                {/* Booking Details */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-gray-100">Booking Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Venue:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{firstVenue?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Date:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {selectedDate ? format(selectedDate, 'EEEE, MMMM do, yyyy') : ''}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Time:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Party Size:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{partySize} {partySize === 1 ? 'person' : 'people'}</span>
                    </div>
                    {selectedService && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Service:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{selectedService.title}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={resetForm}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Make Another Booking
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.print()}
                    className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    Print Booking Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 7:
        // Payment step
        return paymentRequired?.shouldCharge && (
          <PaymentStep
            amount={paymentRequired.amount}
            description={paymentRequired.description}
            bookingId={createdBookingId}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />
        );

      default:
        return null;
    }
  };

  const totalSteps = paymentRequired?.shouldCharge ? 7 : 6;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-8">
      <div className="container mx-auto px-4">
        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4 overflow-x-auto">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}>
                  {step}
                </div>
                {step < totalSteps && (
                  <div className={`w-12 h-1 ml-2 ${
                    currentStep > step 
                      ? 'bg-blue-600' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {getStepContent()}

        {/* Navigation Buttons */}
        {currentStep < 6 && (
          <div className="flex justify-between mt-8 max-w-2xl mx-auto">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            >
              Previous
            </Button>
            
            <Button 
              onClick={currentStep === 5 ? handleSubmit : handleNext}
              disabled={!canProceed() || createBookingMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {createBookingMutation.isPending 
                ? 'Creating Booking...' 
                : currentStep === 5 
                  ? 'Create Booking' 
                  : 'Next'
              }
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingWidget;
