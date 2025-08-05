
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBookingForm } from '../../contexts/BookingFormContext';

interface ServiceSelectionStepProps {
  onNext: () => void;
}

export const ServiceSelectionStep: React.FC<ServiceSelectionStepProps> = ({ onNext }) => {
  const { updateFormData } = useBookingForm();

  const handleServiceSelect = (serviceTitle: string) => {
    updateFormData({ serviceTitle });
    onNext();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Select Your Service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => handleServiceSelect('General Dining')}
            className="w-full p-6 h-auto"
            variant="outline"
          >
            <div className="text-left">
              <h3 className="font-semibold">General Dining</h3>
              <p className="text-sm text-muted-foreground">Standard dining experience</p>
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
