import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useBookings } from "@/hooks/useBookings";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Search, UserPlus } from "lucide-react";
import { calculateWalkInDuration } from "@/utils/walkInDuration";
import { format } from "date-fns";

interface SimpleWalkInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string;
  selectedTime: string;
  tableId: number;
  bookings: any[];
  onComplete?: () => void;
}

interface Guest {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export function SimpleWalkInDialog({
  open,
  onOpenChange,
  selectedDate,
  selectedTime,
  tableId,
  bookings,
  onComplete
}: SimpleWalkInDialogProps) {
  const [partySize, setPartySize] = useState(2);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Guest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [duration, setDuration] = useState(90);

  const { toast } = useToast();
  const { createBooking } = useBookings(selectedDate);
  const { user } = useAuth();

  // Calculate smart duration when dialog opens
  useEffect(() => {
    if (open) {
      console.log('🚀 Dialog opened, calculating walk-in duration with:', {
        selectedTime,
        tableId,
        bookingsCount: bookings.length,
        selectedDate
      });

      // Filter bookings for today only
      const todaysBookings = bookings.filter(booking => 
        booking.booking_date === selectedDate
      );

      console.log('📅 Today\'s bookings filtered:', {
        totalBookings: bookings.length,
        todaysBookings: todaysBookings.length,
        selectedDate
      });

      const smartDuration = calculateWalkInDuration({
        clickedTime: selectedTime,
        tableId,
        bookings: todaysBookings, // Pass only today's bookings
        defaultDuration: 90 // TODO: Get from venue settings
      });
      
      console.log('⏱️ Smart duration calculated:', smartDuration);
      setDuration(smartDuration);
    }
  }, [open, selectedTime, tableId, bookings, selectedDate]);

  // Search guests as user types
  useEffect(() => {
    const searchGuests = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('venue_id')
          .eq('id', user?.id)
          .single();

        if (!profile?.venue_id) return;

        const { data } = await supabase
          .from('guests')
          .select('id, name, phone, email')
          .eq('venue_id', profile.venue_id)
          .or(`name.ilike.%${searchQuery}%,phone.like.${searchQuery}%,email.ilike.%${searchQuery}%`)
          .limit(5);

        setSearchResults(data || []);
      } catch (error) {
        console.error('Error searching guests:', error);
      }
    };

    const timeoutId = setTimeout(searchGuests, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, user?.id]);

  const handleGuestSelect = (guest: Guest) => {
    setSelectedGuest(guest);
    setGuestName(guest.name);
    setGuestPhone(guest.phone || "");
    setGuestEmail(guest.email || "");
    setSearchQuery(guest.name);
    setSearchResults([]);
  };

  const handleSeatNow = async () => {
    setIsCreating(true);
    
    try {
      console.log('🪑 Creating walk-in with seated status:', {
        guest_name: guestName || 'WALK-IN',
        party_size: partySize,
        booking_time: selectedTime,
        tableId,
        duration
      });

      // Create the walk-in booking with 'seated' status
      await createBooking({
        guest_name: guestName || 'WALK-IN',
        email: guestEmail || null,
        phone: guestPhone || null,
        party_size: partySize,
        booking_date: selectedDate,
        booking_time: selectedTime,
        service: 'Walk-in',
        status: 'seated', // Walk-ins are immediately seated
        original_table_id: tableId,
        duration_minutes: duration,
        notes: 'Walk-in guest'
      });

      toast({
        title: "Walk-in seated",
        description: `Party of ${partySize} seated successfully`,
      });

      // Reset form
      setPartySize(2);
      setGuestName("");
      setGuestPhone("");
      setGuestEmail("");
      setSearchQuery("");
      setSelectedGuest(null);
      
      onComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error('❌ Error creating walk-in:', error);
      toast({
        title: "Error",
        description: "Failed to seat walk-in",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setPartySize(2);
    setGuestName("");
    setGuestPhone("");
    setGuestEmail("");
    setSearchQuery("");
    setSelectedGuest(null);
    setSearchResults([]);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Seat Walk-in</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Party Size */}
          <div>
            <Label htmlFor="party-size">Party Size</Label>
            <Select value={partySize.toString()} onValueChange={(value) => setPartySize(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(size => (
                  <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration Info with better feedback */}
          <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
            Duration: {duration} minutes 
            {duration < 90 && <span className="text-orange-600 font-medium"> (squeezed due to next booking)</span>}
            {duration === 90 && <span className="text-green-600"> (standard duration)</span>}
          </div>

          {/* Guest Search */}
          <div>
            <Label htmlFor="guest-search">Guest (Optional)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="guest-search"
                placeholder="Search existing guest or enter name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg">
                  {searchResults.map((guest) => (
                    <button
                      key={guest.id}
                      className="w-full px-3 py-2 text-left hover:bg-muted transition-colors"
                      onClick={() => handleGuestSelect(guest)}
                    >
                      <div className="font-medium">{guest.name}</div>
                      {guest.phone && <div className="text-sm text-muted-foreground">{guest.phone}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Manual Guest Entry */}
          {!selectedGuest && searchQuery && (
            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserPlus className="h-4 w-4" />
                <span>Or add new guest details:</span>
              </div>
              
              <Input
                placeholder="Guest name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
              />
              
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Phone"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                />
                <Input
                  placeholder="Email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSeatNow} 
              disabled={isCreating}
              className="flex-1"
            >
              {isCreating ? "Seating..." : "Seat Now"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
