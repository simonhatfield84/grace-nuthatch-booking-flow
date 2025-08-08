
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';
import { WifiGuestData } from './WifiPortalFlow';

interface GuestDetailsStepProps {
  venue: any;
  deviceFingerprint: string;
  guestData: WifiGuestData;
  onGuestDataUpdate: (data: Partial<WifiGuestData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const GuestDetailsStep: React.FC<GuestDetailsStepProps> = ({
  venue,
  deviceFingerprint,
  guestData,
  onGuestDataUpdate,
  onNext,
  onBack
}) => {
  const [isValid, setIsValid] = useState(false);

  const validateForm = () => {
    const valid = guestData.name.trim().length > 0 && guestData.email.trim().length > 0;
    setIsValid(valid);
    return valid;
  };

  React.useEffect(() => {
    validateForm();
  }, [guestData.name, guestData.email]);

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Nuthatch Header */}
      <div className="bg-black text-white">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-white hover:bg-gray-800 p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="text-center flex-1">
              <img 
                src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" 
                alt="The Nuthatch" 
                className="h-10 w-auto mx-auto mb-1" 
              />
              <h1 className="text-lg font-semibold">The Nuthatch</h1>
            </div>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-md mx-auto px-6 py-3">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-8 h-1 bg-black rounded"></div>
            <div className="w-8 h-1 bg-black rounded"></div>
            <div className="w-8 h-1 bg-gray-300 rounded"></div>
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">Step 2 of 3</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold text-gray-900">
              Your Details
            </CardTitle>
            <p className="text-gray-600 text-sm">
              We need a few details to get you connected
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={guestData.name}
                  onChange={(e) => onGuestDataUpdate({ name: e.target.value })}
                  placeholder="Enter your name"
                  className="w-full"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={guestData.email}
                  onChange={(e) => onGuestDataUpdate({ email: e.target.value })}
                  placeholder="Enter your email"
                  className="w-full"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={guestData.phone}
                  onChange={(e) => onGuestDataUpdate({ phone: e.target.value })}
                  placeholder="Enter your phone number"
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="marketing"
                checked={guestData.opt_in_marketing}
                onCheckedChange={(checked) => onGuestDataUpdate({ opt_in_marketing: !!checked })}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="marketing"
                  className="text-sm font-normal cursor-pointer"
                >
                  I'd like to receive updates and offers from The Nuthatch
                </Label>
                <p className="text-xs text-gray-500">
                  Optional - you can unsubscribe at any time
                </p>
              </div>
            </div>

            <Button 
              onClick={handleNext}
              disabled={!isValid}
              className="w-full bg-black hover:bg-gray-800 text-white py-6 text-lg font-medium disabled:bg-gray-300"
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-md mx-auto px-6">
          <p className="text-center text-xs text-gray-500">
            Your information is secure and will not be shared with third parties
          </p>
        </div>
      </div>
    </div>
  );
};
