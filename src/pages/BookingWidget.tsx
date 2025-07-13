
import { useState } from "react";
import { useParams } from "react-router-dom";
import { BookingFlowManager, BookingStep } from "@/components/bookings/BookingFlowManager";
import { Progress } from "@/components/ui/progress";

const BookingWidget = () => {
  const { slug } = useParams<{ slug: string }>();
  const [currentStep, setCurrentStep] = useState<BookingStep>('date');

  if (!slug) {
    return <div>Invalid venue</div>;
  }

  const getStepProgress = (step: BookingStep): number => {
    const stepMap: Record<BookingStep, number> = {
      'date': 16,
      'time': 32,
      'party': 48,
      'service': 64,
      'details': 80,
      'payment': 90,
      'confirmation': 100,
    };
    return stepMap[step] || 0;
  };

  const getStepTitle = (step: BookingStep): string => {
    const titleMap: Record<BookingStep, string> = {
      'date': 'Select Date',
      'time': 'Choose Time',
      'party': 'Party Size',
      'service': 'Select Service',
      'details': 'Your Details',
      'payment': 'Payment',
      'confirmation': 'Confirmed',
    };
    return titleMap[step] || '';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto">
          {currentStep !== 'confirmation' && (
            <div className="mb-8">
              <div className="text-center mb-4">
                <h1 className="text-2xl font-bold text-foreground">Make a Reservation</h1>
                <p className="text-muted-foreground">{getStepTitle(currentStep)}</p>
              </div>
              <Progress value={getStepProgress(currentStep)} className="h-2" />
            </div>
          )}

          <BookingFlowManager 
            venueSlug={slug} 
            onStepChange={setCurrentStep}
          />
        </div>
      </div>
    </div>
  );
};

export default BookingWidget;
