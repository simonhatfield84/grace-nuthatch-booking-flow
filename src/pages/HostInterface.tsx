
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, Users, Plus, MessageSquare, Phone, Mail } from "lucide-react";

const HostInterface = () => {
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentTime] = useState(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  
  // Time slots for the grid (30-minute intervals)
  const timeSlots = [
    "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"
  ];

  // Table configuration
  const tables = [
    { id: 1, label: "T1", seats: 2 },
    { id: 2, label: "T2", seats: 2 },
    { id: 3, label: "T3", seats: 4 },
    { id: 4, label: "T4", seats: 4 },
    { id: 5, label: "T5", seats: 6 },
    { id: 6, label: "T6", seats: 8 },
  ];

  // Sample reservations
  const [reservations, setReservations] = useState([
    { id: 1, tableId: 1, time: "18:00", guest: "Sarah Johnson", party: 2, service: "Dinner", status: "confirmed", phone: "+44 7700 900123", email: "sarah@email.com", notes: "Vegetarian options" },
    { id: 2, tableId: 3, time: "19:00", guest: "Mike Chen", party: 4, service: "Dinner", status: "seated", phone: "+44 7700 900456", email: "mike@email.com", notes: "Birthday celebration" },
    { id: 3, tableId: 5, time: "19:30", guest: "Emma Wilson", party: 6, service: "Dinner", status: "confirmed", phone: "+44 7700 900789", email: "emma@email.com", notes: "Business dinner" },
    { id: 4, tableId: 2, time: "20:00", guest: "James Brown", party: 2, service: "Dinner", status: "late", phone: "+44 7700 900012", email: "james@email.com", notes: "Anniversary" },
    { id: 5, tableId: 4, time: "20:30", guest: "Lisa Davis", party: 4, service: "Dinner", status: "confirmed", phone: "+44 7700 900345", email: "lisa@email.com", notes: "Dietary requirements" },
  ]);

  const [selectedReservation, setSelectedReservation] = useState(null);

  const getReservationForTableAndTime = (tableId: number, time: string) => {
    return reservations.find(r => r.tableId === tableId && r.time === time);
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
    
    const startTime = 17.5 * 60; // 17:30 in minutes
    const endTime = 22 * 60; // 22:00 in minutes
    
    if (currentTotalMinutes < startTime || currentTotalMinutes > endTime) return null;
    
    const percentage = ((currentTotalMinutes - startTime) / (endTime - startTime)) * 100;
    return percentage;
  };

  const timeLinePosition = getCurrentTimePosition();

  return (
    <div className="min-h-screen bg-grace-dark text-grace-light p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <div className="grace-logo text-3xl font-bold mb-2">grace</div>
            <h1 className="text-2xl font-playfair font-bold">Host Interface</h1>
            <p className="text-grace-light/70">
              {new Date(selectedDate).toLocaleDateString('en-GB', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} • Current time: {currentTime}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-grace-accent text-grace-light border-grace-accent hover:bg-grace-accent/90">
              <Plus className="h-4 w-4 mr-2" strokeWidth={2} />
              Walk-in
            </Button>
            <Button variant="outline" className="bg-grace-secondary text-grace-light border-grace-secondary hover:bg-grace-secondary/90">
              <MessageSquare className="h-4 w-4 mr-2" strokeWidth={2} />
              Messages
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-grace-dark border-grace-accent/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-grace-light">{reservations.length}</div>
              <div className="text-sm text-grace-light/70">Today's Reservations</div>
            </CardContent>
          </Card>
          <Card className="bg-grace-dark border-grace-accent/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-grace-light">
                {reservations.filter(r => r.status === 'seated').length}
              </div>
              <div className="text-sm text-grace-light/70">Currently Seated</div>
            </CardContent>
          </Card>
          <Card className="bg-grace-dark border-grace-accent/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-grace-light">
                {reservations.reduce((sum, r) => sum + r.party, 0)}
              </div>
              <div className="text-sm text-grace-light/70">Total Covers</div>
            </CardContent>
          </Card>
          <Card className="bg-grace-dark border-grace-accent/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-grace-light">
                {tables.length - new Set(reservations.filter(r => r.status === 'seated').map(r => r.tableId)).size}
              </div>
              <div className="text-sm text-grace-light/70">Available Tables</div>
            </CardContent>
          </Card>
        </div>

        {/* Reservation Grid */}
        <Card className="bg-grace-dark border-grace-accent/30">
          <CardHeader>
            <CardTitle className="text-grace-light">Reservation Grid</CardTitle>
            <CardDescription className="text-grace-light/70">
              Tap any cell to view details or add reservations
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="relative">
              {/* Current time line */}
              {timeLinePosition !== null && (
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-grace-secondary z-10 pointer-events-none"
                  style={{ left: `${12 + (timeLinePosition * 0.88)}%` }}
                />
              )}
              
              <div className="grid grid-cols-11 gap-2 min-w-[800px]">
                {/* Header row */}
                <div className="p-2 text-sm font-medium text-grace-light/70">Table</div>
                {timeSlots.map(time => (
                  <div key={time} className="p-2 text-sm font-medium text-center text-grace-light/70">
                    {time}
                  </div>
                ))}

                {/* Table rows */}
                {tables.map(table => (
                  <div key={table.id} className="contents">
                    <div className="p-3 text-sm font-medium bg-grace-accent/20 rounded text-grace-light flex items-center justify-center">
                      <div>
                        <div className="font-bold">{table.label}</div>
                        <div className="text-xs text-grace-light/70">{table.seats} seats</div>
                      </div>
                    </div>
                    {timeSlots.map(time => {
                      const reservation = getReservationForTableAndTime(table.id, time);
                      return (
                        <div 
                          key={`${table.id}-${time}`}
                          className={`p-2 min-h-[60px] border border-grace-accent/30 rounded cursor-pointer hover:bg-grace-accent/10 transition-colors ${
                            reservation ? getStatusColor(reservation.status) : 'bg-grace-dark'
                          }`}
                          onClick={() => reservation && setSelectedReservation(reservation)}
                        >
                          {reservation && (
                            <div className="text-xs">
                              <div className="font-medium truncate">{reservation.guest}</div>
                              <div className="text-xs opacity-75">{reservation.party} guests</div>
                              <Badge variant="outline" className="text-xs mt-1">
                                {reservation.status}
                              </Badge>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
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
                    Table {tables.find(t => t.id === selectedReservation.tableId)?.label} • {selectedReservation.time}
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
