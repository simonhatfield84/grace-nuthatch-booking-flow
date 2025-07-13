import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useVenueHours } from "@/hooks/useVenueHours";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Search, UserPlus } from "lucide-react";

interface EnhancedWalkInDialogProps {
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
}

interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  opt_in_marketing?: boolean;
}

export const EnhancedWalkInDialog = ({
  open,
  onOpenChange,
  table,
  time,
  onCreateWalkIn,
  defaultDuration
}: EnhancedWalkInDialogProps) => {
  const [partySize, setPartySize] = useState(2);
  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState(defaultDuration);
  const [showGuestDetails, setShowGuestDetails] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [searchResults, setSearchResults] = useState<Guest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [searching, setSearching] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      // Reset form
      setPartySize(2);
      setGuestName("");
      setPhone("");
      setEmail("");
      setNotes("");
      setDuration(defaultDuration);
      setShowGuestDetails(false);
      setMarketingOptIn(false);
      setSearchResults([]);
      setSelectedGuest(null);
    }
  }, [open, defaultDuration]);

  // Search for existing guests
  useEffect(() => {
    const searchGuests = async () => {
      if (!guestName.trim() || guestName.length < 2) {
        setSearchResults([]);
        return;
      }

      if (!user) return;

      setSearching(true);
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('venue_id')
          .eq('id', user.id)
          .single();

        if (profile?.venue_id) {
          const { data: guests } = await supabase
            .from('guests')
            .select('*')
            .eq('venue_id', profile.venue_id)
            .or(`name.ilike.%${guestName}%,email.ilike.%${guestName}%,phone.ilike.%${guestName}%`)
            .limit(5);

          setSearchResults(guests || []);
        }
      } catch (error) {
        console.error('Error searching guests:', error);
      } finally {
        setSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchGuests, 300);
    return () => clearTimeout(debounceTimer);
  }, [guestName, user]);

  const selectGuest = (guest: Guest) => {
    setSelectedGuest(guest);
    setGuestName(guest.name);
    setPhone(guest.phone || "");
    setEmail(guest.email || "");
    setNotes(guest.notes || "");
    setMarketingOptIn(guest.opt_in_marketing || false);
    setSearchResults([]);
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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

          <div className="space-y-2">
            <Label htmlFor="guestName">Guest Name</Label>
            <div className="relative">
              <Input
                id="guestName"
                value={guestName}
                onChange={(e) => {
                  setGuestName(e.target.value);
                  setSelectedGuest(null); // Clear selection when typing
                }}
                placeholder="Start typing to search existing guests..."
                className="text-foreground bg-background border-border"
              />
              {searching && (
                <Search className="absolute right-3 top-3 h-4 w-4 animate-spin" />
              )}
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="border rounded-md bg-background max-h-32 overflow-y-auto">
                {searchResults.map((guest) => (
                  <button
                    key={guest.id}
                    type="button"
                    onClick={() => selectGuest(guest)}
                    className="w-full text-left px-3 py-2 hover:bg-muted border-b last:border-b-0 text-sm"
                  >
                    <div className="font-medium">{guest.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {guest.email && `${guest.email} • `}
                      {guest.phone}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="showGuestDetails"
              checked={showGuestDetails}
              onCheckedChange={(checked) => setShowGuestDetails(checked === true)}
            />
            <Label htmlFor="showGuestDetails" className="text-sm font-normal">
              Add guest details (email, phone, notes)
            </Label>
          </div>

          {showGuestDetails && (
            <div className="space-y-4 border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number"
                    className="text-foreground bg-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="text-foreground bg-background border-border"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special requests, allergies, etc."
                  className="text-foreground bg-background border-border resize-none"
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="marketingOptIn"
                  checked={marketingOptIn}
                  onCheckedChange={(checked) => setMarketingOptIn(checked === true)}
                />
                <Label htmlFor="marketingOptIn" className="text-sm font-normal">
                  Subscribe to marketing emails
                </Label>
              </div>
            </div>
          )}

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
              <UserPlus className="h-4 w-4 mr-2" />
              Seat Walk-In
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};