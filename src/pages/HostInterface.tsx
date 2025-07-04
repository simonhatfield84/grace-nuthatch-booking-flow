
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useVenueHours } from "@/hooks/useVenueHours";
import { useSections } from "@/hooks/useSections";
import { useTables } from "@/hooks/useTables";
import { TableAllocationService } from "@/services/tableAllocation";
import { useToast } from "@/hooks/use-toast";
import { UnallocatedBookingsBanner } from "@/components/host/UnallocatedBookingsBanner";
import { IPadCalendar } from "@/components/host/IPadCalendar";
import { OptimizedTimeGrid } from "@/components/host/OptimizedTimeGrid";
import { TouchOptimizedBookingBar } from "@/components/host/TouchOptimizedBookingBar";
import { BookingDetailsPanel } from "@/components/host/BookingDetailsPanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Booking } from "@/hooks/useBookings";

const HostInterface = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

  // Fetch venue hours, sections, and tables
  const { data: venueHours } = useVenueHours();
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
      
      // Cast the data to match our Booking interface
      return (data || []).map(booking => ({
        ...booking,
        status: booking.status as Booking['status']
      })) as Booking[];
    }
  });

  // Get unique booking dates for calendar indicators
  const { data: allBookings = [] } = useQuery({
    queryKey: ['all-bookings-dates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('booking_date')
        .neq('status', 'cancelled');
      
      if (error) throw error;
      return data;
    }
  });

  const bookingDates = [...new Set(allBookings.map(b => b.booking_date))];

  const handleBookingClick = (booking) => {
    setSelectedBooking(booking);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedBooking(null);
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

  const getUnallocatedBookings = () => {
    return bookings.filter(booking => booking.is_unallocated || !booking.table_id);
  };

  const getBookingsForTable = (tableId) => {
    return bookings.filter(booking => booking.table_id === tableId);
  };

  const handleStatusChange = async (booking, newStatus) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', booking.id);
      
      if (error) throw error;
      
      refetchBookings();
      setSelectedBooking({ ...booking, status: newStatus });
      toast({
        title: "Status Updated",
        description: `Booking status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      {/* Unallocated Bookings Banner */}
      <UnallocatedBookingsBanner
        bookings={getUnallocatedBookings()}
        onAllocateAll={handleAllocateUnallocatedBookings}
        onBookingClick={handleBookingClick}
      />

      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Host Interface
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {format(selectedDate, 'EEEE, MMMM do, yyyy')} • {bookings.length} bookings
        </p>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
        {/* Time Grid - Takes most space */}
        <div className={`${showDetails ? 'col-span-8' : 'col-span-9'} flex flex-col`}>
          <ScrollArea className="flex-1">
            <OptimizedTimeGrid venueHours={venueHours}>
              {/* Tables by Section */}
              <div className="space-y-0">
                {sections.map((section) => {
                  const sectionTables = tables.filter(table => 
                    table.section_id === section.id && table.status === 'active'
                  );

                  return (
                    <div key={section.id}>
                      {/* Section Header */}
                      <div 
                        className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center"
                        style={{ borderLeftColor: section.color, borderLeftWidth: '4px' }}
                      >
                        <h3 className="font-semibold" style={{ color: section.color }}>
                          {section.name} ({sectionTables.length})
                        </h3>
                      </div>

                      {/* Tables in Section */}
                      {sectionTables.map((table) => {
                        const tableBookings = getBookingsForTable(table.id);

                        return (
                          <div key={table.id} className="flex border-b border-gray-100 dark:border-gray-800 min-h-[52px]">
                            {/* Table Info */}
                            <div className="w-48 p-4 border-r border-gray-200 dark:border-gray-700 flex items-center bg-white dark:bg-gray-900">
                              <div>
                                <span className="font-semibold">{table.label}</span>
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
                            <div className="flex-1 relative bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 min-h-[52px]">
                              {tableBookings.map((booking) => (
                                <TouchOptimizedBookingBar
                                  key={booking.id}
                                  booking={booking}
                                  startTime={venueHours?.start_time || '17:00'}
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
            </OptimizedTimeGrid>
          </ScrollArea>
        </div>

        {/* Right Panel */}
        <div className={`${showDetails ? 'col-span-4' : 'col-span-3'} flex flex-col space-y-4`}>
          {showDetails ? (
            <BookingDetailsPanel
              booking={selectedBooking}
              onClose={handleCloseDetails}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <IPadCalendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              bookingDates={bookingDates}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default HostInterface;
