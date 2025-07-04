import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Ban, Trash2, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useBlocks } from "@/hooks/useBlocks";
import { format } from "date-fns";

interface BlockDialogProps {
  tables: any[];
  timeSlots: string[];
  selectedDate: Date;
  selectedBlock?: any;
}

export const BlockDialog = ({ tables, timeSlots, selectedDate, selectedBlock }: BlockDialogProps) => {
  const [open, setOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(selectedBlock || null);
  const [formData, setFormData] = useState({
    fromTime: selectedBlock?.start_time || "",
    toTime: selectedBlock?.end_time || "",
    selectedTables: selectedBlock?.table_ids?.filter((id: number) => id !== 0) || [],
    blockAll: selectedBlock?.table_ids?.length === 0 || false
  });

  const { blocks, createBlock, deleteBlock } = useBlocks(format(selectedDate, 'yyyy-MM-dd'));

  const handleTableToggle = (tableId: string, checked: boolean) => {
    const numericTableId = parseInt(tableId);
    if (checked) {
      setFormData({ 
        ...formData, 
        selectedTables: [...formData.selectedTables, numericTableId],
        blockAll: false
      });
    } else {
      setFormData({ 
        ...formData, 
        selectedTables: formData.selectedTables.filter(id => id !== numericTableId)
      });
    }
  };

  const handleBlockAllToggle = (checked: boolean) => {
    setFormData({
      ...formData,
      blockAll: checked,
      selectedTables: checked ? [] : formData.selectedTables
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const blockData = {
        date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: formData.fromTime,
        end_time: formData.toTime,
        table_ids: formData.blockAll ? [] : formData.selectedTables,
        reason: "Blocked"
      };

      await createBlock(blockData);
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error('Error creating block:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      fromTime: "",
      toTime: "",
      selectedTables: [],
      blockAll: false
    });
    setEditingBlock(null);
  };

  const handleDeleteBlock = async (blockId: string) => {
    try {
      await deleteBlock(blockId);
    } catch (error) {
      console.error('Error deleting block:', error);
    }
  };

  const handleEditBlock = (block: any) => {
    setEditingBlock(block);
    setFormData({
      fromTime: block.start_time,
      toTime: block.end_time,
      selectedTables: block.table_ids || [],
      blockAll: block.table_ids.length === 0
    });
  };

  const getValidToTimes = () => {
    if (!formData.fromTime) return [];
    const fromIndex = timeSlots.indexOf(formData.fromTime);
    return timeSlots.slice(fromIndex + 1);
  };

  const getTableNames = (tableIds: number[]) => {
    if (tableIds.length === 0) return 'All Tables';
    return tableIds.map(id => tables.find(t => t.id === id)?.label).filter(Boolean).join(', ');
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="bg-red-600 text-white border-red-600 hover:bg-red-700">
          <Ban className="h-4 w-4 mr-2" strokeWidth={2} />
          Block
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-grace-dark text-grace-light border-grace-accent/30 max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingBlock ? 'Edit Block' : 'Block Tables'}</DialogTitle>
        </DialogHeader>
        
        {/* Existing Blocks */}
        {blocks.length > 0 && !editingBlock && (
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">Existing Blocks</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {blocks.map((block) => (
                <div key={block.id} className="flex items-center justify-between p-2 bg-red-900/30 rounded border border-red-500/50">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{block.start_time} - {block.end_time}</div>
                    <div className="text-xs text-grace-light/70">{getTableNames(block.table_ids)}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditBlock(block)}
                      className="h-8 w-8 p-0 hover:bg-grace-accent/20"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBlock(block.id)}
                      className="h-8 w-8 p-0 hover:bg-red-500/20 text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fromTime">From Time</Label>
              <Select value={formData.fromTime} onValueChange={(value) => setFormData({ ...formData, fromTime: value, toTime: "" })}>
                <SelectTrigger className="bg-grace-dark border-grace-accent/30 text-grace-light">
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent className="bg-grace-dark border-grace-accent/30">
                  {timeSlots.map(time => (
                    <SelectItem key={time} value={time} className="text-grace-light">{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="toTime">To Time</Label>
              <Select value={formData.toTime} onValueChange={(value) => setFormData({ ...formData, toTime: value })}>
                <SelectTrigger className="bg-grace-dark border-grace-accent/30 text-grace-light">
                  <SelectValue placeholder="Select end time" />
                </SelectTrigger>
                <SelectContent className="bg-grace-dark border-grace-accent/30">
                  {getValidToTimes().map(time => (
                    <SelectItem key={time} value={time} className="text-grace-light">{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Tables to Block</Label>
            <div className="space-y-2 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="blockAll"
                  checked={formData.blockAll}
                  onCheckedChange={(checked) => handleBlockAllToggle(!!checked)}
                  className="border-grace-accent/30"
                />
                <Label htmlFor="blockAll" className="text-sm font-medium">
                  Block All Tables
                </Label>
              </div>
              
              {!formData.blockAll && (
                <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                  {tables.map(table => (
                    <div key={table.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`table-${table.id}`}
                        checked={formData.selectedTables.includes(table.id)}
                        onCheckedChange={(checked) => handleTableToggle(table.id.toString(), !!checked)}
                        className="border-grace-accent/30"
                      />
                      <Label htmlFor={`table-${table.id}`} className="text-xs">
                        {table.label}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-red-600 hover:bg-red-700"
              disabled={!formData.fromTime || !formData.toTime || (!formData.blockAll && formData.selectedTables.length === 0)}
            >
              {editingBlock ? 'Update Block' : 'Block Tables'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
