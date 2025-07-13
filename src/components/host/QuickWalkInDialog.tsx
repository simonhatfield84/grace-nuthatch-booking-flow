
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { WalkInGuestSearch } from "./WalkInGuestSearch";
import { SmartDurationCalculator } from "./SmartDurationCalculator";
import { UserPlus, User } from "lucide-react";

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
    phone?: string;
    email?: string;
    notes?: string;
    guestId?: string;
  }) => void;
  defaultDuration: number;
  selectedDate: Date;
}

interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  opt_in_marketing?: boolean;
}

export const QuickWalkInDialog = ({
  open,
  onOpenChange,
  table,
  time,
  onCreateWalkIn,
  defaultDuration,
  selectedDate
}: QuickWalkInDialogProps) => {
  const [partySize, setPartySize] = useState(2);
  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState(defaultDuration);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showGuestDetails, setShowGuestDetails] = useState(false);

  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setPartySize(2);
      setGuestName("");
      setPhone("");
      setEmail("");
      setNotes("");
      setDuration(defaultDuration);
      setMarketingOptIn(false);
      setSelectedGuest(null);
      setShowGuestDetails(false);
    }
  }, [open, defaultDuration]);

  const handleGuestSelect = (guest: Guest) => {
    setSelectedGuest(guest);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!table) return;

    onCreateWalkIn({
      tableId: table.id,
      time,
      partySize,
      guestName: guestName.trim() || undefined,
      duration,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
      guestId: selectedGuest?.id
    });
    
    onOpenChange(false);
  };

  if (!table) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Seat Walk-In at Table {table.label}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Party Size */}
          <div>
            <Label htmlFor="partySize">Number of Guests</Label>
            <Input
              id="partySize"
              type="number"
              min="1"
              max={table.seats}
              value={partySize}
              onChange={(e) => setPartySize(Math.max(1, parseInt(e.target.value) || 1))}
              className="text-foreground bg-background border-border mt-1"
              placeholder="Enter number of guests"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Table capacity: {table.seats} guests
            </p>
          </div>

          {/* Duration Calculator */}
          <SmartDurationCalculator
            duration={duration}
            setDuration={setDuration}
            time={time}
            selectedDate={selectedDate}
            tableId={table.id}
            partySize={partySize}
          />

          <Separator />

          {/* Guest Search Toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Guest Details</Label>
            <Button
              type="button"
              variant={showGuestDetails ? "default" : "outline"}
              size="sm"
              onClick={() => setShowGuestDetails(!showGuestDetails)}
            >
              <User className="h-4 w-4 mr-2" />
              {showGuestDetails ? "Hide Details" : "Add Guest Info"}
            </Button>
          </div>

          {/* Guest Search Form */}
          {showGuestDetails && (
            <WalkInGuestSearch
              guestName={guestName}
              setGuestName={setGuestName}
              phone={phone}
              setPhone={setPhone}
              email={email}
              setEmail={setEmail}
              notes={notes}
              setNotes={setNotes}
              marketingOptIn={marketingOptIn}
              setMarketingOptIn={setMarketingOptIn}
              onGuestSelect={handleGuestSelect}
            />
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              <UserPlus className="h-4 w-4 mr-2" />
              Seat Walk-In
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
