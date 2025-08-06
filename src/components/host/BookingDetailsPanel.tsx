import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Users, Clock, Phone, Mail, MapPin, FileText, Calendar, Hash, Edit, Save, Plus } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { Booking } from "@/features/booking/types/booking";
import { BookingAuditTrail } from "./BookingAuditTrail";
import { PaymentStatus } from "@/components/payments/PaymentStatus";
import { useTables } from "@/hooks/useTables";
import { useServices } from "@/hooks/useServices";
import { useToast } from "@/hooks/use-toast";
import { useBookings } from "@/hooks/useBookings";
import { supabase } from "@/integrations/supabase/client";
import { EnhancedCancellationDialog } from "./EnhancedCancellationDialog";
import { useQueryClient } from "@tanstack/react-query";

interface BookingDetailsPanelProps {
  booking: Booking | null;
  onClose: () => void;
  onStatusChange: (booking: Booking, newStatus: string) => void;
  onBookingUpdate: () => void;
}

export const BookingDetailsPanel = ({ 
  booking, 
  onClose, 
  onStatusChange, 
  onBookingUpdate 
}: BookingDetailsPanelProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Booking>>({});
  const [cancellationDialogOpen, setCancellationDialogOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const { tables } = useTables();
  const { services } = useServices();
  const { updateBooking } = useBookings();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (!booking) return null;

  // Load payment data for cancellation workflow
  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        const { data: payment } = await supabase
          .from('booking_payments')
          .select('*')
          .eq('booking_id', booking.id)
          .maybeSingle();

        setPaymentData(payment);
      } catch (error) {
        console.error('Error loading payment data:', error);
      }
    };

    if (booking) {
      loadPaymentData();
    }
  }, [booking.id]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-[#C2D8E9] text-[#111315] border-[#C2D8E9]/30';
      case 'seated':
        return 'bg-[#CCF0DB] text-[#111315] border-[#CCF0DB]/30';
      case 'finished':
        return 'bg-[#676767] text-white border-[#676767]/30';
      case 'cancelled':
        return 'bg-[#E47272] text-white border-[#E47272]/30';
      case 'late':
        return 'bg-[#F1C8D0] text-[#111315] border-[#F1C8D0]/30';
      case 'no-show':
        return 'bg-[#E47272] text-white border-[#E47272]/30';
      default:
        return 'bg-[#C2D8E9] text-[#111315] border-[#C2D8E9]/30';
    }
  };

  const statusOptions = ['confirmed', 'seated', 'finished', 'cancelled', 'late', 'no-show'];

  const getAvailableTables = () => {
    return tables.filter(table => table.seats >= booking.party_size);
  };

  const handleTableAssignment = async (tableId: string) => {
    try {
      await updateBooking({
        id: booking.id,
        updates: { table_id: parseInt(tableId) }
      });
      
      toast({
        title: "Table Assigned",
        description: `Booking assigned to table ${tables.find(t => t.id === parseInt(tableId))?.label}`,
      });
      onBookingUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign table",
        variant: "destructive"
      });
    }
  };

  const handleServiceChange = async (serviceTitle: string) => {
    try {
      await updateBooking({
        id: booking.id,
        updates: { service: serviceTitle }
      });
      
      toast({
        title: "Service Updated",
        description: `Service changed to ${serviceTitle}`,
      });
      onBookingUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update service",
        variant: "destructive"
      });
    }
  };

  const handleEditStart = () => {
    setEditForm({
      guest_name: booking.guest_name,
      party_size: booking.party_size,
      booking_time: booking.booking_time,
      duration_minutes: booking.duration_minutes || 120,
      phone: booking.phone || '',
      email: booking.email || '',
      notes: booking.notes || '',
    });
    setIsEditing(true);
  };

  const handleEditSave = async () => {
    try {
      await updateBooking({
        id: booking.id,
        updates: editForm
      });
      
      setIsEditing(false);
      onBookingUpdate();
      toast({
        title: "Booking Updated",
        description: "Booking details have been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update booking",
        variant: "destructive"
      });
    }
  };

  const handleDurationAdjust = (minutes: number) => {
    const currentDuration = editForm.duration_minutes || 120;
    const newDuration = Math.max(15, currentDuration + minutes);
    setEditForm({...editForm, duration_minutes: newDuration});
  };

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'cancelled') {
      // Open enhanced cancellation dialog instead of direct status change
      setCancellationDialogOpen(true);
    } else {
      // Use original status change logic for all other statuses
      onStatusChange(booking, newStatus);
    }
  };

  const handleCancellationComplete = async () => {
    console.log('Cancellation completed, refreshing booking data...');
    
    // Invalidate all relevant queries to ensure fresh data
    await queryClient.invalidateQueries({
      queryKey: ['booking-payment', booking.id]
    });
    await queryClient.invalidateQueries({
      queryKey: ['booking-accurate-payment', booking.id]
    });
    await queryClient.invalidateQueries({
      queryKey: ['bookings']
    });
    
    // Call the parent's update handler
    onBookingUpdate();
    
    // Close the cancellation dialog
    setCancellationDialogOpen(false);
  };

  const currentTable = tables.find(t => t.id === booking.table_id);

  return (
    <>
      <Card className="h-full flex flex-col bg-[#292C2D] border-[#676767]/20 text-white rounded-2xl shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-[#676767]/20">
          <CardTitle className="text-lg font-semibold text-white font-inter">
            Booking Details
          </CardTitle>
          <div className="flex gap-2">
            {!isEditing && (
              <Button variant="ghost" size="sm" onClick={handleEditStart} className="text-white hover:text-[#CCF0DB] hover:bg-[#676767]/20 rounded-xl">
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:text-[#E47272] hover:bg-[#676767]/20 rounded-xl">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 space-y-6 pt-4">
          <ScrollArea className="flex-1">
            <div className="space-y-6">
              {/* Guest Information */}
              <div>
                <h3 className="font-medium text-sm mb-3 flex items-center gap-2 text-white font-inter">
                  <Users className="h-4 w-4 text-[#CCF0DB]" />
                  Guest Information
                </h3>
                <div className="space-y-3 bg-[#111315] p-4 rounded-xl border border-[#676767]/20">
                  {isEditing ? (
                    <>
                      <div>
                        <Label htmlFor="guest_name" className="text-white font-inter">Name</Label>
                        <Input
                          id="guest_name"
                          value={editForm.guest_name || ''}
                          onChange={(e) => setEditForm({...editForm, guest_name: e.target.value})}
                          className="bg-[#676767]/20 border-[#676767]/30 text-white font-inter rounded-xl"
                        />
                      </div>
                      <div>
                        <Label htmlFor="party_size" className="text-white font-inter">Party Size</Label>
                        <Input
                          id="party_size"
                          type="number"
                          value={editForm.party_size || ''}
                          onChange={(e) => setEditForm({...editForm, party_size: parseInt(e.target.value)})}
                          className="bg-[#676767]/20 border-[#676767]/30 text-white font-inter rounded-xl"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-white font-inter">Phone</Label>
                        <Input
                          id="phone"
                          value={editForm.phone || ''}
                          onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                          className="bg-[#676767]/20 border-[#676767]/30 text-white font-inter rounded-xl"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-white font-inter">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={editForm.email || ''}
                          onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                          className="bg-[#676767]/20 border-[#676767]/30 text-white font-inter rounded-xl"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#676767] font-inter">Name:</span>
                        <span className="font-medium text-white font-inter">{booking.guest_name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#676767] font-inter">Party Size:</span>
                        <span className="font-medium text-white font-inter">{booking.party_size} guests</span>
                      </div>
                      {booking.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#676767] flex items-center gap-1 font-inter">
                            <Phone className="h-3 w-3" />
                            Phone:
                          </span>
                          <span className="font-medium text-white font-inter">{booking.phone}</span>
                        </div>
                      )}
                      {booking.email && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#676767] flex items-center gap-1 font-inter">
                            <Mail className="h-3 w-3" />
                            Email:
                          </span>
                          <span className="font-medium text-sm text-white font-inter">{booking.email}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <Separator className="bg-[#676767]/20" />

              {/* Booking Information */}
              <div>
                <h3 className="font-medium text-sm mb-3 flex items-center gap-2 text-white font-inter">
                  <Calendar className="h-4 w-4 text-[#C2D8E9]" />
                  Booking Information
                </h3>
                <div className="space-y-3 bg-[#111315] p-4 rounded-xl border border-[#676767]/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#676767] flex items-center gap-1 font-inter">
                      <Hash className="h-3 w-3" />
                      Booking ID:
                    </span>
                    <span className="font-medium text-sm text-white font-inter">
                      {booking.booking_reference || `#${booking.id}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#676767] font-inter">Date:</span>
                    <span className="font-medium text-white font-inter">
                      {format(new Date(booking.booking_date), 'EEEE, MMM d, yyyy')}
                    </span>
                  </div>
                  
                  {isEditing ? (
                    <>
                      <div>
                        <Label htmlFor="booking_time" className="text-white font-inter">Time</Label>
                        <Input
                          id="booking_time"
                          type="time"
                          value={editForm.booking_time || ''}
                          onChange={(e) => setEditForm({...editForm, booking_time: e.target.value})}
                          className="bg-[#676767]/20 border-[#676767]/30 text-white font-inter rounded-xl"
                        />
                      </div>
                      <div>
                        <Label htmlFor="duration" className="text-white font-inter">Duration (minutes)</Label>
                        <div className="space-y-2">
                          <Input
                            id="duration"
                            type="number"
                            value={editForm.duration_minutes || ''}
                            onChange={(e) => setEditForm({...editForm, duration_minutes: parseInt(e.target.value)})}
                            className="bg-[#676767]/20 border-[#676767]/30 text-white font-inter rounded-xl"
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleDurationAdjust(15)}
                              className="bg-[#676767]/20 hover:bg-[#CCF0DB]/20 text-white border-[#676767]/30 rounded-xl font-inter"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              15m
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleDurationAdjust(30)}
                              className="bg-[#676767]/20 hover:bg-[#CCF0DB]/20 text-white border-[#676767]/30 rounded-xl font-inter"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              30m
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleDurationAdjust(60)}
                              className="bg-[#676767]/20 hover:bg-[#CCF0DB]/20 text-white border-[#676767]/30 rounded-xl font-inter"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              60m
                            </Button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#676767] flex items-center gap-1 font-inter">
                          <Clock className="h-3 w-3" />
                          Time:
                        </span>
                        <span className="font-medium text-white font-inter">
                          {booking.booking_time}
                          {booking.end_time && booking.status === 'finished' && 
                            ` - ${booking.end_time}`
                          }
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#676767] font-inter">Duration:</span>
                        <span className="font-medium text-white font-inter">
                          {Math.floor((booking.duration_minutes || 120) / 60)}h {((booking.duration_minutes || 120) % 60)}m
                        </span>
                      </div>
                    </>
                  )}

                  {/* Service Selection */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#676767] font-inter">Service:</span>
                    <Select value={booking.service || 'Dinner'} onValueChange={handleServiceChange}>
                      <SelectTrigger className="w-32 h-8 text-sm bg-[#676767]/20 border-[#676767]/30 text-white rounded-xl font-inter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#292C2D] border-[#676767]/30 rounded-xl">
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.title} className="text-white hover:bg-[#676767]/20 font-inter">
                            {service.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Table Assignment */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#676767] flex items-center gap-1 font-inter">
                      <MapPin className="h-3 w-3" />
                      Table:
                    </span>
                    <Select 
                      value={booking.table_id?.toString() || ''} 
                      onValueChange={handleTableAssignment}
                    >
                      <SelectTrigger className="w-32 h-8 text-sm bg-[#676767]/20 border-[#676767]/30 text-white rounded-xl font-inter">
                        <SelectValue placeholder="Assign table" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#292C2D] border-[#676767]/30 rounded-xl">
                        {getAvailableTables().map((table) => (
                          <SelectItem key={table.id} value={table.id.toString()} className="text-white hover:bg-[#676767]/20 font-inter">
                            {table.label} ({table.seats})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator className="bg-[#676767]/20" />

              {/* Payment Information */}
              <div>
                <h3 className="font-medium text-sm mb-3 flex items-center gap-2 text-white font-inter">
                  <Hash className="h-4 w-4 text-[#CCF0DB]" />
                  Payment Information
                </h3>
                <div className="bg-[#111315] p-4 rounded-xl border border-[#676767]/20">
                  <PaymentStatus bookingId={booking.id} />
                </div>
              </div>

              <Separator className="bg-[#676767]/20" />

              {/* Status & Quick Actions */}
              <div>
                <h3 className="font-medium text-sm mb-3 text-white font-inter">Status & Quick Actions</h3>
                <div className="space-y-3 bg-[#111315] p-4 rounded-xl border border-[#676767]/20">
                  <Badge className={`${getStatusColor(booking.status)} font-inter`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Badge>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {statusOptions.map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={booking.status === status ? "default" : "outline"}
                        onClick={() => handleStatusChange(status)}
                        className={`text-xs font-inter rounded-xl ${
                          booking.status === status 
                            ? 'bg-[#CCF0DB] text-[#111315]' 
                            : 'bg-[#676767]/20 text-white border-[#676767]/30 hover:bg-[#676767]/30'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div>
                <h3 className="font-medium text-sm mb-3 flex items-center gap-2 text-white font-inter">
                  <FileText className="h-4 w-4 text-[#F1C8D0]" />
                  Notes
                </h3>
                <div className="bg-[#111315] p-4 rounded-xl border border-[#676767]/20">
                  {isEditing ? (
                    <Textarea
                      value={editForm.notes || ''}
                      onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                      placeholder="Add notes..."
                      className="bg-[#676767]/20 border-[#676767]/30 text-white font-inter rounded-xl"
                    />
                  ) : (
                    <p className="text-sm text-white font-inter">
                      {booking.notes || 'No notes'}
                    </p>
                  )}
                </div>
              </div>

              {/* Edit Actions */}
              {isEditing && (
                <div className="flex gap-2">
                  <Button onClick={handleEditSave} size="sm" className="bg-[#CCF0DB] text-[#111315] hover:bg-[#CCF0DB]/80 rounded-xl font-inter">
                    <Save className="h-4 w-4 mr-1" />
                    Save Changes
                  </Button>
                  <Button onClick={() => setIsEditing(false)} variant="outline" size="sm" className="bg-[#676767]/20 text-white border-[#676767]/30 hover:bg-[#676767]/30 rounded-xl font-inter">
                    Cancel
                  </Button>
                </div>
              )}

              <Separator className="bg-[#676767]/20" />

              {/* Audit Trail */}
              <BookingAuditTrail bookingId={booking.id} />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Enhanced Cancellation Dialog */}
      <EnhancedCancellationDialog
        open={cancellationDialogOpen}
        onOpenChange={setCancellationDialogOpen}
        booking={{
          id: booking.id,
          booking_date: booking.booking_date,
          booking_time: booking.booking_time,
          service: booking.service,
          venue_id: booking.venue_id,
          guest_name: booking.guest_name
        }}
        payment={paymentData}
        onCancellationComplete={handleCancellationComplete}
      />
    </>
  );
};
