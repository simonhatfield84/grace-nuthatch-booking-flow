
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Utensils } from "lucide-react";
import { useBookingSubmission } from "@/features/booking/hooks/useBookingSubmission";
import { useVenueBySlug } from "@/hooks/useVenueBySlug";
import { useParams } from "react-router-dom";
import { format } from "date-fns";

interface GuestDetailsFormProps {
  onSubmit: (details: any) => void;
  bookingData: {
    date: string;
    time: string;
    partySize: number;
    service: string;
  };
}

export const GuestDetailsForm = ({ onSubmit, bookingData }: GuestDetailsFormProps) => {
  const { venueSlug } = useParams<{ venueSlug: string }>();
  const { data: venue } = useVenueBySlug(venueSlug || '');
  const { submitBooking, isSubmitting } = useBookingSubmission();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialRequests: '',
    marketingOptIn: false,
    termsAccepted: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !venue) return;

    const bookingFormData = {
      partySize: bookingData.partySize,
      date: new Date(bookingData.date + 'T00:00:00'),
      time: bookingData.time,
      serviceTitle: bookingData.service,
      guestDetails: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        specialRequests: formData.specialRequests,
        marketingOptIn: formData.marketingOptIn,
        termsAccepted: formData.termsAccepted
      }
    };

    const result = await submitBooking(bookingFormData, venue.id);

    if (result.success) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {format(new Date(bookingData.date), 'EEEE, MMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{bookingData.time}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{bookingData.partySize} guests</span>
            </div>
            <div className="flex items-center space-x-2">
              <Utensils className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{bookingData.service}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guest Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email address"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter your phone number"
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
              <Textarea
                id="specialRequests"
                value={formData.specialRequests}
                onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                placeholder="Any dietary requirements, allergies, or special occasions?"
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="marketingOptIn"
                  checked={formData.marketingOptIn}
                  onChange={(e) => handleInputChange('marketingOptIn', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="marketingOptIn" className="text-sm">
                  I'd like to receive updates and offers via email
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="termsAccepted" className="text-sm">
                  I accept the terms and conditions *
                </Label>
              </div>
              {errors.termsAccepted && (
                <p className="text-sm text-red-500 mt-1">{errors.termsAccepted}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Confirming Booking...' : 'Confirm Booking'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
