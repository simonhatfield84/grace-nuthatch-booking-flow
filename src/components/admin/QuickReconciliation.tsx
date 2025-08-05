
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wrench, AlertTriangle } from "lucide-react";
import { reconcilePayment } from "@/utils/paymentReconciliation";

interface BookingData {
  id: string;
  paymentIntentId: string;
  amountCents: string;
  description: string;
}

const AFFECTED_BOOKINGS: BookingData[] = [
  {
    id: "172",
    paymentIntentId: "pi_3RsuJUDM4pTo4uXG0H4gVAaJ",
    amountCents: "5990",
    description: "BK-2025-000162"
  },
  {
    id: "173", // Assuming this is the ID for BK-2025-000163
    paymentIntentId: "", // This will need to be filled in
    amountCents: "5990", // Assuming same amount
    description: "BK-2025-000163"
  }
];

export const QuickReconciliation = () => {
  const [isReconciling, setIsReconciling] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(AFFECTED_BOOKINGS[0]);

  const handleReconcile = async () => {
    setIsReconciling(true);
    
    try {
      await reconcilePayment({
        bookingId: parseInt(selectedBooking.id),
        paymentIntentId: selectedBooking.paymentIntentId,
        amountCents: parseInt(selectedBooking.amountCents),
        stripeStatus: 'succeeded'
      });
    } catch (error) {
      console.error('Reconciliation failed:', error);
    } finally {
      setIsReconciling(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Critical Payment Reconciliation
        </CardTitle>
        <CardDescription>
          Fix webhook failures for affected bookings (BK-2025-000162 & BK-2025-000163)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Webhook Issue Detected:</strong> Stripe webhooks are failing due to JWT authentication. 
            Use this tool to manually reconcile affected bookings until the webhook is fixed.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label htmlFor="booking-select">Select Booking</Label>
            <select 
              id="booking-select"
              value={selectedBooking.id}
              onChange={(e) => setSelectedBooking(AFFECTED_BOOKINGS.find(b => b.id === e.target.value) || AFFECTED_BOOKINGS[0])}
              className="w-full p-2 border rounded-md"
            >
              {AFFECTED_BOOKINGS.map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {booking.description} (ID: {booking.id})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bookingId">Booking ID</Label>
              <Input
                id="bookingId"
                value={selectedBooking.id}
                onChange={(e) => setSelectedBooking({...selectedBooking, id: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="amountCents">Amount (pence)</Label>
              <Input
                id="amountCents"
                value={selectedBooking.amountCents}
                onChange={(e) => setSelectedBooking({...selectedBooking, amountCents: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="paymentIntentId">Stripe Payment Intent ID</Label>
            <Input
              id="paymentIntentId"
              value={selectedBooking.paymentIntentId}
              onChange={(e) => setSelectedBooking({...selectedBooking, paymentIntentId: e.target.value})}
              placeholder="pi_xxxxxxxxxxxxxxxxxxxxx"
            />
          </div>

          <Button
            onClick={handleReconcile}
            disabled={isReconciling || !selectedBooking.id || !selectedBooking.paymentIntentId || !selectedBooking.amountCents}
            className="w-full"
          >
            <Wrench className="h-4 w-4 mr-2" />
            {isReconciling ? 'Reconciling...' : 'Reconcile Payment & Send Confirmation'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
