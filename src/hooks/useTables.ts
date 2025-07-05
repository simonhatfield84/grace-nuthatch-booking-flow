
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface Table {
  id: number;
  label: string;
  seats: number;
  online_bookable: boolean;
  priority_rank: number;
  section_id: number | null;
  position_x: number;
  position_y: number;
  join_groups: number[];
  status: 'active' | 'deleted';
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  venue_id: string;
}

export const useTables = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get user's venue ID
  const { data: userVenue } = useQuery({
    queryKey: ['user-venue', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('venue_id')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data?.venue_id;
    },
    enabled: !!user,
  });

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['tables', userVenue],
    queryFn: async () => {
      if (!userVenue) return [];
      
      const { data, error } = await (supabase as any)
        .from('tables')
        .select('*')
        .eq('status', 'active')
        .eq('venue_id', userVenue)
        .order('priority_rank');
      
      if (error) throw error;
      return (data || []) as Table[];
    },
    enabled: !!userVenue,
  });

  const createTableMutation = useMutation({
    mutationFn: async (newTable: Omit<Table, 'id' | 'created_at' | 'updated_at' | 'status' | 'deleted_at' | 'venue_id'>) => {
      if (!userVenue) throw new Error('No venue associated with user');
      
      const { data, error } = await (supabase as any)
        .from('tables')
        .insert([{ ...newTable, venue_id: userVenue }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast({ title: "Table created", description: "New table has been created successfully." });
    },
    onError: (error: any) => {
      console.error('Create table error:', error);
      toast({ title: "Error", description: "Failed to create table.", variant: "destructive" });
    }
  });

  const updateTableMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number, updates: Partial<Table> }) => {
      const { data, error } = await (supabase as any)
        .from('tables')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('venue_id', userVenue) // Ensure user can only update their venue's tables
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast({ title: "Table updated", description: "Table has been updated successfully." });
    },
    onError: (error: any) => {
      console.error('Update table error:', error);
      toast({ title: "Error", description: "Failed to update table.", variant: "destructive" });
    }
  });

  const deleteTableMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await (supabase as any)
        .from('tables')
        .delete()
        .eq('id', id)
        .eq('venue_id', userVenue); // Ensure user can only delete their venue's tables
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast({ title: "Table deleted", description: "Table has been deleted successfully." });
    },
    onError: (error: any) => {
      console.error('Delete table error:', error);
      toast({ title: "Error", description: "Failed to delete table.", variant: "destructive" });
    }
  });

  const updateTablePositions = useMutation({
    mutationFn: async (updates: Array<{ id: number; position_x: number; position_y: number }>) => {
      for (const update of updates) {
        const { error } = await (supabase as any)
          .from('tables')
          .update({ 
            position_x: update.position_x, 
            position_y: update.position_y,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id)
          .eq('venue_id', userVenue); // Ensure user can only update their venue's tables
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    }
  });

  return {
    tables,
    isLoading,
    createTable: createTableMutation.mutateAsync,
    updateTable: updateTableMutation.mutateAsync,
    deleteTable: deleteTableMutation.mutateAsync,
    updateTablePositions: updateTablePositions.mutateAsync
  };
};
