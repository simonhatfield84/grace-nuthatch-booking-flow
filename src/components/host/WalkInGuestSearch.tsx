
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, User, Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  opt_in_marketing?: boolean;
}

interface WalkInGuestSearchProps {
  guestName: string;
  setGuestName: (name: string) => void;
  phone: string;
  setPhone: (phone: string) => void;
  email: string;
  setEmail: (email: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  marketingOptIn: boolean;
  setMarketingOptIn: (opt: boolean) => void;
  onGuestSelect: (guest: Guest) => void;
}

export const WalkInGuestSearch = ({
  guestName,
  setGuestName,
  phone,
  setPhone,
  email,
  setEmail,
  notes,
  setNotes,
  marketingOptIn,
  setMarketingOptIn,
  onGuestSelect
}: WalkInGuestSearchProps) => {
  const [searchResults, setSearchResults] = useState<Guest[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { user } = useAuth();

  // Search for existing guests as user types
  useEffect(() => {
    const searchGuests = async () => {
      if (!guestName.trim() || guestName.length < 2 || !user) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
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
            .limit(5)
            .order('name');

          setSearchResults(guests || []);
          setShowResults((guests || []).length > 0);
        }
      } catch (error) {
        console.error('Error searching guests:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchGuests, 300);
    return () => clearTimeout(debounceTimer);
  }, [guestName, user]);

  const handleGuestSelect = (guest: Guest) => {
    setGuestName(guest.name);
    setPhone(guest.phone || "");
    setEmail(guest.email || "");
    setNotes(guest.notes || "");
    setMarketingOptIn(guest.opt_in_marketing || false);
    setShowResults(false);
    onGuestSelect(guest);
  };

  const clearForm = () => {
    setGuestName("");
    setPhone("");
    setEmail("");
    setNotes("");
    setMarketingOptIn(false);
    setShowResults(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="guestName">Guest Name</Label>
        <div className="relative">
          <Input
            id="guestName"
            value={guestName}
            onChange={(e) => {
              setGuestName(e.target.value);
              if (e.target.value.length < 2) {
                setShowResults(false);
              }
            }}
            placeholder="Start typing to search existing guests..."
            className="text-foreground bg-background border-border pr-8"
          />
          {isSearching ? (
            <Search className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          )}
        </div>
        
        {showResults && searchResults.length > 0 && (
          <Card className="absolute z-50 w-full bg-background border shadow-lg">
            <div className="max-h-48 overflow-y-auto">
              {searchResults.map((guest) => (
                <Button
                  key={guest.id}
                  variant="ghost"
                  onClick={() => handleGuestSelect(guest)}
                  className="w-full justify-start text-left p-3 hover:bg-muted"
                >
                  <div className="flex items-center gap-3 w-full">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">{guest.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2 truncate">
                        {guest.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {guest.email}
                          </span>
                        )}
                        {guest.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {guest.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Phone (Optional)</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
            className="text-foreground bg-background border-border"
          />
        </div>
        <div>
          <Label htmlFor="email">Email (Optional)</Label>
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
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Special requests, allergies, etc."
          className="text-foreground bg-background border-border"
        />
      </div>
      
      <div className="flex items-center justify-between">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={marketingOptIn}
            onChange={(e) => setMarketingOptIn(e.target.checked)}
            className="rounded border-border"
          />
          <span className="text-sm text-foreground">Subscribe to marketing emails</span>
        </label>
        
        {(guestName || phone || email || notes) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearForm}
          >
            Clear Form
          </Button>
        )}
      </div>
    </div>
  );
};
