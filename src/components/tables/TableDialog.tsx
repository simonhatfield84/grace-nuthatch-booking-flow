
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSections } from "@/hooks/useSections";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Table } from "@/hooks/useTables";

interface TableDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingTable: Table | null;
  newTable: any;
  setNewTable: (table: any) => void;
  setEditingTable: (table: Table | null) => void;
  onAddTable: () => Promise<void>;
  onUpdateTable: () => Promise<void>;
  preSelectedSectionId?: number | null;
}

export const TableDialog = ({
  isOpen,
  onOpenChange,
  editingTable,
  newTable,
  setNewTable,
  setEditingTable,
  onAddTable,
  onUpdateTable,
  preSelectedSectionId
}: TableDialogProps) => {
  const { sections } = useSections();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentFormData = editingTable || newTable;

  const preSelectedSection = preSelectedSectionId 
    ? sections.find(s => s.id === preSelectedSectionId)
    : null;

  const handleSubmit = async () => {
    if (!currentFormData.section_id) {
      toast({
        title: "Section Required",
        description: "Please select a section for this table.",
        variant: "destructive"
      });
      return;
    }

    if (!currentFormData.label.trim()) {
      toast({
        title: "Label Required",
        description: "Please enter a table label.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTable) {
        await onUpdateTable();
      } else {
        await onAddTable();
      }
      onOpenChange(false);
    } catch (error: any) {
      console.error('Table save error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save table.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingTable ? 'Edit Table' : 'Add New Table'}
            {preSelectedSection && !editingTable && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                to {preSelectedSection.name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="label">Table Label *</Label>
              <Input
                id="label"
                value={currentFormData.label}
                onChange={(e) => editingTable 
                  ? setEditingTable({...editingTable, label: e.target.value})
                  : setNewTable({...newTable, label: e.target.value})
                }
                placeholder="e.g., T7"
                required
              />
            </div>
            <div>
              <Label htmlFor="seats">Number of Seats</Label>
              <Input
                id="seats"
                type="number"
                value={currentFormData.seats}
                onChange={(e) => editingTable
                  ? setEditingTable({...editingTable, seats: parseInt(e.target.value)})
                  : setNewTable({...newTable, seats: parseInt(e.target.value)})
                }
                min="1"
                max="20"
              />
            </div>
            <div>
              <Label htmlFor="priority">Priority Rank</Label>
              <Input
                id="priority"
                type="number"
                value={currentFormData.priority_rank}
                onChange={(e) => editingTable
                  ? setEditingTable({...editingTable, priority_rank: parseInt(e.target.value)})
                  : setNewTable({...newTable, priority_rank: parseInt(e.target.value)})
                }
                min="1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="section">Section *</Label>
            <Select 
              value={currentFormData.section_id ? currentFormData.section_id.toString() : ""} 
              onValueChange={(value) => {
                const sectionId = parseInt(value);
                editingTable
                  ? setEditingTable({...editingTable, section_id: sectionId})
                  : setNewTable({...newTable, section_id: sectionId});
              }}
              required
              disabled={!!preSelectedSectionId && !editingTable}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a section (required)" />
              </SelectTrigger>
              <SelectContent>
                {sections.map(section => (
                  <SelectItem key={section.id} value={section.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: section.color }}
                      />
                      {section.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {preSelectedSection && !editingTable && (
              <p className="text-xs text-muted-foreground mt-1">
                Pre-selected: {preSelectedSection.name}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="bookable"
              checked={currentFormData.online_bookable}
              onCheckedChange={(checked) => editingTable
                ? setEditingTable({...editingTable, online_bookable: checked})
                : setNewTable({...newTable, online_bookable: checked})
              }
            />
            <Label htmlFor="bookable">Available for Online Booking</Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editingTable ? 'Update Table' : 'Add Table'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
