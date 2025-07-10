
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SecurityEvent {
  event_type: 'login_attempt' | 'login_success' | 'login_failure' | 'password_reset' | 'data_access' | 'permission_denied';
  details: string;
  ip_address?: string;
  user_agent?: string;
}

export const useSecurityAudit = () => {
  const { user } = useAuth();

  const logSecurityEvent = useMutation({
    mutationFn: async (event: SecurityEvent) => {
      // Log to database security audit table
      const auditEntry = {
        user_id: user?.id || null,
        event_type: event.event_type,
        event_details: {
          details: event.details,
          timestamp: new Date().toISOString(),
          session_id: crypto.randomUUID(),
        },
        ip_address: event.ip_address,
        user_agent: event.user_agent || navigator.userAgent,
      };

      console.log('SECURITY_AUDIT:', JSON.stringify(auditEntry, null, 2));

      // Insert into security audit table
      const { data, error } = await supabase
        .from('security_audit')
        .insert(auditEntry)
        .select()
        .single();

      if (error) {
        console.error('Failed to log security event:', error);
        // Don't throw here to avoid breaking the main flow
        return null;
      }

      return data;
    }
  });

  return {
    logSecurityEvent: logSecurityEvent.mutateAsync,
  };
};
