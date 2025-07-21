
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, Users, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface BookingModificationFormProps {
  booking: any;
  venue: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BookingModificationForm({ booking, venue, onSuccess, onCancel }: BookingModificationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    booking_date: new Date(booking.booking_date),
    booking_time: booking.booking_time,
    party_size: booking.party_size,
    notes: booking.notes || '',
  });
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  // Check availability when date or party size changes
  useEffect(() => {
    if (formData.booking_date && formData.party_size) {
      checkAvailability();
    }
  }, [formData.booking_date, formData.party_size]);

  const checkAvailability = async () => {
    try {
      setIsCheckingAvailability(true);
      const dateStr = format(formData.booking_date, 'yyyy-MM-dd');
      
      // Get booking windows for the venue
      const { data: windows, error: windowsError } = await supabase
        .from('booking_windows')
        .select('*')
        .eq('venue_id', venue.id);

      if (windowsError) throw windowsError;

      // Get existing bookings for the date
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('booking_time, party_size')
        .eq('venue_id', venue.id)
        .eq('booking_date', dateStr)
        .neq('id', booking.id) // Exclude current booking
        .in('status', ['confirmed', 'finished']);

      if (bookingsError) throw bookingsError;

      // Generate available time slots
      const times: string[] = [];
      const dayOfWeek = formData.booking_date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      for (const window of windows) {
        if (window.days.includes(dayOfWeek)) {
          const startHour = parseInt(window.start_time.split(':')[0]);
          const endHour = parseInt(window.end_time.split(':')[0]);
          
          for (let hour = startHour; hour < endHour; hour++) {
            for (let minutes = 0; minutes < 60; minutes += 30) {
              const timeStr = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
              
              // Check if time slot is available (simplified availability check)
              const conflictingBookings = bookings?.filter(b => 
                Math.abs(new Date(`2000-01-01 ${b.booking_time}`).getTime() - 
                         new Date(`2000-01-01 ${timeStr}`).getTime()) < 2 * 60 * 60 * 1000 // 2 hour buffer
              ) || [];
              
              if (conflictingBookings.length < window.max_bookings_per_slot) {
                times.push(timeStr);
              }
            }
          }
        }
      }
      
      setAvailableTimes(times.sort());
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailableTimes([]);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Update the booking
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          booking_date: format(formData.booking_date, 'yyyy-MM-dd'),
          booking_time: formData.booking_time,
          party_size: formData.party_size,
          notes: formData.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id);

      if (updateError) throw updateError;

      // Send modification email
      try {
        await supabase.functions.invoke('send-email', {
          body: {
            booking_id: booking.id,
            guest_email: booking.email,
            venue_id: venue.id,
            email_type: 'booking_modified'
          }
        });
      } catch (emailError) {
        console.warn('Failed to send modification email:', emailError);
        // Don't fail the whole process if email fails
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (error: any) {
      console.error('Error updating booking:', error);
      setError(error.message || 'Failed to update booking');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h3 className="text-lg font-medium">Booking Updated!</h3>
            <p className="text-sm text-muted-foreground">
              Your booking has been successfully modified. You should receive a confirmation email shortly.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Modify Your Booking</CardTitle>
        <p className="text-sm text-muted-foreground">
          Update your booking details below. Reference: <strong>{booking.booking_reference}</strong>
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.booking_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.booking_date ? format(formData.booking_date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.booking_date}
                    onSelect={(date) => date && setFormData({ ...formData, booking_date: date })}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Time</Label>
              <Select
                value={formData.booking_time}
                onValueChange={(value) => setFormData({ ...formData, booking_time: value })}
                disabled={isCheckingAvailability || availableTimes.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    isCheckingAvailability ? "Checking availability..." : 
                    availableTimes.length === 0 ? "No times available" :
                    "Select time"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {availableTimes.map((time) => (
                    <SelectItem key={time} value={time}>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {time}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Party Size</Label>
            <Select
              value={formData.party_size.toString()}
              onValueChange={(value) => setFormData({ ...formData, party_size: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {size} {size === 1 ? 'guest' : 'guests'}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Special Requests (Optional)</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any special requests or dietary requirements..."
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading || availableTimes.length === 0}
              className="flex-1"
            >
              {isLoading ? 'Updating...' : 'Update Booking'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
