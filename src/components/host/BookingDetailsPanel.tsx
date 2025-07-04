
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Users, Clock, Phone, Mail, Edit, Trash2, Save, MapPin } from "lucide-react";
import { Booking } from "@/hooks/useBookings";
import { useTables } from "@/hooks/useTables";
import { TableAllocationService } from "@/services/tableAllocation";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface Table {
  id: number;
  label: string;
  seats: number;
  section_id: number | null;
}

interface BookingDetailsPanelProps {
  booking: Booking | null;
  onClose: () => void;
  onEdit?: (booking: Booking) => void;
  onDelete?: (booking: Booking) => void;
  onStatusChange?: (booking: Booking, status: string) => void;
  onBookingUpdate?: () => void;
}

export const BookingDetailsPanel = ({ 
  booking, 
  onClose, 
  onEdit, 
  onDelete, 
  onStatusChange,
  onBookingUpdate
}: BookingDetailsPanelProps) => {
  const { tables } = useTables();
  const { toast } = useToast();
  const [availableTables, setAvailableTables] = useState<Table[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (booking) {
      setEditedNotes(booking.notes || "");
      loadAvailableTables();
    }
  }, [booking]);

  const loadAvailableTables = async () => {
    if (!booking) return;
    
    const available = await TableAllocationService.getAvailableTablesForBooking(
      booking.party_size,
      booking.booking_date,
      booking.booking_time
    );
    
    // Include currently assigned table even if it's not "available" for reassignment
    const currentTable = tables.find(t => t.id === booking.table_id);
    if (currentTable && !available.find(t => t.id === currentTable.id)) {
      available.push(currentTable);
    }
    
    setAvailableTables(available);
  };

  const handleTableAssignment = async (tableId: string) => {
    if (!booking) return;
    
    setIsAssigning(true);
    const success = await TableAllocationService.manuallyAssignBookingToTable(
      booking.id,
      parseInt(tableId)
    );
    
    if (success) {
      toast({
        title: "Table Assigned",
        description: `Booking assigned to table ${tables.find(t => t.id === parseInt(tableId))?.label}`,
      });
      onBookingUpdate?.();
    } else {
      toast({
        title: "Assignment Failed",
        description: "Could not assign booking to selected table",
        variant: "destructive"
      });
    }
    setIsAssigning(false);
  };

  const handleSaveNotes = async () => {
    if (!booking) return;
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          notes: editedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);
      
      if (error) throw error;
      
      toast({
        title: "Notes Updated",
        description: "Booking notes have been saved",
      });
      
      setIsEditing(false);
      onBookingUpdate?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notes",
        variant: "destructive"
      });
    }
  };

  if (!booking) return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'seated': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'finished': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'late': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const statusOptions = ['confirmed', 'seated', 'finished', 'cancelled', 'late'];
  const assignedTable = tables.find(t => t.id === booking.table_id);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Booking Details</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="min-h-[44px] min-w-[44px]"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-6">
        {/* Guest Information */}
        <div>
          <h3 className="font-semibold text-lg mb-3">{booking.guest_name}</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span>{booking.party_size} guests</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>{booking.booking_time} on {booking.booking_date}</span>
            </div>
            {booking.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{booking.phone}</span>
              </div>
            )}
            {booking.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>{booking.email}</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Table Assignment */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Table Assignment
          </h4>
          
          {booking.is_unallocated || !assignedTable ? (
            <div className="space-y-3">
              <Badge variant="destructive" className="mb-2">
                Unallocated
              </Badge>
              <Select onValueChange={handleTableAssignment} disabled={isAssigning}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select a table..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.map((table) => (
                    <SelectItem key={table.id} value={table.id.toString()}>
                      Table {table.label} ({table.seats} seats)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-green-50">
                  Table {assignedTable.label} ({assignedTable.seats} seats)
                </Badge>
              </div>
              <Select 
                onValueChange={handleTableAssignment} 
                disabled={isAssigning}
                defaultValue={booking.table_id?.toString()}
              >
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Reassign table..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.map((table) => (
                    <SelectItem key={table.id} value={table.id.toString()}>
                      Table {table.label} ({table.seats} seats)
                      {table.id === booking.table_id && " (Current)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Separator />

        {/* Status */}
        <div>
          <h4 className="font-medium mb-2">Status</h4>
          <Badge className={`${getStatusColor(booking.status)} capitalize mb-3`}>
            {booking.status}
          </Badge>
          
          {onStatusChange && (
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <Button
                  key={status}
                  variant={booking.status === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => onStatusChange(booking, status)}
                  className="capitalize min-h-[44px]"
                >
                  {status}
                </Button>
              ))}
            </div>
          )}
        </div>

        {booking.service && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-2">Service</h4>
              <p>{booking.service}</p>
            </div>
          </>
        )}

        <Separator />

        {/* Notes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Notes</h4>
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="min-h-[36px]"
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                placeholder="Add notes..."
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveNotes} size="sm" className="min-h-[36px]">
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button 
                  onClick={() => {
                    setIsEditing(false);
                    setEditedNotes(booking.notes || "");
                  }} 
                  variant="outline" 
                  size="sm"
                  className="min-h-[36px]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400 min-h-[20px]">
              {booking.notes || "No notes"}
            </p>
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          {onEdit && (
            <Button 
              variant="outline" 
              onClick={() => onEdit(booking)}
              className="flex-1 min-h-[44px]"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="destructive" 
              onClick={() => onDelete(booking)}
              className="flex-1 min-h-[44px]"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
