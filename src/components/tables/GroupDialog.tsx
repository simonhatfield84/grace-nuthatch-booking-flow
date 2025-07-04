
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GroupDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingGroup: any;
  newGroup: any;
  setNewGroup: (group: any) => void;
  setEditingGroup: (group: any) => void;
  onAddGroup: () => void;
  onUpdateGroup: () => void;
  tables: any[];
}

export const GroupDialog = ({
  isOpen,
  onOpenChange,
  editingGroup,
  newGroup,
  setNewGroup,
  setEditingGroup,
  onAddGroup,
  onUpdateGroup,
  tables
}: GroupDialogProps) => {
  // Handle data format: use memberTableIds for form, table_ids for database
  const currentGroupData = editingGroup || newGroup;
  const memberTableIds = currentGroupData.memberTableIds || currentGroupData.table_ids || [];
  
  const suggestedCapacity = memberTableIds.reduce((sum: number, id: number) => {
    const table = tables.find(t => t.id === id);
    return sum + (table?.seats || 0);
  }, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingGroup ? 'Edit Table Join' : 'Create Table Join'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="groupName">Table Join Name</Label>
            <Input
              id="groupName"
              value={currentGroupData.name || ""}
              onChange={(e) => editingGroup
                ? setEditingGroup({...editingGroup, name: e.target.value})
                : setNewGroup({...newGroup, name: e.target.value})
              }
              placeholder="e.g., Center Tables"
            />
          </div>

          <div>
            <Label>Select Tables</Label>
            <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded p-2">
              {tables.map(table => (
                <div key={table.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`group-table-${table.id}`}
                    checked={memberTableIds.includes(table.id)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const newMemberIds = checked
                        ? [...memberTableIds, table.id]
                        : memberTableIds.filter((id: number) => id !== table.id);
                      
                      if (editingGroup) {
                        setEditingGroup({...editingGroup, memberTableIds: newMemberIds});
                      } else {
                        setNewGroup({...newGroup, memberTableIds: newMemberIds});
                      }
                    }}
                  />
                  <Label htmlFor={`group-table-${table.id}`} className="text-sm">
                    {table.label} ({table.seats} seats)
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="maxCapacity">Max Group Capacity</Label>
            <Input
              id="maxCapacity"
              type="number"
              value={currentGroupData.maxCapacity || currentGroupData.max_party_size || 0}
              onChange={(e) => editingGroup
                ? setEditingGroup({...editingGroup, maxCapacity: parseInt(e.target.value) || 0})
                : setNewGroup({...newGroup, maxCapacity: parseInt(e.target.value) || 0})
              }
              placeholder={`Suggested: ${suggestedCapacity} seats`}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Individual table capacity: {suggestedCapacity} seats
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={editingGroup ? onUpdateGroup : onAddGroup}
              disabled={!currentGroupData.name || memberTableIds.length < 2}
            >
              {editingGroup ? 'Update Table Join' : 'Create Table Join'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
