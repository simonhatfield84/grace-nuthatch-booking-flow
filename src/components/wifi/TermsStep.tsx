
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Shield } from 'lucide-react';
import { WifiGuestData } from './WifiPortalFlow';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TermsStepProps {
  venue: any;
  deviceFingerprint: string;
  guestData: WifiGuestData;
  onGuestDataUpdate: (data: Partial<WifiGuestData>) => void;
  onWifiAccess: (token: string) => void;
  onBack: () => void;
}

export const TermsStep: React.FC<TermsStepProps> = ({
  venue,
  deviceFingerprint,
  guestData,
  onGuestDataUpdate,
  onWifiAccess,
  onBack
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAcceptTerms = (checked: boolean) => {
    onGuestDataUpdate({ acceptedTerms: checked });
  };

  const handleSubmit = async () => {
    if (!guestData.acceptedTerms) {
      toast({
        title: "Terms acceptance required",
        description: "Please accept the terms and conditions to continue.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Call the WiFi portal signup edge function
      const { data, error } = await supabase.functions.invoke('wifi-portal-signup', {
        body: {
          venue_id: venue.id,
          device_fingerprint: deviceFingerprint,
          guest_data: guestData,
          device_info: {
            user_agent: navigator.userAgent,
            device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
            device_os: navigator.platform,
            device_browser: navigator.userAgent.split(' ').pop()
          }
        }
      });

      if (error) {
        console.error('WiFi signup error:', error);
        toast({
          title: "Connection failed",
          description: "Unable to connect to WiFi. Please try again.",
          variant: "destructive"
        });
        return;
      }

      if (data?.session_token) {
        onWifiAccess(data.session_token);
      } else {
        throw new Error('No session token received');
      }
    } catch (error) {
      console.error('WiFi portal error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="w-fit mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Terms & Privacy</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Please review and accept our terms to access WiFi
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <ScrollArea className="h-64 w-full border rounded-lg p-4">
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold text-foreground mb-2">WiFi Usage Terms</h4>
                <p className="text-muted-foreground">
                  By accessing our WiFi network, you agree to use it responsibly and in accordance with applicable laws. 
                  Prohibited activities include but are not limited to: accessing illegal content, attempting to breach 
                  network security, or engaging in activities that may harm other users or systems.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Data Collection</h4>
                <p className="text-muted-foreground">
                  We collect basic device information (device type, connection time) and the personal information you 
                  provide for network security and analytics. This helps us improve our service and ensure network safety.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Privacy Policy</h4>
                <p className="text-muted-foreground">
                  Your personal information is stored securely and used only for providing WiFi access and, if you've 
                  opted in, sending you updates about {venue.name}. We do not sell or share your data with third parties 
                  for marketing purposes.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Access Duration</h4>
                <p className="text-muted-foreground">
                  WiFi access is granted for 24 hours from the time of authentication. After this period, 
                  you may need to re-authenticate to continue using the network.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">GDPR Compliance</h4>
                <p className="text-muted-foreground">
                  You have the right to access, modify, or delete your personal data. Contact {venue.name} directly 
                  for any data-related requests. Marketing communications can be unsubscribed from at any time.
                </p>
              </div>
            </div>
          </ScrollArea>

          <div className="flex items-start space-x-2 p-4 bg-muted/50 rounded-lg">
            <Checkbox
              id="terms"
              checked={guestData.acceptedTerms}
              onCheckedChange={handleAcceptTerms}
            />
            <Label
              htmlFor="terms"
              className="text-sm font-normal cursor-pointer leading-relaxed"
            >
              I accept the terms and conditions and privacy policy for WiFi access at {venue.name}
            </Label>
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full"
            size="lg"
            disabled={!guestData.acceptedTerms || isLoading}
          >
            {isLoading ? "Connecting..." : "Connect to WiFi"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
