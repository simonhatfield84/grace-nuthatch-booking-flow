
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { useTables } from "@/hooks/useTables";
import { useBlocks } from "@/hooks/useBlocks";
import { useToast } from "@/hooks/use-toast";

interface BlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
}

export const BlockDialog = ({ open, onOpenChange, selectedDate }: BlockDialogProps) => {
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("14:00");
  const [reason, setReason] = useState("");
  const [selectedTables, setSelectedTables] = useState<number[]>([]);
  const [applyToAllTables, setApplyToAllTables] = useState(false);
  
  const { tables } = useTables();
  const { createBlock } = useBlocks();
  const { toast } = useToast();

  const handleSubmit = async () => {
    try {
      const tableIds = applyToAllTables ? [] : selectedTables;
      
      await createBlock({
        date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: startTime,
        end_time: endTime,
        table_ids: tableIds,
        reason: reason || null
      });
      
      // Reset form
      setStartTime("12:00");
      setEndTime("14:00");
      setReason("");
      setSelectedTables([]);
      setApplyToAllTables(false);
      
      onOpenChange(false);
      
      toast({
        title: "Block Created",
        description: `Time slot blocked from ${startTime} to ${endTime}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create block",
        variant: "destructive"
      });
    }
  };

  const handleTableToggle = (tableId: number) => {
    setSelectedTables(prev => 
      prev.includes(tableId) 
        ? prev.filter(id => id !== tableId)
        : [...prev, tableId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Block Time Slot</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Date: {format(selectedDate, 'EEEE, MMMM do, yyyy')}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Staff meeting, Equipment maintenance..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="all-tables"
                checked={applyToAllTables}
                onCheckedChange={(checked) => setApplyToAllTables(checked as boolean)}
              />
              <Label htmlFor="all-tables">Apply to all tables</Label>
            </div>
            
            {!applyToAllTables && (
              <div>
                <Label>Select Tables</Label>
                <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-2">
                  {tables.map((table) => (
                    <div key={table.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`table-${table.id}`}
                        checked={selectedTables.includes(table.id)}
                        onCheckedChange={() => handleTableToggle(table.id)}
                      />
                      <Label htmlFor={`table-${table.id}`} className="text-sm">
                        {table.label} ({table.seats} seats)
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSubmit} className="flex-1">
              Create Block
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
