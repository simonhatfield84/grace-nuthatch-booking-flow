
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface JoinGroup {
  id: number;
  name: string;
  table_ids: number[];
  min_party_size: number;
  max_party_size: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const useGroupManagement = (initialGroups: any[], tables: any[], updateTableFunction: (params: { id: number, updates: any }) => Promise<any>) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch join groups from database
  const { data: joinGroups = [] } = useQuery({
    queryKey: ['join-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('join_groups')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return (data || []) as JoinGroup[];
    }
  });

  const [editingGroup, setEditingGroup] = useState(null);
  const [newGroup, setNewGroup] = useState({
    name: "",
    memberTableIds: [],
    maxCapacity: 0
  });

  // Helper function to update tables' join_groups arrays
  const updateTablesJoinGroups = async (tableIds: number[], groupId: number, operation: 'add' | 'remove') => {
    const updatePromises = tableIds.map(async (tableId) => {
      const table = tables.find(t => t.id === tableId);
      if (!table) return;

      let updatedJoinGroups = [...(table.join_groups || [])];
      
      if (operation === 'add' && !updatedJoinGroups.includes(groupId)) {
        updatedJoinGroups.push(groupId);
      } else if (operation === 'remove') {
        updatedJoinGroups = updatedJoinGroups.filter(id => id !== groupId);
      }

      return updateTableFunction({
        id: tableId,
        updates: { join_groups: updatedJoinGroups }
      });
    });

    await Promise.all(updatePromises);
  };

  // Create join group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: {
      name: string;
      table_ids: number[];
      min_party_size: number;
      max_party_size: number;
      description?: string;
    }) => {
      const { data, error } = await supabase
        .from('join_groups')
        .insert([groupData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      try {
        // Update all affected tables to include this join group
        await updateTablesJoinGroups(data.table_ids, data.id, 'add');
        
        queryClient.invalidateQueries({ queryKey: ['join-groups'] });
        queryClient.invalidateQueries({ queryKey: ['tables'] });
        
        toast({ 
          title: "Table join created", 
          description: "Table join has been created successfully." 
        });
      } catch (error) {
        console.error('Error updating tables after group creation:', error);
        toast({ 
          title: "Warning", 
          description: "Table join created but some table updates failed.", 
          variant: "destructive" 
        });
      }
    },
    onError: (error: any) => {
      console.error('Create group error:', error);
      toast({ 
        title: "Error", 
        description: "Failed to create table join.", 
        variant: "destructive" 
      });
    }
  });

  // Update join group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, updates, oldTableIds }: { id: number, updates: Partial<JoinGroup>, oldTableIds: number[] }) => {
      const { data, error } = await supabase
        .from('join_groups')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { data, oldTableIds };
    },
    onSuccess: async ({ data, oldTableIds }) => {
      try {
        // Remove group from old tables
        if (oldTableIds.length > 0) {
          await updateTablesJoinGroups(oldTableIds, data.id, 'remove');
        }
        
        // Add group to new tables
        if (data.table_ids.length > 0) {
          await updateTablesJoinGroups(data.table_ids, data.id, 'add');
        }
        
        queryClient.invalidateQueries({ queryKey: ['join-groups'] });
        queryClient.invalidateQueries({ queryKey: ['tables'] });
        
        toast({ 
          title: "Table join updated", 
          description: "Table join has been updated successfully." 
        });
      } catch (error) {
        console.error('Error updating tables after group update:', error);
        toast({ 
          title: "Warning", 
          description: "Table join updated but some table updates failed.", 
          variant: "destructive" 
        });
      }
    },
    onError: (error: any) => {
      console.error('Update group error:', error);
      toast({ 
        title: "Error", 
        description: "Failed to update table join.", 
        variant: "destructive" 
      });
    }
  });

  // Delete join group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      // First get the group to know which tables to update
      const { data: group, error: fetchError } = await supabase
        .from('join_groups')
        .select('table_ids')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('join_groups')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, tableIds: group.table_ids };
    },
    onSuccess: async ({ id, tableIds }) => {
      try {
        // Remove group from all affected tables
        if (tableIds.length > 0) {
          await updateTablesJoinGroups(tableIds, id, 'remove');
        }
        
        queryClient.invalidateQueries({ queryKey: ['join-groups'] });
        queryClient.invalidateQueries({ queryKey: ['tables'] });
        
        toast({ 
          title: "Table join deleted", 
          description: "Table join has been deleted successfully." 
        });
      } catch (error) {
        console.error('Error updating tables after group deletion:', error);
        toast({ 
          title: "Warning", 
          description: "Table join deleted but some table updates failed.", 
          variant: "destructive" 
        });
      }
    },
    onError: (error: any) => {
      console.error('Delete group error:', error);
      toast({ 
        title: "Error", 
        description: "Failed to delete table join.", 
        variant: "destructive" 
      });
    }
  });

  const handleAddGroup = async () => {
    const maxCapacity = newGroup.memberTableIds.reduce((sum: number, id: number) => {
      const table = tables.find(t => t.id === id);
      return sum + (table?.seats || 0);
    }, 0);

    await createGroupMutation.mutateAsync({
      name: newGroup.name,
      table_ids: newGroup.memberTableIds,
      min_party_size: 1,
      max_party_size: maxCapacity,
      description: `Table join of ${newGroup.memberTableIds.length} tables`
    });
    
    resetGroupForm();
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup) return;
    
    const maxCapacity = editingGroup.memberTableIds.reduce((sum: number, id: number) => {
      const table = tables.find(t => t.id === id);
      return sum + (table?.seats || 0);
    }, 0);

    // Find the original group to get old table IDs
    const originalGroup = joinGroups.find(g => g.id === editingGroup.id);
    const oldTableIds = originalGroup?.table_ids || [];

    await updateGroupMutation.mutateAsync({
      id: editingGroup.id,
      updates: {
        name: editingGroup.name,
        table_ids: editingGroup.memberTableIds,
        max_party_size: maxCapacity,
        description: `Table join of ${editingGroup.memberTableIds.length} tables`
      },
      oldTableIds
    });
    
    setEditingGroup(null);
  };

  const handleDeleteGroup = async (groupId: number) => {
    await deleteGroupMutation.mutateAsync(groupId);
  };

  const handleEditGroup = (group: any) => {
    // Convert database format to form format
    const formGroup = {
      ...group,
      memberTableIds: group.table_ids || group.memberTableIds || []
    };
    setEditingGroup(formGroup);
  };

  const resetGroupForm = () => {
    setNewGroup({
      name: "",
      memberTableIds: [],
      maxCapacity: 0
    });
    setEditingGroup(null);
  };

  return {
    joinGroups,
    setJoinGroups: () => {}, // No longer needed as we use React Query
    editingGroup,
    setEditingGroup,
    newGroup,
    setNewGroup,
    handleAddGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    handleEditGroup,
    resetGroupForm
  };
};
