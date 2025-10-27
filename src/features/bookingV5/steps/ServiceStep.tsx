import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CoreBookingService } from '@/services/core/BookingService';
import { Loader2 } from 'lucide-react';
import { SafeHtml } from '@/components/SafeHtml';

interface ServiceStepProps {
  venueId: string;
  partySize: number;
  initialService?: string;
  onContinue: (service: any) => void;
}

export function ServiceStep({ venueId, partySize, initialService, onContinue }: ServiceStepProps) {
  const [selectedId, setSelectedId] = useState<string | undefined>(initialService);
  
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services-v5', venueId, partySize],
    queryFn: () => CoreBookingService.getServices(venueId, partySize),
    staleTime: 5 * 60 * 1000
  });
  
  const selectedService = services.find(s => s.id === selectedId);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (services.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No services available for party size {partySize}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-semibold">Select Service</h2>
      
      <div className="space-y-3">
        {services.map(service => (
          <Card
            key={service.id}
            className={`p-4 cursor-pointer transition-all ${
              selectedId === service.id 
                ? 'border-primary ring-2 ring-primary/20' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => setSelectedId(service.id)}
          >
            {service.image_url && (
              <img 
                src={service.image_url} 
                alt={service.title}
                className="w-full h-32 object-cover rounded-md mb-3"
              />
            )}
            
            <h3 className="font-semibold text-lg">{service.title}</h3>
            
            {service.description && (
              <SafeHtml 
                html={service.description} 
                className="text-sm text-muted-foreground mt-2 line-clamp-3"
              />
            )}
            
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span>{service.min_guests}-{service.max_guests} guests</span>
              {service.requires_deposit && (
                <span className="text-primary font-medium">
                  £{(service.deposit_per_guest / 100).toFixed(2)} deposit/guest
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
      
      <Button
        onClick={() => selectedService && onContinue(selectedService)}
        disabled={!selectedService}
        className="w-full h-12 text-base"
        size="lg"
      >
        Continue
      </Button>
    </div>
  );
}
