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
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { logger } from "@/lib/logger";

interface ConfirmationStepProps {
  bookingData: any;
  venue: any;
  onBookingId: (bookingId: number) => void;
}

export function ConfirmationStep({ bookingData, venue, onBookingId }: ConfirmationStepProps) {
  const { toast } = useToast();
  const [bookingReference, setBookingReference] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const loadBookingDetails = async () => {
      setIsLoading(true);
      
      try {
        if (!bookingData.bookingId) {
          logger.error('No booking ID provided to ConfirmationStep');
          setIsLoading(false);
          return;
        }

        logger.debug('Loading booking details', { bookingId: bookingData.bookingId });
        
        // Get the booking details
        const { data: booking, error: fetchError } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingData.bookingId)
          .single();

        if (fetchError) {
          logger.error('Error fetching booking', { error: fetchError.message, bookingId: bookingData.bookingId });
          throw fetchError;
        }

        logger.debug('Booking loaded', { booking, bookingId: bookingData.bookingId });
        setBookingReference(booking.booking_reference);
        setBookingStatus(booking.status);

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
          logger.debug('Payment status', { status: payment.status, bookingId: bookingData.bookingId });
        }
        }

        // Only show success toast if booking is actually confirmed and payment is complete
        if (booking.status === 'confirmed' && (!bookingData.paymentRequired || paymentStatus === 'succeeded')) {
          toast({
            title: "Booking Confirmed!",
            description: "Your table is reserved and ready!",
          });
        } else {
          toast({
            title: "Booking Created",
            description: "Your booking is being processed. Payment verification in progress.",
            variant: "default",
          });
        }

      } catch (error) {
        logger.error('Error loading booking details', { error: error instanceof Error ? error.message : String(error), bookingId: bookingData.bookingId });
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
  }, [bookingData.bookingId, bookingData.paymentRequired, toast, paymentStatus]);

  const verifyPaymentStatus = async () => {
    if (!bookingData.bookingId) return;
    
    setIsVerifying(true);
    
    try {
      logger.debug('Verifying payment status for booking', { bookingId: bookingData.bookingId });

      // First, get the payment details to retrieve the stripe_payment_intent_id
      const { data: paymentData, error: paymentError } = await supabase
        .from('booking_payments')
        .select('status, stripe_payment_intent_id')
        .eq('booking_id', bookingData.bookingId)
        .single();

      if (paymentError) {
        logger.error('Error fetching payment data', { error: paymentError.message, bookingId: bookingData.bookingId });
        toast({
          title: "Error",
          description: "Could not find payment record for this booking",
          variant: "destructive",
        });
        return;
      }

      if (!paymentData?.stripe_payment_intent_id) {
        logger.error('No payment intent ID found for booking', { bookingId: bookingData.bookingId });
        toast({
          title: "Error", 
          description: "No payment intent found for this booking",
          variant: "destructive",
        });
        return;
      }

      logger.debug('Found payment intent', { paymentIntentId: paymentData.stripe_payment_intent_id, bookingId: bookingData.bookingId });

      // Check both booking and payment status
      const { data: booking } = await supabase
        .from('bookings')
        .select('status')
        .eq('id', bookingData.bookingId)
        .single();

      if (booking) {
        setBookingStatus(booking.status);
      }

      // Update local payment status
      setPaymentStatus(paymentData.status);

      // If payment is still pending, verify with Stripe
      if (paymentData.status === 'pending') {
        logger.info('Payment pending, verifying with Stripe', { bookingId: bookingData.bookingId });
        
        const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-payment-status', {
          body: {
            payment_intent_id: paymentData.stripe_payment_intent_id,
            booking_id: bookingData.bookingId
          }
        });

        if (verifyError) {
          logger.error('Stripe verification error', { error: verifyError.message, bookingId: bookingData.bookingId });
          toast({
            title: "Error",
            description: `Failed to verify payment with Stripe: ${verifyError.message}`,
            variant: "destructive",
          });
          return;
        }

        if (verifyData?.payment_succeeded) {
          logger.info('Stripe confirms payment succeeded', { bookingId: bookingData.bookingId });
          toast({
            title: "Success",
            description: "Payment verified and booking confirmed!",
          });
          // Refresh the page to show updated status
          setTimeout(() => window.location.reload(), 1000);
        } else {
          toast({
            title: "Info",
            description: "Payment is still processing with Stripe",
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Status refreshed",
        });
      }

    } catch (error) {
      logger.error('Error verifying payment', { error: error instanceof Error ? error.message : String(error), bookingId: bookingData.bookingId });
      toast({
        title: "Error",
        description: "Failed to verify payment status",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

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

  // Determine if booking is fully confirmed - CRITICAL FIX: only confirm if payment is verified
  const isFullyConfirmed = bookingStatus === 'confirmed' && (!bookingData.paymentRequired || paymentStatus === 'succeeded');
  const isPendingPayment = bookingData.paymentRequired && (paymentStatus === 'pending' || paymentStatus === null);

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="text-center">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
          isFullyConfirmed ? 'bg-green-100' : 
          isPendingPayment ? 'bg-yellow-100' : 'bg-blue-100'
        }`}>
          {isFullyConfirmed ? (
            <Check className="h-8 w-8 text-green-600" />
          ) : isPendingPayment ? (
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          ) : (
            <Clock className="h-8 w-8 text-blue-600" />
          )}
        </div>
        <h2 className="text-2xl font-nuthatch-heading font-light text-nuthatch-dark mb-2">
          {isFullyConfirmed ? 'Booking Confirmed!' : 
           isPendingPayment ? 'Payment Processing' : 
           'Booking Created'}
        </h2>
        <p className="text-nuthatch-muted">
          {isFullyConfirmed ? `Your table at ${venue.name} is confirmed` :
           isPendingPayment ? 'Your booking will be confirmed once payment is processed' :
           'Your booking has been created'}
        </p>
        {bookingReference && (
          <p className="text-sm text-nuthatch-green font-medium mt-2">
            Reference: {bookingReference}
          </p>
        )}
      </div>

      {/* Payment Status Warning */}
      {isPendingPayment && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong>Payment Processing:</strong> Your payment is being verified. 
              This may take a few minutes due to payment processing delays.
            </div>
            <Button 
              onClick={verifyPaymentStatus} 
              disabled={isVerifying}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isVerifying ? 'animate-spin' : ''}`} />
              Check Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Email Status */}
      {bookingData.guestDetails.email && (
        <Card className="p-4 border-nuthatch-border">
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-nuthatch-green" />
            <span className="text-nuthatch-dark">
              {isFullyConfirmed ? 'Confirmation email sent' : 'Email will be sent once booking is confirmed'} to {bookingData.guestDetails.email}
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
                endTime.setHours(hours + 2, minutes);
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
                 paymentStatus === 'pending' ? 'Processing' :
                 'Confirming'}
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
          <li>• {bookingData.guestDetails.email ? 'A confirmation email will be sent once your booking is fully confirmed' : 'Please save these booking details for your records'}</li>
          <li>• A reminder will be sent 24 hours before your booking</li>
          <li>• Please arrive on time for your reservation</li>
          <li>• Contact us directly if you need to make changes</li>
          {isPendingPayment && (
            <li>• <strong>Payment Processing:</strong> Your booking will be confirmed automatically once payment is verified</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
