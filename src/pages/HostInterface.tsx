import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MessageSquare, Ban, AlertTriangle } from "lucide-react";
import { WalkInDialog } from "@/components/WalkInDialog";
import { BlockDialog } from "@/components/BlockDialog";
import { ReservationPopup } from "@/components/ReservationPopup";
import { useSections } from "@/hooks/useSections";
import { useTables } from "@/hooks/useTables";
import { useBookings } from "@/hooks/useBookings";

const HostInterface = () => {
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentTime] = useState(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  const [draggedReservation, setDraggedReservation] = useState(null);
  const [walkInDialogOpen, setWalkInDialogOpen] = useState(false);
  const [selectedTableForWalkIn, setSelectedTableForWalkIn] = useState<number | null>(null);
  const [selectedTimeForWalkIn, setSelectedTimeForWalkIn] = useState<string | null>(null);
  const [selectedBlockForEdit, setSelectedBlockForEdit] = useState(null);
  
  const { sections } = useSections();
  const { tables } = useTables();
  const { bookings, updateBooking } = useBookings(selectedDate);

  // Time slots for the grid (15-minute intervals)
  const timeSlots = [
    "17:00", "17:15", "17:30", "17:45", 
    "18:00", "18:15", "18:30", "18:45",
    "19:00", "19:15", "19:30", "19:45",
    "20:00", "20:15", "20:30", "20:45",
    "21:00", "21:15", "21:30", "21:45",
    "22:00", "22:15", "22:30", "22:45"
  ];

  const [blockedSlots, setBlockedSlots] = useState([]);

  // Convert database reservations to host interface format
  const reservations = bookings.map(booking => ({
    id: booking.id,
    tableId: booking.table_id,
    startTime: booking.booking_time,
    duration: 4, // Default duration, could be calculated
    guest: booking.guest_name,
    party: booking.party_size,
    service: booking.service,
    status: booking.status as 'confirmed' | 'seated' | 'finished' | 'cancelled' | 'late',
    phone: booking.phone || "",
    email: booking.email || "",
    notes: booking.notes || "",
    isUnallocated: booking.is_unallocated
  }));

  const getTablesBySection = () => {
    const tablesBySection = sections.map(section => ({
      ...section,
      tables: tables.filter(table => table.section_id === section.id)
    }));
    return tablesBySection;
  };

  const getReservationForTableAndTime = (tableId: number, time: string) => {
    return reservations.find(r => {
      if (r.tableId !== tableId) return false;
      
      const startIndex = timeSlots.indexOf(r.startTime);
      const timeIndex = timeSlots.indexOf(time);
      
      return timeIndex >= startIndex && timeIndex < startIndex + r.duration;
    });
  };

  const isReservationStart = (reservation: any, time: string) => {
    return reservation.startTime === time;
  };

  const isReservationEnd = (reservation: any, time: string) => {
    const startIndex = timeSlots.indexOf(reservation.startTime);
    const timeIndex = timeSlots.indexOf(time);
    return timeIndex === startIndex + reservation.duration - 1;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'seated': return 'bg-green-100 text-green-800 border-green-200';
      case 'finished': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'late': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const updateReservationStatus = async (reservationId: number, newStatus: string) => {
    await updateBooking({ id: reservationId, updates: { status: newStatus as any } });
  };

  const handleReservationDragStart = (e: React.DragEvent, reservation: any) => {
    setDraggedReservation(reservation);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleReservationDrop = async (e: React.DragEvent, tableId: number, time: string) => {
    e.preventDefault();
    if (draggedReservation) {
      await updateBooking({ 
        id: draggedReservation.id, 
        updates: { 
          table_id: tableId, 
          booking_time: time 
        } 
      });
      setDraggedReservation(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleCellClick = (tableId: number, time: string) => {
    const reservation = getReservationForTableAndTime(tableId, time);
    const isBlocked = isSlotBlocked(tableId, time);
    
    if (isBlocked) {
      const block = blockedSlots.find(block => {
        if (block.tableIds.includes(tableId.toString()) || block.tableIds.includes('all')) {
          const timeIndex = timeSlots.indexOf(time);
          const startIndex = timeSlots.indexOf(block.fromTime);
          const endIndex = timeSlots.indexOf(block.toTime);
          return timeIndex >= startIndex && timeIndex <= endIndex;
        }
        return false;
      });
      if (block) {
        setSelectedBlockForEdit(block);
      }
      return;
    }
    
    if (!reservation) {
      setSelectedTableForWalkIn(tableId);
      setSelectedTimeForWalkIn(time);
      setWalkInDialogOpen(true);
    }
  };

  const getCurrentTimePosition = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    
    const startTime = 17 * 60;
    const endTime = 23 * 60;
    
    if (currentTotalMinutes < startTime || currentTotalMinutes > endTime) return null;
    
    const percentage = ((currentTotalMinutes - startTime) / (endTime - startTime)) * 100;
    return percentage;
  };

  const timeLinePosition = getCurrentTimePosition();

  const isSlotBlocked = (tableId: number, time: string) => {
    return blockedSlots.some(block => {
      if (block.tableIds.includes(tableId.toString()) || block.tableIds.includes('all')) {
        const timeIndex = timeSlots.indexOf(time);
        const startIndex = timeSlots.indexOf(block.fromTime);
        const endIndex = timeSlots.indexOf(block.toTime);
        return timeIndex >= startIndex && timeIndex <= endIndex;
      }
      return false;
    });
  };

  const tablesBySection = getTablesBySection();
  const unallocatedReservations = reservations.filter(r => r.isUnallocated);

  return (
    <div className="min-h-screen bg-grace-dark text-grace-light p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="grace-logo text-2xl font-bold mb-1">grace</div>
            <p className="text-sm text-grace-light/70">
              {new Date(selectedDate).toLocaleDateString('en-GB', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} • Current time: {currentTime}
            </p>
          </div>
          <div className="flex gap-2">
            <WalkInDialog 
              tables={tables}
              timeSlots={timeSlots}
              reservations={reservations}
              setReservations={() => {}}
              open={walkInDialogOpen}
              onOpenChange={setWalkInDialogOpen}
              preSelectedTable={selectedTableForWalkIn}
              preSelectedTime={selectedTimeForWalkIn}
            />
            <BlockDialog 
              tables={tables}
              timeSlots={timeSlots}
              blockedSlots={blockedSlots}
              setBlockedSlots={setBlockedSlots}
              selectedBlock={selectedBlockForEdit}
            />
            <Button variant="outline" size="sm" className="bg-grace-secondary text-grace-light border-grace-secondary hover:bg-grace-secondary/90">
              <MessageSquare className="h-4 w-4 mr-2" strokeWidth={2} />
              Messages
            </Button>
          </div>
        </div>

        {unallocatedReservations.length > 0 && (
          <Card className="bg-red-900/30 border-red-500/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <div>
                  <p className="text-red-100 font-medium">
                    {unallocatedReservations.length} Unallocated Reservation{unallocatedReservations.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-red-200 text-sm">
                    These reservations need table reassignment
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card className="bg-grace-dark border-grace-accent/30">
            <CardContent className="p-3">
              <div className="text-xl font-bold text-grace-light">{reservations.length}</div>
              <div className="text-xs text-grace-light/70">Today's Reservations</div>
            </CardContent>
          </Card>
          <Card className="bg-grace-dark border-grace-accent/30">
            <CardContent className="p-3">
              <div className="text-xl font-bold text-grace-light">
                {reservations.filter(r => r.status === 'seated').length}
              </div>
              <div className="text-xs text-grace-light/70">Currently Seated</div>
            </CardContent>
          </Card>
          <Card className="bg-grace-dark border-grace-accent/30">
            <CardContent className="p-3">
              <div className="text-xl font-bold text-grace-light">
                {reservations.reduce((sum, r) => sum + r.party, 0)}
              </div>
              <div className="text-xs text-grace-light/70">Total Covers</div>
            </CardContent>
          </Card>
          <Card className="bg-grace-dark border-grace-accent/30">
            <CardContent className="p-3">
              <div className="text-xl font-bold text-grace-light">
                {tables.length - new Set(reservations.filter(r => r.status === 'seated').map(r => r.tableId)).size}
              </div>
              <div className="text-xs text-grace-light/70">Available Tables</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-grace-dark border-grace-accent/30">
          <CardContent className="p-0">
            <div className="relative">
              <div className="flex">
                <div className="flex-shrink-0 w-20 bg-grace-dark border-r border-grace-accent/30">
                  <div className="h-8 flex items-center justify-center text-xs font-medium text-grace-light/70 border-b border-grace-accent/30">
                    Table
                  </div>
                  {tablesBySection.map(section => (
                    <div key={section.id}>
                      <div className="h-6 flex items-center justify-center text-xs font-bold text-grace-light border-b border-grace-accent/30"
                           style={{ backgroundColor: `${section.color}20`, borderColor: section.color }}>
                        {section.name}
                      </div>
                      {section.tables.map(table => (
                        <div key={table.id} className="h-8 flex items-center justify-center bg-grace-accent/20 border-b border-grace-accent/30 text-grace-light">
                          <div className="text-center">
                            <div className="text-xs font-bold">{table.label}</div>
                            <div className="text-xs text-grace-light/70">{table.seats}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <ScrollArea className="flex-1">
                  <div className="relative">
                    {timeLinePosition !== null && (
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-grace-secondary z-10 pointer-events-none"
                        style={{ left: `${timeLinePosition * 0.88}%` }}
                      />
                    )}
                    
                    <div className="flex">
                      <div className="flex h-8 border-b border-grace-accent/30">
                        {timeSlots.map(time => (
                          <div key={time} className="w-12 flex-shrink-0 flex items-center justify-center text-xs font-medium text-grace-light/70 border-r border-grace-accent/30">
                            {time}
                          </div>
                        ))}
                      </div>
                    </div>

                    {tablesBySection.map(section => (
                      <div key={section.id}>
                        <div className="flex h-6 border-b border-grace-accent/30"
                             style={{ backgroundColor: `${section.color}10` }}>
                          {timeSlots.map(time => (
                            <div key={time} className="w-12 flex-shrink-0 border-r border-grace-accent/30" />
                          ))}
                        </div>
                        {section.tables.map(table => (
                          <div key={table.id} className="flex h-8 border-b border-grace-accent/30">
                            {timeSlots.map(time => {
                              const reservation = getReservationForTableAndTime(table.id, time);
                              const isStart = reservation && isReservationStart(reservation, time);
                              const isEnd = reservation && isReservationEnd(reservation, time);
                              const isBlocked = isSlotBlocked(table.id, time);
                              
                              return (
                                <div 
                                  key={`${table.id}-${time}`}
                                  className={`w-12 flex-shrink-0 border-r border-grace-accent/30 cursor-pointer hover:bg-grace-accent/10 transition-colors flex items-center justify-center relative ${
                                    isBlocked 
                                      ? 'bg-red-900/30 border-red-500/50' 
                                      : reservation 
                                        ? `${getStatusColor(reservation.status)} ${isStart ? 'rounded-l' : ''} ${isEnd ? 'rounded-r' : ''} ${!isStart && !isEnd ? 'border-l-0 border-r-0' : ''}` 
                                        : 'bg-grace-dark hover:bg-grace-accent/10'
                                  }`}
                                  draggable={!!reservation && isStart}
                                  onDragStart={(e) => reservation && isStart && handleReservationDragStart(e, reservation)}
                                  onDrop={(e) => handleReservationDrop(e, table.id, time)}
                                  onDragOver={handleDragOver}
                                  onClick={() => handleCellClick(table.id, time)}
                                >
                                  {reservation && (
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <div className="absolute inset-0 flex items-center justify-center cursor-pointer">
                                          {isStart && (
                                            <div className="text-xs text-center px-1 w-full h-full flex flex-col justify-center">
                                              <div className="font-medium truncate text-xs leading-tight">{reservation.guest.split(' ')[0]}</div>
                                              <div className="text-xs opacity-75">{reservation.party}p • {reservation.service}</div>
                                            </div>
                                          )}
                                        </div>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-80 bg-grace-dark border-grace-accent/30">
                                        <ReservationPopup 
                                          reservation={reservation}
                                          table={tables.find(t => t.id === reservation.tableId)}
                                          updateReservationStatus={updateReservationStatus}
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  )}
                                  {isBlocked && !reservation && (
                                    <Ban className="h-3 w-3 text-red-400" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HostInterface;
