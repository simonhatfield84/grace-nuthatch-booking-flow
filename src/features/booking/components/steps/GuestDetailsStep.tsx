
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PaymentStep } from "@/components/bookings/PaymentStep";

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
  onNext: (guestDetails: GuestFormData, paymentRequired: boolean, paymentAmount?: number, bookingId?: number) => void;
  onBack: () => void;
  bookingData: {
    partySize: number;
    date: Date | null;
    time: string;
    service: any;
    venue: any;
  };
  venueSlug: string;
}

export function GuestDetailsStep({ onNext, onBack, bookingData, venueSlug }: GuestDetailsStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [bookingId, setBookingId] = useState<number>();
  const [guestData, setGuestData] = useState<GuestFormData | null>(null);

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

  const handleFormSubmit = async (data: GuestFormData) => {
    setIsSubmitting(true);
    setGuestData(data);

    try {
      // Create the booking and determine if payment is required
      const bookingDateTime = new Date(`${bookingData.date?.toISOString().split('T')[0]}T${bookingData.time}`);
      
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          guest_name: data.name,
          email: data.email,
          phone: data.phone || null,
          party_size: bookingData.partySize,
          booking_date: bookingData.date?.toISOString().split('T')[0],
          booking_time: bookingData.time,
          service: bookingData.service?.title || '',
          notes: data.notes || null,
          status: 'pending',
          venue_id: bookingData.venue?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Check if payment is required based on service settings
      let requiresPayment = false;
      let amount = 0;

      if (bookingData.service?.requires_payment && bookingData.service?.price_per_person) {
        requiresPayment = true;
        amount = bookingData.service.price_per_person * bookingData.partySize;
      }

      if (requiresPayment) {
        setPaymentAmount(amount);
        setBookingId(booking.id);
        setShowPayment(true);
      } else {
        // Update booking status to confirmed if no payment required
        await supabase
          .from('bookings')
          .update({ status: 'confirmed' })
          .eq('id', booking.id);

        toast.success('Booking confirmed successfully!');
        onNext(data, false, 0, booking.id);
      }
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast.error(error.message || 'Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    if (guestData && bookingId) {
      toast.success('Payment successful! Your booking is confirmed.');
      onNext(guestData, true, paymentAmount, bookingId);
    }
  };

  const handlePaymentError = (error: string) => {
    toast.error(`Payment failed: ${error}`);
    setShowPayment(false);
  };

  if (showPayment && bookingId && guestData) {
    return (
      <PaymentStep
        amount={paymentAmount}
        description={`Booking for ${bookingData.partySize} people - ${bookingData.service?.title || 'Service'}`}
        bookingId={bookingId}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
        onSkip={() => {
          // Allow skipping payment for testing
          handlePaymentSuccess();
        }}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Details</CardTitle>
        <CardDescription>
          Please provide your contact information to complete your booking
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
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

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Booking...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
