import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { HoldBannerUI } from '../ui/HoldBannerUI';

interface GuestDetails {
  name: string;
  phone: string;
  email: string;
  notes: string;
  marketingOptIn: boolean;
  termsAccepted: boolean;
}

interface GuestDetailsStepUIProps {
  onSubmit: (details: GuestDetails, requiresPayment: boolean) => void;
  requiresDeposit?: boolean;
}

export function GuestDetailsStepUI({ 
  onSubmit, 
  requiresDeposit = false 
}: GuestDetailsStepUIProps) {
  const [details, setDetails] = useState<GuestDetails>({
    name: '',
    phone: '',
    email: '',
    notes: '',
    marketingOptIn: false,
    termsAccepted: false,
  });

  const [showTerms, setShowTerms] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof GuestDetails, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof GuestDetails, string>> = {};

    if (!details.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!details.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!details.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }

    if (!details.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // TODO wire to BookingAPI later
      onSubmit(details, requiresDeposit);
    }
  };

  const updateField = <K extends keyof GuestDetails>(
    field: K,
    value: GuestDetails[K]
  ) => {
    setDetails(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="space-y-6">
      <HoldBannerUI />

      <Card>
        <CardHeader>
          <CardTitle className="font-nuthatch-heading text-nuthatch-dark">
            Guest Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={details.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Your full name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              type="tel"
              value={details.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="Your phone number"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={details.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="your@email.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Special Requests</Label>
            <Textarea
              id="notes"
              value={details.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Any dietary requirements or special requests?"
              rows={3}
            />
          </div>

          <div className="flex items-start space-x-2 pt-2">
            <Checkbox
              id="marketing"
              checked={details.marketingOptIn}
              onCheckedChange={(checked) => 
                updateField('marketingOptIn', checked === true)
              }
            />
            <label
              htmlFor="marketing"
              className="text-sm text-nuthatch-muted font-nuthatch-body leading-tight cursor-pointer"
            >
              Keep me in the loop with news and offers. We'll only send you the good stuff.
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={details.termsAccepted}
                onCheckedChange={(checked) => 
                  updateField('termsAccepted', checked === true)
                }
                className={errors.termsAccepted ? 'border-red-500' : ''}
              />
              <label
                htmlFor="terms"
                className="text-sm text-nuthatch-muted font-nuthatch-body leading-tight cursor-pointer"
              >
                I accept the{' '}
                <button
                  type="button"
                  onClick={() => setShowTerms(!showTerms)}
                  className="text-nuthatch-green underline hover:text-nuthatch-dark"
                >
                  terms and conditions
                </button>{' '}
                *
              </label>
            </div>
            {errors.termsAccepted && (
              <p className="text-sm text-red-500 ml-6">{errors.termsAccepted}</p>
            )}
          </div>

          {showTerms && (
            <Card className="bg-gray-50">
              <CardContent className="p-4 text-sm text-nuthatch-muted space-y-2">
                <p className="font-medium text-nuthatch-dark">Terms & Conditions</p>
                <p>By making a reservation, you agree to:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Arrive within 15 minutes of your reservation time</li>
                  <li>Return your table within 2 hours</li>
                  <li>Provide 24 hours notice for cancellations</li>
                  <li>Pay any applicable deposit or no-show fees</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {requiresDeposit && (
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            This booking requires a deposit. You will be taken to payment after submitting your details.
          </AlertDescription>
        </Alert>
      )}

      <Button 
        onClick={handleSubmit}
        className="w-full bg-black hover:bg-gray-800 text-white"
        size="lg"
      >
        {requiresDeposit ? 'Continue to Payment' : 'Complete Booking'}
      </Button>
    </div>
  );
}
