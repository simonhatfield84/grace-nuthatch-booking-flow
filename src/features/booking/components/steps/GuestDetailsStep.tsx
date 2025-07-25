
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, ChevronLeft } from 'lucide-react';
import { calculatePaymentAmount } from '@/utils/paymentCalculation';

const guestFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(1, "Phone number is required"),
  notes: z.string().optional(),
  marketingOptIn: z.boolean().default(false),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions to proceed"
  }),
});

type GuestFormData = z.infer<typeof guestFormSchema>;

interface GuestDetailsStepProps {
  bookingData: any;
  onSubmit: (guestDetails: GuestFormData, bookingId: number, paymentRequired: boolean, paymentAmount: number) => void;
  onBack: () => void;
}

export function GuestDetailsStep({ bookingData, onSubmit, onBack }: GuestDetailsStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [termsAndConditions, setTermsAndConditions] = useState('');

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

  const handleSubmit = async (data: GuestFormData) => {
    setIsLoading(true);
    
    try {
      // Create booking
      const bookingDateTime = new Date(`${bookingData.date!.toISOString().split('T')[0]}T${bookingData.time}`);
      const endTime = new Date(bookingDateTime.getTime() + (2 * 60 * 60 * 1000));

      const { data: venue } = await supabase
        .from('venues')
        .select('id')
        .eq('slug', 'nuthatch')
        .single();

      if (!venue) {
        throw new Error('Venue not found');
      }

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          guest_name: data.name,
          email: data.email,
          phone: data.phone,
          party_size: bookingData.partySize,
          booking_date: bookingData.date!.toISOString().split('T')[0],
          booking_time: bookingData.time,
          service: bookingData.service?.title || 'Dinner',
          notes: data.notes || null,
          status: 'confirmed',
          duration_minutes: 120,
          end_time: endTime.toTimeString().split(' ')[0],
          venue_id: venue.id,
        })
        .select()
        .single();

      if (bookingError) {
        throw bookingError;
      }

      // Check if payment is required
      let paymentRequired = false;
      let paymentAmount = 0;

      if (bookingData.service?.id) {
        const paymentCalculation = await calculatePaymentAmount(
          bookingData.service.id,
          bookingData.partySize,
          venue.id
        );
        paymentRequired = paymentCalculation.shouldCharge;
        paymentAmount = paymentCalculation.amount;
      }

      toast.success('Booking details saved successfully!');
      onSubmit(data, booking.id, paymentRequired, paymentAmount);

    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast.error(error.message || 'Failed to create booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div>
        <h2 className="text-2xl font-nuthatch-heading font-light text-nuthatch-dark mb-2">
          Your Details
        </h2>
        <p className="text-nuthatch-muted">
          Please provide your contact information to complete your reservation
        </p>
      </div>

      <Card className="p-6 bg-nuthatch-light border-nuthatch-border">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-nuthatch-dark">Full Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your full name" 
                      {...field} 
                      className="bg-nuthatch-white border-nuthatch-border"
                    />
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
                  <FormLabel className="text-nuthatch-dark">Email Address *</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="Enter your email" 
                      {...field} 
                      className="bg-nuthatch-white border-nuthatch-border"
                    />
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
                  <FormLabel className="text-nuthatch-dark">Phone Number *</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel" 
                      placeholder="Enter your phone number" 
                      {...field} 
                      className="bg-nuthatch-white border-nuthatch-border"
                    />
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
                  <FormLabel className="text-nuthatch-dark">Special Requests</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any dietary requirements, special occasions, or other requests..."
                      {...field}
                      className="bg-nuthatch-white border-nuthatch-border"
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
                    <FormLabel className="text-nuthatch-dark">
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
                    <FormLabel className="text-nuthatch-dark">
                      I accept the terms and conditions *
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full bg-nuthatch-green hover:bg-nuthatch-dark text-nuthatch-white"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Booking...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
}
