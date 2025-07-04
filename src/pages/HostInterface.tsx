
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addHours } from "date-fns";
import { DateNavigator } from "@/components/host/DateNavigator";
import { FloatingBookingBar } from "@/components/host/FloatingBookingBar";
import { useVenueHours } from "@/hooks/useVenueHours";
import { useSections } from "@/hooks/useSections";
import { useTables } from "@/hooks/useTables";
import { useBookings } from "@/hooks/useBookings";

const HostInterface = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Fetch venue hours
  const { data: venueHours } = useVenueHours();
  
  // Fetch sections and tables
  const { sections } = useSections();
  const { tables } = useTables();
  
  // Fetch bookings for selected date
  const { data: bookings = [] } = useQuery({
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

  const generateTimeHeaders = () => {
    if (!venueHours) return [];
    
    const startHour = parseInt(venueHours.start_time.split(':')[0]);
    const endHour = parseInt(venueHours.end_time.split(':')[0]);
    const timeHeaders = [];
    
    for (let hour = startHour; hour <= endHour; hour++) {
      timeHeaders.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    
    return timeHeaders;
  };

  const timeHeaders = generateTimeHeaders();
  const startHour = venueHours ? parseInt(venueHours.start_time.split(':')[0]) : 17;

  const handleBookingClick = (booking) => {
    setSelectedBooking(booking);
    // Here you could open a modal or side panel with booking details
    console.log('Booking clicked:', booking);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Date Navigator Sidebar */}
        <div className="w-80 p-4 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <DateNavigator
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
          
          {/* Cancelled Bookings Section */}
          {cancelledBookings.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Cancelled Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cancelledBookings.map((booking) => (
                    <div key={booking.id} className="p-2 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
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

        {/* Main Grid Area */}
        <div className="flex-1 p-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Host Interface
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {format(selectedDate, 'EEEE, MMMM do, yyyy')}
            </p>
          </div>

          {/* Time Headers */}
          <div className="mb-4 grid grid-cols-13 gap-0 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-100 dark:bg-gray-800 p-3 font-medium text-center border-r border-gray-200 dark:border-gray-700">
              Section / Table
            </div>
            {timeHeaders.map((time) => (
              <div key={time} className="bg-gray-100 dark:bg-gray-800 p-3 text-sm font-medium text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                {time}
              </div>
            ))}
          </div>

          {/* Unallocated Bookings Section */}
          {getUnallocatedBookings().length > 0 && (
            <div className="mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-orange-700 dark:text-orange-300">
                    Unallocated Bookings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative h-12 bg-orange-50 dark:bg-orange-950 rounded border border-orange-200 dark:border-orange-800">
                    {getUnallocatedBookings().map((booking) => (
                      <FloatingBookingBar
                        key={booking.id}
                        booking={booking}
                        startHour={startHour}
                        duration={120} // Default 2 hours
                        gridWidth={800}
                        onBookingClick={handleBookingClick}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Sections and Tables Grid */}
          <div className="space-y-6">
            {sections.map((section) => {
              const sectionTables = tables.filter(table => 
                table.section_id === section.id && table.status === 'active'
              );
              const sectionBookings = getBookingsBySection(section.id);

              return (
                <Card key={section.id}>
                  <CardHeader>
                    <CardTitle 
                      className="text-lg"
                      style={{ color: section.color }}
                    >
                      {section.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {sectionTables.map((table) => {
                        const tableBookings = sectionBookings.filter(booking => 
                          booking.table_id === table.id
                        );

                        return (
                          <div key={table.id} className="grid grid-cols-13 gap-0 border border-gray-200 dark:border-gray-700 rounded">
                            {/* Table Label */}
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 border-r border-gray-200 dark:border-gray-700 flex items-center">
                              <span className="font-medium">{table.label}</span>
                              <Badge variant="outline" className="ml-2">
                                {table.seats}
                              </Badge>
                            </div>

                            {/* Time Slots */}
                            <div className="col-span-12 relative h-12 bg-white dark:bg-gray-900">
                              {tableBookings.map((booking) => (
                                <FloatingBookingBar
                                  key={booking.id}
                                  booking={booking}
                                  startHour={startHour}
                                  duration={120} // Default 2 hours, could be dynamic
                                  gridWidth={800}
                                  onBookingClick={handleBookingClick}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Current Time Indicator */}
          <div className="fixed top-20 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            {format(new Date(), 'HH:mm')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostInterface;
