
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TableAllocationService } from "@/services/tableAllocation";
import { calculateBookingDuration, getServiceIdFromServiceName } from "@/utils/durationCalculation";

interface WalkInDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  preSelectedDate?: string;
  preSelectedTime?: string;
  onBookingCreated?: () => void;
}

export const WalkInDialog = ({ 
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  preSelectedDate,
  preSelectedTime,
  onBookingCreated
}: WalkInDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [formData, setFormData] = useState({
    guest: "",
    party: "",
    date: preSelectedDate || "",
    time: preSelectedTime || "",
    phone: "",
    email: "",
    notes: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Use controlled or internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  // Update form when pre-selected values change
  useEffect(() => {
    if (preSelectedDate) {
      setFormData(prev => ({ ...prev, date: preSelectedDate }));
    }
    if (preSelectedTime) {
      setFormData(prev => ({ ...prev, time: preSelectedTime }));
    }
  }, [preSelectedDate, preSelectedTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Calculate duration for walk-in (default service)
      const serviceId = await getServiceIdFromServiceName("Walk-in");
      const duration = await calculateBookingDuration(serviceId || undefined, parseInt(formData.party));

      // Create the booking with calculated duration
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert([{
          guest_name: formData.guest.trim() || "Walk-in",
          party_size: parseInt(formData.party),
          booking_date: formData.date,
          booking_time: formData.time,
          phone: formData.phone || null,
          email: formData.email || null,
          notes: formData.notes || null,
          service: "Walk-in",
          status: "seated",
          duration_minutes: duration,
          is_unallocated: true,
          table_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Try to allocate the booking to a table
      await TableAllocationService.allocateBookingToTables(
        booking.id,
        booking.party_size,
        booking.booking_date,
        booking.booking_time
      );

      toast({
        title: "Walk-in Created",
        description: `Walk-in for ${formData.guest || "Guest"} has been created with ${duration} minute duration`,
      });

      // Reset form
      setFormData({
        guest: "",
        party: "",
        date: preSelectedDate || "",
        time: preSelectedTime || "",
        phone: "",
        email: "",
        notes: ""
      });
      
      setOpen(false);
      onBookingCreated?.();
    } catch (error) {
      console.error('Error creating walk-in:', error);
      toast({
        title: "Error",
        description: "Failed to create walk-in booking",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" strokeWidth={2} />
          Walk-in
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Walk-in</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="guest">Guest Name (optional)</Label>
              <Input
                id="guest"
                value={formData.guest}
                onChange={(e) => setFormData({ ...formData, guest: e.target.value })}
                placeholder="Leave empty for 'Walk-in'"
              />
            </div>
            <div>
              <Label htmlFor="party">Party Size *</Label>
              <Input
                id="party"
                type="number"
                min="1"
                value={formData.party}
                onChange={(e) => setFormData({ ...formData, party: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Add Walk-in"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
