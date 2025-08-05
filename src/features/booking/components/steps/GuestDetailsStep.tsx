
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useBookingSubmission } from "../../hooks/useBookingSubmission";

interface GuestDetailsStepProps {
  onNext?: (details: any, bookingId?: number) => void;
  onChange?: (details: any, bookingId?: number) => void;
  value?: {
    name: string;
    email: string;
    phone: string;
    notes?: string;
    marketingOptIn: boolean;
    termsAccepted: boolean;
  };
  service?: any;
  venue?: any;
  partySize?: number;
  date?: Date;
  time?: string;
}

export function GuestDetailsStep({ 
  onNext,
  onChange,
  value,
  service,
  venue,
  partySize,
  date,
  time
}: GuestDetailsStepProps) {
  const { submitBooking, isSubmitting } = useBookingSubmission();
  
  const [guestDetails, setGuestDetails] = useState({
    name: value?.name || '',
    email: value?.email || '',
    phone: value?.phone || '',
    notes: value?.notes || '',
    marketingOptIn: value?.marketingOptIn || false,
    termsAccepted: value?.termsAccepted || false,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    const newDetails = { ...guestDetails, [field]: value };
    setGuestDetails(newDetails);
    
    if (onChange) {
      onChange(newDetails);
    }
  };

  const handleSubmit = async () => {
    if (!date || !time || !partySize) {
      return;
    }

    const bookingData = {
      partySize,
      date,
      time,
      serviceTitle: service?.title || 'General Dining',
      guestDetails: {
        name: guestDetails.name,
        email: guestDetails.email,
        phone: guestDetails.phone,
        notes: guestDetails.notes,
        marketingOptIn: guestDetails.marketingOptIn,
        termsAccepted: guestDetails.termsAccepted
      },
    };

    const result = await submitBooking(bookingData, venue?.id || 'venue-id');
    
    if (result.success && result.bookingId) {
      if (onNext) {
        onNext(guestDetails, result.bookingId);
      }
      if (onChange) {
        onChange(guestDetails, result.bookingId);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Guest Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={guestDetails.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={guestDetails.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={guestDetails.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Special Requests</Label>
            <Textarea
              id="notes"
              placeholder="Any dietary requirements, special occasions, or other requests..."
              value={guestDetails.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="marketing"
                checked={guestDetails.marketingOptIn}
                onCheckedChange={(checked) => handleInputChange('marketingOptIn', checked as boolean)}
              />
              <Label htmlFor="marketing" className="text-sm">
                I'd like to receive updates and offers via email
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={guestDetails.termsAccepted}
                onCheckedChange={(checked) => handleInputChange('termsAccepted', checked as boolean)}
              />
              <Label htmlFor="terms" className="text-sm">
                I accept the terms and conditions *
              </Label>
            </div>
          </div>

          <Button 
            onClick={handleSubmit}
            className="w-full"
            disabled={isSubmitting || !guestDetails.name || !guestDetails.email || !guestDetails.termsAccepted}
          >
            {isSubmitting ? 'Creating Booking...' : 'Confirm Booking'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
