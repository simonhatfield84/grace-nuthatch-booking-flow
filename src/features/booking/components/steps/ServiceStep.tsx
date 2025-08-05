
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBookingForm } from '../../contexts/BookingFormContext';
import { useServicesData } from '@/hooks/useServicesData';
import { Loader2 } from 'lucide-react';

interface ServiceStepProps {
  onNext: () => void;
}

export const ServiceStep: React.FC<ServiceStepProps> = ({ onNext }) => {
  const { formData, updateFormData } = useBookingForm();
  const { services, isServicesLoading, servicesError } = useServicesData();
  const [selectedService, setSelectedService] = useState<any>(null);

  useEffect(() => {
    if (formData.serviceTitle && services) {
      const initialService = services.find(service => service.title === formData.serviceTitle);
      setSelectedService(initialService || null);
    }
  }, [formData.serviceTitle, services]);

  const handleServiceSelect = (service: any) => {
    setSelectedService(service);
    updateFormData({ serviceTitle: service.title });
  };

  const handleContinue = () => {
    if (selectedService) {
      onNext();
    }
  };

  if (isServicesLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-gray-700 font-medium">Loading services...</p>
      </div>
    );
  }

  if (servicesError) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="text-center">
          <p className="text-red-600 font-medium">Error loading services</p>
          <p className="text-sm text-gray-500 mt-1">
            Failed to load available services. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Select Your Service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {services && services.map((service) => (
            <Button
              key={service.id}
              onClick={() => handleServiceSelect(service)}
              className={`w-full p-6 h-auto ${selectedService?.id === service.id ? 'bg-accent text-accent-foreground' : ''}`}
              variant="outline"
            >
              <div className="text-left">
                <h3 className="font-semibold">{service.title}</h3>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </div>
            </Button>
          ))}

          {selectedService && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Selected: {selectedService.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedService.min_guests}-{selectedService.max_guests} guests • {selectedService.lead_time_hours}h lead time
              </p>
            </div>
          )}

          <Button 
            onClick={handleContinue}
            className="w-full"
            disabled={!selectedService}
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
