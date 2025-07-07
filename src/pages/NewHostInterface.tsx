import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useVenueHours } from "@/hooks/useVenueHours";
import { useSections } from "@/hooks/useSections";
import { useTables } from "@/hooks/useTables";
import { useBookings, Booking } from "@/hooks/useBookings";
import { useServices } from "@/hooks/useServices";
import { useToast } from "@/hooks/use-toast";
import { NewTimeGrid } from "@/components/host/NewTimeGrid";
import { BookingListView } from "@/components/host/BookingListView";
import { QuickWalkInDialog } from "@/components/host/QuickWalkInDialog";
import { BookingDetailsPanel } from "@/components/host/BookingDetailsPanel";
import { CollapsibleCalendar } from "@/components/host/CollapsibleCalendar";
import { BlockDialog } from "@/components/host/BlockDialog";
import { BlockManagementDialog } from "@/components/host/BlockManagementDialog";
import { FullBookingDialog } from "@/components/host/FullBookingDialog";
import { Users, Grid, List, Ban, PlusCircle, BarChart3, Clock, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Block } from "@/hooks/useBlocks";
import { DebugPanel } from "@/components/DebugPanel";

const NewHostInterface = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [walkInDialogOpen, setWalkInDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockManagementOpen, setBlockManagementOpen] = useState(false);
  const [fullBookingDialogOpen, setFullBookingDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: venueHours } = useVenueHours();
  const { sections } = useSections();
  const { tables } = useTables();
  const { services } = useServices();
  const { bookings, createBooking, updateBooking } = useBookings(format(selectedDate, 'yyyy-MM-dd'));

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
    tablesCount: tables.length,
    sectionsCount: sections.length
  });

  const totalBookings = bookings.length;
  const remainingBookings = bookings.filter(booking => booking.status === 'confirmed').length;
  const currentlySeated = bookings.filter(booking => booking.status === 'seated').length;
  const finishedBookings = bookings.filter(booking => booking.status === 'finished').length;

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

  const handleFullBookingCreate = async (bookingData: any) => {
    try {
      await createBooking(bookingData);
      toast({
        title: "Booking created",
        description: `Booking created for ${bookingData.guest_name}`,
      });
    } catch (error) {
      console.error('❌ Full booking creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create booking",
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
  };

  const handleBlockClick = (block: Block) => {
    setSelectedBlock(block);
    setBlockManagementOpen(true);
  };

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="space-y-6 bg-background text-foreground">
      {/* Debug Panel - Remove after testing */}
      <DebugPanel />
      
      {/* Header */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium text-foreground">
                  {format(selectedDate, 'EEEE, MMMM do, yyyy')}
                </span>
                {isToday && <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full font-medium">TODAY</span>}
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 items-center">
            <CollapsibleCalendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              bookingDates={bookingDates}
            />

            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              <Button 
                variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-9 text-sm"
              >
                <Grid className="h-4 w-4 mr-1" />
                Grid
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-9 text-sm"
              >
                <List className="h-4 w-4 mr-1" />
                List
              </Button>
            </div>
            
            <Button 
              onClick={() => navigate('/dashboard')} 
              variant="outline"
              size="sm"
              className="text-sm"
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Dashboard
            </Button>
            
            <Button 
              onClick={() => setFullBookingDialogOpen(true)} 
              variant="outline"
              size="sm"
              className="text-sm"
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              New Booking
            </Button>
            
            <Button 
              onClick={() => setBlockDialogOpen(true)} 
              variant="outline"
              size="sm"
              className="text-sm"
            >
              <Ban className="h-4 w-4 mr-1" />
              Block
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="text-foreground">{remainingBookings} remaining</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <span className="text-foreground">{currentlySeated} seated</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
              <span className="text-foreground">{finishedBookings} finished</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{totalBookings} total today</span>
            </div>
          </div>
          <div className="text-base font-semibold text-foreground">Tables</div>
        </div>
      </div>

      {/* Main Interface */}
      <div className="grid grid-cols-12 gap-6">
        <div className={`${selectedBooking ? 'col-span-8' : 'col-span-12'}`}>
          {viewMode === 'grid' ? (
            <NewTimeGrid
              venueHours={venueHours}
              tables={tables}
              sections={sections}
              bookings={bookings}
              onWalkInClick={handleWalkInClick}
              onBookingClick={handleBookingClick}
              onBookingDrag={handleBookingDrag}
              onBlockClick={handleBlockClick}
              selectedDate={selectedDate}
              remainingBookings={remainingBookings}
              currentlySeated={currentlySeated}
              finishedBookings={finishedBookings}
            />
          ) : (
            <BookingListView
              bookings={bookings}
              tables={tables}
              onBookingClick={handleBookingClick}
            />
          )}
        </div>

        {selectedBooking && (
          <div className="col-span-4 space-y-4">
            <BookingDetailsPanel
              booking={selectedBooking}
              onClose={() => setSelectedBooking(null)}
              onStatusChange={handleStatusChange}
              onBookingUpdate={handleBookingUpdate}
            />
          </div>
        )}
      </div>

      <QuickWalkInDialog
        open={walkInDialogOpen}
        onOpenChange={setWalkInDialogOpen}
        table={selectedTable}
        time={selectedTime}
        onCreateWalkIn={handleCreateWalkIn}
        defaultDuration={120}
      />
      
      <BlockDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        selectedDate={selectedDate}
      />

      <BlockManagementDialog
        open={blockManagementOpen}
        onOpenChange={(open) => {
          setBlockManagementOpen(open);
          if (!open) setSelectedBlock(null);
        }}
        selectedDate={selectedDate}
        selectedBlock={selectedBlock}
      />
      
      <FullBookingDialog
        open={fullBookingDialogOpen}
        onOpenChange={setFullBookingDialogOpen}
        selectedDate={selectedDate}
        onCreateBooking={handleFullBookingCreate}
      />
    </div>
  );
};

export default NewHostInterface;
