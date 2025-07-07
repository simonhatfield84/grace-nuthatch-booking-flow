
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useVenueHours } from "@/hooks/useVenueHours";
import { useSections } from "@/hooks/useSections";
import { useTables } from "@/hooks/useTables";
import { useBookings, Booking } from "@/hooks/useBookings";
import { useToast } from "@/hooks/use-toast";
import { NewTimeGrid } from "@/components/host/NewTimeGrid";
import { BookingListView } from "@/components/host/BookingListView";
import { QuickWalkInDialog } from "@/components/host/QuickWalkInDialog";
import { BookingDetailsPanel } from "@/components/host/BookingDetailsPanel";
import { IPadCalendar } from "@/components/host/IPadCalendar";
import { Users, Calendar, Plus, Grid, List, ToggleLeft, ToggleRight } from "lucide-react";

const NewHostInterface = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [walkInDialogOpen, setWalkInDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { toast } = useToast();

  const { data: venueHours } = useVenueHours();
  const { sections } = useSections();
  const { tables } = useTables();
  const { bookings, createBooking, updateBooking } = useBookings(format(selectedDate, 'yyyy-MM-dd'));

  // Get all booking dates for calendar
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

  console.log('📅 Host Interface Debug:', {
    selectedDate: format(selectedDate, 'yyyy-MM-dd'),
    bookingsCount: bookings.length,
    bookings: bookings.map(b => ({
      id: b.id,
      guest_name: b.guest_name,
      booking_date: b.booking_date,
      booking_time: b.booking_time,
      table_id: b.table_id,
      status: b.status
    })),
    tablesCount: tables.length,
    sectionsCount: sections.length
  });

  const handleWalkInClick = (tableId: number, time: string) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      setSelectedTable(table);
      setSelectedTime(time);
      setWalkInDialogOpen(true);
    }
  };

  const handleCreateWalkIn = async (walkInData: {
    tableId: number;
    time: string;
    partySize: number;
    guestName?: string;
    duration: number;
  }) => {
    try {
      console.log('🚶‍♂️ Creating walk-in:', walkInData);
      
      await createBooking({
        guest_name: walkInData.guestName || 'WALK-IN',
        party_size: walkInData.partySize,
        booking_date: format(selectedDate, 'yyyy-MM-dd'),
        booking_time: walkInData.time,
        status: 'seated',
        phone: null,
        email: null,
        notes: 'Walk-in customer',
        service: 'Walk-In',
        original_table_id: walkInData.tableId
      });

      toast({
        title: "Walk-in seated",
        description: `${walkInData.partySize} guests seated at table ${selectedTable?.label}`,
      });
    } catch (error) {
      console.error('❌ Walk-in creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create walk-in",
        variant: "destructive"
      });
    }
  };

  const handleBookingDrag = async (bookingId: number, newTime: string, newTableId: number) => {
    try {
      await updateBooking({
        id: bookingId,
        updates: {
          booking_time: newTime,
          table_id: newTableId
        }
      });

      toast({
        title: "Booking moved",
        description: "Booking time and table updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to move booking",
        variant: "destructive"
      });
    }
  };

  const handleStatusChange = async (booking: Booking, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'finished') {
        const now = new Date();
        const endTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        updateData.end_time = endTime;
      }

      await updateBooking({
        id: booking.id,
        updates: updateData
      });

      const updatedBooking = { ...booking, status: newStatus as Booking['status'] };
      setSelectedBooking(updatedBooking);
      
      toast({
        title: "Status updated",
        description: `Booking marked as ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive"
      });
    }
  };

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
  };

  const handleBookingUpdate = () => {
    // Refresh bookings after update
    // The useBookings hook will automatically refetch
  };

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Host Interface</h1>
          <div className="flex items-center gap-4 text-gray-300">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(selectedDate, 'EEEE, MMMM do, yyyy')}
              {isToday && <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">TODAY</span>}
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {bookings.length} bookings
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 items-center">
          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-gray-800 p-1 rounded-lg border border-gray-700">
            <Button 
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8"
            >
              <Grid className="h-4 w-4 mr-1" />
              Grid
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8"
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
          </div>
          
          {isToday && (
            <Button onClick={() => setWalkInDialogOpen(true)} className="bg-grace-primary hover:bg-grace-primary/80">
              <Plus className="h-4 w-4 mr-2" />
              Walk-In
            </Button>
          )}
          <div className="grace-logo text-2xl font-bold">
            grace
          </div>
        </div>
      </div>

      {/* Main Interface */}
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
        {/* Main Content Area */}
        <div className={`${selectedBooking ? 'col-span-8' : 'col-span-9'} bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-700`}>
          {viewMode === 'grid' ? (
            <NewTimeGrid
              venueHours={venueHours}
              tables={tables}
              sections={sections}
              bookings={bookings}
              onWalkInClick={handleWalkInClick}
              onBookingClick={handleBookingClick}
              onBookingDrag={handleBookingDrag}
              selectedDate={selectedDate}
            />
          ) : (
            <BookingListView
              bookings={bookings}
              tables={tables}
              onBookingClick={handleBookingClick}
            />
          )}
        </div>

        {/* Side Panel */}
        <div className={`${selectedBooking ? 'col-span-4' : 'col-span-3'} space-y-4`}>
          {selectedBooking ? (
            <BookingDetailsPanel
              booking={selectedBooking}
              onClose={() => setSelectedBooking(null)}
              onStatusChange={handleStatusChange}
              onBookingUpdate={handleBookingUpdate}
            />
          ) : (
            <div className="bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-700">
              <IPadCalendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                bookingDates={bookingDates}
              />
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <QuickWalkInDialog
        open={walkInDialogOpen}
        onOpenChange={setWalkInDialogOpen}
        table={selectedTable}
        time={selectedTime}
        onCreateWalkIn={handleCreateWalkIn}
        defaultDuration={120}
      />
    </div>
  );
};

export default NewHostInterface;
