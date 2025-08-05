
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wrench, AlertTriangle } from "lucide-react";
import { reconcilePayment } from "@/utils/paymentReconciliation";

export const QuickReconciliation = () => {
  const [isReconciling, setIsReconciling] = useState(false);
  const [bookingId, setBookingId] = useState("172");
  const [paymentIntentId, setPaymentIntentId] = useState("pi_3RsuJUDM4pTo4uXG0H4gVAaJ");
  const [amountCents, setAmountCents] = useState("5990");

  const handleReconcile = async () => {
    setIsReconciling(true);
    
    try {
      await reconcilePayment({
        bookingId: parseInt(bookingId),
        paymentIntentId,
        amountCents: parseInt(amountCents),
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
          Quick Payment Reconciliation
        </CardTitle>
        <CardDescription>
          Manually reconcile payment for booking BK-2025-000162
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This tool is pre-filled with data for booking BK-2025-000162. 
            Use this to fix the immediate webhook issue.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bookingId">Booking ID</Label>
            <Input
              id="bookingId"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              placeholder="172"
            />
          </div>
          <div>
            <Label htmlFor="amountCents">Amount (pence)</Label>
            <Input
              id="amountCents"
              value={amountCents}
              onChange={(e) => setAmountCents(e.target.value)}
              placeholder="5990"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="paymentIntentId">Stripe Payment Intent ID</Label>
          <Input
            id="paymentIntentId"
            value={paymentIntentId}
            onChange={(e) => setPaymentIntentId(e.target.value)}
            placeholder="pi_3RsuJUDM4pTo4uXG0H4gVAaJ"
          />
        </div>

        <Button
          onClick={handleReconcile}
          disabled={isReconciling || !bookingId || !paymentIntentId || !amountCents}
          className="w-full"
        >
          <Wrench className="h-4 w-4 mr-2" />
          {isReconciling ? 'Reconciling...' : 'Reconcile Payment'}
        </Button>
      </CardContent>
    </Card>
  );
};
