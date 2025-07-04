
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar, Clock, Users, Edit, Trash2, Copy, Eye, ChevronDown, Settings } from "lucide-react";
import { format } from "date-fns";

interface ServiceCardProps {
  service: any;
  serviceTags: any[];
  serviceWindows: any[];
  isLoadingWindows: boolean;
  windowsError: any;
  onEdit: (service: any) => void;
  onDuplicate: (service: any) => void;
  onDelete: (serviceId: string) => void;
  onToggleActive: (serviceId: string) => void;
  onManageWindows: (serviceId: string) => void;
}

export const ServiceCard = ({
  service,
  serviceTags,
  serviceWindows,
  isLoadingWindows,
  windowsError,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleActive,
  onManageWindows
}: ServiceCardProps) => {
  const durationRules = Array.isArray(service.duration_rules) ? service.duration_rules : [];

  return (
    <Card key={service.id} className={`overflow-hidden ${!service.active ? 'opacity-75' : ''}`}>
      <div className="aspect-video bg-muted bg-cover bg-center" 
           style={{ backgroundImage: service.image_url ? `url(${service.image_url})` : 'none' }} />
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2 mb-2">
              {service.title}
              {service.is_secret && (
                <Badge variant="outline" className="text-xs">
                  <Eye className="h-3 w-3 mr-1" />
                  Secret
                </Badge>
              )}
            </CardTitle>
            
            {/* Tags Display - Prominent under title */}
            {serviceTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {serviceTags.map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="text-xs flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex gap-1">
            {service.online_bookable && (
              <Badge variant="secondary">Online</Badge>
            )}
            {service.active ? (
              <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
            ) : (
              <Badge variant="outline" className="text-gray-500 border-gray-500">Inactive</Badge>
            )}
          </div>
        </div>
        <CardDescription className="text-sm">{service.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Key Metrics - Always visible */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
            <span>{service.min_guests}-{service.max_guests} guests</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
            <span>{service.lead_time_hours}h lead</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
            <span>{service.cancellation_window_hours}h cancel</span>
          </div>
          {service.requires_deposit && (
            <div className="text-sm font-medium">
              £{service.deposit_per_guest} deposit
            </div>
          )}
        </div>

        {/* Collapsible Duration Rules */}
        {durationRules.length > 0 && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded bg-muted/50 hover:bg-muted text-sm">
              <span className="font-medium">{durationRules.length} Duration Rules</span>
              <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-2">
              {durationRules.map((rule: any, index: number) => (
                <div key={rule.id || index} className="text-xs bg-muted p-2 rounded">
                  {rule.minGuests}-{rule.maxGuests} guests: {rule.durationMinutes} minutes
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Enhanced Booking Windows Display with Debug Info */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label className="text-sm font-medium">
              Booking Windows 
              {isLoadingWindows && <span className="text-xs text-muted-foreground">(Loading...)</span>}
              {windowsError && <span className="text-xs text-red-500">(Error loading)</span>}
            </Label>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onManageWindows(service.id)}
            >
              <Settings className="h-3 w-3 mr-1" />
              Manage
            </Button>
          </div>
          
          {serviceWindows.length > 0 ? (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {serviceWindows.map((window) => (
                <div key={window.id} className="text-xs bg-muted p-3 rounded">
                  <div className="font-medium mb-1">
                    {window.days.join(", ")} • {window.start_time}-{window.end_time}
                  </div>
                  
                  {(window.start_date || window.end_date) && (
                    <div className="text-muted-foreground mb-1">
                      {window.start_date && window.start_date instanceof Date && !isNaN(window.start_date.getTime()) 
                        ? format(window.start_date, 'MMM d, yyyy')
                        : 'Invalid start date'
                      }
                      {window.end_date && window.end_date instanceof Date && !isNaN(window.end_date.getTime()) 
                        ? ` - ${format(window.end_date, 'MMM d, yyyy')}`
                        : !window.end_date && window.start_date ? " (ongoing)" : ''
                      }
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Max {window.max_bookings_per_slot} bookings</span>
                    {window.blackout_periods && window.blackout_periods.length > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {window.blackout_periods.length} blackout{window.blackout_periods.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
              No booking windows configured
              {!isLoadingWindows && !windowsError && (
                <div className="mt-1 text-[10px]">
                  Service ID: {service.id}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions - Grouped better */}
        <div className="flex gap-2 pt-2 border-t">
          <div className="flex gap-1 flex-1">
            <Button variant="outline" size="sm" onClick={() => onEdit(service)}>
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onDuplicate(service)}
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onToggleActive(service.id)}
              className={service.active ? "text-orange-600" : "text-green-600"}
            >
              {service.active ? "Deactivate" : "Activate"}
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onDelete(service.id)}
            className="text-red-600"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
