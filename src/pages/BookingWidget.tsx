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

const BookingWidget = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [partySize, setPartySize] = useState(1);
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get first venue ID for public bookings (this is a temporary solution)
  const { data: firstVenue } = useQuery({
    queryKey: ['first-venue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venues')
        .select('id')
        .eq('approval_status', 'approved')
        .limit(1)
        .single();
      
      if (error) throw error;
      return data?.id;
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

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedService || !selectedDate || !selectedTime || !firstVenue) {
        throw new Error("Missing required booking details or venue information.");
      }

      const bookingData = {
        service: selectedService.title,
        booking_date: format(selectedDate, 'yyyy-MM-dd'),
        booking_time: selectedTime,
        party_size: partySize,
        guest_name: guestName,
        phone: phone,
        email: email,
        notes: notes,
        venue_id: firstVenue,
        status: 'confirmed',
        is_unallocated: true,
        table_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: "Booking confirmed",
        description: "Your booking has been successfully created.",
      });
      resetForm();
      setCurrentStep(1); // Reset to the first step
    },
    onError: (error) => {
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

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!selectedService;
      case 2:
        return !!selectedDate && !!selectedTime;
      case 3:
        return guestName.trim() !== '' && phone.trim() !== '';
      case 4:
        return true;
      default:
        return false;
    }
  };

  const resetForm = () => {
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setPartySize(1);
    setGuestName('');
    setPhone('');
    setEmail('');
    setNotes('');
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900">
            <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
              <CardTitle className="text-2xl text-gray-900 dark:text-gray-100">Select Service</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Choose the type of service you'd like to book
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 bg-white dark:bg-gray-900">
              <div className="grid gap-4">
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
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                            {service.title}
                          </h3>
                          {service.description && (
                            <p className="text-gray-600 dark:text-gray-300 mt-1">
                              {service.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Badge variant="outline" className="text-gray-700 dark:text-gray-300">
                              {service.min_guests}-{service.max_guests} guests
                            </Badge>
                            {service.requires_deposit && (
                              <Badge variant="outline" className="text-green-700 dark:text-green-300 border-green-300">
                                £{service.deposit_per_guest}/person deposit
                              </Badge>
                            )}
                          </div>
                        </div>
                        {service.image_url && (
                          <img 
                            src={service.image_url} 
                            alt={service.title}
                            className="w-20 h-20 object-cover rounded-lg ml-4"
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900">
            <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
              <CardTitle className="text-2xl text-gray-900 dark:text-gray-100">Select Date & Time</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Choose your preferred date and time
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6 bg-white dark:bg-gray-900">
              {/* Date Selection */}
              <div>
                <Label className="text-base font-medium text-gray-900 dark:text-gray-100">Select Date</Label>
                <div className="mt-2">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date() || date < addDays(new Date(), selectedService?.lead_time_hours ? Math.ceil(selectedService.lead_time_hours / 24) : 0)}
                    className="rounded-md border border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>

              {/* Time Selection */}
              {availableTimeSlots.length > 0 && (
                <div>
                  <Label className="text-base font-medium text-gray-900 dark:text-gray-100">Available Times</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {availableTimeSlots.map((slot) => (
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
              )}
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900">
            <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
              <CardTitle className="text-2xl text-gray-900 dark:text-gray-100">Party Details</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Tell us about your group
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4 bg-white dark:bg-gray-900">
              <div>
                <Label htmlFor="party-size" className="text-base font-medium text-gray-900 dark:text-gray-100">
                  Party Size
                </Label>
                <Select value={partySize.toString()} onValueChange={(value) => setPartySize(parseInt(value))}>
                  <SelectTrigger className="mt-1 border-gray-300 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800">
                    {Array.from({ length: (selectedService?.max_guests || 8) - (selectedService?.min_guests || 1) + 1 }, (_, i) => (
                      <SelectItem key={i} value={(i + (selectedService?.min_guests || 1)).toString()}>
                        {i + (selectedService?.min_guests || 1)} {i + (selectedService?.min_guests || 1) === 1 ? 'person' : 'people'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900">
            <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
              <CardTitle className="text-2xl text-gray-900 dark:text-gray-100">Booking Summary</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Please review your booking details
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 bg-white dark:bg-gray-900">
              <div className="space-y-6">
                {/* Booking Details */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-gray-100">Booking Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Service:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{selectedService?.title}</span>
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
                    {notes && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Special Requirements:</span>
                        <p className="mt-1 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 p-2 rounded border">
                          {notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Deposit Information */}
                {selectedService?.requires_deposit && (
                  <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <h3 className="font-semibold text-lg mb-2 text-blue-900 dark:text-blue-100">Deposit Required</h3>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      A deposit of £{selectedService.deposit_per_guest} per person (£{selectedService.deposit_per_guest * partySize} total) 
                      will be required to confirm this booking.
                    </p>
                  </div>
                )}

                {/* Terms & Conditions */}
                {selectedService?.terms_and_conditions && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">Terms & Conditions</h3>
                    <div className="text-sm text-gray-700 dark:text-gray-300 prose prose-sm max-w-none">
                      <SafeHtml 
                        html={selectedService.terms_and_conditions}
                        allowedTags={['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-8">
      <div className="container mx-auto px-4">
        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}>
                  {step}
                </div>
                {step < 4 && (
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
            disabled={!canProceed()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {currentStep === 4 ? 'Confirm Booking' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingWidget;
