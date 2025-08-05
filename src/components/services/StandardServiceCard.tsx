
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Calendar, CreditCard, ShieldCheck } from "lucide-react";
import { getBookingWindowSummary } from "@/utils/bookingWindowHelpers";

interface StandardServiceCardProps {
  service: any;
  serviceWindows: any[];
  isLoadingWindows: boolean;
  onEdit: (service: any) => void;
  onDuplicate: (service: any) => void;
  onToggleActive: (serviceId: string) => void;
  onDelete: (serviceId: string) => void;
}

export const StandardServiceCard = ({
  service,
  serviceWindows,
  isLoadingWindows,
  onEdit,
  onDuplicate,
  onToggleActive,
  onDelete
}: StandardServiceCardProps) => {
  const formatPrice = (pence: number) => {
    return `£${(pence / 100).toFixed(2)}`;
  };

  const availabilitySummary = getBookingWindowSummary(serviceWindows);

  return (
    <Card className={`h-full flex flex-col hover:shadow-md transition-shadow ${!service.active ? 'opacity-60 bg-muted/20' : ''}`}>
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-lg line-clamp-1 ${!service.active ? 'text-muted-foreground' : ''}`}>
            {service.title}
          </CardTitle>
          <div className="flex gap-2 flex-shrink-0">
            {service.requires_payment && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                Payment
              </Badge>
            )}
            {service.active ? (
              <Badge variant="default">Active</Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground border-muted-foreground/50">
                Inactive
              </Badge>
            )}
          </div>
        </div>
        
        <CardDescription className="line-clamp-2 min-h-[2.5rem]">
          {service.description || "No description provided"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Key metrics - fixed height section */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{service.min_guests}-{service.max_guests} guests</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{service.lead_time_hours}h lead time</span>
          </div>
        </div>
        
        {/* Availability Summary - fixed height section */}
        <div className="flex items-center gap-2 text-sm min-h-[1.5rem]">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className={isLoadingWindows ? "text-muted-foreground" : ""}>
            {isLoadingWindows ? "Loading..." : availabilitySummary}
          </span>
        </div>
        
        {/* Payment info - expandable but controlled height */}
        {service.requires_payment && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Payment Required
              </p>
              {service.auto_refund_enabled && (
                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                  <ShieldCheck className="h-3 w-3" />
                  Auto-refunds
                </Badge>
              )}
            </div>
            <div className="text-sm">
              {service.charge_type === 'all_reservations' && (
                <span>{formatPrice(service.charge_amount_per_guest)} per guest</span>
              )}
              {service.charge_type === 'large_groups' && (
                <span>
                  {formatPrice(service.charge_amount_per_guest)} per guest 
                  (groups of {service.minimum_guests_for_charge}+)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Spacer to push buttons to bottom */}
        <div className="flex-1"></div>

        {/* Action buttons - fixed at bottom */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(service)}
            className="flex-1"
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDuplicate(service)}
          >
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleActive(service.id)}
            className={service.active ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
          >
            {service.active ? "Deactivate" : "Activate"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(service.id)}
            className="text-red-600 hover:text-red-700"
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
