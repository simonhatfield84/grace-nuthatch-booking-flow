
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Utensils, Clock, Users } from 'lucide-react';
import { BookingService } from '../../services/BookingService';

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
        selectedDate ? selectedDate.toISOString().split('T')[0] : undefined
      );

      return services;
    },
    enabled: !!venueId && partySize > 0
  });

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading services...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Utensils className="h-6 w-6" />
          Select a service
        </CardTitle>
        <CardDescription>
          Choose the type of service for your reservation
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {services.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No services available for your selection.</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your party size or date.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <Card 
                key={service.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
                  selectedService?.id === service.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onServiceSelect(service)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        {service.title}
                      </h3>
                      {service.description && (
                        <p className="text-gray-600 text-sm mb-3">
                          {service.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {service.min_guests}-{service.max_guests} people
                        </Badge>
                        
                        {service.lead_time_hours > 0 && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {service.lead_time_hours}h advance booking
                          </Badge>
                        )}

                        {service.requires_deposit && (
                          <Badge variant="secondary">
                            Deposit required
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {service.image_url && (
                      <div className="ml-4 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                        <img 
                          src={service.image_url} 
                          alt={service.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {selectedService && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-800 text-sm">
              <strong>{selectedService.title}</strong> selected for {partySize} {partySize === 1 ? 'person' : 'people'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
