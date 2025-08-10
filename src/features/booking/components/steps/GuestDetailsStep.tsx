import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { calculateEnhancedPaymentAmount } from "@/utils/enhancedPaymentCalculation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePaymentErrorHandling } from "@/hooks/usePaymentErrorHandling";

const guestFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  notes: z.string().optional(),
  marketingOptIn: z.boolean().default(false),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions to proceed"
  }),
});

type GuestFormData = z.infer<typeof guestFormSchema>;

interface GuestDetailsStepProps {
  bookingData?: {
    date: string;
    time: string;
    partySize: number;
    service: string;
  };
  guestDetails?: GuestFormData | null;
  onGuestDetailsChange?: (guestDetails: GuestFormData) => void;
  onNext?: () => void;
  venueSlug?: string;
  
  value?: GuestFormData | null;
  service?: any;
  venue?: any;
  partySize?: number;
  date?: Date;
  time?: string;
  onChange?: (guestDetails: any, paymentRequired: any, paymentAmount: any, bookingId?: any) => void;
}

const GuestDetailsStep = (props: GuestDetailsStepProps) => {
  const {
    bookingData,
    guestDetails,
    onGuestDetailsChange,
    onNext,
    venueSlug,
    value,
    service,
    venue,
    partySize,
    date,
    time,
    onChange
  } = props;

  const normalizedGuestDetails = guestDetails || value;
  const normalizedService = bookingData?.service || service;
  const normalizedVenue = venue;
  const normalizedPartySize = bookingData?.partySize || partySize || 2;
  const normalizedDate = bookingData?.date || (date ? date.toISOString().split('T')[0] : '');
  const normalizedTime = bookingData?.time || time || '';

  const [isLoading, setIsLoading] = useState(false);
  const [paymentCalculation, setPaymentCalculation] = useState<any>(null);
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const { toast } = useToast();

  const [paymentInProgress, setPaymentInProgress] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  const form = useForm<GuestFormData>({
    resolver: zodResolver(guestFormSchema),
    defaultValues: normalizedGuestDetails || {
      name: "",
      email: "",
      phone: "",
      notes: "",
      marketingOptIn: false,
      termsAccepted: false,
    },
    mode: "onChange",
  });

  const [venueData, setVenueData] = useState<{ id: string } | null>(null);

  useEffect(() => {
    const fetchVenueData = async () => {
      try {
        if (normalizedVenue?.id) {
          setVenueData({ id: normalizedVenue.id });
          return;
        }

        if (venueSlug) {
          const { data, error } = await supabase
            .from('venues')
            .select('id')
            .eq('slug', venueSlug)
            .single();

          if (error) {
            console.error('Error fetching venue data:', error);
            toast({
              title: "Error",
              description: "Failed to load venue information. Please refresh.",
              variant: "destructive"
            });
            return;
          }

          setVenueData({ id: data.id });
        }
      } catch (error) {
        console.error('Error fetching venue data:', error);
        toast({
          title: "Error", 
          description: "Failed to load venue information. Please refresh.",
          variant: "destructive"
        });
      }
    };

    fetchVenueData();
  }, [venueSlug, normalizedVenue, toast]);

  useEffect(() => {
    const checkPaymentAndTerms = async () => {
      if (!venueData?.id) return;

      try {
        const { data: serviceData } = await supabase
          .from('services')
          .select('*')
          .eq('title', normalizedService)
          .single();

        if (serviceData) {
          const serviceTerms = serviceData.terms_and_conditions;
          const defaultTerms = localStorage.getItem('standardTerms') || '';
          setTermsAndConditions(serviceTerms || defaultTerms);

          const calculation = await calculateEnhancedPaymentAmount(
            serviceData.id,
            normalizedPartySize,
            venueData.id
          );

          setPaymentCalculation(calculation);
        }
      } catch (error) {
        console.error('Error checking payment requirements and terms:', error);
        const defaultTerms = localStorage.getItem('standardTerms') || '';
        setTermsAndConditions(defaultTerms);
      }
    };

    if (venueData) {
      checkPaymentAndTerms();
    }
  }, [normalizedService, normalizedPartySize, venueData]);

  const initiatePayment = async (formData: GuestFormData) => {
    if (!venueData?.id || !paymentCalculation) {
      console.error('Missing venue data or payment calculation');
      setPaymentError('Venue information not available. Please refresh and try again.');
      return;
    }

    setPaymentInProgress(true);
    setPaymentError(null);

    try {
      console.log('Initiating payment with venue:', venueData.id);
      
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          bookingId: null,
          amount: paymentCalculation.amount,
          currency: 'gbp',
          description: paymentCalculation.description,
          venue_id: venueData.id
        }
      });

      if (error) {
        console.error('Payment intent creation error:', error);
        throw new Error(error.message || 'Failed to initialize payment');
      }

      if (!data.success) {
        console.error('Payment intent failed:', data);
        throw new Error(data.error || 'Payment initialization failed');
      }

      if (!data.client_secret) {
        console.error('No client secret received:', data);
        throw new Error('Invalid payment response - missing client secret');
      }

      console.log('Payment intent created successfully');
      
      const paymentUrl = `/payment/${data.payment_intent_id}`;
      window.location.href = paymentUrl;

    } catch (error: any) {
      console.error('Payment initiation error:', error);
      const errorMessage = error.message || 'Failed to initialize payment';
      
      if (retryCount < maxRetries && (
        errorMessage.includes('network') || 
        errorMessage.includes('timeout') ||
        errorMessage.includes('temporarily unavailable')
      )) {
        console.log(`Retrying payment initiation (attempt ${retryCount + 1}/${maxRetries + 1})`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => initiatePayment(formData), 1000 * (retryCount + 1));
        return;
      }

      let userErrorMessage = errorMessage;
      if (errorMessage.includes('not configured')) {
        userErrorMessage = 'Payment system is not configured for this venue. Please contact support.';
      } else if (errorMessage.includes('not enabled')) {
        userErrorMessage = 'Payments are currently disabled for this venue. Please contact them directly.';
      } else if (errorMessage.includes('decrypt')) {
        userErrorMessage = 'Payment configuration error. Please contact the venue.';
      } else if (errorMessage.includes('Invalid Stripe key')) {
        userErrorMessage = 'Payment system configuration error. Please contact support.';
      }

      setPaymentError(userErrorMessage);
      toast({
        title: "Payment Error",
        description: userErrorMessage,
        variant: "destructive"
      });
    } finally {
      setPaymentInProgress(false);
    }
  };

  const handleSubmit = async (data: GuestFormData) => {
    setIsLoading(true);
    setPaymentError(null);

    try {
      if (!venueData?.id) {
        throw new Error('Venue information not available. Please refresh.');
      }

      if (paymentCalculation?.shouldCharge) {
        initiatePayment(data);
      } else {
        if (onGuestDetailsChange && onNext) {
          onGuestDetailsChange(data);
          onNext();
        } else if (onChange) {
          onChange(data, false, 0);
        }
      }
    } catch (error: any) {
      console.error('Error in submit:', error);
      setPaymentError(error.message || 'An unexpected error occurred.');
      toast({
        title: "Error",
        description: error.message || 'An unexpected error occurred.',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white">
      <CardHeader>
        <CardTitle>Your Details</CardTitle>
        <CardDescription>
          Please provide your contact information to complete your reservation
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter your email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="Enter your phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Requests</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any dietary requirements, special occasions, or other requests..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="marketingOptIn"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Keep me updated about special offers and events
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {termsAndConditions && (
              <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Terms and Conditions</h4>
                  <div className="max-h-32 overflow-y-auto text-xs text-muted-foreground whitespace-pre-wrap border rounded p-2 bg-background">
                    {termsAndConditions}
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="termsAccepted"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I accept the terms and conditions *
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            )}

        {paymentError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{paymentError}</span>
              {retryCount < maxRetries && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setPaymentError(null);
                    setRetryCount(prev => prev + 1);
                    const currentFormData = form.getValues();
                    initiatePayment(currentFormData);
                  }}
                  disabled={paymentInProgress}
                >
                  Retry
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

            {paymentCalculation?.shouldCharge && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  This booking requires a payment of £{(paymentCalculation.amount / 100).toFixed(2)}. You'll be redirected to payment after confirming your details.
                </p>
              </div>
            )}

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading || paymentInProgress}
        >
          {isLoading || paymentInProgress ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {paymentInProgress ? 'Initializing Payment...' : 'Saving...'}
            </>
          ) : paymentCalculation?.shouldCharge ? (
            'Continue to Payment'
          ) : (
            'Complete Booking'
          )}
        </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default GuestDetailsStep;
