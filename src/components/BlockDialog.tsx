import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Ban, Trash2, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BlockDialogProps {
  tables: any[];
  timeSlots: string[];
  blockedSlots: any[];
  setBlockedSlots: (slots: any[]) => void;
  selectedBlock?: any;
}

export const BlockDialog = ({ tables, timeSlots, blockedSlots, setBlockedSlots, selectedBlock }: BlockDialogProps) => {
  const [open, setOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(selectedBlock || null);
  const [formData, setFormData] = useState({
    fromTime: selectedBlock?.fromTime || "",
    toTime: selectedBlock?.toTime || "",
    selectedTables: selectedBlock?.tableIds?.filter((id: string) => id !== 'all') || [],
    blockAll: selectedBlock?.tableIds?.includes('all') || false
  });

  const handleTableToggle = (tableId: string, checked: boolean) => {
    if (checked) {
      setFormData({ 
        ...formData, 
        selectedTables: [...formData.selectedTables, tableId],
        blockAll: false
      });
    } else {
      setFormData({ 
        ...formData, 
        selectedTables: formData.selectedTables.filter(id => id !== tableId)
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingBlock) {
      // Update existing block
      const updatedBlocks = blockedSlots.map(block => 
        block.id === editingBlock.id 
          ? {
              ...block,
              fromTime: formData.fromTime,
              toTime: formData.toTime,
              tableIds: formData.blockAll ? ['all'] : formData.selectedTables,
            }
          : block
      );
      setBlockedSlots(updatedBlocks);
    } else {
      // Create new block
      const newBlock = {
        id: Math.max(...blockedSlots.map(b => b.id), 0) + 1,
        fromTime: formData.fromTime,
        toTime: formData.toTime,
        tableIds: formData.blockAll ? ['all'] : formData.selectedTables,
        reason: "Blocked"
      };
      setBlockedSlots([...blockedSlots, newBlock]);
    }

    resetForm();
    setOpen(false);
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

  const handleDeleteBlock = (blockId: number) => {
    setBlockedSlots(blockedSlots.filter(block => block.id !== blockId));
  };

  const handleEditBlock = (block: any) => {
    setEditingBlock(block);
    setFormData({
      fromTime: block.fromTime,
      toTime: block.toTime,
      selectedTables: block.tableIds.filter((id: string) => id !== 'all'),
      blockAll: block.tableIds.includes('all')
    });
  };

  const getValidToTimes = () => {
    if (!formData.fromTime) return [];
    const fromIndex = timeSlots.indexOf(formData.fromTime);
    return timeSlots.slice(fromIndex + 1);
  };

  const getTableNames = (tableIds: string[]) => {
    if (tableIds.includes('all')) return 'All Tables';
    return tableIds.map(id => tables.find(t => t.id.toString() === id)?.label).join(', ');
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
        {blockedSlots.length > 0 && !editingBlock && (
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">Existing Blocks</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {blockedSlots.map((block) => (
                <div key={block.id} className="flex items-center justify-between p-2 bg-red-900/30 rounded border border-red-500/50">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{block.fromTime} - {block.toTime}</div>
                    <div className="text-xs text-grace-light/70">{getTableNames(block.tableIds)}</div>
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
                        checked={formData.selectedTables.includes(table.id.toString())}
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
