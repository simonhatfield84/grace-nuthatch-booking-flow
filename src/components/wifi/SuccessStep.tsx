
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Wifi, Copy, ExternalLink, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Guest } from '@/types/guest';

interface Venue {
  id: string;
  name: string;
  phone?: string;
  address?: string;
}

interface SuccessStepProps {
  venue: Venue;
  guest: Guest | null;
  wifiCredentials: {
    network: string;
    password: string;
  } | null;
}

export function SuccessStep({ venue, guest, wifiCredentials }: SuccessStepProps) {
  const [timeRemaining, setTimeRemaining] = useState(10);
  const { toast } = useToast();

  useEffect(() => {
    // Auto-redirect after 10 seconds
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Redirect to a neutral page or close the window
          window.location.href = 'about:blank';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <CardTitle className="text-green-600">Connected Successfully!</CardTitle>
          <p className="text-sm text-muted-foreground">
            Welcome to {venue.name} WiFi network
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {guest && (
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Welcome back, <span className="font-semibold text-foreground">{guest.name}</span>!
              </p>
            </div>
          )}

          {wifiCredentials && (
            <div className="space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                WiFi Details
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Network Name</p>
                    <p className="font-mono text-sm">{wifiCredentials.network}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(wifiCredentials.network, 'Network name')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Password</p>
                    <p className="font-mono text-sm">{wifiCredentials.password}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(wifiCredentials.password, 'Password')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Auto-redirecting in {timeRemaining} seconds</span>
            </div>
            
            <p className="text-xs text-muted-foreground">
              You can now close this page and enjoy your internet connection
            </p>
          </div>

          <div className="pt-4 border-t space-y-2">
            <h4 className="font-semibold text-sm">Thank you for visiting {venue.name}!</h4>
            <p className="text-xs text-muted-foreground">
              Follow us on social media for updates on events and special offers.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
