import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, CheckCircle2, User2, Phone, Mail, StickyNote, Clock, ListChecks, MessageSquare, UserCog, Trash2 } from "lucide-react";
import { DateRange } from "react-day-picker";
import { supabase } from "@/integrations/supabase/client";
import { BookingAudit, useBookingAudit } from "@/hooks/useBookingAudit";
import { DeleteBookingDialog } from './DeleteBookingDialog';
import { EditBookingForm } from './EditBookingForm';
import { Booking } from '@/types/booking';
import { EnhancedCancellationDialog } from './EnhancedCancellationDialog';

interface BookingDetailsPanelProps {
  booking: Booking | null;
  onClose: () => void;
  onStatusChange?: (booking: Booking, newStatus: string) => Promise<void>;
  onBookingUpdate?: () => void;
  onUpdate?: () => void;
}

interface EditedBooking {
  guest_name: string;
  phone: string;
  email: string;
  notes: string;
}

const BookingDetailsPanel = ({ 
  booking, 
  onClose, 
  onStatusChange,
  onBookingUpdate,
  onUpdate 
}: BookingDetailsPanelProps) => {
  const [editedBooking, setEditedBooking] = useState<EditedBooking | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showCancellationDialog, setShowCancellationDialog] = useState(false);

  const { auditTrail, logAudit } = useBookingAudit(booking?.id);

  useEffect(() => {
    if (booking) {
      setEditedBooking({
        guest_name: booking.guest_name,
        phone: booking.phone || '',
        email: booking.email || '',
        notes: booking.notes || '',
      });
    }
  }, [booking]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedBooking(prev => ({
      ...prev,
      [name]: value,
    } as any));
  };

  const handleEditBooking = () => {
    setShowEditForm(true);
  };

  const handleUpdateBooking = async (updatedBooking: any) => {
    if (!booking) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          ...updatedBooking,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (error) throw error;

      // Log the update
      await logAudit({
        booking_id: booking.id,
        change_type: 'booking_updated',
        field_name: null,
        old_value: null,
        new_value: null,
        changed_by: 'staff',
        notes: 'Booking details updated',
        source_type: 'manual',
        source_details: updatedBooking,
        email_status: null,
        notification_details: {}
      });

      onUpdate();
      toast.success('Booking updated successfully');
      setShowEditForm(false);
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBooking = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!booking) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', booking.id);

      if (error) throw error;

      // Log the deletion
      await logAudit({
        booking_id: booking.id,
        change_type: 'booking_deleted',
        field_name: null,
        old_value: null,
        new_value: null,
        changed_by: 'staff',
        notes: 'Booking deleted',
        source_type: 'manual',
        source_details: {},
        email_status: null,
        notification_details: {}
      });

      onUpdate();
      toast.success('Booking deleted successfully');
      onClose();
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('Failed to delete booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === 'cancelled') {
      setShowCancellationDialog(true);
      return;
    }

    if (!booking) return;

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
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Booking Details</h2>
          <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Guest</Label>
            <div className="flex items-center space-x-2">
              <Avatar>
                <AvatarImage src={`https://avatar.api.qrserver.com/v1/create/?size=40x40&data=${booking?.guest_name}`} />
                <AvatarFallback>{booking?.guest_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{booking?.guest_name}</p>
                <p className="text-sm text-muted-foreground">
                  <Mail className="mr-1 inline-block h-4 w-4 align-middle" />
                  {booking?.email || 'No email'}
                </p>
                <p className="text-sm text-muted-foreground">
                  <Phone className="mr-1 inline-block h-4 w-4 align-middle" />
                  {booking?.phone || 'No phone'}
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Booking Info</Label>
            <div className="space-y-1">
              <p>
                <Clock className="mr-1 inline-block h-4 w-4 align-middle" />
                {booking?.booking_date} at {booking?.booking_time}
              </p>
              <p>
                <User2 className="mr-1 inline-block h-4 w-4 align-middle" />
                Party Size: {booking?.party_size}
              </p>
              <p>
                <ListChecks className="mr-1 inline-block h-4 w-4 align-middle" />
                Service: {booking?.service}
              </p>
              <p>
                <MessageSquare className="mr-1 inline-block h-4 w-4 align-middle" />
                Reference: {booking?.booking_reference}
              </p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Table Assignment</Label>
            <p className="text-muted-foreground">
              {booking?.table_id ? `Table ${booking.table_id}` : 'No table assigned'}
            </p>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Notes</Label>
            <Textarea
              name="notes"
              value={editedBooking?.notes || ''}
              onChange={handleInputChange}
              className="w-full resize-none"
              placeholder="Add notes about this booking..."
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Status</Label>
            <Select value={booking.status} onValueChange={handleStatusChange}>
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

          <div>
            <Label className="text-sm font-medium mb-2 block">Audit Trail</Label>
            <div className="space-y-2">
              {auditTrail.map(audit => (
                <div key={audit.id} className="border rounded-md p-2">
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(audit.changed_at), 'MMM dd, yyyy hh:mm a')}
                  </p>
                  <p className="text-sm">
                    {audit.change_type}: {audit.field_name || 'Details'}
                  </p>
                  {audit.notes && (
                    <p className="text-xs italic">
                      <StickyNote className="mr-1 inline-block h-3 w-3 align-text-bottom" />
                      {audit.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between space-x-2 border-t pt-4">
            <Button variant="outline" onClick={handleEditBooking}>
              <UserCog className="mr-2 h-4 w-4" />
              Edit Booking
            </Button>
            <Button variant="destructive" onClick={handleDeleteBooking}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Booking
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Cancellation Dialog */}
      {booking && (
        <EnhancedCancellationDialog
          open={showCancellationDialog}
          onOpenChange={setShowCancellationDialog}
          booking={booking}
          onBookingCancelled={handleBookingCancelled}
        />
      )}

      <DeleteBookingDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />

      <EditBookingForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        booking={booking}
        onUpdate={handleUpdateBooking}
      />
    </>
  );
};

export default BookingDetailsPanel;
