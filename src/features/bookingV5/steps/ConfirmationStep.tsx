import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Calendar, Clock, Users, Mail } from 'lucide-react';
import { format } from 'date-fns';

interface ConfirmationStepProps {
  bookingReference: string;
  date: Date;
  time: string;
  partySize: number;
  serviceName: string;
  guestEmail: string;
  paymentAmount?: number;
}

export function ConfirmationStep({ 
  bookingReference, 
  date, 
  time, 
  partySize, 
  serviceName,
  guestEmail,
  paymentAmount 
}: ConfirmationStepProps) {
  return (
    <div className="space-y-6 p-4">
      <div className="text-center py-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-4">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
        <p className="text-muted-foreground">
          Your booking reference is <span className="font-mono font-semibold">{bookingReference}</span>
        </p>
      </div>
      
      <Card className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium">Date</p>
            <p className="text-muted-foreground">{format(date, 'EEEE, MMMM d, yyyy')}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium">Time</p>
            <p className="text-muted-foreground">{time}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <Users className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium">Party Size</p>
            <p className="text-muted-foreground">{partySize} {partySize === 1 ? 'guest' : 'guests'}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium">Service</p>
            <p className="text-muted-foreground">{serviceName}</p>
          </div>
        </div>
        
        {paymentAmount && paymentAmount > 0 && (
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-medium">Amount Paid</span>
              <span className="text-lg font-bold text-primary">
                £{(paymentAmount / 100).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </Card>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
        <p className="text-sm font-medium text-blue-900">
          📧 Confirmation email sent
        </p>
        <p className="text-sm text-blue-800">
          We've sent a confirmation to <span className="font-medium">{guestEmail}</span> with all the details.
        </p>
      </div>
      
      <Button
        onClick={() => window.location.reload()}
        variant="outline"
        className="w-full"
      >
        Make Another Booking
      </Button>
    </div>
  );
}
