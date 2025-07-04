
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

export const useGroupManagement = (initialGroups: any[], tables: any[], setTables: (tables: any[]) => void) => {
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['join-groups'] });
      
      // Update tables to include this join group in their joinGroups array
      setTables(tables.map(table => 
        data.table_ids.includes(table.id) 
          ? { ...table, join_groups: [...(table.join_groups || []), data.id] }
          : table
      ));
      
      toast({ 
        title: "Group created", 
        description: "Join group has been created successfully." 
      });
    },
    onError: (error: any) => {
      console.error('Create group error:', error);
      toast({ 
        title: "Error", 
        description: "Failed to create join group.", 
        variant: "destructive" 
      });
    }
  });

  // Update join group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number, updates: Partial<JoinGroup> }) => {
      const { data, error } = await supabase
        .from('join_groups')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['join-groups'] });
      
      // Update tables to reflect new group membership
      setTables(tables.map(table => {
        const wasInGroup = table.join_groups?.includes(data.id) || false;
        const shouldBeInGroup = data.table_ids.includes(table.id);
        
        if (!wasInGroup && shouldBeInGroup) {
          return { ...table, join_groups: [...(table.join_groups || []), data.id] };
        } else if (wasInGroup && !shouldBeInGroup) {
          return { ...table, join_groups: (table.join_groups || []).filter((gId: number) => gId !== data.id) };
        }
        return table;
      }));
      
      toast({ 
        title: "Group updated", 
        description: "Join group has been updated successfully." 
      });
    },
    onError: (error: any) => {
      console.error('Update group error:', error);
      toast({ 
        title: "Error", 
        description: "Failed to update join group.", 
        variant: "destructive" 
      });
    }
  });

  // Delete join group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('join_groups')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['join-groups'] });
      
      // Remove group from all tables
      setTables(tables.map(table => ({
        ...table,
        join_groups: (table.join_groups || []).filter((gId: number) => gId !== deletedId)
      })));
      
      toast({ 
        title: "Group deleted", 
        description: "Join group has been deleted successfully." 
      });
    },
    onError: (error: any) => {
      console.error('Delete group error:', error);
      toast({ 
        title: "Error", 
        description: "Failed to delete join group.", 
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
      description: `Group of ${newGroup.memberTableIds.length} tables`
    });
    
    resetGroupForm();
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup) return;
    
    const maxCapacity = editingGroup.memberTableIds.reduce((sum: number, id: number) => {
      const table = tables.find(t => t.id === id);
      return sum + (table?.seats || 0);
    }, 0);

    await updateGroupMutation.mutateAsync({
      id: editingGroup.id,
      updates: {
        name: editingGroup.name,
        table_ids: editingGroup.memberTableIds,
        max_party_size: maxCapacity,
        description: `Group of ${editingGroup.memberTableIds.length} tables`
      }
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
