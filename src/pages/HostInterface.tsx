
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ImprovedDateNavigator } from "@/components/host/ImprovedDateNavigator";
import { ImprovedFloatingBookingBar } from "@/components/host/ImprovedFloatingBookingBar";
import { TimeGrid } from "@/components/host/TimeGrid";
import { useVenueHours } from "@/hooks/useVenueHours";
import { useSections } from "@/hooks/useSections";
import { useTables } from "@/hooks/useTables";
import { TableAllocationService } from "@/services/tableAllocation";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, AlertTriangle } from "lucide-react";

const HostInterface = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState(null);
  const { toast } = useToast();

  // Fetch venue hours
  const { data: venueHours } = useVenueHours();
  
  // Fetch sections and tables
  const { sections } = useSections();
  const { tables } = useTables();
  
  // Fetch bookings for selected date
  const { data: bookings = [], refetch: refetchBookings } = useQuery({
    queryKey: ['bookings', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_date', format(selectedDate, 'yyyy-MM-dd'))
        .neq('status', 'cancelled')
        .order('booking_time');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch cancelled bookings separately
  const { data: cancelledBookings = [] } = useQuery({
    queryKey: ['cancelled-bookings', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_date', format(selectedDate, 'yyyy-MM-dd'))
        .eq('status', 'cancelled')
        .order('booking_time');
      
      if (error) throw error;
      return data;
    }
  });

  const startHour = venueHours ? parseInt(venueHours.start_time.split(':')[0]) : 17;

  const handleBookingClick = (booking) => {
    setSelectedBooking(booking);
    console.log('Booking clicked:', booking);
    // TODO: Open booking details modal
  };

  const handleAllocateUnallocatedBookings = async () => {
    const unallocatedBookings = bookings.filter(booking => booking.is_unallocated);
    
    for (const booking of unallocatedBookings) {
      await TableAllocationService.allocateBookingToTables(
        booking.id,
        booking.party_size,
        booking.booking_date,
        booking.booking_time
      );
    }
    
    refetchBookings();
    toast({
      title: "Allocation Complete",
      description: `Attempted to allocate ${unallocatedBookings.length} unallocated bookings.`,
    });
  };

  const getBookingsBySection = (sectionId) => {
    const sectionTables = tables.filter(table => table.section_id === sectionId);
    const sectionTableIds = sectionTables.map(table => table.id);
    return bookings.filter(booking => 
      booking.table_id && sectionTableIds.includes(booking.table_id)
    );
  };

  const getUnallocatedBookings = () => {
    return bookings.filter(booking => booking.is_unallocated || !booking.table_id);
  };

  const getBookingsForTable = (tableId) => {
    return bookings.filter(booking => booking.table_id === tableId);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 p-4 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 sticky top-0 h-screen overflow-y-auto">
          <ImprovedDateNavigator
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
          
          {/* Unallocated Bookings Alert */}
          {getUnallocatedBookings().length > 0 && (
            <Card className="mt-4 border-orange-200 bg-orange-50 dark:bg-orange-950">
              <CardHeader className="pb-3">
                <CardTitle className="text-orange-700 dark:text-orange-300 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Unallocated Bookings ({getUnallocatedBookings().length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-3">
                  {getUnallocatedBookings().map((booking) => (
                    <div key={booking.id} className="p-2 bg-orange-100 dark:bg-orange-900 rounded border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-orange-900 dark:text-orange-100">
                          {booking.guest_name}
                        </span>
                        <Badge variant="outline" className="text-orange-700 dark:text-orange-300">
                          {booking.party_size}
                        </Badge>
                      </div>
                      <div className="text-sm text-orange-700 dark:text-orange-300">
                        {booking.booking_time} • {booking.service}
                      </div>
                    </div>
                  ))}
                </div>
                <Button 
                  onClick={handleAllocateUnallocatedBookings}
                  className="w-full"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Auto-Allocate All
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Cancelled Bookings */}
          {cancelledBookings.length > 0 && (
            <Card className="mt-4 border-red-200 bg-red-50 dark:bg-red-950">
              <CardHeader className="pb-3">
                <CardTitle className="text-red-700 dark:text-red-300">
                  Cancelled Bookings ({cancelledBookings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cancelledBookings.map((booking) => (
                    <div key={booking.id} className="p-2 bg-red-100 dark:bg-red-900 rounded border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-red-900 dark:text-red-100">
                          {booking.guest_name}
                        </span>
                        <Badge variant="outline" className="text-red-700 dark:text-red-300">
                          {booking.party_size}
                        </Badge>
                      </div>
                      <div className="text-sm text-red-700 dark:text-red-300">
                        {booking.booking_time}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Host Interface
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {format(selectedDate, 'EEEE, MMMM do, yyyy')} • {bookings.length} bookings
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 dark:text-gray-400">Current Time</div>
                <div className="text-xl font-mono font-bold">
                  {format(new Date(), 'HH:mm')}
                </div>
              </div>
            </div>
          </div>

          {/* Time Grid */}
          <TimeGrid venueHours={venueHours}>
            {/* Sections and Tables */}
            <div className="space-y-0">
              {sections.map((section) => {
                const sectionTables = tables.filter(table => 
                  table.section_id === section.id && table.status === 'active'
                );

                return (
                  <div key={section.id} className="border-b border-gray-200 dark:border-gray-700">
                    {/* Section Header */}
                    <div 
                      className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700"
                      style={{ borderLeftColor: section.color, borderLeftWidth: '4px' }}
                    >
                      <h3 className="font-semibold text-lg" style={{ color: section.color }}>
                        {section.name} ({sectionTables.length} tables)
                      </h3>
                    </div>

                    {/* Tables in Section */}
                    {sectionTables.map((table) => {
                      const tableBookings = getBookingsForTable(table.id);

                      return (
                        <div key={table.id} className="grid grid-cols-13 gap-0 border-b border-gray-100 dark:border-gray-800 min-h-[60px]">
                          {/* Table Label */}
                          <div className="bg-white dark:bg-gray-900 p-4 border-r border-gray-200 dark:border-gray-700 flex items-center">
                            <div>
                              <span className="font-semibold text-lg">{table.label}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {table.seats} seats
                                </Badge>
                                {table.join_groups && table.join_groups.length > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    Group
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Time Slots with Bookings */}
                          <div className="col-span-12 relative bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 min-h-[60px]">
                            {tableBookings.map((booking) => (
                              <ImprovedFloatingBookingBar
                                key={booking.id}
                                booking={booking}
                                startHour={startHour}
                                duration={120} // 2 hours default
                                onBookingClick={handleBookingClick}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </TimeGrid>
        </div>
      </div>
    </div>
  );
};

export default HostInterface;
