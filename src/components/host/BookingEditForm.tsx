import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Booking } from "@/features/booking/types/booking";

interface BookingEditFormProps {
  booking: Booking;
  onSave: (updatedBooking: Booking) => void;
  onCancel: () => void;
}

export const BookingEditForm = ({ booking, onSave, onCancel }: BookingEditFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    guest_name: booking.guest_name,
    party_size: booking.party_size.toString(),
    booking_date: booking.booking_date,
    booking_time: booking.booking_time,
    phone: booking.phone || "",
    email: booking.email || "",
    notes: booking.notes || "",
    service: booking.service || "Dinner",
    status: booking.status,
    duration_minutes: booking.duration_minutes?.toString() || "120"
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updates = {
        guest_name: formData.guest_name,
        party_size: parseInt(formData.party_size),
        booking_date: formData.booking_date,
        booking_time: formData.booking_time,
        phone: formData.phone || null,
        email: formData.email || null,
        notes: formData.notes || null,
        service: formData.service,
        status: formData.status,
        duration_minutes: parseInt(formData.duration_minutes),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', booking.id)
        .select()
        .single();

      if (error) throw error;

      const updatedBooking: Booking = {
        ...booking,
        ...updates,
        party_size: parseInt(formData.party_size),
        status: formData.status as Booking['status'],
        duration_minutes: parseInt(formData.duration_minutes)
      };

      toast({
        title: "Booking Updated",
        description: "Booking details have been saved successfully",
      });

      onSave(updatedBooking);
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: "Failed to update booking",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const statusOptions = ['confirmed', 'seated', 'finished', 'cancelled', 'late'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="guest_name">Guest Name</Label>
          <Input
            id="guest_name"
            value={formData.guest_name}
            onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="party_size">Party Size</Label>
          <Input
            id="party_size"
            type="number"
            min="1"
            value={formData.party_size}
            onChange={(e) => setFormData({ ...formData, party_size: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="booking_date">Date</Label>
          <Input
            id="booking_date"
            type="date"
            value={formData.booking_date}
            onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="booking_time">Time</Label>
          <Input
            id="booking_time"
            type="time"
            value={formData.booking_time}
            onChange={(e) => setFormData({ ...formData, booking_time: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="service">Service</Label>
          <Select value={formData.service} onValueChange={(value) => setFormData({ ...formData, service: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Dinner">Dinner</SelectItem>
              <SelectItem value="Lunch">Lunch</SelectItem>
              <SelectItem value="Brunch">Brunch</SelectItem>
              <SelectItem value="Private Event">Private Event</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="duration_minutes">Duration (minutes)</Label>
          <Input
            id="duration_minutes"
            type="number"
            min="15"
            max="360"
            step="15"
            value={formData.duration_minutes}
            onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as Booking['status'] })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status} className="capitalize">
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Add any special notes..."
          className="min-h-[80px]"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
};
