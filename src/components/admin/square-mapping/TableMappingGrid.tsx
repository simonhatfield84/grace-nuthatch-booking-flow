import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Table as TableIcon, Plus, Save, X, Trash2, Pencil } from "lucide-react";

interface TableMapping {
  id: number;
  square_location_id: string;
  square_table_name: string;
  grace_table_id: number | null;
}

interface GraceTable {
  id: number;
  label: string;
  section_id: number;
}

interface TableMappingGridProps {
  refreshTrigger: number;
}

export function TableMappingGrid({ refreshTrigger }: TableMappingGridProps) {
  const [mappings, setMappings] = useState<TableMapping[]>([]);
  const [tables, setTables] = useState<GraceTable[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<TableMapping | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newMapping, setNewMapping] = useState<Partial<TableMapping>>({ 
    square_location_id: '', 
    square_table_name: '',
    grace_table_id: null 
  });

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = async () => {
    try {
      // Load mappings
      const { data: mappingData, error: mappingError } = await supabase
        .from('square_table_map')
        .select('*')
        .order('square_location_id, square_table_name');

      if (mappingError) throw mappingError;
      setMappings(mappingData || []);

      // Load tables
      const { data: tableData, error: tableError } = await supabase
        .from('tables')
        .select('id, label, section_id')
        .order('label');

      if (tableError) throw tableError;
      setTables(tableData || []);
    } catch (error) {
      console.error('Error loading table mappings:', error);
      toast.error('Failed to load table mappings');
    }
  };

  const handleStartEdit = (mapping: TableMapping) => {
    setEditingId(mapping.id);
    setEditValues({ ...mapping });
  };

  const handleSaveEdit = async () => {
    if (!editValues) return;

    try {
      const { error } = await supabase
        .from('square_table_map')
        .update({
          square_location_id: editValues.square_location_id,
          square_table_name: editValues.square_table_name,
          grace_table_id: editValues.grace_table_id
        })
        .eq('id', editValues.id);

      if (error) throw error;

      toast.success('Table mapping updated');
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
    if (!confirm('Delete this table mapping?')) return;

    try {
      const { error } = await supabase
        .from('square_table_map')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Table mapping deleted');
      loadData();
    } catch (error) {
      console.error('Error deleting mapping:', error);
      toast.error('Failed to delete mapping');
    }
  };

  const handleAddNew = async () => {
    if (!newMapping.square_location_id || !newMapping.square_table_name) {
      toast.error('Location ID and Table Name are required');
      return;
    }

    try {
      const { error } = await supabase
        .from('square_table_map')
        .insert([{
          square_location_id: newMapping.square_location_id,
          square_table_name: newMapping.square_table_name,
          grace_table_id: newMapping.grace_table_id || null
        }]);

      if (error) throw error;

      toast.success('Table mapping added');
      setIsAdding(false);
      setNewMapping({ 
        square_location_id: '', 
        square_table_name: '',
        grace_table_id: null 
      });
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
            <TableIcon className="h-5 w-5" />
            <CardTitle>Table Name Mappings</CardTitle>
          </div>
          <Button onClick={() => setIsAdding(true)} size="sm" disabled={isAdding}>
            <Plus className="h-4 w-4 mr-2" />
            Add Table
          </Button>
        </div>
        <CardDescription>
          Map Square table names to Grace tables (highest priority for order routing)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location ID</TableHead>
              <TableHead>Square Table Name</TableHead>
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
                  />
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="Table Name"
                    value={newMapping.square_table_name}
                    onChange={(e) => setNewMapping({ ...newMapping, square_table_name: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={newMapping.grace_table_id?.toString() || ''}
                    onValueChange={(value) => setNewMapping({ ...newMapping, grace_table_id: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select table" />
                    </SelectTrigger>
                    <SelectContent>
                      {tables.map((table) => (
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
                        square_table_name: '',
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
                      />
                    ) : (
                      mapping.square_location_id
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={values.square_table_name}
                        onChange={(e) => setEditValues({ ...values, square_table_name: e.target.value })}
                      />
                    ) : (
                      mapping.square_table_name
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Select
                        value={values.grace_table_id?.toString() || ''}
                        onValueChange={(value) => setEditValues({ ...values, grace_table_id: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select table" />
                        </SelectTrigger>
                        <SelectContent>
                          {tables.map((table) => (
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
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No table mappings yet. Add table name mappings for precise order routing.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
