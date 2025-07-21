
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Check, 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Phone, 
  Mail,
  Download,
  Edit,
  ExternalLink,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ConfirmationStepProps {
  bookingData: any;
  venue: any;
  onBookingId: (bookingId: number) => void;
}

export function ConfirmationStep({ bookingData, venue, onBookingId }: ConfirmationStepProps) {
  const { toast } = useToast();
  const [bookingReference, setBookingReference] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBookingDetails = async () => {
      setIsLoading(true);
      
      try {
        if (!bookingData.bookingId) {
          console.error('No booking ID provided to ConfirmationStep');
          setIsLoading(false);
          return;
        }

        console.log('Loading booking details for ID:', bookingData.bookingId);
        
        // Get the booking details
        const { data: booking, error: fetchError } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingData.bookingId)
          .single();

        if (fetchError) {
          console.error('Error fetching booking:', fetchError);
          throw fetchError;
        }

        console.log('Booking loaded:', booking);
        setBookingReference(booking.booking_reference);
        onBookingId(booking.id);

        // Check payment status if payment was required
        if (bookingData.paymentRequired) {
          const { data: payment } = await supabase
            .from('booking_payments')
            .select('status')
            .eq('booking_id', bookingData.bookingId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (payment) {
            setPaymentStatus(payment.status);
            console.log('Payment status:', payment.status);
          }
        }

        toast({
          title: "Booking Confirmed!",
          description: booking.status === 'confirmed' ? 
            "Your table is reserved and ready!" : 
            "Your booking has been created.",
        });

      } catch (error) {
        console.error('Error loading booking details:', error);
        toast({
          title: "Booking Error",
          description: "There was an issue loading your booking details.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadBookingDetails();
  }, [bookingData.bookingId, bookingData.paymentRequired, toast, onBookingId]);

  const generateCalendarEvent = () => {
    const startDate = new Date(bookingData.date);
    const [hours, minutes] = bookingData.time.split(':').map(Number);
    startDate.setHours(hours, minutes);
    
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 2); // Assume 2-hour booking

    const event = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//The Nuthatch//Booking//EN',
      'BEGIN:VEVENT',
      `DTSTART:${startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
      `DTEND:${endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
      `SUMMARY:Dinner at ${venue.name}`,
      `DESCRIPTION:Booking for ${bookingData.partySize} people\\nService: ${bookingData.service?.title || 'Dinner'}`,
      `LOCATION:${venue.name}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([event], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${venue.slug}-booking.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nuthatch-green mx-auto mb-4"></div>
        <h2 className="text-xl font-nuthatch-heading text-nuthatch-dark mb-2">
          Loading Your Booking
        </h2>
        <p className="text-nuthatch-muted">
          Please wait while we load your booking details...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-nuthatch-heading font-light text-nuthatch-dark mb-2">
          Booking Confirmed!
        </h2>
        <p className="text-nuthatch-muted">
          Your table at {venue.name} has been reserved
        </p>
        {bookingReference && (
          <p className="text-sm text-nuthatch-green font-medium mt-2">
            Reference: {bookingReference}
          </p>
        )}
      </div>

      {/* Payment Status Warning */}
      {bookingData.paymentRequired && paymentStatus && paymentStatus !== 'succeeded' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Payment Status: {paymentStatus}</strong>
            {paymentStatus === 'pending' && ' - Your payment may still be processing. Please contact the venue if this persists.'}
            {paymentStatus === 'failed' && ' - Your payment failed. Please contact the venue to resolve this issue.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Email Status */}
      {bookingData.guestDetails.email && (
        <Card className="p-4 border-nuthatch-border">
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-nuthatch-green" />
            <span className="text-nuthatch-dark">
              Confirmation email sent to {bookingData.guestDetails.email}
            </span>
          </div>
        </Card>
      )}

      {/* Booking Details */}
      <Card className="p-6 border-nuthatch-border">
        <h3 className="font-medium text-nuthatch-dark mb-4">Booking Details</h3>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-nuthatch-green" />
            <span className="text-nuthatch-dark">
              {format(bookingData.date, 'EEEE, MMMM do, yyyy')}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-nuthatch-green" />
            <span className="text-nuthatch-dark">
              {bookingData.time} - {(() => {
                const [hours, minutes] = bookingData.time.split(':').map(Number);
                const endTime = new Date();
                endTime.setHours(hours + 2, minutes); // Assuming 2-hour duration
                return endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              })()}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <Users className="h-5 w-5 text-nuthatch-green" />
            <span className="text-nuthatch-dark">
              {bookingData.partySize} {bookingData.partySize === 1 ? 'guest' : 'guests'}
            </span>
          </div>

          {bookingData.service && (
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-nuthatch-green" />
              <span className="text-nuthatch-dark">
                Service: {bookingData.service.title}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Payment Details */}
      {(bookingData.paymentRequired && bookingData.paymentAmount > 0) && (
        <Card className="p-6 border-nuthatch-border">
          <h3 className="font-medium text-nuthatch-dark mb-4">Payment Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-nuthatch-muted">Total Amount:</span>
              <span className="text-nuthatch-dark font-medium">
                £{(bookingData.paymentAmount / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-nuthatch-muted">Status:</span>
              <span className={`font-medium ${
                paymentStatus === 'succeeded' ? 'text-green-600' : 
                paymentStatus === 'failed' ? 'text-red-600' : 
                'text-yellow-600'
              }`}>
                {paymentStatus === 'succeeded' ? 'Paid' : 
                 paymentStatus === 'failed' ? 'Failed' : 
                 paymentStatus || 'Confirmed'}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Contact Information */}
      <Card className="p-6 border-nuthatch-border">
        <h3 className="font-medium text-nuthatch-dark mb-4">Guest Information</h3>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Users className="h-5 w-5 text-nuthatch-green" />
            <span className="text-nuthatch-dark">{bookingData.guestDetails.name}</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <Phone className="h-5 w-5 text-nuthatch-green" />
            <span className="text-nuthatch-dark">{bookingData.guestDetails.phone}</span>
          </div>
          
          {bookingData.guestDetails.email && (
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-nuthatch-green" />
              <span className="text-nuthatch-dark">{bookingData.guestDetails.email}</span>
            </div>
          )}

          {bookingData.guestDetails.notes && (
            <div className="pt-2 border-t border-nuthatch-border">
              <p className="text-sm text-nuthatch-muted">Special Requests:</p>
              <p className="text-nuthatch-dark">{bookingData.guestDetails.notes}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          onClick={generateCalendarEvent}
          variant="outline"
          className="w-full border-nuthatch-border text-nuthatch-dark hover:bg-nuthatch-light"
        >
          <Download className="h-4 w-4 mr-2" />
          Add to Calendar
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="border-nuthatch-border text-nuthatch-dark hover:bg-nuthatch-light"
            onClick={() => window.location.reload()}
          >
            <Edit className="h-4 w-4 mr-2" />
            Make Another Booking
          </Button>

          <Button
            onClick={() => window.open(`https://${venue.slug}.com`, '_blank')}
            className="bg-nuthatch-green hover:bg-nuthatch-dark text-nuthatch-white"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Visit Website
          </Button>
        </div>
      </div>

      {/* Important Information */}
      <Card className="p-4 bg-nuthatch-light border-nuthatch-border">
        <h4 className="font-medium text-nuthatch-dark mb-2">Important Information</h4>
        <ul className="text-sm text-nuthatch-muted space-y-1">
          <li>• {bookingData.guestDetails.email ? 'A confirmation email has been sent to you' : 'Please save these booking details for your records'}</li>
          <li>• A reminder will be sent 24 hours before your booking</li>
          <li>• Please arrive on time for your reservation</li>
          <li>• Contact us directly if you need to make changes</li>
          {paymentStatus && paymentStatus !== 'succeeded' && (
            <li>• <strong>Payment Issue:</strong> Please contact the venue regarding your payment status</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
