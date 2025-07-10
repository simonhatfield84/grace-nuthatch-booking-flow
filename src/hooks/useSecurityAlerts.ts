
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface SecurityAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  event_type: string;
  created_at: string;
  venue_id?: string;
}

export const useSecurityAlerts = () => {
  const { toast } = useToast();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['security-alerts'],
    queryFn: async (): Promise<SecurityAlert[]> => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Get recent critical security events
      const { data: criticalEvents } = await supabase
        .from('security_audit')
        .select('*')
        .in('event_type', ['permission_denied', 'login_failure'])
        .gte('created_at', oneHourAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      // Get high threat level events
      const { data: threatEvents } = await supabase
        .from('security_audit')
        .select('*')
        .eq('event_details->threat_level', 'high')
        .gte('created_at', oneHourAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      // Get rate limit violations
      const { data: rateLimitEvents } = await supabase
        .from('security_audit')
        .select('*')
        .like('event_details->error', '%rate_limit%')
        .gte('created_at', oneHourAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      const allEvents = [...(criticalEvents || []), ...(threatEvents || []), ...(rateLimitEvents || [])];
      
      return allEvents.map(event => ({
        id: event.id,
        severity: getSeverity(event.event_type, event.event_details),
        title: getAlertTitle(event.event_type, event.event_details),
        description: getAlertDescription(event.event_type, event.event_details),
        event_type: event.event_type,
        created_at: event.created_at,
        venue_id: event.venue_id,
      }));
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Show toast notifications for new critical alerts
  useEffect(() => {
    const criticalAlerts = alerts.filter(alert => 
      alert.severity === 'critical' || alert.severity === 'high'
    );

    criticalAlerts.forEach(alert => {
      const alertAge = Date.now() - new Date(alert.created_at).getTime();
      if (alertAge < 60000) { // Less than 1 minute old
        toast({
          title: "🚨 Security Alert",
          description: alert.title,
          variant: "destructive",
        });
      }
    });
  }, [alerts, toast]);

  return {
    alerts,
    isLoading,
    criticalCount: alerts.filter(a => a.severity === 'critical').length,
    highCount: alerts.filter(a => a.severity === 'high').length,
  };
};

function getSeverity(eventType: string, eventDetails: any): SecurityAlert['severity'] {
  if (eventType === 'permission_denied') return 'critical';
  if (eventType === 'login_failure') return 'high';
  if (eventDetails?.threat_level === 'high') return 'high';
  if (eventDetails?.error?.includes('rate_limit')) return 'medium';
  return 'low';
}

function getAlertTitle(eventType: string, eventDetails: any): string {
  switch (eventType) {
    case 'permission_denied':
      return 'Unauthorized Access Attempt';
    case 'login_failure':
      return 'Failed Login Attempt';
    case 'webhook_received':
      if (eventDetails?.error) return 'Webhook Security Issue';
      return 'Webhook Received';
    case 'booking_created':
      if (eventDetails?.error?.includes('rate_limit')) return 'Rate Limit Exceeded';
      if (eventDetails?.threat_level === 'high') return 'High-Risk Booking Attempt';
      return 'Booking Created';
    default:
      return `Security Event: ${eventType.replace(/_/g, ' ')}`;
  }
}

function getAlertDescription(eventType: string, eventDetails: any): string {
  const ip = eventDetails?.client_ip || eventDetails?.ip_address || 'Unknown IP';
  const threatLevel = eventDetails?.threat_level || 'unknown';
  
  switch (eventType) {
    case 'permission_denied':
      return `Unauthorized access attempt from ${ip} (Threat Level: ${threatLevel})`;
    case 'login_failure':
      return `Failed login attempt from ${ip}`;
    case 'webhook_received':
      if (eventDetails?.error) return `Webhook error: ${eventDetails.error} from ${ip}`;
      return `Webhook processed successfully from ${ip}`;
    case 'booking_created':
      if (eventDetails?.error?.includes('rate_limit')) {
        return `Rate limit exceeded from ${ip} (Threat Level: ${threatLevel})`;
      }
      if (eventDetails?.threat_level === 'high') {
        return `High-risk booking attempt from ${ip}`;
      }
      return `Booking created successfully from ${ip}`;
    default:
      return `Security event detected from ${ip}`;
  }
}
