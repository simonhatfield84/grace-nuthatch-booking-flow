
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Booking } from "@/hooks/useBookings";

interface CancelledBookingsPanelProps {
  selectedDate: Date;
  onBookingRestore: () => void;
}

export const CancelledBookingsPanel = ({ selectedDate, onBookingRestore }: CancelledBookingsPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const { data: cancelledBookings = [], refetch } = useQuery({
    queryKey: ['cancelled-bookings', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_date', format(selectedDate, 'yyyy-MM-dd'))
        .eq('status', 'cancelled')
        .order('booking_time');
      
      if (error) throw error;
      return (data || []) as Booking[];
    }
  });

  const handleRestore = async (booking: Booking) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);
      
      if (error) throw error;
      
      refetch();
      onBookingRestore();
      toast({
        title: "Booking Restored",
        description: `${booking.guest_name}'s booking has been restored`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restore booking",
        variant: "destructive"
      });
    }
  };

  if (cancelledBookings.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50">
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center gap-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <span className="text-sm font-medium">
          Cancelled Bookings ({cancelledBookings.length})
        </span>
        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </Button>
      
      {isExpanded && (
        <div className="max-h-64 overflow-y-auto p-4 space-y-2">
          {cancelledBookings.map((booking) => (
            <Card key={booking.id} className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium text-sm">{booking.guest_name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {booking.booking_time} • {booking.party_size} guests • {booking.booking_reference}
                      </div>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      Cancelled
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRestore(booking)}
                    className="flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restore
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
