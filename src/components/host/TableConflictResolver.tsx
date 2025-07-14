import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Users, MapPin, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface ConflictInfo {
  tableId: number;
  tableName: string;
  conflictingBookings: Array<{
    id: number;
    guest_name: string;
    booking_time: string;
    party_size: number;
    status: string;
  }>;
}

interface TableConflictResolverProps {
  conflicts: ConflictInfo[];
  onResolveConflict: (tableId: number, resolution: 'move' | 'override' | 'suggest') => void;
  onSuggestAlternative: () => void;
  className?: string;
}

export const TableConflictResolver = ({
  conflicts,
  onResolveConflict,
  onSuggestAlternative,
  className
}: TableConflictResolverProps) => {
  if (conflicts.length === 0) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'seated': return 'bg-green-100 text-green-800';
      case 'finished': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={`border-orange-200 bg-orange-50 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="h-5 w-5" />
          Table Assignment Conflicts
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {conflicts.map((conflict) => (
          <div key={conflict.tableId} className="bg-white rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-600" />
                <span className="font-medium">Table {conflict.tableName}</span>
                <Badge variant="outline" className="text-orange-700 border-orange-300">
                  {conflict.conflictingBookings.length} conflict(s)
                </Badge>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {conflict.conflictingBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-3 w-3 text-gray-500" />
                      <span>{booking.booking_time}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="h-3 w-3 text-gray-500" />
                      <span>{booking.party_size}</span>
                    </div>
                    <span className="font-medium text-sm">{booking.guest_name}</span>
                  </div>
                  <Badge className={getStatusColor(booking.status)}>
                    {booking.status}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onResolveConflict(conflict.tableId, 'suggest')}
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                Suggest Alternative
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => onResolveConflict(conflict.tableId, 'move')}
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                Move Existing Booking
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => onResolveConflict(conflict.tableId, 'override')}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Override (Risk Double Booking)
              </Button>
            </div>
          </div>
        ))}

        <div className="border-t border-orange-200 pt-4">
          <Button 
            onClick={onSuggestAlternative}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Find Alternative Tables for All Conflicts
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};