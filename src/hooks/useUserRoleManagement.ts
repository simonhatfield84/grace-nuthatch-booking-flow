
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UpdateUserRoleParams {
  targetUserId: string;
  newRole: AppRole;
  targetVenueId: string;
}

export const useUserRoleManagement = () => {
  const queryClient = useQueryClient();

  const updateUserRole = useMutation({
    mutationFn: async ({ targetUserId, newRole, targetVenueId }: UpdateUserRoleParams) => {
      console.log('🔐 Updating user role:', { targetUserId, newRole, targetVenueId });

      const { data, error } = await supabase.rpc('update_user_role', {
        target_user_id: targetUserId,
        new_role: newRole,
        target_venue_id: targetVenueId,
      });

      if (error) {
        console.error('❌ Role update error:', error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Failed to update user role');
      }

      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(`User role updated to ${variables.newRole}`);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['platform-users'] });
    },
    onError: (error: Error) => {
      console.error('💥 Role update failed:', error);
      toast.error(`Failed to update role: ${error.message}`);
    },
  });

  return {
    updateUserRole: updateUserRole.mutateAsync,
    isUpdating: updateUserRole.isPending,
  };
};
