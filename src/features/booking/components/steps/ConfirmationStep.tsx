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
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ConfirmationStepProps {
  bookingData: any;
  venue: any;
  onBookingId: (bookingId: number) => void;
}

export function ConfirmationStep({ bookingData, venue, onBookingId }: ConfirmationStepProps) {
  const { toast } = useToast();
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [bookingReference, setBookingReference] = useState<string | null>(null);
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    const processBooking = async () => {
      // Prevent multiple executions
      if (hasProcessed) return;
      setHasProcessed(true);

      // If booking already exists and we came from payment, update status to confirmed
      if (bookingData.bookingId) {
        setIsCreatingBooking(true);
        try {
          const { data, error } = await supabase
            .from('bookings')
            .update({ status: 'confirmed' })
            .eq('id', bookingData.bookingId)
            .select()
            .single();

          if (error) throw error;

          setBookingReference(data.booking_reference);
          onBookingId(data.id);

          toast({
            title: "Booking Confirmed!",
            description: "Your payment has been processed and your table is reserved.",
          });

        } catch (error) {
          console.error('Error updating booking status:', error);
          toast({
            title: "Booking Error",
            description: "There was an issue confirming your booking. Please contact us directly.",
            variant: "destructive",
          });
        } finally {
          setIsCreatingBooking(false);
        }
        return;
      }

      // If no booking ID and no payment required, create booking normally
      if (!bookingData.paymentRequired) {
        setIsCreatingBooking(true);
        try {
          const { TableAllocationService } = await import("@/services/tableAllocation");
          
          const allocationResult = await TableAllocationService.allocateTable(
            bookingData.partySize,
            format(bookingData.date, 'yyyy-MM-dd'),
            bookingData.time,
            120, // duration minutes
            venue.id
          );

          if (!allocationResult.tableIds || allocationResult.tableIds.length === 0) {
            throw new Error('No tables available for your requested time. Please try a different time slot.');
          }

          const bookingPayload = {
            venue_id: venue.id,
            guest_name: bookingData.guestDetails.name,
            email: bookingData.guestDetails.email || null,
            phone: bookingData.guestDetails.phone,
            party_size: bookingData.partySize,
            booking_date: format(bookingData.date, 'yyyy-MM-dd'),
            booking_time: bookingData.time,
            service: bookingData.service?.title || 'Dinner',
            notes: bookingData.guestDetails.notes || null,
            status: 'confirmed',
            table_id: allocationResult.tableIds[0],
            is_unallocated: false,
          };

          const { data, error } = await supabase
            .from('bookings')
            .insert([bookingPayload])
            .select()
            .single();

          if (error) throw error;

          onBookingId(data.id);
          setBookingReference(data.booking_reference);

          toast({
            title: "Booking Confirmed!",
            description: "Your table has been reserved successfully.",
          });

        } catch (error) {
          console.error('Error creating booking:', error);
          
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          const isTableAvailabilityError = errorMessage.includes('No tables available');
          
          toast({
            title: isTableAvailabilityError ? "No Tables Available" : "Booking Error",
            description: isTableAvailabilityError 
              ? "Unfortunately, no tables are available for your selected time. Please try a different time slot."
              : "There was an issue creating your booking. Please contact us directly.",
            variant: "destructive",
          });
        } finally {
          setIsCreatingBooking(false);
        }
      }
    };

    processBooking();
  }, []); // Empty dependency array to run only once

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
      `SUMMARY:Dinner at The Nuthatch`,
      `DESCRIPTION:Booking for ${bookingData.partySize} people\\nService: ${bookingData.service?.title || 'Dinner'}`,
      `LOCATION:The Nuthatch, [Venue Address]`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([event], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nuthatch-booking.ics';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isCreatingBooking) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nuthatch-green mx-auto mb-4"></div>
        <h2 className="text-xl font-nuthatch-heading text-nuthatch-dark mb-2">
          Confirming Your Booking
        </h2>
        <p className="text-nuthatch-muted">
          Please wait while we secure your reservation...
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
          Your table at The Nuthatch has been reserved
        </p>
        {bookingReference && (
          <p className="text-sm text-nuthatch-green font-medium mt-2">
            Reference: {bookingReference}
          </p>
        )}
      </div>

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
            <span className="text-nuthatch-dark">{bookingData.time}</span>
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
            onClick={() => {
              // TODO: Implement booking modification
              console.log('Modify booking');
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Modify
          </Button>

          <Button
            onClick={() => window.open('https://the-nuthatch.com', '_blank')}
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
          <li>• You will receive a confirmation email shortly (if email provided)</li>
          <li>• A reminder will be sent 36 hours before your booking</li>
          <li>• Please arrive on time for your reservation</li>
          <li>• Contact us directly if you need to make changes</li>
        </ul>
      </Card>
    </div>
  );
}