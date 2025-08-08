
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Wifi, Clock, Copy, ExternalLink } from 'lucide-react';
import { WifiGuestData } from './WifiPortalFlow';
import { useToast } from '@/hooks/use-toast';

interface SuccessStepProps {
  venue: any;
  sessionToken: string;
  guestData: WifiGuestData;
}

export const SuccessStep: React.FC<SuccessStepProps> = ({ venue, sessionToken, guestData }) => {
  const [timeRemaining, setTimeRemaining] = useState(24 * 60); // 24 hours in minutes
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const copySessionToken = () => {
    navigator.clipboard.writeText(sessionToken);
    toast({
      title: "Token copied",
      description: "WiFi session token copied to clipboard."
    });
  };

  const formatTimeRemaining = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleTestConnection = () => {
    // Open a test page to verify internet connection
    window.open('https://www.google.com', '_blank');
  };

  return (
    <div className="container max-w-md mx-auto px-4 py-8">
      <Card>
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">WiFi Connected!</h1>
          <p className="text-muted-foreground">Welcome, {guestData.name.split(' ')[0]}!</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="w-4 h-4 text-green-600" />
              <span className="font-semibold text-green-800">Connection Status</span>
            </div>
            <p className="text-sm text-green-700">
              You are now connected to {venue.name} WiFi network
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Access expires in</span>
              </div>
              <span className="text-sm font-mono">{formatTimeRemaining(timeRemaining)}</span>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Session Token</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copySessionToken}
                  className="h-6 px-2"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <code className="text-xs bg-muted p-2 rounded block break-all">
                {sessionToken}
              </code>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleTestConnection}
              variant="outline"
              className="w-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Test Internet Connection
            </Button>

            {guestData.opt_in_marketing && (
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  You'll receive updates from {venue.name} at {guestData.email}
                </p>
              </div>
            )}

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Having connection issues? Ask our staff for assistance.
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-xs text-center text-muted-foreground">
              Thank you for choosing {venue.name}!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
