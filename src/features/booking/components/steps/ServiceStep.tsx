
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Utensils, Clock, Users } from 'lucide-react';
import { BookingService } from '../../services/BookingService';
import { formatDateToYYYYMMDD } from '@/utils/dateUtils';

interface ServiceStepProps {
  selectedService: any;
  onServiceSelect: (service: any) => void;
  partySize: number;
  selectedDate: Date | null;
  venueId: string;
}

export function ServiceStep({
  selectedService,
  onServiceSelect,
  partySize,
  selectedDate,
  venueId
}: ServiceStepProps) {
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['available-services', partySize, selectedDate, venueId],
    queryFn: async () => {
      if (!venueId) return [];

      const services = await BookingService.getAvailableServices(
        venueId,
        partySize,
        selectedDate ? formatDateToYYYYMMDD(selectedDate) : undefined
      );

      return services;
    },
    enabled: !!venueId && partySize > 0
  });

  const handleServiceSelect = (service: any) => {
    console.log(`🍽️ Service selected: ${service.title}`);
    onServiceSelect(service);
    // Auto-advance will be handled by parent component
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading services...</div>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No services available for your selection.</p>
        <p className="text-gray-400 text-sm mt-1">Try adjusting your party size or date.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {services.map((service) => (
        <Card 
          key={service.id}
          className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
            selectedService?.id === service.id 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => handleServiceSelect(service)}
        >
          <CardContent className="p-0">
            <div className="flex flex-col">
              {service.image_url && (
                <div className="w-full h-48 bg-gray-100">
                  <img 
                    src={service.image_url} 
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-6">
                <h3 className="font-semibold text-xl text-gray-900 mb-2">
                  {service.title}
                </h3>
                {service.description && (
                  <p className="text-gray-600 mb-4">
                    {service.description}
                  </p>
                )}
                
                {service.requires_deposit && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      Deposit required
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
