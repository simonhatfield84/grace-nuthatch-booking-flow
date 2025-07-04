import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, MapPin, CheckCircle, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isDateInAllowedDays, getDayOfWeek } from "@/utils/dayUtils";
import { format, addDays, startOfDay } from "date-fns";
import { useTables } from "@/hooks/useTables";
import { useBookings } from "@/hooks/useBookings";
import { useTableAvailability } from "@/hooks/useTableAvailability";

const BookingWidget = () => {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [guestDetails, setGuestDetails] = useState({
    name: "",
    email: "",
    phone: "",
    notes: ""
  });
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Fetch services from database
  const { data: services = [], isLoading: isServicesLoading } = useQuery({
    queryKey: ['widget-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('active', true)
        .eq('online_bookable', true)
        .order('created_at');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch booking windows for the selected service
  const { data: bookingWindows = [] } = useQuery({
    queryKey: ['service-booking-windows', selectedService?.id],
    queryFn: async () => {
      if (!selectedService?.id) return [];
      
      const { data, error } = await supabase
        .from('booking_windows')
        .select('*')
        .eq('service_id', selectedService.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedService?.id
  });

  // Fetch tables and bookings for availability checking
  const { tables } = useTables();
  const { bookings } = useBookings(selectedDate);
  const { checkTableAvailability, findAvailableTimeSlots } = useTableAvailability(tables, bookings);

  // Get service duration for the party size
  const getServiceDuration = () => {
    if (!selectedService?.duration_rules) return 120; // default 2 hours
    
    const durationRules = selectedService.duration_rules;
    const rule = durationRules.find((rule: any) => 
      partySize >= rule.minGuests && partySize <= rule.maxGuests
    );
    
    return rule ? rule.durationMinutes : 120;
  };

  // Generate available dates based on booking windows
  const getAvailableDates = () => {
    if (!bookingWindows.length) return [];
    
    const dates = [];
    const today = startOfDay(new Date());
    
    // Generate next 14 days
    for (let i = 0; i < 14; i++) {
      const date = addDays(today, i);
      const dayName = getDayOfWeek(date);
      
      // Check if this day is available in any booking window
      const isAvailable = bookingWindows.some(window => {
        // Check if day is in allowed days
        const dayMatch = window.days.some((allowedDay: string) => 
          allowedDay === dayName || 
          (allowedDay.length === 3 && allowedDay === dayName.substring(0, 3))
        );
        
        if (!dayMatch) return false;
        
        // Check date range if specified
        if (window.start_date) {
          const startDate = new Date(window.start_date);
          if (date < startDate) return false;
        }
        
        if (window.end_date) {
          const endDate = new Date(window.end_date);
          if (date > endDate) return false;
        }
        
        // Check blackout periods
        if (window.blackout_periods && Array.isArray(window.blackout_periods)) {
          const isBlackedOut = window.blackout_periods.some((blackout: any) => {
            const blackoutStart = new Date(blackout.startDate);
            const blackoutEnd = new Date(blackout.endDate);
            return date >= blackoutStart && date <= blackoutEnd;
          });
          if (isBlackedOut) return false;
        }
        
        return true;
      });
      
      dates.push({
        date: format(date, 'yyyy-MM-dd'),
        day: format(date, 'EEE'),
        available: isAvailable,
        dayName
      });
    }
    
    return dates;
  };

  // Generate time slots with table availability
  const getAvailableTimeSlots = () => {
    if (!selectedDate || !bookingWindows.length) return [];
    
    const selectedDateObj = new Date(selectedDate);
    const dayName = getDayOfWeek(selectedDateObj);
    
    // Find booking windows that apply to this day
    const applicableWindows = bookingWindows.filter(window => 
      window.days.some((allowedDay: string) => 
        allowedDay === dayName || 
        (allowedDay.length === 3 && allowedDay === dayName.substring(0, 3))
      )
    );
    
    if (!applicableWindows.length) return [];
    
    const serviceDuration = getServiceDuration();
    const availableSlots: Array<{time: string, hasTable: boolean}> = [];
    
    applicableWindows.forEach(window => {
      const timeSlots = findAvailableTimeSlots(
        selectedDate,
        partySize,
        window.start_time,
        window.end_time,
        serviceDuration
      );
      
      // Also generate all possible slots to show unavailable ones
      const [startHour, startMin] = window.start_time.split(':').map(Number);
      const [endHour, endMin] = window.end_time.split(':').map(Number);
      
      let currentHour = startHour;
      let currentMin = startMin;
      
      while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        const timeSlot = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
        
        if (!availableSlots.find(slot => slot.time === timeSlot)) {
          availableSlots.push({
            time: timeSlot,
            hasTable: timeSlots.includes(timeSlot)
          });
        }
        
        currentMin += 15;
        if (currentMin >= 60) {
          currentMin = 0;
          currentHour++;
        }
      }
    });
    
    return availableSlots.sort((a, b) => a.time.localeCompare(b.time));
  };

  const availableDates = getAvailableDates();
  const availableTimeSlots = getAvailableTimeSlots();

  // Check if selected time has table availability
  const selectedTimeAvailability = selectedTime && selectedDate ? 
    checkTableAvailability({
      date: selectedDate,
      time: selectedTime,
      partySize,
      durationMinutes: getServiceDuration()
    }) : null;

  const handleServiceSelect = (service: any) => {
    setSelectedService(service);
    setPartySize(Math.max(service.min_guests, Math.min(service.max_guests, partySize)));
    setStep(2);
  };

  const handleDateTimeSelect = () => {
    if (selectedDate && selectedTime && selectedTimeAvailability?.available) {
      setStep(3);
    }
  };

  const handleGuestDetailsSubmit = async () => {
    if (guestDetails.name && guestDetails.email && guestDetails.phone && selectedTimeAvailability?.bestTable) {
      // Create the booking
      try {
        const { data, error } = await supabase
          .from('bookings')
          .insert([{
            table_id: selectedTimeAvailability.bestTable.id,
            guest_name: guestDetails.name,
            party_size: partySize,
            booking_date: selectedDate,
            booking_time: selectedTime,
            phone: guestDetails.phone,
            email: guestDetails.email,
            notes: guestDetails.notes,
            service: selectedService.title,
            status: 'confirmed'
          }])
          .select()
          .single();

        if (error) throw error;

        setStep(4);
        setIsConfirmed(true);
      } catch (error) {
        console.error('Error creating booking:', error);
        // Handle error - could show toast notification
      }
    }
  };

  const resetBooking = () => {
    setStep(1);
    setSelectedDate("");
    setSelectedTime("");
    setPartySize(2);
    setSelectedService(null);
    setGuestDetails({ name: "", email: "", phone: "", notes: "" });
    setIsConfirmed(false);
  };

  if (isServicesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-green-800 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">N</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">The Nuthatch</h1>
          </div>
          <p className="text-gray-600">Book your table with us</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div className={`w-8 h-0.5 ${
                    step > stepNumber ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Service Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Choose Your Experience</CardTitle>
                <CardDescription>Select the service you'd like to book</CardDescription>
              </CardHeader>
              <CardContent>
                {services.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No services available for online booking
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {services.map((service) => (
                      <div 
                        key={service.id}
                        className="border rounded-lg p-4 cursor-pointer hover:border-green-500 transition-colors"
                        onClick={() => handleServiceSelect(service)}
                      >
                        <div className="flex gap-4">
                          <div className="w-20 h-20 bg-gray-200 rounded-lg bg-cover bg-center"
                               style={{ backgroundImage: service.image_url ? `url(${service.image_url})` : 'none' }} />
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{service.title}</h3>
                            <p className="text-gray-600 text-sm mb-2">{service.description}</p>
                            <div className="flex flex-wrap gap-2 text-xs">
                              <Badge variant="outline">
                                <Users className="h-3 w-3 mr-1" strokeWidth={2} />
                                {service.min_guests}-{service.max_guests} guests
                              </Badge>
                              <Badge variant="outline">
                                <Clock className="h-3 w-3 mr-1" strokeWidth={2} />
                                {service.lead_time_hours}h lead time
                              </Badge>
                              <Badge variant="outline">
                                {service.requires_deposit 
                                  ? `£${service.deposit_per_guest} deposit per guest`
                                  : 'No deposit required'
                                }
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Date & Time Selection */}
        {step === 2 && selectedService && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Date & Time</CardTitle>
                <CardDescription>
                  {selectedService.title} • {partySize} guests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Party Size */}
                <div>
                  <Label htmlFor="party-size">Party Size</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPartySize(Math.max(selectedService.min_guests, partySize - 1))}
                      disabled={partySize <= selectedService.min_guests}
                    >
                      -
                    </Button>
                    <span className="px-4 py-2 border rounded">{partySize}</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPartySize(Math.min(selectedService.max_guests, partySize + 1))}
                      disabled={partySize >= selectedService.max_guests}
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Date Selection */}
                <div>
                  <Label>Select Date</Label>
                  {availableDates.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No available dates. Please check booking windows configuration.
                    </div>
                  ) : (
                    <div className="grid grid-cols-7 gap-2 mt-2">
                      {availableDates.map((dateOption) => (
                        <button
                          key={dateOption.date}
                          className={`p-3 text-center rounded border ${
                            selectedDate === dateOption.date
                              ? 'bg-green-600 text-white border-green-600'
                              : dateOption.available
                              ? 'border-gray-300 hover:border-green-500'
                              : 'border-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                          onClick={() => dateOption.available && setSelectedDate(dateOption.date)}
                          disabled={!dateOption.available}
                        >
                          <div className="text-xs">{dateOption.day}</div>
                          <div className="text-sm font-medium">
                            {new Date(dateOption.date).getDate()}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Time Selection */}
                {selectedDate && (
                  <div>
                    <Label>Select Time</Label>
                    {availableTimeSlots.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        No available time slots for selected date
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {availableTimeSlots.map((slot) => (
                          <button
                            key={slot.time}
                            className={`p-2 text-center rounded border text-sm ${
                              selectedTime === slot.time
                                ? slot.hasTable 
                                  ? 'bg-green-600 text-white border-green-600'
                                  : 'bg-red-600 text-white border-red-600'
                                : slot.hasTable
                                ? 'border-gray-300 hover:border-green-500'
                                : 'border-red-200 text-red-600 cursor-not-allowed bg-red-50'
                            }`}
                            onClick={() => slot.hasTable && setSelectedTime(slot.time)}
                            disabled={!slot.hasTable}
                            title={!slot.hasTable ? 'No tables available at this time' : ''}
                          >
                            {slot.time}
                            {!slot.hasTable && (
                              <div className="text-xs mt-1">No tables</div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Table availability info */}
                {selectedTime && selectedTimeAvailability && (
                  <div className={`p-3 rounded-lg ${
                    selectedTimeAvailability.available 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {selectedTimeAvailability.available ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-green-800 text-sm font-medium">
                            Table available! ({selectedTimeAvailability.bestTable?.label})
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="text-red-800 text-sm font-medium">
                            {selectedTimeAvailability.reason}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleDateTimeSelect}
                    disabled={!selectedDate || !selectedTime || !selectedTimeAvailability?.available}
                    className="flex-1"
                  >
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Guest Details */}
        {step === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Details</CardTitle>
                <CardDescription>
                  {selectedService.title} • {new Date(selectedDate).toLocaleDateString()} at {selectedTime} • {partySize} guests
                  {selectedTimeAvailability?.bestTable && (
                    <span className="block text-green-600 font-medium mt-1">
                      Table {selectedTimeAvailability.bestTable.label} reserved
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={guestDetails.name}
                      onChange={(e) => setGuestDetails({...guestDetails, name: e.target.value})}
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={guestDetails.email}
                      onChange={(e) => setGuestDetails({...guestDetails, email: e.target.value})}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={guestDetails.phone}
                    onChange={(e) => setGuestDetails({...guestDetails, phone: e.target.value})}
                    placeholder="+44 7700 900123"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Special Requirements</Label>
                  <Textarea
                    id="notes"
                    value={guestDetails.notes}
                    onChange={(e) => setGuestDetails({...guestDetails, notes: e.target.value})}
                    placeholder="Dietary requirements, allergies, special occasions..."
                    rows={3}
                  />
                </div>

                {selectedService.requires_deposit && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm">
                      <strong>Deposit Required:</strong> £{selectedService.deposit_per_guest} per guest
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Total deposit: £{selectedService.deposit_per_guest * partySize}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleGuestDetailsSubmit}
                    disabled={!guestDetails.name || !guestDetails.email || !guestDetails.phone}
                    className="flex-1"
                  >
                    {selectedService.requires_deposit ? 'Pay Deposit' : 'Confirm Booking'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && isConfirmed && (
          <div className="space-y-6">
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" strokeWidth={2} />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h2>
                <p className="text-gray-600 mb-6">
                  We've sent a confirmation email to {guestDetails.email}
                </p>

                <div className="bg-gray-50 p-6 rounded-lg text-left space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" strokeWidth={2} />
                    <span>{selectedService.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" strokeWidth={2} />
                    <span>{new Date(selectedDate).toLocaleDateString()} at {selectedTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" strokeWidth={2} />
                    <span>{partySize} guests</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" strokeWidth={2} />
                    <span>Table {selectedTimeAvailability?.bestTable?.label} - The Nuthatch Restaurant</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-6">
                  <Button variant="outline" onClick={resetBooking}>
                    Make Another Booking
                  </Button>
                  <Button className="flex-1">
                    Add to Calendar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingWidget;
