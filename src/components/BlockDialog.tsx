
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Ban } from "lucide-react";

interface BlockDialogProps {
  tables: any[];
  timeSlots: string[];
  blockedSlots: any[];
  setBlockedSlots: (slots: any[]) => void;
}

export const BlockDialog = ({ tables, timeSlots, blockedSlots, setBlockedSlots }: BlockDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    fromTime: "",
    toTime: "",
    selectedTables: [] as string[],
    blockAll: false
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
    
    const newBlock = {
      id: Math.max(...blockedSlots.map(b => b.id), 0) + 1,
      fromTime: formData.fromTime,
      toTime: formData.toTime,
      tableIds: formData.blockAll ? ['all'] : formData.selectedTables,
      reason: "Blocked"
    };

    setBlockedSlots([...blockedSlots, newBlock]);
    setFormData({
      fromTime: "",
      toTime: "",
      selectedTables: [],
      blockAll: false
    });
    setOpen(false);
  };

  const getValidToTimes = () => {
    if (!formData.fromTime) return [];
    const fromIndex = timeSlots.indexOf(formData.fromTime);
    return timeSlots.slice(fromIndex + 1);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="bg-red-600 text-white border-red-600 hover:bg-red-700">
          <Ban className="h-4 w-4 mr-2" strokeWidth={2} />
          Block
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-grace-dark text-grace-light border-grace-accent/30 max-w-md">
        <DialogHeader>
          <DialogTitle>Block Tables</DialogTitle>
        </DialogHeader>
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
                  onCheckedChange={handleBlockAllToggle}
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
                        onCheckedChange={(checked) => handleTableToggle(table.id.toString(), checked)}
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
              Block Tables
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
