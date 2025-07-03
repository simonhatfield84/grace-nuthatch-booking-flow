
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Users, Plus, MessageSquare, Phone, Mail } from "lucide-react";

const HostInterface = () => {
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentTime] = useState(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  
  // Time slots for the grid (15-minute intervals)
  const timeSlots = [
    "17:00", "17:15", "17:30", "17:45", 
    "18:00", "18:15", "18:30", "18:45",
    "19:00", "19:15", "19:30", "19:45",
    "20:00", "20:15", "20:30", "20:45",
    "21:00", "21:15", "21:30", "21:45",
    "22:00", "22:15", "22:30", "22:45"
  ];

  // Extended table configuration for 25 tables
  const tables = [
    { id: 1, label: "T1", seats: 2 },
    { id: 2, label: "T2", seats: 2 },
    { id: 3, label: "T3", seats: 4 },
    { id: 4, label: "T4", seats: 4 },
    { id: 5, label: "T5", seats: 6 },
    { id: 6, label: "T6", seats: 8 },
    { id: 7, label: "T7", seats: 2 },
    { id: 8, label: "T8", seats: 4 },
    { id: 9, label: "T9", seats: 4 },
    { id: 10, label: "T10", seats: 6 },
    { id: 11, label: "T11", seats: 2 },
    { id: 12, label: "T12", seats: 2 },
    { id: 13, label: "T13", seats: 4 },
    { id: 14, label: "T14", seats: 4 },
    { id: 15, label: "T15", seats: 6 },
    { id: 16, label: "T16", seats: 8 },
    { id: 17, label: "T17", seats: 2 },
    { id: 18, label: "T18", seats: 4 },
    { id: 19, label: "T19", seats: 4 },
    { id: 20, label: "T20", seats: 6 },
    { id: 21, label: "T21", seats: 2 },
    { id: 22, label: "T22", seats: 2 },
    { id: 23, label: "T23", seats: 4 },
    { id: 24, label: "T24", seats: 4 },
    { id: 25, label: "T25", seats: 6 },
  ];

  // Updated reservations with duration spans
  const [reservations, setReservations] = useState([
    { id: 1, tableId: 1, startTime: "18:00", duration: 4, guest: "Sarah Johnson", party: 2, service: "Dinner", status: "confirmed", phone: "+44 7700 900123", email: "sarah@email.com", notes: "Vegetarian options" },
    { id: 2, tableId: 3, startTime: "19:00", duration: 6, guest: "Mike Chen", party: 4, service: "Dinner", status: "seated", phone: "+44 7700 900456", email: "mike@email.com", notes: "Birthday celebration" },
    { id: 3, tableId: 5, startTime: "19:30", duration: 8, guest: "Emma Wilson", party: 6, service: "Dinner", status: "confirmed", phone: "+44 7700 900789", email: "emma@email.com", notes: "Business dinner" },
    { id: 4, tableId: 2, startTime: "20:00", duration: 6, guest: "James Brown", party: 2, service: "Dinner", status: "late", phone: "+44 7700 900012", email: "james@email.com", notes: "Anniversary" },
    { id: 5, tableId: 4, startTime: "20:30", duration: 4, guest: "Lisa Davis", party: 4, service: "Dinner", status: "confirmed", phone: "+44 7700 900345", email: "lisa@email.com", notes: "Dietary requirements" },
  ]);

  const [selectedReservation, setSelectedReservation] = useState(null);

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

  const updateReservationStatus = (reservationId: number, newStatus: string) => {
    setReservations(reservations.map(r => 
      r.id === reservationId ? { ...r, status: newStatus } : r
    ));
  };

  const getCurrentTimePosition = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    
    const startTime = 17 * 60; // 17:00 in minutes
    const endTime = 23 * 60; // 23:00 in minutes
    
    if (currentTotalMinutes < startTime || currentTotalMinutes > endTime) return null;
    
    const percentage = ((currentTotalMinutes - startTime) / (endTime - startTime)) * 100;
    return percentage;
  };

  const timeLinePosition = getCurrentTimePosition();

  return (
    <div className="min-h-screen bg-grace-dark text-grace-light p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header - more compact */}
        <div className="flex justify-between items-center">
          <div>
            <div className="grace-logo text-2xl font-bold mb-1">grace</div>
            <h1 className="text-xl font-playfair font-bold">Host Interface</h1>
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
            <Button variant="outline" size="sm" className="bg-grace-accent text-grace-light border-grace-accent hover:bg-grace-accent/90">
              <Plus className="h-4 w-4 mr-2" strokeWidth={2} />
              Walk-in
            </Button>
            <Button variant="outline" size="sm" className="bg-grace-secondary text-grace-light border-grace-secondary hover:bg-grace-secondary/90">
              <MessageSquare className="h-4 w-4 mr-2" strokeWidth={2} />
              Messages
            </Button>
          </div>
        </div>

        {/* Stats Cards - more compact */}
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

        {/* Reservation Grid - Compact and Scrollable */}
        <Card className="bg-grace-dark border-grace-accent/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-grace-light text-lg">Reservation Grid</CardTitle>
            <CardDescription className="text-grace-light/70 text-sm">
              Tap any cell to view details or add reservations
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative">
              {/* Fixed table column */}
              <div className="flex">
                <div className="flex-shrink-0 w-16 bg-grace-dark border-r border-grace-accent/30">
                  {/* Header */}
                  <div className="h-8 flex items-center justify-center text-xs font-medium text-grace-light/70 border-b border-grace-accent/30">
                    Table
                  </div>
                  {/* Table rows */}
                  {tables.map(table => (
                    <div key={table.id} className="h-10 flex items-center justify-center bg-grace-accent/20 border-b border-grace-accent/30 text-grace-light">
                      <div className="text-center">
                        <div className="text-xs font-bold">{table.label}</div>
                        <div className="text-xs text-grace-light/70">{table.seats}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Scrollable time slots */}
                <ScrollArea className="flex-1">
                  <div className="relative">
                    {/* Current time line */}
                    {timeLinePosition !== null && (
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-grace-secondary z-10 pointer-events-none"
                        style={{ left: `${timeLinePosition * 0.88}%` }}
                      />
                    )}
                    
                    <div className="flex">
                      {/* Time header */}
                      <div className="flex h-8 border-b border-grace-accent/30">
                        {timeSlots.map(time => (
                          <div key={time} className="w-16 flex-shrink-0 flex items-center justify-center text-xs font-medium text-grace-light/70 border-r border-grace-accent/30">
                            {time}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Table rows with time slots */}
                    {tables.map(table => (
                      <div key={table.id} className="flex h-10 border-b border-grace-accent/30">
                        {timeSlots.map(time => {
                          const reservation = getReservationForTableAndTime(table.id, time);
                          const isStart = reservation && isReservationStart(reservation, time);
                          return (
                            <div 
                              key={`${table.id}-${time}`}
                              className={`w-16 flex-shrink-0 border-r border-grace-accent/30 cursor-pointer hover:bg-grace-accent/10 transition-colors flex items-center justify-center ${
                                reservation ? getStatusColor(reservation.status) : 'bg-grace-dark'
                              }`}
                              onClick={() => reservation && setSelectedReservation(reservation)}
                            >
                              {reservation && isStart && (
                                <div className="text-xs text-center px-1">
                                  <div className="font-medium truncate text-xs leading-tight">{reservation.guest.split(' ')[0]}</div>
                                  <div className="text-xs opacity-75">{reservation.party}</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reservation Details Modal */}
        {selectedReservation && (
          <Card className="bg-grace-dark border-grace-accent/30">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-grace-light">Reservation Details</CardTitle>
                  <CardDescription className="text-grace-light/70">
                    Table {tables.find(t => t.id === selectedReservation.tableId)?.label} • {selectedReservation.startTime} ({selectedReservation.duration * 15} mins)
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedReservation(null)}
                  className="text-grace-light/70 hover:text-grace-light"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarFallback className="bg-grace-accent text-grace-light">
                    {selectedReservation.guest.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium text-grace-light">{selectedReservation.guest}</h3>
                  <div className="flex items-center gap-4 text-sm text-grace-light/70">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" strokeWidth={2} />
                      {selectedReservation.party} guests
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" strokeWidth={2} />
                      {selectedReservation.service}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-grace-light/70">
                    <Phone className="h-4 w-4" strokeWidth={2} />
                    <span>{selectedReservation.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-grace-light/70">
                    <Mail className="h-4 w-4" strokeWidth={2} />
                    <span>{selectedReservation.email}</span>
                  </div>
                </div>
                <div>
                  <Badge className={getStatusColor(selectedReservation.status)}>
                    {selectedReservation.status}
                  </Badge>
                </div>
              </div>

              {selectedReservation.notes && (
                <div className="p-3 bg-grace-accent/10 rounded">
                  <p className="text-sm text-grace-light">{selectedReservation.notes}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-4">
                <Button 
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => updateReservationStatus(selectedReservation.id, 'seated')}
                >
                  Seat Guests
                </Button>
                <Button 
                  size="sm"
                  className="bg-grace-accent hover:bg-grace-accent/90 text-grace-light"
                  onClick={() => updateReservationStatus(selectedReservation.id, 'finished')}
                >
                  Mark Finished
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="border-grace-secondary text-grace-secondary hover:bg-grace-secondary hover:text-grace-light"
                >
                  <MessageSquare className="h-4 w-4 mr-2" strokeWidth={2} />
                  Message
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
                  onClick={() => updateReservationStatus(selectedReservation.id, 'cancelled')}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HostInterface;
