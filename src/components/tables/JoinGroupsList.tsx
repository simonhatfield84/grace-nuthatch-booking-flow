
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTables } from "@/hooks/useTables";
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

interface JoinGroupsListProps {
  joinGroups?: any[];
  tables?: any[];
  onEditGroup?: (group: any) => void;
  onDeleteGroup?: (groupId: number) => Promise<void>;
}

export const JoinGroupsList = ({ 
  joinGroups: propJoinGroups, 
  tables: propTables, 
  onEditGroup: propOnEditGroup, 
  onDeleteGroup: propOnDeleteGroup 
}: JoinGroupsListProps = {}) => {
  const { tables: hookTables, updateTable } = useTables();
  
  // Fetch join groups
  const { data: hookJoinGroups = [] } = useQuery({
    queryKey: ['join-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('join_groups')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Use props if provided, otherwise use hooks
  const joinGroups = propJoinGroups || hookJoinGroups;
  const tables = propTables || hookTables;
  
  // Initialize group management with real functionality
  const {
    editingGroup,
    setEditingGroup,
    newGroup,
    setNewGroup,
    handleAddGroup,
    handleUpdateGroup,
    handleDeleteGroup: groupManagementDelete,
    handleEditGroup,
    resetGroupForm
  } = useGroupManagement(joinGroups, tables, updateTable);

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleEdit = (group: any) => {
    if (propOnEditGroup) {
      propOnEditGroup(group);
    } else {
      handleEditGroup(group);
      setIsDialogOpen(true);
    }
  };

  const handleAdd = () => {
    resetGroupForm();
    setIsDialogOpen(true);
  };

  const handleDelete = async (groupId: number) => {
    try {
      if (propOnDeleteGroup) {
        await propOnDeleteGroup(groupId);
      } else {
        await groupManagementDelete(groupId);
      }
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  };

  const handleDialogSave = async () => {
    try {
      if (editingGroup) {
        await handleUpdateGroup();
      } else {
        await handleAddGroup();
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save group:', error);
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
        <div className="space-y-3">
          {joinGroups.map((group) => (
            <div key={group.id} className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium">{group.name}</h4>
                  <div className="flex flex-wrap gap-1">
                    {getTableLabels(group.table_ids).map((label) => (
                      <Badge key={label} variant="secondary" className="text-xs">
                        {label}
                      </Badge>
                    ))}
                  </div>
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
              
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Physical Capacity:</span>
                  <p>{getTotalCapacity(group.table_ids)} seats</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Max Party:</span>
                  <p className={group.max_party_size > getTotalCapacity(group.table_ids) ? "text-blue-600 font-medium" : ""}>
                    {group.max_party_size}
                    {group.max_party_size > getTotalCapacity(group.table_ids) && " (override)"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Min Party:</span>
                  <p>{group.min_party_size}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Tables:</span>
                  <p>{group.table_ids.length}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <GroupDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingGroup={editingGroup}
        newGroup={newGroup}
        setNewGroup={setNewGroup}
        setEditingGroup={setEditingGroup}
        onAddGroup={handleDialogSave}
        onUpdateGroup={handleDialogSave}
        tables={tables}
      />
    </div>
  );
};
