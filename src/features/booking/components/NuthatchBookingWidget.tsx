import { useState, useEffect } from "react";
import { ChevronRight, Clock, Users, Calendar, CreditCard, Check, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PartyDateStep } from "./steps/PartyDateStep";
import { ServiceStep } from "./steps/ServiceStep";
import { TimeStep } from "./steps/TimeStep";
import { GuestDetailsStep } from "./steps/GuestDetailsStep";
import { PaymentStep } from "./steps/PaymentStep";
import { ConfirmationStep } from "./steps/ConfirmationStep";
import { NuthatchHeader } from "./shared/NuthatchHeader";
import { ProgressIndicator } from "./shared/ProgressIndicator";

export interface BookingData {
  partySize: number;
  date: Date | null;
  service: any | null;
  time: string;
  guestDetails: {
    name: string;
    email: string;
    phone: string;
    notes?: string;
    marketingOptIn: boolean;
    termsAccepted: boolean;
  } | null;
  paymentRequired: boolean;
  paymentAmount: number;
  bookingId: number | null;
}

export interface BookingStep {
  id: string;
  name: string;
  icon: any;
  isValid: boolean;
  isCompleted: boolean;
}

export function NuthatchBookingWidget() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [venue, setVenue] = useState<any>(null);
  
  const [bookingData, setBookingData] = useState<BookingData>({
    partySize: 2,
    date: null,
    service: null,
    time: '',
    guestDetails: null,
    paymentRequired: false,
    paymentAmount: 0,
    bookingId: null,
  });

  const steps: BookingStep[] = [
    {
      id: 'party-date',
      name: 'Party & Date',
      icon: Users,
      isValid: bookingData.partySize >= 1 && bookingData.date !== null,
      isCompleted: bookingData.partySize >= 1 && bookingData.date !== null,
    },
    {
      id: 'service',
      name: 'Service',
      icon: Clock,
      isValid: bookingData.service !== null,
      isCompleted: bookingData.service !== null,
    },
    {
      id: 'time',
      name: 'Time',
      icon: Clock,
      isValid: bookingData.time !== '',
      isCompleted: bookingData.time !== '',
    },
    {
      id: 'details',
      name: 'Details',
      icon: Users,
      isValid: bookingData.guestDetails?.name !== undefined && 
               bookingData.guestDetails?.phone !== undefined &&
               bookingData.guestDetails?.termsAccepted === true,
      isCompleted: bookingData.guestDetails?.termsAccepted === true,
    },
    // Payment is now integrated into details step
    {
      id: 'confirmation',
      name: 'Confirmation',
      icon: Check,
      isValid: bookingData.bookingId !== null,
      isCompleted: bookingData.bookingId !== null,
    },
  ];

  // Load The Nuthatch venue data
  useEffect(() => {
    const loadVenue = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('venues')
          .select('*')
          .eq('slug', 'the-nuthatch')
          .single();

        if (error) {
          console.error('Error loading venue:', error);
          toast({
            title: "Error",
            description: "Could not load venue information. Please try again.",
            variant: "destructive",
          });
          return;
        }

        setVenue(data);
      } catch (error) {
        console.error('Error loading venue:', error);
        toast({
          title: "Error",
          description: "Could not load venue information. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadVenue();
  }, [toast]);

  const updateBookingData = (data: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const renderStep = () => {
    const step = steps[currentStep];
    
    switch (step?.id) {
      case 'party-date':
        return (
          <PartyDateStep
            initialPartySize={bookingData.partySize}
            selectedDate={bookingData.date}
            venueId={venue?.id}
            onContinue={(partySize, date) => {
              updateBookingData({ partySize, date });
              nextStep();
            }}
          />
        );
      case 'service':
        return (
          <ServiceStep
            venueId={venue?.id}
            partySize={bookingData.partySize}
            selectedDate={bookingData.date}
            selectedService={bookingData.service}
            onServiceSelect={(service) => {
              updateBookingData({ 
                service,
                paymentRequired: service?.requires_payment || false,
                paymentAmount: service?.charge_amount_per_guest ? 
                  service.charge_amount_per_guest * bookingData.partySize : 0
              });
              nextStep();
            }}
          />
        );
      case 'time':
        return (
          <TimeStep
            venueId={venue?.id}
            selectedDate={bookingData.date}
            partySize={bookingData.partySize}
            selectedTime={bookingData.time}
            onTimeSelect={(time) => {
              updateBookingData({ time });
              nextStep();
            }}
          />
        );
      case 'details':
        return (
          <GuestDetailsStep
            value={bookingData.guestDetails}
            service={bookingData.service}
            venue={venue}
            partySize={bookingData.partySize}
            date={bookingData.date!}
            time={bookingData.time}
            onChange={(guestDetails, paymentRequired, paymentAmount, bookingId) => {
              updateBookingData({ 
                guestDetails, 
                paymentRequired, 
                paymentAmount,
                bookingId 
              });
              // Skip payment step and go directly to confirmation
              goToStep(steps.length - 1);
            }}
          />
        );
      // Payment is now integrated into the details step
      case 'confirmation':
        return (
          <ConfirmationStep
            bookingData={bookingData}
            venue={venue}
            onBookingId={(bookingId) => updateBookingData({ bookingId })}
          />
        );
      default:
        return <div>Invalid step</div>;
    }
  };

  if (isLoading || !venue) {
    return (
      <div className="min-h-screen bg-nuthatch-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-nuthatch-green mx-auto mb-4" />
          <p className="text-nuthatch-dark font-nuthatch-body">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header - matching Guestplan style */}
        <div className="bg-black text-white p-4 text-center">
          <h1 className="text-xl font-medium">The Nuthatch</h1>
        </div>

        {/* Navigation tabs - simple like Guestplan */}
        <div className="border-b bg-gray-50">
          <div className="flex">
            {steps.slice(0, -1).map((step, index) => (
              <button
                key={step.id}
                onClick={() => goToStep(index)}
                className={`flex-1 px-3 py-2 text-sm font-medium border-r last:border-r-0 ${
                  currentStep === index 
                    ? 'bg-white text-black' 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {step.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[400px]">
          {renderStep()}
        </div>

        {/* Navigation - minimal and clean */}
        {currentStep > 0 && currentStep < steps.length - 1 && (
          <div className="p-4 border-t bg-gray-50 flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            
            {steps[currentStep]?.isValid && (
              <Button
                onClick={nextStep}
                size="sm"
                className="bg-black hover:bg-gray-800 text-white"
              >
                Continue
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}