
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Loader2, FileText } from 'lucide-react';
import type { GuestFormData } from './WifiPortalFlow';

interface Venue {
  id: string;
  name: string;
}

interface TermsStepProps {
  venue: Venue;
  guestData: Partial<GuestFormData>;
  onAccept: (data: { terms_accepted: boolean }) => void;
  onBack: () => void;
  isLoading: boolean;
}

export function TermsStep({ venue, guestData, onAccept, onBack, isLoading }: TermsStepProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleAccept = () => {
    if (termsAccepted) {
      onAccept({ terms_accepted: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Terms & Conditions</CardTitle>
          <p className="text-sm text-muted-foreground">
            Please review and accept our WiFi usage terms
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Your Details:</h4>
            <div className="bg-secondary/50 p-3 rounded-lg space-y-1 text-sm">
              <p><span className="font-medium">Name:</span> {guestData.name}</p>
              <p><span className="font-medium">Email:</span> {guestData.email}</p>
              {guestData.phone && (
                <p><span className="font-medium">Phone:</span> {guestData.phone}</p>
              )}
              <p><span className="font-medium">Marketing:</span> {guestData.marketing_consent ? 'Yes' : 'No'}</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2">WiFi Usage Terms:</h4>
            <ScrollArea className="h-32 border rounded p-3 text-xs text-muted-foreground">
              <div className="space-y-2">
                <p>By connecting to {venue.name} WiFi, you agree to:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Use the internet connection responsibly and legally</li>
                  <li>Not access inappropriate or illegal content</li>
                  <li>Not attempt to access other users' devices or data</li>
                  <li>Comply with all applicable laws and regulations</li>
                  <li>Allow monitoring of network usage for security purposes</li>
                </ul>
                <p>We reserve the right to terminate access for violation of these terms.</p>
                <p>Your data will be processed in accordance with our privacy policy.</p>
              </div>
            </ScrollArea>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(!!checked)}
            />
            <Label htmlFor="terms" className="text-sm cursor-pointer">
              I have read and accept the WiFi usage terms and privacy policy
            </Label>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onBack}
              disabled={isLoading}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <Button
              onClick={handleAccept}
              disabled={!termsAccepted || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Accept & Connect
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
