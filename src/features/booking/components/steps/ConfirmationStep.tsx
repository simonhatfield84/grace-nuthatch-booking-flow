
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Clock, Users, Mail, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ConfirmationStepProps {
  bookingId: number;
}

export function ConfirmationStep({ bookingId }: ConfirmationStepProps) {
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          venues (
            name,
            email,
            phone,
            address
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error) {
        console.error('Error fetching booking:', error);
        return;
      }

      setBooking(data);
    } catch (error) {
      console.error('Error fetching booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading booking details...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!booking) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <p className="text-destructive">Unable to load booking details.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Booking Confirmed!</CardTitle>
          <p className="text-muted-foreground">
            Your reservation has been successfully confirmed
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Booking Reference</span>
              <Badge variant="secondary" className="font-mono">
                #{booking.id}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Date</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(booking.booking_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Time</p>
                  <p className="text-sm text-muted-foreground">{booking.booking_time}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Party Size</p>
                  <p className="text-sm text-muted-foreground">{booking.party_size} guests</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              Guest Information
            </h3>
            
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Name:</strong> {booking.guest_name}
              </p>
              
              {booking.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm">{booking.email}</p>
                </div>
              )}
              
              {booking.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm">{booking.phone}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              What's Next?
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• A confirmation email has been sent to {booking.email}</li>
              <li>• Please arrive 5 minutes before your booking time</li>
              <li>• Contact the venue if you need to make any changes</li>
            </ul>
          </div>

          {booking.venues && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">{booking.venues.name}</h3>
              {booking.venues.address && (
                <p className="text-sm text-muted-foreground mb-2">{booking.venues.address}</p>
              )}
              <div className="flex gap-4 text-sm">
                {booking.venues.phone && (
                  <span>📞 {booking.venues.phone}</span>
                )}
                {booking.venues.email && (
                  <span>✉️ {booking.venues.email}</span>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <Button onClick={() => window.location.href = '/'}>
              Return to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
