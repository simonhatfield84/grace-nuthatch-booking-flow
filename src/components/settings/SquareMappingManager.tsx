import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Trash2, X, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SquareMappingManagerProps {
  environment: 'sandbox' | 'production';
}

export function SquareMappingManager({ environment }: SquareMappingManagerProps) {
  const [devices, setDevices] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [editingDevice, setEditingDevice] = useState<number | null>(null);
  const [editingValues, setEditingValues] = useState<{ areaId: number | null; tableId: number | null }>({
    areaId: null,
    tableId: null
  });
  
  useEffect(() => {
    loadMappings();
  }, []);
  
  const loadMappings = async () => {
    // Load devices with joined data
    const { data: devData } = await supabase
      .from('square_device_map')
      .select(`
        *,
        sections:sections(id, name),
        tables:tables(id, label)
      `);
    setDevices(devData || []);
    
    // Load sections and tables for dropdowns
    const { data: sectionsData } = await supabase.from('sections').select('id, name').order('name');
    const { data: tablesData } = await supabase.from('tables').select('id, label').order('label');
    setSections(sectionsData || []);
    setTables(tablesData || []);
  };
  
  const handleStartEdit = (device: any) => {
    setEditingDevice(device.id);
    setEditingValues({
      areaId: device.grace_area_id,
      tableId: device.grace_table_id
    });
  };
  
  const handleSaveEdit = async (deviceId: number) => {
    try {
      const { error } = await supabase
        .from('square_device_map')
        .update({
          grace_area_id: editingValues.areaId,
          grace_table_id: editingValues.tableId
        })
        .eq('id', deviceId);
      
      if (error) throw error;
      
      toast.success('Device mapping updated');
      loadMappings();
      setEditingDevice(null);
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update device mapping');
    }
  };
  
  const handleCancelEdit = () => {
    setEditingDevice(null);
    setEditingValues({ areaId: null, tableId: null });
  };
  
  const handleDeleteDevice = async (deviceId: number) => {
    if (!confirm('Remove this device mapping?')) return;
    
    try {
      const { error } = await supabase
        .from('square_device_map')
        .delete()
        .eq('id', deviceId);
      
      if (error) throw error;
      
      toast.success('Device mapping removed');
      loadMappings();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete device mapping');
    }
  };
  
  if (devices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Location & Device Mappings</CardTitle>
          <CardDescription>
            No devices found. Click "Re-sync" to fetch devices from Square.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Location & Device Mappings</CardTitle>
        <CardDescription>
          Configure which Grace sections/tables correspond to Square devices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device ID</TableHead>
                <TableHead>Source Name</TableHead>
                <TableHead>Grace Section</TableHead>
                <TableHead>Grace Table</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-mono text-sm">
                    {device.square_device_id?.substring(0, 12) || '-'}...
                  </TableCell>
                  <TableCell>{device.square_source_name || '-'}</TableCell>
                  <TableCell>
                    {editingDevice === device.id ? (
                      <Select
                        value={editingValues.areaId?.toString() || 'none'}
                        onValueChange={(val) => setEditingValues(prev => ({ 
                          ...prev, 
                          areaId: val === 'none' ? null : parseInt(val) 
                        }))}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Not assigned</SelectItem>
                          {sections.map((section) => (
                            <SelectItem key={section.id} value={section.id.toString()}>
                              {section.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-muted-foreground">
                        {device.sections?.name || 'Not assigned'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingDevice === device.id ? (
                      <Select
                        value={editingValues.tableId?.toString() || 'none'}
                        onValueChange={(val) => setEditingValues(prev => ({ 
                          ...prev, 
                          tableId: val === 'none' ? null : parseInt(val) 
                        }))}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select table" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Not assigned</SelectItem>
                          {tables.map((table) => (
                            <SelectItem key={table.id} value={table.id.toString()}>
                              {table.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-muted-foreground">
                        {device.tables?.label || 'Not assigned'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingDevice === device.id ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSaveEdit(device.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartEdit(device)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteDevice(device.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
