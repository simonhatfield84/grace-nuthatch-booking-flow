
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { User, Phone, Mail, MessageSquare } from 'lucide-react';

interface GuestDetailsFormProps {
  guestName: string;
  phone: string;
  email: string;
  notes: string;
  onGuestNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  paymentRequired?: any;
}

export const GuestDetailsForm = ({
  guestName,
  phone,
  email,
  notes,
  onGuestNameChange,
  onPhoneChange,
  onEmailChange,
  onNotesChange,
  paymentRequired
}: GuestDetailsFormProps) => {
  // Phone validation
  const validatePhone = (phoneNumber: string) => {
    // Remove all non-digits for validation
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    // UK mobile: starts with 07, 11 digits total
    // UK landline: various formats, 10-11 digits
    // International: + followed by country code and number
    const ukMobileRegex = /^07\d{9}$/;
    const ukLandlineRegex = /^0[1-9]\d{8,9}$/;
    const internationalRegex = /^\+[1-9]\d{7,14}$/;
    
    if (phoneNumber.startsWith('+')) {
      return internationalRegex.test(phoneNumber);
    } else {
      return ukMobileRegex.test(digitsOnly) || ukLandlineRegex.test(digitsOnly);
    }
  };

  const isPhoneValid = phone.trim() === '' || validatePhone(phone);
  const isFormValid = guestName.trim() !== '' && phone.trim() !== '' && isPhoneValid;

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900">
      <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
        <CardTitle className="text-2xl text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <User className="h-6 w-6" />
          Your details
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          Please provide your contact information for the reservation
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4 bg-white dark:bg-gray-900">
        <div>
          <Label htmlFor="guest-name" className="text-base font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <User className="h-4 w-4" />
            Full Name *
          </Label>
          <Input
            id="guest-name"
            value={guestName}
            onChange={(e) => onGuestNameChange(e.target.value)}
            className="mt-1 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="Enter your full name"
            required
          />
        </div>

        <div>
          <Label htmlFor="phone" className="text-base font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Phone Number *
          </Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            className={`mt-1 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
              !isPhoneValid ? 'border-red-500 focus:border-red-500' : ''
            }`}
            placeholder="07123 456789 or +44 7123 456789"
            required
          />
          {!isPhoneValid && phone.trim() !== '' && (
            <p className="text-red-500 text-xs mt-1">
              Please enter a valid UK phone number (07123 456789) or international number (+44 7123 456789)
            </p>
          )}
          <p className="text-gray-500 text-xs mt-1">
            We'll use this to confirm your reservation and contact you if needed
          </p>
        </div>

        <div>
          <Label htmlFor="email" className="text-base font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Address (Optional)
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className="mt-1 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="your.email@example.com"
          />
          <p className="text-gray-500 text-xs mt-1">
            Optional - for booking confirmations and updates
          </p>
        </div>

        <div>
          <Label htmlFor="notes" className="text-base font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Special Requirements (Optional)
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
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

        {/* Form validation summary */}
        {!isFormValid && (guestName.trim() !== '' || phone.trim() !== '') && (
          <div className="bg-red-50 dark:bg-red-950 rounded-lg p-3 border border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-200 text-sm">
              Please ensure all required fields are completed correctly:
            </p>
            <ul className="text-red-700 dark:text-red-300 text-xs mt-1 ml-4 list-disc">
              {guestName.trim() === '' && <li>Full name is required</li>}
              {phone.trim() === '' && <li>Phone number is required</li>}
              {!isPhoneValid && phone.trim() !== '' && <li>Phone number format is invalid</li>}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
