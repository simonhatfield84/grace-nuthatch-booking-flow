
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, User2, Phone, Mail, ListChecks, MessageSquare, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBookingAudit } from "@/hooks/useBookingAudit";
import { Booking } from '@/types/booking';
import { EnhancedCancellationDialog } from './EnhancedCancellationDialog';

interface BookingDetailsPanelProps {
  booking: Booking | null;
  onClose: () => void;
  onStatusChange?: (booking: Booking, newStatus: string) => Promise<void>;
  onBookingUpdate?: () => void;
  onUpdate?: () => void;
}

const BookingDetailsPanel = ({ 
  booking, 
  onClose, 
  onStatusChange,
  onBookingUpdate,
  onUpdate 
}: BookingDetailsPanelProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancellationDialog, setShowCancellationDialog] = useState(false);

  const { logAudit } = useBookingAudit();

  if (!booking) return null;

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === 'cancelled') {
      setShowCancellationDialog(true);
      return;
    }

    // Use the passed onStatusChange prop if available, otherwise use the internal logic
    if (onStatusChange) {
      await onStatusChange(booking, newStatus);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: newStatus as any, 
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (error) throw error;

      // Log the status change
      await logAudit({
        booking_id: booking.id,
        change_type: 'status_change',
        field_name: 'status',
        old_value: booking.status,
        new_value: newStatus,
        changed_by: 'staff',
        notes: `Status changed from ${booking.status} to ${newStatus}`,
        source_type: 'manual',
        source_details: { previous_status: booking.status },
        email_status: null,
        notification_details: {}
      });

      const updateCallback = onUpdate || onBookingUpdate;
      if (updateCallback) {
        updateCallback();
      }
      toast.success(`Booking status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookingCancelled = () => {
    setShowCancellationDialog(false);
    const updateCallback = onUpdate || onBookingUpdate;
    if (updateCallback) {
      updateCallback();
    }
    onClose();
  };

  return (
    <>
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
        <div className="border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Booking Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Guest Information */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Guest Information</Label>
            <div className="flex items-start space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={`https://avatar.api.qrserver.com/v1/create/?size=40x40&data=${booking.guest_name}`} />
                <AvatarFallback>{booking.guest_name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{booking.guest_name}</p>
                {booking.email && (
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <Mail className="h-3 w-3 mr-1" />
                    {booking.email}
                  </p>
                )}
                {booking.phone && (
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <Phone className="h-3 w-3 mr-1" />
                    {booking.phone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Booking Information */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Booking Information</Label>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{format(new Date(`${booking.booking_date}T${booking.booking_time}`), 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{booking.booking_time}</span>
              </div>
              <div className="flex items-center text-sm">
                <User2 className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Party of {booking.party_size}</span>
              </div>
              <div className="flex items-center text-sm">
                <ListChecks className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{booking.service}</span>
              </div>
              {booking.booking_reference && (
                <div className="flex items-center text-sm">
                  <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Ref: {booking.booking_reference}</span>
                </div>
              )}
            </div>
          </div>

          {/* Table Assignment */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Table Assignment</Label>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm">
                {booking.table_id ? `Table ${booking.table_id}` : 'No table assigned'}
              </p>
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div>
              <Label className="text-sm font-medium mb-3 block">Notes</Label>
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm">{booking.notes}</p>
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Status</Label>
            <Select value={booking.status} onValueChange={handleStatusChange} disabled={isSubmitting}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="seated">Seated</SelectItem>
                <SelectItem value="finished">Finished</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
                <SelectItem value="late">Late</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Enhanced Cancellation Dialog */}
      <EnhancedCancellationDialog
        open={showCancellationDialog}
        onOpenChange={setShowCancellationDialog}
        booking={booking}
        onBookingCancelled={handleBookingCancelled}
      />
    </>
  );
};

export default BookingDetailsPanel;
