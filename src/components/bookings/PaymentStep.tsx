// 🚨 DEPRECATED: This component is not used by the canonical NuthatchBookingWidget
// NuthatchBookingWidget has integrated payment handling in GuestDetailsStep
// This file will be removed in a future cleanup

console.warn('⚠️ DEPRECATED: PaymentStep is not used by NuthatchBookingWidget (payments integrated in GuestDetailsStep).');

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, AlertCircle } from "lucide-react";
import { PaymentForm } from "@/components/payments/PaymentForm";

interface PaymentStepProps {
  amount: number;
  description: string;
  bookingId?: number;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
  onSkip?: () => void;
}

export const PaymentStep = ({
  amount,
  description,
  bookingId,
  onPaymentSuccess,
  onPaymentError,
  onSkip
}: PaymentStepProps) => {
  return (
    <Card className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900">
      <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
        <CardTitle className="text-2xl text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          Payment Required
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          Complete your booking by processing payment
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4 bg-white dark:bg-gray-900">
        <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{description}</p>
            {bookingId && (
              <p className="text-sm text-muted-foreground">Booking ID: {bookingId}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">£{amount.toFixed(2)}</p>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This is a simplified payment interface. In production, this would integrate with Stripe Elements for secure card processing.
          </AlertDescription>
        </Alert>

        {bookingId ? (
          <PaymentForm
            bookingId={bookingId}
            amount={amount}
            description={description}
            onPaymentSuccess={onPaymentSuccess}
            onPaymentError={onPaymentError}
          />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your booking will be created and then you'll be redirected to complete payment.
            </p>
            <div className="flex gap-2">
              <Button onClick={onPaymentSuccess} className="flex-1">
                Continue to Payment
              </Button>
              {onSkip && (
                <Button variant="outline" onClick={onSkip}>
                  Skip Payment
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
