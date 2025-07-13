
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVenueHours } from "@/hooks/useVenueHours";

interface QuickWalkInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: any;
  time: string;
  onCreateWalkIn: (walkInData: {
    tableId: number;
    time: string;
    partySize: number;
    guestName?: string;
    duration: number;
  }) => void;
  defaultDuration: number;
}

export const QuickWalkInDialog = ({
  open,
  onOpenChange,
  table,
  time,
  onCreateWalkIn,
  defaultDuration
}: QuickWalkInDialogProps) => {
  const [partySize, setPartySize] = useState(2);
  const [guestName, setGuestName] = useState("");
  const [duration, setDuration] = useState(defaultDuration);
  const { data: venueHours } = useVenueHours();

  useEffect(() => {
    if (open) {
      setPartySize(2);
      setGuestName("");
      setDuration(defaultDuration);
    }
  }, [open, defaultDuration]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!table) return;

    onCreateWalkIn({
      tableId: table.id,
      time,
      partySize,
      guestName: guestName.trim() || undefined,
      duration
    });
    
    onOpenChange(false);
  };

  const calculateEndTime = () => {
    if (!time) return null;
    
    const [hours, minutes] = time.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + (duration * 60 * 1000));
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  };

  if (!table) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Seat Walk-In at Table {table.label}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                value={time}
                readOnly
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="endTime">Until</Label>
              <Input
                id="endTime"
                value={calculateEndTime() || ''}
                readOnly
                className="bg-muted"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="partySize">Number of Guests</Label>
            <Input
              id="partySize"
              type="number"
              min="1"
              max={table.seats}
              value={partySize}
              onChange={(e) => setPartySize(Math.max(1, parseInt(e.target.value) || 1))}
              className="text-foreground bg-background border-border"
              placeholder="Enter number of guests"
            />
          </div>

          <div>
            <Label htmlFor="guestName">Guest Name (Optional)</Label>
            <Input
              id="guestName"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Enter guest name"
              className="text-foreground bg-background border-border"
            />
          </div>

          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min="30"
              max="360"
              step="15"
              value={duration}
              onChange={(e) => setDuration(Math.max(30, parseInt(e.target.value) || defaultDuration))}
              className="text-foreground bg-background border-border"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Seat Walk-In
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
