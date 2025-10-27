import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StripeCardForm } from '@/components/payments/StripeCardForm';
import { AppleGooglePayButton } from '@/components/payments/AppleGooglePayButton';
import { Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PaymentStepProps {
  bookingId: number;
  amount: number;
  description: string;
  onSuccess: () => void;
  onBack: () => void;
}

export function PaymentStep({ bookingId, amount, description, onSuccess, onBack }: PaymentStepProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stripeAvailable, setStripeAvailable] = useState(true);
  const { toast } = useToast();
  
  // Check if Stripe Elements context is available
  useEffect(() => {
    try {
      // Check if we're inside an Elements provider
      const hasStripe = typeof window !== 'undefined' && (window as any).Stripe;
      setStripeAvailable(!!hasStripe);
    } catch {
      setStripeAvailable(false);
    }
  }, []);
  
  useEffect(() => {
    const createIntent = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('create-payment-intent', {
          body: { bookingId }
        });
        
        if (error) throw error;
        
        if (!data?.client_secret) {
          throw new Error('No client secret returned');
        }
        
        setClientSecret(data.client_secret);
      } catch (error: any) {
        console.error('Payment intent creation failed:', error);
        toast({
          title: 'Payment Error',
          description: 'Failed to initialize payment. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    createIntent();
  }, [bookingId, toast]);
  
  // Handle Stripe unavailable
  if (!stripeAvailable) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Payment</h2>
          <Button onClick={onBack} variant="ghost" size="sm">Back</Button>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Card payments are not available for this venue.</strong>
            <br />
            If you were expecting to pay a deposit or booking fee, please contact the venue directly.
          </p>
        </div>
        
        <Button onClick={onSuccess} className="w-full">
          Continue without payment
        </Button>
      </div>
    );
  }
  
  if (isLoading || !clientSecret) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Setting up payment...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Payment</h2>
        <Button onClick={onBack} variant="ghost" size="sm">Back</Button>
      </div>
      
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Amount Due</p>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <p className="text-2xl font-bold text-primary">
            £{(amount / 100).toFixed(2)}
          </p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CreditCard className="h-4 w-4" />
          <span>Pay with card</span>
        </div>
        
        <StripeCardForm 
          clientSecret={clientSecret}
          amount={amount}
          description={description}
          onSuccess={onSuccess}
          onError={(error) => {
            toast({
              title: 'Payment Failed',
              description: error,
              variant: 'destructive'
            });
          }}
        />
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or pay with
            </span>
          </div>
        </div>
        
        <AppleGooglePayButton 
          clientSecret={clientSecret}
          amount={amount}
          description={description}
          onSuccess={onSuccess}
          onError={(error) => {
            toast({
              title: 'Payment Failed',
              description: error,
              variant: 'destructive'
            });
          }}
        />
      </div>
    </div>
  );
}
