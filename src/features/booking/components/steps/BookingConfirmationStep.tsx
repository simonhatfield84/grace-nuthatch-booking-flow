
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

interface BookingConfirmationStepProps {
  bookingId?: number | null;
}

export const BookingConfirmationStep: React.FC<BookingConfirmationStepProps> = ({ bookingId }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">
            Your booking has been confirmed and you'll receive a confirmation email shortly.
          </p>
          {bookingId && (
            <p className="text-sm text-muted-foreground">
              Booking ID: #{bookingId}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
