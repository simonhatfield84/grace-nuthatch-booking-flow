import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  title: string;
  description: string;
  requires_deposit: boolean;
  image_url?: string | null;
}

interface ServiceStepUIProps {
  selectedService?: Service;
  onServiceSelect: (service: Service) => void;
}

// Stub services
const STUB_SERVICES: Service[] = [
  {
    id: 'service-1',
    title: 'Drinks Table Reservation',
    description: 'Reserve a table for drinks and light bites',
    requires_deposit: true,
    image_url: null,
  },
  {
    id: 'service-2',
    title: 'Dinner Reservation',
    description: 'Full dining experience with seasonal menu',
    requires_deposit: false,
    image_url: null,
  },
];

export function ServiceStepUI({ selectedService, onServiceSelect }: ServiceStepUIProps) {
  const services = STUB_SERVICES;

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
              {service.requires_deposit && (
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
