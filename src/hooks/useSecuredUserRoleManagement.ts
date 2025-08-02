
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

export const useSecuredUserRoleManagement = () => {
  const queryClient = useQueryClient();

  const updateUserRole = useMutation({
    mutationFn: async ({ targetUserId, newRole, targetVenueId }: UpdateUserRoleParams) => {
      console.log('🔐 Attempting secured role update:', { targetUserId, newRole, targetVenueId });

      // Enhanced logging before the attempt
      await supabase.rpc('log_security_event', {
        p_event_type: 'role_update_attempt_initiated',
        p_event_details: {
          target_user_id: targetUserId,
          requested_role: newRole,
          venue_id: targetVenueId,
          initiated_at: new Date().toISOString()
        },
        p_venue_id: targetVenueId,
        p_severity: 'MEDIUM'
      });

      // Use the enhanced security function
      const { data, error } = await supabase.rpc('update_user_role', {
        target_user_id: targetUserId,
        new_role: newRole,
        target_venue_id: targetVenueId,
      });

      if (error) {
        console.error('❌ Secured role update error:', error);
        
        // Log the failure with enhanced details
        await supabase.rpc('log_security_event', {
          p_event_type: 'role_update_failed',
          p_event_details: {
            target_user_id: targetUserId,
            requested_role: newRole,
            venue_id: targetVenueId,
            error_message: error.message,
            failed_at: new Date().toISOString()
          },
          p_venue_id: targetVenueId,
          p_severity: 'HIGH'
        });
        
        throw new Error(error.message);
      }

      if (!data) {
        const errorMsg = 'Failed to update user role - no data returned';
        
        await supabase.rpc('log_security_event', {
          p_event_type: 'role_update_failed',
          p_event_details: {
            target_user_id: targetUserId,
            requested_role: newRole,
            venue_id: targetVenueId,
            error_message: errorMsg,
            failed_at: new Date().toISOString()
          },
          p_venue_id: targetVenueId,
          p_severity: 'HIGH'
        });
        
        throw new Error(errorMsg);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(`User role updated to ${variables.newRole}`, {
        description: 'Role change has been logged for security audit'
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['platform-users'] });
      queryClient.invalidateQueries({ queryKey: ['security-audit'] });
    },
    onError: (error: Error, variables) => {
      console.error('💥 Secured role update failed:', error);
      
      // Enhanced error messaging based on common security errors
      let userMessage = `Failed to update role: ${error.message}`;
      
      if (error.message.includes('Only venue owners can grant owner privileges')) {
        userMessage = 'Only venue owners can grant owner privileges to other users.';
      } else if (error.message.includes('Only owners can modify owner roles')) {
        userMessage = 'Only venue owners can modify owner-level accounts.';
      } else if (error.message.includes('Users cannot modify their own roles')) {
        userMessage = 'You cannot modify your own role for security reasons.';
      } else if (error.message.includes('Cannot remove the last owner')) {
        userMessage = 'Cannot remove the last owner from a venue. Please assign another owner first.';
      } else if (error.message.includes('Insufficient permissions')) {
        userMessage = 'You do not have permission to modify user roles.';
      }
      
      toast.error(userMessage, {
        description: 'This security violation has been logged'
      });
    },
  });

  return {
    updateUserRole: updateUserRole.mutateAsync,
    isUpdating: updateUserRole.isPending,
  };
};
