
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGroupManagement } from "@/hooks/useGroupManagement";
import { GroupDialog } from "./GroupDialog";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const JoinGroupsList = () => {
  const { joinGroups, tables, deleteGroup } = useGroupManagement();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);

  const handleEdit = (group: any) => {
    setEditingGroup(group);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingGroup(null);
    setDialogOpen(true);
  };

  const handleDelete = async (groupId: number) => {
    try {
      await deleteGroup(groupId);
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  };

  const getTableLabels = (tableIds: number[]) => {
    const groupTables = tables.filter(table => tableIds.includes(table.id));
    
    // Sort numerically instead of alphabetically
    const sortedTables = groupTables.sort((a, b) => {
      // Extract numbers from labels for proper sorting
      const aNum = parseInt(a.label.replace(/\D/g, '')) || 0;
      const bNum = parseInt(b.label.replace(/\D/g, '')) || 0;
      return aNum - bNum;
    });
    
    return sortedTables.map(table => table.label);
  };

  const getTotalCapacity = (tableIds: number[]) => {
    return tables
      .filter(table => tableIds.includes(table.id))
      .reduce((sum, table) => sum + table.seats, 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Table Join Groups</h3>
          <p className="text-sm text-muted-foreground">
            Create groups of tables that can be joined together for larger parties
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Group
        </Button>
      </div>

      {joinGroups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Users className="h-8 w-8 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No table join groups created yet. Add your first group to allow larger parties.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {joinGroups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{group.name}</CardTitle>
                    {group.description && (
                      <CardDescription>{group.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(group)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Join Group</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the "{group.name}" join group? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(group.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Tables:</span>
                    <div className="flex flex-wrap gap-1">
                      {getTableLabels(group.table_ids).map((label) => (
                        <Badge key={label} variant="secondary">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Capacity:</span>
                      <p className="text-muted-foreground">{getTotalCapacity(group.table_ids)} seats</p>
                    </div>
                    <div>
                      <span className="font-medium">Min Party:</span>
                      <p className="text-muted-foreground">{group.min_party_size}</p>
                    </div>
                    <div>
                      <span className="font-medium">Max Party:</span>
                      <p className="text-muted-foreground">{group.max_party_size}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <GroupDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        group={editingGroup}
      />
    </div>
  );
};
