
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, Clock, Users, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ConfirmationStepProps {
  bookingId?: number;
  bookingData?: any;
  venue?: any;
  onBookingId?: (bookingId: any) => void;
}

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ 
  bookingId,
  bookingData,
  venue,
  onBookingId
}) => {
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    if (!bookingId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      setBooking(data);
    } catch (error) {
      console.error('Error fetching booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const displayBooking = booking || bookingData;

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Booking Confirmed!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {displayBooking && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span>{displayBooking.booking_date || displayBooking.date}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span>{displayBooking.booking_time || displayBooking.time}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span>{displayBooking.party_size || displayBooking.partySize} guests</span>
              </div>
              
              {venue && (
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span>{venue.name}</span>
                </div>
              )}
            </div>
          )}

          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground text-center">
              A confirmation email has been sent to your email address.
            </p>
          </div>

          <Button 
            onClick={() => window.location.reload()} 
            className="w-full"
          >
            Make Another Booking
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
