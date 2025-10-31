import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapPin, Plus } from "lucide-react";

interface SquareLocation {
  id: string;
  name: string;
  status?: string;
  country?: string;
}

interface Venue {
  id: string;
  name: string;
}

interface UnmappedLocationsPanelProps {
  fetchedLocations: SquareLocation[];
  refreshTrigger: number;
  onMappingAdded: () => void;
}

export function UnmappedLocationsPanel({ fetchedLocations, refreshTrigger, onMappingAdded }: UnmappedLocationsPanelProps) {
  const [existingMappings, setExistingMappings] = useState<string[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SquareLocation | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = async () => {
    try {
      // Load existing mappings
      const { data: mappingData, error: mappingError } = await supabase
        .from('square_location_map')
        .select('square_location_id');

      if (mappingError) throw mappingError;
      setExistingMappings(mappingData?.map(m => m.square_location_id) || []);

      // Load venues
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .select('id, name')
        .order('name');

      if (venueError) throw venueError;
      setVenues(venueData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load venues');
    }
  };

  const unmappedLocations = fetchedLocations.filter(
    loc => !existingMappings.includes(loc.id)
  );

  const handleOpenDialog = (location: SquareLocation) => {
    setSelectedLocation(location);
    setSelectedVenueId('');
    setIsDialogOpen(true);
  };

  const handleAddMapping = async () => {
    if (!selectedLocation || !selectedVenueId) {
      toast.error('Please select a venue');
      return;
    }

    try {
      const { error } = await supabase
        .from('square_location_map')
        .insert({
          square_location_id: selectedLocation.id,
          grace_venue_id: selectedVenueId
        });

      if (error) throw error;

      toast.success('Location mapped successfully');
      setIsDialogOpen(false);
      setSelectedLocation(null);
      setSelectedVenueId('');
      onMappingAdded();
    } catch (error) {
      console.error('Error adding mapping:', error);
      toast.error('Failed to add mapping');
    }
  };

  if (fetchedLocations.length === 0) {
    return null;
  }

  if (unmappedLocations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-600" />
            <CardTitle>Unmapped Locations</CardTitle>
          </div>
          <CardDescription>
            All fetched locations have been mapped to Grace venues ✓
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-amber-600" />
            <CardTitle>Unmapped Locations</CardTitle>
          </div>
          <CardDescription>
            Square locations that haven't been mapped to Grace venues yet. Click "Add Mapping" to assign each one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Square Location ID</TableHead>
                  <TableHead>Location Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unmappedLocations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-mono text-sm">{location.id}</TableCell>
                    <TableCell className="font-medium">{location.name}</TableCell>
                    <TableCell>
                      <span className="capitalize">{location.status || 'N/A'}</span>
                    </TableCell>
                    <TableCell>{location.country || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        onClick={() => handleOpenDialog(location)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Mapping
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Map Square Location to Grace Venue</DialogTitle>
            <DialogDescription>
              Select which Grace venue this Square location should be mapped to
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Square Location ID</Label>
              <div className="px-3 py-2 border rounded-md bg-muted font-mono text-sm">
                {selectedLocation?.id}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Square Location Name</Label>
              <div className="px-3 py-2 border rounded-md bg-muted">
                {selectedLocation?.name}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue-select">Grace Venue *</Label>
              <Select value={selectedVenueId} onValueChange={setSelectedVenueId}>
                <SelectTrigger id="venue-select">
                  <SelectValue placeholder="Select a venue" />
                </SelectTrigger>
                <SelectContent>
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMapping} disabled={!selectedVenueId}>
              Add Mapping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
