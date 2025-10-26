
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, User, Plus, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface NewGuestData {
  name: string;
  email?: string;
  phone?: string;
  partySize: number;
}

interface GuestSearchProps {
  onGuestSelect: (guest: Guest | null, newGuestData?: NewGuestData) => void;
  onCreateNew: (guestData: NewGuestData) => void;
  isLoading: boolean;
}

export function GuestSearch({ onGuestSelect, onCreateNew, isLoading }: GuestSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewGuestForm, setShowNewGuestForm] = useState(false);
  const [newGuestData, setNewGuestData] = useState<NewGuestData>({
    name: "",
    email: "",
    phone: "",
    partySize: 2
  });

  const { data: guests = [], isLoading: searchLoading } = useQuery({
    queryKey: ['guest-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) return [];

      // Get venue context from server (single source of truth)
      const { data: context, error: ctxError } = await supabase.rpc('get_current_context');
      if (ctxError) throw ctxError;
      
      const venueId = (context as any)?.venue_id;
      if (!venueId) throw new Error('No venue context');

      // Search guests using secure RPC
      const { data, error } = await supabase.rpc('guests_search', {
        _venue: venueId,
        _q: searchTerm,
        _limit: 10
      });

      if (error) throw error;
      return data || [];
    },
    enabled: searchTerm.length > 2,
    staleTime: 30 * 1000,
  });

  const handleCreateNew = () => {
    if (newGuestData.name.trim()) {
      onCreateNew(newGuestData);
    }
  };

  if (showNewGuestForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">New Walk-in Guest</h3>
          <Button 
            variant="outline" 
            onClick={() => setShowNewGuestForm(false)}
          >
            Back to Search
          </Button>
        </div>

        <div className="space-y-4">
          <Input
            placeholder="Guest name *"
            value={newGuestData.name}
            onChange={(e) => setNewGuestData(prev => ({ ...prev, name: e.target.value }))}
          />
          <Input
            placeholder="Email (optional)"
            type="email"
            value={newGuestData.email}
            onChange={(e) => setNewGuestData(prev => ({ ...prev, email: e.target.value }))}
          />
          <Input
            placeholder="Phone (optional)"
            type="tel"
            value={newGuestData.phone}
            onChange={(e) => setNewGuestData(prev => ({ ...prev, phone: e.target.value }))}
          />
          <Input
            placeholder="Party size"
            type="number"
            min="1"
            max="20"
            value={newGuestData.partySize.toString()}
            onChange={(e) => setNewGuestData(prev => ({ ...prev, partySize: parseInt(e.target.value) || 1 }))}
          />
        </div>

        <Button 
          onClick={handleCreateNew}
          disabled={!newGuestData.name.trim() || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Walk-in'
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search existing guests by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {searchLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-gray-500">Searching...</span>
        </div>
      )}

      {guests.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {guests.map((guest) => (
            <Card key={guest.id} className="cursor-pointer hover:bg-gray-50" onClick={() => onGuestSelect(guest)}>
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  <User className="h-8 w-8 text-gray-400 bg-gray-100 rounded-full p-2" />
                  <div className="flex-1">
                    <p className="font-medium">{guest.name}</p>
                    <div className="text-sm text-gray-500 space-x-2">
                      {guest.email && <span>{guest.email}</span>}
                      {guest.phone && <span>{guest.phone}</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="pt-4 border-t">
        <Button 
          variant="outline" 
          onClick={() => setShowNewGuestForm(true)}
          className="w-full flex items-center justify-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Walk-in Guest</span>
        </Button>
      </div>
    </div>
  );
}
