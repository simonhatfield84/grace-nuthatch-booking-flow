
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Users, Clock } from 'lucide-react';

interface Table {
  id: number;
  label: string;
  seats: number;
}

interface QuickWalkInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: Table | null;
  time: string;
  onCreateWalkIn: (walkInData: {
    tableId: number;
    time: string;
    partySize: number;
    guestName?: string;
    duration: number;
  }) => void;
  nextBookingTime?: string;
  defaultDuration: number;
}

export const QuickWalkInDialog = ({
  open,
  onOpenChange,
  table,
  time,
  onCreateWalkIn,
  nextBookingTime,
  defaultDuration
}: QuickWalkInDialogProps) => {
  const [partySize, setPartySize] = useState(2);
  const [includeGuest, setIncludeGuest] = useState(false);
  const [guestName, setGuestName] = useState('');

  const calculateDuration = () => {
    if (nextBookingTime) {
      const [currentHour, currentMin] = time.split(':').map(Number);
      const [nextHour, nextMin] = nextBookingTime.split(':').map(Number);
      
      const currentMinutes = currentHour * 60 + currentMin;
      const nextMinutes = nextHour * 60 + nextMin;
      
      return Math.max(30, nextMinutes - currentMinutes);
    }
    return defaultDuration;
  };

  const duration = calculateDuration();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!table) return;

    onCreateWalkIn({
      tableId: table.id,
      time,
      partySize,
      guestName: includeGuest ? guestName : undefined,
      duration
    });

    // Reset form
    setPartySize(2);
    setIncludeGuest(false);
    setGuestName('');
    onOpenChange(false);
  };

  const handleClose = () => {
    setPartySize(2);
    setIncludeGuest(false);
    setGuestName('');
    onOpenChange(false);
  };

  if (!table) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Quick Walk-In
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Table & Time Info */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div>
              <Badge variant="outline">{table.label}</Badge>
              <p className="text-sm text-gray-600 mt-1">Capacity: {table.seats}</p>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Clock className="h-4 w-4" />
              {time}
            </div>
          </div>

          {/* Duration Info */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900">Duration: {duration} minutes</p>
            <p className="text-xs text-blue-700">
              {nextBookingTime 
                ? `Until next booking at ${nextBookingTime}`
                : 'Standard walk-in duration'
              }
            </p>
          </div>

          {/* Party Size */}
          <div className="space-y-2">
            <Label htmlFor="partySize">Number of Guests</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPartySize(Math.max(1, partySize - 1))}
                disabled={partySize <= 1}
              >
                -
              </Button>
              <Input
                id="partySize"
                type="number"
                value={partySize}
                onChange={(e) => setPartySize(Math.max(1, Math.min(table.seats, parseInt(e.target.value) || 1)))}
                className="w-20 text-center"
                min={1}
                max={table.seats}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPartySize(Math.min(table.seats, partySize + 1))}
                disabled={partySize >= table.seats}
              >
                +
              </Button>
              <span className="text-sm text-gray-600">/ {table.seats}</span>
            </div>
          </div>

          {/* Optional Guest Details */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeGuest"
                checked={includeGuest}
                onCheckedChange={setIncludeGuest}
              />
              <Label htmlFor="includeGuest" className="text-sm">
                Add guest details
              </Label>
            </div>

            {includeGuest && (
              <div className="space-y-2">
                <Label htmlFor="guestName">Guest Name</Label>
                <Input
                  id="guestName"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter guest name..."
                />
                <p className="text-xs text-gray-500">
                  If no name is provided, it will show as "WALK-IN"
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Seat Walk-In
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
