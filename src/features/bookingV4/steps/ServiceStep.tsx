import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { V4BookingData } from "../V4BookingWidget";
import { V4WidgetConfig } from "@/hooks/useV4WidgetConfig";

interface ServiceStepProps {
  bookingData: V4BookingData;
  venueId: string;
  onUpdate: (updates: Partial<V4BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
  config?: V4WidgetConfig;
}

export function ServiceStep({ bookingData, venueId, onUpdate, onNext, onBack, config }: ServiceStepProps) {
  const { data: services, isLoading } = useQuery({
    queryKey: ['services', venueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('venue_id', venueId)
        .eq('active', true)
        .eq('online_bookable', true)
        .order('title');
      
      if (error) throw error;
      return data;
    }
  });

  const handleServiceSelect = (service: any) => {
    onUpdate({ service });
    onNext();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="v4-heading text-2xl font-bold mb-2">Select Service</h2>
        <p className="v4-body text-muted-foreground">Choose the experience you'd like to book</p>
      </div>

      <div className="space-y-4">
        {services?.map((service) => (
          <Card
            key={service.id}
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleServiceSelect(service)}
          >
            <div className="flex items-start gap-4">
              {service.image_url && (
                <img src={service.image_url} alt={service.title} className="w-20 h-20 object-cover rounded" />
              )}
              <div className="flex-1">
                <h3 className="v4-heading font-semibold text-lg">{service.title}</h3>
                {service.description && (
                  <p className="v4-body text-sm text-muted-foreground mt-1">{service.description}</p>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  {service.min_guests}-{service.max_guests} guests
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Button onClick={onBack} variant="outline" className="w-full">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
    </div>
  );
}
