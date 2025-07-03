
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, MapPin, Phone, Mail, CheckCircle } from "lucide-react";

const BookingWidget = () => {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [selectedService, setSelectedService] = useState(null);
  const [guestDetails, setGuestDetails] = useState({
    name: "",
    email: "",
    phone: "",
    notes: ""
  });
  const [isConfirmed, setIsConfirmed] = useState(false);

  const services = [
    {
      id: 1,
      title: "Dinner Service",
      description: "Evening dining experience with seasonal menu",
      image: "/api/placeholder/300/200",
      minGuests: 1,
      maxGuests: 8,
      duration: "2 hours",
      price: "No deposit required",
      times: ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"]
    },
    {
      id: 2,
      title: "Afternoon Tea",
      description: "Traditional afternoon tea with homemade scones and cakes",
      image: "/api/placeholder/300/200",
      minGuests: 2,
      maxGuests: 6,
      duration: "1.5 hours",
      price: "£25 deposit per guest",
      times: ["14:00", "14:30", "15:00", "15:30", "16:00"]
    }
  ];

  const availableDates = [
    { date: "2024-01-20", day: "Sat", available: true },
    { date: "2024-01-21", day: "Sun", available: true },
    { date: "2024-01-22", day: "Mon", available: false },
    { date: "2024-01-23", day: "Tue", available: true },
    { date: "2024-01-24", day: "Wed", available: true },
    { date: "2024-01-25", day: "Thu", available: true },
    { date: "2024-01-26", day: "Fri", available: true },
  ];

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleDateTimeSelect = () => {
    if (selectedDate && selectedTime) {
      setStep(3);
    }
  };

  const handleGuestDetailsSubmit = () => {
    if (guestDetails.name && guestDetails.email && guestDetails.phone) {
      // Here would be the payment flow if deposit required
      setStep(4);
      setIsConfirmed(true);
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
                <div className="grid gap-4">
                  {services.map((service) => (
                    <div 
                      key={service.id}
                      className="border rounded-lg p-4 cursor-pointer hover:border-green-500 transition-colors"
                      onClick={() => handleServiceSelect(service)}
                    >
                      <div className="flex gap-4">
                        <div className="w-20 h-20 bg-gray-200 rounded-lg bg-cover bg-center"
                             style={{ backgroundImage: `url(${service.image})` }} />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{service.title}</h3>
                          <p className="text-gray-600 text-sm mb-2">{service.description}</p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <Badge variant="outline">
                              <Users className="h-3 w-3 mr-1" strokeWidth={2} />
                              {service.minGuests}-{service.maxGuests} guests
                            </Badge>
                            <Badge variant="outline">
                              <Clock className="h-3 w-3 mr-1" strokeWidth={2} />
                              {service.duration}
                            </Badge>
                            <Badge variant="outline">
                              {service.price}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                      onClick={() => setPartySize(Math.max(selectedService.minGuests, partySize - 1))}
                      disabled={partySize <= selectedService.minGuests}
                    >
                      -
                    </Button>
                    <span className="px-4 py-2 border rounded">{partySize}</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPartySize(Math.min(selectedService.maxGuests, partySize + 1))}
                      disabled={partySize >= selectedService.maxGuests}
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Date Selection */}
                <div>
                  <Label>Select Date</Label>
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
                </div>

                {/* Time Selection */}
                {selectedDate && (
                  <div>
                    <Label>Select Time</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {selectedService.times.map((time) => (
                        <button
                          key={time}
                          className={`p-2 text-center rounded border ${
                            selectedTime === time
                              ? 'bg-green-600 text-white border-green-600'
                              : 'border-gray-300 hover:border-green-500'
                          }`}
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleDateTimeSelect}
                    disabled={!selectedDate || !selectedTime}
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

                {selectedService.price.includes('deposit') && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm">
                      <strong>Deposit Required:</strong> {selectedService.price}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Total deposit: £{25 * partySize}
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
                    {selectedService.price.includes('deposit') ? 'Pay Deposit' : 'Confirm Booking'}
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
                    <span>The Nuthatch Restaurant</span>
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
