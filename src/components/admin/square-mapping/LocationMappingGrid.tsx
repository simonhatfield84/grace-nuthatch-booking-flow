import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapPin, Plus, Save, X, Trash2, Pencil } from "lucide-react";

interface LocationMapping {
  square_location_id: string;
  grace_venue_id: string | null;
}

interface Venue {
  id: string;
  name: string;
}

interface LocationMappingGridProps {
  refreshTrigger: number;
}

export function LocationMappingGrid({ refreshTrigger }: LocationMappingGridProps) {
  const [mappings, setMappings] = useState<LocationMapping[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<LocationMapping | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newMapping, setNewMapping] = useState<LocationMapping>({ square_location_id: '', grace_venue_id: null });

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = async () => {
    try {
      // Load mappings
      const { data: mappingData, error: mappingError } = await supabase
        .from('square_location_map')
        .select('*')
        .order('square_location_id');

      if (mappingError) throw mappingError;
      setMappings(mappingData || []);

      // Load venues
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .select('id, name')
        .order('name');

      if (venueError) throw venueError;
      setVenues(venueData || []);
    } catch (error) {
      console.error('Error loading location mappings:', error);
      toast.error('Failed to load location mappings');
    }
  };

  const handleStartEdit = (mapping: LocationMapping) => {
    setEditingId(mapping.square_location_id);
    setEditValues({ ...mapping });
  };

  const handleSaveEdit = async () => {
    if (!editValues) return;

    try {
      const { error } = await supabase
        .from('square_location_map')
        .upsert({
          square_location_id: editValues.square_location_id,
          grace_venue_id: editValues.grace_venue_id
        }, { onConflict: 'square_location_id' });

      if (error) throw error;

      toast.success('Location mapping updated');
      setEditingId(null);
      setEditValues(null);
      loadData();
    } catch (error) {
      console.error('Error saving mapping:', error);
      toast.error('Failed to save mapping');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues(null);
  };

  const handleDelete = async (locationId: string) => {
    if (!confirm('Delete this location mapping?')) return;

    try {
      const { error } = await supabase
        .from('square_location_map')
        .delete()
        .eq('square_location_id', locationId);

      if (error) throw error;

      toast.success('Location mapping deleted');
      loadData();
    } catch (error) {
      console.error('Error deleting mapping:', error);
      toast.error('Failed to delete mapping');
    }
  };

  const handleAddNew = async () => {
    if (!newMapping.square_location_id) {
      toast.error('Location ID is required');
      return;
    }

    try {
      const { error } = await supabase
        .from('square_location_map')
        .insert(newMapping);

      if (error) throw error;

      toast.success('Location mapping added');
      setIsAdding(false);
      setNewMapping({ square_location_id: '', grace_venue_id: null });
      loadData();
    } catch (error) {
      console.error('Error adding mapping:', error);
      toast.error('Failed to add mapping');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <CardTitle>Location Mappings</CardTitle>
          </div>
          <Button onClick={() => setIsAdding(true)} size="sm" disabled={isAdding}>
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </Button>
        </div>
        <CardDescription>
          Map Square location IDs to Grace venues
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Square Location ID</TableHead>
              <TableHead>Grace Venue</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isAdding && (
              <TableRow>
                <TableCell>
                  <Input
                    placeholder="Location ID"
                    value={newMapping.square_location_id}
                    onChange={(e) => setNewMapping({ ...newMapping, square_location_id: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={newMapping.grace_venue_id || ''}
                    onValueChange={(value) => setNewMapping({ ...newMapping, grace_venue_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select venue" />
                    </SelectTrigger>
                    <SelectContent>
                      {venues.map((venue) => (
                        <SelectItem key={venue.id} value={venue.id}>
                          {venue.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" onClick={handleAddNew}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                      setIsAdding(false);
                      setNewMapping({ square_location_id: '', grace_venue_id: null });
                    }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {mappings.map((mapping) => (
              <TableRow key={mapping.square_location_id}>
                <TableCell className="font-mono text-sm">
                  {mapping.square_location_id}
                </TableCell>
                <TableCell>
                  {editingId === mapping.square_location_id ? (
                    <Select
                      value={editValues?.grace_venue_id || ''}
                      onValueChange={(value) => setEditValues({ ...editValues!, grace_venue_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select venue" />
                      </SelectTrigger>
                      <SelectContent>
                        {venues.map((venue) => (
                          <SelectItem key={venue.id} value={venue.id}>
                            {venue.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span>
                      {mapping.grace_venue_id 
                        ? venues.find(v => v.id === mapping.grace_venue_id)?.name || 'Unknown'
                        : <span className="text-muted-foreground">Not assigned</span>
                      }
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {editingId === mapping.square_location_id ? (
                    <div className="flex justify-end gap-2">
                      <Button size="sm" onClick={handleSaveEdit}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleStartEdit(mapping)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(mapping.square_location_id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {mappings.length === 0 && !isAdding && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  No location mappings yet. Click "Fetch from Square" or add manually.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
