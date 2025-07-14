import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useVenueHours } from "@/hooks/useVenueHours";
import { useSections } from "@/hooks/useSections";
import { useTables } from "@/hooks/useTables";
import { useBlocks } from "@/hooks/useBlocks";
import { useBookingAudit } from "@/hooks/useBookingAudit";
import { TableAllocationService } from "@/services/tableAllocation";
import { useToast } from "@/hooks/use-toast";
import { UnallocatedBookingsBanner } from "@/components/host/UnallocatedBookingsBanner";
import { IPadCalendar } from "@/components/host/IPadCalendar";
import { OptimizedTimeGrid } from "@/components/host/OptimizedTimeGrid";
import { TouchOptimizedBookingBar } from "@/components/host/TouchOptimizedBookingBar";
import { BookingDetailsPanel } from "@/components/host/BookingDetailsPanel";
import { BlockOverlay } from "@/components/host/BlockOverlay";
import { CancelledBookingsPanel } from "@/components/host/CancelledBookingsPanel";
import { BlockDialog } from "@/components/BlockDialog";
import { WalkInDialog } from "@/features/host/components/walkin/WalkInDialog";
import { FullBookingDialog } from "@/components/host/FullBookingDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Booking } from "@/hooks/useBookings";
import { useAuth } from "@/contexts/AuthContext";
import { backfillBookingDurations } from "@/utils/backfillBookingDurations";

import { Users, Link, Ban } from "lucide-react";

