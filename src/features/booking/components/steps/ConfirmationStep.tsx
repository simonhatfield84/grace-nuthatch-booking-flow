
import { CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ConfirmationStepProps {
  bookingData: any;
}

export function ConfirmationStep({ bookingData }: ConfirmationStepProps) {
  const handleBookAnother = () => {
    window.location.reload();
  };

  return (
    <div className="space-y-6 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>

      <div>
        <h2 className="text-2xl font-nuthatch-heading font-light text-nuthatch-dark mb-2">
          Booking Confirmed!
        </h2>
        <p className="text-nuthatch-muted">
          Your reservation has been successfully confirmed
        </p>
      </div>

      <Card className="p-6 bg-nuthatch-light border-nuthatch-border text-left">
        <h3 className="font-semibold text-nuthatch-dark mb-4">Booking Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-nuthatch-muted">Name:</span>
            <span className="text-nuthatch-dark">{bookingData.guestDetails?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-nuthatch-muted">Date:</span>
            <span className="text-nuthatch-dark">
              {bookingData.date?.toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-nuthatch-muted">Time:</span>
            <span className="text-nuthatch-dark">{bookingData.time}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-nuthatch-muted">Party Size:</span>
            <span className="text-nuthatch-dark">{bookingData.partySize}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-nuthatch-muted">Service:</span>
            <span className="text-nuthatch-dark">{bookingData.service?.title}</span>
          </div>
          {bookingData.paymentRequired && (
            <div className="flex justify-between">
              <span className="text-nuthatch-muted">Payment:</span>
              <span className="text-green-600">£{(bookingData.paymentAmount / 100).toFixed(2)} - Confirmed</span>
            </div>
          )}
        </div>
      </Card>

      <div className="space-y-4">
        <p className="text-sm text-nuthatch-muted">
          You should receive a confirmation email shortly. If you have any questions, please contact us directly.
        </p>
        
        <Button 
          onClick={handleBookAnother}
          variant="outline"
          className="w-full"
        >
          Book Another Table
        </Button>
      </div>
    </div>
  );
}
