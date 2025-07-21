import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, Clock, MapPin, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CancelBooking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get("token");

  const [booking, setBooking] = useState<any>(null);
  const [venue, setVenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid cancellation link");
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
        .eq('token_type', 'cancel')
        .single();

      if (tokenError || !tokenData) {
        setError("Invalid or expired cancellation link");
        return;
      }

      if (tokenData.used_at) {
        setError("This cancellation link has already been used");
        return;
      }

      if (new Date(tokenData.expires_at) < new Date()) {
        setError("This cancellation link has expired");
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
        setCancelled(true);
        setError("This booking has already been cancelled");
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

  const handleCancelBooking = async () => {
    if (!booking || !token) return;

    setCancelling(true);
    try {
      // Cancel the booking
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (updateError) throw updateError;

      // Mark token as used
      const { error: tokenError } = await supabase
        .from('booking_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('token', token);

      if (tokenError) console.warn('Failed to mark token as used:', tokenError);

      setCancelled(true);
      toast({
        title: "Booking cancelled",
        description: "Your booking has been successfully cancelled.",
      });

    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again or contact the venue.",
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
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

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Cancel Booking</h1>
          <p className="text-muted-foreground">
            Review your booking details before cancelling
          </p>
        </div>

        {error && (
          <Alert className="mb-6" variant={cancelled ? "default" : "destructive"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {cancelled && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Your booking has been cancelled successfully. You should receive a confirmation email shortly.
            </AlertDescription>
          </Alert>
        )}

        {booking && venue && !cancelled && (
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

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Are you sure you want to cancel this booking? This action cannot be undone.
                  If you need to make changes instead, please contact the venue directly.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="destructive"
                  onClick={handleCancelBooking}
                  disabled={cancelling}
                  className="flex-1"
                >
                  {cancelling ? "Cancelling..." : "Cancel Booking"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex-1"
                >
                  Keep Booking
                </Button>
              </div>

              {venue.phone && (
                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Need to make changes instead?{" "}
                    <a href={`tel:${venue.phone}`} className="text-primary hover:underline">
                      Call {venue.phone}
                    </a>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}