const HostInterface = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [walkInDialogOpen, setWalkInDialogOpen] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [clickedTime, setClickedTime] = useState<string>("");
  const [backfillComplete, setBackfillComplete] = useState(false);
  const [dragOverTable, setDragOverTable] = useState<number | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: venueHours } = useVenueHours();
  const { sections } = useSections();
  const { tables } = useTables();
  const { blocks } = useBlocks(format(selectedDate, 'yyyy-MM-dd'));
  const { logAudit } = useBookingAudit();
  
  const { data: bookings = [], refetch: refetchBookings } = useQuery({
    queryKey: ['bookings', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!user) return [];
      
      // Get user's venue ID first
      const { data: profile } = await supabase
        .from('profiles')
        .select('venue_id')
        .eq('id', user.id)
        .single();
      
      if (!profile?.venue_id) return [];
      
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_date', format(selectedDate, 'yyyy-MM-dd'))
        .eq('venue_id', profile.venue_id)
        .neq('status', 'cancelled')
        .order('booking_time');
      
      if (error) throw error;
      
      const typedBookings = (data || []).map(booking => ({
        ...booking,
        status: booking.status as Booking['status'],
        duration_minutes: booking.duration_minutes || 120
      })) as Booking[];

      const unallocatedBookings = typedBookings.filter(b => b.is_unallocated || !b.table_id);
      if (unallocatedBookings.length > 0) {
        console.log(`Found ${unallocatedBookings.length} unallocated bookings, attempting allocation`);
        for (const booking of unallocatedBookings) {
          await TableAllocationService.allocateBookingToTables(
            booking.id,
            booking.party_size,
            booking.booking_date,
            booking.booking_time
          );
        }
        setTimeout(() => refetchBookings(), 1000);
      }
      
      return typedBookings;
    },
    enabled: !!user
  });

  useEffect(() => {
    const runBackfill = async () => {
      if (!backfillComplete) {
        console.log('Running booking duration backfill...');
        const updatedCount = await backfillBookingDurations();
        setBackfillComplete(true);
        
        if (updatedCount && updatedCount > 0) {
          toast({
            title: "Duration Backfill Complete",
            description: `Updated ${updatedCount} bookings with calculated durations.`,
          });
          refetchBookings();
        }
      }
    };

    runBackfill();
  }, [backfillComplete, toast, refetchBookings]);

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

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedBooking(null);
  };

  const handleAllocateUnallocatedBookings = async () => {
    const unallocatedBookings = bookings.filter(booking => booking.is_unallocated);
    
    console.log(`Attempting to allocate ${unallocatedBookings.length} unallocated bookings`);
    
    let successCount = 0;
    for (const booking of unallocatedBookings) {
      const success = await TableAllocationService.allocateBookingToTables(
        booking.id,
        booking.party_size,
        booking.booking_date,
        booking.booking_time
      );
      if (success) successCount++;
    }
    
    refetchBookings();
    toast({
      title: "Allocation Complete",
      description: `Successfully allocated ${successCount} out of ${unallocatedBookings.length} bookings.`,
    });
  };

  const getUnallocatedBookings = () => {
    return bookings.filter(booking => booking.is_unallocated || !booking.table_id);
  };

  const getBookingsForTable = (tableId: number) => {
    return bookings.filter(booking => booking.table_id === tableId);
  };

  const handleStatusChange = async (booking: Booking, newStatus: string) => {
    try {
      console.log(`Updating booking ${booking.id} status from ${booking.status} to ${newStatus}`);
      
      const oldStatus = booking.status;
      const updateData: any = { 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      };

      if (newStatus === 'finished' && oldStatus !== 'finished') {
        const now = new Date();
        const endTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        updateData.end_time = endTime;
        
        const [bookingHour, bookingMin] = booking.booking_time.split(':').map(Number);
        const bookingDate = new Date(booking.booking_date);
        const bookingDateTime = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate(), bookingHour, bookingMin);
        const actualDuration = Math.max(30, Math.floor((now.getTime() - bookingDateTime.getTime()) / (1000 * 60)));
        updateData.duration_minutes = actualDuration;
        
        console.log(`Setting end_time to ${endTime} and duration to ${actualDuration} minutes`);
      }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', booking.id);
      
      if (error) {
        console.error('Database error updating booking status:', error);
        throw error;
      }

      console.log('Booking status updated successfully in database');

      await logAudit({
        booking_id: booking.id,
        change_type: 'status_changed',
        field_name: 'status',
        old_value: oldStatus,
        new_value: newStatus,
        changed_by: 'Host Interface',
        notes: newStatus === 'finished' ? 'End time automatically set to current time' : null
      });
      
      refetchBookings();
      setSelectedBooking({ 
        ...booking, 
        status: newStatus as Booking['status'],
        ...(updateData.end_time && { end_time: updateData.end_time }),
        ...(updateData.duration_minutes && { duration_minutes: updateData.duration_minutes })
      });
      toast({
        title: "Status Updated",
        description: `Booking status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: "Error",
        description: `Failed to update booking status: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const handleBookingUpdate = () => {
    refetchBookings();
  };

  const handleGridClick = (time: string, event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('[data-booking-bar]')) {
      setClickedTime(time);
      
      // Check if the selected date is today and clicked time is current or past
      const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
      const now = new Date();
      const [clickHour, clickMin] = time.split(':').map(Number);
      const clickTime = new Date();
      clickTime.setHours(clickHour, clickMin, 0, 0);
      
      // If today and clicked time is within 30 minutes of now, show walk-in dialog
      const timeDiff = clickTime.getTime() - now.getTime();
      const isWalkInTime = isToday && timeDiff <= 30 * 60 * 1000; // 30 minutes
      
      if (isWalkInTime) {
        setWalkInDialogOpen(true);
      } else {
        // For future times/dates, open booking creation dialog
        setBookingDialogOpen(true);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent, tableId: number) => {
    e.preventDefault();
    setDragOverTable(tableId);
  };

  const handleDragLeave = () => {
    setDragOverTable(null);
  };

  const handleDrop = async (e: React.DragEvent, tableId: number) => {
    e.preventDefault();
    setDragOverTable(null);
    
    try {
      const bookingData = JSON.parse(e.dataTransfer.getData('application/json'));
      
      const { error } = await supabase
        .from('bookings')
        .update({ 
          table_id: tableId,
          is_unallocated: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingData.id);
      
      if (error) throw error;
      
      refetchBookings();
      toast({
        title: "Booking Moved",
        description: `${bookingData.guest_name}'s booking moved to new table`,
      });
    } catch (error) {
      console.error('Drop error:', error);
      toast({
        title: "Error",
        description: "Failed to move booking",
        variant: "destructive"
      });
    }
  };

  const handleBookingDrag = async (bookingId: number, newTime: string, newTableId?: number) => {
    try {
      const updateData: any = { 
        booking_time: newTime,
        updated_at: new Date().toISOString()
      };
      
      if (newTableId !== undefined) {
        updateData.table_id = newTableId;
        updateData.is_unallocated = false;
      }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);
      
      if (error) throw error;
      
      refetchBookings();
      toast({
        title: "Booking Updated",
        description: "Booking time updated successfully",
      });
    } catch (error) {
      console.error('Booking drag error:', error);
      toast({
        title: "Error",
        description: "Failed to update booking time",
        variant: "destructive"
      });
    }
  };

  const generateTimeSlots = () => {
    if (!venueHours) return [];
    const slots = [];
    const [startHour, startMin] = venueHours.start_time.split(':').map(Number);
    let totalMinutes = startHour * 60 + startMin;
    
    for (let i = 0; i < 48; i++) {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      slots.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
      totalMinutes += 15;
    }
    
    return slots;
  };

  const renderTableRow = (table: any, section: any) => {
    const tableBookings = getBookingsForTable(table.id);
    const isDragOver = dragOverTable === table.id;

    return (
      <>
        <div 
          className={`absolute inset-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${isDragOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
          onDragOver={(e) => handleDragOver(e, table.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, table.id)}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const slotWidth = 60;
            const slotIndex = Math.floor(clickX / slotWidth);
            
            if (venueHours) {
              const [startHour, startMin] = venueHours.start_time.split(':').map(Number);
              const totalMinutes = startHour * 60 + startMin + (slotIndex * 15);
              const hours = Math.floor(totalMinutes / 60);
              const minutes = totalMinutes % 60;
              const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
              handleGridClick(timeStr, e);
            }
          }}
        />
        
        <BlockOverlay
          selectedDate={selectedDate}
          venueHours={venueHours}
          tableId={table.id}
        />
        
        {tableBookings.map((booking) => (
          <div key={booking.id} data-booking-bar>
            <TouchOptimizedBookingBar
              booking={booking}
              startTime={venueHours?.start_time || '17:00'}
              onBookingClick={handleBookingClick}
              onBookingDrag={handleBookingDrag}
            />
          </div>
        ))}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-grace-secondary text-grace-background p-4">
      <UnallocatedBookingsBanner
        bookings={getUnallocatedBookings()}
        onAllocateAll={handleAllocateUnallocatedBookings}
        onBookingClick={handleBookingClick}
      />

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-grace-background">
            Host Interface
          </h1>
          <p className="text-grace-background/70 font-karla">
            {format(selectedDate, 'EEEE, MMMM do, yyyy')} • {bookings.length} bookings
          </p>
        </div>
        <div className="flex gap-2">
          <div className="grace-logo text-4xl font-bold text-grace-primary">
            grace
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
        <div className={`${showDetails ? 'col-span-8' : 'col-span-9'} flex flex-col`}>
          <div className="flex-1 overflow-auto bg-grace-secondary/50 rounded-lg border border-grace-background/20">
            <OptimizedTimeGrid 
              venueHours={venueHours}
              tables={tables}
              sections={sections}
              onTableRowRender={renderTableRow}
            />
          </div>
        </div>

        <div className={`${showDetails ? 'col-span-4' : 'col-span-3'} flex flex-col space-y-4`}>
          {showDetails ? (
            <div className="bg-grace-secondary/30 rounded-lg border border-grace-background/20 p-4">
              <BookingDetailsPanel
                booking={selectedBooking}
                onClose={handleCloseDetails}
                onStatusChange={handleStatusChange}
                onBookingUpdate={handleBookingUpdate}
              />
            </div>
          ) : (
            <div className="bg-grace-secondary/30 rounded-lg border border-grace-background/20 p-4">
              <IPadCalendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                bookingDates={bookingDates}
              />
            </div>
          )}
          
          <div className="flex gap-2">
            <BlockDialog
              tables={tables}
              timeSlots={generateTimeSlots()}
              selectedDate={selectedDate}
            />
            <WalkInDialog
              open={walkInDialogOpen}
              onOpenChange={setWalkInDialogOpen}
              selectedDate={format(selectedDate, 'yyyy-MM-dd')}
              selectedTime={clickedTime}
            />
            <FullBookingDialog
              open={bookingDialogOpen}
              onOpenChange={setBookingDialogOpen}
              selectedDate={selectedDate}
              onCreateBooking={async (bookingData) => {
                try {
                  // Get user's venue ID
                  const { data: profile } = await supabase
                    .from('profiles')
                    .select('venue_id')
                    .eq('id', user?.id)
                    .single();
                  
                  if (!profile?.venue_id) {
                    throw new Error('No venue ID found');
                  }

                  const { error } = await supabase
                    .from('bookings')
                    .insert({
                      ...bookingData,
                      venue_id: profile.venue_id
                    });
                  
                  if (error) throw error;
                  
                  handleBookingUpdate();
                  toast({
                    title: "Booking Created",
                    description: `Booking for ${bookingData.guest_name} created successfully`,
                  });
                } catch (error) {
                  console.error('Error creating booking:', error);
                  toast({
                    title: "Error",
                    description: "Failed to create booking",
                    variant: "destructive"
                  });
                }
              }}
            />
          </div>
        </div>
      </div>

      <CancelledBookingsPanel
        selectedDate={selectedDate}
        onBookingRestore={handleBookingUpdate}
      />
    </div>
  );
};

export default HostInterface;
