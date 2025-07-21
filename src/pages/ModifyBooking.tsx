
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Clock, MapPin, Users, Phone, Mail, Edit } from "lucide-react";
import { BookingModificationForm } from "@/components/booking/BookingModificationForm";

export default function ModifyBooking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [booking, setBooking] = useState<any>(null);
  const [venue, setVenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModifyForm, setShowModifyForm] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid modification link");
      setLoading(false);
      return;
    }

    loadBooking();
  }, [token]);

  const loadBooking = async () => {
    try {
      // Verify token and get booking
      const { data: tokenData, error: tokenError } = await supabase
        .from('booking_tokens')
        .select('booking_id, used_at, expires_at')
        .eq('token', token)
        .eq('token_type', 'modify')
        .single();

      if (tokenError || !tokenData) {
        setError("Invalid or expired modification link");
        return;
      }

      if (tokenData.used_at) {
        setError("This modification link has already been used");
        return;
      }

      if (new Date(tokenData.expires_at) < new Date()) {
        setError("This modification link has expired");
        return;
      }

      // Get booking details
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          venues!inner(name, email, phone, address)
        `)
        .eq('id', tokenData.booking_id)
        .single();

      if (bookingError || !bookingData) {
        setError("Booking not found");
        return;
      }

      if (bookingData.status === 'cancelled') {
        setError("This booking has been cancelled and cannot be modified");
        return;
      }

      setBooking(bookingData);
      setVenue(bookingData.venues);
    } catch (error) {
      console.error('Error loading booking:', error);
      setError("Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const handleModificationSuccess = async () => {
    // Mark token as used
    await supabase
      .from('booking_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);
    
    // Reload booking data
    await loadBooking();
    setShowModifyForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (showModifyForm && booking && venue) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Modify Your Booking</h1>
            <p className="text-muted-foreground">Update your booking details</p>
          </div>
          
          <BookingModificationForm
            booking={booking}
            venue={venue}
            onSuccess={handleModificationSuccess}
            onCancel={() => setShowModifyForm(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Modify Booking</h1>
          <p className="text-muted-foreground">
            Review your booking details and make changes
          </p>
        </div>

        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {booking && venue && (
          <Card>
            <CardHeader>
              <CardTitle>{venue.name}</CardTitle>
              <CardDescription>Booking Reference: {booking.booking_reference}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{booking.guest_name}</p>
                    <p className="text-sm text-muted-foreground">{booking.party_size} guests</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {new Date(booking.booking_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.booking_time}
                      {booking.end_time && ` - ${booking.end_time}`}
                    </p>
                  </div>
                </div>

                {booking.service && (
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{booking.service}</p>
                      <p className="text-sm text-muted-foreground">Service</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{venue.name}</p>
                    {venue.address && (
                      <p className="text-sm text-muted-foreground">{venue.address}</p>
                    )}
                  </div>
                </div>
              </div>

              {booking.notes && (
                <div>
                  <h4 className="font-medium mb-2">Special Requests</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {booking.notes}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={() => setShowModifyForm(true)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modify Booking
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex-1"
                >
                  Back to Home
                </Button>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-3">Need Help?</h4>
                <div className="space-y-3">
                  {venue.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <a 
                          href={`tel:${venue.phone}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {venue.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {venue.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Email</p>
                        <a 
                          href={`mailto:${venue.email}?subject=Booking Modification Request - ${booking.booking_reference}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {venue.email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
