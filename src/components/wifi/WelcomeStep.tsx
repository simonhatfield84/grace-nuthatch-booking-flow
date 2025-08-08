
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wifi, MapPin, Clock, Star } from 'lucide-react';

interface WelcomeStepProps {
  venue: any;
  onNext: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ venue, onNext }) => {
  return (
    <div className="container max-w-md mx-auto px-4 py-8">
      <Card>
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <Wifi className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome to {venue.name}</h1>
          <p className="text-muted-foreground">Free WiFi Access</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {venue.address && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{venue.address}</span>
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-3">What you get:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                Free unlimited WiFi access
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                High-speed internet connection
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                Secure guest network
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                24-hour access token
              </li>
            </ul>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-4">
              Quick signup required for security and analytics
            </p>
            <Button onClick={onNext} className="w-full" size="lg">
              Get WiFi Access
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
