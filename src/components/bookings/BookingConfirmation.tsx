// 🚨 DEPRECATED: This component is not used by the canonical NuthatchBookingWidget
// NuthatchBookingWidget uses its own ConfirmationStep component
// This file will be removed in a future cleanup

console.warn('⚠️ DEPRECATED: BookingConfirmation is not used by NuthatchBookingWidget.');

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Download, Settings, Mail } from "lucide-react";
import { format } from "date-fns";
import { PaymentStatusVerifier } from "@/components/payments/PaymentStatusVerifier";
import { supabase } from "@/integrations/supabase/client";

interface BookingConfirmationProps {
  bookingData: {
    date: string;
    time: string;
    partySize: number;
    service: string;
    guestDetails: any;
    bookingId: number | null;
  };
  venueSlug: string;
}

export const BookingConfirmation = ({ bookingData, venueSlug }: BookingConfirmationProps) => {
  const [calendarUrl, setCalendarUrl] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('unknown');
  const [initialPaymentData, setInitialPaymentData] = useState<any>(null);

  useEffect(() => {
    // Generate calendar URL for diary export
    const startDate = new Date(`${bookingData.date}T${bookingData.time}`);
    const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000)); // Default 2 hours
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Grace OS//Booking//EN',
      'BEGIN:VEVENT',
      `DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `SUMMARY:${bookingData.service} Booking - ${bookingData.partySize} guests`,
      `DESCRIPTION:Booking for ${bookingData.partySize} people at ${venueSlug}`,
      `LOCATION:${venueSlug}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    setCalendarUrl(URL.createObjectURL(blob));

    // Fetch initial payment data if booking ID exists
    if (bookingData.bookingId) {
      fetchInitialPaymentData();
    }

    return () => {
      if (calendarUrl) {
        URL.revokeObjectURL(calendarUrl);
      }
    };
  }, [bookingData, venueSlug]);

  const fetchInitialPaymentData = async () => {
    if (!bookingData.bookingId) return;

    try {
      const { data: paymentData } = await supabase
        .from('booking_payments')
        .select('*')
        .eq('booking_id', bookingData.bookingId)
        .single();

      setInitialPaymentData(paymentData);
    } catch (error) {
      console.error('Error fetching initial payment data:', error);
    }
  };

  const handlePaymentStatusUpdate = (status: string) => {
    setPaymentStatus(status);
  };

  const handleDownloadCalendar = () => {
    const link = document.createElement('a');
    link.href = calendarUrl;
    link.download = `booking-${bookingData.bookingId || 'confirmation'}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'EEEE, MMMM d, yyyy');
  };

  const formatTime = (timeStr: string) => {
    return format(new Date(`2000-01-01T${timeStr}`), 'h:mm a');
  };

  return (
    <div className="space-y-6">
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-green-800">Booking Confirmed!</CardTitle>
          <CardDescription className="text-green-600">
            Your table has been reserved successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="font-semibold text-lg">{formatDate(bookingData.date)}</p>
            <p className="text-muted-foreground">
              {formatTime(bookingData.time)} • {bookingData.partySize} guests • {bookingData.service}
            </p>
            {bookingData.bookingId && (
              <p className="text-sm text-muted-foreground">
                Booking Reference: #{bookingData.bookingId}
              </p>
            )}
          </div>

          {/* Enhanced Payment Status Section */}
          {bookingData.bookingId && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Payment Status</h4>
              <PaymentStatusVerifier
                bookingId={bookingData.bookingId}
                initialPaymentData={initialPaymentData}
                onStatusUpdate={handlePaymentStatusUpdate}
              />
            </div>
          )}

          <div className="border-t pt-4 space-y-3">
            <h4 className="font-medium">Guest Details</h4>
            <div className="text-sm space-y-1">
              <p><strong>Name:</strong> {bookingData.guestDetails?.name}</p>
              <p><strong>Email:</strong> {bookingData.guestDetails?.email}</p>
              {bookingData.guestDetails?.phone && (
                <p><strong>Phone:</strong> {bookingData.guestDetails.phone}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Button 
          onClick={handleDownloadCalendar}
          className="w-full"
          variant="outline"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Add to Calendar
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" asChild>
            <a href={`/${venueSlug}/manage`} target="_blank" rel="noopener noreferrer">
              <Settings className="w-4 h-4 mr-2" />
              Manage Booking
            </a>
          </Button>
          
          <Button variant="outline" asChild>
            <a href={`mailto:${bookingData.guestDetails?.email}?subject=Booking Confirmation`}>
              <Mail className="w-4 h-4 mr-2" />
              Email Receipt
            </a>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>A confirmation email has been sent to {bookingData.guestDetails?.email}</p>
            <p>Need to make changes? Use the manage booking link above or contact us directly.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
