
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, User2, Phone, Mail, MapPin, MessageSquare, X } from "lucide-react";
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'seated': return 'bg-blue-100 text-blue-800';
      case 'finished': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
      <Card className="w-80 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Booking Details</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Guest Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`https://avatar.api.qrserver.com/v1/create/?size=40x40&data=${booking.guest_name}`} />
                  <AvatarFallback>{booking.guest_name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{booking.guest_name}</h3>
                  {booking.booking_reference && (
                    <p className="text-xs text-muted-foreground">Ref: {booking.booking_reference}</p>
                  )}
                </div>
              </div>
              <Badge className={getStatusColor(booking.status)}>
                {booking.status.toUpperCase()}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <User2 className="h-4 w-4" />
                {booking.party_size} guests
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {booking.booking_time}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {booking.table_id ? `Table ${booking.table_id}` : 'No table'}
              </div>
              <div className="text-xs">
                {booking.duration_minutes} mins
              </div>
            </div>

            <div className="text-sm">
              <p><strong>Date:</strong> {format(new Date(booking.booking_date), 'EEEE, MMMM d, yyyy')}</p>
              <p><strong>Service:</strong> {booking.service}</p>
            </div>

            {/* Contact Info */}
            {(booking.email || booking.phone) && (
              <div className="space-y-1">
                {booking.email && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Mail className="h-3 w-3 mr-1" />
                    {booking.email}
                  </div>
                )}
                {booking.phone && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Phone className="h-3 w-3 mr-1" />
                    {booking.phone}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="flex items-center gap-1 mb-1">
                <MessageSquare className="h-3 w-3" />
                <span className="text-xs font-medium">Notes</span>
              </div>
              <p className="text-sm">{booking.notes}</p>
            </div>
          )}

          {/* Status Change */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Change Status</label>
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

          {/* Booking Meta */}
          <div className="pt-2 border-t space-y-1 text-xs text-gray-500">
            <div>Created: {new Date(booking.created_at).toLocaleDateString()}</div>
            {booking.updated_at !== booking.created_at && (
              <div>Updated: {new Date(booking.updated_at).toLocaleDateString()}</div>
            )}
          </div>
        </CardContent>
      </Card>

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
