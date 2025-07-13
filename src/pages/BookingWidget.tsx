import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, addHours } from "date-fns";
import { SafeHtml } from "@/components/SafeHtml";
import { calculatePaymentAmount } from "@/utils/paymentCalculation";
import { PaymentStep } from "@/components/bookings/PaymentStep";
import { TableAllocationService } from "@/services/tableAllocation";
import { useGuests } from "@/hooks/useGuests";

const BookingWidget = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [partySize, setPartySize] = useState(2);
  const [selectedService, setSelectedService] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentRequired, setPaymentRequired] = useState(null);
  const [createdBookingId, setCreatedBookingId] = useState(null);
  const [createdBooking, setCreatedBooking] = useState(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { createGuestSilent } = useGuests();

  // Get first venue ID for public bookings (this is a temporary solution)
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

  // Fetch services
  const { data: services, isLoading: isServicesLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('title');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch booking windows for the selected service and date
  const { data: bookingWindows = [] } = useQuery({
    queryKey: ['booking-windows', selectedService?.id, selectedDate],
    queryFn: async () => {
      if (!selectedService?.id || !selectedDate) return [];

      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('booking_windows')
        .select('*')
        .eq('service_id', selectedService.id)
        .contains('days', [format(selectedDate, 'EEE').toLowerCase()])
        .lte('start_date', formattedDate)
        .gte('end_date', formattedDate);

      if (error) throw error;
      return data;
    },
  });

  // Calculate available time slots based on booking windows
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);

  useEffect(() => {
    if (bookingWindows && bookingWindows.length > 0) {
      const slots = [];
      bookingWindows.forEach(window => {
        let startTime = window.start_time;
        const endTime = window.end_time;

        while (startTime < endTime) {
          slots.push(startTime);
          const [hours, minutes] = startTime.split(':').map(Number);
          const nextTime = format(addHours(new Date(0, 0, 0, hours, minutes), 1), 'HH:mm');
          startTime = nextTime;
        }
      });
      setAvailableTimeSlots(slots);
    } else {
      setAvailableTimeSlots([]);
    }
  }, [bookingWindows]);

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

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDate || !selectedTime || !firstVenue) {
        throw new Error("Missing required booking details or venue information.");
      }

      const bookingData = {
        service: selectedService?.title || 'General Booking',
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
          await createGuestSilent({
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
        await TableAllocationService.allocateBookingToTables(
          data.id,
          data.party_size,
          data.booking_date,
          data.booking_time
        );
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
        setCurrentStep(6); // Payment step
      } else {
        // No payment required, go to confirmation
        setCurrentStep(5); // Confirmation step
      }
    },
    onError: (error) => {
      console.error('Booking creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
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
    setCurrentStep(5); // Go to confirmation
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
        return !!selectedDate;
      case 2:
        return !!selectedTime;
      case 3:
        return partySize >= 1;
      case 4:
        return guestName.trim() !== '' && phone.trim() !== '';
      case 5:
        return false; // Confirmation step
      case 6:
        return false; // Payment step handles its own navigation
      default:
        return false;
    }
  };

  const resetForm = () => {
    setSelectedDate(null);
    setSelectedTime(null);
    setPartySize(2);
    setSelectedService(null);
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
          <Card className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900">
            <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
              <CardTitle className="text-2xl text-gray-900 dark:text-gray-100">Select Date</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Choose your preferred date
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 bg-white dark:bg-gray-900">
              <div>
                <Label className="text-base font-medium text-gray-900 dark:text-gray-100">Select Date</Label>
                <div className="mt-2">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900">
            <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
              <CardTitle className="text-2xl text-gray-900 dark:text-gray-100">Select Time</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Choose your preferred time
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6 bg-white dark:bg-gray-900">
              {/* Default time slots if no service selected yet */}
              <div>
                <Label className="text-base font-medium text-gray-900 dark:text-gray-100">Available Times</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'].map((slot) => (
                    <Button
                      key={slot}
                      variant={selectedTime === slot ? "default" : "outline"}
                      className={`p-2 text-sm ${
                        selectedTime === slot 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => setSelectedTime(slot)}
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900">
            <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
              <CardTitle className="text-2xl text-gray-900 dark:text-gray-100">Party Size</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                How many people will be joining?
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4 bg-white dark:bg-gray-900">
              <div>
                <Label htmlFor="party-size" className="text-base font-medium text-gray-900 dark:text-gray-100">
                  Number of People
                </Label>
                <Select value={partySize.toString()} onValueChange={(value) => setPartySize(parseInt(value))}>
                  <SelectTrigger className="mt-1 border-gray-300 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800">
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i} value={(i + 1).toString()}>
                        {i + 1} {i + 1 === 1 ? 'person' : 'people'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Optional service selection */}
              <div>
                <Label className="text-base font-medium text-gray-900 dark:text-gray-100">Service (Optional)</Label>
                <div className="grid gap-2 mt-2">
                  {services?.filter(service => service.active && service.online_bookable).map((service) => (
                    <Card 
                      key={service.id} 
                      className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                        selectedService?.id === service.id 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-400' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => setSelectedService(service)}
                    >
                      <CardContent className="p-3">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{service.title}</h4>
                        {service.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{service.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900">
            <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
              <CardTitle className="text-2xl text-gray-900 dark:text-gray-100">Guest Details</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Please provide your contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4 bg-white dark:bg-gray-900">
              <div>
                <Label htmlFor="guest-name" className="text-base font-medium text-gray-900 dark:text-gray-100">
                  Name *
                </Label>
                <Input
                  id="guest-name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="mt-1 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Your name"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-base font-medium text-gray-900 dark:text-gray-100">
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Your phone number"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-base font-medium text-gray-900 dark:text-gray-100">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <Label htmlFor="notes" className="text-base font-medium text-gray-900 dark:text-gray-100">
                  Special Requirements
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Any dietary requirements, accessibility needs, or special requests..."
                  rows={3}
                />
              </div>

              {/* Payment Information */}
              {paymentRequired?.shouldCharge && (
                <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                  <h3 className="font-semibold text-lg mb-2 text-amber-900 dark:text-amber-100">Payment Required</h3>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    {paymentRequired.description} - £{paymentRequired.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    You will be redirected to complete payment after creating your booking.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 5:
        // Confirmation page
        return (
          <Card className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900">
            <CardHeader className="bg-green-50 dark:bg-green-950 border-b border-green-200 dark:border-green-800">
              <CardTitle className="text-2xl text-green-900 dark:text-green-100">Booking Confirmed!</CardTitle>
              <CardDescription className="text-green-600 dark:text-green-300">
                Your booking has been successfully created
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

                {/* Guest Details */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-gray-100">Guest Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Name:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{guestName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{phone}</span>
                    </div>
                    {email && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Email:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{email}</span>
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

      case 6:
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

  const totalSteps = paymentRequired?.shouldCharge ? 6 : 5;

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
        {currentStep < 5 && (
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
              onClick={currentStep === 4 ? handleSubmit : handleNext}
              disabled={!canProceed() || createBookingMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {createBookingMutation.isPending 
                ? 'Creating Booking...' 
                : currentStep === 4 
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
