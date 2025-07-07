
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
import { QuickWalkInDialog } from "@/components/host/QuickWalkInDialog";
import { BookingActionsPanel } from "@/components/host/BookingActionsPanel";
import { IPadCalendar } from "@/components/host/IPadCalendar";
import { Users, Calendar, Plus } from "lucide-react";

const NewHostInterface = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [walkInDialogOpen, setWalkInDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [selectedTime, setSelectedTime] = useState('');
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
      await createBooking({
        guest_name: walkInData.guestName || 'WALK-IN',
        party_size: walkInData.partySize,
        booking_date: format(selectedDate, 'yyyy-MM-dd'),
        booking_time: walkInData.time,
        status: 'seated',
        phone: null,
        email: null,
        notes: 'Walk-in customer',
        service: 'Walk-In'
      });

      toast({
        title: "Walk-in seated",
        description: `${walkInData.partySize} guests seated at table ${selectedTable?.label}`,
      });
    } catch (error) {
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

  const handleExtendBooking = async (bookingId: number, minutes: number) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    try {
      await updateBooking({
        id: bookingId,
        updates: {
          duration_minutes: booking.duration_minutes + minutes
        }
      });

      toast({
        title: "Booking extended",
        description: `Added ${minutes} minutes to booking`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to extend booking",
        variant: "destructive"
      });
    }
  };

  const handleExtendUntilNext = async (bookingId: number) => {
    // Implementation for extending until next booking
    // This would calculate the time until the next booking on the same table
    toast({
      title: "Feature coming soon",
      description: "Extend until next booking feature is being implemented",
    });
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

      setSelectedBooking({ ...booking, status: newStatus as Booking['status'] });
      
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

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Host Interface</h1>
          <div className="flex items-center gap-4 text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(selectedDate, 'EEEE, MMMM do, yyyy')}
              {isToday && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">TODAY</span>}
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {bookings.length} bookings
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          {isToday && (
            <Button onClick={() => setWalkInDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Walk-In
            </Button>
          )}
          <div className="grace-logo text-2xl font-bold text-blue-600">
            grace
          </div>
        </div>
      </div>

      {/* Main Interface */}
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
        {/* Timeline Grid */}
        <div className={`${selectedBooking ? 'col-span-8' : 'col-span-9'} bg-white rounded-lg shadow-sm overflow-hidden`}>
          <NewTimeGrid
            venueHours={venueHours}
            tables={tables}
            sections={sections}
            bookings={bookings}
            onWalkInClick={handleWalkInClick}
            onBookingClick={setSelectedBooking}
            onBookingDrag={handleBookingDrag}
            selectedDate={selectedDate}
          />
        </div>

        {/* Side Panel */}
        <div className={`${selectedBooking ? 'col-span-4' : 'col-span-3'} space-y-4`}>
          {selectedBooking ? (
            <BookingActionsPanel
              booking={selectedBooking}
              onClose={() => setSelectedBooking(null)}
              onExtendBooking={handleExtendBooking}
              onExtendUntilNext={handleExtendUntilNext}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-4">
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
