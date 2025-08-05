
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
import { Loader2 } from "lucide-react";
import { calculatePaymentAmount } from "@/utils/paymentCalculation";

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

interface GuestDetailsFormProps {
  onSubmit: (guestDetails: GuestFormData, paymentRequired: boolean) => void;
  bookingData: {
    date: string;
    time: string;
    partySize: number;
    service: string;
  };
}

export const GuestDetailsForm = ({ onSubmit, bookingData }: GuestDetailsFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const { toast } = useToast();

  const form = useForm<GuestFormData>({
    resolver: zodResolver(guestFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      notes: "",
      marketingOptIn: false,
      termsAccepted: false,
    },
  });

  useEffect(() => {
    const checkPaymentAndTerms = async () => {
      try {
        // Get service details including terms
        const { data: service } = await supabase
          .from('services')
          .select('*')
          .eq('title', bookingData.service)
          .single();

        if (service) {
          // Set terms - use service terms or default terms
          const serviceTerms = service.terms_and_conditions;
          const defaultTerms = localStorage.getItem('standardTerms') || '';
          setTermsAndConditions(serviceTerms || defaultTerms);

          // Calculate payment requirement
          const venueId = service.venue_id;
          const paymentCalculation = await calculatePaymentAmount(
            service.id,
            bookingData.partySize,
            venueId
          );

          setPaymentRequired(paymentCalculation.shouldCharge);
          setPaymentAmount(paymentCalculation.amount);
        }
      } catch (error) {
        console.error('Error checking payment requirements and terms:', error);
        // Set default terms if service lookup fails
        const defaultTerms = localStorage.getItem('standardTerms') || '';
        setTermsAndConditions(defaultTerms);
      }
    };

    checkPaymentAndTerms();
  }, [bookingData.service, bookingData.partySize]);

  const handleSubmit = async (data: GuestFormData) => {
    setIsLoading(true);
    try {
      // Create or update guest in database
      const { data: existingGuest } = await supabase
        .from('guests')
        .select('*')
        .eq('email', data.email)
        .maybeSingle();

      let guestId: string;

      if (existingGuest) {
        // Update existing guest
        const { data: updatedGuest, error } = await supabase
          .from('guests')
          .update({
            name: data.name,
            phone: data.phone || null,
            notes: data.notes || null,
            opt_in_marketing: data.marketingOptIn,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingGuest.id)
          .select()
          .single();

        if (error) throw error;
        guestId = updatedGuest.id;
      } else {
        // Create new guest - we need venue_id, so let's get it from the current venue
        const { data: venues } = await supabase
          .from('venues')
          .select('id')
          .limit(1)
          .single();

        if (!venues) throw new Error('Unable to find venue');

        const { data: newGuest, error } = await supabase
          .from('guests')
          .insert({
            name: data.name,
            email: data.email,
            phone: data.phone || null,
            notes: data.notes || null,
            opt_in_marketing: data.marketingOptIn,
            venue_id: venues.id,
          })
          .select()
          .single();

        if (error) throw error;
        guestId = newGuest.id;
      }

      // Create the booking
      const bookingDateTime = new Date(`${bookingData.date}T${bookingData.time}`);
      const endTime = new Date(bookingDateTime.getTime() + (2 * 60 * 60 * 1000)); // Default 2 hours

      const { data: venues } = await supabase
        .from('venues')
        .select('id')
        .limit(1)
        .single();

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          guest_name: data.name,
          email: data.email,
          phone: data.phone || null,
          party_size: bookingData.partySize,
          booking_date: bookingData.date,
          booking_time: bookingData.time,
          service: bookingData.service,
          notes: data.notes || null,
          status: 'confirmed',
          duration_minutes: 120,
          end_time: endTime.toTimeString().split(' ')[0],
          venue_id: venues?.id,
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      toast({
        title: "Booking details saved",
        description: "Your information has been saved successfully.",
      });

      // Pass the guest details and payment requirement to parent
      onSubmit(data, paymentRequired);
      
    } catch (error: any) {
      console.error('Error saving guest details:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save booking details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Details</CardTitle>
        <CardDescription>
          Please provide your contact information to complete your reservation
        </CardDescription>
      </CardHeader>
      <CardContent>
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

            {paymentRequired && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  This booking requires a payment of £{paymentAmount.toFixed(2)}. You'll be redirected to payment after confirming your details.
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : paymentRequired ? (
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
