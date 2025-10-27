import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchServices, Service } from '@/features/bookingAPI';
import { format } from 'date-fns';

interface ServiceStepUIProps {
  venueSlug: string;
  partySize: number;
  selectedDate?: Date;
  selectedService?: Service;
  onServiceSelect: (service: Service) => void;
}

export function ServiceStepUI({ 
  venueSlug, 
  partySize, 
  selectedDate, 
  selectedService, 
  onServiceSelect 
}: ServiceStepUIProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!selectedDate) return;

    const loadServices = async () => {
      setIsLoading(true);
      try {
        const data = await fetchServices(
          venueSlug,
          partySize,
          format(selectedDate, 'yyyy-MM-dd')
        );
        setServices(data);
      } catch (error) {
        console.error('Failed to load services:', error);
        setServices([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadServices();
  }, [venueSlug, partySize, selectedDate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-nuthatch-green" />
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-nuthatch-muted">
          No services available for the selected criteria.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {services.map((service) => (
        <Card
          key={service.id}
          className={cn(
            "cursor-pointer transition-all hover:shadow-lg",
            selectedService?.id === service.id && "border-blue-500 border-2"
          )}
          onClick={() => onServiceSelect(service)}
        >
          {service.image_url && (
            <div className="h-48 overflow-hidden rounded-t-lg">
              <img
                src={service.image_url}
                alt={service.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardHeader>
            <CardTitle className="flex items-center justify-between font-nuthatch-heading text-nuthatch-dark">
              {service.title}
              {service.requires_payment && (
                <Badge variant="secondary" className="ml-2">
                  Deposit required
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-nuthatch-muted font-nuthatch-body">
              {service.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
