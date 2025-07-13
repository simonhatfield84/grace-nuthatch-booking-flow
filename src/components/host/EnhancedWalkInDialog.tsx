import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Search, UserPlus, AlertTriangle, Clock } from "lucide-react";
import { BookingConflictService, type BookingConflict } from "@/services/bookingConflictService";
import { format } from "date-fns";

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

export const EnhancedWalkInDialog = ({
  open,
  onOpenChange,
  table,
  time,
  onCreateWalkIn,
  defaultDuration,
  selectedDate
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
  const [conflict, setConflict] = useState<BookingConflict | null>(null);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  const [venueDefaultDuration, setVenueDefaultDuration] = useState(defaultDuration);
  const [persistentConflict, setPersistentConflict] = useState<BookingConflict | null>(null); // Keep conflict visible
  const [conflictCheckDebounce, setConflictCheckDebounce] = useState<NodeJS.Timeout | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Load venue's default walk-in duration
  useEffect(() => {
    const loadVenueSettings = async () => {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('venue_id')
          .eq('id', user.id)
          .single();

        if (profile?.venue_id) {
          const defaultDuration = await BookingConflictService.getDefaultWalkInDuration(profile.venue_id);
          setVenueDefaultDuration(defaultDuration);
          if (open) {
            setDuration(defaultDuration);
          }
        }
      } catch (error) {
        console.error('Error loading venue settings:', error);
      }
    };

    loadVenueSettings();
  }, [user, open]);

  useEffect(() => {
    if (open) {
      // Reset form
      setPartySize(2);
      setGuestName("");
      setPhone("");
      setEmail("");
      setNotes("");
      setDuration(venueDefaultDuration);
      setShowGuestDetails(false);
      setMarketingOptIn(false);
      setSearchResults([]);
      setSelectedGuest(null);
      setConflict(null);
      setPersistentConflict(null); // Reset persistent conflict
    }
  }, [open, venueDefaultDuration]);

  // Improved conflict checking with debouncing
  useEffect(() => {
    if (!table || !time || !user || !open) return;

    // Clear existing debounce
    if (conflictCheckDebounce) {
      clearTimeout(conflictCheckDebounce);
    }

    const checkConflicts = async () => {
      setIsCheckingConflicts(true);
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('venue_id')
          .eq('id', user.id)
          .single();

        if (profile?.venue_id) {
          const conflictInfo = await BookingConflictService.checkWalkInConflicts(
            [table.id],
            format(selectedDate, 'yyyy-MM-dd'),
            time,
            duration,
            profile.venue_id
          );

          setConflict(conflictInfo);
          
          // Set persistent conflict to keep message stable
          if (conflictInfo.hasConflict) {
            setPersistentConflict(conflictInfo);
            // Auto-adjust duration if there's a conflict
            if (conflictInfo.maxAvailableDuration > 0) {
              setDuration(conflictInfo.maxAvailableDuration);
            }
          } else {
            // Only clear persistent conflict if no new conflict exists
            setPersistentConflict(null);
          }
        }
      } catch (error) {
        console.error('Error checking conflicts:', error);
      } finally {
        setIsCheckingConflicts(false);
      }
    };

    // Debounce conflict checking to prevent flickering
    const debounceTimer = setTimeout(checkConflicts, 300);
    setConflictCheckDebounce(debounceTimer);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [table, time, duration, user, open, selectedDate]);

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

    // Use persistent conflict for validation to ensure stability
    const currentConflict = persistentConflict || conflict;

    // Prevent submission if there are unresolved conflicts with no available time
    if (currentConflict?.hasConflict && currentConflict.maxAvailableDuration < 30) {
      toast({
        title: "Cannot seat walk-in",
        description: "No available time slot found. Please choose a different time.",
        variant: "destructive"
      });
      return;
    }

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

  // Use persistent conflict for display to keep message stable
  const displayConflict = persistentConflict || conflict;

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

          {/* Enhanced Conflict Warning - now stable */}
          {displayConflict?.hasConflict && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                {displayConflict.maxAvailableDuration >= 30 ? (
                  <>
                    <strong>Booking conflict detected!</strong> Next booking at{' '}
                    {displayConflict.nextBookingTime} ({displayConflict.conflictingBooking?.guest_name}).
                    Duration automatically adjusted to {displayConflict.maxAvailableDuration} minutes.
                  </>
                ) : (
                  <>
                    <strong>No available time!</strong> Table is fully booked.
                    Please choose a different time or table.
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Improved loading indicator */}
          {isCheckingConflicts && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded">
              <Clock className="h-4 w-4 animate-spin" />
              Checking availability...
            </div>
          )}

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
              onChange={(e) => setDuration(Math.max(30, parseInt(e.target.value) || venueDefaultDuration))}
              className="text-foreground bg-background border-border"
              disabled={conflict?.hasConflict} // Disable manual editing when there's a conflict
            />
            {conflict?.hasConflict && (
              <p className="text-xs text-muted-foreground mt-1">
                Duration automatically set based on next booking
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={displayConflict?.hasConflict && displayConflict.maxAvailableDuration < 30}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Seat Walk-In
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
