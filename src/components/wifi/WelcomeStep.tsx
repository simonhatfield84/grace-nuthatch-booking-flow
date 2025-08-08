
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Wifi, ArrowRight, Loader2 } from 'lucide-react';

interface Venue {
  id: string;
  name: string;
  phone?: string;
  address?: string;
}

interface WelcomeStepProps {
  venue: Venue;
  onContinue: () => void;
  isLoading: boolean;
}

export function WelcomeStep({ venue, onContinue, isLoading }: WelcomeStepProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Wifi className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome to</h1>
            <h2 className="text-xl text-primary font-semibold">{venue.name}</h2>
          </div>
          <p className="text-muted-foreground">
            Get instant access to free WiFi by completing a quick signup
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Fast & reliable internet</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>No time limits</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Secure connection</span>
            </div>
          </div>

          <Button 
            onClick={onContinue} 
            disabled={isLoading}
            className="w-full h-12 text-base"
            size="lg"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-2" />
            )}
            Connect to WiFi
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By continuing, you agree to our terms of service and privacy policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
