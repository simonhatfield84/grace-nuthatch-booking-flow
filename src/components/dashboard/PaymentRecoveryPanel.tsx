
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { RefreshCcw, Search, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RecoveryResult {
  success: boolean;
  bookingId: number;
  stripeStatus?: string;
  bookingUpdated?: boolean;
  emailSent?: boolean;
  message?: string;
  error?: string;
}

export const PaymentRecoveryPanel = () => {
  const [bookingId, setBookingId] = useState("");
  const [isRecovering, setIsRecovering] = useState(false);
  const [isBatchRecovering, setIsBatchRecovering] = useState(false);
  const [results, setResults] = useState<RecoveryResult[]>([]);

  const recoverSingleBooking = async () => {
    if (!bookingId.trim()) {
      toast.error("Please enter a booking ID");
      return;
    }

    setIsRecovering(true);
    try {
      console.log('🔧 Starting single booking recovery for:', bookingId);
      
      const { data, error } = await supabase.functions.invoke('payment-recovery', {
        body: {
          bookingId: parseInt(bookingId)
        }
      });

      if (error) {
        throw error;
      }

      console.log('✅ Recovery result:', data);
      setResults([data]);

      if (data.success) {
        toast.success(data.message || `Booking ${bookingId} recovered successfully`);
      } else {
        toast.error(data.error || 'Recovery failed');
      }

    } catch (error: any) {
      console.error('❌ Recovery error:', error);
      toast.error(`Recovery failed: ${error.message}`);
      setResults([{
        success: false,
        bookingId: parseInt(bookingId),
        error: error.message
      }]);
    } finally {
      setIsRecovering(false);
    }
  };

  const batchRecovery = async () => {
    setIsBatchRecovering(true);
    try {
      console.log('🔧 Starting batch recovery');
      
      const { data, error } = await supabase.functions.invoke('payment-recovery', {
        body: {
          batchCheck: true,
          maxAge: 24 // Last 24 hours
        }
      });

      if (error) {
        throw error;
      }

      console.log('✅ Batch recovery result:', data);
      setResults(data.results || []);

      toast.success(`Batch recovery completed: ${data.successful} successful, ${data.failed} failed`);

    } catch (error: any) {
      console.error('❌ Batch recovery error:', error);
      toast.error(`Batch recovery failed: ${error.message}`);
    } finally {
      setIsBatchRecovering(false);
    }
  };

  const getStatusBadge = (result: RecoveryResult) => {
    if (result.success) {
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Recovered</Badge>;
    } else {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Failed</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCcw className="h-5 w-5" />
          Payment Recovery Tools
        </CardTitle>
        <CardDescription>
          Recover stuck payments and synchronize booking statuses with Stripe
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Single Booking Recovery */}
        <div className="space-y-3">
          <h3 className="font-medium">Single Booking Recovery</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Enter booking ID"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              className="max-w-xs"
            />
            <Button 
              onClick={recoverSingleBooking}
              disabled={isRecovering}
              variant="outline"
            >
              {isRecovering ? (
                <>
                  <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                  Recovering...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Recover Booking
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Batch Recovery */}
        <div className="space-y-3">
          <h3 className="font-medium">Batch Recovery</h3>
          <div className="flex gap-2">
            <Button 
              onClick={batchRecovery}
              disabled={isBatchRecovering}
              variant="outline"
            >
              {isBatchRecovering ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Recover Last 24h
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Checks all bookings with pending/failed payments in the last 24 hours
          </p>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium">Recovery Results</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">Booking {result.bookingId}</span>
                    {getStatusBadge(result)}
                    {result.stripeStatus && (
                      <Badge variant="secondary">Stripe: {result.stripeStatus}</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {result.bookingUpdated && "✅ Status Updated"} 
                    {result.emailSent && " • ✉️ Email Sent"}
                    {result.error && ` • ❌ ${result.error}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Recovery Process:</strong> This tool checks Stripe payment status and updates bookings accordingly. 
            Successful payments will be marked as confirmed and confirmation emails will be sent.
          </AlertDescription>
        </Alert>

      </CardContent>
    </Card>
  );
};
