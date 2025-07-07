
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Users, Clock, Phone, Mail, MapPin, FileText, Calendar, Hash, Edit, Save, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Booking } from "@/hooks/useBookings";
import { BookingAuditTrail } from "./BookingAuditTrail";
import { useTables } from "@/hooks/useTables";
import { TableAllocationService } from "@/services/tableAllocation";
import { useToast } from "@/hooks/use-toast";

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
  const { tables } = useTables();
  const { toast } = useToast();

  if (!booking) return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100';
      case 'seated':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100';
      case 'finished':
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-100';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100';
      case 'late':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-100';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const statusOptions = ['confirmed', 'seated', 'finished', 'cancelled', 'late'];

  const getAvailableTables = () => {
    return tables.filter(table => table.seats >= booking.party_size);
  };

  const handleTableAssignment = async (tableId: string) => {
    try {
      const success = await TableAllocationService.manuallyAssignBookingToTable(
        booking.id,
        parseInt(tableId)
      );
      
      if (success) {
        toast({
          title: "Table Assigned",
          description: `Booking assigned to table ${tables.find(t => t.id === parseInt(tableId))?.label}`,
        });
        onBookingUpdate();
      } else {
        toast({
          title: "Error",
          description: "Failed to assign table",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign table",
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

  const handleEditSave = () => {
    // This would call an update function - implement based on your update logic
    console.log('Saving booking updates:', editForm);
    setIsEditing(false);
    onBookingUpdate();
    toast({
      title: "Booking Updated",
      description: "Booking details have been updated successfully",
    });
  };

  const currentTable = tables.find(t => t.id === booking.table_id);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Booking Details
        </CardTitle>
        <div className="flex gap-2">
          {!isEditing && (
            <Button variant="ghost" size="sm" onClick={handleEditStart}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-6">
        <ScrollArea className="flex-1">
          <div className="space-y-6">
            {/* Guest Information */}
            <div>
              <h3 className="font-medium text-sm mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Users className="h-4 w-4" />
                Guest Information
              </h3>
              <div className="space-y-3">
                {isEditing ? (
                  <>
                    <div>
                      <Label htmlFor="guest_name" className="text-gray-900 dark:text-gray-100">Name</Label>
                      <Input
                        id="guest_name"
                        value={editForm.guest_name || ''}
                        onChange={(e) => setEditForm({...editForm, guest_name: e.target.value})}
                        className="text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="party_size" className="text-gray-900 dark:text-gray-100">Party Size</Label>
                      <Input
                        id="party_size"
                        type="number"
                        value={editForm.party_size || ''}
                        onChange={(e) => setEditForm({...editForm, party_size: parseInt(e.target.value)})}
                        className="text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-gray-900 dark:text-gray-100">Phone</Label>
                      <Input
                        id="phone"
                        value={editForm.phone || ''}
                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                        className="text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-gray-900 dark:text-gray-100">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editForm.email || ''}
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                        className="text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Name:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{booking.guest_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Party Size:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{booking.party_size} guests</span>
                    </div>
                    {booking.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          Phone:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{booking.phone}</span>
                      </div>
                    )}
                    {booking.email && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          Email:
                        </span>
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{booking.email}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Booking Information */}
            <div>
              <h3 className="font-medium text-sm mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Calendar className="h-4 w-4" />
                Booking Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    Booking ID:
                  </span>
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {booking.booking_reference || `#${booking.id}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Date:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {format(new Date(booking.booking_date), 'EEEE, MMM d, yyyy')}
                  </span>
                </div>
                
                {isEditing ? (
                  <>
                    <div>
                      <Label htmlFor="booking_time" className="text-gray-900 dark:text-gray-100">Time</Label>
                      <Input
                        id="booking_time"
                        type="time"
                        value={editForm.booking_time || ''}
                        onChange={(e) => setEditForm({...editForm, booking_time: e.target.value})}
                        className="text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration" className="text-gray-900 dark:text-gray-100">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={editForm.duration_minutes || ''}
                        onChange={(e) => setEditForm({...editForm, duration_minutes: parseInt(e.target.value)})}
                        className="text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Time:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {booking.booking_time}
                        {booking.end_time && booking.status === 'finished' && 
                          ` - ${booking.end_time}`
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Duration:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {Math.floor((booking.duration_minutes || 120) / 60)}h {((booking.duration_minutes || 120) % 60)}m
                      </span>
                    </div>
                  </>
                )}

                {booking.service && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Service:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{booking.service}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Table:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {currentTable?.label || 'Unassigned'}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Manual Table Assignment */}
            {!booking.table_id && (
              <div>
                <h3 className="font-medium text-sm mb-3 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Manual Table Assignment
                </h3>
                <Select onValueChange={handleTableAssignment}>
                  <SelectTrigger className="text-gray-900 dark:text-gray-100">
                    <SelectValue placeholder="Select a table" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTables().map((table) => (
                      <SelectItem key={table.id} value={table.id.toString()}>
                        {table.label} ({table.seats} seats)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Status & Quick Actions */}
            <div>
              <h3 className="font-medium text-sm mb-3 text-gray-900 dark:text-gray-100">Status & Quick Actions</h3>
              <div className="space-y-3">
                <Badge className={getStatusColor(booking.status)}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </Badge>
                
                <div className="grid grid-cols-2 gap-2">
                  {statusOptions.map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={booking.status === status ? "default" : "outline"}
                      onClick={() => onStatusChange(booking, status)}
                      className="text-xs"
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <h3 className="font-medium text-sm mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <FileText className="h-4 w-4" />
                Notes
              </h3>
              {isEditing ? (
                <Textarea
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                  placeholder="Add notes..."
                  className="text-gray-900 dark:text-gray-100"
                />
              ) : (
                <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded text-gray-900 dark:text-gray-100">
                  {booking.notes || 'No notes'}
                </p>
              )}
            </div>

            {/* Edit Actions */}
            {isEditing && (
              <div className="flex gap-2">
                <Button onClick={handleEditSave} size="sm">
                  <Save className="h-4 w-4 mr-1" />
                  Save Changes
                </Button>
                <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                  Cancel
                </Button>
              </div>
            )}

            <Separator />

            {/* Audit Trail */}
            <BookingAuditTrail bookingId={booking.id} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
