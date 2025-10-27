import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Calendar, Clock, Users, Mail } from 'lucide-react';
import { format } from 'date-fns';

interface BookingDetails {
  reference: string;
  partySize: number;
  date: Date;
  time: string;
  serviceName: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  depositPaid?: boolean;
  depositAmount?: number;
}

interface ConfirmationStepUIProps {
  booking: BookingDetails;
  onNewBooking?: () => void;
}

export function ConfirmationStepUI({ booking, onNewBooking }: ConfirmationStepUIProps) {
  const handleAddToCalendar = () => {
    // Mock calendar download
    console.log('Add to calendar clicked');
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <AlertDescription className="text-green-800 font-medium">
          Booking Confirmed!
        </AlertDescription>
      </Alert>

      {/* Booking Reference */}
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-nuthatch-muted mb-2">Booking Reference</p>
          <p className="text-2xl font-bold text-nuthatch-dark font-nuthatch-heading">
            {booking.reference}
          </p>
        </CardContent>
      </Card>

      {/* Email Confirmation Notice */}
      <Alert className="bg-blue-50 border-blue-200">
        <Mail className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          A confirmation email has been sent to{' '}
          <strong>{booking.guestEmail}</strong>
        </AlertDescription>
      </Alert>

      {/* Booking Details */}
      <Card>
        <CardHeader>
          <CardTitle className="font-nuthatch-heading text-nuthatch-dark">
            Booking Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-nuthatch-green" />
            <div>
              <p className="text-sm text-nuthatch-muted">Date</p>
              <p className="font-medium text-nuthatch-dark">
                {format(booking.date, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-nuthatch-green" />
            <div>
              <p className="text-sm text-nuthatch-muted">Time</p>
              <p className="font-medium text-nuthatch-dark">{booking.time}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-nuthatch-green" />
            <div>
              <p className="text-sm text-nuthatch-muted">Party Size</p>
              <p className="font-medium text-nuthatch-dark">
                {booking.partySize} {booking.partySize === 1 ? 'guest' : 'guests'}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t">
            <p className="text-sm text-nuthatch-muted">Service</p>
            <p className="font-medium text-nuthatch-dark">{booking.serviceName}</p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Details (if applicable) */}
      {booking.depositPaid && booking.depositAmount && (
        <Card>
          <CardHeader>
            <CardTitle className="font-nuthatch-heading text-nuthatch-dark">
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-nuthatch-muted">Deposit Paid</span>
              <span className="font-bold text-nuthatch-dark">
                £{(booking.depositAmount / 100).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guest Information */}
      <Card>
        <CardHeader>
          <CardTitle className="font-nuthatch-heading text-nuthatch-dark">
            Guest Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-sm text-nuthatch-muted">Name</p>
            <p className="font-medium text-nuthatch-dark">{booking.guestName}</p>
          </div>
          <div>
            <p className="text-sm text-nuthatch-muted">Email</p>
            <p className="font-medium text-nuthatch-dark">{booking.guestEmail}</p>
          </div>
          <div>
            <p className="text-sm text-nuthatch-muted">Phone</p>
            <p className="font-medium text-nuthatch-dark">{booking.guestPhone}</p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-3">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleAddToCalendar}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Add to Calendar
        </Button>

        {onNewBooking && (
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={onNewBooking}
          >
            Make Another Booking
          </Button>
        )}

        <Button 
          variant="ghost" 
          className="w-full"
          onClick={() => window.location.href = '/'}
        >
          Visit Website
        </Button>
      </div>

      {/* Important Information */}
      <Alert>
        <AlertDescription className="text-sm">
          <p className="font-medium text-nuthatch-dark mb-2">Important Information</p>
          <ul className="list-disc list-inside space-y-1 text-nuthatch-muted">
            <li>Please arrive within 15 minutes of your reservation time</li>
            <li>Tables are held for 2 hours from your booking time</li>
            <li>For cancellations, please contact us 24 hours in advance</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
