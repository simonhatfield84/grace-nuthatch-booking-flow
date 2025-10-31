import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Monitor, Plus, Save, X, Trash2, Pencil } from "lucide-react";

interface DeviceMapping {
  id: number;
  square_location_id: string;
  square_device_id: string | null;
  square_source_name: string | null;
  grace_area_id: number | null;
  grace_table_id: number | null;
}

interface Section {
  id: number;
  name: string;
}

interface GraceTable {
  id: number;
  label: string;
  section_id: number;
}

interface DeviceMappingGridProps {
  refreshTrigger: number;
}

export function DeviceMappingGrid({ refreshTrigger }: DeviceMappingGridProps) {
  const [mappings, setMappings] = useState<DeviceMapping[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [tables, setTables] = useState<GraceTable[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<DeviceMapping | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newMapping, setNewMapping] = useState<Partial<DeviceMapping>>({ 
    square_location_id: '', 
    square_device_id: null,
    square_source_name: null,
    grace_area_id: null,
    grace_table_id: null 
  });

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = async () => {
    try {
      // Load mappings
      const { data: mappingData, error: mappingError } = await supabase
        .from('square_device_map')
        .select('*')
        .order('square_location_id');

      if (mappingError) throw mappingError;
      setMappings(mappingData || []);

      // Load sections
      const { data: sectionData, error: sectionError } = await supabase
        .from('sections')
        .select('id, name')
        .order('name');

      if (sectionError) throw sectionError;
      setSections(sectionData || []);

      // Load tables
      const { data: tableData, error: tableError } = await supabase
        .from('tables')
        .select('id, label, section_id')
        .order('label');

      if (tableError) throw tableError;
      setTables(tableData || []);
    } catch (error) {
      console.error('Error loading device mappings:', error);
      toast.error('Failed to load device mappings');
    }
  };

  const validateMapping = (mapping: Partial<DeviceMapping>): boolean => {
    if (!mapping.square_device_id && !mapping.square_source_name) {
      toast.error('At least one of Device ID or Source Name is required');
      return false;
    }
    return true;
  };

  const handleStartEdit = (mapping: DeviceMapping) => {
    setEditingId(mapping.id);
    setEditValues({ ...mapping });
  };

  const handleSaveEdit = async () => {
    if (!editValues || !validateMapping(editValues)) return;

    try {
      const { error } = await supabase
        .from('square_device_map')
        .update({
          square_location_id: editValues.square_location_id,
          square_device_id: editValues.square_device_id,
          square_source_name: editValues.square_source_name,
          grace_area_id: editValues.grace_area_id,
          grace_table_id: editValues.grace_table_id
        })
        .eq('id', editValues.id);

      if (error) throw error;

      toast.success('Device mapping updated');
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

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this device mapping?')) return;

    try {
      const { error } = await supabase
        .from('square_device_map')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Device mapping deleted');
      loadData();
    } catch (error) {
      console.error('Error deleting mapping:', error);
      toast.error('Failed to delete mapping');
    }
  };

  const handleAddNew = async () => {
    if (!validateMapping(newMapping)) return;
    if (!newMapping.square_location_id) {
      toast.error('Location ID is required');
      return;
    }

    try {
      const { error } = await supabase
        .from('square_device_map')
        .insert([{
          square_location_id: newMapping.square_location_id,
          square_device_id: newMapping.square_device_id || null,
          square_source_name: newMapping.square_source_name || null,
          grace_area_id: newMapping.grace_area_id || null,
          grace_table_id: newMapping.grace_table_id || null
        }]);

      if (error) throw error;

      toast.success('Device mapping added');
      setIsAdding(false);
      setNewMapping({ 
        square_location_id: '', 
        square_device_id: null,
        square_source_name: null,
        grace_area_id: null,
        grace_table_id: null 
      });
      loadData();
    } catch (error) {
      console.error('Error adding mapping:', error);
      toast.error('Failed to add mapping');
    }
  };

  const getFilteredTables = (areaId: number | null) => {
    if (!areaId) return tables;
    return tables.filter(t => t.section_id === areaId);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            <CardTitle>Device Mappings</CardTitle>
          </div>
          <Button onClick={() => setIsAdding(true)} size="sm" disabled={isAdding}>
            <Plus className="h-4 w-4 mr-2" />
            Add Device
          </Button>
        </div>
        <CardDescription>
          Map Square devices to Grace areas and tables (at least one of Device ID or Source Name required)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location ID</TableHead>
                <TableHead>Device ID</TableHead>
                <TableHead>Source Name</TableHead>
                <TableHead>Grace Area</TableHead>
                <TableHead>Grace Table</TableHead>
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
                      className="min-w-[150px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Device ID"
                      value={newMapping.square_device_id || ''}
                      onChange={(e) => setNewMapping({ ...newMapping, square_device_id: e.target.value || null })}
                      className="min-w-[150px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Source Name"
                      value={newMapping.square_source_name || ''}
                      onChange={(e) => setNewMapping({ ...newMapping, square_source_name: e.target.value || null })}
                      className="min-w-[150px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={newMapping.grace_area_id?.toString() || ''}
                      onValueChange={(value) => setNewMapping({ ...newMapping, grace_area_id: parseInt(value), grace_table_id: null })}
                    >
                      <SelectTrigger className="min-w-[150px]">
                        <SelectValue placeholder="Select area" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map((section) => (
                          <SelectItem key={section.id} value={section.id.toString()}>
                            {section.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={newMapping.grace_table_id?.toString() || ''}
                      onValueChange={(value) => setNewMapping({ ...newMapping, grace_table_id: parseInt(value) })}
                      disabled={!newMapping.grace_area_id}
                    >
                      <SelectTrigger className="min-w-[150px]">
                        <SelectValue placeholder="Select table" />
                      </SelectTrigger>
                      <SelectContent>
                        {getFilteredTables(newMapping.grace_area_id || null).map((table) => (
                          <SelectItem key={table.id} value={table.id.toString()}>
                            {table.label}
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
                        setNewMapping({ 
                          square_location_id: '', 
                          square_device_id: null,
                          square_source_name: null,
                          grace_area_id: null,
                          grace_table_id: null 
                        });
                      }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {mappings.map((mapping) => {
                const isEditing = editingId === mapping.id;
                const values = isEditing ? editValues! : mapping;
                
                return (
                  <TableRow key={mapping.id}>
                    <TableCell className="font-mono text-sm">
                      {isEditing ? (
                        <Input
                          value={values.square_location_id}
                          onChange={(e) => setEditValues({ ...values, square_location_id: e.target.value })}
                          className="min-w-[150px]"
                        />
                      ) : (
                        mapping.square_location_id
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {isEditing ? (
                        <Input
                          value={values.square_device_id || ''}
                          onChange={(e) => setEditValues({ ...values, square_device_id: e.target.value || null })}
                          className="min-w-[150px]"
                        />
                      ) : (
                        mapping.square_device_id || <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={values.square_source_name || ''}
                          onChange={(e) => setEditValues({ ...values, square_source_name: e.target.value || null })}
                          className="min-w-[150px]"
                        />
                      ) : (
                        mapping.square_source_name || <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={values.grace_area_id?.toString() || ''}
                          onValueChange={(value) => setEditValues({ ...values, grace_area_id: parseInt(value), grace_table_id: null })}
                        >
                          <SelectTrigger className="min-w-[150px]">
                            <SelectValue placeholder="Select area" />
                          </SelectTrigger>
                          <SelectContent>
                            {sections.map((section) => (
                              <SelectItem key={section.id} value={section.id.toString()}>
                                {section.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        sections.find(s => s.id === mapping.grace_area_id)?.name || 
                        <span className="text-muted-foreground">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={values.grace_table_id?.toString() || ''}
                          onValueChange={(value) => setEditValues({ ...values, grace_table_id: parseInt(value) })}
                          disabled={!values.grace_area_id}
                        >
                          <SelectTrigger className="min-w-[150px]">
                            <SelectValue placeholder="Select table" />
                          </SelectTrigger>
                          <SelectContent>
                            {getFilteredTables(values.grace_area_id).map((table) => (
                              <SelectItem key={table.id} value={table.id.toString()}>
                                {table.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        tables.find(t => t.id === mapping.grace_table_id)?.label || 
                        <span className="text-muted-foreground">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
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
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(mapping.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {mappings.length === 0 && !isAdding && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No device mappings yet. Click "Fetch from Square" or add manually.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
