
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Users } from "lucide-react";
import { useBookings } from "@/hooks/useBookings";
import { format } from "date-fns";

interface EnhancedWalkInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: any;
  time: string;
  selectedDate: Date;
  onCreateWalkIn: (data: {
    tableId: number;
    time: string;
    partySize: number;
    guestName?: string;
    duration: number;
  }) => void;
}

export const EnhancedWalkInDialog = ({
  open,
  onOpenChange,
  table,
  time,
  selectedDate,
  onCreateWalkIn
}: EnhancedWalkInDialogProps) => {
  const [partySize, setPartySize] = useState(1);
  const [guestName, setGuestName] = useState("");
  const [duration, setDuration] = useState(120);
  const [showCapacityWarning, setShowCapacityWarning] = useState(false);

  const { bookings } = useBookings(format(selectedDate, 'yyyy-MM-dd'));

  // Calculate smart duration based on next booking
  useEffect(() => {
    if (!table || !time || !open) return;

    const currentTime = new Date(`1970-01-01T${time}:00`);
    const nextBookings = bookings
      .filter(b => b.table_id === table.id && b.status !== 'cancelled' && b.status !== 'finished')
      .map(b => {
        const bookingTime = new Date(`1970-01-01T${b.booking_time}:00`);
        return { ...b, timeValue: bookingTime };
      })
      .filter(b => b.timeValue > currentTime)
      .sort((a, b) => a.timeValue.getTime() - b.timeValue.getTime());

    if (nextBookings.length > 0) {
      const nextBooking = nextBookings[0];
      const timeDiff = nextBooking.timeValue.getTime() - currentTime.getTime();
      const maxDuration = Math.floor(timeDiff / (1000 * 60)); // Convert to minutes
      
      if (maxDuration < 120) {
        setDuration(Math.max(30, maxDuration - 15)); // Leave 15 min buffer
      } else {
        setDuration(120);
      }
    } else {
      setDuration(120);
    }
  }, [table, time, bookings, open]);

  // Check capacity warning
  useEffect(() => {
    if (table && partySize > table.seats) {
      setShowCapacityWarning(true);
    } else {
      setShowCapacityWarning(false);
    }
  }, [partySize, table]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!table) return;

    onCreateWalkIn({
      tableId: table.id,
      time,
      partySize,
      guestName: guestName.trim() || 'WALK-IN',
      duration
    });

    // Reset form
    setPartySize(1);
    setGuestName("");
    setDuration(120);
    onOpenChange(false);
  };

  if (!table) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Seat Walk-in at {table.label}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                readOnly
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (mins)</Label>
              <Input
                id="duration"
                type="number"
                min="30"
                max="240"
                step="15"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="partySize">Party Size</Label>
            <Input
              id="partySize"
              type="number"
              min="1"
              max="20"
              value={partySize}
              onChange={(e) => setPartySize(Number(e.target.value))}
              required
            />
          </div>

          {showCapacityWarning && (
            <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                Party size ({partySize}) exceeds table capacity ({table.seats}). Confirm if this is intentional.
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="guestName">Guest Name (Optional)</Label>
            <Input
              id="guestName"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Enter guest name or leave blank for WALK-IN"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Seat Now
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
