
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wrench, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const PaymentReconciliation = () => {
  const [bookingId, setBookingId] = useState("");
  const [isReconciling, setIsReconciling] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleReconciliation = async () => {
    if (!bookingId) {
      toast.error("Please enter a booking ID");
      return;
    }

    setIsReconciling(true);
    setResult(null);

    try {
      console.log('🔧 Starting manual reconciliation for booking:', bookingId);

      const { data, error } = await supabase.functions.invoke('reconcile-payment', {
        body: { bookingId: parseInt(bookingId) }
      });

      if (error) {
        console.error('Reconciliation error:', error);
        setResult({ success: false, error: error.message });
        toast.error('Reconciliation failed: ' + error.message);
      } else if (data) {
        console.log('✅ Reconciliation result:', data);
        setResult(data);
        if (data.success) {
          toast.success('Payment reconciled successfully!');
        } else {
          toast.error('Reconciliation failed: ' + data.error);
        }
      }
    } catch (err) {
      console.error('Reconciliation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setResult({ success: false, error: errorMessage });
      toast.error('Reconciliation failed: ' + errorMessage);
    } finally {
      setIsReconciling(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Payment Reconciliation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="bookingId">Booking ID</Label>
          <Input
            id="bookingId"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            placeholder="Enter booking ID (e.g., 202)"
            type="number"
          />
        </div>

        <Button 
          onClick={handleReconciliation}
          disabled={isReconciling || !bookingId}
          className="w-full"
        >
          {isReconciling ? (
            <>
              <Wrench className="h-4 w-4 mr-2 animate-spin" />
              Reconciling...
            </>
          ) : (
            <>
              <Wrench className="h-4 w-4 mr-2" />
              Reconcile Payment
            </>
          )}
        </Button>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription>
              {result.success ? (
                <div>
                  <strong>Success!</strong> Payment reconciled for booking {result.bookingId}
                  <br />
                  Payment Intent: {result.paymentIntentId}
                  <br />
                  Amount: £{(result.amount / 100).toFixed(2)}
                </div>
              ) : (
                <div>
                  <strong>Failed:</strong> {result.error}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Manual Reconciliation Tool</strong>
            <br />
            Use this tool when a payment was successful in Stripe but the booking status wasn't updated.
            This will search for the payment in Stripe and create/update the database records accordingly.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
