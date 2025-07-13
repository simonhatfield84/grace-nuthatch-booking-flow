
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, Clock, Users } from 'lucide-react';
import { useRealTimeAvailability } from '@/hooks/useRealTimeAvailability';

interface EnhancedTimeSlotSelectorProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  partySize: number;
  venueId?: string;
}

export const EnhancedTimeSlotSelector = ({
  selectedDate,
  selectedTime,
  onTimeSelect,
  partySize,
  venueId
}: EnhancedTimeSlotSelectorProps) => {
  const { slots, isLoading, forceRefresh, lastRefresh } = useRealTimeAvailability({
    selectedDate,
    partySize,
    venueId
  });

  const getSlotVariant = (status: string) => {
    switch (status) {
      case 'plenty':
        return 'default';
      case 'limited':
        return 'secondary';
      case 'full':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getSlotClasses = (time: string, status: string, available: boolean) => {
    const baseClasses = "flex flex-col items-center p-3 h-auto transition-all duration-200";
    
    if (selectedTime === time) {
      return `${baseClasses} bg-blue-600 hover:bg-blue-700 text-white border-blue-600`;
    }
    
    if (!available) {
      return `${baseClasses} bg-gray-100 text-gray-400 cursor-not-allowed opacity-60`;
    }
    
    switch (status) {
      case 'plenty':
        return `${baseClasses} bg-green-50 hover:bg-green-100 text-green-800 border-green-200`;
      case 'limited':
        return `${baseClasses} bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200`;
      default:
        return `${baseClasses} hover:bg-gray-50`;
    }
  };

  if (isLoading && slots.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-gray-500">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Checking availability...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with refresh info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">Available Times</span>
          {partySize > 1 && (
            <Badge variant="outline" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              {partySize} guests
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            Updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={forceRefresh}
            disabled={isLoading}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Time slots grid */}
      <div className="grid grid-cols-3 gap-2">
        {slots.map((slot) => (
          <Button
            key={slot.time}
            variant="outline"
            className={getSlotClasses(slot.time, slot.status, slot.available)}
            onClick={() => slot.available && onTimeSelect(slot.time)}
            disabled={!slot.available}
          >
            <div className="font-medium text-sm">{slot.time}</div>
            <div className="text-xs mt-1 opacity-80">
              {slot.message}
            </div>
          </Button>
        ))}
      </div>

      {/* Availability legend */}
      <Card className="bg-gray-50">
        <CardContent className="p-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
                <span className="text-gray-600">Plenty available</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-amber-200 rounded-sm"></div>
                <span className="text-gray-600">Limited</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-200 rounded-sm"></div>
                <span className="text-gray-600">Fully booked</span>
              </div>
            </div>
            {partySize >= 8 && (
              <div className="text-amber-600 font-medium">
                Large party - consider splitting for more options
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* No availability message */}
      {slots.length === 0 && !isLoading && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 text-center">
            <div className="text-amber-800">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-60" />
              <p className="font-medium mb-1">No availability found</p>
              <p className="text-sm opacity-80">
                Try selecting a different date or reducing your party size
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
