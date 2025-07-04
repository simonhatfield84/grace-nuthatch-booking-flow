
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSections } from "@/hooks/useSections";

interface TableDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingTable: any;
  newTable: any;
  setNewTable: (table: any) => void;
  setEditingTable: (table: any) => void;
  onAddTable: () => void;
  onUpdateTable: () => void;
}

export const TableDialog = ({
  isOpen,
  onOpenChange,
  editingTable,
  newTable,
  setNewTable,
  setEditingTable,
  onAddTable,
  onUpdateTable
}: TableDialogProps) => {
  const { sections } = useSections();
  const currentFormData = editingTable || newTable;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingTable ? 'Edit Table' : 'Add New Table'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="label">Table Label</Label>
              <Input
                id="label"
                value={currentFormData.label}
                onChange={(e) => editingTable 
                  ? setEditingTable({...editingTable, label: e.target.value})
                  : setNewTable({...newTable, label: e.target.value})
                }
                placeholder="e.g., T7"
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
                value={currentFormData.priorityRank}
                onChange={(e) => editingTable
                  ? setEditingTable({...editingTable, priorityRank: parseInt(e.target.value)})
                  : setNewTable({...newTable, priorityRank: parseInt(e.target.value)})
                }
                min="1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="section">Section</Label>
            <Select 
              value={currentFormData.sectionId ? currentFormData.sectionId.toString() : "none"} 
              onValueChange={(value) => {
                const sectionId = value === "none" ? null : parseInt(value);
                editingTable
                  ? setEditingTable({...editingTable, sectionId})
                  : setNewTable({...newTable, sectionId});
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Section</SelectItem>
                {sections.map(section => (
                  <SelectItem key={section.id} value={section.id.toString()}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="bookable"
              checked={currentFormData.onlineBookable}
              onCheckedChange={(checked) => editingTable
                ? setEditingTable({...editingTable, onlineBookable: checked})
                : setNewTable({...newTable, onlineBookable: checked})
              }
            />
            <Label htmlFor="bookable">Available for Online Booking</Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={editingTable ? onUpdateTable : onAddTable}>
              {editingTable ? 'Update Table' : 'Add Table'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
